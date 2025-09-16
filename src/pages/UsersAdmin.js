import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Select, MenuItem, Button, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, CircularProgress, Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import BackupIcon from '@mui/icons-material/Backup';
import RestoreIcon from '@mui/icons-material/Restore';

import { getData, saveData } from '../services/storageService';
import { useI18n } from '../i18n/i18n';
// ✅ Крок 1: Імпортуємо наш хук для сповіщень
import { useNotification } from '../context/NotificationContext';

export default function UsersAdmin() {
  const { t } = useI18n();
  // ✅ Крок 2: Ініціалізуємо хук
  const { showNotification } = useNotification();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operator');

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const storedUsers = await getData('users') || [];
        setUsers(storedUsers);
      } catch (error) {
        console.error("Failed to load users:", error);
        showNotification('Error al cargar la lista de usuarios', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []); // Hотатка: залежність showNotification тут не потрібна

  const resetForm = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRole('operator');
  };

  const saveUser = async () => {
    if (!username) {
      showNotification('Debe ingresar un nombre de usuario', 'warning');
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
        showNotification('El usuario ya existe', 'error');
        return;
      }
      updatedUsers.push({ id: Date.now(), username, password, role });
    }
    
    try {
        await saveData('users', updatedUsers);
        setUsers(updatedUsers);
        resetForm();
        showNotification('Usuario guardado correctamente', 'success');
    } catch (error) {
        console.error("Failed to save user:", error);
        showNotification('Error al guardar los datos del usuario', 'error');
    }
  };

  const editUser = (user) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword('');
    setRole(user.role);
  };

  const deleteUser = async (id) => {
    if (!window.confirm(t('confirm_delete_user', {defaultValue: '¿Seguro que quieres eliminar este usuario?'}))) return;
    try {
        const filtered = users.filter(u => u.id !== id);
        await saveData('users', filtered);
        setUsers(filtered);
        showNotification('Usuario eliminado correctamente', 'success');
        if (editingUser && editingUser.id === id) resetForm();
    } catch (error) {
        console.error("Failed to delete user:", error);
        showNotification('Error al eliminar el usuario', 'error');
    }
  };

  const handleBackup = async () => {
    if (!window.electronAPI) {
        showNotification("Esta función solo está disponible en la versión de escritorio.", 'info');
        return;
    }
    const result = await window.electronAPI.backupData();
    if (result.success) {
        showNotification(`Copia de seguridad creada: ${result.path}`, 'success');
    } else if (result.reason !== 'canceled') {
        showNotification(`Error al crear la copia: ${result.error}`, 'error');
    }
  };

  const handleRestore = async () => {
    if (!window.confirm(t('confirm_restore', {defaultValue: "¡ATENCIÓN! Esto sobrescribirá TODOS los datos actuales. ¿Desea continuar?"}))) return;
    if (!window.electronAPI) {
        showNotification("Esta función solo está disponible en la versión de escritorio.", 'info');
        return;
    }
    const result = await window.electronAPI.restoreData();
    if (result.success) {
        showNotification('Datos restaurados. Por favor, reinicie la aplicación.', 'success');
    } else if (result.reason !== 'canceled') {
        showNotification(`Error al restaurar los datos: ${result.error}`, 'error');
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Administrar Usuarios y Sistema</Typography>
      
      <Paper elevation={3} sx={{ padding: 2, marginBottom: 4, borderRadius: '12px' }}>
        <Typography variant="h6" gutterBottom>Copia de Seguridad y Restauración</Typography>
        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
            Cree una copia de seguridad de todos los datos de la aplicación en un solo archivo.
            Restaure desde un archivo para recuperar datos.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" startIcon={<BackupIcon />} onClick={handleBackup}>Crear Copia de Seguridad</Button>
            <Button variant="outlined" color="warning" startIcon={<RestoreIcon />} onClick={handleRestore}>Restaurar Datos</Button>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ padding: 2, marginBottom: 4, borderRadius: '12px' }}>
        <Typography variant="h6" gutterBottom>
          {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        </Typography>
        <Box component="form" onSubmit={e => { e.preventDefault(); saveUser(); }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Nombre de usuario" variant="outlined" size="small" value={username} onChange={e => setUsername(e.target.value)} required />
          <TextField label="Contraseña (dejar en blanco para no cambiar)" type="password" variant="outlined" size="small" value={password} onChange={e => setPassword(e.target.value)} />
          <FormControl size="small" fullWidth>
            <InputLabel>Rol</InputLabel>
            <Select value={role} label="Rol" onChange={e => setRole(e.target.value)}>
              <MenuItem value="operator">Operador</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="technician">Técnico</MenuItem>
              <MenuItem value="supervisor">Supervisor</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button type="submit" variant="contained" startIcon={editingUser ? <SaveIcon /> : <AddIcon />}>
              {editingUser ? 'Actualizar' : 'Crear'}
            </Button>
            {editingUser && <Button onClick={resetForm} variant="outlined">Cancelar</Button>}
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '12px' }}>
        <Table aria-label="users table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Rol</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => editUser(u)} color="primary"><EditIcon /></IconButton>
                  <IconButton onClick={() => deleteUser(u.id)} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}