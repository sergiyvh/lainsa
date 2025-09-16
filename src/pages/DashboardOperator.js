// src/pages/DashboardOperator.js

import React, { useState, useEffect, useMemo } from "react";
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

// --- Компоненти (можна винести в окремі файли, якщо потрібно) ---

const ActionButton = ({ startIcon, color = "primary", children, onClick, disabled }) => (
  <Button
    variant="contained"
    color={color}
    onClick={onClick}
    disabled={disabled}
    size="large"
    fullWidth
    sx={{ height: 56, textTransform: "none", fontWeight: 700, borderRadius: 3, boxShadow: "none" }}
    startIcon={startIcon}
  >
    {children}
  </Button>
);

const SectionCard = ({ title, children, action, dense = false }) => (
  <Card elevation={2} sx={{ borderRadius: 4, p: 1 }}>
    {title && (
      <CardHeader
        title={<Typography variant="h6" fontWeight={800}>{title}</Typography>}
        action={action}
        sx={{ pb: 0.5, '& .MuiCardHeader-action': { alignSelf: 'center' } }}
      />
    )}
    <CardContent sx={{ pt: title ? 1 : 2, ...(dense ? { py: 1.5 } : {}) }}>{children}</CardContent>
  </Card>
);

const Stat = ({ label, value, unit }) => (
  <Box sx={{ p: 2, borderRadius: 3, bgcolor: "background.default", textAlign: 'center' }}>
    <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>{label}</Typography>
    <Typography variant="h4" fontWeight={900}>{value} <Typography component="span" variant="h6">{unit}</Typography></Typography>
  </Box>
);

// --- Головний компонент ---

export default function DashboardOperator({ user }) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShiftData = async () => {
      try {
        const shiftData = await getData('current_shift');
        setActiveShift(shiftData);
      } catch (error) {
        console.error("Failed to load shift data:", error);
      }
    };

    fetchShiftData().finally(() => setLoading(false));

    const interval = setInterval(fetchShiftData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCloseShift = async () => {
    if (!window.confirm(t('confirm_close_shift'))) return;
    try {
      const allRecords = await getData('lainsa_records') || [];
      const shiftToClose = { ...activeShift, closedAt: new Date().toISOString() };
      
      await saveData('lainsa_records', [...allRecords, shiftToClose]);
      await removeSessionItem('current_shift');
      setActiveShift(null);
      
      alert(t('alert_shift_closed'));
      navigate(`/view/${shiftToClose.id}`);
    } catch (error) {
      console.error("Failed to close shift:", error);
      alert(t('error_closing_shift'));
    }
  };

  const productionSummary = useMemo(() => {
    if (!activeShift) return { production: 0, rejection: 0 };
    const production = activeShift.tunel?.total || 0;
    const rejection = activeShift.rech_tunel?.total || 0;
    return { production, rejection };
  }, [activeShift]);
  
  if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
      <Typography variant="h4" fontWeight={900} gutterBottom>
        {t('hello_name', { name: user.username })}!
      </Typography>

      {/* --- Секція Поточної Зміни --- */}
      <SectionCard title={t('current_shift_status')}>
        {/* ✅ ВИПРАВЛЕННЯ: Кнопка тепер окремо від тексту */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {/* Блок з текстом */}
          <Box>
            {activeShift ? (
              <>
                <Typography><strong>{t('labels_date')}:</strong> {activeShift.fecha}</Typography>
                <Typography><strong>{t('labels_shift')}:</strong> {activeShift.turno}</Typography>
                <Typography><strong>{t('labels_operators')}:</strong> {activeShift.operators.join(', ')}</Typography>
              </>
            ) : (
              <Typography color="text.secondary">{t('no_active_shift')}</Typography>
            )}
          </Box>
          
          {/* Блок з кнопкою */}
          <Box sx={{ minWidth: { xs: '100%', sm: '250px' } }}>
            {activeShift ? (
              <ActionButton color="error" startIcon={<StopRoundedIcon />} onClick={handleCloseShift}>
                {t('btn_close_shift')} {/* ✅ ВИПРАВЛЕННЯ: Правильний текст кнопки */}
              </ActionButton>
            ) : (
              <ActionButton color="primary" startIcon={<PlayArrowRoundedIcon />} onClick={() => navigate("/open-shift")}>
                {t('btn_open_shift')}
              </ActionButton>
            )}
          </Box>
        </Box>
      </SectionCard>

      {/* --- Секція "Підсумки зміни в реальному часі" --- */}
      {activeShift && (
        <>
            <Box sx={{ height: 24 }} />
            <SectionCard title={t('shift_summary')}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Stat label={t('production_total')} value={productionSummary.production.toLocaleString('es-ES')} unit={t('kg')} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Stat label={t('rejection_total')} value={productionSummary.rejection.toLocaleString('es-ES')} unit={t('kg')} />
                    </Grid>
                </Grid>
            </SectionCard>
        </>
      )}

      <Box sx={{ height: 24 }} />

      {/* --- Секція "Швидка навігація" --- */}
      <SectionCard title={t('quick_nav')}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <ActionButton
              startIcon={<AssignmentTurnedInRoundedIcon />}
              onClick={() => navigate("/form")}
              disabled={!activeShift}
            >
              {t('btn_form')}
            </ActionButton>
          </Grid>
          <Grid item xs={12} sm={6}>
            <ActionButton
              startIcon={<LocalLaundryServiceIcon />}
              onClick={() => navigate("/machines")}
              disabled={!activeShift}
            >
              {t('nav_machines')}
            </ActionButton>
          </Grid>
        </Grid>
      </SectionCard>
    </Box>
  );
}