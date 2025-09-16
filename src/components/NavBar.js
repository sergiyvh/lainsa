import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NAV_CONFIG = {
  admin: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Archivo', path: '/archive' },
    { label: 'Reportes', path: '/reports' },
    { label: 'Usuarios', path: '/users-admin' },
    { label: 'Cerrar sesión', path: '/logout', logout: true }
  ],
  operator: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Archivo', path: '/archive' },
    { label: 'Reportes', path: '/reports' },
    { label: 'Cerrar sesión', path: '/logout', logout: true }
  ],
  technician: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Archivo', path: '/archive' },
    { label: 'Reportes', path: '/reports' },
    { label: 'Cerrar sesión', path: '/logout', logout: true }
  ],
  supervisor: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Archivo', path: '/archive' },
    { label: 'Reportes', path: '/reports' },
    { label: 'Cerrar sesión', path: '/logout', logout: true }
  ]
};

export default function NavBar({ user, onLogout }) {
  const navigate = useNavigate();
  if (!user) return null;

  const menuItems = NAV_CONFIG[user.role] || NAV_CONFIG.operator;

  const handleLogout = (evt) => {
    evt.preventDefault();
    if (onLogout) onLogout();
    navigate('/');
  };

  return (
    <nav style={{ background: '#004080', padding: 12, display: 'flex', gap: 18, alignItems: 'center' }}>
      {menuItems.map(item =>
        item.logout ? (
          <a
            key={item.label}
            href="/logout"
            onClick={handleLogout}
            style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}
          >
            {item.label}
          </a>
        ) : (
          <Link
            key={item.label}
            to={item.path}
            style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}
          >
            {item.label}
          </Link>
        )
      )}
      <span style={{ marginLeft: 'auto', color: '#FFD700', fontWeight: 'bold', fontStyle: 'italic' }}>
        {user.username} ({user.role})
      </span>
    </nav>
  );
}
