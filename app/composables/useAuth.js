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

  const refreshToken = async () => {
    if (!sessionActive.value) {
      return false
    }

    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      try {
        const { getCsrfToken, setCsrfToken } = useCsrf()

        const response = await $fetch(refreshUrl, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            ...(getCsrfToken() ? { 'X-CSRF-Token': getCsrfToken() } : {})
          },
          credentials: 'include'
        })
        
        if (response && response.csrf_token) {
          setCsrfToken(response.csrf_token)
        }

        return true
      } catch (error) {
        console.warn('Refresh fehlgeschlagen:', error.status)
        sessionActive.value = false
        clearCsrfToken()
        return false
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  const fetchSession = async () => {
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
      if (error.status === 401) {
        if (sessionActive.value) {
          const success = await refreshToken()
          if (success) {
            const session = await $fetch(sessionUrl, { headers, credentials: 'include' })
            if (session && session.csrf_token) {
              setCsrfToken(session.csrf_token)
            }
            sessionActive.value = Boolean(session && (session.authenticated || session.user))
            return session
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
