export const useApi = () => {
  const config = useRuntimeConfig()

  const apiRequest = async (endpoint, options = {}) => {
    try {
      const response = await $fetch(`${config.public.apiBaseUrl}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      return response
    } catch (error) {
      if (error?.status === 401 || error?.statusCode === 401) {
        const { logout } = useAuth()
        await logout()
        throw new Error('Session expired. Please login again.')
      }
      throw error
    }
  }

  return {
    apiRequest
  }
}