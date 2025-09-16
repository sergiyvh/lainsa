import React, { useState, useEffect, useMemo } from 'react';
import ExcelExport from '../components/ExcelExport';
import PdfMakeExport from '../components/PdfMakeExport';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#0088FE', '#FF8042', '#00C49F'];

const shiftNames = { maniana: 'Turno Mañana', tarde: 'Turno Tarde' };

function getISOWeekNumber(date) {
  const tmpDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmpDate.getUTCDay() || 7;
  tmpDate.setUTCDate(tmpDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmpDate.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmpDate - yearStart) / 86400000 + 1) / 7);
}

export default function Reports({ user, onLogout }) {
  const [rows, setRows] = useState([]);
  const [period, setPeriod] = useState('day');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [summary, setSummary] = useState({ produccion: 0, rechazo: 0, ciclos: 0 });

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('lainsa_records') || '[]');
    setRows(data);
  }, []);

  useEffect(() => {
    if (!rows.length) {
      setSummary({ produccion: 0, rechazo: 0, ciclos: 0 });
      return;
    }

    let filtered = rows;

    if (selectedShift) filtered = filtered.filter(r => r.turno === selectedShift);
    if (selectedUser) filtered = filtered.filter(r => r.user === selectedUser);

    filtered = filtered.filter(item => {
      const itemDate = new Date(item.fecha);
      const selDate = new Date(selectedDate);
      if (period === 'day') {
        return item.fecha === selectedDate;
      } else if (period === 'week') {
        const itemWeek = getISOWeekNumber(itemDate);
        const selWeek = getISOWeekNumber(selDate);
        return itemDate.getUTCFullYear() === selDate.getUTCFullYear() && itemWeek === selWeek;
      } else if (period === 'month') {
        return itemDate.getUTCFullYear() === selDate.getUTCFullYear() && itemDate.getMonth() === selDate.getMonth();
      }
      return false;
    });

    let sumProduccion = 0;
    let sumRechazo = 0;
    let sumCiclos = 0;

    filtered.forEach(item => {
      sumProduccion += Number(item.tunel?.total) || 0;
      sumRechazo += item.lav_rechazos
        ? Object.values(item.lav_rechazos).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0)
        : Number(item.rechazo) || 0;
      sumCiclos += item.lav_ciclos
        ? Object.values(item.lav_ciclos).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0)
        : Number(item.ciclos) || 0;
    });

    setSummary({
      produccion: sumProduccion,
      rechazo: sumRechazo,
      ciclos: sumCiclos
    });

  }, [rows, period, selectedDate, selectedShift, selectedUser]);

  const data = [
    { name: 'Producción', value: summary.produccion },
    { name: 'Rechazo', value: summary.rechazo },
    { name: 'Ciclos', value: summary.ciclos }
  ].filter(item => item.value > 0);

  const exportData = useMemo(() => {
    let filtered = rows;

    if (selectedShift) filtered = filtered.filter(r => r.turno === selectedShift);
    if (selectedUser) filtered = filtered.filter(r => r.user === selectedUser);

    filtered = filtered.filter(item => {
      const itemDate = new Date(item.fecha);
      const selDate = new Date(selectedDate);
      if (period === 'day') return item.fecha === selectedDate;
      if (period === 'week') {
        const itemWeek = getISOWeekNumber(itemDate);
        const selWeek = getISOWeekNumber(selDate);
        return itemDate.getUTCFullYear() === selDate.getUTCFullYear() && itemWeek === selWeek;
      }
      if (period === 'month') return itemDate.getUTCFullYear() === selDate.getUTCFullYear() && itemDate.getMonth() === selDate.getMonth();
      return false;
    });

    return filtered.map(item => ({
      Fecha: item.fecha,
      Turno: shiftNames[item.turno] || 'N/A',
      Usuario: item.user || '',
      'Producción Total (kg)': Number(item.tunel?.total) || 0,
      'Rechazo Total (kg)': item.lav_rechazos
        ? Object.values(item.lav_rechazos).reduce((a, b) => a + (b || 0), 0)
        : Number(item.rechazo) || 0,
      'Total Ciclos': item.lav_ciclos
        ? Object.values(item.lav_ciclos).reduce((a, b) => a + (b || 0), 0)
        : Number(item.ciclos) || 0,
    }));
  }, [rows, selectedShift, selectedUser, selectedDate, period]);

  return (
    <div>
      <h2>Reportes</h2>

      <label>
        Periodo:
        <select value={period} onChange={e => setPeriod(e.target.value)} style={{ marginLeft: 6 }}>
          <option value="day">Día</option>
          <option value="week">Semana</option>
          <option value="month">Mes</option>
        </select>
      </label>

      <label style={{ marginLeft: 12 }}>
        Fecha:
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ marginLeft: 6 }} />
      </label>

      <label style={{ marginLeft: 12 }}>
        Turno:
        <select value={selectedShift} onChange={e => setSelectedShift(e.target.value)} style={{ marginLeft: 6 }}>
          <option value="">Todos</option>
          <option value="maniana">Turno Mañana</option>
          <option value="tarde">Turno Tarde</option>
        </select>
      </label>

      <label style={{ marginLeft: 12 }}>
        Usuario:
        <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} style={{ marginLeft: 6 }}>
          <option value="">Todos</option>
          {[...new Set(rows.map(r => r.user).filter(Boolean))].map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </label>

      <div style={{ marginTop: 12, fontWeight: 'bold' }}>
        <div>Producción total: {summary.produccion}</div>
        <div>Rechazo total: {summary.rechazo}</div>
        <div>Total ciclos: {summary.ciclos}</div>
      </div>

      {data.length === 0 ? (
        <p>No hay datos para mostrar.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}

      <div style={{ marginTop: 16 }}>
        <ExcelExport data={exportData} fileName={`Informe_${selectedDate}_${shiftNames[selectedShift] || 'Todos'}.xlsx`} />
        <PdfMakeExport data={exportData} fileName={`Informe_${selectedDate}_${shiftNames[selectedShift] || 'Todos'}.pdf`} />
      </div>
    </div>
  );
}
