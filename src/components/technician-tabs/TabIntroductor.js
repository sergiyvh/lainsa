// src/components/technician-tabs/TabIntroductor.js
import React from 'react';
import { Box, Typography, Grid, TextField, Paper } from '@mui/material';
import { useI18n } from '../../i18n/i18n';

const ViaCard = ({ viaNumber, data, onChange }) => {
    const { t } = useI18n();

    // Стилі для полів вводу, щоб вони були однакові
    const inputStyles = {
        '& .MuiInputBase-input': {
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '1.2rem',
        },
    };

    return (
        <Paper elevation={3} sx={{ p: 2, borderRadius: '12px', height: '100%', textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
                {t('field_via')} {viaNumber}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
                <TextField
                    name={`via${viaNumber}_val1`}
                    value={data[`via${viaNumber}_val1`] || ''}
                    onChange={onChange}
                    type="number"
                    size="small"
                    placeholder={t('field_enter_data')}
                    sx={inputStyles}
                />
                <TextField
                    name={`via${viaNumber}_val2`}
                    value={data[`via${viaNumber}_val2`] || ''}
                    onChange={onChange}
                    type="number"
                    size="small"
                    placeholder={t('field_enter_data')}
                    sx={inputStyles}
                />
            </Box>
        </Paper>
    );
};

const TabIntroductor = ({ data, updateData }) => {
    const { t } = useI18n();
    const vias = [1, 2, 3, 4, 5];

    const handleChange = (e) => {
        const { name, value } = e.target;
        const numericValue = value === '' ? '' : Number(value);
        updateData({ ...data, [name]: numericValue });
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                {t('tech_form_tab_introductor')}
            </Typography>
            <Grid container spacing={2}>
                {vias.map(v => (
                    <Grid item xs={12} sm={6} md={4} lg={2.4} key={v}>
                        <ViaCard
                            viaNumber={v}
                            data={data}
                            onChange={handleChange}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default TabIntroductor;