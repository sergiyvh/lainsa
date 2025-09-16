// src/utils/initUsers.js
import { getData, saveData } from '../services/storageService';

export default async function initializeUsers() {
  const defaultUsers = [
      { id: 1, username: 'admin', password: 'admin', role: 'admin' },
      { id: 2, username: 'Dani', password: '12345', role: 'technician' },
      { id: 4, username: 'David', password: '12345', role: 'supervisor' },
      { id: 8, username: 'Serhii', password: '1202', role: 'operator' },
  ];

  try {
    const existingUsers = await getData('users');
    if (!existingUsers || existingUsers.length === 0) {
      console.log("Initializing default users...");
      await saveData('users', defaultUsers);
    }
  } catch (error) {
    console.error("Error initializing users:", error);
  }
}