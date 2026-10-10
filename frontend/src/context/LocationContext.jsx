// context/LocationContext.jsx
// -----------------------------------------------------------------------
// Holds the "search center" used for location-based search: either the
// browser's real GPS position (via navigator.geolocation) or a manually
// picked named location, matched against LOCATION_COORDS. Persisted so
// the choice survives a refresh. Explore.jsx uses this + utils/geo.js to
// do real km-radius filtering (5/10/20/30 km) with distance + delivery
// time shown per resource.
// -----------------------------------------------------------------------
import React, { createContext, useContext, useState } from 'react'
import { LOCATION_COORDS } from '../data/mockData.js'

const LocationContext = createContext(null)
const STORAGE_KEY = 'ss_search_location'

export function LocationProvider({ children }) {
  const [center, setCenterState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  // idle | locating | granted | denied | unsupported
  const [geoStatus, setGeoStatus] = useState('idle')

  const setCenter = (value) => {
    setCenterState(value)
    try {
      if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('unsupported')
      return
    }
    setGeoStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ label: 'My current location', lat: pos.coords.latitude, lng: pos.coords.longitude, isGeo: true })
        setGeoStatus('granted')
      },
      () => setGeoStatus('denied'),
      { timeout: 8000 }
    )
  }

  const setCenterByLocationName = (name) => {
    const coords = LOCATION_COORDS[name]
    if (!coords) return
    setCenter({ label: name, lat: coords.lat, lng: coords.lng, isGeo: false })
  }

  const clearCenter = () => {
    setCenter(null)
    setGeoStatus('idle')
  }

  return (
    <LocationContext.Provider value={{ center, geoStatus, useMyLocation, setCenterByLocationName, clearCenter }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useSearchLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useSearchLocation must be used within a LocationProvider')
  return ctx
}
