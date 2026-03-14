export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  return await $fetch(`${config.apiBaseUrl}/auth/login-url`, { params: query })
})
