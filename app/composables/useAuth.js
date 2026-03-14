export const useAuth = () => {
  const config = useRuntimeConfig()
  const directBase = config.public?.apiBaseUrl || ''
  const sessionUrl = directBase ? `${directBase}/auth/session` : '/api/auth/session'
  const fallbackSessionUrl = '/api/auth/session'
  const logoutUrl = directBase ? `${directBase}/auth/logout` : '/api/auth/logout'

  const fetchSession = async () => {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) : {}

    try {
      return await $fetch(sessionUrl, {
        headers,
        credentials: 'include'
      })
    } catch {
      if (sessionUrl !== fallbackSessionUrl) {
        return await $fetch(fallbackSessionUrl, {
          headers,
          credentials: 'include'
        })
      }
      throw new Error('Session fetch failed')
    }
  }

  const isAuthenticated = async () => {
    try {
      await fetchSession()
      return true
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
    logout
  }
}