export const useAuth = () => {
  const config = useRuntimeConfig()
  const directBase = config.public?.apiBaseUrl || ''
  
  const sessionUrl = directBase ? `${directBase}/auth/session` : '/api/auth/session'
  const refreshUrl = directBase ? `${directBase}/auth/refresh` : '/api/auth/refresh'
  const logoutUrl = directBase ? `${directBase}/auth/logout` : '/api/auth/logout'
  const fallbackSessionUrl = '/api/auth/session'

  let refreshPromise = null

  const getAuthHeaders = () => (import.meta.server ? useRequestHeaders(['cookie']) : {})

  const refreshToken = async () => {
    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      try {
        await $fetch(refreshUrl, {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include'
        })
        return true
      } catch (error) {
        console.warn('Refresh fehlgeschlagen:', error.status)
        return false
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  const fetchSession = async () => {
    const headers = getAuthHeaders()
    try {
      return await $fetch(sessionUrl, { headers, credentials: 'include' })
    } catch (error) {
      if (error.status === 401) {
        const success = await refreshToken()
        if (success) return await $fetch(sessionUrl, { headers, credentials: 'include' })
      }

      if (sessionUrl !== fallbackSessionUrl) {
        return await $fetch(fallbackSessionUrl, { headers, credentials: 'include' })
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
        headers: getAuthHeaders(),
        credentials: 'include'
      })
    } catch {
      // ignore
    } finally {
      navigateTo('/login?force_reauth=1')
    }
  }

  return {
    isAuthenticated,
    getSession,
    refreshToken,
    logout
  }
}
