export const useAuth = () => {
  const isAuthenticated = async () => {
    try {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : {}
      await $fetch('/api/auth/session', { headers })
      return true
    } catch {
      return false
    }
  }

  const getSession = async () => {
    try {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : {}
      return await $fetch('/api/auth/session', { headers })
    } catch {
      return null
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
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