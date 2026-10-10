import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Package, RefreshCw, CheckCircle2, Star } from 'lucide-react'
import UserLayout from '../components/UserLayout.jsx'
import StatCard from '../components/StatCard.jsx'
import CategoryCard from '../components/CategoryCard.jsx'
import ResourceCard from '../components/ResourceCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { fetchResourcesThunk } from '../store/resourceSlice.js'
import { CATEGORIES, LOCATION_COORDS } from '../data/mockData.js'
import { getRequests } from '../services/api.js'
import { useSearchLocation } from '../context/LocationContext.jsx'
import { distanceKm } from '../utils/geo.js'
import { getRecentlyViewed } from '../utils/storage.js'

export default function Dashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { center } = useSearchLocation()
  const dispatch = useDispatch()
  const { items: resources, status } = useSelector((state) => state.resources)
  const [requests, setRequests] = useState([])

  useEffect(() => {
    if (status === 'idle') dispatch(fetchResourcesThunk())
  }, [status, dispatch])

  useEffect(() => {
    async function loadRequests() {
      try {
        const all = await getRequests()
        setRequests(all)
      } catch (err) {
        console.error(err)
      }
    }
    loadRequests()
  }, [])

  const myResources = resources.filter((r) => r.ownerId === user?.id)
  const myRequests = requests.filter((r) => r.requesterId === user?.id)
  const myActiveRequests = myRequests.filter((r) => r.status === 'Pending')
  const completed = myRequests.filter((r) => r.status === 'Completed').length

  // "Nearby" uses the active search location if set (see Explore's
  // location-based search), otherwise falls back to matching the town/area
  // named in the user's registered address.
  const userLocationWord = (user?.address || '').split(',')[0]?.trim()
  const geoCenter = center || (userLocationWord && LOCATION_COORDS[userLocationWord] ? { label: userLocationWord, ...LOCATION_COORDS[userLocationWord] } : null)

  const nearbyWithDistance = geoCenter
    ? resources
        .map((r) => {
          const coords = LOCATION_COORDS[r.location]
          return coords ? { ...r, _distance: distanceKm(geoCenter.lat, geoCenter.lng, coords.lat, coords.lng) } : null
        })
        .filter(Boolean)
        .sort((a, b) => a._distance - b._distance)
        .slice(0, 4)
    : []

  const nearby = userLocationWord
    ? resources.filter((r) => r.location.toLowerCase().includes(userLocationWord.toLowerCase())).slice(0, 4)
    : []
  const nearbyFallback = nearbyWithDistance.length ? nearbyWithDistance : (nearby.length ? nearby : resources.slice(4, 8))

  const recommended = resources.filter((r) => r.rating >= 4.5).slice(0, 4)
  const recommendedFallback = recommended.length ? recommended : resources.slice(0, 4)

  const recentlyViewedIds = user?.id ? getRecentlyViewed(user.id) : []
  const recentlyViewed = recentlyViewedIds
    .map((id) => resources.find((r) => r.id === id))
    .filter(Boolean)
    .slice(0, 4)

  return (
    <UserLayout title={`${t('dashboard_welcome')}, ${user?.name?.split(' ')[0] || 'there'} 👋`} subtitle={t('dashboard_subtitle')}>
      <div className="grid-4" style={{ marginBottom: 34 }}>
        <StatCard icon={<Package size={22} color="var(--primary)" />} label={t('stat_resourcesShared')} value={myResources.length} />
        <StatCard icon={<RefreshCw size={22} color="var(--accent)" />} label={t('stat_activeRequests')} value={myActiveRequests.length} deltaDirection="down" />
        <StatCard icon={<CheckCircle2 size={22} color="#10b981" />} label={t('stat_completedTransactions')} value={completed} />
        <StatCard icon={<Star size={22} fill="#f59e0b" color="#f59e0b" />} label={t('stat_communityRating')} value={user?.rating ? user.rating.toFixed(1) : 'New'} />
      </div>

      <div className="section-head shelf-row" style={{ marginBottom: 18 }}>
        <span className="eyebrow">{t('eyebrow_browse')}</span>
        <h2 style={{ fontSize: '1.3rem' }}>{t('section_categories')}</h2>
      </div>
      <div className="grid-4" style={{ marginBottom: 34 }}>
        {CATEGORIES.slice(0, 4).map((c) => <CategoryCard key={c.id} category={c} />)}
      </div>

      {recentlyViewed.length > 0 && (
        <>
          <div className="section-head shelf-row" style={{ marginBottom: 18 }}>
            <span className="eyebrow">History</span>
            <h2 style={{ fontSize: '1.3rem' }}>Recently Viewed</h2>
          </div>
          <div className="grid-4" style={{ marginBottom: 34 }}>
            {recentlyViewed.map((r) => <ResourceCard key={r.id} resource={r} />)}
          </div>
        </>
      )}

      <div className="section-head shelf-row" style={{ marginBottom: 18 }}>
        <span className="eyebrow">{t('eyebrow_forYou')}</span>
        <h2 style={{ fontSize: '1.3rem' }}>{t('section_recommended')}</h2>
      </div>
      {status === 'loading' ? (
        <div className="loading-wrap"><span className="spinner" />{t('common_loading')}</div>
      ) : (
        <div className="grid-4" style={{ marginBottom: 34 }}>
          {recommendedFallback.map((r) => <ResourceCard key={r.id} resource={r} />)}
        </div>
      )}

      <div className="section-head shelf-row" style={{ marginBottom: 18 }}>
        <span className="eyebrow">{t('eyebrow_closeBy')}{geoCenter ? ` · ${geoCenter.label}` : ''}</span>
        <h2 style={{ fontSize: '1.3rem' }}>{t('section_nearby')}</h2>
      </div>
      <div className="grid-4" style={{ marginBottom: 34 }}>
        {nearbyFallback.length ? nearbyFallback.map((r) => <ResourceCard key={r.id} resource={r} distanceKm={r._distance ?? null} />) : (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>No nearby resources yet.</div>
        )}
      </div>

      <div className="section-head shelf-row" style={{ marginBottom: 18 }}>
        <span className="eyebrow">{t('eyebrow_activity')}</span>
        <h2 style={{ fontSize: '1.3rem' }}>{t('section_recentActivity')}</h2>
      </div>
      <div className="card">
        {myRequests.slice(0, 5).map((r) => (
          <div key={r.id} className="notif-item">
            <div className="ic-badge">
              <RefreshCw size={18} color="var(--primary)" />
            </div>
            <div className="content">
              <div className="title">{r.resourceTitle}</div>
              <div className="desc">{r.requestType || 'Request'} — status: {r.status}</div>
              <div className="time">{r.requestedOn}</div>
            </div>
          </div>
        ))}
        {myRequests.length === 0 && <div className="empty-state">{t('empty_noActivity')}</div>}
      </div>
    </UserLayout>
  )
}
