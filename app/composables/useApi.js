export const useApi = () => {
  const apiRequest = async (endpoint, options = {}) => {
    const { _retried = false, headers: optionHeaders = {}, ...fetchOptions } = options
    const { refreshToken, logout, sessionActive, getSession } = useAuth()
    const { getCsrfToken, syncFromCookie } = useCsrf()
    const method = String(fetchOptions.method || 'GET').toUpperCase()
    const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
    
    syncFromCookie()
    let csrfToken = getCsrfToken()

    if (unsafeMethods.includes(method) && !csrfToken) {
      await getSession().catch(() => null)
      csrfToken = getCsrfToken()
    }

    try {
      const response = await $fetch(endpoint, {
        ...fetchOptions,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...optionHeaders
          // We intentionally omit injecting X-CSRF-Token manually here
          // because the Nuxt proxy (e.g. [...path].js / refresh.post.js) 
          // will automatically extract it from the cookie and attach it.
        }
      })

      return response
    } catch (error) {
      if (error?.status === 403 || error?.statusCode === 403) {
        if (!_retried && unsafeMethods.includes(method)) {
          try {
            const session = await getSession()
            if (session || true) { // Explicitly retry even if getSession "fails" with 401, because the CSRF token might have updated
              const { syncFromCookie } = useCsrf()
              syncFromCookie()
              return await apiRequest(endpoint, {
                ...options,
                _retried: true
              })
            }
          } catch (e) {
            const { syncFromCookie } = useCsrf()
            syncFromCookie()
            return await apiRequest(endpoint, {
              ...options,
              _retried: true
            })
          }
        }
      }

      if (error?.status === 401 || error?.statusCode === 401) {
        if (!sessionActive.value) {
          await logout()
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
        throw error
      }
      throw error
    }
  }

  return {
    apiRequest
  }
}