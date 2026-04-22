/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import { LanguageProvider } from './contexts/LanguageContext';
import { api } from './services/api';
import type { AuthUser } from './types';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Alerts = lazy(() => import('./pages/Alerts'));
const IncidentDetail = lazy(() => import('./pages/IncidentDetail'));
const MapMonitoring = lazy(() => import('./pages/MapMonitoring'));
const VehicleRegistry = lazy(() => import('./pages/VehicleRegistry'));
const DigitalTwin = lazy(() => import('./pages/DigitalTwin'));
const IncidentHistory = lazy(() => import('./pages/IncidentHistory'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Simulator = lazy(() => import('./pages/Simulator'));
const OperatorManagement = lazy(() => import('./pages/OperatorManagement'));
const Profile = lazy(() => import('./pages/Profile'));
const SOPCenter = lazy(() => import('./pages/SOPCenter'));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Loading page...
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    api
      .getCurrentUser()
      .then((session) => setCurrentUser(session.user))
      .catch(() => setCurrentUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
  };

  if (authLoading) {
    return (
      <LanguageProvider>
        <RouteFallback />
      </LanguageProvider>
    );
  }

  if (!currentUser) {
    return (
      <LanguageProvider>
        <Login
          onLogin={() => {
            api.getCurrentUser().then((session) => setCurrentUser(session.user));
          }}
        />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <HashRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Layout user={currentUser} onLogout={handleLogout} />}>
              <Route index element={<Dashboard />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="incidents/:id" element={<IncidentDetail />} />
              <Route path="map" element={<MapMonitoring />} />
              <Route path="vehicles" element={<VehicleRegistry />} />
              <Route path="digital-twin" element={<DigitalTwin />} />
              <Route path="operators" element={<OperatorManagement />} />
              <Route path="sop" element={<SOPCenter />} />
              <Route path="profile" element={<Profile />} />
              <Route path="history" element={<IncidentHistory />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="simulator" element={<Simulator />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </LanguageProvider>
  );
}

