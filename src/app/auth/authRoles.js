// src/auth/authRoles.js
export const authRoles = {
  sa: ['SA'],
  admin: ['ADMIN'],      // ✅ rôle attendu pour l'admin
  agent: ['AGENT'],
  client: ['CLIENT'],
  guest: ['SA', 'ADMIN', 'EDITOR', 'GUEST', 'AGENT', 'CLIENT'],
  user: ['ADMIN', 'AGENT', 'CLIENT'] // utile si tu veux un rôle commun
};
