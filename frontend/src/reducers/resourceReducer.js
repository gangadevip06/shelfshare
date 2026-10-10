// reducers/resourceReducer.js
// -----------------------------------------------------------------------
// Demonstrates useReducer for local, page-level resource/request state
// (e.g. inside MyResources.jsx / MyRequests.jsx), separate from the
// Redux slice which holds the app-wide resource list.
// -----------------------------------------------------------------------

export const initialResourceState = {
  resources: [],
  requests: [],
}

export function resourceReducer(state, action) {
  switch (action.type) {
    case 'SET_RESOURCES':
      return { ...state, resources: action.payload }

    case 'ADD_RESOURCE':
      return { ...state, resources: [action.payload, ...state.resources] }

    case 'UPDATE_RESOURCE':
      return {
        ...state,
        resources: state.resources.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload.changes } : r
        ),
      }

    case 'DELETE_RESOURCE':
      return { ...state, resources: state.resources.filter((r) => r.id !== action.payload) }

    case 'SET_REQUESTS':
      return { ...state, requests: action.payload }

    case 'ADD_REQUEST':
      return { ...state, requests: [action.payload, ...state.requests] }

    case 'UPDATE_REQUEST':
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.payload.id ? { ...r, ...(action.payload.changes || { status: action.payload.status }) } : r
        ),
      }

    case 'CANCEL_REQUEST':
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.payload ? { ...r, status: 'Cancelled' } : r
        ),
      }

    default:
      return state
  }
}
