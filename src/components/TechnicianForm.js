// src/components/TechnicianForm.js
import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, TextField, Button, Select, MenuItem, FormControl, InputLabel, Paper } from '@mui/material';

const DAYS_IN_MONTH = 31;

const shifts = [
  {value: 'maniana', label: 'Ранкова зміна'},
  {value: 'tarde', label: 'Вечірня зміна'},
];

function EditableTable({ data, setData, updateCell }) {
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>День</TableCell>
            {data[0].values.map((_, i) => <TableCell key={i}>Показник {i+1}</TableCell>)}
            <TableCell>Зміна</TableCell>
            <TableCell>Відповідальний</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell>{row.day}</TableCell>
              {row.values.map((cell, colIndex) => 
                <TableCell key={colIndex}>
                  <TextField
                    variant="standard"
                    type="number"
                    value={cell}
                    onChange={e => updateCell(data, setData, rowIndex, colIndex, e.target.value)}
                    sx={{ width: '80px' }}
                  />
                </TableCell>
              )}
              <TableCell>{row.shift}</TableCell>
              <TableCell>{row.user}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function TechnicianForm({ user }) {
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedShift, setSelectedShift] = useState('maniana');

  const initData = () => Array.from({length: DAYS_IN_MONTH}, (_, i) => ({
    day: i + 1,
    values: Array(5).fill(''), // Зміни кількість колонок по потребі
    shift: '',
    user: '',
  }));

  const [dataPieza1, setDataPieza1] = useState(() =>
    JSON.parse(localStorage.getItem('pieza1')) || initData()
  );
  const [dataPieza2, setDataPieza2] = useState(() =>
    JSON.parse(localStorage.getItem('pieza2')) || initData()
  );
  const [dataGrandes, setDataGrandes] = useState(() =>
    JSON.parse(localStorage.getItem('grandes')) || initData()
  );

  const updateCell = (data, setData, rowIndex, colIndex, value) => {
    const newData = [...data];
    newData[rowIndex].values[colIndex] = value;
    newData[rowIndex].shift = selectedShift;
    newData[rowIndex].user = user?.username || 'anon';
    setData(newData);
  };

  const saveData = () => {
    localStorage.setItem('pieza1', JSON.stringify(dataPieza1));
    localStorage.setItem('pieza2', JSON.stringify(dataPieza2));
    localStorage.setItem('grandes', JSON.stringify(dataGrandes));
    alert('Дані збережено!');
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} aria-label="Технічні таблиці">
        <Tab label="Pieza 1" />
        <Tab label="Pieza 2" />
        <Tab label="Grandes" />
      </Tabs>

      <FormControl sx={{ mt: 2, minWidth: 180 }}>
        <InputLabel>Зміна</InputLabel>
        <Select value={selectedShift} label="Зміна" onChange={e => setSelectedShift(e.target.value)}>
          {shifts.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
        </Select>
      </FormControl>

      {tabIndex === 0 &&
        <EditableTable data={dataPieza1} setData={setDataPieza1} updateCell={updateCell} />}
      {tabIndex === 1 &&
        <EditableTable data={dataPieza2} setData={setDataPieza2} updateCell={updateCell} />}
      {tabIndex === 2 &&
        <EditableTable data={dataGrandes} setData={setDataGrandes} updateCell={updateCell} />}

      <Button variant="contained" onClick={saveData} sx={{ mt: 3 }}>
        Зберегти всі дані
      </Button>
    </Box>
  );
}
