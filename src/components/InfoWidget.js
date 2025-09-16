// src/components/InfoWidget.js

import React, { useState, useEffect } from 'react';
import { Paper, Typography, IconButton } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import RefreshIcon from '@mui/icons-material/Refresh';

// ✅ РОЗШИРЕНИЙ СПИСОК ФАКТІВ
const FACTS = [
  'El agua caliente se congela más rápido que el agua fría, un fenómeno conocido como el efecto Mpemba.',
  'Los pulpos tienen tres corazones y su sangre es de color azul.',
  'El corazón de una ballena azul es tan grande que un ser humano podría nadar por sus arterias.',
  'Originalmente, la Coca-Cola era de color verde.',
  'Es imposible tararear mientras te tapas la nariz.',
  'La lavadora fue inventada en 1797 por Nathaniel Briggs.',
  'Un ciclo de lavado promedio utiliza entre 50 y 100 litros de agua.',
  'Las hormigas no duermen. Descansan en períodos de 8 minutos dos veces al día.',
  'El sonido no puede viajar por el vacío del espacio.',
  'Las estrellas de mar no tienen cerebro.',
  'Un caracol puede dormir durante tres años seguidos.',
  'La miel es el único alimento que no se estropea. Se han encontrado vasijas de miel en tumbas egipcias que todavía eran comestibles.',
  'El ojo de un avestruz es más grande que su cerebro.',
  'Los koalas duermen hasta 22 horas al día.',
  'El material más resistente creado por la naturaleza es la tela de araña.',
  'Los pingüinos pueden saltar hasta 1,8 metros de altura.',
  'La Torre Eiffel puede ser 15 cm más alta durante el verano debido a la expansión térmica del hierro.',
  'Los tiburones han existido por más tiempo que los árboles.',
  'Un rayo puede alcanzar temperaturas cinco veces superiores a las de la superficie del Sol.',
  'El primer video subido a YouTube se llamó "Me at the zoo".'
];

export default function InfoWidget() {
  // ✅ Зберігаємо індекс в localStorage, щоб не повторювати факти
  const [factIndex, setFactIndex] = useState(() => {
    const savedIndex = localStorage.getItem('last_fact_index');
    return savedIndex ? parseInt(savedIndex, 10) : Math.floor(Math.random() * FACTS.length);
  });

  useEffect(() => {
    localStorage.setItem('last_fact_index', factIndex);
  }, [factIndex]);

  const showNextFact = () => {
    setFactIndex((prevIndex) => (prevIndex + 1) % FACTS.length);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mt: 4,
        borderRadius: '12px',
        backgroundColor: '#e3f2fd',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <LightbulbIcon sx={{ color: '#1976d2', fontSize: '2rem', flexShrink: 0 }} />
      <Typography variant="body2" sx={{ flexGrow: 1, textAlign: 'left' }}>
        <strong>Dato Curioso:</strong> {FACTS[factIndex]}
      </Typography>
      <IconButton onClick={showNextFact} size="small" title="Mostrar otro dato">
        <RefreshIcon />
      </IconButton>
    </Paper>
  );
}