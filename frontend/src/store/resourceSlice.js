// store/resourceSlice.js
// -----------------------------------------------------------------------
// Redux Toolkit slice holding the application-wide resource list plus
// wishlist and the current user's notifications, so any page can
// useSelector into shared data instead of prop-drilling. Async thunks
// call the mock api.js layer.
// -----------------------------------------------------------------------
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as api from '../services/api.js'
import * as store from '../utils/storage.js'

export const fetchResourcesThunk = createAsyncThunk('resources/fetchAll', async () => {
  return await api.getResources()
})

export const addResourceThunk = createAsyncThunk('resources/add', async (resource) => {
  return await api.addResource(resource)
})

export const updateResourceThunk = createAsyncThunk('resources/update', async ({ id, changes }) => {
  return await api.updateResource(id, changes)
})

export const deleteResourceThunk = createAsyncThunk('resources/delete', async (id) => {
  await api.deleteResource(id)
  return id
})

export const fetchNotificationsThunk = createAsyncThunk('notifications/fetchAll', async (userId) => {
  return await api.getNotificationsFor(userId)
})

export const markNotificationReadThunk = createAsyncThunk('notifications/markRead', async (id) => {
  await api.markNotificationRead(id)
  return id
})

export const markAllNotificationsReadThunk = createAsyncThunk('notifications/markAllRead', async (userId) => {
  await api.markAllNotificationsRead(userId)
  return userId
})

const resourceSlice = createSlice({
  name: 'resources',
  initialState: {
    items: [],
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
    wishlist: [], // loaded per-user via loadWishlistForUser once someone logs in — see App.jsx
    notifications: [],
  },
  reducers: {
    // Called with { id, userId }. Nothing is persisted for a guest
    // (userId undefined) — they're redirected to log in before this fires.
    toggleWishlist: (state, action) => {
      const { id, userId } = action.payload
      state.wishlist = state.wishlist.includes(id)
        ? state.wishlist.filter((w) => w !== id)
        : [...state.wishlist, id]
      store.saveWishlist(userId, state.wishlist)
    },
    // Dispatched whenever the logged-in user changes (login/logout) to
    // load THAT account's own saved wishlist — see App.jsx.
    loadWishlistForUser: (state, action) => {
      state.wishlist = action.payload || []
    },
    // Cheap, synchronous update used when the background image resolver
    // (services/imageService.js) finds a real photo for a resource —
    // swaps it in instantly without going through an async thunk.
    setResourceImage: (state, action) => {
      const { id, image } = action.payload
      const item = state.items.find((r) => r.id === id)
      if (item) item.image = image
    },
    clearNotificationsState: (state) => {
      state.notifications = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResourcesThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchResourcesThunk.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchResourcesThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
      .addCase(addResourceThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(updateResourceThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((r) => r.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
      })
      .addCase(deleteResourceThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload)
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.notifications = action.payload
      })
      .addCase(markNotificationReadThunk.fulfilled, (state, action) => {
        const notif = state.notifications.find((n) => n.id === action.payload)
        if (notif) notif.read = true
      })
      .addCase(markAllNotificationsReadThunk.fulfilled, (state) => {
        state.notifications.forEach((n) => { n.read = true })
      })
  },
})

export const { toggleWishlist, clearNotificationsState, setResourceImage, loadWishlistForUser } = resourceSlice.actions
export default resourceSlice.reducer
