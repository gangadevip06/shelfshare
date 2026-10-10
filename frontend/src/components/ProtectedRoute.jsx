// components/ProtectedRoute.jsx
// Guards authenticated (and optionally admin-only) routes.
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children, adminOnly = false, userOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) return <div className="loading-wrap"><span className="spinner" />Checking session...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  if (userOnly && isAdmin) return <Navigate to="/admin" replace />
  return children
}
