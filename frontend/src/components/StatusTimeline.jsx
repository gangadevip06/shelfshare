// components/StatusTimeline.jsx
// Visual progress strip for a request. Buy requests: Requested -> Approved
// -> Paid -> Completed. Rent requests add a full handover/return cycle
// with an explicit action for BOTH sides — the owner marks it handed
// over, then the requester confirms they actually received it (so it's
// never ambiguous what the requester is supposed to do), then later
// marks it returned, and the owner confirms to close it out:
// Requested -> Approved -> Paid -> Handed Over -> Received -> Returned -> Completed.
// Rejected/Cancelled render as a distinct red terminal state.
import React from 'react'

const BUY_STEPS = ['Requested', 'Approved', 'Paid', 'Completed']
const RENT_STEPS = ['Requested', 'Approved', 'Paid', 'Handed Over', 'Received', 'Returned', 'Completed']

export default function StatusTimeline({ status, paymentStatus, requestType, handoverStatus }) {
  if (status === 'Rejected' || status === 'Cancelled') {
    return (
      <div className="status-timeline terminal">
        <div className="step done">
          <div className="dot" /><span>Requested</span>
        </div>
        <div className="connector done danger" />
        <div className="step danger current">
          <div className="dot" /><span>{status}</span>
        </div>
      </div>
    )
  }

  const isRent = requestType === 'Rent'
  const STEPS = isRent ? RENT_STEPS : BUY_STEPS

  let activeIndex = 0
  if (status === 'Approved' || status === 'Completed') activeIndex = 1
  if (paymentStatus === 'Paid' || paymentStatus === 'Cash on Pickup') activeIndex = Math.max(activeIndex, 2)
  if (isRent) {
    if (handoverStatus === 'Handed Over') activeIndex = Math.max(activeIndex, 3)
    if (handoverStatus === 'Received') activeIndex = Math.max(activeIndex, 4)
    if (handoverStatus === 'Returned') activeIndex = Math.max(activeIndex, 5)
    if (status === 'Completed') activeIndex = 6
  } else if (status === 'Completed') {
    activeIndex = 3
  }

  return (
    <div className="status-timeline">
      {STEPS.map((step, i) => (
        <React.Fragment key={step}>
          {i > 0 && <div className={`connector ${i <= activeIndex ? 'done' : ''}`} />}
          <div className={`step ${i <= activeIndex ? 'done' : ''} ${i === activeIndex ? 'current' : ''}`}>
            <div className="dot" />
            <span>{step === 'Paid' && paymentStatus === 'Cash on Pickup' && i <= activeIndex ? 'Cash on Pickup' : step}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}
