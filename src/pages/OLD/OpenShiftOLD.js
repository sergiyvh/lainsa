import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OpenShift() {
  const [turno, setTurno] = useState('maniana'); // 'maniana' or 'tarde'
  const [allUsers, setAllUsers] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Завантажуємо список всіх користувачів при завантаженні сторінки
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    setAllUsers(users);
  }, []);

  // Обробник зміни вибору операторів
  const handleOperatorChange = (username) => {
    setSelectedOperators(prev => 
      prev.includes(username) 
        ? prev.filter(op => op !== username) // Видалити, якщо вже вибраний
        : [...prev, username] // Додати, якщо не вибраний
    );
  };

  // Головна функція - початок зміни
  const handleStartShift = () => {
    if (selectedOperators.length === 0) {
      setError('Por favor, selecciona al menos un operador.');
      return;
    }

    // Створюємо унікальний ID для нового запису
    const newRecordId = Date.now();

    // Створюємо початковий об'єкт для нової зміни
    const newShiftData = {
      id: newRecordId,
      fecha: new Date().toISOString().slice(0, 10), // Сьогоднішня дата
      turno: turno,
      operators: selectedOperators,
      createdAt: new Date().toISOString(),
      // Створюємо пусті об'єкти для даних, які будуть заповнюватися в TabsWrapper
      tunel: {},
      rech_tunel: {},
      lav_ciclos: {},
      lav_rechazos: {},
      cont: {}
    };

    // Зберігаємо цей об'єкт як "активну зміну"
    localStorage.setItem('current_shift', JSON.stringify(newShiftData));
    
    // Перенаправляємо користувача на сторінку для введення даних
    navigate('/form');
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem', border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Abrir un Nuevo Turno</h2>
      
      {/* Вибір зміни */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4>Selecciona el Turno</h4>
        <select value={turno} onChange={(e) => setTurno(e.target.value)} style={{ width: '100%', padding: 8 }}>
          <option value="mañana">Turno Mañana (06:00 – 14:00)</option>
          <option value="tarde">Turno Tarde (14:00 – 22:00)</option>
        </select>
      </div>

      {/* Вибір операторів */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4>Selecciona los Operadores</h4>
        <div style={{ border: '1px solid #ddd', padding: 10, borderRadius: 4, maxHeight: 200, overflowY: 'auto' }}>
          {allUsers.map(user => (
            <div key={user.username}>
              <input 
                type="checkbox"
                id={`user-${user.username}`}
                checked={selectedOperators.includes(user.username)}
                onChange={() => handleOperatorChange(user.username)}
              />
              <label htmlFor={`user-${user.username}`} style={{ marginLeft: 8 }}>{user.username} ({user.role})</label>
            </div>
          ))}
        </div>
      </div>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <button 
        onClick={handleStartShift}
        style={{ width: '100%', padding: '12px', fontSize: '1.2rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
      >
        Empezar Turno
      </button>
    </div>
  );
}