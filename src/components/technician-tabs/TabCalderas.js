// src/components/technician-tabs/TabCalderas.js
import React from 'react';
import { Grid, TextField, Typography, Box } from '@mui/material';
import { useI18n } from '../../i18n/i18n';

const TabCalderas = ({ data, updateData }) => {
    const { t } = useI18n();

    const handleChange = (e) => {
        const { name, value } = e.target;
        updateData({ ...data, [name]: value });
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>{t('tech_form_tab_calderas')}</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField label={t('field_hora')} name="hora" value={data.hora || ''} onChange={handleChange} fullWidth size="small" type="time" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField label={t('field_nivel_agua')} name="nivel_agua" value={data.nivel_agua || ''} onChange={handleChange} fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField label={t('field_presion')} name="presion" value={data.presion || ''} onChange={handleChange} fullWidth size="small" type="number" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField label={t('field_temp_acs')} name="temp_acs" value={data.temp_acs || ''} onChange={handleChange} fullWidth size="small" type="number" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField label={t('field_dureza')} name="dureza" value={data.dureza || ''} onChange={handleChange} fullWidth size="small" type="number" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField label={t('field_cloro')} name="cloro" value={data.cloro || ''} onChange={handleChange} fullWidth size="small" type="number" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField label={t('field_ph')} name="ph" value={data.ph || ''} onChange={handleChange} fullWidth size="small" type="number" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField label={t('field_conductividad')} name="conductividad" value={data.conductividad || ''} onChange={handleChange} fullWidth size="small" type="number" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField label={t('field_nivel_sal')} name="nivel_sal" value={data.nivel_sal || ''} onChange={handleChange} fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField label={t('field_contador')} name="contador" value={data.contador || ''} onChange={handleChange} fullWidth size="small" type="number" />
                </Grid>
            </Grid>
        </Box>
    );
};

export default TabCalderas;