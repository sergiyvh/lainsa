import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operator');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = e => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Por favor, rellena todos los campos');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(u => u.username === username)) {
      setError('Usuario ya existe');
      return;
    }
    const newUser = {
      id: Date.now(),
      username,
      password,
      role
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    alert('Registro exitoso. Ahora puedes iniciar sesión.');
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: '1rem', border: '1px solid #ccc', borderRadius: 6 }}>
      <h2>Registro nuevo usuario</h2>
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Usuario</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: 6, marginTop: 4 }}
            autoFocus
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 6, marginTop: 4 }}
            minLength={6}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Rol</label>
          <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4 }}>
            <option value="operator">Operador</option>
            <option value="admin">Administrador</option>
            <option value="technician">Técnico</option>
          </select>
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <button type="submit" style={{ width: '100%', padding: '0.5rem', backgroundColor: '#004080', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Registrar
        </button>
      </form>
    </div>
  );
}
