export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const response = await $fetch.raw(`${config.apiBaseUrl}/auth/exchange-code`, {
    method: 'POST',
    body,
    headers: {
      'content-type': 'application/json',
      cookie: getRequestHeader(event, 'cookie') ?? ''
    },
    ignoreResponseError: true
  })

  setResponseStatus(event, response.status)

  const setCookie = response.headers.get('set-cookie')
  if (setCookie) {
    setResponseHeader(event, 'set-cookie', setCookie)
  }

  return response._data
})
