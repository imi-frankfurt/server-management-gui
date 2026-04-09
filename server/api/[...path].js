// Catch-all proxy: forwards /api/** → backend /api/**
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const pathParts = event.context.params?.path
  const subPath = Array.isArray(pathParts) ? pathParts.join('/') : (pathParts ?? '')
  const targetUrl = `${config.apiBaseUrl}/api/${subPath}`

  const method = getMethod(event)
  const query = getQuery(event)
  const csrfToken = getRequestHeader(event, 'x-csrf-token') ?? ''

  const fetchOptions = {
    method,
    params: Object.keys(query).length > 0 ? query : undefined,
    headers: {
      'content-type': getRequestHeader(event, 'content-type') ?? 'application/json',
      cookie: getRequestHeader(event, 'cookie') ?? '',
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
    },
    ignoreResponseError: true
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    fetchOptions.body = await readBody(event)
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
