import React, { useState } from 'react';
import { X, User, Key, Bell, Globe, Save } from 'lucide-react';
import { useLanguage, Language } from '../contexts/LanguageContext';

type Tab = 'profile' | 'password' | 'notifications' | 'theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: Tab;
}

export default function SettingsModal({ isOpen, onClose, initialTab = 'profile' }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const { language, setLanguage, t } = useLanguage();

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  
  // Mock state for forms
  const [profileData, setProfileData] = useState({
    name: 'Jane Doe',
    email: 'jane.doe@bosch.com',
    phone: '+60 12 345 1111',
    region: 'North District',
    shift: 'Morning Shift (08:00 - 16:00)'
  });

  const [notifications, setNotifications] = useState({
    incidentAlerts: true,
    assignmentUpdates: true,
    systemWarnings: false,
    emailDigest: true
  });

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock save action
    onClose();
  };

  const toggleTheme = (dark: boolean) => {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-4 md:p-6 shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Account Settings</h2>
          <nav className="space-y-1 flex md:flex-col overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal w-full text-left
                ${activeTab === 'profile' 
                  ? 'bg-blue-50 text-[#005691] dark:bg-blue-900/30 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}
            >
              <User className="w-4 h-4" /> Edit Profile
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal w-full text-left
                ${activeTab === 'password' 
                  ? 'bg-blue-50 text-[#005691] dark:bg-blue-900/30 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}
            >
              <Key className="w-4 h-4" /> Change Password
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal w-full text-left
                ${activeTab === 'notifications' 
                  ? 'bg-blue-50 text-[#005691] dark:bg-blue-900/30 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}
            >
              <Bell className="w-4 h-4" /> Notification Preferences
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal w-full text-left
                ${activeTab === 'theme' 
                  ? 'bg-blue-50 text-[#005691] dark:bg-blue-900/30 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}
            >
              <Globe className="w-4 h-4" /> Language & Theme
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <form onSubmit={handleSave} className="max-w-xl">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Edit Profile</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Update your personal information and contact details.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005691] focus:border-[#005691] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                      <input 
                        type="email" 
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005691] focus:border-[#005691] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                      <input 
                        type="tel" 
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005691] focus:border-[#005691] outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Assigned Region</label>
                        <select 
                          value={profileData.region}
                          onChange={(e) => setProfileData({...profileData, region: e.target.value})}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005691] focus:border-[#005691] outline-none"
                        >
                          <option>North District</option>
                          <option>South District</option>
                          <option>East District</option>
                          <option>West District</option>
                          <option>Central HQ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Shift</label>
                        <select 
                          value={profileData.shift}
                          onChange={(e) => setProfileData({...profileData, shift: e.target.value})}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005691] focus:border-[#005691] outline-none"
                        >
                          <option>Morning Shift (08:00 - 16:00)</option>
                          <option>Evening Shift (16:00 - 00:00)</option>
                          <option>Night Shift (00:00 - 08:00)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Change Password</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Ensure your account is using a long, random password to stay secure.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005691] focus:border-[#005691] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005691] focus:border-[#005691] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005691] focus:border-[#005691] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Notification Preferences</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Choose what updates you want to receive.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                      <div className="flex items-center h-5 mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={notifications.incidentAlerts}
                          onChange={(e) => setNotifications({...notifications, incidentAlerts: e.target.checked})}
                          className="w-4 h-4 text-[#005691] bg-slate-100 border-slate-300 rounded focus:ring-[#005691] dark:focus:ring-[#005691] dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">New Incident Alerts</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Receive immediate notifications when a new SOS is triggered in your region.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                      <div className="flex items-center h-5 mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={notifications.assignmentUpdates}
                          onChange={(e) => setNotifications({...notifications, assignmentUpdates: e.target.checked})}
                          className="w-4 h-4 text-[#005691] bg-slate-100 border-slate-300 rounded focus:ring-[#005691] dark:focus:ring-[#005691] dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Assignment Updates</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Get notified when an incident is assigned to you or escalated.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                      <div className="flex items-center h-5 mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={notifications.systemWarnings}
                          onChange={(e) => setNotifications({...notifications, systemWarnings: e.target.checked})}
                          className="w-4 h-4 text-[#005691] bg-slate-100 border-slate-300 rounded focus:ring-[#005691] dark:focus:ring-[#005691] dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">System Warnings</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Alerts about system maintenance, PSAP connection issues, or downtime.</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Theme & Language Tab */}
              {activeTab === 'theme' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Language & Theme</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Customize your platform experience.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Interface Language</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(['en', 'zh', 'ms'] as Language[]).map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setLanguage(lang)}
                            className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all
                              ${language === lang 
                                ? 'bg-blue-50 border-blue-200 text-[#005691] dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 ring-1 ring-[#005691]' 
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                          >
                            {t(`lang.${lang}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Theme Preference</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => toggleTheme(false)}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all
                            ${!isDark 
                              ? 'bg-blue-50 border-blue-200 text-[#005691] dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 ring-1 ring-[#005691]' 
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                        >
                          Light Mode
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleTheme(true)}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all
                            ${isDark 
                              ? 'bg-blue-50 border-blue-200 text-[#005691] dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 ring-1 ring-[#005691]' 
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                        >
                          Dark Mode
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#005691] hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
