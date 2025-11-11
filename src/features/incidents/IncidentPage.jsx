// src/pages/Incidents/IncidentPage.jsx
import React, { useState } from 'react';
import { Box, Divider } from '@mui/material';
import IncidentForm from './IncidentForm';
import IncidentList from './IncidentList';

export default function IncidentPage({ user }) {
  // Цей ключ буде змушувати IncidentList оновитися після збереження нового інциденту
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Box>
      <IncidentForm
        user={user} // ✅ Передаємо користувача у форму
        onSaved={() => setRefreshKey(k => k + 1)} // ✅ Функція, яка оновить список
      />
      <Divider sx={{ my: 4 }} />
      <IncidentList key={refreshKey} /> {/* Використовуємо ключ для примусового оновлення */}
    </Box>
  );
}