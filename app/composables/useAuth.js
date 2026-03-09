export const useAuth = () => {
  const getToken = () => {
    if (process.client) {
      return localStorage.getItem('access_token')
    }
    return null
  }

  const isAuthenticated = () => {
    if (process.client) {
      const token = localStorage.getItem('access_token')
      const expiresAt = localStorage.getItem('token_expires_at')
      
      if (!token) return false
      if (expiresAt && Date.now() > parseInt(expiresAt)) {
        // Token expired
        logout()
        return false
      }
      
      return true
    }
    return false
  }

  const logout = () => {
    if (process.client) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('token_expires_at')
      navigateTo('/login')
    }
  }

  return {
    getToken,
    isAuthenticated,
    logout
  }
}