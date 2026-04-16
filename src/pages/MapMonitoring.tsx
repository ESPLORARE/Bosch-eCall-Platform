import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Incident, Hospital } from '../types';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { format } from 'date-fns';
import { Activity, AlertCircle, MapPin, Navigation, Filter, Eye, EyeOff, CheckCircle2, FileText, ChevronRight } from 'lucide-react';
import { mockSOPs } from '../data/mockSOPs';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Haversine formula
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

// Custom icons
const createIncidentIcon = (severity: string) => {
  const color = severity === 'high' ? '#E20015' : severity === 'medium' ? '#005691' : '#00A8CB';
  const pulseClass = severity === 'high' ? 'animate-pulse-ring' : '';
  
  return L.divIcon({
    className: 'custom-incident-marker bg-transparent border-0',
    html: `<div class="relative flex items-center justify-center w-6 h-6">
             <div class="absolute w-full h-full rounded-full ${pulseClass}" style="background-color: ${color}; opacity: 0.4;"></div>
             <div class="relative z-10 w-4 h-4 rounded-full border-2 border-white shadow-md" style="background-color: ${color};"></div>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const hospitalIcon = L.divIcon({
  className: 'custom-hospital-marker bg-transparent border-0',
  html: `<div class="flex items-center justify-center w-5 h-5 bg-white/90 rounded-full border border-red-400 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
           <div class="text-red-500 font-bold text-xs leading-none">+</div>
         </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const styles = `
  @keyframes pulse-ring {
    0% { transform: scale(0.8); opacity: 0.5; }
    50% { transform: scale(1.5); opacity: 0; }
    100% { transform: scale(0.8); opacity: 0; }
  }
  .animate-pulse-ring {
    animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

export default function MapMonitoring() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [showResolved, setShowResolved] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      const [incidentsData, hospitalsData] = await Promise.all([
        api.getIncidents(),
        api.getHospitals()
      ]);
      setIncidents(incidentsData);
      setHospitals(hospitalsData);
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filtered data
  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      if (!showResolved && ['Resolved', 'Closed'].includes(i.status)) return false;
      if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      return true;
    });
  }, [incidents, severityFilter, statusFilter, showResolved]);

  // Summaries
  const activeIncidents = incidents.filter(i => !['Resolved', 'Closed'].includes(i.status));
  const highSeverityCount = activeIncidents.filter(i => i.severity === 'high').length;
  
  // Calculate average distance to nearest hospital for active incidents
  const avgDistance = useMemo(() => {
    if (activeIncidents.length === 0 || hospitals.length === 0) return 0;
    
    let totalDist = 0;
    activeIncidents.forEach(inc => {
      let minDist = Infinity;
      hospitals.forEach(h => {
        const d = getDistance(inc.latitude, inc.longitude, h.latitude, h.longitude);
        if (d < minDist) minDist = d;
      });
      totalDist += minDist;
    });
    return totalDist / activeIncidents.length;
  }, [activeIncidents, hospitals]);

  // Find nearest hospital for a specific incident
  const getNearestHospital = (lat: number, lng: number) => {
    if (hospitals.length === 0) return null;
    let nearest = hospitals[0];
    let minDist = getDistance(lat, lng, nearest.latitude, nearest.longitude);
    
    for (let i = 1; i < hospitals.length; i++) {
      const d = getDistance(lat, lng, hospitals[i].latitude, hospitals[i].longitude);
      if (d < minDist) {
        minDist = d;
        nearest = hospitals[i];
      }
    }
    return { hospital: nearest, distance: minDist };
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <style>{styles}</style>
      
      {/* Header & Summary Cards */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Map Monitoring</h2>
        
        <div className="flex flex-wrap gap-3">
          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-[#005691] dark:text-blue-400 rounded-md">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Incidents</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{activeIncidents.length}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <div className="p-1.5 bg-red-50 dark:bg-red-900/20 text-[#E20015] dark:text-red-400 rounded-md">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">High Severity</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{highSeverityCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-[#00884A] dark:text-emerald-400 rounded-md">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nearby Hospitals</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{hospitals.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <div className="p-1.5 bg-cyan-50 dark:bg-cyan-900/20 text-[#00A8CB] dark:text-cyan-400 rounded-md">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg Distance</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{avgDistance.toFixed(1)} km</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-slate-400" />
          Filters:
        </div>
        
        <select 
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-[#005691]"
        >
          <option value="all">All Severities</option>
          <option value="high">High Severity</option>
          <option value="medium">Medium Severity</option>
          <option value="low">Low Severity</option>
        </select>

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-[#005691]"
        >
          <option value="all">All Statuses</option>
          <option value="New Alert">New Alert</option>
          <option value="Acknowledged">Acknowledged</option>
          <option value="Verifying">Verifying</option>
          <option value="Dispatching">Dispatching</option>
          <option value="Responders En Route">Responders En Route</option>
        </select>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

        <button 
          onClick={() => setShowHospitals(!showHospitals)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            showHospitals 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-[#005691] dark:text-blue-400 border-blue-200 dark:border-blue-800/50' 
              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}
        >
          {showHospitals ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          Hospitals
        </button>

        <button 
          onClick={() => setShowResolved(!showResolved)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            showResolved 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600' 
              : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-700/50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Resolved
        </button>
      </div>

      {/* Map Area */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative z-0 flex flex-col">
        
        {/* Legend Overlay */}
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 min-w-[160px]">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Map Legend</h4>
          <div className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center w-4 h-4">
                <div className="absolute w-full h-full rounded-full bg-[#E20015] opacity-40 animate-pulse-ring"></div>
                <div className="relative z-10 w-2.5 h-2.5 rounded-full bg-[#E20015] border border-white"></div>
              </div>
              High Severity
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#005691] border border-white ml-[3px]"></div>
              <span className="ml-[1px]">Medium Severity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00A8CB] border border-white ml-[3px]"></div>
              <span className="ml-[1px]">Low Severity</span>
            </div>
            <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-1"></div>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-4 h-4 bg-white rounded-full border border-red-400 shadow-sm">
                <div className="text-red-500 font-bold text-[10px] leading-none">+</div>
              </div>
              Hospital Resource
            </div>
          </div>
        </div>

        <MapContainer
          center={[3.140853, 101.693207]}
          zoom={11}
          style={{ width: '100%', height: '100%', zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          {filteredIncidents.map(incident => {
            const nearest = getNearestHospital(incident.latitude, incident.longitude);
            
            // Determine recommended SOP
            let foundSOP = null;
            if (incident.triggerType === 'automatic' && incident.passengerCondition?.toLowerCase().includes('unconscious')) {
              foundSOP = mockSOPs.find(s => s.id === 'SOP-001');
            } else if (incident.notes?.toLowerCase().includes('trapped')) {
              foundSOP = mockSOPs.find(s => s.id === 'SOP-002');
            } else if (incident.notes?.toLowerCase().includes('fire') || incident.notes?.toLowerCase().includes('smoke')) {
              foundSOP = mockSOPs.find(s => s.id === 'SOP-003');
            } else if (incident.triggerType === 'manual' && incident.notes?.toLowerCase().includes('medical')) {
              foundSOP = mockSOPs.find(s => s.id === 'SOP-004');
            } else if (incident.passengerCondition?.toLowerCase().includes('child') || incident.passengerCondition?.toLowerCase().includes('elderly')) {
              foundSOP = mockSOPs.find(s => s.id === 'SOP-006');
            } else if (incident.triggerType === 'automatic') {
              foundSOP = mockSOPs.find(s => s.id === 'SOP-005');
            }
            
            return (
              <Marker 
                key={incident.incidentId} 
                position={[incident.latitude, incident.longitude]}
                icon={createIncidentIcon(incident.severity)}
              >
                <Popup className="custom-popup" minWidth={280}>
                  <div className="p-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{incident.incidentId}</h3>
                        <p className="text-xs text-slate-500">{format(new Date(incident.timestamp), 'MMM d, yyyy HH:mm')}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                        ${incident.severity === 'high' ? 'bg-red-50 text-[#E20015] border-red-200' : 
                          incident.severity === 'medium' ? 'bg-blue-50 text-[#005691] border-blue-200' : 
                          'bg-cyan-50 text-[#00A8CB] border-cyan-200'}`}>
                        {incident.severity}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Status</p>
                        <p className="font-medium text-slate-800">{incident.status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Trigger</p>
                        <p className="font-medium text-slate-800 capitalize">{incident.triggerType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Vehicle</p>
                        <p className="font-medium text-slate-800">{incident.plateNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Operator</p>
                        <p className="font-medium text-slate-800">{incident.assignedOperator || 'Unassigned'}</p>
                      </div>
                    </div>

                    {nearest && (
                      <div className="bg-slate-50 p-2 rounded-md mb-2 border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                          <Navigation className="w-3 h-3" /> Nearest Hospital
                        </p>
                        <p className="text-sm font-medium text-slate-800">{nearest.hospital.name}</p>
                        <p className="text-xs text-slate-600">{nearest.distance.toFixed(1)} km away (~{Math.round(nearest.distance * 1.5)} mins)</p>
                      </div>
                    )}

                    {foundSOP && (
                      <div className="bg-blue-50 p-2 rounded-md mb-4 border border-blue-100">
                        <p className="text-xs text-[#005691] mb-1 flex items-center gap-1 font-semibold uppercase tracking-wider">
                          <FileText className="w-3 h-3" /> Recommended SOP
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-800 truncate pr-2">{foundSOP.title}</p>
                          <Link to="/sop" className="text-xs font-bold text-[#005691] hover:underline flex items-center shrink-0">
                            View <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      <Link 
                        to={`/incidents/${incident.incidentId}`}
                        className="flex-1 text-center bg-[#005691] hover:bg-blue-800 text-white text-sm font-medium py-1.5 px-3 rounded transition-colors"
                      >
                        View Details
                      </Link>
                      <button className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-1.5 px-3 rounded transition-colors border border-slate-200">
                        Dispatch
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {showHospitals && hospitals.map(hospital => (
            <Marker 
              key={hospital.id} 
              position={[hospital.latitude, hospital.longitude]}
              icon={hospitalIcon}
            >
              <Popup minWidth={220}>
                <div className="p-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm shrink-0">
                      +
                    </div>
                    <h3 className="font-bold text-slate-900 leading-tight">{hospital.name}</h3>
                  </div>
                  
                  <div className="space-y-2 mt-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Contact</p>
                      <p className="font-medium text-slate-800">{hospital.phone || 'Not available'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Location</p>
                      <p className="font-medium text-slate-800">{hospital.latitude.toFixed(4)}, {hospital.longitude.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
