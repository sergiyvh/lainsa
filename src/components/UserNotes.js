// src/components/UserNotes.js (оновлена версія)

import React, { useState, useEffect } from 'react';
import { Paper, Typography, TextField, Button, List, ListItem, ListItemText, Divider, Box } from '@mui/material';
import AddCommentIcon from '@mui/icons-material/AddComment';

export default function UserNotes() {
  // Ваша логіка залишається без змін
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('techNotes') || '[]');
    setNotes(stored);
  }, []);

  const addNote = () => {
    if (newNote.trim() === '') return;
    const noteObj = {
      id: Date.now(),
      text: newNote.trim(),
      date: new Date().toLocaleString('es-ES'), // Форматуємо дату
    };
    const updated = [noteObj, ...notes];
    setNotes(updated);
    localStorage.setItem('techNotes', JSON.stringify(updated));
    setNewNote('');
  };

  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: '12px', maxWidth: 600, margin: '1rem auto' }}>
      <Typography variant="h6" gutterBottom>Observaciones para operadores</Typography>
      <Box component="form" onSubmit={(e) => { e.preventDefault(); addNote(); }}>
        <TextField
          label="Escribe una nota para los operadores"
          multiline
          rows={3}
          fullWidth
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          variant="outlined"
          margin="normal"
        />
        <Button
          type="submit"
          variant="contained"
          startIcon={<AddCommentIcon />}
        >
          Añadir Nota
        </Button>
      </Box>
      <List sx={{ mt: 2, maxHeight: 300, overflowY: 'auto' }}>
        {notes.length === 0 && <Typography color="text.secondary" sx={{ p: 2 }}>No hay notas</Typography>}
        {notes.map((note, index) => (
          <React.Fragment key={note.id}>
            <ListItem alignItems="flex-start">
              <ListItemText
                primary={note.text}
                secondary={`— ${note.date}`}
              />
            </ListItem>
            {index < notes.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
}