import React, { useState, useEffect } from 'react';

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operator');

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    setUsers(storedUsers);
  }, []);

  const resetForm = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRole('operator');
  };

  const saveUser = () => {
    if (!username) {
      alert('Debe ingresar un nombre de usuario');
      return;
    }

    let updatedUsers = [...users];
    if (editingUser) {
      const index = updatedUsers.findIndex(u => u.id === editingUser.id);
      if (index !== -1) {
        updatedUsers[index] = {
          ...updatedUsers[index],
          username,
          password: password ? password : updatedUsers[index].password,
          role
        };
      }
    } else {
      if (users.some(u => u.username === username)) {
        alert('El usuario ya existe');
        return;
      }
      updatedUsers.push({ id: Date.now(), username, password, role });
    }
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    resetForm();
  };

  const editUser = (user) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword('');
    setRole(user.role);
  };

  const deleteUser = (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este usuario?')) return;
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem('users', JSON.stringify(filtered));
    setUsers(filtered);
    if (editingUser && editingUser.id === id) resetForm();
  };

  return (
    <div>
      <h2>Administrar Usuarios</h2>
      <form onSubmit={e => { e.preventDefault(); saveUser(); }}>
        <div>
          <label>Nombre de usuario:</label>
          <input value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div>
          <label>Contraseña (dejar en blanco para no cambiar):</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div>
          <label>Rol:</label>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="operator">Operador</option>
            <option value="admin">Administrador</option>
            <option value="technician">Técnico</option>
          </select>
        </div>
        <button type="submit">{editingUser ? 'Actualizar' : 'Crear'}</button>
        {editingUser && <button onClick={resetForm} type="button">Cancelar</button>}
      </form>

      <table border="1" cellPadding="5" cellSpacing="0" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr><td colSpan="3">No hay usuarios</td></tr>
          ) : (
            users.map(u => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>
                  <button onClick={() => editUser(u)}>Editar</button>
                  <button onClick={() => deleteUser(u.id)} style={{ color: 'red' }}>Eliminar</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
