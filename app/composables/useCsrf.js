export const useCsrf = () => {
  const csrfToken = useCookie('csrf_token', {
    sameSite: 'lax',
    path: '/'
  })

  const setCsrfToken = (token) => {
    csrfToken.value = token || null
  }

  const getCsrfToken = () => csrfToken.value || ''

  const clearCsrfToken = () => {
    csrfToken.value = null
  }

  const syncFromCookie = () => {
    if (import.meta.client) {
      const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/)
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1])
        if (decoded !== csrfToken.value) {
          csrfToken.value = decoded
        }
        return decoded
      }
    }
    return getCsrfToken()
  }

  return {
    csrfToken,
    setCsrfToken,
    getCsrfToken,
    clearCsrfToken,
    syncFromCookie
  }
}