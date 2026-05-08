export const useAuth = () => {
  const { clearCsrfToken } = useCsrf()

  // Always go through Nuxt BFF routes to keep cookies/CSRF handling centralized.
  const sessionUrl = '/api/auth/session'
  const refreshUrl = '/api/auth/refresh'
  const logoutUrl = '/api/auth/logout'
  const fallbackSessionUrl = '/api/auth/session'

  let refreshPromise = null
  const sessionActive = useState('auth-session-active', () => false)

  const getAuthHeaders = () => (import.meta.server ? useRequestHeaders(['cookie']) : {})

  const refreshToken = async (retryOn403 = true) => {
    if (!sessionActive.value) {
      return false
    }

    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      try {
        const { getCsrfToken, setCsrfToken, syncFromCookie } = useCsrf()
        const currentCsrf = syncFromCookie()

        const response = await $fetch(refreshUrl, {
          method: 'POST',
          headers: {
            ...getAuthHeaders()
          },
          credentials: 'include'
        })
        
        if (response && response.csrf_token) {
          setCsrfToken(response.csrf_token)
        }

        return true
      } catch (error) {
        if (error.status === 403 && retryOn403) {
          console.log('[Auth] 403 CSRF detected, fetching clean session...')
          const headers = getAuthHeaders()
          const { setCsrfToken, syncFromCookie } = useCsrf()
          try {
            // First we try to grab a fresh token via session
            const sessionData = await $fetch(sessionUrl, { headers, credentials: 'include' })
            if (sessionData && sessionData.csrf_token) {
              setCsrfToken(sessionData.csrf_token)
            }
          } catch (e) {
            if (e.data && e.data.csrf_token) {
              setCsrfToken(e.data.csrf_token)
            }
          }
          
          // Small delay to let browser process any Set-Cookie headers
          await new Promise(resolve => setTimeout(resolve, 100))
          
          syncFromCookie()

          refreshPromise = null
          return await refreshToken(false) // retry once without 403 safety net
        }
        console.warn('Refresh fehlgeschlagen:', error.status)
        sessionActive.value = false
        const { clearCsrfToken } = useCsrf()
        clearCsrfToken()
        return false
      } finally {
        if (retryOn403) {
          refreshPromise = null
        }
      }
    })()

    return refreshPromise
  }

  const fetchSession = async (retryOn401 = true) => {
    const headers = getAuthHeaders()
    const { setCsrfToken } = useCsrf()
    try {
      const session = await $fetch(sessionUrl, { headers, credentials: 'include' })

      if (session && session.csrf_token) {
        setCsrfToken(session.csrf_token)
      }

      sessionActive.value = Boolean(session && (session.authenticated || session.user))
      return session
    } catch (error) {
      if (error.status === 401 && retryOn401) {
        if (sessionActive.value) {
          const success = await refreshToken()
          if (success) {
            return await fetchSession(false)
          }
        }

        sessionActive.value = false
        clearCsrfToken()
        return null
      }

      if (sessionUrl !== fallbackSessionUrl) {
        const session = await $fetch(fallbackSessionUrl, { headers, credentials: 'include' })
        sessionActive.value = Boolean(session && (session.authenticated || session.user))
        return session
      }
      throw error
    }
  }

  const isAuthenticated = async () => {
    try {
      const session = await fetchSession()
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
    try {
      await $fetch(logoutUrl, {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        },
        credentials: 'include'
      })
    } catch {
      // ignore
    } finally {
      sessionActive.value = false
      clearCsrfToken()
      navigateTo('/login?force_reauth=1')
    }
  }

  return {
    isAuthenticated,
    getSession,
    refreshToken,
    logout,
    sessionActive
  }
}
