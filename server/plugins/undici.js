// Allow self-signed TLS certificates when calling the backend in development.
export default defineNitroPlugin(async () => {
  if (process.env.NODE_ENV !== 'production') {
    const { setGlobalDispatcher, Agent } = await import('undici')
    setGlobalDispatcher(new Agent({ connect: { rejectUnauthorized: false } }))
  }
})
