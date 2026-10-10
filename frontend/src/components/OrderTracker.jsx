// components/OrderTracker.jsx
// A live-feeling, vertical order-tracking timeline (like Meesho/Flipkart's
// "Track Order" screen) — icons, real timestamps per stage from
// request.statusHistory, and a pulsing indicator on whichever stage is
// currently active so the page feels like it's watching something live
// rather than showing a static label.
import React, { useEffect, useState } from 'react'
import { PackageCheck, ClipboardCheck, CreditCard, Truck, Home, RotateCcw, CheckCircle2, XCircle, Wallet } from 'lucide-react'

const BUY_STEPS = [
  { key: 'Requested', label: 'Order Confirmed', icon: PackageCheck },
  { key: 'Approved', label: 'Approved by Owner', icon: ClipboardCheck },
  { key: 'Paid', label: 'Payment Confirmed', icon: CreditCard, altKeys: ['Cash on Pickup'] },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'Delivered', label: 'Delivered', icon: Home },
  { key: 'Completed', label: 'Order Completed', icon: CheckCircle2 },
]

const RENT_STEPS = [
  { key: 'Requested', label: 'Order Confirmed', icon: PackageCheck },
  { key: 'Approved', label: 'Approved by Owner', icon: ClipboardCheck },
  { key: 'Paid', label: 'Payment Confirmed', icon: CreditCard, altKeys: ['Cash on Pickup'] },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'Delivered', label: 'Received by You', icon: Home },
  { key: 'Returned', label: 'Returned to Owner', icon: RotateCcw },
  { key: 'Completed', label: 'Rental Completed', icon: CheckCircle2 },
]

function formatWhen(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  return date.toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function timeAgo(iso) {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.floor(hrs / 24)} day(s) ago`
}

export default function OrderTracker({ request }) {
  const [, forceTick] = useState(0)

  // Re-render every 30s purely so "X min ago" stays live-feeling without a refresh.
  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  if (request.status === 'Rejected' || request.status === 'Cancelled') {
    const terminalEntry = (request.statusHistory || []).find((h) => h.key === request.status)
    return (
      <div className="order-tracker">
        <div className="tracker-step done">
          <div className="tracker-icon done"><PackageCheck size={16} /></div>
          <div className="tracker-body">
            <div className="tracker-label">Order Confirmed</div>
            <div className="tracker-time">{formatWhen(request.statusHistory?.[0]?.at)}</div>
          </div>
        </div>
        <div className="tracker-line done danger" />
        <div className="tracker-step current danger">
          <div className="tracker-icon danger"><XCircle size={16} /></div>
          <div className="tracker-body">
            <div className="tracker-label">{request.status}</div>
            <div className="tracker-time">{formatWhen(terminalEntry?.at)}</div>
          </div>
        </div>
      </div>
    )
  }

  const STEPS = request.requestType === 'Rent' ? RENT_STEPS : BUY_STEPS
  const history = request.statusHistory || []

  const findEntry = (step) => {
    if (step.key === 'Paid' && (request.paymentStatus === 'Paid' || request.paymentStatus === 'Cash on Pickup')) {
      const hMatch = history.find((h) => h.key === 'Paid' || h.key === 'Cash on Pickup' || h.key === 'Payment Completed')
      return hMatch || { key: request.paymentStatus, at: request.paymentDate || request.updatedAt }
    }
    if (step.key === 'Approved') {
      const isApprovedOrPast =
        request.status === 'Approved' ||
        request.status === 'Completed' ||
        request.paymentStatus === 'Paid' ||
        request.paymentStatus === 'Cash on Pickup' ||
        request.handoverStatus === 'Handed Over' ||
        request.handoverStatus === 'Received' ||
        request.handoverStatus === 'Returned'
      if (isApprovedOrPast) {
        const hMatch = history.find((h) => h.key === 'Approved')
        return hMatch || { key: 'Approved', at: request.updatedAt || request.paymentDate || request.createdAt }
      }
    }
    if (step.key === 'Out for Delivery' && (request.handoverStatus === 'Handed Over' || request.handoverStatus === 'Received' || request.handoverStatus === 'Returned')) {
      const hMatch = history.find((h) => h.key === 'Out for Delivery' || h.key === 'Handed Over')
      return hMatch || { key: 'Out for Delivery', at: request.updatedAt }
    }
    if (step.key === 'Delivered' && (request.handoverStatus === 'Received' || request.handoverStatus === 'Returned')) {
      const hMatch = history.find((h) => h.key === 'Delivered' || h.key === 'Received')
      return hMatch || { key: 'Delivered', at: request.updatedAt }
    }
    if (step.key === 'Returned' && (request.handoverStatus === 'Returned' || request.status === 'Completed')) {
      const hMatch = history.find((h) => h.key === 'Returned')
      return hMatch || { key: 'Returned', at: request.updatedAt }
    }
    if (step.key === 'Completed' && request.status === 'Completed') {
      const hMatch = history.find((h) => h.key === 'Completed')
      return hMatch || { key: 'Completed', at: request.updatedAt }
    }
    return history.find((h) => h.key === step.key || step.altKeys?.includes(h.key))
  }

  // Find the next step awaiting action
  const nextPendingIdx = STEPS.findIndex((step) => !findEntry(step))
  const isFullyDone = nextPendingIdx === -1
  const currentIndex = isFullyDone ? STEPS.length - 1 : nextPendingIdx
  const latestEntry = history[history.length - 1]

  return (
    <div>
      {!isFullyDone && (
        <div className="tracker-live-badge">
          <span className="live-dot" /> Live tracking · updated {timeAgo(latestEntry?.at)}
        </div>
      )}
      <div className="order-tracker">
        {STEPS.map((step, i) => {
          const entry = findEntry(step)
          const done = Boolean(entry)
          const isCurrent = i === currentIndex && !isFullyDone
          const Icon = step.icon
          return (
            <React.Fragment key={step.key}>
              {i > 0 && <div className={`tracker-line ${done ? 'done' : ''}`} />}
              <div className={`tracker-step ${done ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                <div className={`tracker-icon ${done ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                  {isCurrent && <span className="pulse-ring" />}
                  <Icon size={16} />
                </div>
                <div className="tracker-body">
                  <div className="tracker-label">
                    {step.key === 'Paid' && entry?.key === 'Cash on Pickup' ? 'Cash on Pickup Selected' : step.label}
                  </div>
                  {entry ? (
                    <div className="tracker-time">{formatWhen(entry.at)}</div>
                  ) : isCurrent ? (
                    <div className="tracker-time current-text">In progress...</div>
                  ) : (
                    <div className="tracker-time pending-text">Pending</div>
                  )}
                </div>
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
