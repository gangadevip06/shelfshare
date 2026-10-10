// pages/Explore.jsx
// Demonstrates dynamic search + multiple filters using filter()/map()/some(),
// plus real location-based search: distance is computed with the Haversine
// formula (utils/geo.js) against either the browser's real GPS position or
// a manually picked location, radius-filtered at 5/10/20/30 km.
import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, MapPin, Navigation, SlidersHorizontal, X, Inbox } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useSearchLocation } from '../context/LocationContext.jsx'
import UserLayout from '../components/UserLayout.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import ResourceCard from '../components/ResourceCard.jsx'
import { CATEGORIES, SHARING_TYPES, LOCATIONS, LOCATION_COORDS, SEARCH_RADIUS_OPTIONS } from '../data/mockData.js'
import { getResources } from '../services/api.js'
import { distanceKm } from '../utils/geo.js'

const SHARING_KEY = { 'Rent Only': 'sharing_RentOnly', 'Buy Only': 'sharing_BuyOnly', 'Rent or Buy': 'sharing_RentOrBuy' }

function ExploreContent() {
  const { t } = useLanguage()
  const { center, geoStatus, useMyLocation, setCenterByLocationName, clearCenter } = useSearchLocation()
  const [searchParams] = useSearchParams()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [location, setLocation] = useState('')
  const [sharingType, setSharingType] = useState('')
  const [availability, setAvailability] = useState('')
  const [radius, setRadius] = useState(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getResources()
        setResources(data)
      } catch (err) {
        setError('Could not load resources. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()

    const handleUpdate = () => load()
    window.addEventListener('focus', handleUpdate)
    window.addEventListener('shelfshare_resource_added', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('focus', handleUpdate)
      window.removeEventListener('shelfshare_resource_added', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  // Attach a real distance (km) to each resource when a search center is set.
  const withDistance = useMemo(() => {
    if (!center) return resources.map((r) => ({ ...r, _distance: null }))
    return resources.map((r) => {
      const coords = LOCATION_COORDS[r.location]
      const d = coords ? distanceKm(center.lat, center.lng, coords.lat, coords.lng) : null
      return { ...r, _distance: d }
    })
  }, [resources, center])

  const filtered = useMemo(() => {
    let list = withDistance
      .filter((r) => (search ? r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()) : true))
      .filter((r) => (category ? r.category === category : true))
      .filter((r) => (location ? r.location === location : true))
      .filter((r) => (sharingType ? r.sharingType === sharingType : true))
      .filter((r) => (availability ? r.availability === availability : true))

    if (center && radius) {
      list = list.filter((r) => r._distance !== null && r._distance <= radius)
      list = [...list].sort((a, b) => a._distance - b._distance)
    }
    return list
  }, [withDistance, search, category, location, sharingType, availability, center, radius])

  const hasActiveFilters = category || location || sharingType || availability || search || radius
  const someAvailable = filtered.some((r) => r.availability === 'Available')

  return (
    <div className="page-content" style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div className="page-head">
        <div>
          <h1>{t('explore_title')}</h1>
          <div className="sub">{filtered.length} resource{filtered.length !== 1 ? 's' : ''} found{someAvailable ? ' · some available now' : ''}</div>
        </div>
      </div>

      {/* Location-based search */}
      <div className="location-search-bar">
        <div className="location-search-top">
          <div className="location-current">
            <MapPin size={16} color="var(--primary)" />
            {center ? (
              <>Searching near <strong>{center.label}</strong></>
            ) : (
              <span style={{ color: 'var(--sage)' }}>No location set — showing all resources</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" onClick={useMyLocation} disabled={geoStatus === 'locating'}>
              <Navigation size={13} />
              {geoStatus === 'locating' ? 'Locating...' : 'Use my location'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowLocationPicker((v) => !v)}>
              <SlidersHorizontal size={13} />
              Pick location
            </button>
            {center && (
              <button className="btn btn-ghost btn-sm" onClick={() => { clearCenter(); setRadius(null) }}>
                <X size={13} /> Clear
              </button>
            )}
          </div>
        </div>

        {geoStatus === 'denied' && (
          <div className="alert alert-error" style={{ marginTop: 10 }}>
            Location access was denied. Pick a location manually instead.
          </div>
        )}
        {geoStatus === 'unsupported' && (
          <div className="alert alert-error" style={{ marginTop: 10 }}>
            Your browser doesn't support location access. Pick a location manually instead.
          </div>
        )}

        {showLocationPicker && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LOCATIONS.map((l) => (
              <button
                key={l}
                className={`radius-chip ${center?.label === l ? 'active' : ''}`}
                onClick={() => { setCenterByLocationName(l); setShowLocationPicker(false) }}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        {center && (
          <div style={{ marginTop: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Search radius</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SEARCH_RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  className={`radius-chip ${radius === r ? 'active' : ''}`}
                  onClick={() => setRadius(radius === r ? null : r)}
                >
                  Within {r} km
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="filters-bar">
        <div className="search-input-wrap" style={{ background: 'var(--surface)' }}>
          <Search size={16} color="var(--sage)" />
          <input placeholder={t('common_search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{t('filter_anyCategory')}</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="">{t('filter_anyLocation')}</option>
          {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={sharingType} onChange={(e) => setSharingType(e.target.value)}>
          <option value="">{t('filter_anySharingType')}</option>
          {SHARING_TYPES.map((st) => <option key={st} value={st}>{t(SHARING_KEY[st])}</option>)}
        </select>
        <select value={availability} onChange={(e) => setAvailability(e.target.value)}>
          <option value="">{t('filter_anyAvailability')}</option>
          <option value="Available">{t('status_Available')}</option>
          <option value="Unavailable">{t('status_Unavailable')}</option>
        </select>
        {hasActiveFilters && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setCategory(''); setLocation(''); setSharingType(''); setAvailability(''); setRadius(null) }}>
            <X size={13} /> Clear filters
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-wrap"><span className="spinner" />{t('common_loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="ic" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Inbox size={46} strokeWidth={1.5} color="var(--sage)" />
          </div>
          {t('empty_noResults')}
        </div>
      ) : (
        <div className="grid-4">
          {filtered.map((r) => <ResourceCard key={r.id} resource={r} distanceKm={r._distance} />)}
        </div>
      )}
    </div>
  )
}

export default function Explore() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return (
      <UserLayout>
        <ExploreContent />
      </UserLayout>
    )
  }

  return (
    <div>
      <Navbar />
      <ExploreContent />
      <Footer />
    </div>
  )
}
