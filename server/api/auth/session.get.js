export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const response = await $fetch.raw(`${config.apiBaseUrl}/auth/session`, {
    headers: {
      cookie: getRequestHeader(event, 'cookie') ?? ''
    },
    ignoreResponseError: true
  })

  setResponseStatus(event, response.status)

  const setCookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : [])

  if (setCookies.length > 0) {
    setResponseHeader(event, 'set-cookie', setCookies)
  }

  return response._data
})
