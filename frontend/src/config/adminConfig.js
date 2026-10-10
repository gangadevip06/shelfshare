// config/adminConfig.js
// -----------------------------------------------------------------------
// ShelfShare has exactly one admin account. There is no admin
// self-registration flow — the credentials below are fixed and are never
// displayed anywhere in the UI (not on the login page, not in any
// dropdown or placeholder). Only the person who deployed this project is
// meant to know them. Change them here before handing the project to
// anyone else, or before a real deployment.
// -----------------------------------------------------------------------
export const ADMIN_ACCOUNT = {
  id: 'admin-001',
  name: 'ShelfShare Admin',
  email: 'admin@shelfshare.local',
  password: 'Shelf@Admin2026',
  role: 'admin',
}
