// IncidentsListPage.jsx
import React from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';
import { listIncidents } from './incidentsService';
import { useI18n } from '../../i18n/i18n';

export default function IncidentsListPage({ readOnly = false }) {
  const { t } = useI18n();
  const [rows, setRows] = React.useState([]);

  React.useEffect(() => {
    setRows(listIncidents());
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {readOnly ? t('incidents.archive_list_title') : t('incidents.list_title')}
      </Typography>

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('common.date')}</TableCell>
              <TableCell>{t('incidents.client')}</TableCell>
              <TableCell>{t('incidents.type')}</TableCell>
              <TableCell>{t('incidents.description')}</TableCell>
              <TableCell>{t('incidents.photos')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length ? rows.map(r => (
              <TableRow key={r.id}>
                <TableCell>{fmt(r.date)}</TableCell>
                <TableCell>{r.client}</TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell>{r.description}</TableCell>
                <TableCell>{(r.photos || []).length}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} style={{ color: '#888' }}>
                  {t('incidents.no_rows')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

function fmt(v) { try { return v ? new Date(v).toLocaleString() : ''; } catch { return String(v || ''); } }
