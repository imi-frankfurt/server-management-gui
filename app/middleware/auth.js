export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated } = useAuth()
  const ok = await isAuthenticated()

  if (!ok) {
    return navigateTo('/login')
  }
})

export const useAuth = () => {
  const config = useRuntimeConfig()

  const getToken = () => null

  const isAuthenticated = async () => {
    try {
      await $fetch(`${config.public.apiBaseUrl}/auth/session`, {
        credentials: 'include'
      })
      return true
    } catch (error) {
      return false
    }
  }

  const logout = async () => {
    try {
      await $fetch(`${config.public.apiBaseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      // ignore network/logout errors, still navigate away
    } finally {
      return navigateTo('/login')
    }
  }

  return {
    getToken,
    isAuthenticated,
    logout
  }
}