// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './i18n/i18n';
import { NotificationProvider } from './context/NotificationContext'; // ✅ Імпортуємо наш провайдер

import initializeUsers from './utils/initUsers';
import { getSessionItem, removeSessionItem, getData } from './services/storageService';

import DashboardRouter from './pages/DashboardRouter';
import DashboardOperator from './pages/DashboardOperator';
import DashboardSupervisor from './pages/DashboardSupervisor';
import DashboardTechnician from './pages/DashboardTechnician';

import MachineStatusPage from './pages/MachineStatusPage';
import MachineDetailsPage from './pages/MachineDetailsPage';

import FormNew from './pages/FormNew';
import Archive from './pages/Archive';
import Reports from './pages/Reports';
import ViewRecord from './pages/ViewRecord';
import OpenShift from './pages/OpenShift';

import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import LicensePage from './pages/LicensePage';

import AnalyticsPage from './pages/AnalyticsPage';
import UsersAdmin from './pages/UsersAdmin';

// ⬇️ НОВІ СТОРІНКИ
import StaffDirectory from './pages/StaffDirectory';
import StaffRosterPage from './pages/StaffRosterPage'; // ✅ Імпортуємо нову сторінку
import StaffRoster from './pages/StaffRoster';
import IroningAssignments from './pages/IroningAssignments';
import About from './pages/About';
import EquipmentAdminPage from './pages/EquipmentAdminPage';
import MaintenanceLogPage from './pages/MaintenanceLogPage';
import MaintenanceCalendarPage from './pages/MaintenanceCalendarPage'; // ✅ Імпортуємо нову сторінку
import TechnicianReportPage from './pages/TechnicianReportPage'; // ✅ Імпорт
import TechnicianFormPage from './pages/TechnicianFormPage'; // ✅ Імпорт

// НОВИЙ АРХІВ ТА ІНЦИДЕНТИ
import IncidentsList from './pages/Incidents/IncidentsList';
import IncidentsPage from './features/incidents/IncidentPage';
import OperatorReports from './pages/Archive/OperatorReports';
import TechnicianReports from './pages/Archive/TechnicianReports';
import Misc from './pages/Archive/Misc';

import Layout from './components/Layout';
import { Box, Typography } from '@mui/material';

function PrivateRoute({ children, user, roles }) {
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

// Гейт для Settings: admin або технік з prefs.techCanOpenSettings === true
function SettingsRoute({ user }) {
  const [ready, setReady] = useState(false);
  const [allow, setAllow] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) { setReady(true); setAllow(false); return; }
      if (user.role === 'admin') { setReady(true); setAllow(true); return; }
      if (user.role === 'technician') {
        try {
          const prefs = await getData('app_prefs');
          const ok = !!prefs?.techCanOpenSettings;
          if (alive) { setAllow(ok); setReady(true); }
          return;
        } catch {}
      }
      if (alive) { setAllow(false); setReady(true); }
    })();
    return () => { alive = false; };
  }, [user]);

  if (!user) return <Navigate to="/" replace />;
  if (!ready) return null;
  if (!allow) return <Navigate to="/dashboard" replace />;
  return <Settings />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);

  useEffect(() => {
    initializeUsers();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const sessionUser = await getSessionItem('currentUser');
        if (sessionUser) setUser(sessionUser);
      } finally {
        setLoadingApp(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await removeSessionItem('currentUser');
    setUser(null);
  };

  if (loadingApp) {
    return (
      <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', backgroundColor:'#f0f2f5' }}>
        <Typography variant="h5">Cargando aplicación...</Typography>
      </Box>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <NotificationProvider> {/* ✅ Обгортаємо всю програму */}
      <Routes>
        {/* Публічні */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/license" element={<LicensePage />} />

        {/* Settings через гейт */}
        <Route path="/settings" element={<SettingsRoute user={user} />} />

        {/* Дашборди */}
        <Route path="/dashboard" element={<PrivateRoute user={user}><DashboardRouter user={user} /></PrivateRoute>} />
        <Route path="/dashboard/operator" element={<PrivateRoute user={user}><DashboardOperator user={user} /></PrivateRoute>} />
        <Route path="/dashboard/supervisor" element={<PrivateRoute user={user}><DashboardSupervisor user={user} /></PrivateRoute>} />
        <Route path="/dashboard/technician" element={<PrivateRoute user={user}><DashboardTechnician user={user} /></PrivateRoute>} />

        {/* Інші сторінки */}
        <Route path="/machines" element={<PrivateRoute user={user}><MachineStatusPage /></PrivateRoute>} />
        <Route path="/machine-details/:machineId" element={<PrivateRoute user={user}><MachineDetailsPage /></PrivateRoute>} />
        <Route path="/form" element={<PrivateRoute user={user}><FormNew /></PrivateRoute>} />
        <Route path="/archive" element={<PrivateRoute user={user}><Archive /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute user={user}><Reports /></PrivateRoute>} />
        <Route path="/view/:id" element={<PrivateRoute user={user}><ViewRecord /></PrivateRoute>} />
        <Route path="/open-shift" element={<PrivateRoute user={user}><OpenShift /></PrivateRoute>} />
        <Route path="/equipment" element={<PrivateRoute user={user} roles={['admin','technician']}><EquipmentAdminPage /></PrivateRoute>} />
        <Route path="/maintenance" element={<PrivateRoute user={user} roles={['admin','technician']}><MaintenanceLogPage user={user} /></PrivateRoute>} />
        <Route path="/maintenance-calendar" element={<PrivateRoute user={user} roles={['admin','technician','supervisor']}><MaintenanceCalendarPage /></PrivateRoute>} />
        <Route path="/about" element={<About />} />
        <Route path="/staff-roster" element={<PrivateRoute user={user} roles={['admin','supervisor']}><StaffRosterPage /></PrivateRoute>} />
        <Route path="/technician-report" element={<PrivateRoute user={user} roles={['admin','technician','supervisor']}><TechnicianReportPage user={user} /></PrivateRoute>} />
        <Route path="/technician-form" element={<PrivateRoute user={user} roles={['admin','technician','supervisor']}><TechnicianFormPage user={user} /></PrivateRoute>} />

        {/* Аналітика + Користувачі */}
        <Route path="/analytics" element={<PrivateRoute user={user}><AnalyticsPage /></PrivateRoute>} />
        <Route path="/users-admin" element={<PrivateRoute user={user} roles={['admin']}><UsersAdmin /></PrivateRoute>} />

        {/* ⬇️ НОВІ РОБОЧІ СТОРІНКИ ПЕРСОНАЛУ */}
        <Route path="/staff" element={<PrivateRoute user={user} roles={['admin','supervisor']}><StaffDirectory /></PrivateRoute>} />
        <Route path="/staff-roster" element={<PrivateRoute user={user} roles={['admin','supervisor']}><StaffRoster /></PrivateRoute>} />
        <Route path="/iron-assignments" element={<PrivateRoute user={user} roles={['admin','technician','supervisor']}><IroningAssignments /></PrivateRoute>} />

        <Route path="/archive/operator" element={<OperatorReports />} />
<Route path="/archive/technician" element={<TechnicianReports />} />
<Route path="/archive/incidents" element={<IncidentsList />} />
<Route path="/archive/misc" element={<Misc />} />

        
        {/* створення інциденту окремим шляхом (кнопка "Додати інцидент") */}
        <Route path="/incidents" element={<IncidentsPage />} />
      </Routes>
    </NotificationProvider>
    </Layout>
  );
}
