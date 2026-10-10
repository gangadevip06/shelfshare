// pages/MyReviews.jsx
// A consolidated view for an owner of every review left on their own
// resources — so reviews aren't just buried on each resource's public
// details page, the owner has one place to see everything said about
// their listings.
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import UserLayout from '../components/UserLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getResources } from '../services/api.js'

export default function MyReviews() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const all = await getResources()
        setResources(all.filter((r) => r.ownerId === user?.id))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  const reviewed = resources
    .map((r) => ({ resource: r, reviews: r.reviews || [] }))
    .filter((entry) => entry.reviews.length > 0)

  const allReviews = reviewed.flatMap((entry) => entry.reviews.map((rev) => ({ ...rev, resource: entry.resource })))
  const overallAverage = allReviews.length
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
    : null

  return (
    <UserLayout title="Reviews on My Resources" subtitle="See what other members are saying about the things you've shared.">
      {loading ? (
        <div className="loading-wrap"><span className="spinner" />Loading reviews...</div>
      ) : allReviews.length === 0 ? (
        <div className="empty-state">
          <div className="ic" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Star size={44} strokeWidth={1.5} color="var(--sage)" />
          </div>
          No reviews yet — once someone completes a rental or purchase from you, they can leave a review here.
        </div>
      ) : (
        <>
          <div className="rating-summary">
            <span className="big">{overallAverage}</span>
            <div>
              <div className="stars">{'★'.repeat(Math.round(overallAverage))}{'☆'.repeat(5 - Math.round(overallAverage))}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--sage)' }}>{allReviews.length} review{allReviews.length !== 1 ? 's' : ''} across {reviewed.length} resource{reviewed.length !== 1 ? 's' : ''}</div>
            </div>
          </div>

          <div className="card">
            {allReviews
              .slice()
              .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
              .map((rev) => (
                <div key={rev.id} className="notif-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/resources/${rev.resource.id}`)}>
                  <div className="avatar sm">{rev.user.charAt(0)}</div>
                  <div className="content">
                    <div className="title">{rev.user} <span className="stars">{'★'.repeat(rev.rating)}</span></div>
                    <div className="desc">"{rev.comment}"</div>
                    <div className="time">On {rev.resource.title} · {rev.date}</div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </UserLayout>
  )
}
