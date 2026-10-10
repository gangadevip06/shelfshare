// store/store.js
// Redux store configuration (Redux Toolkit).
import { configureStore } from '@reduxjs/toolkit'
import resourceReducer from './resourceSlice.js'

export const store = configureStore({
  reducer: {
    resources: resourceReducer,
  },
})
