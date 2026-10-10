// App.jsx
// Central route table. ProtectedRoute guards authenticated-only pages;
// adminOnly further restricts admin pages to users with role "admin".
import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import ProtectedRoute from './components/ProtectedRoute.jsx'
import { setResourceImage, fetchResourcesThunk, loadWishlistForUser } from './store/resourceSlice.js'
import { resolveResourceImages } from './services/imageService.js'
import { patchResourceImage, getWishlist } from './utils/storage.js'
import { useAuth } from './context/AuthContext.jsx'

import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Explore from './pages/Explore.jsx'
import ResourceDetails from './pages/ResourceDetails.jsx'
import AddResource from './pages/AddResource.jsx'
import MyResources from './pages/MyResources.jsx'
import MyRequests from './pages/MyRequests.jsx'
import IncomingRequests from './pages/IncomingRequests.jsx'
import MyReviews from './pages/MyReviews.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import SavedSearches from './pages/SavedSearches.jsx'
import Analytics from './pages/Analytics.jsx'
import RequestDetails from './pages/RequestDetails.jsx'
import RequestReceipt from './pages/RequestReceipt.jsx'
import Wishlist from './pages/Wishlist.jsx'
import Messages from './pages/Messages.jsx'
import Notifications from './pages/Notifications.jsx'
import Profile from './pages/Profile.jsx'

import AdminDashboard from './pages/AdminDashboard.jsx'
import ManageUsers from './pages/ManageUsers.jsx'
import ManageResources from './pages/ManageResources.jsx'
import ManageRequests from './pages/ManageRequests.jsx'
import ManageReports from './pages/ManageReports.jsx'
import ManageCategories from './pages/ManageCategories.jsx'
import ApiDocs from './pages/ApiDocs.jsx'
import ShelfBot from './components/ShelfBot.jsx'

export default function App() {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const resources = useSelector((state) => state.resources.items)

  // Load the CURRENT account's own wishlist whenever who's logged in
  // changes (login, logout, or switching accounts) — never another
  // person's saved items, and never shared across accounts.
  useEffect(() => {
    dispatch(loadWishlistForUser(getWishlist(user?.id)))
  }, [user?.id, dispatch])

  // Fetch the catalog once, then resolve real photos for it in the
  // background (see services/imageService.js) — the page never blocks on
  // this, cards just upgrade from the generated card to a real photo as
  // matches come back.
  useEffect(() => {
    dispatch(fetchResourcesThunk())
  }, [dispatch])

  useEffect(() => {
    if (resources.length === 0) return
    let cancelled = false
    // Only ever touch resources still showing the generated placeholder
    // card (image is a locally-generated SVG data URI). This protects
    // photos already resolved from Commons, and — critically — protects
    // any photo an owner has uploaded or removed themselves from ever
    // being silently overwritten on a later background pass.
    const pending = resources.filter((r) => typeof r.image === 'string' && r.image.startsWith('data:image/svg+xml'))
    if (pending.length === 0) return
    resolveResourceImages(pending, (id, image) => {
      if (cancelled) return
      patchResourceImage(id, image)
      dispatch(setResourceImage({ id, image }))
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources.length])

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/resources/:id" element={<ResourceDetails />} />
        <Route path="/api-docs" element={<ApiDocs />} />

        {/* Authenticated user routes */}
        <Route path="/dashboard" element={<ProtectedRoute userOnly><Dashboard /></ProtectedRoute>} />
        <Route path="/add-resource" element={<ProtectedRoute userOnly><AddResource /></ProtectedRoute>} />
        <Route path="/my-resources" element={<ProtectedRoute userOnly><MyResources /></ProtectedRoute>} />
        <Route path="/my-requests" element={<ProtectedRoute userOnly><MyRequests /></ProtectedRoute>} />
        <Route path="/incoming-requests" element={<ProtectedRoute userOnly><IncomingRequests /></ProtectedRoute>} />
        <Route path="/my-reviews" element={<ProtectedRoute userOnly><MyReviews /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute userOnly><Leaderboard /></ProtectedRoute>} />
        <Route path="/saved-searches" element={<ProtectedRoute userOnly><SavedSearches /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute userOnly><Analytics /></ProtectedRoute>} />
        <Route path="/requests/:id" element={<ProtectedRoute><RequestDetails /></ProtectedRoute>} />
        <Route path="/requests/:id/receipt" element={<ProtectedRoute><RequestReceipt /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute userOnly><Wishlist /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute userOnly><Messages /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute userOnly><Notifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><ManageUsers /></ProtectedRoute>} />
        <Route path="/admin/resources" element={<ProtectedRoute adminOnly><ManageResources /></ProtectedRoute>} />
        <Route path="/admin/requests" element={<ProtectedRoute adminOnly><ManageRequests /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute adminOnly><ManageReports /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute adminOnly><ManageCategories /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Landing />} />
      </Routes>

      {/* Global Bilingual AI Concierge */}
      <ShelfBot />
    </>
  )
}
