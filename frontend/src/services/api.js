// services/api.js
// -----------------------------------------------------------------------
// CONTROLLER-adjacent layer: talks to "the backend". Right now it reads
// from localStorage (via utils/storage.js, seeded from mockData.js) and
// wraps every call in a Promise with an artificial delay, so components
// already use the async/await + try/catch pattern they would use against
// a real REST API. Swap the internals of these functions for real
// fetch() calls later and no page component needs to change.
// -----------------------------------------------------------------------

import {
  INITIAL_RESOURCES,
  INITIAL_REQUESTS,
  CATEGORIES,
  INITIAL_REPORTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_MESSAGES,
  INITIAL_USERS,
  DATA_VERSION,
  GARDENING_EQUIPMENTS_RESOURCE,
} from '../data/mockData.js'
import * as store from '../utils/storage.js'

const DELAY = 0

const wait = (value) => new Promise((resolve) => setTimeout(() => resolve(value), DELAY))
const failAfter = (message) => new Promise((_, reject) => setTimeout(() => reject(new Error(message)), DELAY))


// Seed localStorage on first load only (won't overwrite existing data).
function seedOnce(key, fallback) {
  if (localStorage.getItem(key) === null) {
    localStorage.setItem(key, JSON.stringify(fallback))
  }
}

// Data versioning: preserve custom user resources and requests
const VERSION_KEY = 'ss_data_version'
if (localStorage.getItem(VERSION_KEY) !== DATA_VERSION) {
  try {
    const existingResources = store.getResources([]) || []
    const customResources = existingResources.filter((r) => {
      const isSeed = r.id && String(r.id).startsWith('res-') && Number(r.id.replace('res-', '')) <= 15
      return !isSeed
    })
    const existingRequests = store.getRequests([]) || []
    localStorage.removeItem(store.STORAGE_KEYS.resources)
    localStorage.removeItem(store.STORAGE_KEYS.requests)
    localStorage.removeItem(store.STORAGE_KEYS.categories)
    localStorage.removeItem(store.STORAGE_KEYS.reports)
    localStorage.removeItem(store.STORAGE_KEYS.messages)
    localStorage.removeItem(store.STORAGE_KEYS.notifications)
    localStorage.setItem(VERSION_KEY, DATA_VERSION)
    if (customResources.length > 0) {
      store.saveResources(customResources)
    }
    if (existingRequests.length > 0) {
      store.saveRequests(existingRequests)
    }
  } catch {
    localStorage.setItem(VERSION_KEY, DATA_VERSION)
  }
}

seedOnce(store.STORAGE_KEYS.resources, INITIAL_RESOURCES)
seedOnce(store.STORAGE_KEYS.requests, INITIAL_REQUESTS)
seedOnce(store.STORAGE_KEYS.categories, CATEGORIES)
seedOnce(store.STORAGE_KEYS.reports, INITIAL_REPORTS)
seedOnce(store.STORAGE_KEYS.notifications, INITIAL_NOTIFICATIONS)
seedOnce(store.STORAGE_KEYS.messages, INITIAL_MESSAGES)

// ---------------- Backend REST API Connection ----------------
export const API_BASE_URL = 'http://localhost:5001/api'
let backendTested = false
let backendOnline = false

export async function isBackendOnline() {
  if (backendTested) return backendOnline
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1200)
    const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal })
    clearTimeout(timeoutId)
    backendOnline = res.ok
  } catch {
    backendOnline = false
  }
  backendTested = true
  return backendOnline
}

function authHeaders() {
  const token = localStorage.getItem('ss_jwt_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ---------------- Resources ----------------

export function isUserAdded(r) {
  if (!r) return false
  // Explicitly exclude legacy mock items requested to be purged
  if (r.id === 'res-gardening-equipments' || r.id === 'res-1790672398112' || r.id === 'res-1790657313731') return false
  // Platform seed catalog items (res-1 through res-150) are NOT user-added
  const match = String(r.id).match(/^res-(\d+)$/)
  if (match) {
    const num = parseInt(match[1], 10)
    if (num >= 1 && num <= 150) return false
  }
  // Any item with a custom or timestamp-based ID (e.g. res-179...)
  if (r.id && (!String(r.id).startsWith('res-') || isNaN(r.id.replace('res-', '')) || Number(r.id.replace('res-', '')) > 150)) {
    return true
  }
  // Any item with an authentic user email (not mock shelfshare domain)
  if (r.ownerEmail && !r.ownerEmail.endsWith('@shelfshare.com')) {
    return true
  }
  return false
}

export async function getResources() {
  const localData = store.getResources(INITIAL_RESOURCES) || []
  let combined = [...localData]

  if (await isBackendOnline()) {
    try {
      const res = await fetch(`${API_BASE_URL}/resources`)
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          const backendItems = json.data
          const backendIds = new Set(backendItems.map((r) => r.id))

          // 1. Any local items not yet in backend
          const localOnly = localData.filter((r) => !backendIds.has(r.id))

          // Sync local-only user items to backend so MongoDB has them permanently
          if (localOnly.length > 0) {
            localOnly.forEach((item) => {
              if (isUserAdded(item)) {
                fetch(`${API_BASE_URL}/resources`, {
                  method: 'POST',
                  headers: authHeaders(),
                  body: JSON.stringify(item),
                }).catch(() => {})
              }
            })
          }

          // 2. Combine backend items + local-only items
          combined = [...backendItems, ...localOnly]
        }
      }
    } catch (e) {
      console.warn('Backend resources fetch failed, using localData', e)
    }
  }

  // 3. Deduplicate combined resources by id AND by (normalized title + location) so no item repeats
  const seenIds = new Set()
  const seenCombos = new Set()
  const deduplicated = []

  for (const r of combined) {
    if (!r || !r.id) continue
    if (seenIds.has(r.id)) continue

    const normTitle = (r.title || '').toLowerCase().replace(/s$/, '').trim()
    const normLoc = (r.location || '').toLowerCase().trim()
    const combo = `${normTitle}:::${normLoc}`

    if (seenCombos.has(combo) && !isUserAdded(r)) {
      continue
    }

    seenIds.add(r.id)
    seenCombos.add(combo)
    deduplicated.push(r)
  }

  // 4. Guarantee seed catalog items (res-1 to res-150) never belong to Ganga Devi
  const mapped = deduplicated.map((r) => {
    const match = String(r.id).match(/^res-(\d+)$/)
    if (match && parseInt(match[1], 10) <= 150 && (r.ownerId === 'user-ganga' || r.ownerEmail === 'gangadevip06@gmail.com')) {
      return {
        ...r,
        ownerId: 'user-karthik',
        ownerName: 'Karthik Raman',
        ownerEmail: 'karthik.raman@shelfshare.com',
      }
    }
    return r
  })

  // 5. User-added items MUST ALWAYS appear at the very start of Explore!
  const userItems = mapped.filter(isUserAdded)
  const catalogItems = mapped.filter((r) => !isUserAdded(r))

  userItems.sort((a, b) => {
    return (b.createdAt || '').localeCompare(a.createdAt || '') || String(b.id).localeCompare(String(a.id))
  })

  const finalOrder = [...userItems, ...catalogItems]
  store.saveResources(finalOrder)
  return wait(finalOrder)
}

export async function getResourceById(id) {
  if (await isBackendOnline()) {
    try {
      const res = await fetch(`${API_BASE_URL}/resources/${id}`)
      if (res.ok) {
        const json = await res.json()
        if (json.data) return json.data
      }
    } catch {
      // fallback
    }
  }
  const found = store.getResources(INITIAL_RESOURCES).find((r) => r.id === id)
  if (!found) return failAfter('Resource not found')
  return wait(found)
}

export async function addResource(resource) {
  const resourceId = resource.id || `res-${Date.now()}`
  const createdAt = resource.createdAt || new Date().toISOString().slice(0, 10)
  const fullResource = { ...resource, id: resourceId, createdAt }

  // 1. Immediately save to localStorage at the top
  const currentLocal = store.getResources(INITIAL_RESOURCES) || []
  const filtered = currentLocal.filter((r) => r.id !== resourceId)
  const updatedLocal = [fullResource, ...filtered]
  store.saveResources(updatedLocal)

  // 2. Notify Explore and other active pages
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('shelfshare_resource_added'))
  }

  // 3. Also send to MongoDB backend
  if (await isBackendOnline()) {
    try {
      const res = await fetch(`${API_BASE_URL}/resources`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(fullResource),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          const freshLocal = store.getResources(INITIAL_RESOURCES) || []
          const fFiltered = freshLocal.filter((r) => r.id !== json.data.id && r.id !== resourceId)
          store.saveResources([json.data, ...fFiltered])
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('shelfshare_resource_added'))
          }
          return json.data
        }
      }
    } catch (e) {
      console.warn('Backend sync failed, saved locally', e)
    }
  }

  return wait(fullResource)
}

export async function updateResource(id, changes) {
  if (await isBackendOnline()) {
    try {
      const res = await fetch(`${API_BASE_URL}/resources/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(changes),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          const data = store.getResources(INITIAL_RESOURCES)
          const idx = data.findIndex((r) => r.id === id)
          if (idx !== -1) { data[idx] = json.data; store.saveResources(data) }
          return json.data
        }
      }
    } catch {
      // fallback
    }
  }
  const data = store.getResources(INITIAL_RESOURCES)
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) return failAfter('Resource not found')
  data[idx] = { ...data[idx], ...changes }
  store.saveResources(data)
  return wait(data[idx])
}

// Adds a review to a resource and recalculates its average rating from
// all reviews. One review per (resource, user) — the caller is expected
// to check eligibility (a completed request) before calling this.
export async function addReview(resourceId, review) {
  const data = store.getResources(INITIAL_RESOURCES)
  const idx = data.findIndex((r) => r.id === resourceId)
  if (idx === -1) return failAfter('Resource not found')

  const newReview = {
    id: `rev-${Date.now()}`,
    user: review.userName,
    userId: review.userId,
    rating: review.rating,
    comment: review.comment,
    date: new Date().toISOString().slice(0, 10),
  }
  const reviews = [...(data[idx].reviews || []), newReview]
  const avgRating = +(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
  data[idx] = { ...data[idx], reviews, rating: avgRating }
  store.saveResources(data)
  return wait(data[idx])
}

export async function deleteResource(id) {
  const data = store.getResources(INITIAL_RESOURCES)
  store.saveResources(data.filter((r) => r.id !== id))
  return wait({ success: true })
}

// ---------------- Categories ----------------

export async function getCategories() {
  if (await isBackendOnline()) {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`)
      if (res.ok) {
        const json = await res.json()
        if (json.data && json.data.length > 0) return json.data
      }
    } catch {
      // fallback
    }
  }
  return wait(store.getCategories(CATEGORIES))
}

export async function addCategory(category) {
  if (await isBackendOnline()) {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(category),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          const data = store.getCategories(CATEGORIES)
          store.saveCategories([...data, json.data])
          return json.data
        }
      }
    } catch {
      // fallback
    }
  }
  const data = store.getCategories(CATEGORIES)
  const newCat = { ...category, id: `cat-${Date.now()}` }
  store.saveCategories([...data, newCat])
  return wait(newCat)
}

export async function updateCategory(id, changes) {
  const data = store.getCategories(CATEGORIES)
  const idx = data.findIndex((c) => c.id === id)
  if (idx === -1) return failAfter('Category not found')
  data[idx] = { ...data[idx], ...changes }
  store.saveCategories(data)
  return wait(data[idx])
}

export async function deleteCategory(id) {
  const data = store.getCategories(CATEGORIES)
  store.saveCategories(data.filter((c) => c.id !== id))
  return wait({ success: true })
}

// ---------------- Requests ----------------

export async function getRequests() {
  const localData = store.getRequests(INITIAL_REQUESTS) || []
  if (await isBackendOnline()) {
    try {
      const res = await fetch(`${API_BASE_URL}/requests`)
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          const backendItems = json.data
          const backendIds = new Set(backendItems.map((r) => r.id))
          const localCustom = localData.filter((r) => !backendIds.has(r.id))

          if (localCustom.length > 0) {
            localCustom.forEach((item) => {
              fetch(`${API_BASE_URL}/requests`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(item),
              }).catch(() => {})
            })
          }

          const merged = [...localCustom, ...backendItems]
          store.saveRequests(merged)
          return merged
        }
      }
    } catch {
      // fallback
    }
  }
  return wait(localData)
}

export async function getRequestById(id) {
  if (await isBackendOnline()) {
    try {
      const res = await fetch(`${API_BASE_URL}/requests/${id}`)
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          const localData = store.getRequests(INITIAL_REQUESTS) || []
          const idx = localData.findIndex((r) => r.id === id)
          if (idx !== -1) {
            localData[idx] = json.data
          } else {
            localData.unshift(json.data)
          }
          store.saveRequests(localData)
          return wait(json.data)
        }
      }
    } catch {
      // fallback to store
    }
  }
  const found = store.getRequests(INITIAL_REQUESTS).find((r) => r.id === id)
  if (!found) return failAfter('Request not found')
  return wait(found)
}

// Appends a timestamped entry to a request's tracking history — this is
// what powers the live order-tracking timeline (real dates/times per
// stage, like a courier tracking page), not just a static status label.
function pushHistory(request, key) {
  const history = [...(request.statusHistory || [])]
  history.push({ key, at: new Date().toISOString() })
  return history
}

export async function addRequest(request) {
  const data = store.getRequests(INITIAL_REQUESTS)
  const now = new Date().toISOString()
  const todayStr = now.slice(0, 10)
  const isPreBooking = request.requestType === 'Rent' && request.startDate && request.startDate > todayStr

  const newRequest = {
    ...request,
    id: request.id || `req-${Date.now()}`,
    status: request.status || 'Pending',
    requestedOn: request.requestedOn || todayStr,
    isPreBooking,
    pickupLocation: request.pickupLocation || null,
    paymentStatus: request.paymentStatus || 'Unpaid',
    paymentMethod: request.paymentMethod || null,
    paymentTransactionId: null,
    paymentDate: null,
    handoverStatus: request.handoverStatus || 'Not Handed Over',
    statusHistory: request.statusHistory || [{ key: isPreBooking ? 'Pre-booked (Requested)' : 'Requested', at: now }],
  }
  store.saveRequests([newRequest, ...data])

  if (await isBackendOnline()) {
    try {
      fetch(`${API_BASE_URL}/requests`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newRequest),
      }).catch(() => {})
    } catch {}
  }

  return wait(newRequest)
}

// Delivery/handover lifecycle, shared by Buy and Rent:
//   Not Handed Over -> Handed Over (owner) -> Received (requester confirms)
// For Buy, confirming Received also completes the request immediately
// (a purchase has no return step). For Rent, Received is followed by a
// separate Returned step and the owner completing it afterward.
export async function updateHandoverStatus(id, handoverStatus) {
  const data = store.getRequests(INITIAL_REQUESTS)
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) return failAfter('Request not found')
  const current = data[idx]
  const historyKey = handoverStatus === 'Handed Over' ? 'Out for Delivery' : handoverStatus === 'Received' ? 'Delivered' : handoverStatus

  let handoverCode = current.handoverCode
  if (handoverStatus === 'Handed Over' && !handoverCode) {
    handoverCode = String(Math.floor(100000 + Math.random() * 900000))
  }

  let updated = {
    ...current,
    status: current.status === 'Pending' ? 'Approved' : current.status,
    handoverStatus,
    handoverCode: handoverCode || current.handoverCode,
    statusHistory: pushHistory(current, historyKey),
  }

  if (handoverStatus === 'Received' && current.requestType === 'Buy') {
    updated = { ...updated, status: 'Completed', statusHistory: pushHistory(updated, 'Completed') }
  }
  data[idx] = updated
  store.saveRequests(data)

  if (await isBackendOnline()) {
    try {
      fetch(`${API_BASE_URL}/requests/${id}/handover`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: handoverStatus, handoverCode: updated.handoverCode }),
      }).catch(() => {})
    } catch {}
  }

  return wait(data[idx])
}

// Verifies the code the requester enters against the one generated when
// the owner marked the item handed over, before allowing confirmation.
export async function confirmReceivedWithCode(id, enteredCode) {
  const data = store.getRequests(INITIAL_REQUESTS)
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) return failAfter('Request not found')
  const current = data[idx]
  if (current.handoverCode && String(enteredCode).trim() !== String(current.handoverCode).trim()) {
    return failAfter('That code doesn\'t match. Please check with the owner and try again.')
  }

  if (await isBackendOnline()) {
    try {
      fetch(`${API_BASE_URL}/requests/${id}/confirm-code`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ code: enteredCode }),
      }).catch(() => {})
    } catch {}
  }

  return updateHandoverStatus(id, 'Received')
}

export async function updateRequestStatus(id, status) {
  const data = store.getRequests(INITIAL_REQUESTS)
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) return failAfter('Request not found')
  data[idx] = { ...data[idx], status, statusHistory: pushHistory(data[idx], status) }
  store.saveRequests(data)

  if (await isBackendOnline()) {
    try {
      fetch(`${API_BASE_URL}/requests/${id}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      }).catch(() => {})
    } catch {}
  }

  return wait(data[idx])
}

// Completes a Rent request with a condition report — the owner records
// the item's condition on return and, if there's a deposit, how much (if
// any) to deduct, with the rest refunded. This is where real dispute
// handling would live in a production app, not a bare "mark completed".
export async function completeWithConditionReport(id, { condition, comment, deduction }) {
  const data = store.getRequests(INITIAL_REQUESTS)
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) return failAfter('Request not found')
  const deposit = data[idx].deposit || 0
  const safeDeduction = Math.max(0, Math.min(Number(deduction) || 0, deposit))
  data[idx] = {
    ...data[idx],
    status: 'Completed',
    returnCondition: condition,
    returnComment: comment || '',
    depositDeduction: safeDeduction,
    depositRefund: deposit - safeDeduction,
    statusHistory: pushHistory(data[idx], 'Completed'),
  }
  store.saveRequests(data)

  if (await isBackendOnline()) {
    try {
      fetch(`${API_BASE_URL}/requests/${id}/complete-condition`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ condition, comment, deduction }),
      }).catch(() => {})
    } catch {}
  }

  return wait(data[idx])
}

// Owner approves and sets where the handover will happen, in one step.
export async function approveRequestWithLocation(id, pickupLocation) {
  const data = store.getRequests(INITIAL_REQUESTS)
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) return failAfter('Request not found')
  data[idx] = { ...data[idx], status: 'Approved', pickupLocation, statusHistory: pushHistory(data[idx], 'Approved') }
  store.saveRequests(data)

  // Reserve the date range on the resource's availability calendar so
  // future renters see it as booked for these dates — Rent requests only.
  const approved = data[idx]
  if (approved.requestType === 'Rent' && approved.startDate && approved.endDate) {
    const resources = store.getResources(INITIAL_RESOURCES)
    const rIdx = resources.findIndex((r) => r.id === approved.resourceId)
    if (rIdx !== -1) {
      const bookedRanges = [...(resources[rIdx].bookedRanges || []), { start: approved.startDate, end: approved.endDate, requestId: approved.id }]
      resources[rIdx] = { ...resources[rIdx], bookedRanges }
      store.saveResources(resources)
    }
  }

  // Mutual exclusion: If this resource has an active rental with a pending extension overlapping these dates,
  // decline that extension request since the owner chose to accept THIS buyer instead!
  for (let i = 0; i < data.length; i++) {
    const r = data[i]
    if (
      r.id !== approved.id &&
      r.resourceId === approved.resourceId &&
      (r.extensionStatus === 'Pending' || r.extensionStatus === 'Requested') &&
      r.startDate &&
      r.startDate <= (approved.endDate || approved.requestedOn) &&
      (r.extensionEndDate || r.endDate) >= (approved.startDate || approved.requestedOn)
    ) {
      data[i] = {
        ...r,
        extensionStatus: 'Rejected',
        extensionRejectReason: 'Owner accepted another reservation for these dates',
        statusHistory: pushHistory(r, 'Extension Declined - Another Booking Approved'),
      }
      await addNotification({
        userId: r.requesterId,
        type: 'rejected',
        title: 'Rental Extension Declined',
        desc: `Your extension request for "${approved.resourceTitle}" was declined because the owner accepted another reservation. Please return the item by ${r.endDate}.`,
      })
      try {
        await sendMessage({
          resourceId: approved.resourceId,
          resourceTitle: approved.resourceTitle,
          senderId: approved.ownerId,
          senderName: approved.ownerName,
          receiverId: r.requesterId,
          receiverName: r.requesterName,
          text: `Hi ${r.requesterName}, I cannot accommodate your extension request for "${approved.resourceTitle}" because another booking was accepted. Please return the item by ${r.endDate}.`,
        })
      } catch (e) {
        console.warn('Failed to send conflict chat message', e)
      }
    }
  }

  store.saveRequests(data)

  if (await isBackendOnline()) {
    try {
      fetch(`${API_BASE_URL}/requests/${id}/approve`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ pickupLocation }),
      }).catch(() => {})
    } catch {}
  }

  return wait(data[idx])
}

// Records payment for a request. "Cash on Pickup" is settled at handover
// rather than online, so it gets its own paymentStatus rather than "Paid".
export async function recordPayment(id, { method, transactionId }) {
  const data = store.getRequests(INITIAL_REQUESTS)
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) return failAfter('Request not found')
  const paymentStatus = method === 'Cash on Pickup' ? 'Cash on Pickup' : 'Paid'
  data[idx] = {
    ...data[idx],
    paymentMethod: method,
    paymentStatus,
    paymentTransactionId: transactionId || null,
    paymentDate: new Date().toISOString(),
    statusHistory: pushHistory(data[idx], paymentStatus),
  }
  store.saveRequests(data)

  if (await isBackendOnline()) {
    try {
      fetch(`${API_BASE_URL}/requests/${id}/payment`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ method, transactionId }),
      }).catch(() => {})
    } catch {}
  }

  return wait(data[idx])
}

export async function cancelRequest(id) {
  return updateRequestStatus(id, 'Cancelled')
}

// ---------------- Rental Extension & Overlap Conflict Engine ----------------

export async function requestRentalExtension(id, { additionalDays, newEndDate, additionalAmount, reason }) {
  const data = store.getRequests(INITIAL_REQUESTS)
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) return failAfter('Request not found')
  const current = data[idx]

  const updated = {
    ...current,
    extensionStatus: 'Requested',
    extensionDays: additionalDays,
    extensionEndDate: newEndDate,
    extensionAmount: Number(additionalAmount) || 0,
    extensionReason: reason || '',
    extensionRequestedAt: new Date().toISOString(),
    statusHistory: pushHistory(current, 'Extension Requested'),
  }
  data[idx] = updated
  store.saveRequests(data)

  // Notify owner
  await addNotification({
    userId: current.ownerId,
    type: 'message',
    title: 'Rental Extension Requested',
    desc: `${current.requesterName} requested to extend rental of "${current.resourceTitle}" by ${additionalDays} day(s) until ${newEndDate} (₹${additionalAmount}). Please accept or decline.`,
  })

  // Send automated chat message from requester to owner
  try {
    await sendMessage({
      resourceId: current.resourceId,
      resourceTitle: current.resourceTitle,
      senderId: current.requesterId,
      senderName: current.requesterName,
      receiverId: current.ownerId,
      receiverName: current.ownerName,
      text: `Hi ${current.ownerName}, I have requested a rental extension for "${current.resourceTitle}" by +${additionalDays} day(s) until ${newEndDate} (Additional fee: ₹${additionalAmount}). Please review and accept or decline.`,
    })
  } catch (e) {
    console.warn('Failed to send extension request chat message', e)
  }

  if (await isBackendOnline()) {
    try {
      fetch(`${API_BASE_URL}/requests/${id}/extension`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ additionalDays, newEndDate, additionalAmount, reason }),
      }).catch(() => {})
    } catch {}
  }

  return wait(updated)
}

export async function approveRentalExtension(id) {
  const data = store.getRequests(INITIAL_REQUESTS)
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) return failAfter('Request not found')
  const current = data[idx]
  if (current.extensionStatus !== 'Pending' && current.extensionStatus !== 'Requested') {
    return failAfter('No pending extension found')
  }

  const originalEndDate = current.endDate
  const newEndDate = current.extensionEndDate
  const extensionAmount = current.extensionAmount || 0

  // 1. Update current request
  const updatedCurrent = {
    ...current,
    endDate: newEndDate,
    rentalDuration: (current.rentalDuration || 0) + (current.extensionDays || 0),
    amount: (current.amount || 0) + extensionAmount,
    totalAmount: (current.totalAmount || 0) + extensionAmount,
    extensionStatus: 'Approved',
    extensionPaymentStatus: 'Unpaid',
    statusHistory: pushHistory(current, 'Extension Approved'),
  }
  data[idx] = updatedCurrent

  // 2. Update resource bookedRanges
  const resources = store.getResources(INITIAL_RESOURCES)
  const rIdx = resources.findIndex((r) => r.id === current.resourceId)
  if (rIdx !== -1) {
    let bookedRanges = [...(resources[rIdx].bookedRanges || [])]
    bookedRanges = bookedRanges.map((range) => {
      if (range.requestId === current.id || (range.start === current.startDate && range.end === originalEndDate)) {
        return { ...range, end: newEndDate }
      }
      return range
    })
    resources[rIdx] = { ...resources[rIdx], bookedRanges }
    store.saveResources(resources)
  }

  // 3. Find any conflicting future requests for this resource
  // Any request where requested date overlaps with [originalEndDate, newEndDate]
  // Mutual exclusion: only ONE buyer can be accepted!
  const conflictingRequests = data.filter((r) => 
    r.id !== current.id &&
    r.resourceId === current.resourceId &&
    (r.status === 'Pending' || r.status === 'Approved') &&
    r.startDate &&
    r.startDate <= newEndDate &&
    r.endDate >= originalEndDate
  )

  // 4. Bump conflicting requests, notify users, and send seller message
  for (const bumped of conflictingRequests) {
    const bumpedIdx = data.findIndex((r) => r.id === bumped.id)
    if (bumpedIdx !== -1) {
      data[bumpedIdx] = {
        ...data[bumpedIdx],
        status: 'Rejected',
        bumpedByExtension: true,
        cancellationReason: 'The product is currently unavailable as the active renter has extended their rental period.',
        statusHistory: pushHistory(data[bumpedIdx], 'Rejected - Unavailable due to Active Extension'),
      }

      // Remove from bookedRanges if it was approved
      if (rIdx !== -1 && resources[rIdx]) {
        resources[rIdx].bookedRanges = (resources[rIdx].bookedRanges || []).filter(
          (b) => b.requestId !== bumped.id && b.start !== bumped.startDate
        )
        store.saveResources(resources)
      }

      // Urgent notification to the bumped user
      await addNotification({
        userId: bumped.requesterId,
        type: 'rejected',
        title: 'Product Unavailable (Rental Extended)',
        desc: `"${current.resourceTitle}" is unfortunately unavailable for your requested dates because the active renter has extended their rental. Your request has been cancelled.`,
      })

      // Send automated message from seller to bumped user
      try {
        await sendMessage({
          resourceId: current.resourceId,
          resourceTitle: current.resourceTitle,
          senderId: current.ownerId,
          senderName: current.ownerName,
          receiverId: bumped.requesterId,
          receiverName: bumped.requesterName,
          text: `Hi ${bumped.requesterName}, I apologize, but "${current.resourceTitle}" is currently unavailable because the active renter has extended their rental period through ${newEndDate}. Only one booking can be accepted.`,
        })
      } catch (e) {
        console.warn('Failed to send bump message', e)
      }
    }
  }

  store.saveRequests(data)

  // Notify renter that extension was approved
  await addNotification({
    userId: current.requesterId,
    type: 'approved',
    title: 'Rental Extension Approved',
    desc: `${current.ownerName} approved your rental extension for "${current.resourceTitle}" until ${newEndDate}. Please complete payment for the additional duration.`,
  })

  // Send automated confirmation message to renter
  try {
    await sendMessage({
      resourceId: current.resourceId,
      resourceTitle: current.resourceTitle,
      senderId: current.ownerId,
      senderName: current.ownerName,
      receiverId: current.requesterId,
      receiverName: current.requesterName,
      text: `Hi ${current.requesterName}, I have approved your rental extension for "${current.resourceTitle}" until ${newEndDate}. Please complete payment of ₹${extensionAmount} for the additional duration.`,
    })
  } catch (e) {
    console.warn('Failed to send extension approved chat message', e)
  }

  if (await isBackendOnline()) {
    try {
      const res = await fetch(`${API_BASE_URL}/requests/${id}/extension/approve`, {
        method: 'PUT',
        headers: authHeaders(),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          const idx2 = data.findIndex((r) => r.id === id)
          if (idx2 !== -1) data[idx2] = json.data
          store.saveRequests(data)
          return wait(json.data)
        }
      }
    } catch {}
  }

  return wait(updatedCurrent)
}

export async function rejectRentalExtension(id, reason) {
  const data = store.getRequests(INITIAL_REQUESTS)
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) return failAfter('Request not found')
  const current = data[idx]

  const rejectReason = reason || 'Resource unavailable for extension'
  data[idx] = {
    ...current,
    extensionStatus: 'Rejected',
    extensionRejectReason: rejectReason,
    statusHistory: pushHistory(current, 'Extension Rejected'),
  }
  store.saveRequests(data)

  await addNotification({
    userId: current.requesterId,
    type: 'rejected',
    title: 'Rental Extension Declined',
    desc: `${current.ownerName} could not approve the extension for "${current.resourceTitle}". Reason: ${rejectReason}. Please return the item by ${current.endDate}.`,
  })

  // Send chat message
  try {
    await sendMessage({
      resourceId: current.resourceId,
      resourceTitle: current.resourceTitle,
      senderId: current.ownerId,
      senderName: current.ownerName,
      receiverId: current.requesterId,
      receiverName: current.requesterName,
      text: `Hi ${current.requesterName}, I am unable to approve the extension for "${current.resourceTitle}". Reason: ${rejectReason}. Please return the item by the original return date (${current.endDate}).`,
    })
  } catch (e) {
    console.warn('Failed to send extension reject message', e)
  }

  if (await isBackendOnline()) {
    try {
      const res = await fetch(`${API_BASE_URL}/requests/${id}/extension/reject`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ reason: rejectReason }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          const idx2 = data.findIndex((r) => r.id === id)
          if (idx2 !== -1) data[idx2] = json.data
          store.saveRequests(data)
          return wait(json.data)
        }
      }
    } catch {}
  }

  return wait(data[idx])
}

export async function recordExtensionPayment(id, { method, transactionId }) {
  const data = store.getRequests(INITIAL_REQUESTS)
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) return failAfter('Request not found')
  const current = data[idx]

  data[idx] = {
    ...current,
    extensionPaymentStatus: 'Paid',
    extensionPaymentMethod: method,
    extensionTransactionId: transactionId || `EXT-TXN${Date.now().toString().slice(-6)}`,
    extensionPaidAt: new Date().toISOString(),
    statusHistory: pushHistory(current, 'Extension Paid'),
  }
  store.saveRequests(data)

  await addNotification({
    userId: current.ownerId,
    type: 'update',
    title: 'Extension Payment Received',
    desc: `${current.requesterName} paid ₹${current.extensionAmount} for the rental extension on "${current.resourceTitle}".`,
  })

  if (await isBackendOnline()) {
    try {
      const res = await fetch(`${API_BASE_URL}/requests/${id}/extension/pay`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ method, transactionId }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          data[idx] = json.data
          store.saveRequests(data)
          return wait(json.data)
        }
      }
    } catch {}
  }

  return wait(data[idx])
}

// ---------------- Users & Admins ----------------

export async function getUsers() {
  return wait(store.getUsers())
}

export async function getAdmins() {
  return wait(store.getAdmins())
}

export async function updateUser(id, changes) {
  const data = store.getUsers()
  const idx = data.findIndex((u) => u.id === id)
  if (idx === -1) return failAfter('User not found')
  data[idx] = { ...data[idx], ...changes }
  store.saveUsers(data)
  return wait(data[idx])
}

export async function deleteUser(id) {
  store.saveUsers(store.getUsers().filter((u) => u.id !== id))
  return wait({ success: true })
}

// ---------------- Reports ----------------

export async function getReports() {
  return wait(store.getReports(INITIAL_REPORTS))
}

export async function addReport(report) {
  const data = store.getReports(INITIAL_REPORTS)
  const newReport = { ...report, id: `rep-${Date.now()}`, status: 'Pending', date: new Date().toISOString().slice(0, 10) }
  store.saveReports([newReport, ...data])
  return wait(newReport)
}

export async function updateReportStatus(id, status) {
  const data = store.getReports(INITIAL_REPORTS)
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) return failAfter('Report not found')
  data[idx] = { ...data[idx], status }
  store.saveReports(data)
  return wait(data[idx])
}

export async function deleteReport(id) {
  store.saveReports(store.getReports(INITIAL_REPORTS).filter((r) => r.id !== id))
  return wait({ success: true })
}

// ---------------- Notifications ----------------

export async function getNotifications() {
  return wait(store.getNotifications(INITIAL_NOTIFICATIONS))
}

export async function getNotificationsFor(userId) {
  const all = store.getNotifications(INITIAL_NOTIFICATIONS)
  return wait(all.filter((n) => n.userId === userId))
}

export async function addNotification(notification) {
  const data = store.getNotifications(INITIAL_NOTIFICATIONS)
  const newNotif = { ...notification, id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, read: false, time: new Date().toISOString() }
  store.saveNotifications([newNotif, ...data])
  return wait(newNotif)
}

export async function markNotificationRead(id) {
  const data = store.getNotifications(INITIAL_NOTIFICATIONS)
  const idx = data.findIndex((n) => n.id === id)
  if (idx !== -1) data[idx] = { ...data[idx], read: true }
  store.saveNotifications(data)
  return wait(data[idx])
}

export async function markAllNotificationsRead(userId) {
  const data = store.getNotifications(INITIAL_NOTIFICATIONS).map((n) => (n.userId === userId ? { ...n, read: true } : n))
  store.saveNotifications(data)
  return wait({ success: true })
}

// ---------------- Messages ----------------
// A conversation is identified by (resourceId + the pair of participant ids).

export function conversationKey(resourceId, userAId, userBId) {
  const pair = [userAId, userBId].sort().join('_')
  return `${resourceId}__${pair}`
}

export async function getConversationsFor(userId) {
  const localAll = store.getMessages(INITIAL_MESSAGES)
  let mine = localAll.filter((m) => m.senderId === userId || m.receiverId === userId)

  if (await isBackendOnline()) {
    try {
      const res = await fetch(`${API_BASE_URL}/messages?userId=${encodeURIComponent(userId)}`, {
        headers: authHeaders(),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          const map = new Map()
          mine.forEach((m) => map.set(m.id || `${m.sentAt}_${m.text}`, m))
          json.data.forEach((m) => map.set(m.id || `${m.sentAt}_${m.text}`, m))
          mine = Array.from(map.values())
        }
      }
    } catch {}
  }

  return wait(mine)
}

export async function sendMessage(message) {
  const data = store.getMessages(INITIAL_MESSAGES)
  const newMessage = {
    ...message,
    id: message.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sentAt: message.sentAt || new Date().toISOString(),
    read: false,
  }
  store.saveMessages([...data, newMessage])

  if (await isBackendOnline()) {
    try {
      fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newMessage),
      }).catch(() => {})
    } catch {}
  }

  return wait(newMessage)
}

// True if this id belongs to a real, registered account (user or admin)
// rather than a cosmetic catalog owner from the seed data.
export function isRegisteredAccount(id) {
  return store.getUsers().some((u) => u.id === id) || store.getAdmins().some((a) => a.id === id)
}

const CANNED_REPLIES = [
  'Yes, it is available — happy to arrange a handover whenever works for you.',
  'Thanks for reaching out! It should be free this week, let me know your preferred time.',
  "Sure, that works. I'll keep it ready for you.",
  'Yes it is still available, feel free to go ahead with the request.',
]

// The 100+ catalog resources are listed by cosmetic seed owners who can't
// actually log in. So that "owner replies" is still visible in the demo,
// a short canned reply is simulated for those conversations only. When a
// resource was added by a real, registered user, no auto-reply fires —
// that owner has to log in and reply for real, exactly like a real app.
export async function maybeSendAutoReply({ resourceId, resourceTitle, fromId, fromName, toId, toName }) {
  if (isRegisteredAccount(fromId)) return null
  const replyText = CANNED_REPLIES[Math.abs(resourceId.length + toId.length) % CANNED_REPLIES.length]
  const reply = await sendMessage({
    resourceId,
    resourceTitle,
    senderId: fromId,
    senderName: fromName,
    receiverId: toId,
    receiverName: toName,
    text: replyText,
  })
  await addNotification({
    userId: toId, type: 'message', title: 'New message',
    desc: `${fromName} replied about "${resourceTitle}".`,
  })
  return reply
}

// Helper to retrieve verified contact details (phone, email) for multi-channel communication (WhatsApp, Email, Phone)
export function getUserContactInfo(userId, userName = '', resource = null) {
  if (resource && resource.ownerPhone) {
    return {
      phone: resource.ownerPhone,
      email: resource.ownerEmail || (userName ? `${userName.toLowerCase().replace(/\s+/g, '.')}@shelfshare.com` : 'owner@shelfshare.com'),
      name: resource.ownerName || userName || 'Owner',
    }
  }

  const current = store.getCurrentUser()
  const localUsers = store.getUsers() || []
  let googleSaved = []
  try {
    const raw = localStorage.getItem('ss_google_accounts')
    if (raw) googleSaved = JSON.parse(raw)
  } catch {}

  const allUsers = [...localUsers, ...(current ? [current] : []), ...googleSaved, ...INITIAL_USERS]
  const found = allUsers.find(
    (u) =>
      (userId && u.id === userId) ||
      (userName && u.name?.toLowerCase().trim() === userName.toLowerCase().trim()) ||
      (userName && userName.toLowerCase().includes('ganga') && (u.email?.includes('ganga') || u.name?.toLowerCase().includes('ganga')))
  )

  const ownerPhone = (found && found.phone) || (current && (current.id === userId || current.name === userName) ? current.phone : null) || (found && found.phone) || '+91 98406 78901'
  const ownerEmail = (found && found.email) || (userName?.toLowerCase().includes('ganga') ? 'gangadevip06@gmail.com' : `${(userName || 'owner').toLowerCase().replace(/\s+/g, '.')}@shelfshare.com`)

  return {
    phone: ownerPhone,
    email: ownerEmail,
    name: (found && found.name) || userName || 'Owner',
  }
}
