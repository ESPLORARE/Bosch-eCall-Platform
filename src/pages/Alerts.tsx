import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Incident } from '../types';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, MapPin, Car, User, Sparkles, FileText, ChevronRight } from 'lucide-react';
import { mockSOPs } from '../data/mockSOPs';

export default function Alerts() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await api.getIncidents();
      // Filter out resolved/closed for active alerts view
      setIncidents(data.filter(i => !['Resolved', 'Closed'].includes(i.status)));
    };
    fetchData();
    const interval = setInterval(fetchData, 3000); // Poll more frequently for alerts
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Real-time Alerts</h2>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          Live Monitoring Active
        </div>
      </div>

      <div className="grid gap-4">
        {incidents.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Active Alerts</h3>
            <p className="text-slate-500 dark:text-slate-400">All clear. There are currently no active SOS incidents.</p>
          </div>
        ) : (
          incidents.map(incident => {
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
              <Link 
                key={incident.incidentId} 
                to={`/incidents/${incident.incidentId}`}
                className={`block bg-white dark:bg-slate-900 rounded-xl shadow-sm border-l-4 p-6 hover:shadow-md dark:hover:bg-slate-800/50 transition-all border-y border-r border-y-slate-200 border-r-slate-200 dark:border-y-slate-800 dark:border-r-slate-800
                  ${incident.severity === 'high' ? 'border-l-[#E20015]' : 
                    incident.severity === 'medium' ? 'border-l-[#005691]' : 
                    'border-l-[#00A8CB]'}`}
              >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{incident.incidentId}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                      ${incident.severity === 'high' ? 'bg-red-50 text-[#E20015] border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50' : 
                        incident.severity === 'medium' ? 'bg-blue-50 text-[#005691] border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50' : 
                        'bg-cyan-50 text-[#00A8CB] border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800/50'}`}>
                      {incident.severity} Severity
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                      {incident.status}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDistanceToNow(new Date(incident.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {incident.aiSummary && (
                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/30 rounded-lg p-3 flex gap-3 items-start">
                      <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
                        <span className="font-semibold mr-1">AI Summary:</span>
                        {incident.aiSummary}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="truncate">{incident.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span>{incident.vehicleBrand} {incident.vehicleModel} ({incident.plateNumber})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span>{incident.passengerCount} Passenger(s) - {incident.triggerType} trigger</span>
                    </div>
                  </div>

                  {foundSOP && (
                    <div className="mt-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#005691] dark:text-blue-400 shrink-0" />
                        <span className="text-xs font-bold text-[#005691] dark:text-blue-400 uppercase tracking-wider">Recommended SOP:</span>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{foundSOP.title}</span>
                      </div>
                      <div className="flex items-center text-xs font-bold text-[#005691] dark:text-blue-400 hover:underline">
                        View SOP <ChevronRight className="w-3 h-3 ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="shrink-0 flex items-center justify-end mt-2 md:mt-0">
                  <button className="px-4 py-2 bg-[#005691] dark:bg-blue-800 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors">
                    Review Incident
                  </button>
                </div>
              </div>
            </Link>
          );
        })
        )}
      </div>
    </div>
  );
}
