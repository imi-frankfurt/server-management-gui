export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const requestCookies = getRequestHeader(event, 'cookie') ?? ''
  const requestBody = await readBody(event).catch(() => undefined)

  const refreshPaths = [
    '/auth/refresh',
  ]

  let response = null

  for (const refreshPath of refreshPaths) {
    const url = `${config.apiBaseUrl}${refreshPath}`

    if (!requestCookies.includes('refresh_token')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Nicht angemeldet: Kein Refresh-Token vorhanden.'
      })
    } 
    const currentResponse = await $fetch.raw(url, {
      method: 'POST',
      body: requestBody,
      headers: {
        'content-type': getRequestHeader(event, 'content-type') ?? 'application/json',
        cookie: requestCookies
      },
      ignoreResponseError: true
    })

    // Debug log: status, headers, and body
    console.log('[refresh-proxy] Request:', url)
    console.log('[refresh-proxy] Status:', currentResponse.status)
    console.log('[refresh-proxy] Headers:', Object.fromEntries(currentResponse.headers.entries()))
    try {
      const debugBody = typeof currentResponse._data === 'object' ? JSON.stringify(currentResponse._data) : String(currentResponse._data)
      console.log('[refresh-proxy] Body:', debugBody)
    } catch (e) {
      console.log('[refresh-proxy] Body: <unserializable>')
    }

    response = currentResponse

    if (currentResponse.status !== 404) {
      break
    }
  }

  if (!response) {
    setResponseStatus(event, 500)
    return { detail: 'Refresh proxy failed to contact backend' }
  }

  setResponseStatus(event, response.status)

  const setCookies = response.headers.getSetCookie()
  console.log('Vom Backend erhalten:', setCookies)

  if (setCookies && setCookies.length > 0) {
    setCookies.forEach(cookie => {
      appendResponseHeader(event, 'set-cookie', cookie)
    })
  }

  return response._data
})
