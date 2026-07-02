import { useToast } from '~/composables/useToast'

export const useApi = () => {
  const apiRequest = async (endpoint, options = {}) => {
    const { _retried = false, headers: optionHeaders = {}, ...fetchOptions } = options
    const { refreshToken, logout, sessionActive, getSession } = useAuth()
    const { getCsrfToken, syncFromCookie } = useCsrf()
    const { toast } = useToast()
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
        }
      })

      return response
    } catch (error) {
      const status = error?.status ?? error?.statusCode

      if (status === 403) {
        if (!_retried && unsafeMethods.includes(method)) {
          try {
            const { syncFromCookie } = useCsrf()
            syncFromCookie()
            return await apiRequest(endpoint, { ...options, _retried: true })
          } catch (e) {
            throw e
          }
        }
      }

      if (status === 401) {
        if (!sessionActive.value) {
          await logout()
          throw error
        }
        if (!_retried) {
          const refreshed = await refreshToken()
          if (refreshed) {
            return await apiRequest(endpoint, { ...options, _retried: true })
          }
        }
        await logout()
        throw error
      }

      const messages = {
        403: 'You don\'t have permission to perform this action.',
        400: error?.data?.detail || 'Invalid request. Please check your input.',
        404: 'The requested resource was not found.',
        409: error?.data?.detail || 'This entry already exists.',
        422: 'Validation failed. Please check your input.',
        500: 'Something went wrong on our end. Please try again.',
        429: 'Too many requests. Please wait a moment and try again.',
      }

      const message = messages[status] ?? `Unexpected error (${status ?? 'unknown'}).`
      toast.error(message)

      throw error
    }
  }

  return { apiRequest }
}