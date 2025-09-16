// src/pages/TechnicianReportPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, CircularProgress, Divider } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; // ✅ Додано імпорт іспанської локалі

import { getData, saveData } from '../services/storageService';
import { useI18n } from '../i18n/i18n';

const TechnicianReportPage = ({ user }) => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [todaysReport, setTodaysReport] = useState(null);
    
    const todayKey = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        const checkExistingReport = async () => {
            const activeReport = await getData('active_technician_report');
            if (activeReport && activeReport.date === todayKey) {
                setTodaysReport(activeReport);
            }
            setLoading(false);
        };
        checkExistingReport();
    }, [todayKey]);

    const handleStartReport = async () => {
        const newReport = {
            id: `tech_${Date.now()}`,
            date: todayKey,
            createdBy: user.username,
            status: 'open',
            data: {
                calderas: {},
                calandras: [],
                secadoras: [],
                tunel: {},
                plegadores: [],
                lavadoras: []
            },
        introductor: {
                via1_val1: '', via1_val2: '',
                via2_val1: '', via2_val2: '',
                via3_val1: '', via3_val2: '',
                via4_val1: '', via4_val2: '',
                via5_val1: '', via5_val2: '',
            },
        hibrida: { // ✅ Додаємо структуру для нової вкладки
                piezasGrandes: '', via1_piezas: '', via2_piezas: '',
                trabajador_via1: '', trabajador_via2: '', trabajador_via3: ''
            },
        kannegiesser: [{
                id: 1, p1: '', p2: '', p3: '', p4: '',
                trabajador1: '', trabajador2: '', trabajador3: ''
            }],
        };
        await saveData('active_technician_report', newReport);
        navigate('/technician-form');
    };
    
    const handleContinueReport = () => {
        navigate('/technician-form');
    };

    if (loading) return <CircularProgress />;

    return (
        <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', textAlign: 'center', borderRadius: '16px' }}>
            <Typography variant="h4" gutterBottom>{t('tech_report_title')}</Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                {/* ✅ ВИПРАВЛЕНО: передаємо повний об'єкт 'es' */}
                {format(new Date(), 'PPPP', { locale: es })}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {todaysReport ? (
                <Box>
                    <Typography sx={{ mb: 2 }}>{t('tech_report_existing_report')}</Typography>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<EditNoteIcon />}
                        onClick={handleContinueReport}
                    >
                        {t('tech_report_continue_today')}
                    </Button>
                </Box>
            ) : (
                <Box>
                    <Typography sx={{ mb: 2 }}>{t('tech_report_no_report')}</Typography>
                    <Button
                        variant="contained"
                        color="success"
                        size="large"
                        startIcon={<PlayCircleOutlineIcon />}
                        onClick={handleStartReport}
                    >
                        {t('tech_report_start_today')}
                    </Button>
                </Box>
            )}
        </Paper>
    );
};

export default TechnicianReportPage;