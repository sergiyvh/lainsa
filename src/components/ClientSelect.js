import React from 'react';
import { CLIENTS } from '../data/clients';

export default function ClientSelect({ value, onChange }) {
  return (
    <div>
      <label>Cliente (código):</label><br />
      <select value={value?.code || ''} onChange={e => {
        const code = Number(e.target.value);
        const item = CLIENTS.find(c => c.code === code) || null;
        onChange(item);
      }}>
        <option value="">Seleccione cliente</option>
        {CLIENTS.map(c => (
          <option key={c.code} value={c.code}>{c.name} — {c.code}</option>
        ))}
      </select>
    </div>
  );
}
