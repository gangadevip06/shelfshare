// utils/googleOAuth.js
// Provides Google Identity Services (GIS) integration for authentic Google Sign-In

const DEFAULT_GOOGLE_CLIENT_ID = '715819167597-sk0tgt9tsu05ckqicqt8oq8uv5potctc.apps.googleusercontent.com'

export function getGoogleClientId() {
  const envId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (envId && envId.trim() && !envId.includes('YOUR_GOOGLE_CLIENT_ID')) {
    return envId.trim()
  }
  return localStorage.getItem('ss_google_client_id') || DEFAULT_GOOGLE_CLIENT_ID
}

export function setGoogleClientId(clientId) {
  if (clientId && clientId.trim()) {
    localStorage.setItem('ss_google_client_id', clientId.trim())
  } else {
    localStorage.removeItem('ss_google_client_id')
  }
}

export function parseGoogleJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (err) {
    console.warn('Failed to parse Google JWT payload', err)
    return null
  }
}

export function initGoogleAuth(onSuccess, onError) {
  const clientId = getGoogleClientId()
  if (!clientId) return false
  if (!window.google?.accounts?.id) return false

  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response && response.credential) {
          const profile = parseGoogleJwt(response.credential)
          if (profile && profile.email) {
            onSuccess({
              credential: response.credential,
              email: profile.email,
              name: profile.name || profile.given_name || profile.email.split('@')[0],
              avatarUrl: profile.picture || null,
              googleId: profile.sub,
              provider: 'Google',
            })
          } else {
            if (onError) onError(new Error('Could not read user profile from Google credential.'))
          }
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    })
    return true
  } catch (err) {
    console.error('Failed to initialize Google Accounts', err)
    if (onError) onError(err)
    return false
  }
}

export function renderGoogleButton(container, options = {}) {
  if (!container || !window.google?.accounts?.id) return false
  const clientId = getGoogleClientId()
  if (!clientId) return false

  try {
    container.innerHTML = ''
    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      shape: 'rectangular',
      theme: 'outline',
      text: 'signin_with',
      size: 'large',
      logo_alignment: 'left',
      width: options.width || 320,
      ...options,
    })
    return true
  } catch (err) {
    console.warn('Google renderButton error', err)
    return false
  }
}

export function promptGoogleOneTap() {
  if (!window.google?.accounts?.id) return
  const clientId = getGoogleClientId()
  if (!clientId) return
  try {
    window.google.accounts.id.prompt()
  } catch (e) {
    // silent fallback
  }
}

export function signInWithGoogleDirect({ onSuccess, onError }) {
  const clientId = getGoogleClientId()
  if (!clientId) {
    if (onError) onError({ code: 'NO_CLIENT_ID', message: 'Google Client ID is not configured' })
    return false
  }

  // 1. Google Identity Services OAuth 2.0 Token Client (opens real Google Account Chooser popup)
  if (window.google?.accounts?.oauth2?.initTokenClient) {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              })
              const profile = await res.json()
              onSuccess({
                email: profile.email,
                name: profile.name || profile.given_name || profile.email.split('@')[0],
                avatarUrl: profile.picture || null,
                googleId: profile.sub,
                provider: 'Google',
              })
            } catch (err) {
              if (onError) onError(err)
            }
          } else if (tokenResponse?.error) {
            if (onError) onError(new Error(tokenResponse.error))
          }
        },
      })
      // prompt: 'select_account' opens the Google Account Chooser popup directly (Image 5)!
      client.requestAccessToken({ prompt: 'select_account' })
      return true
    } catch (err) {
      console.warn('initTokenClient error, attempting direct popup', err)
    }
  }

  // 2. Direct Google OAuth 2.0 Account Chooser Popup window (Image 5)
  const redirectUri = window.location.origin
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent('email profile openid')}&prompt=select_account`

  const width = 500
  const height = 620
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2
  window.open(authUrl, 'GoogleSignIn', `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`)
  return true
}
