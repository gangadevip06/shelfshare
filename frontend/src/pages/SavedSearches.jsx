// pages/SavedSearches.jsx
// Lets a user save a named search (category/location/sharing type) and get
// notified when new matching resources are added — reuses the existing
// Notifications system rather than inventing a new alert channel.
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, Plus, Folder, MapPin, RefreshCw, Search, Trash2, X } from 'lucide-react'
import UserLayout from '../components/UserLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getSavedSearches, saveSavedSearches } from '../utils/storage.js'
import { getResources, addNotification } from '../services/api.js'
import { CATEGORIES, LOCATIONS, SHARING_TYPES } from '../data/mockData.js'

export default function SavedSearches() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searches, setSearches] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', location: '', sharingType: '' })

  const load = () => setSearches(user?.id ? getSavedSearches(user.id) : [])

  useEffect(() => { load() }, [user?.id])

  // On visiting this page, check each saved search against the catalog for
  // resources created after it was last checked, and notify if any match.
  useEffect(() => {
    async function checkForNewMatches() {
      if (!user?.id || searches.length === 0) return
      const resources = await getResources()
      let changed = false
      const updated = await Promise.all(searches.map(async (s) => {
        const lastChecked = s.lastChecked || s.createdAt
        const matches = resources.filter((r) => {
          if (new Date(r.createdAt) <= new Date(lastChecked)) return false
          if (s.category && r.category !== s.category) return false
          if (s.location && r.location !== s.location) return false
          if (s.sharingType && r.sharingType !== s.sharingType) return false
          return true
        })
        if (matches.length > 0) {
          changed = true
          await addNotification({
            userId: user.id, type: 'update', title: `New matches for "${s.name}"`,
            desc: `${matches.length} new resource${matches.length !== 1 ? 's' : ''} match your saved search: ${matches.slice(0, 2).map((m) => m.title).join(', ')}${matches.length > 2 ? '...' : ''}`,
          })
        }
        return { ...s, lastChecked: new Date().toISOString() }
      }))
      if (changed) {
        saveSavedSearches(user.id, updated)
        setSearches(updated)
      }
    }
    checkForNewMatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const newSearch = { id: `search-${Date.now()}`, ...form, createdAt: new Date().toISOString(), lastChecked: new Date().toISOString() }
    const updated = [newSearch, ...searches]
    saveSavedSearches(user.id, updated)
    setSearches(updated)
    setForm({ name: '', category: '', location: '', sharingType: '' })
    setShowAdd(false)
  }

  const handleDelete = (id) => {
    const updated = searches.filter((s) => s.id !== id)
    saveSavedSearches(user.id, updated)
    setSearches(updated)
  }

  const runSearch = (s) => {
    const params = new URLSearchParams()
    if (s.category) params.set('category', s.category)
    navigate(`/explore?${params.toString()}`)
  }

  return (
    <UserLayout title="Saved Searches" subtitle="Get notified when new resources match what you're looking for.">
      <div className="page-head">
        <div />
        <button className="btn btn-accent" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Save a Search
        </button>
      </div>

      {searches.length === 0 ? (
        <div className="empty-state">
          <div className="ic" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Bookmark size={44} strokeWidth={1.5} color="var(--sage)" />
          </div>
          No saved searches yet. Save one to get notified about new matching resources.
        </div>
      ) : (
        <div className="grid-3">
          {searches.map((s) => (
            <div key={s.id} className="card" style={{ padding: 20 }}>
              <h4 style={{ marginBottom: 10, fontWeight: 700 }}>{s.name}</h4>
              <div style={{ fontSize: '0.84rem', color: 'var(--sage)', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {s.category && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Folder size={14} color="var(--primary)" /> {s.category}
                  </span>
                )}
                {s.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="var(--accent)" /> {s.location}
                  </span>
                )}
                {s.sharingType && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={14} color="var(--primary)" /> {s.sharingType}
                  </span>
                )}
                {!s.category && !s.location && !s.sharingType && <span>All resources</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm btn-block" onClick={() => runSearch(s)}>
                  <Search size={13} /> Run Search
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Save a search</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)} style={{ padding: 6, borderRadius: '50%' }}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Guitars near me" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Category (optional)</label>
                <select className="form-control" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  <option value="">Any category</option>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location (optional)</label>
                <select className="form-control" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}>
                  <option value="">Any location</option>
                  {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sharing Type (optional)</label>
                <select className="form-control" value={form.sharingType} onChange={(e) => setForm((f) => ({ ...f, sharingType: e.target.value }))}>
                  <option value="">Any type</option>
                  {SHARING_TYPES.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={!form.name.trim()}>Save Search</button>
            </form>
          </div>
        </div>
      )}
    </UserLayout>
  )
}
