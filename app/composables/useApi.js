export const useApi = () => {
  const { getToken } = useAuth()
  const config = useRuntimeConfig()

  const apiRequest = async (endpoint, options = {}) => {
    const token = getToken()

    try {
      const response = await $fetch(`${config.public.apiBaseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      return response
    } catch (error) {
      // Handle 401 Unauthorized
      if (error?.status === 401 || error?.statusCode === 401) {
        const { logout } = useAuth()
        logout()
        throw new Error('Session expired. Please login again.')
      }
      throw error
    }
  }

  return {
    apiRequest
  }
}