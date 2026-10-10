// pages/MyRequests.jsx
// Demonstrates useReducer for local page state on top of the shared api.js service.
import React, { useEffect, useReducer, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Key, RotateCcw } from 'lucide-react'
import UserLayout from '../components/UserLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { resourceReducer, initialResourceState } from '../reducers/resourceReducer.js'
import { getRequests, cancelRequest as cancelRequestApi, updateHandoverStatus, addNotification } from '../services/api.js'

const STATUS_BADGE = {
  Pending: 'badge-amber',
  Approved: 'badge-green',
  Rejected: 'badge-red',
  Completed: 'badge-gray',
  Cancelled: 'badge-red',
}
const STATUS_KEY = { Pending: 'status_Pending', Approved: 'status_Approved', Rejected: 'status_Rejected', Completed: 'status_Completed', Cancelled: 'status_Cancelled' }

const TABS = ['All', 'Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled']

export default function MyRequests() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(resourceReducer, initialResourceState)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')

  const load = async () => {
    setLoading(true)
    try {
      const all = await getRequests()
      const mine = all.filter((r) => {
        if (!user) return false
        if (r.requesterId === user.id) return true
        if (user.email && r.requesterEmail && r.requesterEmail.toLowerCase().trim() === user.email.toLowerCase().trim()) return true
        if (user.name && r.requesterName && (
          r.requesterName.toLowerCase().trim() === user.name.toLowerCase().trim() ||
          r.requesterName.toLowerCase().includes(user.name.toLowerCase().trim()) ||
          user.name.toLowerCase().includes(r.requesterName.toLowerCase().trim())
        )) return true
        return false
      })
      dispatch({ type: 'SET_REQUESTS', payload: mine })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user])

  const filtered = state.requests.filter((r) => activeTab === 'All' || r.status === activeTab)

  const handleCancel = async (id) => {
    try {
      await cancelRequestApi(id)
      dispatch({ type: 'CANCEL_REQUEST', payload: id })
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkReturned = async (request) => {
    try {
      await updateHandoverStatus(request.id, 'Returned')
      await addNotification({
        userId: request.ownerId, type: 'update', title: 'Item returned',
        desc: `${request.requesterName} marked "${request.resourceTitle}" as returned. Please confirm once you've received it back.`,
      })
      dispatch({ type: 'UPDATE_REQUEST', payload: { id: request.id, changes: { handoverStatus: 'Returned' } } })
    } catch (err) {
      console.error(err)
    }
  }

  const handleConfirmReceived = async (request) => {
    try {
      const isRentReq = request.requestType === 'Rent'
      await updateHandoverStatus(request.id, 'Received')
      await addNotification({
        userId: request.ownerId, type: 'update', title: isRentReq ? 'Item received' : 'Order delivered',
        desc: isRentReq
          ? `${request.requesterName} confirmed they received "${request.resourceTitle}".`
          : `${request.requesterName} confirmed "${request.resourceTitle}" was delivered. Order completed!`,
      })
      dispatch({ type: 'UPDATE_REQUEST', payload: { id: request.id, changes: { handoverStatus: 'Received', ...(isRentReq ? {} : { status: 'Completed' }) } } })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <UserLayout title={t('myRequests_title')} subtitle={t('myRequests_subtitle')}>
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
            <RefreshCw size={44} strokeWidth={1.5} color="var(--sage)" />
          </div>
          {t('empty_noRequests')}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('col_resource')}</th>
                <th>{t('col_owner')}</th>
                <th>{t('col_type')}</th>
                <th>{t('col_amount')}</th>
                <th>{t('col_requestedOn')}</th>
                <th>{t('col_payment')}</th>
                <th>{t('col_status')}</th>
                <th>{t('col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.resourceTitle}</td>
                  <td>{r.ownerName}</td>
                  <td>{r.requestType || '—'}{r.requestType === 'Rent' && r.rentalDuration ? ` (${r.rentalDuration}d)` : ''}</td>
                  <td>₹{r.totalAmount ?? r.amount ?? 0}</td>
                  <td>{r.requestedOn}</td>
                  <td>{r.paymentStatus && r.paymentStatus !== 'Unpaid' ? <span className="badge badge-green">{r.paymentStatus === 'Cash on Pickup' ? t('status_CashOnPickup') : t('status_Paid')}</span> : <span className="badge badge-gray">{t('status_Unpaid')}</span>}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[r.status] || 'badge-gray'}`}>{t(STATUS_KEY[r.status]) || r.status}</span>
                    {r.extensionStatus === 'Approved' && r.extensionPaymentStatus === 'Unpaid' && (
                      <div style={{ marginTop: 4 }}>
                        <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                          Ext Approved (Pay ₹{r.extensionAmount})
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
                    {r.extensionStatus === 'Requested' && (
                      <div style={{ marginTop: 4 }}>
                        <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                          Ext Requested (+{r.extensionDays}d)
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/requests/${r.id}`)}>{t('common_view')}</button>
                    {r.extensionStatus === 'Approved' && r.extensionPaymentStatus === 'Unpaid' && (
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/requests/${r.id}`)}>
                        Pay Ext (₹{r.extensionAmount})
                      </button>
                    )}
                    {r.status === 'Approved' && (!r.paymentStatus || r.paymentStatus === 'Unpaid') && (
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/requests/${r.id}`)}>{t('action_payNow')}</button>
                    )}
                    {r.status === 'Approved' && r.handoverStatus === 'Not Handed Over' && (
                      <span className="badge badge-amber" style={{ alignSelf: 'center' }}>Waiting for {r.requestType === 'Rent' ? 'handover' : 'delivery'}</span>
                    )}
                    {r.status === 'Approved' && r.handoverStatus === 'Handed Over' && (
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/requests/${r.id}`)}>
                        <Key size={14} /> Enter Code to Confirm
                      </button>
                    )}
                    {r.requestType === 'Rent' && r.status === 'Approved' && r.handoverStatus === 'Received' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleMarkReturned(r)}>
                        <RotateCcw size={14} /> Mark as Returned
                      </button>
                    )}
                    {r.requestType === 'Rent' && r.status === 'Approved' && r.handoverStatus === 'Returned' && (
                      <span className="badge badge-gray" style={{ alignSelf: 'center' }}>Waiting for owner to confirm return</span>
                    )}
                    {r.paymentStatus && r.paymentStatus !== 'Unpaid' && (
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/requests/${r.id}/receipt`)}>{t('action_receipt')}</button>
                    )}
                    {r.status === 'Pending' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(r.id)}>{t('common_cancel')}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </UserLayout>
  )
}
