export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated } = useAuth()
  const ok = await isAuthenticated()

  if (!ok) {
    return navigateTo('/login')
  }
})