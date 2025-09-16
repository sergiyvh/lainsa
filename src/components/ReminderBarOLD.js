import React, { useEffect, useMemo, useState } from 'react';

const SHIFT_LABELS = {
  maniana: 'Turno Mañana',
  tarde: 'Turno Tarde'
};

function nextTwoHourTick(from = new Date()) {
  const d = new Date(from);
  const minutes = d.getMinutes();
  const addHours = 2 - ((d.getHours() % 2 + (minutes > 0 || d.getSeconds() > 0 ? 1 : 0)) % 2);
  d.setHours(d.getHours() + (addHours === 2 ? 0 : addHours));
  d.setMinutes(0); d.setSeconds(0); d.setMilliseconds(0);
  while (d <= from) d.setHours(d.getHours() + 2);
  return d;
}

export default function ReminderBar({ shift, role }) {
  const [now, setNow] = useState(new Date());
  const [nextFilterCleanAt, setNextFilterCleanAt] = useState(() => nextTwoHourTick());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (now >= nextFilterCleanAt) {
      if (role === 'operator') {
        alert('Recordatorio: Limpiar filtros de secadoras (cada 2 horas).');
      }
      setNextFilterCleanAt(nextTwoHourTick(now));
    }
  }, [now, nextFilterCleanAt, role]);

  const dailyNotes = useMemo(() => [
    'Sacar los contenedores de basura al final del día.',
    'Bolsas de pelusas: Sec 1 y 2 -> Turno Mañana; Sec 3 y 4 -> Turno Tarde.',
    'Sec. 5: Limpiar filtro 1 vez al turno.'
  ], []);

  return (
    <div style={{
      background: '#fff8e1',
      borderBottom: '1px solid #ffe0a3',
      padding: '8px 12px',
      fontSize: 14
    }}>
      <b>Notas técnicas — {SHIFT_LABELS[shift] || 'Turno'}</b>
      <ul style={{ margin: '6px 0 0 16px' }}>
        {dailyNotes.map((n, i) => <li key={i}>{n}</li>)}
      </ul>
      {role === 'operator' && (
        <div style={{ marginTop: 6, color: '#a15c00' }}>
          Próximo recordatorio de filtros: {nextFilterCleanAt.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
