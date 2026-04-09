export const useApi = () => {
  const apiRequest = async (endpoint, options = {}) => {
    const { _retried = false, headers: optionHeaders = {}, ...fetchOptions } = options
    const { refreshToken, logout, sessionActive } = useAuth()
    const { getCsrfToken } = useCsrf()
    const method = String(fetchOptions.method || 'GET').toUpperCase()
    const csrfToken = getCsrfToken()
    const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE']

    try {
      const response = await $fetch(endpoint, {
        ...fetchOptions,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...optionHeaders,
          ...(unsafeMethods.includes(method) && csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
        }
      })

      return response
    } catch (error) {
      if (error?.status === 401 || error?.statusCode === 401) {
        if (!sessionActive.value) {
          throw error
        }

        if (!_retried) {
          const refreshed = await refreshToken()
          if (refreshed) {
            return await apiRequest(endpoint, {
              ...options,
              _retried: true
            })
          }
        }

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