// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  compatibilityDate: '2026-03-09',
  
  runtimeConfig: {
    public: {
      apiBaseUrl: 'https://localhost:5000' // Override with NUXT_PUBLIC_API_BASE_URL env var
    }
  }
})
