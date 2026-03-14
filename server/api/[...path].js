// Catch-all proxy: forwards /api/** → backend /api/**
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const pathParts = event.context.params?.path
  const subPath = Array.isArray(pathParts) ? pathParts.join('/') : (pathParts ?? '')
  const targetUrl = `${config.apiBaseUrl}/api/${subPath}`

  const method = getMethod(event)
  const query = getQuery(event)

  const fetchOptions = {
    method,
    params: Object.keys(query).length > 0 ? query : undefined,
    headers: {
      'content-type': getRequestHeader(event, 'content-type') ?? 'application/json',
      cookie: getRequestHeader(event, 'cookie') ?? ''
    },
    ignoreResponseError: true
  }

  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    fetchOptions.body = await readBody(event)
  }

  const response = await $fetch.raw(targetUrl, fetchOptions)

  setResponseStatus(event, response.status)

  const setCookie = response.headers.get('set-cookie')
  if (setCookie) {
    setResponseHeader(event, 'set-cookie', setCookie)
  }

  return response._data
})
