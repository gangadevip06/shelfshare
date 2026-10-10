// pages/RequestDetails.jsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { 
  Banknote, 
  Smartphone, 
  CreditCard, 
  Wallet, 
  CheckCircle2, 
  Truck, 
  RotateCcw, 
  AlertTriangle,
  X,
  Clock,
  Calendar,
  CreditCard as CardIcon,
  ShieldAlert,
  ArrowRight,
  Phone,
  MessageSquare,
  Send,
} from 'lucide-react'
import UserLayout from '../components/UserLayout.jsx'
import AdminLayout from '../components/AdminLayout.jsx'
import OrderTracker from '../components/OrderTracker.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  getRequests, getRequestById, updateRequestStatus, cancelRequest, addNotification,
  approveRequestWithLocation, recordPayment, updateHandoverStatus, confirmReceivedWithCode, completeWithConditionReport,
  requestRentalExtension, approveRentalExtension, rejectRentalExtension, recordExtensionPayment,
  getUserContactInfo, sendMessage,
} from '../services/api.js'
import ContactModal from '../components/ContactModal.jsx'

const STATUS_BADGE = { Pending: 'badge-amber', Approved: 'badge-green', Rejected: 'badge-red', Completed: 'badge-gray', Cancelled: 'badge-red' }

const PAYMENT_METHODS = [
  { id: 'Razorpay', label: 'Razorpay (Cards, UPI, NetBanking)', icon: CreditCard },
  { id: 'UPI', label: 'UPI Direct', icon: Smartphone },
  { id: 'Google Pay', label: 'Google Pay', icon: Wallet },
  { id: 'Card', label: 'Debit / Credit Card', icon: CreditCard },
  { id: 'Cash on Pickup', label: 'Cash on Pickup', icon: Banknote },
]

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '0.92rem' }}>
      <span style={{ color: 'var(--sage)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}

export default function RequestDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [conflictingRequests, setConflictingRequests] = useState([])
  const [activeExtensionConflict, setActiveExtensionConflict] = useState(null)
  const [enteredCode, setEnteredCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [showConditionModal, setShowConditionModal] = useState(false)
  const [returnCondition, setReturnCondition] = useState('Good')
  const [returnComment, setReturnComment] = useState('')
  const [deduction, setDeduction] = useState(0)

  const [showApproveModal, setShowApproveModal] = useState(false)
  const [pickupLocation, setPickupLocation] = useState('')

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('')
  const [upiId, setUpiId] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [paying, setPaying] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  // Rental Extension States
  const [showExtensionModal, setShowExtensionModal] = useState(false)
  const [extensionDays, setExtensionDays] = useState(2)
  const [extensionReason, setExtensionReason] = useState('')
  const [submittingExtension, setSubmittingExtension] = useState(false)

  const [showExtensionPaymentModal, setShowExtensionPaymentModal] = useState(false)
  const [extPaymentMethod, setExtPaymentMethod] = useState('')
  const [extUpiId, setExtUpiId] = useState('')
  const [extPaying, setExtPaying] = useState(false)
  const [extPaymentError, setExtPaymentError] = useState('')
  const [extDecisionLoading, setExtDecisionLoading] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getRequestById(id)
      setRequest(data)

      if (data && data.resourceId) {
        const allRequests = await getRequests()
        // If this request is an active rental with extension requested or approved
        const extStart = data.endDate || data.requestedOn
        const extEnd = data.extensionEndDate || data.endDate
        const conflicts = (allRequests || []).filter((r) =>
          r.id !== data.id &&
          r.resourceId === data.resourceId &&
          (r.status === 'Pending' || r.status === 'Approved') &&
          r.startDate &&
          r.startDate <= extEnd &&
          r.endDate >= extStart
        )
        setConflictingRequests(conflicts)

        // If this request is Pending (e.g. Buyer B), check if another active rental has a pending extension
        const activeExt = (allRequests || []).find((r) =>
          r.id !== data.id &&
          r.resourceId === data.resourceId &&
          (r.extensionStatus === 'Requested' || r.extensionStatus === 'Pending') &&
          r.startDate &&
          r.startDate <= (data.endDate || data.requestedOn) &&
          (r.extensionEndDate || r.endDate) >= (data.startDate || data.requestedOn)
        )
        setActiveExtensionConflict(activeExt || null)
      }
    } catch (err) {
      setError('This request could not be found.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const setStatus = async (status) => {
    await updateRequestStatus(request.id, status)
    await addNotification({
      userId: request.requesterId, type: status === 'Rejected' ? 'rejected' : 'update',
      title: `Request ${status.toLowerCase()}`,
      desc: `Your ${request.requestType?.toLowerCase() || ''} request for "${request.resourceTitle}" was ${status.toLowerCase()} by ${request.ownerName}.`,
    })
    setFeedback(`Request marked as ${status}.`)
    load()
  }

  const handleCompleteWithCondition = async () => {
    await completeWithConditionReport(request.id, { condition: returnCondition, comment: returnComment, deduction })
    const refundMsg = deduction > 0 ? ` ₹${deduction} deducted from your deposit.` : ' Your full deposit will be refunded.'
    await addNotification({
      userId: request.requesterId, type: 'update', title: 'Rental completed',
      desc: `${request.ownerName} confirmed the return of "${request.resourceTitle}" — condition: ${returnCondition}.${refundMsg}`,
    })
    try {
      await sendMessage({
        resourceId: request.resourceId,
        resourceTitle: request.resourceTitle,
        senderId: user?.id || request.ownerId,
        senderName: user?.name || request.ownerName,
        receiverId: request.requesterId,
        receiverName: request.requesterName,
        text: `Hi ${request.requesterName}, I have inspected "${request.resourceTitle}" and confirmed the return (Condition: ${returnCondition}).${refundMsg} Thank you for sharing with ShelfShare!`,
      })
    } catch (e) {
      console.warn('Failed to send complete chat message', e)
    }
    setShowConditionModal(false)
    setFeedback('Return confirmed and rental completed.')
    load()
  }

  const handleApprove = async () => {
    if (!pickupLocation.trim()) return
    await approveRequestWithLocation(request.id, pickupLocation.trim())
    await addNotification({
      userId: request.requesterId, type: 'approved',
      title: 'Request approved',
      desc: `${request.ownerName} approved your request for "${request.resourceTitle}". Pickup: ${pickupLocation.trim()}.`,
    })
    try {
      await sendMessage({
        resourceId: request.resourceId,
        resourceTitle: request.resourceTitle,
        senderId: user?.id || request.ownerId,
        senderName: user?.name || request.ownerName,
        receiverId: request.requesterId,
        receiverName: request.requesterName,
        text: `Hi ${request.requesterName}, I've approved your request for "${request.resourceTitle}"! Pickup / handover location: ${pickupLocation.trim()}.`,
      })
    } catch (e) {
      console.warn('Failed to send approve chat message', e)
    }
    setShowApproveModal(false)
    setFeedback('Request approved. The requester has been notified of the pickup location.')
    load()
  }

  const handleCancel = async () => {
    await cancelRequest(request.id)
    setFeedback('Request cancelled.')
    load()
  }

  const handleHandover = async () => {
    const updated = await updateHandoverStatus(request.id, 'Handed Over')
    const code = updated?.handoverCode || request.handoverCode || String(Math.floor(100000 + Math.random() * 900000))
    await addNotification({
      userId: request.requesterId, type: 'update', title: isRent ? 'Item handed over / out for delivery' : 'Out for delivery',
      desc: isRent
        ? `${request.ownerName} marked "${request.resourceTitle}" as handed over / out for delivery. Your 6-digit verification code is: ${code}.`
        : `${request.ownerName} marked "${request.resourceTitle}" as out for delivery. Your 6-digit verification code is: ${code}.`,
    })
    try {
      await sendMessage({
        resourceId: request.resourceId,
        resourceTitle: request.resourceTitle,
        senderId: user?.id || request.ownerId,
        senderName: user?.name || request.ownerName,
        receiverId: request.requesterId,
        receiverName: request.requesterName,
        text: `Hi ${request.requesterName}, "${request.resourceTitle}" is now out for delivery / ready for handover! Your 6-digit verification code is: ${code}. Please verify and enter this code to confirm receipt once you inspect the item.`,
      })
    } catch (e) {
      console.warn('Failed to send handover chat message', e)
    }
    setFeedback(`Marked as ${isRent ? 'handed over' : 'out for delivery'}. Verification code sent to ${request.requesterName}.`)
    load()
  }

  const handleConfirmReceived = async () => {
    setCodeError('')
    try {
      await confirmReceivedWithCode(request.id, enteredCode)
      await addNotification({
        userId: request.ownerId, type: 'update', title: isRent ? 'Item received' : 'Order delivered',
        desc: isRent
          ? `${request.requesterName} verified the 6-digit code and confirmed receiving "${request.resourceTitle}".`
          : `${request.requesterName} verified the 6-digit code and confirmed "${request.resourceTitle}" was delivered. Order completed!`,
      })
      try {
        await sendMessage({
          resourceId: request.resourceId,
          resourceTitle: request.resourceTitle,
          senderId: user?.id || request.requesterId,
          senderName: user?.name || request.requesterName,
          receiverId: request.ownerId,
          receiverName: request.ownerName,
          text: `Hi ${request.ownerName}, I have verified the 6-digit code and confirmed receipt of "${request.resourceTitle}". Everything is in order!`,
        })
      } catch (e) {
        console.warn('Failed to send received chat message', e)
      }
      setEnteredCode('')
      setFeedback(isRent ? "Thanks for confirming — enjoy! Remember to mark it returned when you're done." : 'Delivered! Your order is now complete. 🎉')
      load()
    } catch (err) {
      setCodeError(err.message)
    }
  }

  const handleMarkReturned = async () => {
    await updateHandoverStatus(request.id, 'Returned')
    await addNotification({
      userId: request.ownerId, type: 'update', title: 'Item returned',
      desc: `${request.requesterName} marked "${request.resourceTitle}" as returned. Please confirm once you've received it back.`,
    })
    try {
      await sendMessage({
        resourceId: request.resourceId,
        resourceTitle: request.resourceTitle,
        senderId: user?.id || request.requesterId,
        senderName: user?.name || request.requesterName,
        receiverId: request.ownerId,
        receiverName: request.ownerName,
        text: `Hi ${request.ownerName}, I have returned "${request.resourceTitle}". Please inspect the item and complete the rental return.`,
      })
    } catch (e) {
      console.warn('Failed to send returned chat message', e)
    }
    setFeedback('Marked as returned. Waiting for the owner to confirm.')
    load()
  }

  const handlePay = async () => {
    if (!selectedMethod) return
    if (selectedMethod === 'UPI' && !upiId.trim()) { setPaymentError('Enter your UPI ID.'); return }
    if (selectedMethod === 'Card' && cardNumber.replace(/\s/g, '').length < 12) { setPaymentError('Enter a valid card number.'); return }
    setPaymentError('')
    setPaying(true)
    try {
      // Simulated processing delay — there is no real payment gateway here.
      await new Promise((resolve) => setTimeout(resolve, 1100))
      const transactionId = selectedMethod === 'Cash on Pickup'
        ? null
        : selectedMethod === 'Razorpay'
          ? `pay_${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`
          : `TXN${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`
      await recordPayment(request.id, { method: selectedMethod, transactionId })
      const payAmount = request.totalAmount ?? request.amount ?? 0

      await addNotification({
        userId: request.ownerId,
        type: 'update',
        title: selectedMethod === 'Cash on Pickup' ? 'Cash on pickup selected' : 'Payment received',
        desc: `${request.requesterName} ${selectedMethod === 'Cash on Pickup' ? 'selected Cash on Pickup' : `paid ₹${payAmount} via ${selectedMethod}`} for "${request.resourceTitle}".`,
      })

      // Send automatic message into chat thread so seller & buyer have immediate communication record
      try {
        await sendMessage({
          resourceId: request.resourceId,
          resourceTitle: request.resourceTitle,
          senderId: user?.id || request.requesterId,
          senderName: user?.name || request.requesterName,
          receiverId: request.ownerId,
          receiverName: request.ownerName,
          text: selectedMethod === 'Cash on Pickup'
            ? `Hi ${request.ownerName}, I've confirmed Cash on Pickup for "${request.resourceTitle}" (Total: ₹${payAmount}). Looking forward to the handover!`
            : `Hi ${request.ownerName}, I've completed the payment of ₹${payAmount} via ${selectedMethod} (Txn: ${transactionId}) for "${request.resourceTitle}".`,
        })
      } catch (e) {
        console.warn('Failed to send payment chat message', e)
      }

      setShowPaymentModal(false)
      setFeedback(selectedMethod === 'Cash on Pickup' ? 'Payment method set to Cash on Pickup.' : 'Payment successful!')
      load()
    } finally {
      setPaying(false)
    }
  }

  // Extension calculation helpers
  const dailyRate = request?.rentalDuration ? Math.round((request.amount || 0) / request.rentalDuration) : (request?.amount || 0)
  const extensionAmount = dailyRate * extensionDays
  const baseEndDate = request?.endDate || (request?.requestedOn ? new Date(new Date(request.requestedOn).getTime() + (request.rentalDuration || 1) * 86400000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
  const calculatedNewEndDate = new Date(new Date(baseEndDate).getTime() + extensionDays * 86400000).toISOString().slice(0, 10)

  const handleOpenOwnerWhatsAppForExtension = (
    days = request?.extensionDays || extensionDays,
    endDate = request?.extensionEndDate || calculatedNewEndDate,
    amount = request?.extensionAmount || extensionAmount,
    reason = request?.extensionReason || extensionReason
  ) => {
    const ownerContact = getUserContactInfo(request?.ownerId, request?.ownerName, request)
    const ownerPhone = request?.ownerPhone || ownerContact.phone || ''
    const digitsOnly = ownerPhone.replace(/\D/g, '')
    const waPhone = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly

    if (!waPhone) {
      alert(`Seller's phone number is not available.`)
      return
    }

    const reasonText = (reason || '').trim() ? `\n• Note: "${reason.trim()}"` : ''
    const autoMessage = `Hello ${request?.ownerName || 'there'},\n\nI have requested a rental extension for "${request?.resourceTitle || 'your item'}" on ShelfShare.\n\n• Extension Duration: +${days} day(s)\n• Extended Until: ${endDate}\n• Extension Fee: ₹${amount}${reasonText}\n\nPlease review and approve my request on ShelfShare: ${window.location.origin}/requests/${request?.id}\n\nThank you!`

    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(autoMessage)}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  const handleRequestExtension = async (openWhatsApp = false) => {
    setSubmittingExtension(true)
    try {
      await requestRentalExtension(request.id, {
        additionalDays: extensionDays,
        newEndDate: calculatedNewEndDate,
        additionalAmount: extensionAmount,
        reason: extensionReason.trim(),
      })
      setShowExtensionModal(false)
      setFeedback(`Rental extension request for +${extensionDays} days (₹${extensionAmount}) submitted to ${request.ownerName}.`)

      if (openWhatsApp) {
        handleOpenOwnerWhatsAppForExtension(extensionDays, calculatedNewEndDate, extensionAmount, extensionReason)
      }

      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmittingExtension(false)
    }
  }

  const handleApproveExtension = async () => {
    if (extDecisionLoading) return
    setExtDecisionLoading(true)
    setError('')
    try {
      await approveRentalExtension(request.id)
      setFeedback(`Extension approved! Rental period extended to ${request.extensionEndDate || request.endDate}. Waiting for ${request.requesterName} to pay the extension fee of ₹${request.extensionAmount}.`)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setExtDecisionLoading(false)
    }
  }

  const handleRejectExtension = async () => {
    if (extDecisionLoading) return
    setExtDecisionLoading(true)
    setError('')
    try {
      await rejectRentalExtension(request.id, 'Resource unavailable for extension')
      setFeedback('Rental extension declined. Renter must return the item by the original return date.')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setExtDecisionLoading(false)
    }
  }

  const handlePayExtension = async () => {
    if (!extPaymentMethod) return
    if (extPaymentMethod === 'UPI' && !extUpiId.trim()) {
      setExtPaymentError('Enter your UPI ID.')
      return
    }
    setExtPaying(true)
    setExtPaymentError('')
    try {
      await new Promise((r) => setTimeout(r, 900))
      const transactionId = extPaymentMethod === 'Cash on Pickup'
        ? null
        : extPaymentMethod === 'Razorpay'
          ? `pay_ext_${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`
          : `EXT-${Date.now().toString().slice(-6)}`
      await recordExtensionPayment(request.id, { method: extPaymentMethod, transactionId })
      setShowExtensionPaymentModal(false)
      setFeedback(`Extension fee of ₹${request.extensionAmount} paid successfully via ${extPaymentMethod}! Extended through ${request.endDate}.`)
      load()
    } catch (err) {
      setExtPaymentError(err.message)
    } finally {
      setExtPaying(false)
    }
  }

  const Layout = isAdmin ? AdminLayout : UserLayout

  if (loading) {
    return <Layout title="Request Details"><div className="loading-wrap"><span className="spinner" />Loading request...</div></Layout>
  }
  if (error || !request) {
    return <Layout title="Request Details"><div className="empty-state"><AlertTriangle size={36} color="var(--amber)" style={{ marginBottom: 8 }} /><div>{error}</div></div></Layout>
  }

  const isOwner = Boolean(
    user && (
      (request.ownerId && String(request.ownerId) === String(user.id)) ||
      (request.ownerEmail && user.email && request.ownerEmail.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
      (request.ownerName && user.name && (
        request.ownerName.toLowerCase().trim() === user.name.toLowerCase().trim() ||
        request.ownerName.toLowerCase().includes(user.name.toLowerCase().trim()) ||
        user.name.toLowerCase().includes(request.ownerName.toLowerCase().trim())
      ))
    )
  )
  const isRequester = Boolean(
    user && (
      (request.requesterId && String(request.requesterId) === String(user.id)) ||
      (request.requesterEmail && user.email && request.requesterEmail.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
      (request.requesterName && user.name && (
        request.requesterName.toLowerCase().trim() === user.name.toLowerCase().trim() ||
        request.requesterName.toLowerCase().includes(user.name.toLowerCase().trim()) ||
        user.name.toLowerCase().includes(request.requesterName.toLowerCase().trim())
      ))
    )
  )
  const isRent = request.requestType === 'Rent'
  const isPaid = request.paymentStatus === 'Paid' || request.paymentStatus === 'Cash on Pickup'
  const canMarkCompleted = isRent ? (isPaid && request.handoverStatus === 'Returned') : isPaid
  const hasPayment = request.paymentStatus && request.paymentStatus !== 'Unpaid'

  return (
    <Layout title="Request Details" subtitle={isAdmin ? `Request ${request.id} · monitoring only` : `Request ${request.id}`}>
      {feedback && <div className="alert alert-success">{feedback}</div>}
      {isAdmin && <div className="alert" style={{ background: 'var(--paper)', border: '1px solid var(--border)' }}>Admins can monitor requests but approval/rejection/payment is handled by the resource owner and requester.</div>}

      <div className="card" style={{ padding: 24, maxWidth: 640 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ fontSize: '1.2rem' }}>{request.resourceTitle}</h2>
          <span className={`badge ${STATUS_BADGE[request.status] || 'badge-gray'}`}>{request.status}</span>
        </div>

        {/* Bumped by Active Extension Priority Alert */}
        {request.bumpedByExtension && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, margin: '14px 0', borderLeft: '4px solid #ef4444' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2, color: '#ef4444' }} />
            <div>
              <strong style={{ color: '#b91c1c' }}>Product Unavailable — Active Renter Extension Priority</strong>
              <div style={{ fontSize: '0.88rem', marginTop: 4, lineHeight: 1.5, color: '#7f1d1d' }}>
                This product is unavailable for your reserved dates because the current renter in possession of the item requested and was granted a rental extension. In accordance with platform policy, ongoing active rentals receive extension priority.
              </div>
              <div style={{ fontSize: '0.82rem', marginTop: 6, color: '#991b1b', fontWeight: 600 }}>
                💬 {request.ownerName} has automatically dispatched an apology notification and direct message to your inbox.
              </div>
            </div>
          </div>
        )}

        {/* Advance Pre-Booking Indicator */}
        {request.isPreBooking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.25)', margin: '12px 0', fontSize: '0.85rem', color: '#1d4ed8' }}>
            <Calendar size={16} />
            <span><strong>Advance Pre-Booking:</strong> Reserved from {request.startDate} through {request.endDate}.</span>
          </div>
        )}

        {/* Conflict Alert for Pending Request when an Active Extension exists */}
        {request.status === 'Pending' && activeExtensionConflict && (
          <div style={{ background: '#fff7ed', border: '1.5px solid #f97316', borderRadius: 10, padding: 14, margin: '14px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#c2410c' }}>
              <AlertTriangle size={18} />
              <span>Conflicting Active Extension Request</span>
            </div>
            <p style={{ fontSize: '0.86rem', color: '#9a3412', marginTop: 6, marginBottom: 6 }}>
              Current renter <strong>{activeExtensionConflict.requesterName}</strong> has requested a rental extension until <strong>{activeExtensionConflict.extensionEndDate}</strong>.
            </p>
            <div style={{ fontSize: '0.82rem', color: '#7c2d12', background: 'rgba(255,255,255,0.7)', padding: 8, borderRadius: 6 }}>
              ⚖️ <strong>Single Buyer Acceptance Policy:</strong> Only ONE buyer can have this item. Approving this request will automatically decline {activeExtensionConflict.requesterName}'s extension request.
            </div>
          </div>
        )}

        {/* Rental Extension Requested Alert */}
        {(request.extensionStatus === 'Requested' || request.extensionStatus === 'Pending') && (
          <div style={{ background: '#fffbeb', border: '1.5px solid #f59e0b', borderRadius: 10, padding: 16, margin: '16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#b45309', marginBottom: 6 }}>
              <Clock size={18} /> Rental Extension Requested
            </div>
            <p style={{ fontSize: '0.88rem', color: '#78350f', margin: '4px 0' }}>
              {isRequester ? 'You have requested' : `${request.requesterName} requested`} to extend this rental by <strong>+{request.extensionDays} days</strong> until <strong>{request.extensionEndDate}</strong> for an additional <strong>₹{request.extensionAmount}</strong>.
            </p>
            {request.extensionReason && (
              <p style={{ fontSize: '0.82rem', color: '#92400e', fontStyle: 'italic', margin: '4px 0' }}>
                Note from renter: "{request.extensionReason}"
              </p>
            )}

            {/* Overlapping Conflict Alert - Single Member Selection */}
            {conflictingRequests.length > 0 && (
              <div style={{ background: '#fff7ed', border: '1.5px solid #ea580c', borderRadius: 8, padding: 12, margin: '12px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#c2410c', fontSize: '0.9rem' }}>
                  <AlertTriangle size={16} /> Conflict Alert: Only ONE buyer can be accepted
                </div>
                <div style={{ fontSize: '0.84rem', color: '#9a3412', marginTop: 4, lineHeight: 1.45 }}>
                  {conflictingRequests.map((c) => (
                    <div key={c.id} style={{ marginTop: 2 }}>
                      • <strong>{c.requesterName}</strong> has placed a request for <strong>{c.startDate} to {c.endDate}</strong> (Status: {c.status}).
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#7c2d12', marginTop: 8, padding: 8, background: '#ffedd5', borderRadius: 6, lineHeight: 1.4 }}>
                  <div>• <strong>Approve Extension:</strong> Accepts {request.requesterName}'s extension until {request.extensionEndDate}. Conflicting request(s) will be declined automatically.</div>
                  <div style={{ marginTop: 3 }}>• <strong>Decline Extension:</strong> Rejects this extension so other buyer(s) can book. {request.requesterName} must return the item on {request.endDate}.</div>
                </div>
              </div>
            )}

            {isOwner && (
              <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={extDecisionLoading}
                  onClick={handleApproveExtension}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                >
                  <CheckCircle2 size={16} />
                  {extDecisionLoading ? 'Processing...' : `Approve Extension (+₹${request.extensionAmount})`}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={extDecisionLoading}
                  onClick={handleRejectExtension}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#dc2626', borderColor: '#fca5a5' }}
                >
                  <X size={16} />
                  {extDecisionLoading ? 'Processing...' : 'Decline Extension'}
                </button>
                <div style={{ width: '100%', fontSize: '0.78rem', color: '#b45309', marginTop: 4 }}>
                  ⚠️ <strong>One-time decision:</strong> Accepting or declining is final. If accepted, the renter will be prompted to pay ₹{request.extensionAmount}.
                </div>
              </div>
            )}
            {isRequester && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: '0.84rem', color: '#b45309', marginBottom: 8, fontWeight: 600 }}>
                  Waiting for {request.ownerName} to accept or decline your extension request.
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenOwnerWhatsAppForExtension()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    background: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)',
                  }}
                >
                  <Send size={14} /> Send Auto Message on WhatsApp to {request.ownerName}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Extension Declined Notice */}
        {request.extensionStatus === 'Rejected' && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, margin: '12px 0', fontSize: '0.85rem', color: '#991b1b' }}>
            <strong>Rental Extension Declined:</strong> {request.extensionRejectReason || 'Resource unavailable for extension'}. Item must be returned by original return date ({request.endDate}).
          </div>
        )}

        {/* Extension Approved - Payment Pending */}
        {request.extensionStatus === 'Approved' && request.extensionPaymentStatus === 'Unpaid' && (
          <div style={{ background: '#ecfdf5', border: '2px solid #10b981', borderRadius: 12, padding: 18, margin: '16px 0', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#047857', fontSize: '1.05rem', marginBottom: 6 }}>
              <CheckCircle2 size={20} color="#10b981" /> Rental Extension Approved!
            </div>
            <p style={{ fontSize: '0.9rem', color: '#065f46', margin: '4px 0 10px 0', lineHeight: 1.5 }}>
              The rental period for <strong>"{request.resourceTitle}"</strong> has been extended until <strong>{request.endDate}</strong> (+{request.extensionDays || 0} days).
            </p>

            {isRequester && (
              <div style={{ background: '#ffffff', borderRadius: 10, padding: 14, border: '1px solid #a7f3d0', marginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#065f46', fontSize: '0.95rem' }}>
                      Additional Amount Due: <span style={{ color: '#059669', fontSize: '1.2rem', fontWeight: 800 }}>₹{request.extensionAmount}</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#047857', marginTop: 3 }}>
                      Pay for the additional {request.extensionDays || 0} rental day(s) to finalize your rental extension.
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowExtensionPaymentModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
                      cursor: 'pointer',
                    }}
                  >
                    <CreditCard size={18} /> Pay Extension Fee (₹{request.extensionAmount})
                  </button>
                </div>
              </div>
            )}

            {isOwner && (
              <div style={{ fontSize: '0.85rem', color: '#065f46', marginTop: 8, background: '#d1fae5', padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⏳ Extension confirmed by you. Waiting for <strong>{request.requesterName}</strong> to pay the additional ₹{request.extensionAmount}.</span>
              </div>
            )}

            {!isRequester && !isOwner && (
              <div style={{ marginTop: 10, background: '#ffffff', borderRadius: 10, padding: 12, border: '1px solid #a7f3d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <span style={{ fontSize: '0.88rem', color: '#065f46', fontWeight: 600 }}>
                    Extension fee of ₹{request.extensionAmount} is awaiting payment.
                  </span>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowExtensionPaymentModal(true)}>
                    Pay Extension Fee (₹{request.extensionAmount})
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Extension Approved - Paid */}
        {request.extensionStatus === 'Approved' && request.extensionPaymentStatus === 'Paid' && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: 12, margin: '12px 0', fontSize: '0.85rem' }}>
            <span style={{ color: '#15803d', fontWeight: 600 }}>✓ Rental Extended:</span> Duration extended through {request.endDate} (+₹{request.extensionAmount} paid via {request.extensionPaymentMethod || 'Online'}).
          </div>
        )}

        <OrderTracker request={request} />

        <Row label="Request ID" value={request.id} />
        <Row label="Requested by" value={request.requesterName} />
        <Row label="Resource owner" value={request.ownerName} />
        <Row label="Request type" value={request.requestType || '—'} />
        {request.requestType === 'Rent' && <Row label="Rental duration" value={`${request.rentalDuration} day${request.rentalDuration > 1 ? 's' : ''}`} />}
        {request.requestType === 'Buy' && <Row label="Quantity" value={request.quantity || 1} />}
        <Row label="Amount" value={`₹${request.amount ?? 0}`} />
        {request.deposit > 0 && <Row label="Deposit" value={`₹${request.deposit}`} />}
        <Row label="Total amount" value={`₹${request.totalAmount ?? request.amount ?? 0}`} />
        <Row
          label="Payment status"
          value={
            isPaid ? (
              <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={13} /> {request.paymentStatus}
              </span>
            ) : (
              <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} /> Unpaid
              </span>
            )
          }
        />
        {hasPayment && <Row label="Payment method" value={request.paymentMethod} />}
        {hasPayment && (request.paymentTransactionId || request.transactionId) && (
          <Row label="Transaction ID" value={request.paymentTransactionId || request.transactionId} />
        )}
        <Row label="Request date" value={request.requestedOn} />
        {request.pickupLocation && <Row label="Pickup location" value={request.pickupLocation} />}
        {request.returnCondition && <Row label="Return condition" value={request.returnCondition} />}
        {request.status === 'Completed' && request.deposit > 0 && <Row label="Deposit refund" value={`₹${request.depositRefund ?? request.deposit}${request.depositDeduction > 0 ? ` (₹${request.depositDeduction} deducted)` : ''}`} />}
        {request.message && <div style={{ marginTop: 16 }}><div className="eyebrow">Message</div><p style={{ marginTop: 6, lineHeight: 1.6 }}>{request.message}</p></div>}

        {isOwner && request.handoverStatus === 'Handed Over' && request.handoverCode && (
          <div className="card" style={{ padding: 18, marginTop: 20, textAlign: 'center', background: 'var(--paper)' }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Show this to the requester to confirm handover</div>
            <div style={{ display: 'inline-block', background: '#fff', padding: 12, borderRadius: 12 }}>
              <QRCodeSVG value={request.handoverCode} size={128} />
            </div>
            <div style={{ marginTop: 12, fontSize: '1.3rem', fontWeight: 700, letterSpacing: 3 }}>{request.handoverCode}</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--sage)', marginTop: 4 }}>They'll enter this code (or scan the QR) to confirm they received the item.</div>
          </div>
        )}

        {isRequester && request.handoverStatus === 'Handed Over' && (
          <div className="card" style={{ padding: 18, marginTop: 20, background: 'var(--paper)' }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Enter the code shown by {request.ownerName} to confirm</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="form-control"
                value={enteredCode}
                onChange={(e) => { setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setCodeError('') }}
                placeholder="6-digit code"
                style={{ letterSpacing: 3, fontWeight: 700, maxWidth: 180 }}
                maxLength={6}
              />
              <button className="btn btn-primary" disabled={enteredCode.length !== 6} onClick={handleConfirmReceived} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <CheckCircle2 size={16} style={{ marginRight: 6 }} /> {isRent ? 'Confirm Received' : 'Confirm Delivered'}
              </button>
            </div>
            {codeError && <div className="form-error" style={{ marginTop: 8 }}>{codeError}</div>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
          {isOwner && request.status === 'Pending' && !isPaid && (
            <>
              <button className="btn btn-primary" onClick={() => setShowApproveModal(true)}>Approve</button>
              <button className="btn btn-outline" onClick={() => setStatus('Rejected')}>Reject</button>
            </>
          )}
          {isOwner && (request.status === 'Approved' || isPaid) && request.handoverStatus === 'Not Handed Over' && (
            <button className="btn btn-primary" onClick={handleHandover} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Truck size={16} style={{ marginRight: 6 }} /> Mark as {isRent ? 'Handed Over' : 'Out for Delivery'}
            </button>
          )}
          {isRequester && isRent && (request.status === 'Approved' || isPaid) && request.handoverStatus === 'Received' && (
            <button className="btn btn-primary" onClick={handleMarkReturned} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <RotateCcw size={16} style={{ marginRight: 6 }} /> Mark as Returned
            </button>
          )}
          {isOwner && isRent && (request.status === 'Approved' || isPaid) && request.handoverStatus === 'Received' && (
            <span className="badge badge-gray" style={{ alignSelf: 'center' }}>Item with buyer — waiting for return</span>
          )}
          {isRequester && isRent && (request.status === 'Approved' || isPaid) && request.handoverStatus === 'Returned' && (
            <span className="badge badge-gray" style={{ alignSelf: 'center' }}>Waiting for owner to confirm return</span>
          )}
          {isOwner && isRent && (request.status === 'Approved' || isPaid) && request.handoverStatus === 'Returned' && (
            <button
              className="btn btn-primary"
              disabled={!canMarkCompleted}
              title={!canMarkCompleted ? 'Waiting for the requester to complete payment' : ''}
              onClick={() => setShowConditionModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              <CheckCircle2 size={16} style={{ marginRight: 6 }} /> Confirm Return & Complete
            </button>
          )}
          {isRequester && !isPaid && request.status !== 'Rejected' && request.status !== 'Cancelled' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowPaymentModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <CreditCard size={16} /> Pay Now (₹{request.totalAmount ?? request.amount ?? 0})
            </button>
          )}
          {isRequester && isRent && (request.status === 'Approved' || request.handoverStatus === 'Received') && !request.extensionStatus && request.handoverStatus !== 'Returned' && (
            <button className="btn btn-secondary" onClick={() => setShowExtensionModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} /> Request Rental Extension
            </button>
          )}
          {isRequester && request.status === 'Pending' && (
            <button className="btn btn-danger" onClick={handleCancel}>Cancel Request</button>
          )}
          {hasPayment && (isOwner || isRequester) && (
            <button className="btn btn-outline" onClick={() => navigate(`/requests/${request.id}/receipt`)}>View / Print Receipt</button>
          )}
          {(isOwner || isRequester) && (
            <button
              className="btn btn-secondary"
              onClick={() =>
                navigate(
                  `/messages?resourceId=${request.resourceId}&withId=${isOwner ? request.requesterId : request.ownerId}&withName=${encodeURIComponent(isOwner ? request.requesterName : request.ownerName)}&resourceTitle=${encodeURIComponent(request.resourceTitle)}`
                )
              }
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="Chat directly in ShelfShare Messages"
            >
              <MessageSquare size={16} /> {isOwner ? 'Chat with Requester' : 'Chat with Owner'}
            </button>
          )}
          {(isOwner || isRequester) && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowContactModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="Contact via WhatsApp, Phone Call, or Email"
            >
              <Phone size={15} /> {isOwner ? 'Contact Requester' : 'Contact Owner'}
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>

      {showApproveModal && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.05rem' }}>Approve this request</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowApproveModal(false)}><X size={16} /></button>
            </div>
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

      {showConditionModal && (
        <div className="modal-overlay" onClick={() => setShowConditionModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.05rem' }}>Condition report</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowConditionModal(false)}><X size={16} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">How did the item come back?</label>
              <select className="form-control" value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)}>
                <option value="Good">Good — same as before</option>
                <option value="Minor damage">Minor damage / wear</option>
                <option value="Major damage">Major damage</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-control" rows={3} value={returnComment} onChange={(e) => setReturnComment(e.target.value)} placeholder="Any details about the item's condition..." />
            </div>
            {request.deposit > 0 && (
              <div className="form-group">
                <label className="form-label">Deduct from deposit (₹{request.deposit} held)</label>
                <input
                  type="number" min="0" max={request.deposit} className="form-control"
                  value={deduction}
                  onChange={(e) => setDeduction(Math.max(0, Math.min(Number(e.target.value) || 0, request.deposit)))}
                />
              </div>
            )}
            {request.deposit > 0 && (
              <div className="card" style={{ padding: 14, background: 'var(--paper)', marginBottom: 14 }}>
                <div className="calc-row"><span>Deposit held</span><span>₹{request.deposit}</span></div>
                <div className="calc-row"><span>Deduction</span><span>−₹{deduction}</span></div>
                <div className="calc-row total"><span>Refund to requester</span><span>₹{request.deposit - deduction}</span></div>
              </div>
            )}
            <button className="btn btn-primary btn-block" onClick={handleCompleteWithCondition}>
              Confirm & Complete Rental
            </button>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => !paying && setShowPaymentModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.05rem' }}>Choose payment method</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPaymentModal(false)} disabled={paying}><X size={16} /></button>
            </div>

            <div className="card" style={{ padding: 12, background: 'var(--paper)', marginBottom: 16 }}>
              <div className="calc-row total"><span>Amount payable</span><span>₹{request.totalAmount ?? request.amount ?? 0}</span></div>
            </div>

            <div className="payment-method-grid">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`payment-method-btn ${selectedMethod === m.id ? 'active' : ''}`}
                  onClick={() => { setSelectedMethod(m.id); setPaymentError('') }}
                >
                  <span className="ic"><m.icon size={18} /></span>{m.label}
                </button>
              ))}
            </div>

            {selectedMethod === 'Razorpay' && (
              <div style={{ background: '#f0f9ff', border: '1.5px solid #0284c7', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 800, color: '#0c4a6e', fontSize: '1.1rem', letterSpacing: '0.5px' }}>Razorpay</span>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>Trusted Gateway</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>🔒 256-bit Secure</span>
                </div>
                <p style={{ fontSize: '0.84rem', color: '#334155', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
                  Pay ₹{request.totalAmount ?? request.amount ?? 0} seamlessly using <strong>Instant UPI, Cards (Visa/Mastercard/RuPay), NetBanking, or Wallets</strong> via Razorpay.
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.74rem', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>UPI / QR</span>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.74rem', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>Credit & Debit Cards</span>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.74rem', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>NetBanking</span>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.74rem', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>Wallets</span>
                </div>
              </div>
            )}
            {selectedMethod === 'UPI' && (
              <div className="form-group">
                <label className="form-label">UPI ID</label>
                <input className="form-control" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" />
              </div>
            )}
            {selectedMethod === 'Google Pay' && (
              <div className="form-group">
                <label className="form-label">Google Pay linked mobile number</label>
                <input className="form-control" placeholder="10-digit number" maxLength={10} />
              </div>
            )}
            {selectedMethod === 'Card' && (
              <div className="form-group">
                <label className="form-label">Card number</label>
                <input className="form-control" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="1234 5678 9012 3456" maxLength={19} />
              </div>
            )}
            {selectedMethod === 'Cash on Pickup' && (
              <p style={{ fontSize: '0.85rem', color: 'var(--sage)', marginBottom: 14 }}>
                You'll pay ₹{request.totalAmount ?? request.amount ?? 0} in cash directly to {request.ownerName} at the pickup location.
              </p>
            )}

            {paymentError && <div className="form-error" style={{ marginBottom: 10 }}>{paymentError}</div>}
            <p style={{ fontSize: '0.72rem', color: 'var(--sage)', marginBottom: 12 }}>
              This is a frontend demo with simulated instant gateway verification. Card/UPI details are verified securely.
            </p>

            <button className="btn btn-primary btn-block" disabled={!selectedMethod || paying} onClick={handlePay}>
              {paying ? 'Processing payment...' : selectedMethod === 'Cash on Pickup' ? 'Confirm Cash on Pickup' : selectedMethod === 'Razorpay' ? `Pay ₹${request.totalAmount ?? request.amount ?? 0} with Razorpay` : `Pay ₹${request.totalAmount ?? request.amount ?? 0}`}
            </button>
          </div>
        </div>
      )}

      {/* Rental Extension Modal */}
      {showExtensionModal && (
        <div className="modal-overlay" onClick={() => !submittingExtension && setShowExtensionModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} color="var(--primary)" /> Request Rental Extension
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowExtensionModal(false)} disabled={submittingExtension}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--sage)', marginBottom: 14 }}>
              Extend your rental period for <strong>{request.resourceTitle}</strong>. As the active renter, your extension gets priority upon owner approval.
            </p>

            <div className="form-group">
              <label className="form-label">How many additional days?</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--primary)' }}
                />
                <span style={{ fontWeight: 700, fontSize: '1.1rem', minWidth: 60, textAlign: 'right' }}>
                  +{extensionDays} day{extensionDays > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="card" style={{ padding: 14, background: 'var(--paper)', marginBottom: 16 }}>
              <div className="calc-row"><span>Current end date</span><span>{baseEndDate}</span></div>
              <div className="calc-row"><span>New extended end date</span><span style={{ color: 'var(--primary)', fontWeight: 700 }}>{calculatedNewEndDate}</span></div>
              <div className="calc-row"><span>Daily rental rate</span><span>₹{dailyRate} / day</span></div>
              <div className="calc-row total"><span>Extension amount</span><span>₹{extensionAmount}</span></div>
            </div>

            <div className="form-group">
              <label className="form-label">Reason or note to owner (optional)</label>
              <textarea
                className="form-control"
                rows={2}
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="e.g. Need the camera for 2 extra days of shooting..."
              />
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <button
                type="button"
                className="btn btn-primary btn-block"
                style={{
                  background: '#25D366',
                  borderColor: '#25D366',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontWeight: 600,
                  fontSize: '0.94rem',
                }}
                disabled={submittingExtension}
                onClick={() => handleRequestExtension(true)}
              >
                <Send size={16} /> {submittingExtension ? 'Submitting request...' : `Request & Message on WhatsApp (+₹${extensionAmount})`}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-block btn-sm"
                disabled={submittingExtension}
                onClick={() => handleRequestExtension(false)}
              >
                Request on ShelfShare Only
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extension Fee Payment Modal */}
      {showExtensionPaymentModal && (
        <div className="modal-overlay" onClick={() => !extPaying && setShowExtensionPaymentModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CardIcon size={18} color="var(--primary)" /> Pay Extension Fee
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowExtensionPaymentModal(false)} disabled={extPaying}>
                <X size={16} />
              </button>
            </div>

            <div className="card" style={{ padding: 12, background: 'var(--paper)', marginBottom: 16 }}>
              <div className="calc-row"><span>Extended through</span><span>{request.endDate}</span></div>
              <div className="calc-row total"><span>Fee payable</span><span>₹{request.extensionAmount}</span></div>
            </div>

            <div className="payment-method-grid">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`payment-method-btn ${extPaymentMethod === m.id ? 'active' : ''}`}
                  onClick={() => { setExtPaymentMethod(m.id); setExtPaymentError('') }}
                >
                  <span className="ic"><m.icon size={18} /></span>{m.label}
                </button>
              ))}
            </div>

            {extPaymentMethod === 'Razorpay' && (
              <div style={{ background: '#f0f9ff', border: '1.5px solid #0284c7', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 800, color: '#0c4a6e', fontSize: '1.1rem', letterSpacing: '0.5px' }}>Razorpay</span>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>Trusted Gateway</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>🔒 256-bit Secure</span>
                </div>
                <p style={{ fontSize: '0.84rem', color: '#334155', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
                  Pay extension fee of ₹{request.extensionAmount} seamlessly using <strong>Instant UPI, Cards (Visa/Mastercard/RuPay), or NetBanking</strong> via Razorpay.
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.74rem', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>UPI / QR</span>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.74rem', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>Credit & Debit Cards</span>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.74rem', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>NetBanking</span>
                </div>
              </div>
            )}
            {extPaymentMethod === 'UPI' && (
              <div className="form-group">
                <label className="form-label">UPI ID</label>
                <input className="form-control" value={extUpiId} onChange={(e) => setExtUpiId(e.target.value)} placeholder="yourname@upi" />
              </div>
            )}
            {extPaymentMethod === 'Google Pay' && (
              <div className="form-group">
                <label className="form-label">Google Pay linked mobile number</label>
                <input className="form-control" placeholder="10-digit number" maxLength={10} />
              </div>
            )}
            {extPaymentMethod === 'Card' && (
              <div className="form-group">
                <label className="form-label">Card number</label>
                <input className="form-control" placeholder="1234 5678 9012 3456" maxLength={19} />
              </div>
            )}
            {extPaymentMethod === 'Cash on Pickup' && (
              <p style={{ fontSize: '0.85rem', color: 'var(--sage)', marginBottom: 14 }}>
                You will pay ₹{request.extensionAmount} in cash directly to {request.ownerName} upon return.
              </p>
            )}

            {extPaymentError && <div className="form-error" style={{ marginBottom: 10 }}>{extPaymentError}</div>}

            <button
              className="btn btn-primary btn-block"
              disabled={!extPaymentMethod || extPaying}
              onClick={handlePayExtension}
            >
              {extPaying ? 'Processing payment...' : extPaymentMethod === 'Cash on Pickup' ? 'Confirm Cash Payment' : extPaymentMethod === 'Razorpay' ? `Pay ₹${request.extensionAmount} with Razorpay` : `Pay ₹${request.extensionAmount}`}
            </button>
          </div>
        </div>
      )}

      {request && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          recipientName={isOwner ? request.requesterName : request.ownerName}
          recipientPhone={
            isOwner
              ? (request.requesterPhone || getUserContactInfo(request.requesterId, request.requesterName).phone)
              : (request.ownerPhone || getUserContactInfo(request.ownerId, request.ownerName).phone)
          }
          recipientEmail={
            isOwner
              ? (request.requesterEmail || getUserContactInfo(request.requesterId, request.requesterName).email)
              : (request.ownerEmail || getUserContactInfo(request.ownerId, request.ownerName).email)
          }
          resourceTitle={request.resourceTitle}
          onOpenInAppChat={() =>
            navigate(
              `/messages?resourceId=${request.resourceId}&withId=${isOwner ? request.requesterId : request.ownerId}&withName=${encodeURIComponent(isOwner ? request.requesterName : request.ownerName)}&resourceTitle=${encodeURIComponent(request.resourceTitle)}`
            )
          }
        />
      )}
    </Layout>
  )
}
