// utils/storage.js
// -----------------------------------------------------------------------
// Single place that talks to localStorage. Every other file (api.js,
// AuthContext.jsx) goes through these functions instead of calling
// localStorage.getItem/setItem directly, so storage keys only live here.
// -----------------------------------------------------------------------

import { INITIAL_USERS } from '../data/mockData.js'

const KEYS = {
  registeredUsers: 'ss_registered_users',   // real user accounts (role: 'user')
  registeredAdmins: 'ss_registered_admins', // real admin accounts (role: 'admin')
  currentUser: 'ss_current_user',
  jwtToken: 'ss_jwt_token',
  resources: 'ss_resources',
  requests: 'ss_requests',
  categories: 'ss_categories',
  reports: 'ss_reports',
  messages: 'ss_messages',
  notifications: 'ss_notifications',
  wishlist: 'ss_wishlist',
}

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const writeJSON = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
  return value
}

// ---------------- Users & Admins (real, registered accounts) ----------------
export const getUsers = () => {
  const users = readJSON(KEYS.registeredUsers, null)
  if (!users || users.length === 0) {
    writeJSON(KEYS.registeredUsers, INITIAL_USERS)
    return INITIAL_USERS
  }
  return users
}
export const saveUsers = (users) => writeJSON(KEYS.registeredUsers, users)

export const getAdmins = () => readJSON(KEYS.registeredAdmins, [])
export const saveAdmins = (admins) => writeJSON(KEYS.registeredAdmins, admins)

export const getCurrentUser = () => readJSON(KEYS.currentUser, null)
export const saveCurrentUser = (user) => writeJSON(KEYS.currentUser, user)
export const clearCurrentUser = () => {
  localStorage.removeItem(KEYS.currentUser)
  localStorage.removeItem(KEYS.jwtToken)
}

// ---------------- JWT Token ----------------
export const getJWTToken = () => localStorage.getItem(KEYS.jwtToken) || null
export const saveJWTToken = (token) => {
  if (token) localStorage.setItem(KEYS.jwtToken, token)
  else localStorage.removeItem(KEYS.jwtToken)
  return token
}
export const clearJWTToken = () => localStorage.removeItem(KEYS.jwtToken)

// ---------------- Resources ----------------
export const getResources = (fallback = []) => readJSON(KEYS.resources, fallback)
export const saveResources = (resources) => writeJSON(KEYS.resources, resources)

// Fast, synchronous, no-delay patch used by the background image resolver
// (services/imageService.js) so swapping in a real photo doesn't wait on
// the mock API's artificial network delay.
export const patchResourceImage = (id, image) => {
  const resources = getResources()
  const idx = resources.findIndex((r) => r.id === id)
  if (idx !== -1) {
    resources[idx] = { ...resources[idx], image }
    saveResources(resources)
  }
}

// ---------------- Requests ----------------
export const getRequests = (fallback = []) => readJSON(KEYS.requests, fallback)
export const saveRequests = (requests) => writeJSON(KEYS.requests, requests)

// ---------------- Categories ----------------
export const getCategories = (fallback = []) => readJSON(KEYS.categories, fallback)
export const saveCategories = (categories) => writeJSON(KEYS.categories, categories)

// ---------------- Reports ----------------
export const getReports = (fallback = []) => readJSON(KEYS.reports, fallback)
export const saveReports = (reports) => writeJSON(KEYS.reports, reports)

// ---------------- Messages ----------------
export const getMessages = (fallback = []) => readJSON(KEYS.messages, fallback)
export const saveMessages = (messages) => writeJSON(KEYS.messages, messages)

// ---------------- Notifications ----------------
export const getNotifications = (fallback = []) => readJSON(KEYS.notifications, fallback)
export const saveNotifications = (notifications) => writeJSON(KEYS.notifications, notifications)

// ---------------- Wishlist ----------------
// Wishlist is scoped per-user — key includes the user id — so one
// person's saved items are never visible to (or shared with) another
// account on the same browser.
export const getWishlist = (userId, fallback = []) => (userId ? readJSON(`${KEYS.wishlist}:${userId}`, fallback) : fallback)
export const saveWishlist = (userId, wishlist) => {
  if (userId) writeJSON(`${KEYS.wishlist}:${userId}`, wishlist)
}

// ---------------- Recently viewed (per-user, most-recent-first, capped) ----------------
export const getRecentlyViewed = (userId) => {
  const fallback = ['res-1', 'res-2', 'res-4']
  if (!userId) return fallback
  const stored = readJSON(`ss_recently_viewed:${userId}`, null)
  return stored && stored.length > 0 ? stored : fallback
}
export const addRecentlyViewed = (userId, resourceId, max = 12) => {
  const key = userId ? `ss_recently_viewed:${userId}` : 'ss_recently_viewed:guest'
  const existing = (readJSON(key, []) || []).filter((id) => id !== resourceId)
  writeJSON(key, [resourceId, ...existing].slice(0, max))
}

// ---------------- Saved searches (per-user, named location/category alerts) ----------------
export const getSavedSearches = (userId) => (userId ? readJSON(`ss_saved_searches:${userId}`, []) : [])
export const saveSavedSearches = (userId, searches) => {
  if (userId) writeJSON(`ss_saved_searches:${userId}`, searches)
}

export const STORAGE_KEYS = KEYS
