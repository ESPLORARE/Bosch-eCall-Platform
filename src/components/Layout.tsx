import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Map, 
  Car, 
  Gauge,
  History, 
  BarChart3, 
  RadioTower,
  Bell,
  Sun,
  Moon,
  Users,
  Globe,
  Check,
  AlertCircle,
  Info,
  Server,
  FileText
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLanguage, Language } from '../contexts/LanguageContext';
import BoschLogo from './BoschLogo';
import SettingsModal from './SettingsModal';
import type { AuthUser } from '../types';

const AegisAssistant = lazy(() => import('./AegisAssistant'));

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type NotificationType = 'critical' | 'warning' | 'info' | 'system';

interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: NotificationType;
  read: boolean;
  incidentId?: string;
}

const initialNotifications: AppNotification[] = [
  {
    id: '1',
    title: 'New SOS Incident',
    description: 'Automatic eCall triggered from VEH-9921 (High Severity). AI Summary: High-severity automatic SOS event detected near Ampang. Vehicle VAA 8899, 2 occupants, nearest hospital is 3.2 km away. Immediate dispatch recommended.',
    time: 'Just now',
    type: 'critical',
    read: false,
    incidentId: 'INC-2026-001'
  },
  {
    id: '2',
    title: 'Incident Assigned',
    description: 'INC-2026-002 has been assigned to you.',
    time: '5 mins ago',
    type: 'info',
    read: false,
    incidentId: 'INC-2026-002'
  },
  {
    id: '3',
    title: 'Dispatch Update',
    description: 'Medical unit arrived at INC-2026-008 location.',
    time: '12 mins ago',
    type: 'info',
    read: true,
    incidentId: 'INC-2026-008'
  },
  {
    id: '4',
    title: 'PSAP Connection Alert',
    description: 'Latency spike detected in connection to Selangor PSAP.',
    time: '1 hour ago',
    type: 'warning',
    read: true
  },
  {
    id: '5',
    title: 'System Maintenance',
    description: 'Scheduled maintenance for mapping service at 02:00 AM.',
    time: '2 hours ago',
    type: 'system',
    read: true
  }
];

const navItems: Array<{
  to: string;
  icon: typeof LayoutDashboard;
  tKey: string;
  label?: string;
  roles?: AuthUser['role'][];
}> = [
  { to: '/', icon: LayoutDashboard, tKey: 'nav.dashboard' },
  { to: '/alerts', icon: AlertTriangle, tKey: 'nav.alerts' },
  { to: '/map', icon: Map, tKey: 'nav.map' },
  { to: '/vehicles', icon: Car, tKey: 'nav.vehicles' },
  { to: '/digital-twin', icon: Gauge, tKey: 'nav.digitalTwin' },
  { to: '/operators', icon: Users, tKey: 'nav.operators' },
  { to: '/admin', icon: Server, tKey: 'nav.admin', label: 'Admin Console', roles: ['Admin', 'Supervisor'] },
  { to: '/sop', icon: FileText, tKey: 'nav.sop', label: 'SOP Center' },
  { to: '/history', icon: History, tKey: 'nav.history' },
  { to: '/analytics', icon: BarChart3, tKey: 'nav.analytics' },
  { to: '/simulator', icon: RadioTower, tKey: 'nav.simulator' },
];

interface LayoutProps {
  user: AuthUser;
  onLogout: () => Promise<void> | void;
}

function SidebarToggleGlyph() {
  return (
    <span className="flex h-[17px] w-[17px] gap-[3px]" aria-hidden="true">
      <span className="h-full w-[6px] rounded-[3px] border border-current bg-current/10" />
      <span className="h-full flex-1 rounded-[3px] border border-current" />
    </span>
  );
}

export default function Layout({ user, onLogout }: LayoutProps) {
  const [isDark, setIsDark] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem('bosch-sidebar-collapsed') === 'true';
  });
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const { language, setLanguage, t } = useLanguage();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'password' | 'notifications' | 'theme'>('profile');
  const [shouldLoadAssistant, setShouldLoadAssistant] = useState(false);

  const openSettings = (tab: 'profile' | 'password' | 'notifications' | 'theme') => {
    setActiveSettingsTab(tab);
    setIsSettingsOpen(true);
    setShowProfileMenu(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const userInitials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    window.localStorage.setItem('bosch-sidebar-collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const loadAssistant = () => setShouldLoadAssistant(true);
    const browserWindow = window;

    if (typeof browserWindow === 'undefined') {
      return;
    }

    if ('requestIdleCallback' in browserWindow) {
      const idleId = browserWindow.requestIdleCallback(loadAssistant, { timeout: 2000 });
      return () => browserWindow.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(loadAssistant, 1200);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Bosch Supergraphic */}
      <div className="h-1 w-full flex shrink-0">
        <div className="h-full bg-[#E20015] flex-1"></div>
        <div className="h-full bg-[#005691] flex-1"></div>
        <div className="h-full bg-[#00A8CB] flex-1"></div>
        <div className="h-full bg-[#00884A] flex-1"></div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            'relative z-30 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 flex flex-col border-r border-slate-200 dark:border-slate-800 transition-[width] duration-200 ease-out',
            isSidebarCollapsed ? 'w-20' : 'w-64',
          )}
        >
          <div
            className={cn(
              'h-24 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-white flex items-center shrink-0',
              isSidebarCollapsed ? 'group/sidebar-logo justify-center px-2' : 'justify-between gap-4 px-6',
            )}
          >
            {isSidebarCollapsed ? (
              <div className="relative flex h-12 w-12 items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center transition duration-150 group-hover/sidebar-logo:scale-95 group-hover/sidebar-logo:opacity-0 group-focus-within/sidebar-logo:scale-95 group-focus-within/sidebar-logo:opacity-0">
                  <div className="h-9 w-9 overflow-hidden">
                    <BoschLogo imageClassName="h-9 w-[161px] max-w-none" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-100 text-slate-900 opacity-0 shadow-sm transition duration-150 hover:bg-slate-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#005691]/25 group-hover/sidebar-logo:opacity-100 group-focus-within/sidebar-logo:opacity-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  title="Open sidebar"
                  aria-label="Open sidebar"
                >
                  <SidebarToggleGlyph />
                </button>
                <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover/sidebar-logo:opacity-100 dark:bg-slate-800">
                  Open sidebar
                </span>
              </div>
            ) : (
              <>
                <div className="min-w-0">
                  <BoschLogo imageClassName="h-9 w-auto max-w-none" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-[#005691]/25 dark:text-slate-500 dark:hover:bg-slate-100 dark:hover:text-slate-950"
                  title="Close sidebar"
                  aria-label="Close sidebar"
                >
                  <SidebarToggleGlyph />
                </button>
              </>
            )}
          </div>
          <nav className={cn('flex-1 space-y-1 overflow-y-auto', isSidebarCollapsed ? 'px-2 py-5' : 'px-3 py-6')}>
            {navItems.filter((item) => !item.roles || item.roles.includes(user.role)).map((item) => {
              const label = item.label || t(item.tKey);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={isSidebarCollapsed ? label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center rounded-lg transition-all font-medium text-sm relative',
                      isSidebarCollapsed ? 'mx-auto h-11 w-11 justify-center' : 'mx-2 gap-3 px-3 py-2.5',
                      isActive 
                        ? 'bg-slate-100 dark:bg-slate-800 text-[#005691] dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-[#005691] dark:text-blue-400" : "text-slate-400 dark:text-slate-500")} />
                      {!isSidebarCollapsed && <span className="truncate">{label}</span>}
                      {isSidebarCollapsed && (
                        <span className="pointer-events-none absolute left-full top-1/2 z-30 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white shadow-lg group-hover:block dark:bg-slate-700">
                          {label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
          <div className={cn('border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50', isSidebarCollapsed ? 'p-3' : 'p-4')}>
            <NavLink
              to="/profile"
              title={isSidebarCollapsed ? `${user.name} - ${user.role}` : undefined}
              className={cn('flex items-center', isSidebarCollapsed ? 'justify-center' : 'gap-3 mb-4')}
            >
              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                {userInitials}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.role}</div>
              </div>
              )}
            </NavLink>
            {!isSidebarCollapsed ? (
              <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>{t('sidebar.shift')}</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{t('sidebar.morningShift')} (08:00-16:00)</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Assigned Region</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">North District</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Active Incidents</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">2</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>{t('sidebar.status')}</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {t('sidebar.available')}
                </span>
              </div>
            </div>
            ) : (
              <div className="mt-3 flex justify-center border-t border-slate-200 pt-3 dark:border-slate-800">
                <span
                  className="h-2.5 w-2.5 rounded-full bg-emerald-500"
                  title={t('sidebar.available')}
                  aria-label={t('sidebar.available')}
                />
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 z-10">
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">{t('header.title')}</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-2"
                title="Change Language"
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium uppercase">{language}</span>
              </button>
              
              {showLangMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowLangMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 overflow-hidden">
                    {(['en', 'zh', 'ms'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLanguage(lang);
                          setShowLangMenu(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm transition-colors",
                          language === lang 
                            ? "bg-slate-50 dark:bg-slate-800 text-[#005691] dark:text-blue-400 font-medium" 
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        )}
                      >
                        {t(`lang.${lang}`)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={() => setIsDark(!isDark)} 
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E20015] rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 overflow-hidden flex flex-col max-h-[32rem]">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        Notifications
                        {unreadCount > 0 && (
                          <span className="bg-red-100 text-[#E20015] dark:bg-red-500/20 dark:text-red-400 py-0.5 px-2 rounded-full text-xs font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>
                    
                    <div className="overflow-y-auto flex-1 overscroll-contain">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {notifications.map(notification => (
                            <div 
                              key={notification.id} 
                              className={cn(
                                "p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 group relative",
                                !notification.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                              )}
                            >
                              <div className="flex gap-3">
                                <div className={cn(
                                  "mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                                  notification.type === 'critical' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                                  notification.type === 'warning' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                                  notification.type === 'info' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                                  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                )}>
                                  {notification.type === 'critical' ? <AlertCircle className="w-4 h-4" /> :
                                   notification.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                                   notification.type === 'info' ? <Info className="w-4 h-4" /> :
                                   <Server className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className={cn(
                                      "text-sm font-medium truncate",
                                      !notification.read ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                                    )}>
                                      {notification.title}
                                    </p>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                                      {notification.time}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                                    {notification.description}
                                  </p>
                                  <div className="flex items-center gap-3">
                                    {notification.incidentId && (
                                      <NavLink 
                                        to={`/alerts`}
                                        onClick={() => {
                                          markAsRead(notification.id);
                                          setShowNotifications(false);
                                        }}
                                        className="text-xs font-medium text-[#005691] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                      >
                                        Open Incident
                                      </NavLink>
                                    )}
                                    {!notification.read && (
                                      <button 
                                        onClick={() => markAsRead(notification.id)}
                                        className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        Mark as read
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-[#E20015] rounded-full shrink-0 mt-1.5"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                          <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-2 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                      <button className="w-full py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-center">
                        View all notifications
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-300 hover:ring-2 hover:ring-slate-400 dark:hover:ring-slate-500 transition-all focus:outline-none"
              >
                {userInitials}
              </button>

              {showProfileMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowProfileMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 overflow-hidden py-1">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                    <NavLink
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      View Profile
                    </NavLink>
                    <button
                      onClick={() => openSettings('profile')}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      Account Settings
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-700/50 my-1"></div>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        void onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[#E20015] dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet context={{ user, onLogout }} />
          </main>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        initialTab={activeSettingsTab} 
        user={user}
      />
      
      {shouldLoadAssistant && (
        <Suspense fallback={null}>
          <AegisAssistant />
        </Suspense>
      )}
    </div>
  );
}
