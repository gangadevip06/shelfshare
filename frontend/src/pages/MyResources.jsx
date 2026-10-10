// pages/MyResources.jsx
// Demonstrates useReducer for local page state (tabs + CRUD on the
// logged-in user's own resources), on top of the shared api.js service.
import React, { useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UserLayout from '../components/UserLayout.jsx'
import ResourceCard from '../components/ResourceCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { resourceReducer, initialResourceState } from '../reducers/resourceReducer.js'
import { getResources, updateResource, deleteResource, getRequests, addResource } from '../services/api.js'
import * as store from '../utils/storage.js'
import { fileToCompressedDataUrl } from '../utils/imageUpload.js'
import { Package, Plus, X } from 'lucide-react'

const TABS = ['All', 'Available', 'Unavailable']
const TAB_KEY = { All: 'tab_all', Available: 'status_Available', Unavailable: 'status_Unavailable' }

export default function MyResources() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(resourceReducer, initialResourceState)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Photo management — owner-only: replace or remove the photo on one of
  // their own listings.
  const [photoTarget, setPhotoTarget] = useState(null)
  const [photoError, setPhotoError] = useState('')
  const [photoProcessing, setPhotoProcessing] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const all = (await getResources()) || []

        const isSeedCatalogItem = (r) => {
          if (!r || !r.id) return false
          if (r.id === 'res-gardening-equipments') return false
          const match = String(r.id).match(/^res-(\d+)$/)
          if (match) {
            const num = parseInt(match[1], 10)
            if (num >= 1 && num <= 150) return true
          }
          return false
        }

        const isMine = (r) => {
          if (!r) return false
          // Never include platform seed catalog items in user's personal resources
          if (isSeedCatalogItem(r)) return false
          // Exclude legacy/mock resources requested to be removed from this account
          if (r.id === 'res-gardening-equipments' || r.id === 'res-1790672398112' || r.id === 'res-1790657313731') return false

          if (r.ownerId && user.id && r.ownerId === user.id) return true
          if (user.email && r.ownerEmail && r.ownerEmail.toLowerCase().trim() === user.email.toLowerCase().trim()) return true
          if (user.name && r.ownerName && user.name.toLowerCase().trim() === r.ownerName.toLowerCase().trim() && !isSeedCatalogItem(r)) return true
          return false
        }

        const mine = all.filter(isMine)
        dispatch({ type: 'SET_RESOURCES', payload: mine })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const filtered = state.resources.filter((r) => activeTab === 'All' || r.availability === activeTab)

  const handleEdit = async (resource) => {
    const newAvailability = resource.availability === 'Available' ? 'Unavailable' : 'Available'
    try {
      await updateResource(resource.id, { availability: newAvailability })
      dispatch({ type: 'UPDATE_RESOURCE', payload: { id: resource.id, changes: { availability: newAvailability } } })
    } catch (err) {
      console.error(err)
    }
  }

  const confirmDeleteResource = async () => {
    if (!confirmDelete) return
    try {
      await deleteResource(confirmDelete.id)
      dispatch({ type: 'DELETE_RESOURCE', payload: confirmDelete.id })
    } catch (err) {
      console.error(err)
    } finally {
      setConfirmDelete(null)
    }
  }

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !photoTarget) return
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file (JPG, PNG, WEBP).')
      return
    }
    setPhotoProcessing(true)
    setPhotoError('')
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      await updateResource(photoTarget.id, { image: dataUrl })
      dispatch({ type: 'UPDATE_RESOURCE', payload: { id: photoTarget.id, changes: { image: dataUrl } } })
      setPhotoTarget(null)
    } catch (err) {
      setPhotoError(err.message)
    } finally {
      setPhotoProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = async () => {
    if (!photoTarget) return
    try {
      await updateResource(photoTarget.id, { image: '' })
      dispatch({ type: 'UPDATE_RESOURCE', payload: { id: photoTarget.id, changes: { image: '' } } })
      setPhotoTarget(null)
    } catch (err) {
      setPhotoError('Could not remove the photo. Please try again.')
    }
  }

  return (
    <UserLayout title={t('myResources_title')} subtitle={t('myResources_subtitle')}>
      <div className="page-head">
        <div className="tabs">
          {TABS.map((tab) => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {t(TAB_KEY[tab])}
            </button>
          ))}
        </div>
        <button className="btn btn-accent" onClick={() => navigate('/add-resource')} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Plus size={16} style={{ marginRight: 6 }} />{t('nav_addResource')}
        </button>
      </div>

      {loading ? (
        <div className="loading-wrap"><span className="spinner" />{t('common_loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={40} strokeWidth={1.5} color="var(--sage)" style={{ marginBottom: 12 }} />
          <div>{t('empty_noResources')}</div>
        </div>
      ) : (
        <div className="grid-4">
          {filtered.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              showOwnerActions
              onEdit={handleEdit}
              onDelete={(resource) => setConfirmDelete(resource)}
              onManagePhoto={(resource) => { setPhotoTarget(resource); setPhotoError('') }}
            />
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.05rem' }}>Delete resource?</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(null)}><X size={16} /></button>
            </div>
            <p style={{ color: 'var(--sage)', fontSize: '0.9rem', marginBottom: 20 }}>
              This will permanently remove "{confirmDelete.title}" from ShelfShare.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger btn-block" onClick={confirmDeleteResource}>Delete</button>
              <button className="btn btn-ghost btn-block" onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {photoTarget && (
        <div className="modal-overlay" onClick={() => !photoProcessing && setPhotoTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.05rem' }}>Manage photo — {photoTarget.title}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setPhotoTarget(null)} disabled={photoProcessing}><X size={16} /></button>
            </div>

            <div style={{ borderRadius: 10, overflow: 'hidden', height: 160, background: '#eee7d8', marginBottom: 16 }}>
              <img src={photoTarget.image} alt={photoTarget.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            {photoError && <div className="form-error" style={{ marginBottom: 10 }}>{photoError}</div>}

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoFileChange} style={{ display: 'none' }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary btn-block" disabled={photoProcessing} onClick={() => fileInputRef.current?.click()}>
                {photoProcessing ? 'Uploading...' : 'Replace Photo'}
              </button>
              <button className="btn btn-danger btn-block" disabled={photoProcessing} onClick={handleRemovePhoto}>
                Remove Photo
              </button>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--sage)', marginTop: 12 }}>
              Only you, as the owner of this listing, can change or remove its photo.
            </p>
          </div>
        </div>
      )}
    </UserLayout>
  )
}
