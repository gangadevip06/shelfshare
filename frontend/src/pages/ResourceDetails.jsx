// pages/ResourceDetails.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import UserLayout from '../components/UserLayout.jsx'
import AdminLayout from '../components/AdminLayout.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { getResourceById, addRequest, addReport, updateResource, deleteResource, addNotification, addReview, getRequests, getUserContactInfo } from '../services/api.js'
import { toggleWishlist } from '../store/resourceSlice.js'
import { RENTAL_DURATIONS, LOCATION_COORDS } from '../data/mockData.js'
import { addDays, findOverlap, formatDateRange } from '../utils/dateRange.js'
import { useSearchLocation } from '../context/LocationContext.jsx'
import { distanceKm, formatDistance, estimateDeliveryTime } from '../utils/geo.js'
import { 
  CheckCircle2, 
  AlertTriangle, 
  Folder, 
  MapPin, 
  Repeat, 
  Star, 
  Bike, 
  Calendar, 
  Heart, 
  MessageSquare, 
  Flag, 
  Edit3, 
  X,
  Phone
} from 'lucide-react'
import { addRecentlyViewed } from '../utils/storage.js'
import ContactModal from '../components/ContactModal.jsx'

const FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#eee7d8"/><text x="400" y="320" font-size="90" text-anchor="middle">📦</text></svg>'
)}`

function DetailsBody({ isAdmin }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { t } = useLanguage()
  const { center } = useSearchLocation()
  const dispatch = useDispatch()
  const wishlist = useSelector((state) => state.resources.wishlist)

  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('Misleading description')
  const [reportDetails, setReportDetails] = useState('')
  const [feedback, setFeedback] = useState('')
  const [confirmedOrder, setConfirmedOrder] = useState(null)

  // Reviews — gated to users with a completed request for this resource
  const [canReview, setCanReview] = useState(false)
  const [hasCompletedTransaction, setHasCompletedTransaction] = useState(false)
  const [alreadyReviewedByMe, setAlreadyReviewedByMe] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  // Rent/Buy calculator state
  const [option, setOption] = useState('Rent')
  const [days, setDays] = useState(RENTAL_DURATIONS[0])
  const [quantity, setQuantity] = useState(1)
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getResourceById(id)
      setResource(data)
      setOption(data.sharingType === 'Buy Only' ? 'Buy' : 'Rent')
    } catch (err) {
      setError('This resource could not be found.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  // Track this view for the "Recently Viewed" section on Dashboard.
  useEffect(() => {
    if (user?.id && resource?.id) addRecentlyViewed(user.id, resource.id)
  }, [user?.id, resource?.id])

  // A user can write a review once they have a Completed request for this
  // resource, and only once (checked against reviews already on it).
  useEffect(() => {
    async function checkReviewEligibility() {
      if (!user?.id || !resource) { setCanReview(false); setHasCompletedTransaction(false); setAlreadyReviewedByMe(false); return }
      try {
        const allRequests = await getRequests()
        const hasCompleted = allRequests.some((r) => r.resourceId === resource.id && r.requesterId === user.id && r.status === 'Completed')
        const alreadyReviewed = (resource.reviews || []).some((rv) => rv.userId === user.id)
        setHasCompletedTransaction(hasCompleted)
        setAlreadyReviewedByMe(alreadyReviewed)
        setCanReview(hasCompleted && !alreadyReviewed)
      } catch {
        setCanReview(false)
      }
    }
    checkReviewEligibility()
  }, [user?.id, resource?.id, resource?.reviews])

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) return
    setSubmittingReview(true)
    try {
      await addReview(resource.id, { userId: user.id, userName: user.name, rating: reviewRating, comment: reviewComment.trim() })
      await addNotification({
        userId: resource.ownerId, type: 'update', title: 'New review',
        desc: `${user.name} left a ${reviewRating}★ review on "${resource.title}".`,
      })
      setShowReviewModal(false)
      setReviewComment('')
      setReviewRating(5)
      setFeedback('Thanks for your review!')
      load()
    } finally {
      setSubmittingReview(false)
    }
  }

  const resourceDistance = center && resource && LOCATION_COORDS[resource.location]
    ? distanceKm(center.lat, center.lng, LOCATION_COORDS[resource.location].lat, LOCATION_COORDS[resource.location].lng)
    : null

  const rentalAmount = resource ? resource.rentalPrice * days : 0
  const rentTotal = rentalAmount + (resource?.deposit || 0)
  const buyTotal = resource ? resource.salePrice * quantity : 0
  const endDate = addDays(startDate, days)
  const conflictingBooking = resource ? findOverlap(startDate, endDate, resource.bookedRanges) : null

  const isOwner = resource && user && resource.ownerId === user.id

  const handleRequest = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (option === 'Rent' && conflictingBooking) return
    try {
      const contactInfo = getUserContactInfo(resource.ownerId, resource.ownerName, resource)
      const payload = {
        resourceId: resource.id,
        resourceTitle: resource.title,
        requesterId: user.id,
        requesterName: user.name,
        requesterPhone: user.phone || '',
        requesterEmail: user.email || '',
        ownerId: resource.ownerId,
        ownerName: resource.ownerName,
        ownerPhone: resource.ownerPhone || contactInfo.phone || '',
        ownerEmail: resource.ownerEmail || contactInfo.email || '',
        requestType: option,
        rentalDuration: option === 'Rent' ? days : null,
        startDate: option === 'Rent' ? startDate : null,
        endDate: option === 'Rent' ? endDate : null,
        quantity: option === 'Buy' ? quantity : null,
        amount: option === 'Rent' ? rentalAmount : buyTotal,
        deposit: option === 'Rent' ? (resource.deposit || 0) : 0,
        totalAmount: option === 'Rent' ? rentTotal : buyTotal,
        message: option === 'Rent'
          ? `Requesting to rent "${resource.title}" from ${startDate} to ${endDate} (${days} day${days > 1 ? 's' : ''}).`
          : `Requesting to buy "${resource.title}" (qty ${quantity}).`,
      }
      const created = await addRequest(payload)
      await addNotification({
        userId: user.id, type: 'update', title: 'Request submitted',
        desc: `Your ${option.toLowerCase()} request for "${resource.title}" has been sent to ${resource.ownerName}.`,
      })
      await addNotification({
        userId: resource.ownerId, type: 'message', title: 'New resource request',
        desc: `${user.name} sent a ${option.toLowerCase()} request for "${resource.title}".`,
      })
      setShowRequestModal(false)
      setConfirmedOrder(created)
    } catch (err) {
      setFeedback('Could not send the request. Please try again.')
    }
  }

  const handleReport = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    try {
      await addReport({
        resourceId: resource.id,
        resourceTitle: resource.title,
        userId: user.id,
        userName: user.name,
        reason: reportReason,
        description: reportDetails,
      })
      setFeedback('Thanks — your report was submitted to the ShelfShare team.')
      setShowReportModal(false)
      setReportDetails('')
    } catch (err) {
      setFeedback('Could not submit report. Please try again.')
    }
  }

  const handleChat = () => {
    navigate(`/messages?resourceId=${resource.id}&withId=${resource.ownerId}&withName=${encodeURIComponent(resource.ownerName)}&resourceTitle=${encodeURIComponent(resource.title)}`)
  }

  const handleAdminStatus = async (status) => {
    await updateResource(resource.id, { status })
    setFeedback(`Resource marked as ${status}.`)
    load()
  }

  const handleAdminDelete = async () => {
    await deleteResource(resource.id)
    navigate('/admin/resources')
  }

  if (loading) return <div className="loading-wrap"><span className="spinner" />Loading resource...</div>
  if (error) return <div className="empty-state"><AlertTriangle size={36} color="var(--amber)" style={{ marginBottom: 8 }} /><div>{error}</div></div>
  if (!resource) return null

  const isWished = wishlist.includes(resource.id)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {feedback && <div className="alert alert-success">{feedback}</div>}
      <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.2fr', alignItems: 'flex-start' }}>
        <div className="card" style={{ height: 320, overflow: 'hidden' }}>
          <img
            src={resource.image || FALLBACK_IMAGE}
            alt={resource.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE }}
          />
        </div>
        <div>
          <span className={`badge ${resource.availability === 'Available' ? 'badge-green' : 'badge-amber'}`}>{resource.availability}</span>
          <h1 style={{ marginTop: 12, fontSize: '1.7rem' }}>{resource.title}</h1>
          <div style={{ display: 'flex', gap: 14, marginTop: 10, color: 'var(--sage)', fontSize: '0.9rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Folder size={15} /> {resource.category}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><MapPin size={15} /> {resource.location}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Repeat size={15} /> {resource.sharingType}</span>
            <span className="stars" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Star size={15} fill="currentColor" /> {resource.rating}</span>
          </div>
          {resourceDistance !== null && (
            <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="delivery-chip"><MapPin size={13} style={{ marginRight: 4, display: 'inline-block', verticalAlign: '-1px' }} />{formatDistance(resourceDistance)} away</span>
              <span className="delivery-chip"><Bike size={13} style={{ marginRight: 4, display: 'inline-block', verticalAlign: '-1px' }} />Est. delivery: {estimateDeliveryTime(resourceDistance)}</span>
            </div>
          )}
          <p style={{ marginTop: 18, lineHeight: 1.7, color: 'var(--ink)' }}>{resource.description}</p>

          <div className="grid-3" style={{ marginTop: 20 }}>
            <div className="card" style={{ padding: 14 }}>
              <div className="eyebrow">Condition</div>
              <div style={{ fontWeight: 600, marginTop: 4 }}>{resource.condition}</div>
            </div>
            {resource.sharingType !== 'Buy Only' && (
              <div className="card" style={{ padding: 14 }}>
                <div className="eyebrow">Rental Price</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>₹{resource.rentalPrice}/day</div>
              </div>
            )}
            {resource.sharingType !== 'Rent Only' && (
              <div className="card" style={{ padding: 14 }}>
                <div className="eyebrow">Sale Price</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>₹{resource.salePrice}</div>
              </div>
            )}
            {resource.sharingType !== 'Buy Only' && (
              <div className="card" style={{ padding: 14 }}>
                <div className="eyebrow">Deposit</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{resource.deposit ? `₹${resource.deposit}` : 'No deposit'}</div>
              </div>
            )}
          </div>

          {resource.sharingType !== 'Buy Only' && resource.bookedRanges?.length > 0 && (
            <div className="card" style={{ padding: 14, marginTop: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Calendar size={13} /> Already Booked</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {resource.bookedRanges.map((r, i) => (
                  <span key={i} className="badge badge-gray">{formatDateRange(r.start, r.end)}</span>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 14, marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar sm">{resource.ownerName?.charAt(0)}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{resource.ownerName}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--sage)' }}>Resource owner</div>
            </div>
          </div>

          {isAdmin ? (
            <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
              {resource.status !== 'Active' && <button className="btn btn-primary" onClick={() => handleAdminStatus('Active')}>Approve</button>}
              {resource.status !== 'Rejected' && <button className="btn btn-outline" onClick={() => handleAdminStatus('Rejected')}>Reject</button>}
              <button className="btn btn-danger" onClick={handleAdminDelete}>Delete Resource</button>
            </div>
          ) : isOwner ? (
            <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
              <div className="alert" style={{ background: 'var(--paper)', border: '1px solid var(--border)' }}>This is your own listing.</div>
              <button className="btn btn-outline" onClick={() => navigate('/my-resources')}>Manage in My Resources</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                disabled={resource.availability !== 'Available'}
                onClick={() => (isAuthenticated ? setShowRequestModal(true) : navigate('/login'))}
              >
                {resource.sharingType === 'Rent Only' ? t('action_rentThis') : resource.sharingType === 'Buy Only' ? t('action_buyThis') : t('action_rentOrBuy')}
              </button>
              <button className="btn btn-outline" onClick={() => (isAuthenticated ? dispatch(toggleWishlist({ id: resource.id, userId: user.id })) : navigate('/login'))} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <Heart size={16} fill={isWished ? 'var(--red)' : 'none'} color={isWished ? 'var(--red)' : 'currentColor'} style={{ marginRight: 6 }} />
                {isWished ? t('action_inWishlist') : t('action_addToWishlist')}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => (isAuthenticated ? setShowContactModal(true) : navigate('/login'))}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                title="Contact via WhatsApp, Phone Call, or Email"
              >
                <Phone size={15} /> Contact Owner
              </button>
              <button className="btn btn-ghost" onClick={() => (isAuthenticated ? handleChat() : navigate('/login'))} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <MessageSquare size={16} style={{ marginRight: 6 }} />{t('action_chat')}
              </button>
              <button className="btn btn-ghost" onClick={() => (isAuthenticated ? setShowReportModal(true) : navigate('/login'))} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <Flag size={16} style={{ marginRight: 6 }} />{t('action_report')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: '1.2rem' }}>Reviews</h3>
          {canReview && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowReviewModal(true)} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Edit3 size={14} style={{ marginRight: 5 }} />Write a Review
            </button>
          )}
        </div>

        {isAuthenticated && !isOwner && !isAdmin && (
          <>
            {alreadyReviewedByMe && (
              <div className="alert" style={{ background: 'var(--paper)', border: '1px solid var(--border)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="var(--primary)" style={{ flexShrink: 0 }} /> You've already reviewed this resource. Thanks for your feedback!
              </div>
            )}
            {!hasCompletedTransaction && !alreadyReviewedByMe && (
              <div className="alert" style={{ background: 'var(--paper)', border: '1px solid var(--border)', marginBottom: 16 }}>
                💡 You can write a review once you've completed a rental or purchase of this resource
                (owner marks it completed after handover/return, or after a purchase). Reviews aren't
                open to everyone — only people who've actually used the item.
              </div>
            )}
          </>
        )}
        {!isAuthenticated && (
          <div className="alert" style={{ background: 'var(--paper)', border: '1px solid var(--border)', marginBottom: 16 }}>
            💡 <button className="link-btn" onClick={() => navigate('/login')}>Log in</button> and complete a rental or purchase of this item to leave a review.
          </div>
        )}

        {resource.reviews?.length > 0 && (
          <div className="rating-summary">
            <span className="big">{resource.rating?.toFixed?.(1) ?? resource.rating}</span>
            <div>
              <div className="stars">{'★'.repeat(Math.round(resource.rating))}{'☆'.repeat(5 - Math.round(resource.rating))}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--sage)' }}>{resource.reviews.length} review{resource.reviews.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
        )}

        {resource.reviews?.length ? (
          <div className="card">
            {resource.reviews.map((rev) => (
              <div key={rev.id} className="notif-item">
                <div className="avatar sm">{rev.user.charAt(0)}</div>
                <div className="content">
                  <div className="title">{rev.user} <span className="stars">{'★'.repeat(rev.rating)}</span></div>
                  <div className="desc">{rev.comment}</div>
                  <div className="time">{rev.date}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No reviews yet for this resource.</div>
        )}
      </div>

      {showReviewModal && (
        <div className="modal-overlay" onClick={() => !submittingReview && setShowReviewModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.05rem' }}>Write a review</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowReviewModal(false)} disabled={submittingReview}><X size={16} /></button>
            </div>
            <div className="star-picker">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={n <= reviewRating ? 'filled' : ''} onClick={() => setReviewRating(n)}>★</span>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Your review</label>
              <textarea className="form-control" rows={4} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="How was your experience with this resource?" />
            </div>
            <button className="btn btn-primary btn-block" disabled={!reviewComment.trim() || submittingReview} onClick={handleSubmitReview}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.1rem' }}>Request this resource</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowRequestModal(false)}><X size={16} /></button>
            </div>

            {resource.sharingType === 'Rent or Buy' && (
              <div className="rentbuy-tabs">
                <button type="button" className={`rentbuy-tab ${option === 'Rent' ? 'active' : ''}`} onClick={() => setOption('Rent')}>Rent</button>
                <button type="button" className={`rentbuy-tab ${option === 'Buy' ? 'active' : ''}`} onClick={() => setOption('Buy')}>Buy</button>
              </div>
            )}

            {option === 'Rent' ? (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={startDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rental Duration</label>
                    <select className="form-control" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                      {RENTAL_DURATIONS.map((d) => <option key={d} value={d}>{d} Day{d > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                </div>

                {startDate > new Date().toISOString().slice(0, 10) && (
                  <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.25)', marginBottom: 12, fontSize: '0.82rem', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>✨</span>
                    <span><strong>Advance Pre-Booking:</strong> You are booking in advance. This date interval will be reserved exclusively for you once confirmed.</span>
                  </div>
                )}

                <div style={{ fontSize: '0.8rem', color: 'var(--sage)', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} /> Selected Period: <strong>{formatDateRange(startDate, endDate)}</strong>
                </div>

                {/* Unavailable Booked Slots List */}
                {resource.bookedRanges && resource.bookedRanges.length > 0 && (
                  <div style={{ marginBottom: 12, padding: 10, background: 'var(--paper)', borderRadius: 8, fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>🔒 Currently Booked / Unavailable:</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                      {resource.bookedRanges.map((b, i) => (
                        <span key={i} className="badge badge-red" style={{ fontSize: '0.72rem' }}>
                          {formatDateRange(b.start, b.end)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {conflictingBooking && (
                  <div className="alert alert-error" style={{ marginBottom: 12 }}>
                    Not available for these dates — overlaps with an active booking ({formatDateRange(conflictingBooking.start, conflictingBooking.end)}). Please pick different dates.
                  </div>
                )}
                <div className="card" style={{ padding: 14, background: 'var(--paper)' }}>
                  <div className="calc-row"><span>Rental amount</span><span>₹{resource.rentalPrice}/day × {days} = ₹{rentalAmount}</span></div>
                  {resource.deposit > 0 && <div className="calc-row"><span>Security deposit</span><span>₹{resource.deposit}</span></div>}
                  <div className="calc-row total"><span>Total amount</span><span>₹{rentTotal}</span></div>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input type="number" min="1" className="form-control" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
                </div>
                <div className="card" style={{ padding: 14, background: 'var(--paper)' }}>
                  <div className="calc-row"><span>Product price</span><span>₹{resource.salePrice} × {quantity}</span></div>
                  <div className="calc-row total"><span>Total amount</span><span>₹{buyTotal}</span></div>
                </div>
              </>
            )}

            <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={option === 'Rent' && !!conflictingBooking} onClick={handleRequest}>
              Send {option === 'Rent' ? 'Rental' : 'Purchase'} Request
            </button>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.1rem' }}>Report this resource</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowReportModal(false)}><X size={16} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <select className="form-control" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                <option>Misleading description</option>
                <option>Inappropriate content</option>
                <option>Spam listing</option>
                <option>Prohibited item</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Details</label>
              <textarea className="form-control" rows={4} value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Describe the issue..." />
            </div>
            <button className="btn btn-danger btn-block" onClick={handleReport}>Submit Report</button>
          </div>
        </div>
      )}

      {confirmedOrder && (
        <div className="confirm-tick-overlay" onClick={() => setConfirmedOrder(null)}>
          <div className="confirm-tick-card" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-tick-circle"><CheckCircle2 size={38} /></div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 6 }}>Order Confirmed!</h3>
            <p style={{ color: 'var(--sage)', fontSize: '0.9rem', marginBottom: 22, maxWidth: 280 }}>
              Your {confirmedOrder.requestType?.toLowerCase()} request for "{confirmedOrder.resourceTitle}" has been sent to {confirmedOrder.ownerName}.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => navigate(`/requests/${confirmedOrder.id}`)}>Track Order</button>
              <button className="btn btn-ghost" onClick={() => setConfirmedOrder(null)}>Keep Browsing</button>
            </div>
          </div>
        </div>
      )}

      {resource && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          recipientName={resource.ownerName}
          recipientPhone={resource.ownerPhone || getUserContactInfo(resource.ownerId, resource.ownerName, resource).phone}
          recipientEmail={resource.ownerEmail || getUserContactInfo(resource.ownerId, resource.ownerName, resource).email}
          resourceTitle={resource.title}
          onOpenInAppChat={handleChat}
        />
      )}
    </div>
  )
}

export default function ResourceDetails() {
  const { isAuthenticated, isAdmin } = useAuth()

  if (isAuthenticated && isAdmin) {
    return (
      <AdminLayout title="Resource Details" subtitle="Review this listing and take moderation action.">
        <DetailsBody isAdmin />
      </AdminLayout>
    )
  }

  if (isAuthenticated) {
    return (
      <UserLayout>
        <DetailsBody isAdmin={false} />
      </UserLayout>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="page-content"><DetailsBody isAdmin={false} /></div>
      <Footer />
    </div>
  )
}
