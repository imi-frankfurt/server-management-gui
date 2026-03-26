export default defineNuxtPlugin(() => {
  const { refreshToken } = useAuth()

  const refreshIntervalMs = 4 * 60 * 1000

  const refreshSilently = async () => {
    try {
      await refreshToken()
    } catch {
      // Ignore here; guarded requests still handle logout flow when needed.
    }
  }

  const intervalId = window.setInterval(() => {
    refreshSilently()
  }, refreshIntervalMs)

  const onFocus = () => {
    refreshSilently()
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      refreshSilently()
    }
  }

  window.addEventListener('focus', onFocus)
  document.addEventListener('visibilitychange', onVisibilityChange)

  onNuxtReady(() => {
    refreshSilently()
  })

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    })
  }
})
