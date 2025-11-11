// src/pages/Archive/OperatorReports.jsx (повний вміст файлу з виправленням)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardHeader, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, CircularProgress, Typography,
  CardContent
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { getData } from '../../services/storageService'; 
import { useI18n } from '../../i18n/i18n';

export default function OperatorReports() {
  const { t } = useI18n();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const allRecords = await getData('lainsa_records') || [];

        // ✅ ВИПРАВЛЕННЯ ТУТ: Змінюємо логіку фільтрації
        const operatorReports = allRecords.filter(rec => 
            // Показуємо або нові звіти (з міткою recordType)
            rec.recordType === 'shift_report' ||
            // Або старі звіти (у яких є ключ 'tunel', але немає мітки)
            (rec.hasOwnProperty('tunel') && !rec.hasOwnProperty('recordType'))
        );
        
        // Сортуємо по даті закриття (або по даті звіту, якщо часу закриття немає)
        operatorReports.sort((a, b) => new Date(b.closedAt || b.fecha) - new Date(a.closedAt || a.fecha));
        
        setReports(operatorReports);
      } catch (error) {
        console.error("Failed to load operator reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleView = (id) => navigate(`/view/${encodeURIComponent(id)}`);

  if (loading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Завантаження звітів...</Typography>
        </Box>
    );
  }

  return (
    <Card>
      <CardHeader 
        title={t('menu.archiveOperator', 'Архів звітів оператора')} 
        subheader="Всі закриті зміни та їх підсумки"
      />
      <CardContent>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>{t('labels_date', 'Дата')}</TableCell>
                <TableCell>{t('labels_shift', 'Зміна')}</TableCell>
                <TableCell>{t('labels_operators', 'Оператори')}</TableCell>
                <TableCell align="right">{t('labels_actions', 'Дії')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Звіти ще не створювалися</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow hover key={report.id}>
                    <TableCell component="th" scope="row">
                        <Typography variant="body2" noWrap>
                            {/* Показуємо або дату закриття, або дату зміни */}
                            {report.closedAt ? new Date(report.closedAt).toLocaleString() : new Date(report.fecha).toLocaleDateString()}
                        </Typography>
                    </TableCell>
                    <TableCell>{report.turno}</TableCell>
                    <TableCell>{report.operators.join(', ')}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={t('actions_view', 'Перегляд')}>
                        <IconButton onClick={() => handleView(report.id)}><VisibilityIcon /></IconButton>
                      </Tooltip>
                      <Tooltip title={t('actions_exportPdf', 'Експорт PDF (не реалізовано)')}>
                        <span>
                            <IconButton disabled><PictureAsPdfIcon /></IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}