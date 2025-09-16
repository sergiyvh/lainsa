// src/components/technician-tabs/TabKannegiesser.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, TextField, Paper, Select, MenuItem, FormControl, InputLabel, Button, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useI18n } from '../../i18n/i18n';
import { getData } from '../../services/storageService';

const TabKannegiesser = ({ data, updateData }) => {
    const { t } = useI18n();
    const [staff, setStaff] = useState([]);

    useEffect(() => {
        const fetchStaff = async () => {
            const staffData = await getData('staff') || [];
            setStaff(staffData.filter(s => s.status === 'active').map(s => s.name));
        };
        fetchStaff();
    }, []);

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const updatedData = [...data];
        updatedData[index][name] = value;
        updateData(updatedData);
    };

    const addRow = () => {
        if (data.length >= 4) return;
        const newRow = {
            id: Date.now(), p1: '', p2: '', p3: '', p4: '',
            trabajador1: '', trabajador2: '', trabajador3: ''
        };
        updateData([...data, newRow]);
    };

    const deleteRow = (index) => {
        if (data.length <= 1) return;
        const updatedData = data.filter((_, i) => i !== index);
        updateData(updatedData);
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                {t('tech_form_tab_kannegiesser')}
            </Typography>
            {data.map((row, index) => (
                <Paper key={row.id || index} sx={{ p: 2, mb: 2, borderRadius: '12px' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12}>
                            <Typography variant="h6">{t('kannegiesser_machine_no')}{index + 1}</Typography>
                        </Grid>
                        
                        {/* Показники */}
                        <Grid item xs={6} sm={3} md={2}><TextField label={t('field_pieza1')} name="p1" value={row.p1} onChange={e => handleInputChange(index, e)} fullWidth size="small" type="number" /></Grid>
                        <Grid item xs={6} sm={3} md={2}><TextField label={t('field_pieza2')} name="p2" value={row.p2} onChange={e => handleInputChange(index, e)} fullWidth size="small" type="number" /></Grid>
                        <Grid item xs={6} sm={3} md={2}><TextField label={t('field_pieza3')} name="p3" value={row.p3} onChange={e => handleInputChange(index, e)} fullWidth size="small" type="number" /></Grid>
                        <Grid item xs={6} sm={3} md={2}><TextField label={t('field_pieza4')} name="p4" value={row.p4} onChange={e => handleInputChange(index, e)} fullWidth size="small" type="number" /></Grid>

                        {/* Працівники */}
                        <Grid item xs={12} sm={4} md>
                            <FormControl fullWidth size="small">
                                <InputLabel>{t('kannegiesser_worker_no')} 1</InputLabel>
                                <Select name="trabajador1" value={row.trabajador1} label={`${t('kannegiesser_worker_no')} 1`} onChange={e => handleInputChange(index, e)}>
                                    <MenuItem value=""><em>-</em></MenuItem>
                                    {staff.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4} md>
                             <FormControl fullWidth size="small">
                                <InputLabel>{t('kannegiesser_worker_no')} 2</InputLabel>
                                <Select name="trabajador2" value={row.trabajador2} label={`${t('kannegiesser_worker_no')} 2`} onChange={e => handleInputChange(index, e)}>
                                    <MenuItem value=""><em>-</em></MenuItem>
                                    {staff.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4} md>
                             <FormControl fullWidth size="small">
                                <InputLabel>{t('kannegiesser_worker_no')} 3</InputLabel>
                                <Select name="trabajador3" value={row.trabajador3} label={`${t('kannegiesser_worker_no')} 3`} onChange={e => handleInputChange(index, e)}>
                                    <MenuItem value=""><em>-</em></MenuItem>
                                    {staff.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md="auto" sx={{textAlign: 'right'}}>
                            <IconButton onClick={() => deleteRow(index)} color="error" disabled={data.length <= 1}><DeleteIcon /></IconButton>
                        </Grid>
                    </Grid>
                </Paper>
            ))}
             <Button startIcon={<AddIcon />} onClick={addRow} disabled={data.length >= 4}>
                {t('btn_add_row')}
            </Button>
        </Box>
    );
};

export default TabKannegiesser;