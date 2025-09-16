// src/pages/StaffDirectory.js
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Select, MenuItem, FormControl, InputLabel, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getData, saveData } from '../services/storageService';
import { useI18n } from '../i18n/i18n';

// Ви можете розширити цей список відділів
const DEPARTMENTS = [
    'General',
    'SECADOR/A Y/O CARGA TÚNEL',
    'CONTROL DE TÚNEL',
    'CHÓFER',
    'Mantenimiento',
    'Administración'
];

const StaffDirectoryPage = () => {
  const { t } = useI18n();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  useEffect(() => {
    const loadStaff = async () => {
      setLoading(true);
      const data = await getData('staff') || [];
      setStaff(data);
      setLoading(false);
    };
    loadStaff();
  }, []);

  const handleOpenDialog = (item = null) => {
    setCurrentItem(item || { id: null, name: '', department: 'General', position: '', status: 'active' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleSave = async () => {
    if (!currentItem || !currentItem.name) {
      alert("Please enter the employee's name.");
      return;
    }
    let updatedStaff = [...staff];
    if (currentItem.id) {
      updatedStaff = staff.map(item => item.id === currentItem.id ? currentItem : item);
    } else {
      updatedStaff.push({ ...currentItem, id: Date.now() });
    }
    await saveData('staff', updatedStaff);
    setStaff(updatedStaff);
    handleCloseDialog();
  };
  
  const handleDelete = async (id) => {
    if (window.confirm(t('confirm_delete_staff'))) {
      const updatedStaff = staff.filter(item => item.id !== id);
      await saveData('staff', updatedStaff);
      setStaff(updatedStaff);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <CircularProgress />;

  return (
    <Paper sx={{ p: 2, borderRadius: '12px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">{t('staff_directory_title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          {t('staff_add')}
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('staff_col_name')}</TableCell>
              <TableCell>{t('staff_col_department')}</TableCell>
              <TableCell>{t('staff_col_position')}</TableCell>
              <TableCell>{t('staff_col_status')}</TableCell>
              <TableCell align="right">{t('labels_actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.map((item) => (
              <TableRow key={item.id}>
                <TableCell component="th" scope="row">{item.name}</TableCell>
                <TableCell>{item.department}</TableCell>
                <TableCell>{item.position}</TableCell>
                <TableCell>
                  <Chip
                    label={item.status === 'active' ? t('staff_status_active') : t('staff_status_inactive')}
                    color={item.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(item)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(item.id)}><DeleteIcon color="error" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {currentItem && (
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>{currentItem.id ? t('staff_edit') : t('staff_add')}</DialogTitle>
          <DialogContent>
            <TextField autoFocus margin="dense" name="name" label={t('staff_col_name')} type="text" fullWidth variant="outlined" value={currentItem.name} onChange={handleInputChange} />
            <FormControl fullWidth margin="dense">
              <InputLabel>{t('staff_col_department')}</InputLabel>
              <Select name="department" value={currentItem.department} label={t('staff_col_department')} onChange={handleInputChange}>
                {DEPARTMENTS.map(dep => <MenuItem key={dep} value={dep}>{dep}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField margin="dense" name="position" label={t('staff_col_position')} type="text" fullWidth variant="outlined" value={currentItem.position} onChange={handleInputChange} />
            <FormControl fullWidth margin="dense">
              <InputLabel>{t('staff_col_status')}</InputLabel>
              <Select name="status" value={currentItem.status} label={t('staff_col_status')} onChange={handleInputChange}>
                <MenuItem value="active">{t('staff_status_active')}</MenuItem>
                <MenuItem value="inactive">{t('staff_status_inactive')}</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t('common_cancel')}</Button>
            <Button onClick={handleSave}>{t('common_save')}</Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  );
};

export default StaffDirectoryPage;