export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const response = await $fetch.raw(`${config.apiBaseUrl}/auth/session`, {
    headers: {
      cookie: getRequestHeader(event, 'cookie') ?? ''
    },
    ignoreResponseError: true
  })

  setResponseStatus(event, response.status)

  return response._data
})
