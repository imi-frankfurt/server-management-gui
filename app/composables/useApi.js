export const useApi = () => {
  const apiRequest = async (endpoint, options = {}) => {
    try {
      const response = await $fetch(endpoint, {
        ...options,
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
        return
      }
      throw error
    }
  }

  return {
    apiRequest
  }
}