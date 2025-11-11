// src/data/programNames.js

// Словник, що пов'язує технічний ключ програми з її повною назвою
export const PROGRAM_NAMES = {
  pro1: 'Pro.1 - sábanas',
  pro2: 'Pro.2 - sábana nueva',
  pro3: 'Pro.3 - toalla nueva',
  pro4: 'Pro.4 - mantelería',
  pro6: 'Pro.6 - toallas espigas/rayas',
  pro8: 'Pro.8 - toallas color',
  pro9: 'Pro.9 - nórdicos',
  pro10: 'Pro.10 - premium',
  pro14: 'Pro.14 - albornoces',
  // Також можна додати програми відбраковки, якщо вони знадобляться
  r11: 'Pro.11 - rechazo sáb',
  r12: 'Pro.12 - rechazo mant',
  r13: 'Pro.13 - rechazo toalla',
  rotas: 'Rotas - limpieza',
};

/**
 * Допоміжна функція для отримання повної назви за ключем.
 * Якщо назва не знайдена, повертає сам ключ.
 * @param {string} key - Технічний ключ, напр. "pro1".
 * @returns {string} - Повна назва, напр. "Pro.1 - sábanas".
 */
export const getProgramName = (key) => PROGRAM_NAMES[key] || key;