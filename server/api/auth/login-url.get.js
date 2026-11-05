export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const response = await $fetch.raw(`${config.apiBaseUrl}/auth/login-url`, {
    params: query,
    ignoreResponseError: true
  })

  setResponseStatus(event, response.status)

  // The backend sets the PKCE verifier cookie here; it has to reach the browser.
  for (const cookie of response.headers.getSetCookie()) {
    appendResponseHeader(event, 'set-cookie', cookie)
  }

  return response._data
})
