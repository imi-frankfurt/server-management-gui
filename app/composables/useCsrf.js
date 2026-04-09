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

  return {
    csrfToken,
    setCsrfToken,
    getCsrfToken,
    clearCsrfToken
  }
}