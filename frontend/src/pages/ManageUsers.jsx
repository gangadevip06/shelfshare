// pages/ManageUsers.jsx
import React, { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { getUsers, updateUser, deleteUser, getResources, getRequests } from '../services/api.js'
import { Search, X } from 'lucide-react'

export default function ManageUsers() {
  const { t } = useLanguage()
  const [users, setUsers] = useState([])
  const [resources, setResources] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewUser, setViewUser] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const [u, r, req] = await Promise.all([getUsers(), getResources(), getRequests()])
      setUsers(u)
      setResources(r)
      setRequests(req)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const filtered = users
    .filter((u) => (search ? u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) : true))
    .filter((u) => (statusFilter ? u.status === statusFilter : true))

  const toggleSuspend = async (user) => {
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active'
    await updateUser(user.id, { status: newStatus })
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)))
  }

  const handleDelete = async () => {
    await deleteUser(confirmDelete.id)
    setUsers((prev) => prev.filter((u) => u.id !== confirmDelete.id))
    setConfirmDelete(null)
  }

  const resourceCount = (userId) => resources.filter((r) => r.ownerId === userId).length
  const transactionCount = (userId) => requests.filter((r) => r.requesterId === userId && r.status === 'Completed').length

  return (
    <AdminLayout title={t("admin_manageUsersTitle")} subtitle={`${filtered.length} registered user${filtered.length !== 1 ? 's' : ''}`}>
      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={15} style={{ color: 'var(--sage)' }} />
          <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-wrap"><span className="spinner" />Loading users...</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Location</th><th>Joined Date</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{u.address}</td>
                  <td>{u.joined}</td>
                  <td><span className={`badge ${u.status === 'Active' ? 'badge-green' : 'badge-red'}`}>{u.status}</span></td>
                  <td className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setViewUser(u)}>View</button>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleSuspend(u)}>
                      {u.status === 'Active' ? 'Suspend' : 'Reactivate'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(u)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8}><div className="empty-state">No registered users yet. Users will appear here after they sign up.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewUser && (
        <div className="modal-overlay" onClick={() => setViewUser(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.05rem' }}>{viewUser.name}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewUser(null)}><X size={16} /></button>
            </div>
            <div style={{ display: 'grid', gap: 10, fontSize: '0.9rem' }}>
              <div><strong>Email:</strong> {viewUser.email}</div>
              <div><strong>Phone:</strong> {viewUser.phone}</div>
              <div><strong>Address:</strong> {viewUser.address}</div>
              <div><strong>Joined:</strong> {viewUser.joined}</div>
              <div><strong>Resources Shared:</strong> {resourceCount(viewUser.id)}</div>
              <div><strong>Completed Transactions:</strong> {transactionCount(viewUser.id)}</div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.05rem' }}>Delete user?</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(null)}><X size={16} /></button>
            </div>
            <p style={{ color: 'var(--sage)', fontSize: '0.9rem', marginBottom: 20 }}>
              This will permanently remove {confirmDelete.name} from ShelfShare.
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
