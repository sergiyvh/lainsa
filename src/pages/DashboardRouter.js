// src/pages/DashboardRouter.js
// Перенаправляє користувача на /dashboard/<role>

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getSessionItem } from '../services/storageService';

export default function DashboardRouter({ user: userProp }) {
  const [user, setUser] = useState(userProp);
  const [ready, setReady] = useState(!!userProp);

  useEffect(() => {
    if (userProp) return;
    (async () => {
      try {
        const u = await getSessionItem('currentUser');
        setUser(u || null);
      } finally {
        setReady(true);
      }
    })();
  }, [userProp]);

  if (!ready) return null;

  const role = user?.role || 'operator';
  if (role === 'supervisor') return <Navigate to="/dashboard/supervisor" replace />;
  if (role === 'technician') return <Navigate to="/dashboard/technician" replace />;
  if (role === 'admin')       return <Navigate to="/dashboard/supervisor" replace />; // адміну теж корисніший супервізорський
  return <Navigate to="/dashboard/operator" replace />;
}
