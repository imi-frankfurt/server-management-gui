export default defineNuxtPlugin(() => {
  const { refreshToken, getSession, sessionActive } = useAuth()

  const refreshIntervalMs = 4 * 60 * 1000

  const refreshSilently = async () => {
    if (!sessionActive.value) return

    try {
      await refreshToken()
    } catch {
      // Ignore here; guarded requests still handle logout flow when needed.
    }
  }

  let intervalId = null

  const startRefreshLoop = () => {
    if (intervalId) return

    intervalId = window.setInterval(() => {
      refreshSilently()
    }, refreshIntervalMs)
  }

  const stopRefreshLoop = () => {
    if (!intervalId) return

    window.clearInterval(intervalId)
    intervalId = null
  }

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

  onNuxtReady(async () => {
    await getSession()

    if (sessionActive.value) {
      refreshSilently()
      startRefreshLoop()
    }
  })

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      stopRefreshLoop()
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    })
  }
})
