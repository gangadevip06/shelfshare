// context/AuthContext.jsx
// -----------------------------------------------------------------------
// Demonstrates useContext for global auth state, and useEffect for
// syncing to localStorage so a page refresh keeps the user logged in.
//
// There is NO user self-registration for admin — this platform has
// exactly one admin account (see config/adminConfig.js) and it logs in
// through a separate, unlisted Admin Login page (adminLogin below), not
// through the regular Register/Login flow. Regular user accounts only
// exist after someone fills in the Register form; login() checks the
// real, registered users stored via utils/storage.js.
// -----------------------------------------------------------------------
import React, { createContext, useContext, useEffect, useState } from 'react'
import * as store from '../utils/storage.js'
import { ADMIN_ACCOUNT } from '../config/adminConfig.js'
import { createJWT, decodeJWT } from '../utils/jwt.js'
import { INITIAL_USERS } from '../data/mockData.js'

// Short, shareable referral code — first 3 letters of the name + 4 random
// alphanumeric characters, e.g. "SAN4F92X".
function generateReferralCode(name) {
  const prefix = (name || 'MEM').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X')
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}${suffix}`
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Rehydrate session & JWT token on first load
  useEffect(() => {
    const storedUser = store.getCurrentUser()
    let storedToken = store.getJWTToken()

    if (storedUser) {
      if (!storedToken) {
        storedToken = createJWT({ sub: storedUser.id, name: storedUser.name, email: storedUser.email, role: storedUser.role })
        store.saveJWTToken(storedToken)
      }
      setUser(storedUser)
      setToken(storedToken)
    }
    setLoading(false)
  }, [])

  // Regular user login only — admins use adminLogin() below.
  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const normalizedEmail = email.toLowerCase().trim()
        const users = store.getUsers()
        const matchedUser = users.find((u) => u.email.toLowerCase() === normalizedEmail && u.password === password)

        if (!matchedUser) {
          const emailExists = users.some((u) => u.email.toLowerCase() === normalizedEmail)
          reject(new Error(emailExists ? 'Incorrect password.' : 'No account found with this email. Please register first.'))
          return
        }

        if (matchedUser.status === 'Suspended') {
          reject(new Error('This account has been suspended by an administrator.'))
          return
        }

        const { password: _pw, ...safeUser } = matchedUser
        const jwt = createJWT({ sub: safeUser.id, name: safeUser.name, email: safeUser.email, role: safeUser.role })
        store.saveJWTToken(jwt)
        setToken(jwt)
        store.saveCurrentUser(safeUser)
        setUser(safeUser)
        resolve({ user: safeUser, token: jwt })
      }, 350)
    })
  }

  // Separate admin login path, checked against the single fixed admin
  // account rather than any registered-accounts table.
  const adminLogin = (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const normalizedEmail = email.toLowerCase().trim()
        if (normalizedEmail !== ADMIN_ACCOUNT.email.toLowerCase() || password !== ADMIN_ACCOUNT.password) {
          reject(new Error('Invalid admin credentials.'))
          return
        }
        const { password: _pw, ...safeAdmin } = ADMIN_ACCOUNT
        const jwt = createJWT({ sub: safeAdmin.id, name: safeAdmin.name, email: safeAdmin.email, role: safeAdmin.role })
        store.saveJWTToken(jwt)
        setToken(jwt)
        store.saveCurrentUser(safeAdmin)
        setUser(safeAdmin)
        resolve({ user: safeAdmin, token: jwt })
      }, 350)
    })
  }

  // OAuth authentication handler (Real Google Identity & simulated accounts)
  const loginWithOAuth = async (provider, profile) => {
    // 1. If backend is available, authenticate and persist with MongoDB
    try {
      const res = await fetch('http://localhost:5001/api/auth/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          provider: provider ? provider.toLowerCase() : 'google',
          credential: profile.credential,
          avatarUrl: profile.avatarUrl || profile.picture || null,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.token && json.user) {
          store.saveJWTToken(json.token)
          setToken(json.token)
          store.saveCurrentUser(json.user)
          setUser(json.user)

          // Also ensure present in local registered users
          const localUsers = store.getUsers() || []
          if (!localUsers.some((u) => u.email.toLowerCase() === json.user.email.toLowerCase())) {
            store.saveUsers([...localUsers, json.user])
          }
          return { user: json.user, token: json.token }
        }
      }
    } catch (e) {
      console.warn('Backend oauth call failed, continuing with client storage', e)
    }

    // 2. Client-side fallback
    const users = store.getUsers()
    const existing = users.find((u) => u.email.toLowerCase() === profile.email.toLowerCase())
    let activeUser
    if (existing) {
      activeUser = {
        ...existing,
        ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
      }
      if (profile.password && !existing.password) {
        activeUser.password = profile.password
      }
      store.saveUsers(users.map((u) => (u.id === existing.id ? activeUser : u)))
    } else {
      activeUser = {
        id: `user-oauth-${Date.now()}`,
        name: profile.name,
        email: profile.email,
        password: profile.password || 'pass123',
        phone: profile.phone || '+91 98400 00000',
        address: profile.address || 'Chennai, Tamil Nadu',
        avatarUrl: profile.avatarUrl || null,
        role: 'user',
        joined: new Date().toISOString().slice(0, 10),
        status: 'Active',
        rating: 5.0,
        referralCode: generateReferralCode(profile.name),
        referredBy: null,
        oauthProvider: provider,
      }
      store.saveUsers([...users, activeUser])
    }

    const { password: _p, ...safeUser } = activeUser
    const jwt = createJWT({ sub: safeUser.id, name: safeUser.name, email: safeUser.email, role: safeUser.role, oauthProvider: provider })
    store.saveJWTToken(jwt)
    setToken(jwt)
    store.saveCurrentUser(safeUser)
    setUser(safeUser)
    return { user: safeUser, token: jwt }
  }

  // Quick 1-click login for test accounts
  const quickLogin = (account) => {
    if (account.role === 'admin') {
      return adminLogin(account.email, account.password)
    }
    return login(account.email, account.password)
  }

  // Always registers a regular user — there is no admin self-registration.
  const register = (formData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const normalizedEmail = formData.email.toLowerCase().trim()
        const users = store.getUsers()
        const emailTaken = users.some((u) => u.email.toLowerCase() === normalizedEmail) ||
          normalizedEmail === ADMIN_ACCOUNT.email.toLowerCase()

        if (emailTaken) {
          reject(new Error('An account with this email already exists.'))
          return
        }

        const newUser = {
          id: `user-${Date.now()}`,
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          password: formData.password,
          role: 'user',
          joined: new Date().toISOString().slice(0, 10),
          status: 'Active',
          rating: 0,
          referralCode: generateReferralCode(formData.fullName),
          referredBy: formData.referralCode?.trim().toUpperCase() || null,
        }
        store.saveUsers([...users, newUser])

        const { password: _p, ...safeUser } = newUser
        const jwt = createJWT({ sub: safeUser.id, name: safeUser.name, email: safeUser.email, role: safeUser.role })
        store.saveJWTToken(jwt)
        setToken(jwt)
        store.saveCurrentUser(safeUser)
        setUser(safeUser)
        resolve({ user: safeUser, token: jwt })
      }, 350)
    })
  }

  const logout = () => {
    store.clearCurrentUser()
    store.clearJWTToken()
    setUser(null)
    setToken(null)
  }

  const updateProfile = (changes) => {
    const updated = { ...user, ...changes }
    store.saveCurrentUser(updated)
    setUser(updated)

    // The one admin account is not stored in the users table, so only
    // sync regular-user edits back into it.
    if (updated.role !== 'admin') {
      store.saveUsers(store.getUsers().map((u) => (u.id === updated.id ? { ...u, ...changes } : u)))

      try {
        const raw = localStorage.getItem('ss_google_accounts')
        if (raw) {
          const googleAccs = JSON.parse(raw)
          const updatedGoogle = googleAccs.map((a) => {
            if (a.email?.toLowerCase() === updated.email?.toLowerCase()) {
              return { ...a, ...changes }
            }
            return a
          })
          localStorage.setItem('ss_google_accounts', JSON.stringify(updatedGoogle))
        }
      } catch {}

      // Update ownerPhone / ownerName in stored resources if changed
      if (changes.phone || changes.name) {
        try {
          const resList = store.getResources() || []
          const updatedRes = resList.map((r) => {
            if (r.ownerId === updated.id || (updated.email && r.ownerEmail === updated.email)) {
              return {
                ...r,
                ...(changes.phone ? { ownerPhone: changes.phone } : {}),
                ...(changes.name ? { ownerName: changes.name } : {}),
              }
            }
            return r
          })
          store.saveResources(updatedRes)
        } catch {}
      }

      // Sync to backend if token is available
      const token = localStorage.getItem('ss_jwt_token')
      if (token) {
        try {
          fetch('http://localhost:5001/api/users/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(changes),
          }).catch(() => {})
        } catch {}
      }
    }
  }

  const value = {
    user,
    token,
    decodedToken: token ? decodeJWT(token) : null,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    adminLogin,
    loginWithOAuth,
    quickLogin,
    register,
    logout,
    updateProfile,
    DEMO_USERS: [
      ...INITIAL_USERS,
      { ...ADMIN_ACCOUNT, address: 'Chennai, Tamil Nadu', phone: '+91 98400 99999' }
    ],
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
