// pages/ManageRequests.jsx
// Admin gets a platform-wide, READ-ONLY view of every request. Approving,
// rejecting, and completing a request is the resource owner's decision —
// see pages/IncomingRequests.jsx — admin only monitors here.
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { getRequests } from '../services/api.js'

const STATUS_BADGE = { Pending: 'badge-amber', Approved: 'badge-green', Rejected: 'badge-red', Completed: 'badge-gray', Cancelled: 'badge-red' }

export default function ManageRequests() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        setRequests(await getRequests())
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = requests.filter((r) => (statusFilter ? r.status === statusFilter : true))

  return (
    <AdminLayout title={t("admin_manageRequestsTitle")} subtitle="Monitor resource requests platform-wide. Approval and rejection are handled by each resource's owner.">
      <div className="filters-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-wrap"><span className="spinner" />Loading requests...</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Request ID</th><th>Requester</th><th>Owner</th><th>Resource</th><th>Request Date</th><th>Payment</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.requesterName}</td>
                  <td>{r.ownerName}</td>
                  <td>{r.resourceTitle}</td>
                  <td>{r.requestedOn}</td>
                  <td>{r.paymentStatus && r.paymentStatus !== 'Unpaid' ? <span className="badge badge-green">{r.paymentStatus}</span> : <span className="badge badge-gray">Unpaid</span>}</td>
                  <td><span className={`badge ${STATUS_BADGE[r.status] || 'badge-gray'}`}>{r.status}</span></td>
                  <td className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/requests/${r.id}`)}>View</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8}><div className="empty-state">No requests match your filters.</div></td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
