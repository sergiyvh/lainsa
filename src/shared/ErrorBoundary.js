// src/shared/ErrorBoundary.js
import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, err };
  }

  componentDidCatch(err, info) {
    // Можна записати в лог-файл у майбутньому
    console.error('[ErrorBoundary]', err, info);
  }

  handleReload = () => {
    // Перезавантажує рендерер
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Box sx={{ p: 2 }}>
        <Paper elevation={2} sx={{ p: 3, borderRadius: '12px' }}>
          <Typography variant="h6" gutterBottom>
            Сталася помилка під час відображення сторінки.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Перезавантаж сторінку. Якщо помилка повторюється — напиши, яку саме дію ти зробив перед цим.
          </Typography>
          <Button variant="contained" onClick={this.handleReload}>
            Перезавантажити
          </Button>
          {this.state.err && (
            <Typography variant="caption" display="block" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
              {String(this.state.err?.message || this.state.err)}
            </Typography>
          )}
        </Paper>
      </Box>
    );
  }
}
