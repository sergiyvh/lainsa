import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardActions, Button, Typography, Stack } from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/i18n';

async function getIncidentsCount() {
  try {
    const { getDataFile } = await import('../../services/dataBridge');
    const list = await getDataFile?.('incidents.json');
    return Array.isArray(list) ? list.length : 0;
  } catch { return 0; }
}

export default function IncidentsQuickCard({ sx }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const c = await getIncidentsCount();
      if (alive) setCount(c);
    })();
    return () => { alive = false; };
  }, []);

  return (
    <Card sx={{ borderRadius: 3, ...sx }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack spacing={0.5}>
            <Typography variant="overline" sx={{ opacity: 0.7 }}>
              {t('dashboard.cards.incidents')}
            </Typography>
            <Typography variant="h5" sx={{ lineHeight: 1.1 }}>
              {t('incidents.title')}
            </Typography>
          </Stack>
          <ReportProblemIcon fontSize="large" />
        </Stack>
        <Typography variant="body2" sx={{ mt: 1, opacity: 0.75 }}>
          {t('incidents.count', { count })}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
        <Button size="small" onClick={() => navigate('/incidents')}>
          {t('incidents.open')}
        </Button>
      </CardActions>
    </Card>
  );
}