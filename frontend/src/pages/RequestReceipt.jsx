// pages/RequestReceipt.jsx
// A clean, printable payment receipt for a completed payment step.
// Accessible to the requester, the resource owner, or an admin
// (monitoring only — same as everywhere else in the request flow).
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import UserLayout from '../components/UserLayout.jsx'
import AdminLayout from '../components/AdminLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getRequestById } from '../services/api.js'
import { Printer, AlertTriangle, Lock, Receipt, Sparkles } from 'lucide-react'

function Row({ label, value, bold }) {
  return (
    <div className="receipt-row" style={bold ? { fontWeight: 700 } : undefined}>
      <span style={{ color: 'var(--sage)' }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}

export default function RequestReceipt() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getRequestById(id)
        setRequest(data)
      } catch (err) {
        setError('This request could not be found.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const Layout = isAdmin ? AdminLayout : UserLayout

  if (loading) {
    return <Layout title="Receipt"><div className="loading-wrap"><span className="spinner" />Loading receipt...</div></Layout>
  }

  if (error || !request) {
    return <Layout title="Receipt"><div className="empty-state"><AlertTriangle size={36} color="var(--amber)" style={{ marginBottom: 8 }} /><div>{error}</div></div></Layout>
  }

  const canView = isAdmin || request.requesterId === user?.id || request.ownerId === user?.id
  if (!canView) {
    return <Layout title="Receipt"><div className="empty-state"><Lock size={36} color="var(--red)" style={{ marginBottom: 8 }} /><div>You don't have access to this receipt.</div></div></Layout>
  }

  if (!request.paymentStatus || request.paymentStatus === 'Unpaid') {
    return (
      <Layout title="Receipt">
        <div className="empty-state"><Receipt size={36} color="var(--sage)" style={{ marginBottom: 8 }} /><div>No payment has been recorded for this request yet.</div></div>
      </Layout>
    )
  }

  const isCash = request.paymentStatus === 'Cash on Pickup'
  const paymentDate = request.paymentDate ? new Date(request.paymentDate) : null

  return (
    <Layout title="Payment Receipt" subtitle={`Request ${request.id}`}>
      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 20, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
        <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Printer size={16} style={{ marginRight: 6 }} /> Print Receipt
        </button>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>Back</button>
      </div>

      <div className="receipt-card">
        <div className="receipt-header">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-dark)', display: 'inline-flex', alignItems: 'center' }}>
            <span className="logo-mark" style={{ display: 'inline-flex', marginRight: 8, alignItems: 'center', justifyContent: 'center' }}><Sparkles size={14} /></span>ShelfShare
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--sage)', marginTop: 4 }}>
            {isCash ? 'Cash Payment Acknowledgement' : 'Payment Receipt'}
          </div>
        </div>

        <Row label="Receipt No." value={request.paymentTransactionId || `CASH-${request.id}`} />
        <Row label="Date" value={paymentDate ? paymentDate.toLocaleString() : '—'} />
        <Row label="Status" value={<span className="receipt-status-paid">{isCash ? 'To be paid in cash on pickup' : 'PAID'}</span>} />

        <div style={{ margin: '18px 0', borderTop: '1px dashed var(--border)' }} />

        <Row label="Resource" value={request.resourceTitle} />
        <Row label="Request type" value={request.requestType} />
        {request.requestType === 'Rent' && <Row label="Rental duration" value={`${request.rentalDuration} day${request.rentalDuration > 1 ? 's' : ''}`} />}
        {request.requestType === 'Buy' && <Row label="Quantity" value={request.quantity || 1} />}
        <Row label="Paid by (requester)" value={request.requesterName} />
        <Row label="Received by (owner)" value={request.ownerName} />
        <Row label="Payment method" value={request.paymentMethod} />
        {request.pickupLocation && <Row label="Pickup location" value={request.pickupLocation} />}

        <div style={{ margin: '18px 0', borderTop: '1px dashed var(--border)' }} />

        <Row label={request.requestType === 'Rent' ? 'Rental amount' : 'Item amount'} value={`₹${request.amount ?? 0}`} />
        {request.deposit > 0 && <Row label="Security deposit" value={`₹${request.deposit}`} />}
        <Row label="Total amount" value={`₹${request.totalAmount ?? request.amount ?? 0}`} bold />
        {request.returnCondition && (
          <>
            <div style={{ margin: '18px 0', borderTop: '1px dashed var(--border)' }} />
            <Row label="Return condition" value={request.returnCondition} />
            {request.depositDeduction > 0 && <Row label="Deposit deducted" value={`₹${request.depositDeduction}`} />}
            <Row label="Deposit refunded" value={`₹${request.depositRefund ?? request.deposit ?? 0}`} bold />
          </>
        )}

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.72rem', color: 'var(--sage)' }}>
          This is a system-generated receipt from ShelfShare — a Modern Web Technology academic project.
          {!isCash && ' No real payment gateway was used to process this transaction.'}
        </div>
      </div>
    </Layout>
  )
}
