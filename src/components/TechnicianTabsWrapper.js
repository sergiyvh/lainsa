// src/components/TechnicianTabsWrapper.js
import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Paper } from '@mui/material';

import { saveData } from '../services/storageService';
import { useI18n } from '../i18n/i18n';

import TabCalderas from './technician-tabs/TabCalderas';
import TabIntroductor from './technician-tabs/TabIntroductor';
import TabHibrida from './technician-tabs/TabHibrida'; // ✅ Імпорт
import TabKannegiesser from './technician-tabs/TabKannegiesser'; // ✅ Імпорт

const TechnicianTabsWrapper = ({ reportData, user }) => {
    const { t } = useI18n();
    const [tabIndex, setTabIndex] = useState(0);
    const [formData, setFormData] = useState(reportData);

    useEffect(() => {
        saveData('active_technician_report', formData);
    }, [formData]);

    const updateData = (tabKey, newData) => {
        setFormData(prev => ({
            ...prev,
            data: { ...prev.data, [tabKey]: newData }
        }));
    };

    return (
        <Paper elevation={3} sx={{ borderRadius: '12px' }}>
            <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} variant="scrollable" scrollButtons="auto">
                <Tab label={t('tech_form_tab_calderas')} />
                <Tab label={t('tech_form_tab_introductor')} />
                <Tab label={t('tech_form_tab_hibrida')} /> {/* ✅ Додано вкладку */}
                <Tab label={t('tech_form_tab_kannegiesser')} />
            </Tabs>
            <Box sx={{ p: 2 }}>
                {tabIndex === 0 && (
                    <TabCalderas
                        data={formData.data.calderas || {}} // Додаємо запасний варіант
                        updateData={(newData) => updateData('calderas', newData)}
                    />
                )}
                {tabIndex === 1 && (
                    <TabIntroductor
                        // ✅ ВИПРАВЛЕННЯ: Якщо formData.data.introductor не існує, передаємо порожній об'єкт {}
                        data={formData.data.introductor || {}}
                        updateData={(newData) => updateData('introductor', newData)}
                        reportDate={formData.date}
                    />
                )}
                {tabIndex === 2 && ( // ✅ Додано рендер нової вкладки
                    <TabHibrida
                        data={formData.data.hibrida || {}}
                        updateData={(newData) => updateData('hibrida', newData)}
                    />
                )}
                {tabIndex === 3 && ( // ✅ Додано рендер нової вкладки
                    <TabKannegiesser
                        data={formData.data.kannegiesser || []}
                        updateData={(newData) => updateData('kannegiesser', newData)}
                    />
                )}
            </Box>
        </Paper>
    );
};

export default TechnicianTabsWrapper;