/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import { LanguageProvider } from './contexts/LanguageContext';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return (
      <LanguageProvider>
        <Login onLogin={() => setIsAuthenticated(true)} />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <HashRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Layout />}>
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

