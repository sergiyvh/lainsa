import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TabsWrapper from '../components/TabsWrapper'; // Переконайтесь, що шлях правильний

export default function FormNew({ user }) {
  const [activeShift, setActiveShift] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const shiftData = localStorage.getItem('current_shift');
    if (shiftData) {
      setActiveShift(JSON.parse(shiftData));
    } else {
      // Якщо активної зміни немає, не дозволяємо бути на цій сторінці
      alert('No hay un turno activo. Abriendo un nuevo turno...');
      navigate('/open-shift');
    }
  }, [navigate]);

  if (!activeShift) {
    // Поки дані завантажуються, показуємо заглушку
    return <div>Cargando datos del turno...</div>;
  }

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <h2>PARTE DE PRODUCCIÓN (Turno Activo)</h2>
      <p>
        <strong>Fecha:</strong> {activeShift.fecha} | 
        <strong>Turno:</strong> {activeShift.turno} | 
        <strong>Operadores:</strong> {activeShift.operators.join(', ')}
      </p>
      <TabsWrapper user={user} shiftData={activeShift} />
    </div>
  );
}