// pages/IncomingRequests.jsx
// Requests placed BY OTHER PEOPLE on resources the current user owns.
// This is where approve/reject/complete actually happens — the resource
// owner decides, not the admin. Admin can only monitor (see
// pages/ManageRequests.jsx, which is view-only).
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox, Truck, CheckCircle2, X, Clock, AlertTriangle } from 'lucide-react'
import UserLayout from '../components/UserLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import {
  getRequests,
  updateRequestStatus,
  approveRequestWithLocation,
  updateHandoverStatus,
  addNotification,
  approveRentalExtension,
  rejectRentalExtension,
} from '../services/api.js'

const STATUS_BADGE = { Pending: 'badge-amber', Approved: 'badge-green', Rejected: 'badge-red', Completed: 'badge-gray', Cancelled: 'badge-red' }
const STATUS_KEY = { Pending: 'status_Pending', Approved: 'status_Approved', Rejected: 'status_Rejected', Completed: 'status_Completed', Cancelled: 'status_Cancelled' }
const TABS = ['All', 'Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled']

export default function IncomingRequests() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [approveTarget, setApproveTarget] = useState(null)
  const [pickupLocation, setPickupLocation] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const all = await getRequests()
      const isGanga = (user?.email && user.email.toLowerCase().includes('ganga')) || (user?.name && user.name.toLowerCase().includes('ganga')) || user?.id === 'user-ganga'
      setRequests(all.filter((r) => {
        if (!user) return false
        if (r.ownerId === user.id) return true
        if (user.email && r.ownerEmail && r.ownerEmail.toLowerCase().trim() === user.email.toLowerCase().trim()) return true
        if (user.name && r.ownerName && (r.ownerName.toLowerCase().includes(user.name.toLowerCase()) || user.name.toLowerCase().includes(r.ownerName.toLowerCase()))) return true
        if (isGanga && (r.ownerName?.toLowerCase().includes('ganga') || r.ownerId?.toLowerCase().includes('ganga'))) return true
        return false
      }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user?.id, user?.email])

  const filtered = requests.filter((r) => activeTab === 'All' || r.status === activeTab)

  const handleApprove = async () => {
    if (!approveTarget || !pickupLocation.trim()) return
    await approveRequestWithLocation(approveTarget.id, pickupLocation.trim())
    await addNotification({
      userId: approveTarget.requesterId, type: 'approved', title: 'Request approved',
      desc: `${user.name} approved your request for "${approveTarget.resourceTitle}". Pickup: ${pickupLocation.trim()}.`,
    })
    setApproveTarget(null)
    setPickupLocation('')
    load()
  }

  const handleReject = async (request) => {
    await updateRequestStatus(request.id, 'Rejected')
    await addNotification({
      userId: request.requesterId, type: 'rejected', title: 'Request rejected',
      desc: `Your request for "${request.resourceTitle}" was rejected by ${user.name}.`,
    })
    setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: 'Rejected' } : r)))
  }

  const handleComplete = async (request) => {
    await updateRequestStatus(request.id, 'Completed')
    await addNotification({
      userId: request.requesterId, type: 'update', title: 'Request completed',
      desc: `Your ${request.requestType?.toLowerCase() || ''} for "${request.resourceTitle}" is marked completed. Thanks for using ShelfShare!`,
    })
    setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: 'Completed' } : r)))
  }

  const handleHandover = async (request) => {
    const isRentReq = request.requestType === 'Rent'
    await updateHandoverStatus(request.id, 'Handed Over')
    await addNotification({
      userId: request.requesterId, type: 'update', title: isRentReq ? 'Item handed over' : 'Out for delivery',
      desc: isRentReq
        ? `${user.name} marked "${request.resourceTitle}" as handed over to you. Please confirm once you've received it.`
        : `${user.name} marked "${request.resourceTitle}" as out for delivery. Please confirm once it arrives.`,
    })
    setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, handoverStatus: 'Handed Over' } : r)))
  }

  const handleApproveExtension = async (request) => {
    await approveRentalExtension(request.id)
    load()
  }

  const handleRejectExtension = async (request) => {
    await rejectRentalExtension(request.id, 'Resource unavailable for extension')
    load()
  }

  const overlappingExt = approveTarget ? requests.find((r) => 
    r.id !== approveTarget.id &&
    r.resourceId === approveTarget.resourceId &&
    (r.extensionStatus === 'Requested' || r.extensionStatus === 'Pending')
  ) : null

  return (
    <UserLayout title={t('incomingRequests_title')} subtitle={t('incomingRequests_subtitle')}>
      <div className="tabs">
        {TABS.map((tab) => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'All' ? t('tab_all') : t(STATUS_KEY[tab])}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-wrap"><span className="spinner" />{t('common_loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="ic" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Inbox size={44} strokeWidth={1.5} color="var(--sage)" />
          </div>
          {t('empty_noRequests')}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('col_resource')}</th>
                <th>{t('col_requestedBy')}</th>
                <th>{t('col_type')}</th>
                <th>{t('col_amount')}</th>
                <th>{t('col_requestedOn')}</th>
                <th>{t('col_payment')}</th>
                <th>{t('col_status')}</th>
                <th>{t('col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isPaid = r.paymentStatus === 'Paid' || r.paymentStatus === 'Cash on Pickup'
                const isRent = r.requestType === 'Rent'
                const canComplete = isRent ? (isPaid && r.handoverStatus === 'Returned') : isPaid
                const hasExtRequested = r.extensionStatus === 'Requested' || r.extensionStatus === 'Pending'
                return (
                  <tr key={r.id}>
                    <td>{r.resourceTitle}</td>
                    <td>{r.requesterName}</td>
                    <td>{r.requestType || '—'}{r.requestType === 'Rent' && r.rentalDuration ? ` (${r.rentalDuration}d)` : ''}</td>
                    <td>₹{r.totalAmount ?? r.amount ?? 0}</td>
                    <td>{r.requestedOn}</td>
                    <td>{r.paymentStatus && r.paymentStatus !== 'Unpaid' ? <span className="badge badge-green">{r.paymentStatus === 'Cash on Pickup' ? t('status_CashOnPickup') : t('status_Paid')}</span> : <span className="badge badge-gray">{t('status_Unpaid')}</span>}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[r.status] || 'badge-gray'}`}>{t(STATUS_KEY[r.status]) || r.status}</span>
                      {hasExtRequested && (
                        <div style={{ marginTop: 4 }}>
                          <span className="badge badge-amber" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={11} /> Ext Requested (+{r.extensionDays}d)
                          </span>
                        </div>
                      )}
                      {r.extensionStatus === 'Approved' && r.extensionPaymentStatus === 'Unpaid' && (
                        <div style={{ marginTop: 4 }}>
                          <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                            Ext Approved (Awaiting ₹{r.extensionAmount})
                          </span>
                        </div>
                      )}
                      {r.extensionStatus === 'Approved' && r.extensionPaymentStatus === 'Paid' && (
                        <div style={{ marginTop: 4 }}>
                          <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                            ✓ Ext Paid (+₹{r.extensionAmount})
                          </span>
                        </div>
                      )}
                      {r.extensionStatus === 'Rejected' && (
                        <div style={{ marginTop: 4 }}>
                          <span className="badge badge-red" style={{ fontSize: '0.72rem' }}>
                            Ext Declined
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/requests/${r.id}`)}>{t('common_view')}</button>
                      {hasExtRequested && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => handleApproveExtension(r)}>Approve Ext</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleRejectExtension(r)}>Decline Ext</button>
                        </>
                      )}
                      {r.status === 'Pending' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => { setApproveTarget(r); setPickupLocation('') }}>{t('common_approve')}</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleReject(r)}>{t('common_reject')}</button>
                        </>
                      )}
                      {r.status === 'Approved' && isPaid && r.handoverStatus === 'Not Handed Over' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleHandover(r)}>
                          <Truck size={14} /> Mark {isRent ? 'Handed Over' : 'Out for Delivery'}
                        </button>
                      )}
                      {r.status === 'Approved' && r.handoverStatus === 'Handed Over' && (
                        <span className="badge badge-amber" style={{ alignSelf: 'center' }}>Waiting for buyer to confirm {isRent ? 'receipt' : 'delivery'}</span>
                      )}
                      {r.status === 'Approved' && isRent && r.handoverStatus === 'Received' && (
                        <span className="badge badge-gray" style={{ alignSelf: 'center' }}>Item with buyer — waiting for return</span>
                      )}
                      {r.status === 'Approved' && isRent && r.handoverStatus === 'Returned' && (
                        <button className="btn btn-outline btn-sm" disabled={!canComplete} title={!canComplete ? 'Waiting for payment' : ''} onClick={() => navigate(`/requests/${r.id}`)}>
                          <CheckCircle2 size={14} color="#10b981" /> Review Condition & Complete
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {approveTarget && (
        <div className="modal-overlay" onClick={() => setApproveTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Approve "{approveTarget.resourceTitle}"</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setApproveTarget(null)} style={{ padding: 6, borderRadius: '50%' }}>
                <X size={15} />
              </button>
            </div>

            {overlappingExt && (
              <div style={{ background: '#fff7ed', border: '1px solid #f97316', borderRadius: 8, padding: 10, marginBottom: 14, fontSize: '0.82rem', color: '#9a3412' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#c2410c' }}>
                  <AlertTriangle size={15} /> Single Buyer Selection Notice
                </div>
                <div style={{ marginTop: 4 }}>
                  Current renter <strong>{overlappingExt.requesterName}</strong> has an active extension request. Approving this booking will automatically decline their extension because only ONE member can have the item.
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Where will the handover happen?</label>
              <input
                className="form-control"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="e.g. Anna Nagar Metro Station, near Gate 2"
                autoFocus
              />
            </div>
            <button className="btn btn-primary btn-block" disabled={!pickupLocation.trim()} onClick={handleApprove}>
              Approve & Notify Requester
            </button>
          </div>
        </div>
      )}
    </UserLayout>
  )
}
