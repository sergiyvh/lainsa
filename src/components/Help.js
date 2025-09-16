// components/Help.js
import React from 'react';

export default function Help({ isOpen, onClose }) {
  if (!isOpen) return null;

  const backdropStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1000
  };

  const modalStyle = {
    backgroundColor: 'white', padding: 24, borderRadius: 8,
    maxWidth: 500, maxHeight: '80vh', overflowY: 'auto'
  };

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <h2>Інструкція користувача</h2>
        <ol>
          <li>Зареєструйтесь і увійдіть у систему.</li>
          <li>На Dashboard ви бачите огляд ключових метрик.</li>
          <li>Створіть новий звіт у розділі «Nuevo Registro».</li>
          <li>Переглядайте і фільтруйте записи в «Archivo» і «Reportes».</li>
          <li>Використовуйте кнопки експорту для збереження PDF або Excel.</li>
          <li>Адміністратори можуть керувати користувачами у «Usuarios».</li>
          <li>Завжди можна звернутися по допомогу тут.</li>
        </ol>
        <button onClick={onClose} style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}>Закрити</button>
      </div>
    </div>
  );
}
