// src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, TextField, Button, Alert, Select, MenuItem, FormControl, InputLabel, Typography, Link } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import { getData, saveData } from '../services/storageService';
import { useI18n } from '../i18n/i18n';
import AuthLayout from '../components/AuthLayout'; // ✅ Імпортуємо AuthLayout

export default function Register() {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operator');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor, rellena todos los campos');
      return;
    }
    // ... (решта логіки handleRegister)

    const users = await getData('users') || [];
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        setError('Usuario ya existe');
        return;
    }
    const newUser = { id: Date.now(), username, password, role };
    await saveData('users', [...users, newUser]);
    alert('Registro exitoso. Ahora puedes iniciar sesión.');
    navigate('/');
  };

  return (
    <AuthLayout title={t('register_title', { defaultValue: 'Registro' })}>
      <Box component="form" onSubmit={handleRegister} sx={{ mt: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
            label={t('labels_operator')}
            // ... (решта полів)
        />
        <TextField
            label={t('password_label', { defaultValue: 'Contraseña' })}
            type="password"
            // ...
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>{t('role_label', { defaultValue: 'Rol' })}</InputLabel>
          <Select value={role} label={t('role_label', { defaultValue: 'Rol' })} onChange={e => setRole(e.target.value)}>
            <MenuItem value="operator">Operador</MenuItem>
            <MenuItem value="admin">Administrador</MenuItem>
            <MenuItem value="technician">Técnico</MenuItem>
            <MenuItem value="supervisor">Supervisor</MenuItem>
          </Select>
        </FormControl>
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          startIcon={<PersonAddIcon />}
          sx={{ mt: 3, mb: 2 }}
        >
          {t('register_button', { defaultValue: 'Registrar' })}
        </Button>
        <Typography variant="body2">
          <Link component={RouterLink} to="/">
            {t('login_link', { defaultValue: '¿Ya tienes una cuenta? Inicia sesión' })}
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}