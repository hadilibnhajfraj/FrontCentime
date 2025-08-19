// src/auth/authRoles.js
export const authRoles = {
  sa: ['SA'],
  admin: ['ADMIN'],        // ✅ Admin uniquement
  employee: ['EMPLOYEE'],  // ✅ Agent uniquement (nom clair et cohérent)
  client: ['CLIENT'],      // ✅ Client uniquement
  guest: ['SA', 'ADMIN', 'EDITOR', 'GUEST', 'EMPLOYEE', 'CLIENT'],
  user: ['ADMIN', 'EMPLOYEE', 'CLIENT'] // si tu veux un rôle commun
};
