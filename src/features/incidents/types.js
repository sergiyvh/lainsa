// src/features/incidents/types.js
/**
 * @typedef {Object} Incident
 * @property {string} id
 * @property {'client'|'technical'|'logistics'} type
 * @property {string} client
 * @property {string} description
 * @property {string} dateISO        // ISO string
 * @property {{name?: string, role?: 'operator'|'technician'|'supervisor'}} createdBy
 * @property {{ name: string, dataUrl: string } | null} photo
 */
