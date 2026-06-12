import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Watchlist } from './pages/Watchlist';
import { ClinicalInsights } from './pages/ClinicalInsights';
import { PatientDetail } from './pages/PatientDetail';
import { AddPatient } from './pages/AddPatient';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';

import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <ThemeProvider>
      {!isAuthenticated ? (
        <Login onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <Router>
          <Layout onLogout={() => setIsAuthenticated(false)}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/insights" element={<ClinicalInsights />} />
              <Route path="/patient/:id" element={<PatientDetail />} />
              <Route path="/admit" element={<AddPatient />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      )}
    </ThemeProvider>
  );
}

