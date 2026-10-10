// pages/ManageReports.jsx
import React, { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { getReports, updateReportStatus, deleteReport } from '../services/api.js'
import { X } from 'lucide-react'

const STATUS_BADGE = { Pending: 'badge-amber', Resolved: 'badge-green', Rejected: 'badge-red' }

export default function ManageReports() {
  const { t } = useLanguage()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [viewReport, setViewReport] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        setReports(await getReports())
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = reports.filter((r) => (statusFilter ? r.status === statusFilter : true))

  const updateStatus = async (id, status) => {
    await updateReportStatus(id, status)
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  const handleDelete = async (id) => {
    await deleteReport(id)
    setReports((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <AdminLayout title={t("admin_manageReportsTitle")} subtitle="Review and resolve reports submitted by the community.">
      <div className="filters-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-wrap"><span className="spinner" />Loading reports...</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Report ID</th><th>User</th><th>Resource</th><th>Reason</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.userName}</td>
                  <td>{r.resourceTitle}</td>
                  <td>{r.reason}</td>
                  <td>{r.date}</td>
                  <td><span className={`badge ${STATUS_BADGE[r.status] || 'badge-gray'}`}>{r.status}</span></td>
                  <td className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setViewReport(r)}>View</button>
                    {r.status === 'Pending' && (
                      <>
                        <button className="btn btn-outline btn-sm" onClick={() => updateStatus(r.id, 'Resolved')}>Resolve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => updateStatus(r.id, 'Rejected')}>Reject</button>
                      </>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7}><div className="empty-state">No reports match your filters.</div></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {viewReport && (
        <div className="modal-overlay" onClick={() => setViewReport(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.05rem' }}>Report on {viewReport.resourceTitle}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewReport(null)}><X size={16} /></button>
            </div>
            <div style={{ display: 'grid', gap: 10, fontSize: '0.9rem' }}>
              <div><strong>Reported by:</strong> {viewReport.userName}</div>
              <div><strong>Reason:</strong> {viewReport.reason}</div>
              <div><strong>Description:</strong> {viewReport.description}</div>
              <div><strong>Date:</strong> {viewReport.date}</div>
              <div><strong>Status:</strong> {viewReport.status}</div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
