import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import IncidentForm from './IncidentForm';
import IncidentList from './IncidentList';

export default function IncidentPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Інциденти</Typography>
      <IncidentForm onCreated={() => setRefreshKey(k => k + 1)} />
      <div key={refreshKey}>
        <IncidentList />
      </div>
    </Box>
  );
}
