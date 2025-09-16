// src/pages/TechnicianFormPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Divider, CircularProgress } from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { getData } from '../services/storageService';
import { useI18n } from '../i18n/i18n';
import TechnicianTabsWrapper from '../components/TechnicianTabsWrapper'; // Імпортуємо майбутній компонент

const TechnicianFormPage = ({ user }) => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadReport = async () => {
            const activeReport = await getData('active_technician_report');
            if (activeReport) {
                setReport(activeReport);
            } else {
                alert("No hay un reporte técnico activo.");
                navigate('/technician-report');
            }
            setLoading(false);
        };
        loadReport();
    }, [navigate]);

    if (loading || !report) {
        return <CircularProgress />;
    }

    return (
        <Box sx={{ maxWidth: 1000, margin: '0 auto' }}>
            <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
                <Typography variant="h5" component="h2">{t('tech_form_title')}</Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Typography><strong>{t('labels_date')}:</strong> {format(new Date(report.date), 'PPPP', { locale: es })}</Typography>
                    <Typography><strong>{t('common_technician')}:</strong> {report.createdBy}</Typography>
                </Box>
            </Paper>
            <TechnicianTabsWrapper reportData={report} />
        </Box>
    );
};

export default TechnicianFormPage;