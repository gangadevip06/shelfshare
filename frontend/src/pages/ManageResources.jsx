// pages/ManageResources.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { getResources, updateResource, deleteResource } from '../services/api.js'
import { Search, X } from 'lucide-react'

export default function ManageResources() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        setResources(await getResources())
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = resources
    .filter((r) => (search ? r.title.toLowerCase().includes(search.toLowerCase()) : true))
    .filter((r) => (statusFilter ? r.status === statusFilter : true))

  const setStatus = async (resource, status) => {
    await updateResource(resource.id, { status })
    setResources((prev) => prev.map((r) => (r.id === resource.id ? { ...r, status } : r)))
  }

  const handleDelete = async () => {
    await deleteResource(confirmDelete.id)
    setResources((prev) => prev.filter((r) => r.id !== confirmDelete.id))
    setConfirmDelete(null)
  }

  const STATUS_BADGE = { Active: 'badge-green', Pending: 'badge-amber', Rejected: 'badge-red' }

  return (
    <AdminLayout title={t("admin_manageResourcesTitle")} subtitle={`${filtered.length} resource${filtered.length !== 1 ? 's' : ''} found`}>
      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={15} style={{ color: 'var(--sage)' }} />
          <input placeholder="Search resources..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-wrap"><span className="spinner" />Loading resources...</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Resource ID</th><th>Resource Name</th><th>Owner</th><th>Category</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.title}</td>
                  <td>{r.ownerName}</td>
                  <td>{r.category}</td>
                  <td><span className={`badge ${STATUS_BADGE[r.status] || 'badge-gray'}`}>{r.status}</span></td>
                  <td>{r.createdAt}</td>
                  <td className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/resources/${r.id}`)}>View</button>
                    {r.status !== 'Active' && <button className="btn btn-outline btn-sm" onClick={() => setStatus(r, 'Active')}>Approve</button>}
                    {r.status !== 'Rejected' && <button className="btn btn-outline btn-sm" onClick={() => setStatus(r, 'Rejected')}>Reject</button>}
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(r)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7}><div className="empty-state">No resources match your filters.</div></td></tr>}
            </tbody>
          </table>
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
              This will permanently remove "{confirmDelete.title}" from the platform.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger btn-block" onClick={handleDelete}>Delete</button>
              <button className="btn btn-ghost btn-block" onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
