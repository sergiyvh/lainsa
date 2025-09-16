// src/services/storageService.js

// Перевіряємо, чи ми в середовищі Electron, де доступний API, визначений у preload.js
const storageAPI = window.electronAPI;

/**
 * Перетворює ключ на ім'я файлу (наприклад, 'users' -> 'users.json')
 * @param {string} key - Ключ даних.
 * @returns {string} - Назва файлу.
 */
const getKeyFileName = (key) => `${key}.json`;

/**
 * Отримує дані.
 * Пріоритет: Electron File System.
 * Запасний варіант: localStorage (для веб-версії/мобільної версії).
 * @param {string} key - Ключ даних (наприклад, 'users', 'lainsa_records').
 * @returns {Promise<any>} - Повертає розпарсені дані або null.
 */
export const getData = async (key) => {
  try {
    if (storageAPI) {
      // --- Логіка для Electron ---
      const data = await storageAPI.readDataFile(getKeyFileName(key));
      return data; // readDataFile вже повертає розпарсений JSON або null
    } else {
      // --- Логіка для веб-браузера ---
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    console.error(`Error reading data for key [${key}]:`, error);
    return null;
  }
};

/**
 * Зберігає дані.
 * Пріоритет: Electron File System.
 * Запасний варіант: localStorage.
 * @param {string} key - Ключ даних.
 * @param {any} data - Дані для збереження.
 * @returns {Promise<void>}
 */
export const saveData = async (key, data) => {
  try {
    if (storageAPI) {
      // --- Логіка для Electron ---
      await storageAPI.writeDataFile({ fileName: getKeyFileName(key), data: data });
    } else {
      // --- Логіка для веб-браузера ---
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error(`Error saving data for key [${key}]:`, error);
  }
};

/**
 * Отримує елемент поточної сесії (для 'currentUser' та 'current_shift').
 * Для сесійних даних ми можемо залишити localStorage, оскільки це тимчасові дані,
 * або використовувати цей самий сервіс, якщо хочемо зберігати їх у файлах.
 * Для уніфікації переведемо все на нову систему.
 */
export const getSessionItem = async (key) => {
    return await getData(key);
};

export const saveSessionItem = async (key, data) => {
    await saveData(key, data);
};

export const removeSessionItem = async (key) => {
    await saveData(key, null); // Ефективно видаляємо, зберігаючи null або порожній об'єкт
};