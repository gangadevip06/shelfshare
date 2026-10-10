// pages/Analytics.jsx
// Owner-facing analytics: earnings over time, most-requested items, and
// request status breakdown — computed entirely from existing resources
// and requests data (no new backend needed).
import React, { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Banknote, Package, RefreshCw, Star, BarChart3 } from 'lucide-react'
import UserLayout from '../components/UserLayout.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getResources, getRequests } from '../services/api.js'

const STATUS_COLORS = { Pending: '#f59e0b', Approved: '#10b981', Rejected: '#ef4444', Completed: '#059669', Cancelled: '#64748b' }

export default function Analytics() {
  const { user } = useAuth()
  const [resources, setResources] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [allResources, allRequests] = await Promise.all([getResources(), getRequests()])
        setResources(allResources.filter((r) => r.ownerId === user?.id))
        setRequests(allRequests.filter((r) => r.ownerId === user?.id))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  const completedRequests = requests.filter((r) => r.status === 'Completed')
  const totalEarnings = completedRequests.reduce((sum, r) => sum + (r.totalAmount || r.amount || 0), 0)

  // Earnings grouped by month (from completed requests' payment date).
  const earningsByMonth = useMemo(() => {
    const map = {}
    completedRequests.forEach((r) => {
      const dateStr = r.paymentDate || r.requestedOn
      if (!dateStr) return
      const key = new Date(dateStr).toLocaleString(undefined, { month: 'short', year: '2-digit' })
      map[key] = (map[key] || 0) + (r.totalAmount || r.amount || 0)
    })
    return Object.entries(map).map(([month, total]) => ({ month, total }))
  }, [completedRequests])

  // Most-requested resources (by number of requests received, any status).
  const mostRequested = useMemo(() => {
    const counts = {}
    requests.forEach((r) => { counts[r.resourceTitle] = (counts[r.resourceTitle] || 0) + 1 })
    return Object.entries(counts)
      .map(([title, count]) => ({ title: title.length > 18 ? `${title.slice(0, 18)}...` : title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [requests])

  // Request status breakdown.
  const statusBreakdown = useMemo(() => {
    const counts = {}
    requests.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1 })
    return Object.entries(counts).map(([status, value]) => ({ name: status, value }))
  }, [requests])

  const avgRating = useMemo(() => {
    const allReviews = resources.flatMap((r) => r.reviews || [])
    return allReviews.length ? (allReviews.reduce((s, rv) => s + rv.rating, 0) / allReviews.length).toFixed(1) : '—'
  }, [resources])

  return (
    <UserLayout title="Analytics" subtitle="How your listings are performing.">
      {loading ? (
        <div className="loading-wrap"><span className="spinner" />Loading analytics...</div>
      ) : resources.length === 0 ? (
        <div className="empty-state">
          <div className="ic" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <BarChart3 size={44} strokeWidth={1.5} color="var(--sage)" />
          </div>
          List a resource to start seeing analytics here.
        </div>
      ) : (
        <>
          <div className="grid-4" style={{ marginBottom: 30 }}>
            <StatCard icon={<Banknote size={22} color="var(--primary)" />} label="Total Earnings" value={`₹${totalEarnings}`} />
            <StatCard icon={<Package size={22} color="var(--accent)" />} label="Resources Listed" value={resources.length} />
            <StatCard icon={<RefreshCw size={22} color="var(--primary)" />} label="Total Requests" value={requests.length} />
            <StatCard icon={<Star size={22} fill="#f59e0b" color="#f59e0b" />} label="Average Rating" value={avgRating} />
          </div>

          <div className="grid-2" style={{ gridTemplateColumns: '1.3fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ marginBottom: 16 }}>Earnings Over Time</h4>
              {earningsByMonth.length === 0 ? (
                <div className="empty-state" style={{ padding: 20 }}>No completed transactions yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={earningsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`₹${v}`, 'Earnings']} />
                    <Line type="monotone" dataKey="total" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ marginBottom: 16 }}>Requests by Status</h4>
              {statusBreakdown.length === 0 ? (
                <div className="empty-state" style={{ padding: 20 }}>No requests yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={(d) => d.name}>
                      {statusBreakdown.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#9aab9f'} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ marginBottom: 16 }}>Most Requested Resources</h4>
            {mostRequested.length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}>No requests yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={mostRequested} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="title" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2f6b4f" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </UserLayout>
  )
}
