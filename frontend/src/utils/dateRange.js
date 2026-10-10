// utils/dateRange.js
// Small date-range helpers for the rental availability calendar —
// checking whether a proposed booking overlaps any already-booked range
// on a resource.
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) <= new Date(bEnd) && new Date(bStart) <= new Date(aEnd)
}

export function findOverlap(startDate, endDate, bookedRanges = []) {
  return bookedRanges.find((r) => rangesOverlap(startDate, endDate, r.start, r.end))
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function formatDateRange(start, end) {
  const opts = { day: '2-digit', month: 'short' }
  return `${new Date(start).toLocaleDateString(undefined, opts)} – ${new Date(end).toLocaleDateString(undefined, opts)}`
}
