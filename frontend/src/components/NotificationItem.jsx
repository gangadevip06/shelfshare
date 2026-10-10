// components/NotificationItem.jsx
import React from 'react'
import { CheckCircle2, XCircle, MessageSquare, Package, Clock, Bell } from 'lucide-react'

const ICONS = {
  approved: <CheckCircle2 size={18} color="#10b981" />,
  rejected: <XCircle size={18} color="#ef4444" />,
  message: <MessageSquare size={18} color="var(--primary)" />,
  update: <Package size={18} color="var(--accent)" />,
  reminder: <Clock size={18} color="var(--primary)" />,
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
}

export default function NotificationItem({ notification, onMarkRead }) {
  return (
    <div className={`notif-item ${notification.read ? '' : 'unread'}`}>
      <div className="ic-badge">{ICONS[notification.type] || <Bell size={18} color="var(--sage)" />}</div>
      <div className="content">
        <div className="title">{notification.title}</div>
        <div className="desc">{notification.desc}</div>
        <div className="time">{formatTime(notification.time)}</div>
      </div>
      {!notification.read && (
        <button className="btn btn-ghost btn-sm" onClick={() => onMarkRead(notification.id)}>
          Mark read
        </button>
      )}
    </div>
  )
}
