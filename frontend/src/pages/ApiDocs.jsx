// pages/ApiDocs.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Key, Play, CheckCircle2, AlertCircle, Copy, Check, Terminal, ExternalLink, Code2 } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  getResources,
  getResourceById,
  getRequests,
  getNotifications,
  requestRentalExtension,
  approveRentalExtension,
} from '../services/api.js'

const ENDPOINTS = [
  {
    id: 'get-resources',
    method: 'GET',
    path: '/api/resources',
    summary: 'List catalog resources with booked ranges',
    description: 'Returns available and booked catalog items with location, rental price, deposit, and locked date intervals.',
    requiresAuth: false,
    defaultParam: '',
    executor: async () => await getResources(),
  },
  {
    id: 'get-resource-id',
    method: 'GET',
    path: '/api/resources/{id}',
    summary: 'Get single resource details & calendar schedule',
    description: 'Retrieves metadata, coordinates, owner information, and current bookedRanges for a specific resource.',
    requiresAuth: false,
    paramName: 'id',
    defaultParam: 'res-1',
    executor: async (param) => await getResourceById(param || 'res-1'),
  },
  {
    id: 'get-requests',
    method: 'GET',
    path: '/api/requests',
    summary: 'Get user requests & advance pre-bookings',
    description: 'Returns all transactions, handover codes, extensions, and advance booking states for current account.',
    requiresAuth: true,
    defaultParam: '',
    executor: async () => await getRequests(),
  },
  {
    id: 'post-extend',
    method: 'POST',
    path: '/api/requests/{id}/extend',
    summary: 'Request rental extension (+days & new end date)',
    description: 'Active renter submits request for additional days. Calculates fee based on daily rental rate.',
    requiresAuth: true,
    paramName: 'requestId',
    defaultParam: 'req-3',
    executor: async (param) => {
      return await requestRentalExtension(param || 'req-3', {
        additionalDays: 3,
        newEndDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
        additionalAmount: 1500,
        reason: 'API Test Extension request',
      })
    },
  },
  {
    id: 'post-approve-extend',
    method: 'POST',
    path: '/api/requests/{id}/approve-extension',
    summary: 'Approve extension & execute priority conflict bump',
    description: 'Owner approves active renter extension. Automatically rejects overlapping future bookings, updates dates, and dispatches seller apology messages.',
    requiresAuth: true,
    paramName: 'requestId',
    defaultParam: 'req-3',
    executor: async (param) => await approveRentalExtension(param || 'req-3'),
  },
  {
    id: 'get-notifications',
    method: 'GET',
    path: '/api/notifications',
    summary: 'Get user notifications and automated bump alerts',
    description: 'Returns urgent notifications, approval alerts, extension confirmations, and bump updates.',
    requiresAuth: true,
    defaultParam: '',
    executor: async () => await getNotifications(),
  },
]

export default function ApiDocs() {
  const { token, user, isAuthenticated } = useAuth()
  const [activeParams, setActiveParams] = useState({
    'get-resource-id': 'res-1',
    'post-extend': 'req-3',
    'post-approve-extend': 'req-3',
  })
  const [responses, setResponses] = useState({})
  const [loadingMap, setLoadingMap] = useState({})
  const [copiedId, setCopiedId] = useState(null)

  const handleExecute = async (ep) => {
    setLoadingMap((prev) => ({ ...prev, [ep.id]: true }))
    const start = performance.now()
    try {
      const paramVal = activeParams[ep.id] || ep.defaultParam
      const data = await ep.executor(paramVal)
      const duration = Math.round(performance.now() - start)
      setResponses((prev) => ({
        ...prev,
        [ep.id]: {
          status: 200,
          statusText: 'OK',
          duration,
          data,
          time: new Date().toLocaleTimeString(),
        },
      }))
    } catch (err) {
      const duration = Math.round(performance.now() - start)
      setResponses((prev) => ({
        ...prev,
        [ep.id]: {
          status: 400,
          statusText: 'Bad Request / Error',
          duration,
          error: err.message,
          time: new Date().toLocaleTimeString(),
        },
      }))
    } finally {
      setLoadingMap((prev) => ({ ...prev, [ep.id]: false }))
    }
  }

  const copyCurl = (ep) => {
    const bearer = token ? ` -H "Authorization: Bearer ${token}"` : ''
    const param = activeParams[ep.id] || ep.defaultParam
    const url = `https://api.shelfshare.local${ep.path.replace('{id}', param).replace('{requestId}', param)}`
    const curl = `curl -X ${ep.method} "${url}" -H "Accept: application/json"${bearer}`
    navigator.clipboard.writeText(curl)
    setCopiedId(ep.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '36px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span className="badge badge-accent" style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
              REST API v2.0
            </span>
            <span className="badge badge-green" style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
              JWT Bearer Protected
            </span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--ink)' }}>
            ShelfShare Interactive API Explorer
          </h1>
          <p style={{ color: 'var(--sage)', fontSize: '1rem', marginTop: 8, maxWidth: 720 }}>
            Execute live requests against the ShelfShare platform engine. Authenticated endpoints automatically inject your active RFC 7519 JWT Bearer Token.
          </p>
        </div>

        {/* Authentication Card */}
        <div className="card" style={{ padding: 20, marginBottom: 32, background: 'var(--paper)', border: '1.5px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.02rem' }}>
                  {isAuthenticated ? `Authenticated as ${user?.name} (${user?.email})` : 'Anonymous / Not Logged In'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--sage)' }}>
                  {isAuthenticated ? 'Active JWT Bearer Token loaded automatically' : 'Log in to test authenticated endpoints'}
                </div>
              </div>
            </div>
            {!isAuthenticated && (
              <Link to="/login" className="btn btn-primary btn-sm">
                Log In / Quick Demo Switcher
              </Link>
            )}
          </div>
        </div>

        {/* Endpoints List */}
        <div style={{ display: 'grid', gap: 20 }}>
          {ENDPOINTS.map((ep) => {
            const res = responses[ep.id]
            const isLoading = loadingMap[ep.id]
            const isGet = ep.method === 'GET'

            return (
              <div
                key={ep.id}
                className="card"
                style={{
                  padding: 22,
                  border: `1.5px solid ${isGet ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  background: 'var(--bg)',
                }}
              >
                {/* Endpoint Header Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        color: '#fff',
                        background: isGet ? '#2563eb' : '#059669',
                      }}
                    >
                      {ep.method}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)' }}>
                      {ep.path}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {ep.requiresAuth && (
                      <span className="badge badge-accent" style={{ fontSize: '0.72rem' }}>
                        🔒 Requires JWT
                      </span>
                    )}
                    <button
                      onClick={() => copyCurl(ep)}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {copiedId === ep.id ? <Check size={14} /> : <Copy size={14} />} cURL
                    </button>
                    <button
                      onClick={() => handleExecute(ep)}
                      disabled={isLoading}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 100, justifyContent: 'center' }}
                    >
                      <Play size={14} /> {isLoading ? 'Running...' : 'Try It Out'}
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                  {ep.summary}
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--sage)', marginBottom: 14 }}>
                  {ep.description}
                </div>

                {/* Path Parameter Input if needed */}
                {ep.paramName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)' }}>
                      Param <code>{ep.paramName}</code>:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={activeParams[ep.id] ?? ep.defaultParam}
                      onChange={(e) => setActiveParams({ ...activeParams, [ep.id]: e.target.value })}
                      style={{ maxWidth: 200, padding: '4px 8px', fontSize: '0.84rem' }}
                    />
                  </div>
                )}

                {/* Live Response Box */}
                {res && (
                  <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: '0.82rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: res.status === 200 ? 'var(--primary)' : 'var(--red)' }}>
                        {res.status === 200 ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        Response: {res.status} {res.statusText}
                      </span>
                      <span style={{ color: 'var(--sage)' }}>
                        {res.duration}ms · {res.time}
                      </span>
                    </div>

                    <pre
                      style={{
                        background: 'var(--paper)',
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        fontSize: '0.78rem',
                        maxHeight: 280,
                        overflowY: 'auto',
                        margin: 0,
                        fontFamily: 'monospace',
                        color: 'var(--ink)',
                      }}
                    >
                      {JSON.stringify(res.data || { error: res.error }, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <Footer />
    </div>
  )
}
