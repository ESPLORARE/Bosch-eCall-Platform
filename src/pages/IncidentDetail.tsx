import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../services/api';
import { AppOutletContext, Incident, Hospital, SOP } from '../types';
import { format } from 'date-fns';
import { ArrowLeft, Clock, MapPin, Car, User, FileText, Activity, Send, AlertCircle, History, Stethoscope, Sparkles, ChevronRight } from 'lucide-react';
import { mockSOPs } from '../data/mockSOPs';
import { getAllowedIncidentStatuses, INCIDENT_STATUSES } from '../utils/permissions';

const IncidentMap = lazy(() => import('../components/IncidentMap'));
const Incident3DView = lazy(() =>
  import('../components/Incident3DView').then((module) => ({
    default: module.Incident3DView,
  })),
);

// Haversine formula to calculate distance between two lat/lon points in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

function HeavyPanelFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[18rem] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
      Loading {label}...
    </div>
  );
}

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useOutletContext<AppOutletContext>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [nearestHospital, setNearestHospital] = useState<{hospital: Hospital, distance: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [recommendedSOP, setRecommendedSOP] = useState<SOP | null>(null);

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (incidentId: string) => {
    try {
      const [incidentData, hospitalsData] = await Promise.all([
        api.getIncident(incidentId),
        api.getHospitals()
      ]);
      setIncident(incidentData);
      
      // Calculate nearest hospital
      if (hospitalsData && hospitalsData.length > 0) {
        let nearest = hospitalsData[0];
        let minDistance = getDistance(incidentData.latitude, incidentData.longitude, nearest.latitude, nearest.longitude);
        
        for (let i = 1; i < hospitalsData.length; i++) {
          const dist = getDistance(incidentData.latitude, incidentData.longitude, hospitalsData[i].latitude, hospitalsData[i].longitude);
          if (dist < minDistance) {
            minDistance = dist;
            nearest = hospitalsData[i];
          }
        }
        setNearestHospital({ hospital: nearest, distance: minDistance });
      }

      // Determine recommended SOP
      let foundSOP = null;
      
      // Use telemetry data if available
      if (incidentData.telemetry) {
        if (incidentData.telemetry.passengerCondition === 'unconscious') {
          foundSOP = mockSOPs.find(s => s.id === 'SOP-001'); // Unconscious Passenger
        } else if (incidentData.telemetry.possibleEntrapment) {
          foundSOP = mockSOPs.find(s => s.id === 'SOP-002'); // Vehicle Entrapment
        } else if (incidentData.telemetry.impactLevel === 'high') {
          foundSOP = mockSOPs.find(s => s.id === 'SOP-005'); // Severe Collision
        }
      }
      
      // Fallback to text-based logic if no SOP found yet
      if (!foundSOP) {
        if (incidentData.triggerType === 'automatic' && incidentData.passengerCondition?.toLowerCase().includes('unconscious')) {
          foundSOP = mockSOPs.find(s => s.id === 'SOP-001');
        } else if (incidentData.notes?.toLowerCase().includes('trapped')) {
          foundSOP = mockSOPs.find(s => s.id === 'SOP-002');
        } else if (incidentData.notes?.toLowerCase().includes('fire') || incidentData.notes?.toLowerCase().includes('smoke')) {
          foundSOP = mockSOPs.find(s => s.id === 'SOP-003');
        } else if (incidentData.triggerType === 'manual' && incidentData.notes?.toLowerCase().includes('medical')) {
          foundSOP = mockSOPs.find(s => s.id === 'SOP-004');
        } else if (incidentData.passengerCondition?.toLowerCase().includes('child') || incidentData.passengerCondition?.toLowerCase().includes('elderly')) {
          foundSOP = mockSOPs.find(s => s.id === 'SOP-006');
        } else if (incidentData.triggerType === 'automatic') {
          foundSOP = mockSOPs.find(s => s.id === 'SOP-005'); // Default automatic escalation
        }
      }
      
      setRecommendedSOP(foundSOP || null);
      
    } catch (error) {
      console.error('Failed to fetch incident', error);
      navigate('/alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Incident['status']) => {
    if (!incident) return;
    if (incident.status !== newStatus && ['Resolved', 'Closed'].includes(newStatus) && !note.trim()) {
      setUpdateError(`Please add a closure note before marking this incident as ${newStatus}.`);
      return;
    }

    setUpdating(true);
    setUpdateError('');
    try {
      const updated = await api.updateIncidentStatus(incident.incidentId, newStatus, user.name, note);
      setIncident(updated);
      setNote('');
    } catch (error) {
      console.error('Failed to update status', error);
      setUpdateError(error instanceof Error ? error.message : 'Failed to update incident status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500 dark:text-slate-400">Loading incident details...</div>;
  if (!incident) return <div className="p-8 text-red-500 dark:text-red-400">Incident not found.</div>;

  const allowedNextStatuses = getAllowedIncidentStatuses(user, incident.status);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Incident {incident.incidentId}</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize
          ${incident.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
            incident.severity === 'medium' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
          {incident.severity} Severity
        </span>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
          {incident.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Decision Support Panel */}
          {(incident.aiSummary || incident.aiSeverity || incident.aiRecommendations) && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-800/50 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-32 h-32 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    AI Decision Support
                  </h3>
                  {incident.aiSeverity && (
                    <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800/50 backdrop-blur-sm">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estimated Severity</span>
                      <span className={`text-sm font-bold uppercase tracking-wider
                        ${incident.aiSeverity === 'Critical' ? 'text-red-600 dark:text-red-400' : 
                          incident.aiSeverity === 'High' ? 'text-orange-600 dark:text-orange-400' : 
                          incident.aiSeverity === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' : 
                          'text-emerald-600 dark:text-emerald-400'}`}>
                        {incident.aiSeverity}
                      </span>
                    </div>
                  )}
                </div>

                {incident.aiSummary && (
                  <div className="mb-5 bg-white/60 dark:bg-slate-900/40 p-4 rounded-lg border border-indigo-50 dark:border-indigo-900/30 backdrop-blur-sm">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {incident.aiSummary}
                    </p>
                  </div>
                )}

                {incident.aiRecommendations && incident.aiRecommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-3">Recommended Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {incident.aiRecommendations.map((rec, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-lg border border-indigo-100 dark:border-indigo-700/50 shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                          {rec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3D Incident Assessment View */}
          {incident.telemetry && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <Car className="w-5 h-5 text-[#005691] dark:text-blue-400" />
                3D Incident Assessment View
              </h3>
              <Suspense fallback={<HeavyPanelFallback label="3D assessment" />}>
                <Incident3DView telemetry={incident.telemetry} passengerCount={incident.passengerCount} />
              </Suspense>
            </div>
          )}

          {/* Recommended SOP Card */}
          {recommendedSOP && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#005691] dark:text-blue-400" />
                  Recommended SOP
                </h3>
                <span className="px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wide bg-[#E20015] text-white">
                  {recommendedSOP.priorityLevel} Priority
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">{recommendedSOP.title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{recommendedSOP.description}</p>
                <button 
                  onClick={() => navigate('/sop')}
                  className="text-sm font-medium text-[#005691] dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  Open in SOP Center <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* AI Report Generator (Resolved only) */}
          {incident.status === 'Resolved' && incident.aiReport && (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-800/30 p-6 relative overflow-hidden">
              <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                AI Incident Report
              </h3>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-white/60 dark:bg-slate-900/40 p-4 rounded-lg border border-emerald-100/50 dark:border-emerald-800/20">
                {incident.aiReport}
              </p>
            </div>
          )}

          {/* AI Suggestion Card (Nearest Hospital) */}
          {nearestHospital && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800/50 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-24 h-24 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2 relative z-10">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                AI Recommendation: Nearest Hospital
              </h3>
              <div className="relative z-10 flex items-start gap-4 mt-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-lg">{nearestHospital.hospital.name}</p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                    Distance: <span className="font-semibold text-blue-700 dark:text-blue-400">{nearestHospital.distance.toFixed(2)} km</span> away from the incident location.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                    Emergency Contact: <span className="font-semibold dark:text-slate-300">{nearestHospital.hospital.phone || 'Not available'}</span>
                  </p>
                  <button className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors">
                    Dispatch Ambulance from this Hospital
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Map View */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 h-[400px] relative z-0">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              Location Map
            </h3>
            <div className="w-full h-[300px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <Suspense fallback={<HeavyPanelFallback label="map" />}>
                <IncidentMap
                  address={incident.address}
                  latitude={incident.latitude}
                  longitude={incident.longitude}
                  severity={incident.severity}
                  nearestHospital={nearestHospital}
                />
              </Suspense>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              Event Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Time of Incident
                  </p>
                  <p className="mt-1 text-slate-900 dark:text-white font-medium">
                    {format(new Date(incident.timestamp), 'PPpp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Location
                  </p>
                  <p className="mt-1 text-slate-900 dark:text-white font-medium">{incident.address}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Trigger Type
                  </p>
                  <p className="mt-1 text-slate-900 dark:text-white font-medium capitalize">{incident.triggerType}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Car className="w-4 h-4" /> Vehicle Information
                  </p>
                  <p className="mt-1 text-slate-900 dark:text-white font-medium">{incident.vehicleBrand} {incident.vehicleModel}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Plate: {incident.plateNumber} | ID: {incident.vehicleId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <User className="w-4 h-4" /> Passenger Information
                  </p>
                  <p className="mt-1 text-slate-900 dark:text-white font-medium">{incident.passengerCount} Passenger(s)</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Condition: {incident.passengerCondition}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Initial Notes
                  </p>
                  <p className="mt-1 text-slate-900 dark:text-white text-sm">{incident.notes}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Workflow */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Incident Workflow</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Signed in as {user.role}. Available next actions are based on role and current status.
                </p>
              </div>
              {allowedNextStatuses.length > 0 && (
                <span className="text-xs font-semibold uppercase tracking-wide text-[#005691] dark:text-blue-400">
                  Next: {allowedNextStatuses.join(' / ')}
                </span>
              )}
            </div>
            {updateError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {updateError}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-6">
              {INCIDENT_STATUSES.map((status) => {
                const isCurrent = incident.status === status;
                const isAllowed = allowedNextStatuses.includes(status);

                return (
                  <button
                    key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updating || isCurrent || !isAllowed}
                    title={
                      !isCurrent && !isAllowed
                        ? `Your role cannot move this incident to ${status} from ${incident.status}`
                        : ['Resolved', 'Closed'].includes(status)
                          ? 'Closure note required'
                          : undefined
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isCurrent
                        ? 'bg-slate-800 text-white dark:bg-slate-700 cursor-default'
                        : isAllowed
                          ? 'bg-blue-50 text-[#005691] hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800/70 dark:text-slate-500 cursor-not-allowed'}`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Add Operator Note (Optional)</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter remarks..."
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  onClick={() => handleStatusUpdate(incident.status)}
                  disabled={!note.trim() || updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4" /> Add Note
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-[600px]">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2 shrink-0">
            <History className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            Action Timeline
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
            {incident.actionLogs.map((log, index) => (
              <div key={index} className="relative pl-8">
                <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                </p>
                <p className="text-sm text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  {log.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
