export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const requestCookies = getRequestHeader(event, 'cookie') ?? ''
  const requestCsrfToken = getRequestHeader(event, 'x-csrf-token') ?? ''

  const response = await $fetch.raw(`${config.apiBaseUrl}/auth/logout`, {
    method: 'POST',
    headers: {
      cookie: requestCookies,
      ...(requestCsrfToken ? { 'x-csrf-token': requestCsrfToken } : {})
    },
    ignoreResponseError: true
  })

  setResponseStatus(event, response.status)

  const backendSetCookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : [])

  // Defensive cleanup: expire cookies we received from the browser.
  const cookieNames = requestCookies
    .split(';')
    .map((part) => part.trim().split('=')[0])
    .filter(Boolean)

  const expiredCookies = cookieNames.map((name) => `${name}=; Path=/; Max-Age=0; SameSite=Lax`)
  const mergedSetCookies = [...backendSetCookies, ...expiredCookies]

  if (mergedSetCookies.length > 0) {
    setResponseHeader(event, 'set-cookie', mergedSetCookies)
  }

  return response._data
})
