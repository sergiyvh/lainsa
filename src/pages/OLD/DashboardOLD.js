import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Стилі для кнопок
const buttonStyle = {
  padding: '20px 40px',
  fontSize: '1.5rem',
  cursor: 'pointer',
  borderRadius: '8px',
  border: 'none',
  color: 'white',
  fontWeight: 'bold',
};

export default function Dashboard({ user }) {
  const [activeShift, setActiveShift] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Перевіряємо, чи є збережена активна зміна в localStorage
    const shiftData = localStorage.getItem('current_shift');
    if (shiftData) {
      setActiveShift(JSON.parse(shiftData));
    }
  }, []);

  // Функція для кнопки "Відкрити зміну"
  const handleOpenShift = () => {
    navigate('/open-shift');
  };

  // Функція для кнопки "Поточна зміна"
  const handleResumeShift = () => {
    navigate('/form');
  };

  // Функція для кнопки "Закрити зміну"
  const handleCloseShift = () => {
    if (!window.confirm('¿Estás seguro de que quieres cerrar el turno actual? Todos los datos se guardarán en el archivo.')) {
      return;
    }
    
    const currentShift = JSON.parse(localStorage.getItem('current_shift'));
    const allRecords = JSON.parse(localStorage.getItem('lainsa_records') || '[]');

    currentShift.closedAt = new Date().toISOString();

    allRecords.push(currentShift);
    localStorage.setItem('lainsa_records', JSON.stringify(allRecords));

    localStorage.removeItem('current_shift');
    
    setActiveShift(null);

    alert('Turno cerrado y guardado en el archivo correctamente.');
    navigate(`/view?id=${currentShift.id}`);
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Panel de Control</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '4rem' }}>¡Bienvenido, {user.username}!</p>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
        {activeShift ? (
          // Блок, що показується, ЯКЩО є активна зміна
          <>
            <button 
              onClick={handleResumeShift} 
              style={{ ...buttonStyle, backgroundColor: '#007bff' }}
            >
              Turno Actual
            </button>
            <button 
              onClick={handleCloseShift} 
              style={{ ...buttonStyle, backgroundColor: '#dc3545' }}
            >
              Cerrar Turno
            </button>
          </>
        ) : (
          // Блок, що показується, ЯКЩО НЕМАЄ активної зміни
          <button 
            onClick={handleOpenShift} 
            style={{ ...buttonStyle, backgroundColor: '#28a745' }}
          >
            Abrir Turno
          </button>
        )}
      </div>
    </div>
  );
}