import React, { useState, useEffect, useMemo } from "react";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import {
  Box, Grid, Card, CardContent, CardHeader,
  Typography, Button, Stack, Divider, CircularProgress
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';

import { useI18n } from '../i18n/i18n';
import { getData, saveData, removeSessionItem } from '../services/storageService';
import pdfMake from 'pdfmake/build/pdfmake';
import { vfs as pdfVfs } from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfVfs;

// --- Компоненти ---
const ActionButton = ({ startIcon, color = "primary", children, onClick, disabled }) => ( <Button variant="contained" color={color} onClick={onClick} disabled={disabled} size="large" fullWidth sx={{ height: 56, textTransform: "none", fontWeight: 700, borderRadius: 3, boxShadow: "none" }} startIcon={startIcon}>{children}</Button> );
const SectionCard = ({ title, children }) => ( <Card elevation={2} sx={{ borderRadius: 4, p: 1, mb: 3 }}>{title && (<CardHeader title={<Typography variant="h6" fontWeight={800}>{title}</Typography>} sx={{ pb: 0.5 }} />)}<CardContent sx={{ pt: title ? 1 : 2 }}>{children}</CardContent></Card> );
const Stat = ({ label, value, unit }) => ( <Box sx={{ p: 2, borderRadius: 3, bgcolor: "background.default", textAlign: 'center' }}><Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>{label}</Typography><Typography variant="h4" fontWeight={900}>{value} <Typography component="span" variant="h6">{unit}</Typography></Typography></Box> );

export default function DashboardOperator({ user }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShiftData = async () => {
      const shiftData = await getData('current_shift');
      setActiveShift(shiftData);
    };
    fetchShiftData().finally(() => setLoading(false));
    const interval = setInterval(fetchShiftData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleExportPdf = () => {
    if (!activeShift) return;
    const docDefinition = {
        content: [
            { text: `Resumen del Turno - ${activeShift.fecha}`, style: 'header' },
            { text: `Operadores: ${activeShift.operators.join(', ')}`},
            { text: `Producción Total (Túnel): ${activeShift.tunel?.total || 0} kg`},
        ],
        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] }
        }
    };
    pdfMake.createPdf(docDefinition).open();
  };

  // ✅ ОНОВЛЕНА ФУНКЦІЯ ЗАКРИТТЯ ЗМІНИ
  const handleCloseShift = async () => {
    if (!window.confirm(t('confirm_close_shift', 'Ви впевнені, що хочете закрити зміну? Всі дані будуть збережені в архів.'))) return;
    try {
      const allRecords = await getData('lainsa_records') || [];
      
      // Створюємо детальний об'єкт звіту для збереження в архіві
      const shiftToClose = { 
        ...activeShift, 
        // Створюємо унікальний та інформативний ID для запису
        id: `shift_${activeShift.fecha}_${activeShift.turno}_${Date.now()}`, 
        // Додаємо точний час закриття
        closedAt: new Date().toISOString(),
        // Додаємо спеціальний тип запису для легкої фільтрації у звітах
        recordType: 'shift_report' 
      };

      // Зберігаємо оновлений список записів
      await saveData('lainsa_records', [...allRecords, shiftToClose]);
      // Видаляємо дані про поточну зміну з сесійного сховища
      await removeSessionItem('current_shift');
      setActiveShift(null);
      
      alert(t('alert_shift_closed', 'Зміну успішно закрито та збережено в архіві.'));
      
      // Перенаправляємо користувача на сторінку перегляду щойно створеного звіту
      navigate(`/view/${encodeURIComponent(shiftToClose.id)}`); 
    } catch (error) {
      console.error("Failed to close shift:", error);
      alert(t('error_closing_shift', 'Не вдалося закрити зміну. Подивіться консоль для деталей.'));
    }
  };

  const productionSummary = useMemo(() => {
    if (!activeShift) {
        return { production: 0, rejection: 0, cycles: 0, clientWeight: 0 };
    }
    const production = activeShift.tunel?.total || 0;
    const rejection = activeShift.rech_tunel?.total || 0;
    const cycles = Object.values(activeShift.lav_ciclos || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);
    const clientWeight = (activeShift.pesoCliente || []).reduce((acc, item) => acc + (Number(item.weight) || 0), 0);
    return { production, rejection, cycles, clientWeight };
  }, [activeShift]);
  
  if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
      <Typography variant="h4" fontWeight={900} gutterBottom>
        {t('hello_name', { name: user.username })}!
      </Typography>
      
      <SectionCard title={t('current_shift_status')}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, minHeight: '56px' }}>
          {activeShift ? (
            <>
              <Box sx={{ textAlign: 'left' }}>
                  <Typography><strong>{t('labels_date')}:</strong> {activeShift.fecha}</Typography>
                  <Typography><strong>{t('labels_shift')}:</strong> {activeShift.turno}</Typography>
                  <Typography><strong>{t('labels_operators')}:</strong> {activeShift.operators.join(', ')}</Typography>
              </Box>
              <Box sx={{ flexShrink: 0 }}>
                  <ActionButton color="error" startIcon={<StopRoundedIcon />} onClick={handleCloseShift}>
                      {t('btn_close_shift')}
                  </ActionButton>
              </Box>
            </>
          ) : (
            <>
              <Typography color="text.secondary">{t('no_active_shift')}</Typography>
              <Box sx={{ flexShrink: 0, minWidth: '200px' }}>
                   <ActionButton color="primary" startIcon={<PlayArrowRoundedIcon />} onClick={() => navigate("/open-shift")}>
                      {t('btn_open_shift')}
                  </ActionButton>
              </Box>
            </>
          )}
        </Box>
      </SectionCard>

      {activeShift && (
        <SectionCard title={t('shift_summary')}>
          <Grid container spacing={2}>
              <Grid item xs={6} md={3}><Stat label={t('production_total')} value={productionSummary.production.toLocaleString('es-ES')} unit={t('kg')} /></Grid>
              <Grid item xs={6} md={3}><Stat label={t('rejection_total')} value={productionSummary.rejection.toLocaleString('es-ES')} unit={t('kg')} /></Grid>
              <Grid item xs={6} md={3}><Stat label={t('summary_cycles_lavadoras')} value={productionSummary.cycles.toLocaleString('es-ES')} unit="" /></Grid>
              <Grid item xs={6} md={3}><Stat label={t('summary_client_weight')} value={productionSummary.clientWeight.toFixed(2)} unit={t('kg')} /></Grid>
          </Grid>
        </SectionCard>
      )}

      <SectionCard title={t('quick_nav')}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><ActionButton startIcon={<AssignmentTurnedInRoundedIcon />} onClick={() => navigate("/form")} disabled={!activeShift}>{t('btn_form')}</ActionButton></Grid>
          <Grid item xs={12} sm={6}><ActionButton startIcon={<LocalLaundryServiceIcon />} onClick={() => navigate("/machines")} disabled={!activeShift}>{t('nav_machines')}</ActionButton></Grid>
        </Grid>
      </SectionCard>
      
      <SectionCard title={t('menu.incidents')}>
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <ActionButton startIcon={<ReportProblemIcon />} onClick={() => navigate('/archive/incidents')} color="warning">{t('menu.incidents_create')}</ActionButton>
            </Grid>
            <Grid item xs={12} sm={6}>
                <ActionButton startIcon={<PictureAsPdfIcon />} onClick={handleExportPdf} color="secondary">{t('actions_exportPdf')}</ActionButton>
            </Grid>
        </Grid>
      </SectionCard>
    </Box>
  );
}