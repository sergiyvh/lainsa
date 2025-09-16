// src/pages/OpenShift.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Select, MenuItem, FormControl, InputLabel,
  FormGroup, FormControlLabel, Checkbox, Button, Alert
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

// ✅ Імпорт сервісу зберігання
import { getData, saveSessionItem } from '../services/storageService';

export default function OpenShift() {
  const [turno, setTurno] = useState('mañana');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadUsers = async () => {
        try {
            const users = await getData('users') || [];
            // Фільтруємо, щоб показувати тільки операторів та техніків
            const operatorsAndTechnicians = users.filter(user => user.role === 'operator' || user.role === 'technician');
            setAllUsers(operatorsAndTechnicians);
        } catch (error) {
            console.error("Failed to load users for shift selection:", error);
        }
    };
    loadUsers();
  }, []);

  const handleOperatorChange = (username) => {
    setSelectedOperators(prev =>
      prev.includes(username)
        ? prev.filter(op => op !== username)
        : [...prev, username]
    );
  };

  const handleStartShift = async () => {
    if (selectedOperators.length === 0) {
      setError('Por favor, selecciona al menos un operador.');
      return;
    }

    const newRecordId = Date.now();
    const newShiftData = {
      id: newRecordId,
      fecha: new Date().toISOString().slice(0, 10),
      turno: turno,
      operators: selectedOperators,
      createdAt: new Date().toISOString(),
      tunel: {}, rech_tunel: {}, lav_ciclos: {}, lav_rechazos: {}, cont: {}, pesoCliente: [] // Додано pesoCliente для запобігання помилок
    };

    try {
        // ✅ Зберігаємо дані через сервіс
        await saveSessionItem('current_shift', newShiftData);
        navigate('/form');
    } catch (error) {
        console.error("Failed to start shift:", error);
        setError("Error al guardar los datos del turno.");
    }
  };

  // --- JSX (Візуальна частина без змін) ---
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 4 }}>
      <Paper elevation={6} sx={{ padding: 4, borderRadius: '16px', maxWidth: 600, width: '100%' }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Abrir un Nuevo Turno
        </Typography>
        <Box component="form" onSubmit={e => { e.preventDefault(); handleStartShift(); }} sx={{ mt: 3 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="turno-select-label">Selecciona el Turno</InputLabel>
            <Select
              labelId="turno-select-label"
              value={turno}
              label="Selecciona el Turno"
              onChange={(e) => setTurno(e.target.value)}
            >
              <MenuItem value="mañana">Turno Mañana (06:00 – 14:00)</MenuItem>
              <MenuItem value="tarde">Turno Tarde (14:00 – 22:00)</MenuItem>
            </Select>
          </FormControl>

          <FormControl component="fieldset" fullWidth margin="normal">
            <Typography component="legend" variant="h6" sx={{ mb: 1 }}>Selecciona los Operadores</Typography>
            <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', p: 2 }}>
              <FormGroup>
                {allUsers.map(user => (
                  <FormControlLabel
                    key={user.username}
                    control={
                      <Checkbox
                        checked={selectedOperators.includes(user.username)}
                        onChange={() => handleOperatorChange(user.username)}
                      />
                    }
                    label={`${user.username} (${user.role})`}
                  />
                ))}
              </FormGroup>
            </Paper>
          </FormControl>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

          <Button
            type="submit"
            variant="contained"
            color="success"
            size="large"
            fullWidth
            startIcon={<PlayArrowIcon />}
            sx={{ mt: 3, fontSize: '1.2rem' }}
          >
            Empezar Turno
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}