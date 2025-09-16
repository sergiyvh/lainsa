import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Grid, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';

import { getData, saveData } from '../services/storageService';
import { useI18n } from '../i18n/i18n';

const MaintenanceLogPage = ({ user }) => {
  const { t } = useI18n();
  const [events, setEvents] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({ equipmentId: '', eventType: 'Ремонт', description: '', nextServiceDate: '' });
  const [filters, setFilters] = useState({ equipmentId: '', technician: '' });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [eventsData, equipmentData, usersData] = await Promise.all([
        getData('maintenance_events'),
        getData('equipment'),
        getData('users')
      ]);
      setEvents((eventsData || []).sort((a, b) => new Date(b.date) - new Date(a.date)));
      setEquipmentList(equipmentData || []);
      setUserList((usersData || []).filter(u => u.role === 'technician'));
      setLoading(false);
    };
    loadData();
  }, []);

  const handleOpenDialog = () => {
    setNewEvent({ equipmentId: '', eventType: t('maintlog_event_type_repair'), description: '', nextServiceDate: '' });
    setOpenDialog(true);
  };
  const handleCloseDialog = () => setOpenDialog(false);

  const handleSaveEvent = async () => {
    if (!newEvent.equipmentId || !newEvent.description) {
      alert(t('maintlog_validation_error'));
      return;
    }
    const finalEvent = {
      ...newEvent,
      id: Date.now(),
      date: new Date().toISOString(),
      technician: user.username,
      equipmentName: equipmentList.find(e => e.id === newEvent.equipmentId)?.name || 'N/A'
    };
    const updatedEvents = [finalEvent, ...events];
    await saveData('maintenance_events', updatedEvents);
    setEvents(updatedEvents);
    handleCloseDialog();
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({...prev, [name]: value}));
  };
  
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
        const equipmentMatch = filters.equipmentId ? event.equipmentId === filters.equipmentId : true;
        const technicianMatch = filters.technician ? event.technician === filters.technician : true;
        return equipmentMatch && technicianMatch;
    });
  }, [events, filters]);

  if (loading) return <CircularProgress />;

  return (
    <Paper sx={{ p: 2, borderRadius: '12px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">{t('maintlog_title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
          {t('maintlog_add_entry')}
        </Button>
      </Box>

      <Paper elevation={2} sx={{p: 2, mb: 2}}>
        <Grid container spacing={2} alignItems="center">
            <Grid item><FilterListIcon /></Grid>
            <Grid item xs>
                <FormControl fullWidth size="small">
                    <InputLabel>{t('nav_equipment')}</InputLabel>
                    <Select name="equipmentId" value={filters.equipmentId} label={t('nav_equipment')} onChange={handleFilterChange}>
                        <MenuItem value=""><em>{t('common_all')}</em></MenuItem>
                        {equipmentList.map(item => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs>
                <FormControl fullWidth size="small">
                    <InputLabel>{t('common_technician')}</InputLabel>
                    <Select name="technician" value={filters.technician} label={t('common_technician')} onChange={handleFilterChange}>
                        <MenuItem value=""><em>{t('common_all')}</em></MenuItem>
                        {userList.map(user => <MenuItem key={user.id} value={user.username}>{user.username}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
      </Paper>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('labels_date')}</TableCell>
              <TableCell>{t('nav_equipment')}</TableCell>
              <TableCell>{t('maintlog_col_event_type')}</TableCell>
              <TableCell>{t('common_description')}</TableCell>
              <TableCell>{t('common_technician')}</TableCell>
              <TableCell>{t('maintlog_col_next_service')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{new Date(event.date).toLocaleString('es-ES')}</TableCell>
                <TableCell>{event.equipmentName}</TableCell>
                <TableCell>{event.eventType}</TableCell>
                <TableCell>{event.description}</TableCell>
                <TableCell>{event.technician}</TableCell>
                <TableCell>{event.nextServiceDate || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{t('maintlog_dialog_title')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('nav_equipment')} *</InputLabel>
            <Select name="equipmentId" value={newEvent.equipmentId} label={`${t('nav_equipment')} *`} onChange={handleInputChange}>
              {equipmentList.map(item => <MenuItem key={item.id} value={item.id}>{item.name} ({item.type})</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('maintlog_col_event_type')}</InputLabel>
            <Select name="eventType" value={newEvent.eventType} label={t('maintlog_col_event_type')} onChange={handleInputChange}>
              <MenuItem value={t('maintlog_event_type_planned')}>{t('maintlog_event_type_planned')}</MenuItem>
              <MenuItem value={t('maintlog_event_type_repair')}>{t('maintlog_event_type_repair')}</MenuItem>
              <MenuItem value={t('maintlog_event_type_cleaning')}>{t('maintlog_event_type_cleaning')}</MenuItem>
              <MenuItem value={t('maintlog_event_type_diagnostics')}>{t('maintlog_event_type_diagnostics')}</MenuItem>
              <MenuItem value={t('maintlog_event_type_other')}>{t('maintlog_event_type_other')}</MenuItem>
            </Select>
          </FormControl>
          <TextField margin="dense" name="description" label={t('maintlog_dialog_desc_placeholder')} fullWidth multiline rows={4} variant="outlined" value={newEvent.description} onChange={handleInputChange} />
          <TextField margin="dense" name="nextServiceDate" label={t('maintlog_dialog_next_service_date')} type="date" fullWidth InputLabelProps={{ shrink: true }} variant="outlined" value={newEvent.nextServiceDate} onChange={handleInputChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common_cancel')}</Button>
          <Button onClick={handleSaveEvent} variant="contained">{t('common_save')}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default MaintenanceLogPage;