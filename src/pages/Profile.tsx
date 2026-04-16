import React, { useState } from 'react';
import { 
  User, Mail, Phone, MapPin, Clock, Shield, 
  Activity, CheckCircle2, AlertTriangle, 
  Settings, Key, Bell, Globe, LogOut,
  Briefcase, Calendar, ChevronRight
} from 'lucide-react';
import SettingsModal from '../components/SettingsModal';

export default function Profile() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'password' | 'notifications' | 'theme'>('profile');

  const openSettings = (tab: 'profile' | 'password' | 'notifications' | 'theme') => {
    setActiveSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  // Mock data for the logged-in operator
  const operator = {
    name: 'Jane Doe',
    id: 'OP-001',
    role: 'Senior Dispatcher',
    email: 'jane.doe@bosch.com',
    phone: '+60 12 345 1111',
    assignedRegion: 'North District',
    shift: 'Morning Shift (08:00 - 16:00)',
    status: 'Available',
    activeIncidents: 2,
    todayHandledCases: 12,
    lastLogin: new Date(Date.now() - 1000 * 60 * 120).toLocaleString(),
    
    // Work summary
    totalCasesHandled: 1458,
    avgResponseTime: '45s',
    resolvedCases: 1390,
    escalatedCases: 68,
  };

  const recentActivity = [
    { id: 1, action: 'Resolved incident INC-2026-005', time: '10 mins ago', type: 'success' },
    { id: 2, action: 'Dispatched medical unit to INC-2026-008', time: '45 mins ago', type: 'info' },
    { id: 3, action: 'Assigned to new high-severity incident INC-2026-009', time: '1 hour ago', type: 'warning' },
    { id: 4, action: 'Logged in to eCall Platform', time: '2 hours ago', type: 'neutral' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Operator Profile</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Info & Actions */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-[#005691] to-[#00A8CB] dark:from-slate-800 dark:to-slate-900 relative">
              <div className="absolute -bottom-10 left-6">
                <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-900 flex items-center justify-center text-2xl font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                  JD
                </div>
              </div>
            </div>
            <div className="pt-14 pb-6 px-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{operator.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <Shield className="w-4 h-4" /> {operator.role}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {operator.status}
                </span>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300">ID: <span className="font-medium text-slate-900 dark:text-white">{operator.id}</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-900 dark:text-white">{operator.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-900 dark:text-white">{operator.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-900 dark:text-white">{operator.assignedRegion}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-900 dark:text-white">{operator.shift}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 px-2">Account Settings</h4>
            <div className="space-y-1">
              <button 
                onClick={() => openSettings('profile')}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" /> Edit Profile
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors" />
              </button>
              <button 
                onClick={() => openSettings('password')}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" /> Change Password
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors" />
              </button>
              <button 
                onClick={() => openSettings('notifications')}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" /> Notification Preferences
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors" />
              </button>
              <button 
                onClick={() => openSettings('theme')}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" /> Language & Theme
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors" />
              </button>
              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-left group"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Active Incidents</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{operator.activeIncidents}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Handled Today</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{operator.todayHandledCases}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sm:col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Last Login</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                {operator.lastLogin}
              </p>
            </div>
          </div>

          {/* Work Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Work Summary (All Time)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#005691] dark:text-blue-400">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Cases</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{operator.totalCasesHandled}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-[#00884A] dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Resolved</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{operator.resolvedCases}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-[#E20015] dark:text-orange-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Escalated</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{operator.escalatedCases}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-[#005691] dark:text-purple-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Response</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{operator.avgResponseTime}</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Activity</h3>
            <div className="space-y-6">
              {recentActivity.map((activity, index) => (
                <div key={activity.id} className="flex gap-4 relative">
                  {index !== recentActivity.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-[-24px] w-px bg-slate-200 dark:bg-slate-800"></div>
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10
                    ${activity.type === 'success' ? 'bg-emerald-100 text-[#00884A] dark:bg-emerald-900/30 dark:text-emerald-400' : 
                      activity.type === 'warning' ? 'bg-orange-100 text-[#E20015] dark:bg-orange-900/30 dark:text-orange-400' : 
                      activity.type === 'info' ? 'bg-blue-100 text-[#005691] dark:bg-blue-900/30 dark:text-blue-400' : 
                      'bg-slate-100 text-[#00A8CB] dark:bg-slate-800 dark:text-slate-400'}`}>
                    {activity.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : 
                     activity.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : 
                     activity.type === 'info' ? <Activity className="w-4 h-4" /> : 
                     <User className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.action}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        initialTab={activeSettingsTab} 
      />
    </div>
  );
}
