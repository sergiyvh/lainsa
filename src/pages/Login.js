// src/pages/Login.js
import React, { useState } from 'react'; // ✅ ВИПРАВЛЕНО: 'useState' взято у фігурні дужки
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, TextField, Button, Alert, Typography, Link } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';

import { getData, saveSessionItem } from '../services/storageService';
import { useI18n } from '../i18n/i18n';
import AuthLayout from '../components/AuthLayout';

export default function Login({ onLogin }) {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const users = await getData('users') || [];
    const foundUser = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (foundUser) {
      await saveSessionItem('currentUser', foundUser);
      onLogin(foundUser);
      navigate('/dashboard');
    } else {
      setError(t('login_error', { defaultValue: 'Usuario o contraseña incorrectos' }));
    }
  };

  return (
    <AuthLayout title={t('login')}>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          label={t('labels_operator')}
          variant="outlined"
          margin="normal"
          fullWidth
          required
          autoFocus
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <TextField
          label={t('password_label', { defaultValue: 'Contraseña' })}
          type="password"
          variant="outlined"
          margin="normal"
          fullWidth
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          startIcon={<LoginIcon />}
          sx={{ mt: 3, mb: 2 }}
        >
          {t('login')}
        </Button>
        <Typography variant="body2" align="center">
          <Link component={RouterLink} to="/register">
            {t('register_link', { defaultValue: 'Registrar nuevo usuario' })}
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}