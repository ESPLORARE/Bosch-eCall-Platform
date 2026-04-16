/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import IncidentDetail from './pages/IncidentDetail';
import MapMonitoring from './pages/MapMonitoring';
import VehicleRegistry from './pages/VehicleRegistry';
import IncidentHistory from './pages/IncidentHistory';
import Analytics from './pages/Analytics';
import Simulator from './pages/Simulator';
import Login from './pages/Login';
import OperatorManagement from './pages/OperatorManagement';
import Profile from './pages/Profile';
import SOPCenter from './pages/SOPCenter';
import { LanguageProvider } from './contexts/LanguageContext';

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
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="incidents/:id" element={<IncidentDetail />} />
            <Route path="map" element={<MapMonitoring />} />
            <Route path="vehicles" element={<VehicleRegistry />} />
            <Route path="operators" element={<OperatorManagement />} />
            <Route path="sop" element={<SOPCenter />} />
            <Route path="profile" element={<Profile />} />
            <Route path="history" element={<IncidentHistory />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="simulator" element={<Simulator />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </LanguageProvider>
  );
}

