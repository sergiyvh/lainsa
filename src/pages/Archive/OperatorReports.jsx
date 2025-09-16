import React from 'react';
import { Typography, Alert } from '@mui/material';
import { useI18n } from '../../i18n/i18n';

export default function OperatorReports() {
  const { t } = useI18n();
  return (
    <>
      <Typography variant="h6">{t('archive.operator.title') || 'Звіти оператора'}</Typography>
      <Alert severity="info" sx={{ mt: 2 }}>
        {t('archive.operator.todo') || 'Тут будуть сторінки/фільтри для звітів оператора.'}
      </Alert>
    </>
  );
}
