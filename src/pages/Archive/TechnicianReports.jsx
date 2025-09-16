import React from 'react';
import { Typography, Alert } from '@mui/material';
import { useI18n } from '../../i18n/i18n';

export default function TechnicianReports() {
  const { t } = useI18n();
  return (
    <>
      <Typography variant="h6">{t('archive.technician.title') || 'Звіти техніка'}</Typography>
      <Alert severity="info" sx={{ mt: 2 }}>
        {t('archive.technician.todo') || 'Тут буде розділення по підзвітах техніка.'}
      </Alert>
    </>
  );
}
