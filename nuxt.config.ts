// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  compatibilityDate: '2026-03-09',

  devServer: {
    https: {
      key: './.cert/localhost+2-key.pem',
      cert: './.cert/localhost+2.pem'
    }
  },
  
  runtimeConfig: {
    // Server-only — never exposed to the browser
    apiBaseUrl: 'https://localhost:5000', // Override with NUXT_API_BASE_URL env var
    public: {
      // Optional direct browser base URL (used by auth/session when needed)
      apiBaseUrl: '' // Override with NUXT_PUBLIC_API_BASE_URL env var
    }
  }
})
