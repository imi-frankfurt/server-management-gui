export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const requestCsrfToken = getRequestHeader(event, 'x-csrf-token') ?? ''

  const response = await $fetch.raw(`${config.apiBaseUrl}/auth/exchange-code`, {
    method: 'POST',
    body,
    headers: {
      'content-type': 'application/json',
      cookie: getRequestHeader(event, 'cookie') ?? '',
      ...(requestCsrfToken ? { 'x-csrf-token': requestCsrfToken } : {})
    },
    ignoreResponseError: true
  })

  setResponseStatus(event, response.status)

  const setCookies = response.headers.getSetCookie()
  
  if (setCookies && setCookies.length > 0) {
    for (const cookie of setCookies) {
      appendResponseHeader(event, 'set-cookie', cookie)
    }
  }

  return response._data
})