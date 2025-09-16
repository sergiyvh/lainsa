import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = e => {
    e.preventDefault();
    setError('');

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const enteredUsername = username.trim().toLowerCase();
    const enteredPassword = password.trim();

    const user = users.find(u => u.username.toLowerCase() === enteredUsername && u.password === enteredPassword);

    if (!user) {
      setError('Usuario o contraseña incorrectos');
      return;
    }

    const { password: pwd, ...userSafe } = user;
    localStorage.setItem('currentUser', JSON.stringify(userSafe));
    onLogin(userSafe);
    navigate('/dashboard');
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: '1rem', border: '1px solid #ccc', borderRadius: 6 }}>
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="username">Usuario</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoFocus
            style={{ width: '100%', padding: 6, marginTop: 4, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 6, marginTop: 4, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12, textAlign: 'center' }}>{error}</div>}
        <button
          type="submit"
          style={{ width: '100%', padding: '0.5rem', backgroundColor: '#004080', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: '600', fontSize: '1rem' }}
        >
          Entrar
        </button>
      </form>
      
      {/* --- ДОДАНО --- */}
      <div style={{ marginTop: '1rem', fontSize: 12, textAlign: 'center', color: '#666' }}>
        Al continuar, aceptas nuestro <Link to="/license" style={{ color: '#004080', textDecoration: 'underline' }}>acuerdo de licencia</Link>.
      </div>
      {/* --- КІНЕЦЬ ДОДАНОГО БЛОКУ --- */}
      
      <div style={{ marginTop: 12, fontSize: 14, textAlign: 'center' }}>
        ¿No tienes cuenta? <Link to="/register" style={{ color: '#004080', textDecoration: 'underline' }}>Regístrate aquí</Link>
      </div>
    </div>
  );
}