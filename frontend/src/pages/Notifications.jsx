import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Bell } from 'lucide-react'
import UserLayout from '../components/UserLayout.jsx'
import NotificationItem from '../components/NotificationItem.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { fetchNotificationsThunk, markAllNotificationsReadThunk, markNotificationReadThunk } from '../store/resourceSlice.js'

export default function Notifications() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const notifications = useSelector((state) => state.resources.notifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (user?.id) dispatch(fetchNotificationsThunk(user.id))
  }, [user?.id, dispatch])

  return (
    <UserLayout title={t('notifications_title')} subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}>
      <div className="page-head">
        <div />
        {unreadCount > 0 && (
          <button className="btn btn-outline btn-sm" onClick={() => dispatch(markAllNotificationsReadThunk(user.id))}>
            {t('action_markAllRead')}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="ic" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Bell size={44} strokeWidth={1.5} color="var(--sage)" />
          </div>
          {t('empty_noNotifications')}
        </div>
      ) : (
        <div className="card">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onMarkRead={(id) => dispatch(markNotificationReadThunk(id))} />
          ))}
        </div>
      )}
    </UserLayout>
  )
}

