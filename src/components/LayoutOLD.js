import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NAV_CONFIG = {
  admin: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Archivo', path: '/archive' },
    { label: 'Reportes', path: '/reports' },
    { label: 'Usuarios', path: '/users-admin' },
    { label: 'Cerrar sesión', path: '/', logout: true }
  ],
  operator: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Archivo', path: '/archive' },
    { label: 'Reportes', path: '/reports' },
    { label: 'Cerrar sesión', path: '/', logout: true }
  ],
  technician: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Archivo', path: '/archive' },
    { label: 'Reportes', path: '/reports' },
    { label: 'Cerrar sesión', path: '/', logout: true }
  ],
  supervisor: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Archivo', path: '/archive' },
    { label: 'Reportes', path: '/reports' },
    { label: 'Cerrar sesión', path: '/', logout: true }
  ]
};

export default function Layout({ user, onLogout, children }) {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    if (onLogout) onLogout();
    navigate('/');
  };

  // Якщо користувач не залогінений — показати лише логін-лінк у шапці
  const menuItems = user ? (NAV_CONFIG[user.role] || NAV_CONFIG.operator) : [];

  return (
    <div className="layout" style={{display:"flex", flexDirection:"column", minHeight:"100vh"}}>
      <header style={headerStyle}>
        <div style={logoContainerStyle}>
          <img
            src={process.env.PUBLIC_URL + '/logo192.png'}
            alt="Logo"
            style={logoStyle}
          />
          <span style={logoTextStyle}>LAIПSA</span>
        </div>
        <nav style={navStyle}>
          {!user && <Link to="/login" style={linkStyle}>Iniciar sesión</Link>}
          {user && menuItems.map(item =>
            item.logout ? (
              <a key={item.label} href={item.path} onClick={handleLogout} style={linkStyle}>
                {item.label}
              </a>
            ) : (
              <Link key={item.label} to={item.path} style={linkStyle}>
                {item.label}
              </Link>
            )
          )}
        </nav>
      </header>

      <main style={{ flexGrow: 1, padding: '1rem', maxWidth: 960, margin: '0 auto', width: "100%" }}>
        {children}
      </main>

      <footer style={footerStyle}>
        <div style={footerContentStyle}>
          <span>SVH Group UA</span>
          <img
            src={process.env.PUBLIC_URL + '/svh_logo.png'}
            alt="SVH Group Logo"
            style={footerLogoStyle}
          />
          <span>para LAINSA INSULAR S.L.</span>
        </div>
        <div style={footerCopyStyle}>
          © LAINSA, Desde 1970
        </div>
      </footer>
    </div>
  );
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 1rem',
  backgroundColor: '#004080',
  color: 'white',
  position: 'sticky',
  top: 0,
  zIndex: 1000,
};

const logoContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const logoStyle = {
  height: '40px',
  width: 'auto',
};

const logoTextStyle = { fontWeight: 'bold', fontSize: '1.5rem' };

const navStyle = { display: 'flex', alignItems: 'center', gap: '1rem' };

const linkStyle = { color: 'white', textDecoration: 'none', fontWeight: '500' };

const footerStyle = {
  padding: '1rem 0.5rem',
  backgroundColor: '#f0f0f0',
  borderTop: '1px solid #ccc',
  textAlign: 'center',
  marginTop: 'auto',
};

const footerContentStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  marginBottom: 6,
  fontWeight: 500,
};

const footerLogoStyle = {
  height: '24px',
  width: 'auto',
};

const footerCopyStyle = { fontSize: 12, color: '#555' };
