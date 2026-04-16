import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Incident, AnalyticsData, Weather, Operator } from '../types';
import { Link } from 'react-router-dom';
import { Activity, CheckCircle, Clock, AlertTriangle, ChevronRight, CloudLightning, Droplets, Wind, Server, Wifi, Eye, CheckCircle2, Send, Users, History, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [operators, setOperators] = useState<Operator[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [incidentsData, analyticsData, weatherData, operatorsData] = await Promise.all([
        api.getIncidents(),
        api.getAnalytics(),
        api.getWeather(),
        api.getOperators()
      ]);
      setIncidents(incidentsData.slice(0, 5)); // Only show top 5 recent
      setAnalytics(analyticsData);
      setWeather(weatherData);
      setOperators(operatorsData);
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!analytics) return <div className="p-8 text-slate-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h2>
        
        {/* Operational Context Widget */}
        {weather && (
          <div className="flex items-center gap-6 bg-white dark:bg-slate-900 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-[#005691] dark:text-blue-400">
                <CloudLightning className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Region: {weather.location}</p>
                <div className="flex items-center gap-2 text-sm text-slate-900 dark:text-white font-semibold mt-0.5">
                  <span>{weather.temperature}°C</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span>{weather.condition}</span>
                </div>
              </div>
            </div>
            
            <div className="w-px h-10 bg-slate-200 dark:bg-slate-800"></div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-[#00884A] dark:text-emerald-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">System Status</p>
                <div className="flex items-center gap-2 text-sm text-slate-900 dark:text-white font-semibold mt-0.5">
                  <span className="flex items-center gap-1"><Wifi className="w-3.5 h-3.5 text-[#00884A]" /> 99.9%</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-[#00884A] dark:text-emerald-400">PSAP Connected</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#005691]"></div>
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#005691] dark:text-blue-400 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Incidents</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.summary.total}</p>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">+1 since last hour</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#E20015]"></div>
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#E20015] dark:text-red-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Incidents</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.summary.active}</p>
              <p className="text-xs font-medium text-[#E20015] dark:text-red-400">2 unresolved</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#00884A]"></div>
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#00884A] dark:text-emerald-400 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Resolved</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.summary.resolved}</p>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">12% faster than yesterday</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#00A8CB]"></div>
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#00A8CB] dark:text-amber-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg Response</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.summary.avgResponseTime}s</p>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Target: &lt; 60s</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent SOS Alerts</h3>
            <Link to="/alerts" className="text-sm font-medium text-[#005691] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase text-xs">Incident ID</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs">Time</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs">Vehicle</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs">Trigger</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs">Severity</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs">Status</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs">Operator</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {incidents.map(incident => (
                  <tr key={incident.incidentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      <Link to={`/incidents/${incident.incidentId}`} className="hover:underline">
                        {incident.incidentId}
                      </Link>
                      {incident.aiSummary && (
                        <div className="mt-1 flex items-start gap-1.5 max-w-xs">
                           <Sparkles className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                           <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={incident.aiSummary}>{incident.aiSummary}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{formatDistanceToNow(new Date(incident.timestamp), { addSuffix: true })}</td>
                    <td className="px-6 py-4">{incident.plateNumber}</td>
                    <td className="px-6 py-4 capitalize">{incident.triggerType}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                        ${incident.severity === 'high' ? 'bg-red-50 text-[#E20015] border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50' : 
                          incident.severity === 'medium' ? 'bg-blue-50 text-[#005691] border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50' : 
                          'bg-cyan-50 text-[#00A8CB] border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800/50'}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {incident.assignedOperator || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/incidents/${incident.incidentId}`} className="p-1.5 text-slate-400 hover:text-[#005691] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {incident.status === 'New Alert' && (
                          <button className="p-1.5 text-slate-400 hover:text-[#00884A] dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md transition-colors" title="Acknowledge">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {(incident.status === 'Acknowledged' || incident.status === 'Verifying') && (
                          <button className="p-1.5 text-slate-400 hover:text-[#00A8CB] dark:hover:text-amber-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-md transition-colors" title="Dispatch">
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {incidents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No recent incidents.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mini Analytics */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Severity Distribution</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-400">High</span>
                  <span className="font-medium text-slate-900 dark:text-white">{analytics.severityDistribution.high}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-[#E20015] h-1.5 rounded-full" style={{ width: `${(analytics.severityDistribution.high / Math.max(1, analytics.summary.total)) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Medium</span>
                  <span className="font-medium text-slate-900 dark:text-white">{analytics.severityDistribution.medium}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-[#005691] h-1.5 rounded-full" style={{ width: `${(analytics.severityDistribution.medium / Math.max(1, analytics.summary.total)) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Low</span>
                  <span className="font-medium text-slate-900 dark:text-white">{analytics.severityDistribution.low}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-[#00A8CB] h-1.5 rounded-full" style={{ width: `${(analytics.severityDistribution.low / Math.max(1, analytics.summary.total)) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Trigger Source</h3>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800/60">
              <div className="text-center">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Automatic</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.triggerDistribution.automatic}</p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Manual</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.triggerDistribution.manual}</p>
              </div>
            </div>
          </div>

          {/* Operator Availability */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Operator Availability</h3>
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00884A]"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Available</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-white">{operators.filter(o => o.status === 'Available').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#E20015]"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Busy</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-white">{operators.filter(o => o.status === 'Handling Call' || o.status === 'Dispatching').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Offline</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-white">{operators.filter(o => o.status === 'Offline' || o.status === 'On Break').length}</span>
              </div>
            </div>
          </div>

          {/* Latest Activity Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Latest Activity</h3>
              <History className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-4">
              {incidents
                .flatMap(inc => inc.actionLogs.map(log => ({ ...log, incidentId: inc.incidentId })))
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 4)
                .map((log, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00A8CB]"></div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-white">{log.action}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
                        <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-xs font-medium text-[#005691] dark:text-blue-400">{log.incidentId}</span>
                      </div>
                    </div>
                  </div>
                ))}
              {incidents.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
