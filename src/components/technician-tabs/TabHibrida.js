// src/components/technician-tabs/TabHibrida.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, TextField, Paper, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useI18n } from '../../i18n/i18n';
import { getData } from '../../services/storageService';

const TabHibrida = ({ data, updateData }) => {
    const { t } = useI18n();
    const [staff, setStaff] = useState([]);

    useEffect(() => {
        const fetchStaff = async () => {
            const staffData = await getData('staff') || [];
            setStaff(staffData.filter(s => s.status === 'active'));
        };
        fetchStaff();
    }, []);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        updateData({ ...data, [name]: value });
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                {t('tech_form_tab_hibrida')}
            </Typography>
            <Grid container spacing={3}>
                {/* --- ЛІВИЙ БЛОК: ПОКАЗНИКИ --- */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, borderRadius: '12px', height: '100%' }}>
                        <Typography variant="h6" gutterBottom>{t('labels_kpi')}</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField label={t('field_piezas_grandes')} name="piezasGrandes" value={data.piezasGrandes || ''} onChange={handleChange} fullWidth size="small" type="number" />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField label={`${t('field_via')} 1`} name="via1_piezas" value={data.via1_piezas || ''} onChange={handleChange} fullWidth size="small" type="number" />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField label={`${t('field_via')} 2`} name="via2_piezas" value={data.via2_piezas || ''} onChange={handleChange} fullWidth size="small" type="number" />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* --- ПРАВИЙ БЛОК: ПРАЦІВНИКИ --- */}
                <Grid item xs={12} md={12}>
                    <Paper sx={{ p: 2, borderRadius: '12px', height: '100%' }}>
                        <Typography variant="h6" gutterBottom>{t('section_trabajadores')}</Typography>
                        <Grid container spacing={2}>
                            {/* ✅ ВИПРАВЛЕНО: Структура сітки тепер така сама, як у блоці зліва */}
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>{`${t('field_via')} 1`}</InputLabel>
                                    <Select name="trabajador_via1" value={data.trabajador_via1 || ''} label={`${t('field_via')} 1`} onChange={handleChange}>
                                        <MenuItem value=""><em>Nadie</em></MenuItem>
                                        {staff.map(person => <MenuItem key={person.id} value={person.name}>{person.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>{`${t('field_via')} 2`}</InputLabel>
                                    <Select name="trabajador_via2" value={data.trabajador_via2 || ''} label={`${t('field_via')} 2`} onChange={handleChange}>
                                        <MenuItem value=""><em>Nadie</em></MenuItem>
                                        {staff.map(person => <MenuItem key={person.id} value={person.name}>{person.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>{`${t('field_via')} 3`}</InputLabel>
                                    <Select name="trabajador_via3" value={data.trabajador_via3 || ''} label={`${t('field_via')} 3`} onChange={handleChange}>
                                        <MenuItem value=""><em>Nadie</em></MenuItem>
                                        {staff.map(person => <MenuItem key={person.id} value={person.name}>{person.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TabHibrida;