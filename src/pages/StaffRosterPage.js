// src/pages/StaffRosterPage.js
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, CircularProgress, Select, MenuItem,
  Tooltip
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { startOfWeek, endOfWeek, add, format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

import { getData, saveData } from '../services/storageService';
import { useI18n } from '../i18n/i18n';

import pdfMake from "pdfmake/build/pdfmake";
import { vfs } from "pdfmake/build/vfs_fonts";
pdfMake.vfs = vfs;

// Опції для випадаючого списку в графіку
const SHIFT_OPTIONS = [
    { value: 'Mañana', label: 'Mañana', color: '#e3f2fd' }, // Світло-блакитний
    { value: 'Tarde', label: 'Tarde', color: '#fff3e0' }, // Світло-оранжевий
    { value: 'D', label: 'D (Descanso)', color: '#f3e5f5' }, // Світло-фіолетовий
    { value: 'V', label: 'V (Vacaciones)', color: '#e8f5e9' }, // Світло-зелений
    { value: '', label: 'Vacío', color: 'transparent' }, // для очищення
];

const StaffRosterPage = () => {
    const { t } = useI18n();
    const [staff, setStaff] = useState([]);
    const [roster, setRoster] = useState({});
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endOfCurrentWeek = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: startOfCurrentWeek, end: endOfCurrentWeek });
    const weekKey = format(startOfCurrentWeek, 'yyyy-MM-dd');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const staffData = await getData('staff') || [];
            const rosterData = await getData('staff_roster') || {};
            setStaff(staffData.filter(s => s.status === 'active')); // Показуємо тільки активних
            setRoster(rosterData);
            setLoading(false);
        };
        loadData();
    }, []);

    const handleRosterChange = async (employeeId, dateKey, value) => {
        const newRoster = { ...roster };
        if (!newRoster[weekKey]) {
            newRoster[weekKey] = {};
        }
        if (!newRoster[weekKey][employeeId]) {
            newRoster[weekKey][employeeId] = {};
        }
        newRoster[weekKey][employeeId][dateKey] = value;
        
        setRoster(newRoster);
        await saveData('staff_roster', newRoster);
    };
    
    const changeWeek = (weeks) => {
        setCurrentDate(add(currentDate, { weeks }));
    };

    const generatePdf = () => {
        const tableHeader = [
            { text: t('roster_col_employee'), bold: true },
            ...weekDays.map(day => ({ text: `${t(`roster_col_${format(day, 'EEE').toLowerCase()}`)}\n${format(day, 'dd/MM')}`, bold: true, alignment: 'center' }))
        ];

        const tableBody = staff.map(employee => {
            const employeeWeekData = roster[weekKey]?.[employee.id] || {};
            return [
                { text: employee.name, bold: true },
                ...weekDays.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    return { text: employeeWeekData[dateKey] || '', alignment: 'center' };
                })
            ];
        });

        const docDefinition = {
            content: [
                { text: t('roster_title'), style: 'header' },
                { text: `${t('roster_week_of')} ${format(startOfCurrentWeek, 'dd MMMM yyyy', { locale: es })}`, style: 'subheader' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                        body: [tableHeader, ...tableBody]
                    },
                    layout: 'lightHorizontalLines'
                }
            ],
            styles: {
                header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                subheader: { fontSize: 12, alignment: 'center', margin: [0, 0, 0, 15] }
            },
            defaultStyle: {
                fontSize: 10,
            }
        };
        
        const fileName = `Horario_${format(startOfCurrentWeek, 'yyyy-MM-dd')}.pdf`;
        pdfMake.createPdf(docDefinition).download(fileName);
    };

    if (loading) return <CircularProgress />;

    return (
        <Paper sx={{ p: 2, borderRadius: '12px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4">{t('roster_title')}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <IconButton onClick={() => changeWeek(-1)}><ArrowBackIosNewIcon /></IconButton>
                    <Typography variant="h6" sx={{ minWidth: { xs: '100%', sm: '280px' }, textAlign: 'center' }}>
                        {t('roster_week_of')} {format(startOfCurrentWeek, 'dd MMM yyyy', { locale: es })}
                    </Typography>
                    <IconButton onClick={() => changeWeek(1)}><ArrowForwardIosIcon /></IconButton>
                    
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={generatePdf}>
                        {t('roster_export_pdf')}
                    </Button>
                </Box>
            </Box>

            <TableContainer>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ minWidth: 170 }}>{t('roster_col_employee')}</TableCell>
                            {weekDays.map(day => (
                                <TableCell key={day.toString()} align="center">
                                    <Typography variant="subtitle2">{t(`roster_col_${format(day, 'EEE').toLowerCase()}`)}</Typography>
                                    <Typography variant="caption">{format(day, 'dd/MM')}</Typography>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {staff.map((employee) => {
                            const employeeWeekData = roster[weekKey]?.[employee.id] || {};
                            return (
                                <TableRow key={employee.id}>
                                    <TableCell component="th" scope="row">
                                        <Typography fontWeight="bold">{employee.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{employee.department}</Typography>
                                    </TableCell>
                                    {weekDays.map(day => {
                                        const dateKey = format(day, 'yyyy-MM-dd');
                                        const currentValue = employeeWeekData[dateKey] || '';
                                        return (
                                            <TableCell key={dateKey} align="center">
                                                <Tooltip title={SHIFT_OPTIONS.find(opt => opt.value === currentValue)?.label || ''}>
                                                    <Select
                                                        value={currentValue}
                                                        onChange={(e) => handleRosterChange(employee.id, dateKey, e.target.value)}
                                                        displayEmpty
                                                        size="small"
                                                        sx={{ minWidth: 90 }}
                                                    >
                                                        <MenuItem value="" disabled><em>{t('roster_select_placeholder')}</em></MenuItem>
                                                        {SHIFT_OPTIONS.map(opt => (
                                                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </Tooltip>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default StaffRosterPage;