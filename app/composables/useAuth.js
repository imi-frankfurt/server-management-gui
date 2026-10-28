const getRefreshPromise = () => import.meta.client ? window._authRefreshPromise : null
const setRefreshPromise = (val) => { if (import.meta.client) window._authRefreshPromise = val }

export const useAuth = () => {
  const { clearCsrfToken } = useCsrf()

  // Always go through Nuxt BFF routes to keep cookies/CSRF handling centralized.
  const sessionUrl = '/api/auth/session'
  const refreshUrl = '/api/auth/refresh'
  const logoutUrl = '/api/auth/logout'
  const fallbackSessionUrl = '/api/auth/session'

  const sessionActive = useState('auth-session-active', () => false)
  // Last authenticated session, shared between middleware, pages and plugins
  // (and transferred from SSR to the client) so it is fetched only once per load.
  const cachedSession = useState('auth-session', () => null)

  const setSession = (session) => {
    sessionActive.value = Boolean(session && (session.authenticated || session.user))
    if (sessionActive.value) {
      // The CSRF token lives in its cookie; keep it out of the SSR payload.
      const { csrf_token, ...rest } = session
      cachedSession.value = rest
    } else {
      cachedSession.value = null
    }
  }

  const clearSession = () => {
    sessionActive.value = false
    cachedSession.value = null
  }

  const getAuthHeaders = () => (import.meta.server ? useRequestHeaders(['cookie']) : {})

  const refreshToken = async () => {
    if (!sessionActive.value) {
      return false
    }

    const currentPromise = getRefreshPromise()
    if (currentPromise) return currentPromise

    const newPromise = (async () => {
      try {
        const { getCsrfToken, setCsrfToken, syncFromCookie } = useCsrf()

        const response = await $fetch(refreshUrl, {
          method: 'POST',
          headers: {
            ...getAuthHeaders()
          },
          credentials: 'include'
        })
        
        syncFromCookie()

        if (response && response.csrf_token) {
          setCsrfToken(response.csrf_token)
        }

        return true
      } catch (error) {
        console.warn('Refresh fehlgeschlagen:', error.status)
        clearSession()
        clearCsrfToken()
        return false
      } finally {
        setRefreshPromise(null)
      }
    })()

    setRefreshPromise(newPromise)
    return newPromise
  }

  const fetchSession = async () => {
    const headers = getAuthHeaders()
    const { setCsrfToken, syncFromCookie } = useCsrf()
    try {
      const session = await $fetch(sessionUrl, { headers, credentials: 'include' })

      syncFromCookie()

      if (session && session.csrf_token) {
        setCsrfToken(session.csrf_token)
      }

      setSession(session)
      return session
    } catch (error) {
      if (error.status === 401) {
        if (sessionActive.value) {
          const success = await refreshToken()
          if (success) {
            const session = await $fetch(sessionUrl, { headers, credentials: 'include' })
            
            syncFromCookie()

            if (session && session.csrf_token) {
              setCsrfToken(session.csrf_token)
            }
            setSession(session)
            return session
          }
        }

        clearSession()
        clearCsrfToken()
        return null
      }

      if (sessionUrl !== fallbackSessionUrl) {
        const session = await $fetch(fallbackSessionUrl, { headers, credentials: 'include' })
        setSession(session)
        return session
      }
      throw error
    }
  }

  // Returns the cached session if one is known, otherwise fetches it.
  const ensureSession = async () => {
    if (sessionActive.value && cachedSession.value) {
      return cachedSession.value
    }
    return getSession()
  }

  const isAuthenticated = async () => {
    try {
      const session = await ensureSession()
      return !!(session && (session.authenticated || session.user))
    } catch {
      return false
    }
  }

  const getSession = async () => {
    try {
      return await fetchSession()
    } catch {
      return null
    }
  }

  const logout = async () => {
    const { getCsrfToken } = useCsrf()

    try {
      await $fetch(logoutUrl, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          ...(getCsrfToken() ? { 'X-CSRF-Token': getCsrfToken() } : {})
        },
        credentials: 'include'
      })
    } catch {
      // ignore
    } finally {
      clearSession()
      clearCsrfToken()
      navigateTo('/login?force_reauth=1')
    }
  }

  return {
    isAuthenticated,
    getSession,
    ensureSession,
    refreshToken,
    logout,
    sessionActive
  }
}
