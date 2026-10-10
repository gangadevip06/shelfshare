// pages/Leaderboard.jsx
// Ranks registered users by completed transactions (as owner) and average
// review rating — makes the community feel alive and reuses data already
// collected elsewhere (requests, reviews) rather than needing anything new.
import React, { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import UserLayout from '../components/UserLayout.jsx'
import TrustBadge from '../components/TrustBadge.jsx'
import { getUsers, getResources, getRequests } from '../services/api.js'
import { computeTrustScore } from '../utils/trustScore.js'

export default function Leaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [users, resources, requests] = await Promise.all([getUsers(), getResources(), getRequests()])
        const ranked = users
          .map((u) => {
            const myResources = resources.filter((r) => r.ownerId === u.id)
            const completedAsOwner = requests.filter((r) => r.ownerId === u.id && r.status === 'Completed').length
            const allReviews = myResources.flatMap((r) => r.reviews || [])
            const avgRating = allReviews.length ? allReviews.reduce((s, rv) => s + rv.rating, 0) / allReviews.length : 0
            const trustScore = computeTrustScore({ completedCount: completedAsOwner, avgRating, joinedDate: u.joined })
            return { ...u, resourcesShared: myResources.length, completedAsOwner, avgRating, trustScore }
          })
          .filter((u) => u.resourcesShared > 0 || u.completedAsOwner > 0)
          .sort((a, b) => (b.completedAsOwner - a.completedAsOwner) || (b.avgRating - a.avgRating))
          .slice(0, 20)
        setRows(ranked)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const medalBadges = ['🥇 Gold', '🥈 Silver', '🥉 Bronze']

  return (
    <UserLayout title="Community Leaderboard" subtitle="Top sharers, ranked by completed transactions and community rating.">
      {loading ? (
        <div className="loading-wrap"><span className="spinner" />Loading leaderboard...</div>
      ) : rows.length === 0 ? (
        <div className="empty-state">
          <div className="ic" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Trophy size={44} strokeWidth={1.5} color="var(--sage)" />
          </div>
          No ranked members yet — complete a transaction to appear here.
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Rank</th><th>Member</th><th>Resources Shared</th><th>Completed</th><th>Rating</th><th>Trust</th></tr>
            </thead>
            <tbody>
              {rows.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700 }}>
                    {i < 3 ? (
                      <span className={`badge ${i === 0 ? 'badge-amber' : i === 1 ? 'badge-gray' : 'badge-amber'}`}>
                        {medalBadges[i]}
                      </span>
                    ) : (
                      `#${i + 1}`
                    )}
                  </td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar sm">{u.name.charAt(0)}</div>
                    {u.name}
                  </td>
                  <td>{u.resourcesShared}</td>
                  <td>{u.completedAsOwner}</td>
                  <td>{u.avgRating ? `★ ${u.avgRating.toFixed(1)}` : '—'}</td>
                  <td><TrustBadge score={u.trustScore} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </UserLayout>
  )
}
