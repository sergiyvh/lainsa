import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LicensePage = () => {
  const [licenseText, setLicenseText] = useState('');

  useEffect(() => {
    // Завантажуємо текст ліцензії з файлу /public/license.txt
    fetch('/license.txt')
      .then(response => response.text())
      .then(text => setLicenseText(text))
      .catch(error => console.error('Error fetching license:', error));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>Acuerdo de licencia</h2>
      <pre style={{ 
        whiteSpace: 'pre-wrap', 
        wordWrap: 'break-word', 
        border: '1px solid #ccc', 
        padding: '15px', 
        backgroundColor: '#f9f9f9',
        maxHeight: '60vh',
        overflowY: 'auto'
      }}>
        {licenseText || 'Descargar el texto de la licencia...'}
      </pre>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link to="/">Regresar a la página de inicio de sesión</Link>
      </div>
    </div>
  );
};

export default LicensePage;