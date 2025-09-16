// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; // ✅ Імпортуємо наш новий файл

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);

// ✅ Реєструємо service worker
serviceWorkerRegistration.register();