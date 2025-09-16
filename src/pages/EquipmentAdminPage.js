import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import { getData, saveData } from '../services/storageService';
import { useI18n } from '../i18n/i18n';

const EquipmentAdminPage = () => {
  const { t } = useI18n();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState({ id: null, name: '', type: '', model: '', location: '' });

  useEffect(() => {
    const loadEquipment = async () => {
      setLoading(true);
      const data = await getData('equipment') || [];
      setEquipment(data);
      setLoading(false);
    };
    loadEquipment();
  }, []);

  const handleOpenDialog = (item = null) => {
    setCurrentItem(item || { id: null, name: '', type: '', model: '', location: '' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleSave = async () => {
    let updatedEquipment = [...equipment];
    if (currentItem.id) {
      updatedEquipment = equipment.map(item => item.id === currentItem.id ? currentItem : item);
    } else {
      updatedEquipment.push({ ...currentItem, id: Date.now() });
    }
    await saveData('equipment', updatedEquipment);
    setEquipment(updatedEquipment);
    handleCloseDialog();
  };
  
  const handleDelete = async (id) => {
    if (window.confirm(t('confirm_delete_equipment'))) {
      const updatedEquipment = equipment.filter(item => item.id !== id);
      await saveData('equipment', updatedEquipment);
      setEquipment(updatedEquipment);
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
        <Typography variant="h4">{t('equipment_title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          {t('equipment_add')}
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('equipment_col_name')}</TableCell>
              <TableCell>{t('equipment_col_type')}</TableCell>
              <TableCell>{t('equipment_col_model')}</TableCell>
              <TableCell>{t('equipment_col_location')}</TableCell>
              <TableCell align="right">{t('labels_actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {equipment.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.model}</TableCell>
                <TableCell>{item.location}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(item)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(item.id)}><DeleteIcon color="error" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentItem.id ? t('equipment_dialog_edit_title') : t('equipment_dialog_add_title')}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="name" label={t('equipment_col_name')} type="text" fullWidth variant="outlined" value={currentItem.name} onChange={handleInputChange} />
          <TextField margin="dense" name="type" label={t('equipment_dialog_type_placeholder')} type="text" fullWidth variant="outlined" value={currentItem.type} onChange={handleInputChange} />
          <TextField margin="dense" name="model" label={t('equipment_col_model')} type="text" fullWidth variant="outlined" value={currentItem.model} onChange={handleInputChange} />
          <TextField margin="dense" name="location" label={t('equipment_col_location')} type="text" fullWidth variant="outlined" value={currentItem.location} onChange={handleInputChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common_cancel')}</Button>
          <Button onClick={handleSave}>{t('common_save')}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EquipmentAdminPage;