// pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react'
import { Users, Package, RefreshCw, CheckCircle2, Flag } from 'lucide-react'
import AdminLayout from '../components/AdminLayout.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import StatCard from '../components/StatCard.jsx'
import { getUsers, getResources, getRequests, getReports } from '../services/api.js'

export default function AdminDashboard() {
  const { t } = useLanguage()
  const [stats, setStats] = useState({ totalUsers: 0, totalResources: 0, activeRequests: 0, completedTransactions: 0, pendingReports: 0 })
  const [recent, setRecent] = useState({ users: [], resources: [], requests: [], reports: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [users, resources, requests, reports] = await Promise.all([
          getUsers(), getResources(), getRequests(), getReports(),
        ])
        setStats({
          totalUsers: users.length,
          totalResources: resources.length,
          activeRequests: requests.filter((r) => r.status === 'Pending').length,
          completedTransactions: requests.filter((r) => r.status === 'Completed').length,
          pendingReports: reports.filter((r) => r.status === 'Pending').length,
        })
        setRecent({
          users: users.slice(-5).reverse(),
          resources: resources.slice(0, 5),
          requests: requests.slice(0, 5),
          reports: reports.filter((r) => r.status === 'Pending').slice(0, 5),
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <AdminLayout title={t("admin_dashboardTitle")} subtitle="Platform-wide statistics and recent activity.">
      <div className="grid-4" style={{ marginBottom: 34 }}>
        <StatCard icon={<Users size={22} color="var(--primary)" />} label="Total Users" value={stats.totalUsers} />
        <StatCard icon={<Package size={22} color="var(--accent)" />} label="Total Resources" value={stats.totalResources} />
        <StatCard icon={<RefreshCw size={22} color="var(--primary)" />} label="Active Requests" value={stats.activeRequests} deltaDirection="down" />
        <StatCard icon={<CheckCircle2 size={22} color="#10b981" />} label="Completed Transactions" value={stats.completedTransactions} />
      </div>
      <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 34 }}>
        <StatCard icon={<Flag size={22} color="var(--danger)" />} label="Pending Reports" value={stats.pendingReports} deltaDirection={stats.pendingReports > 0 ? 'down' : 'up'} />
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="eyebrow">Platform health</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginTop: 6 }}>
            {stats.pendingReports > 3 ? 'Needs attention' : 'Stable'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--sage)', marginTop: 4 }}>
            {stats.pendingReports > 3 ? 'Several reports awaiting review.' : 'No critical issues detected.'}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-wrap"><span className="spinner" />Loading recent activity...</div>
      ) : (
        <div className="grid-2">
          <div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: 14 }}>New users</h3>
            <div className="card">
              {recent.users.map((u) => (
                <div key={u.id} className="notif-item">
                  <div className="avatar sm">{u.name.charAt(0)}</div>
                  <div className="content">
                    <div className="title">{u.name}</div>
                    <div className="desc">{u.email}</div>
                    <div className="time">Joined {u.joined}</div>
                  </div>
                </div>
              ))}
              {recent.users.length === 0 && <div className="empty-state">No registered users yet.</div>}
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: 14 }}>New resources</h3>
            <div className="card">
              {recent.resources.map((r) => (
                <div key={r.id} className="notif-item">
                  <div className="ic-badge" style={{ overflow: 'hidden', padding: 0 }}>
                    <img src={r.image} alt={r.title} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }} />
                  </div>
                  <div className="content">
                    <div className="title">{r.title}</div>
                    <div className="desc">by {r.ownerName} · {r.category}</div>
                    <div className="time">{r.createdAt}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: 14 }}>New requests</h3>
            <div className="card">
              {recent.requests.map((r) => (
                <div key={r.id} className="notif-item">
                  <div className="ic-badge">🔄</div>
                  <div className="content">
                    <div className="title">{r.resourceTitle}</div>
                    <div className="desc">{r.requesterName} → {r.ownerName}</div>
                    <div className="time">{r.requestedOn}</div>
                  </div>
                </div>
              ))}
              {recent.requests.length === 0 && <div className="empty-state">No requests yet.</div>}
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: 14 }}>Pending reports</h3>
            <div className="card">
              {recent.reports.length ? recent.reports.map((r) => (
                <div key={r.id} className="notif-item">
                  <div className="ic-badge">🚩</div>
                  <div className="content">
                    <div className="title">{r.resourceTitle}</div>
                    <div className="desc">{r.reason} — reported by {r.userName}</div>
                    <div className="time">{r.date}</div>
                  </div>
                </div>
              )) : <div className="empty-state">No pending reports.</div>}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
