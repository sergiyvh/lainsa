import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ExcelExport from '../components/ExcelExport';
import PdfExport from '../components/PdfExport';

const shiftNames = { 'maniana': 'Diurno', 'tarde': 'Vespertino' };

export default function Archive({ user }) {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('lainsa_records') || '[]');
    setRecords(data.sort((a, b) => b.id - a.id));
  }, []);

  const filteredRecords = records.filter(r => {
    if (filterDate && r.fecha !== filterDate) return false;
    if (filterShift && r.turno !== filterShift) return false;
    
    // Оновлена логіка пошуку по операторах
    if (search) {
      const searchTerm = search.toLowerCase();
      // Перевіряємо, чи хоча б один оператор у масиві відповідає пошуку
      const hasMatchingOperator = r.operators?.some(op => op.toLowerCase().includes(searchTerm));
      if (!hasMatchingOperator) return false;
    }
    
    return true;
  });

  const handleDelete = id => {
    if (!window.confirm('¿Seguro que quieres eliminar este registro?')) return;
    const updated = records.filter(r => r.id !== id);
    localStorage.setItem('lainsa_records', JSON.stringify(updated));
    setRecords(updated);
  };

  const handleView = id => {
    navigate(`/view?id=${id}`);
  };

  const getCiclosTotal = (record) => {
    if (!record.lav_ciclos) return 0;
    if (typeof record.lav_ciclos === 'object') {
      return Object.values(record.lav_ciclos).reduce((acc, val) => acc + (Number(val) || 0), 0);
    }
    return Number(record.lav_ciclos) || 0;
  };

  const getRechazosTotal = (record) => {
    if (!record.lav_rechazos) return 0;
    if (typeof record.lav_rechazos === 'object') {
      return Object.values(record.lav_rechazos).reduce((acc, val) => acc + (Number(val) || 0), 0);
    }
    return Number(record.lav_rechazos) || 0;
  };

  const exportData = filteredRecords.map(rec => ({
    Fecha: rec.fecha,
    Turno: shiftNames[rec.turno] || rec.turno,
    Operadores: rec.operators?.join(', ') || '', // Змінено з Usuario на Operadores
    'Producción (kg)': rec.tunel?.total || 0,
    'Rechazo (kg)': getRechazosTotal(rec),
    'Ciclos': getCiclosTotal(rec),
  }));

  return (
    <div>
      <h2>Archivo</h2>

      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Buscar por operador..." // Оновлений плейсхолдер
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginRight: 8, padding: 6 }}
        />
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{ marginRight: 8, padding: 6 }}
        />
        <select
          value={filterShift}
          onChange={e => setFilterShift(e.target.value)}
          style={{ padding: 6 }}
        >
          <option value="">Todos</option>
          <option value="maniana">Diurno</option>
          <option value="tarde">Vespertino</option>
        </select>
      </div>

      <table border="1" cellPadding="5" cellSpacing="0" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Turno</th>
            <th>Operadores</th> {/* Змінено з Usuario */}
            <th>Producción (kg)</th>
            <th>Rechazo (kg)</th>
            <th>Ciclos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>No hay datos</td>
            </tr>
          ) : (
            filteredRecords.map(rec => (
              <tr key={rec.id}>
                <td>{rec.fecha}</td>
                <td>{shiftNames[rec.turno] || rec.turno}</td>
                <td>{rec.operators?.join(', ') || ''}</td> {/* Змінено з rec.user */}
                <td>{rec.tunel?.total || 0}</td>
                <td>{getRechazosTotal(rec)}</td>
                <td>{getCiclosTotal(rec)}</td>
                <td>
                  <button onClick={() => handleView(rec.id)} style={{ marginRight: 4 }}>Ver</button>
                  <button onClick={() => handleDelete(rec.id)} style={{ color: 'red' }}>Eliminar</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div style={{ marginTop: 12 }}>
        <ExcelExport data={exportData} fileName={`Archivo_${new Date().toISOString().slice(0,10)}`} />
        <PdfExport data={exportData} fileName={`Archivo_${new Date().toISOString().slice(0,10)}`} />
      </div>
    </div>
  );
}

// --- Секція стилів залишається без змін ---

const box = {
  border: "1px solid #ccc",
  padding: "20px",
  borderRadius: "8px",
  marginBottom: "20px"
};

const sectionTitle = {
  borderBottom: "2px solid #004080",
  paddingBottom: "8px",
  marginBottom: "16px",
  fontSize: "1.25rem",
  fontWeight: "700",
  color: "#004080",
  fontFamily: "Arial, sans-serif"
};

const listStyle = {
  listStyleType: "none",
  paddingLeft: 0,
  marginBottom: "12px",
  fontSize: "1.05rem",
  color: "#333",
  fontFamily: "Verdana, sans-serif"
};

const buttonStyle = {
  padding: "10px 20px",
  cursor: "pointer",
  fontSize: "16px",
  backgroundColor: "#004080",
  color: "white",
  border: "none",
  borderRadius: "6px",
  display: "block",
  margin: "0 auto"
};