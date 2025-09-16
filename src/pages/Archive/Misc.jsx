import React from 'react';
import { Typography } from '@mui/material';
import { useI18n } from '../../i18n/i18n';

export default function Misc() {
  const { t } = useI18n();
  return <Typography variant="h6">{t('archive.misc.title') || 'Інші матеріали'}</Typography>;
}
