// src/pages/AnalyticsPage.js (повний вміст файлу з виправленням)

import React, { useEffect, useMemo, useState } from 'react';
import {
  Paper, Typography, Box, TextField, Grid, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Switch, FormControlLabel, Autocomplete, Chip
} from '@mui/material';
import {
  ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LineChart, Line
} from 'recharts';
import { getData } from '../services/storageService';
import { t } from '../i18n/i18n';
import { getProgramName } from '../data/programNames';

// --- Утиліти ---
const ymd = (date) => date.toISOString().slice(0, 10);
const toNum = (x, def = 0) => { const n = Number(x); return Number.isFinite(n) ? n : def; };
const fmt = (n, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : '—');
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const METER_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// --- Функція обробки даних ---
function processDataForChart(records, startDate, endDate, keys, extractor) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dataMap = new Map();
  const rawData = [];

  for (const rec of records) {
    if (rec.recordType !== 'shift_report') continue;
    const recDate = new Date(rec.fecha);
    if (recDate >= start && recDate <= end) {
      const extractedValues = extractor(rec);
      const label = ymd(recDate);
      
      const dayData = dataMap.get(label) || {};
      let hasData = false;

      for (const key of keys) {
        const value = toNum(extractedValues[key]);
        dayData[key] = (dayData[key] || 0) + value;
        if (value > 0) hasData = true;
      }
      dataMap.set(label, dayData);

      if (hasData) {
        rawData.push({ date: rec.closedAt || rec.fecha, ...extractedValues });
      }
    }
  }

  const sortedData = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const label = ymd(d);
    const dayData = dataMap.get(label) || {};
    const entry = { label };
    keys.forEach(key => entry[key] = dayData[key] || 0);
    sortedData.push(entry);
  }

  return { chartData: sortedData, rawData };
}

// --- Універсальний компонент для кожної вкладки ---
function AnalyticsTabPanel({ records, availableKeys, extractor, tabType }) {
  const useFullNames = tabType === 'programs';

  const [selectedKeys, setSelectedKeys] = useState(availableKeys.slice(0, 3));
  const [period, setPeriod] = useState(() => {
    const end = new Date();
    const start = addDays(end, -13);
    return { start: ymd(start), end: ymd(end) };
  });

  const { chartData, rawData } = useMemo(() => 
    processDataForChart(records, period.start, period.end, selectedKeys, extractor),
    [records, period, selectedKeys, extractor]
  );
  
  return (
    <Box sx={{ mt: 2 }}>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField size="small" type="date" label={t('analytics_start_period')} value={period.start} onChange={(e) => setPeriod(p => ({ ...p, start: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }}/>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField size="small" type="date" label={t('analytics_end_period')} value={period.end} onChange={(e) => setPeriod(p => ({ ...p, end: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }}/>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              multiple
              size="small"
              options={availableKeys}
              value={selectedKeys}
              onChange={(_, newValue) => setSelectedKeys(newValue)}
              getOptionLabel={(key) => useFullNames ? getProgramName(key) : key}
              renderInput={(params) => <TextField {...params} label={t('analytics_select_metrics')} />}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={useFullNames ? getProgramName(option) : option} {...getTagProps({ index })} />
                ))
              }
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={2} sx={{ p: 2, height: 320, mb: 3 }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedKeys.map((key, index) => (
                <Line key={key} type="monotone" dataKey={key} name={useFullNames ? getProgramName(key) : key} stroke={METER_COLORS[index % METER_COLORS.length]} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography color="text.secondary">{t('analytics_no_data_for_chart')}</Typography>
          </Box>
        )}
      </Paper>

      <Typography variant="h6" gutterBottom>{t('analytics_raw_data_table')}</Typography>
      <Paper elevation={2}>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('analytics_table_date')}</TableCell>
                {selectedKeys.map(key => <TableCell key={key} align="right">{useFullNames ? getProgramName(key) : key}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {rawData.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell>{new Date(row.date).toLocaleString()}</TableCell>
                  {selectedKeys.map(key => <TableCell key={key} align="right">{fmt(row[key])}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

// --- Основний компонент сторінки ---
export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const recs = await getData('lainsa_records');
      setRecords(Array.isArray(recs) ? recs : []);
      setLoading(false);
    })();
  }, []);
  
  // ✅ ВИПРАВЛЕНО: Додано повну реалізацію хука useMemo
  const { meterKeys, programKeys } = useMemo(() => {
    const mKeys = new Set();
    const pKeys = new Set();
    records.forEach(r => {
      if (r.cont) Object.keys(r.cont).forEach(k => mKeys.add(k));
      if (r.tunel) Object.keys(r.tunel).forEach(k => pKeys.add(k));
    });
    return { meterKeys: Array.from(mKeys).sort(), programKeys: Array.from(pKeys).sort() };
  }, [records]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>{t('common_loading')}</Box>;

  const TABS = [
    { label: t('analytics_tab_meters'), availableKeys: meterKeys, extractor: (rec) => rec.cont || {}, tabType: 'meters' },
    { label: t('analytics_tab_programs'), availableKeys: programKeys, extractor: (rec) => rec.tunel || {}, tabType: 'programs' },
  ];

  const activeTab = TABS[tabIndex];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{t('analytics_title')}</Typography>
      <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)} variant="scrollable" scrollButtons="auto">
        {TABS.map((tab) => <Tab label={tab.label} key={tab.label} />)}
      </Tabs>
      
      {activeTab && (
        <AnalyticsTabPanel 
          records={records}
          availableKeys={activeTab.availableKeys}
          extractor={activeTab.extractor}
          tabType={activeTab.tabType}
        />
      )}
    </Box>
  );
}