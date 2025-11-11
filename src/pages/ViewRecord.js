// src/pages/ViewRecord.js (повний вміст файлу)

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardHeader, CardContent, CardActions, Chip, Typography, Stack,
  Divider, IconButton, Button, Tooltip, Grid, Skeleton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { loadAllRawRecords } from '../utils/dataLoader';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

import { t } from '../i18n/i18n';
import { normalizeRecord, computeKPI } from '../utils/records';

// --- Допоміжні компоненти для відображення деталей звіту ---
const KeyValueTable = ({ data, title, unit = '' }) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <TableContainer>
        <Table size="small">
          <TableBody>
            {Object.entries(data || {}).map(([key, value]) => (
              (value > 0 || String(value).length > 0) &&
              <TableRow key={key}>
                <TableCell component="th" scope="row">{key}</TableCell>
                <TableCell align="right">{`${value} ${unit}`.trim()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  </Card>
);

const ClientWeightTable = ({ data }) => (
 <Card variant="outlined">
    <CardContent>
        <Typography variant="h6" gutterBottom>{t('view_client_weights', 'Вага по клієнтах')}</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell>{t('labels_client', 'Клієнт')}</TableCell>
                    <TableCell>{t('labels_program', 'Програма')}</TableCell>
                    <TableCell align="right">{t('labels_kg', 'Вага (кг)')}</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {(data || []).map((row, index) => (
                row.client && row.weight &&
                <TableRow key={index}>
                  <TableCell>{row.client}</TableCell>
                  <TableCell>{row.program}</TableCell>
                  <TableCell align="right">{row.weight}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
    </CardContent>
  </Card>
);

// ---------- Основний компонент ----------
export default function ViewRecord() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const all = await loadAllRawRecords();
    const rec = all.find(r => String(r.id) === decodeURIComponent(String(routeId || '')));
    setRecord(rec || null);
    setLoading(false);
  }, [routeId]);

  useEffect(() => { reload(); }, [reload]);
  
  const isShiftReport = record?.recordType === 'shift_report';

  const headerTitle = `${t('view_shift_report_title', 'Звіт про зміну')}: ${record ? new Date(record.fecha).toLocaleDateString() : ''} (${record?.turno || ''})`;

  return (
    <Box p={2}>
      <Card>
        <CardHeader
          title={isShiftReport ? headerTitle : t('view_title','Registro')}
          subheader={record ? `ID: ${record.id}` : ''}
          action={
            <Tooltip title={t('common_back','Volver')}>
              <IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
            </Tooltip>
          }
        />

        <CardContent>
          {loading && (
            <Box>
              <Skeleton height={40} width="60%" />
              <Skeleton height={20} width="40%" />
              <Grid container spacing={2} sx={{ mt: 1 }}>
                  {[...Array(6)].map((_, i) => (
                      <Grid item xs={12} md={4} key={i}>
                          <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
                      </Grid>
                  ))}
              </Grid>
            </Box>
          )}

          {!loading && !record && (
            <Typography color="error">{t('view_notFound','No se encontró el registro')}</Typography>
          )}

          {!loading && record && (
            <Box>
              {isShiftReport ? (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                     <Typography variant="h5" gutterBottom>
                        {t('view_shift_summary', 'Підсумок зміни')}
                     </Typography>
                     <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Chip label={`${t('labels_date', 'Дата')}: ${record.fecha}`} />
                        <Chip label={`${t('labels_shift', 'Зміна')}: ${record.turno}`} />
                        <Chip label={`${t('labels_operators', 'Оператори')}: ${record.operators.join(', ')}`} />
                     </Stack>
                  </Grid>
                  <Grid item xs={12} md={6} lg={4}>
                    <KeyValueTable data={record.tunel} title={t('view_tunnel_production', 'Виробництво тунелю')} unit="кг" />
                  </Grid>
                  <Grid item xs={12} md={6} lg={4}>
                    <KeyValueTable data={record.rech_tunel} title={t('view_tunnel_rejection', 'Відбраковка тунелю')} unit="кг" />
                  </Grid>
                  <Grid item xs={12} md={6} lg={4}>
                    <KeyValueTable data={record.cont} title={t('view_meter_readings', 'Показники лічильників')} />
                  </Grid>
                  <Grid item xs={12} md={6} lg={4}>
                     <KeyValueTable data={record.lav_ciclos} title={t('view_washer_cycles', 'Цикли пральних машин')} />
                  </Grid>
                   <Grid item xs={12} md={6} lg={8}>
                    <ClientWeightTable data={record.pesoCliente} />
                  </Grid>
                </Grid>
              ) : (
                <Typography>Це звичайний запис (не звіт про зміну).</Typography>
              )}
            </Box>
          )}
        </CardContent>

        {record && (
          <CardActions sx={{ justifyContent: 'space-between', flexWrap: 'wrap', px: 2, pb: 2 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
              {t('common_back','Volver')}
            </Button>
            <Stack direction="row" spacing={1}>
              <Button startIcon={<PrintIcon />} disabled>
                {t('actions_print','Imprimir')}
              </Button>
              <Button startIcon={<DownloadIcon />} disabled>
                {t('actions_exportPdf','Exportar PDF')}
              </Button>
              <Button startIcon={<DownloadIcon />} disabled>
                {t('actions_exportXlsx','Exportar Excel')}
              </Button>
            </Stack>
          </CardActions>
        )}
      </Card>
    </Box>
  );
}