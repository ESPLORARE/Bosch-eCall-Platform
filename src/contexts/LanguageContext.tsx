import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'zh' | 'ms';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.alerts': 'Real-time Alerts',
    'nav.map': 'Map Monitoring',
    'nav.vehicles': 'Vehicle Registry',
    'nav.digitalTwin': 'Digital Twin',
    'nav.operators': 'Operator Management',
    'nav.sop': 'Emergency SOP Center',
    'nav.history': 'Incident History',
    'nav.analytics': 'Analytics',
    'nav.simulator': 'SOS Simulator',
    'header.title': 'BOSCH eCall Platform',
    'sidebar.operator': 'Operator',
    'sidebar.status': 'Status',
    'sidebar.online': 'Online',
    'sidebar.shift': 'Shift',
    'sidebar.morningShift': 'Morning',
    'sidebar.available': 'Available',
    'lang.en': 'English',
    'lang.zh': '中文',
    'lang.ms': 'Bahasa Melayu',
  },
  zh: {
    'nav.dashboard': '仪表盘',
    'nav.alerts': '实时警报',
    'nav.map': '地图监控',
    'nav.vehicles': '车辆登记',
    'nav.digitalTwin': '数字孪生',
    'nav.operators': '接线员管理',
    'nav.sop': '应急SOP中心',
    'nav.history': '事件历史',
    'nav.analytics': '数据分析',
    'nav.simulator': 'SOS 模拟器',
    'header.title': 'BOSCH eCall Platform',
    'sidebar.operator': '接线员',
    'sidebar.status': '状态',
    'sidebar.online': '在线',
    'sidebar.shift': '班次',
    'sidebar.morningShift': '早班',
    'sidebar.available': '空闲',
    'lang.en': 'English',
    'lang.zh': '中文',
    'lang.ms': 'Bahasa Melayu',
  },
  ms: {
    'nav.dashboard': 'Papan Pemuka',
    'nav.alerts': 'Amaran Masa Nyata',
    'nav.map': 'Pemantauan Peta',
    'nav.vehicles': 'Pendaftaran Kenderaan',
    'nav.digitalTwin': 'Digital Twin',
    'nav.operators': 'Pengurusan Operator',
    'nav.sop': 'Pusat SOP Kecemasan',
    'nav.history': 'Sejarah Insiden',
    'nav.analytics': 'Analitik',
    'nav.simulator': 'Simulator SOS',
    'header.title': 'BOSCH eCall Platform',
    'sidebar.operator': 'Operator',
    'sidebar.status': 'Status',
    'sidebar.online': 'Dalam Talian',
    'sidebar.shift': 'Syif',
    'sidebar.morningShift': 'Pagi',
    'sidebar.available': 'Tersedia',
    'lang.en': 'English',
    'lang.zh': '中文',
    'lang.ms': 'Bahasa Melayu',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
