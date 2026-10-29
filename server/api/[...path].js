// Catch-all proxy: forwards /api/** → backend /api/**

// Rejects segments that would let the target URL escape /api/ once the URL
// is normalized, e.g. "..", "%2e%2e" or an encoded slash.
const isSafeSegment = (segment) => {
  let decoded
  try {
    decoded = decodeURIComponent(segment)
  } catch {
    return false
  }
  return decoded !== '.' && decoded !== '..' && !decoded.includes('/') && !decoded.includes('\\')
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const pathParts = event.context.params?.path
  const subPath = Array.isArray(pathParts) ? pathParts.join('/') : (pathParts ?? '')

  if (!subPath.split('/').every(isSafeSegment)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }

  const apiPrefix = new URL(`${config.apiBaseUrl}/api/`).pathname
  const targetUrl = `${config.apiBaseUrl}/api/${subPath}`

  if (!new URL(targetUrl).pathname.startsWith(apiPrefix)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }

  const method = getMethod(event)
  const query = getQuery(event)
  const contentType = getRequestHeader(event, 'content-type') ?? ''
  // The browser must send the CSRF header itself; never derive it from the cookie.
  const csrfToken = getRequestHeader(event, 'x-csrf-token') ?? ''

  const fetchOptions = {
    method,
    params: Object.keys(query).length > 0 ? query : undefined,
    headers: {
      'content-type': 'application/json',
      cookie: getRequestHeader(event, 'cookie') ?? '',
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
    },
    ignoreResponseError: true
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const rawBody = await readRawBody(event)

    if (rawBody) {
      if (!/^application\/json\s*(;|$)/i.test(contentType)) {
        throw createError({ statusCode: 415, statusMessage: 'Unsupported Media Type: only application/json is accepted' })
      }
      fetchOptions.body = rawBody
    }
  }

  const response = await $fetch.raw(targetUrl, fetchOptions)

  setResponseStatus(event, response.status)

  const setCookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : [])

  if (setCookies.length > 0) {
    setResponseHeader(event, 'set-cookie', setCookies)
  }

  return response._data
})
