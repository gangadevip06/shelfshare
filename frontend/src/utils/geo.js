// utils/geo.js
// Real distance math (Haversine formula) between two lat/lng points, plus
// a rough delivery-time estimate based on that distance. Used for
// location-based search (5/10/20/30 km radius) on the Explore page.

const EARTH_RADIUS_KM = 6371

function toRad(deg) {
  return (deg * Math.PI) / 180
}

// Great-circle distance between two coordinates, in kilometres.
export function distanceKm(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

// A simple, honest estimate — not a real logistics engine, just a
// distance-scaled range so "nearby" listings feel like same-day pickup
// and farther ones set more realistic expectations.
export function estimateDeliveryTime(km) {
  if (km <= 3) return '20–30 min'
  if (km <= 5) return '30–45 min'
  if (km <= 10) return '45–60 min'
  if (km <= 20) return '1–2 hours'
  if (km <= 30) return '2–3 hours'
  return 'Contact owner to confirm'
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}
