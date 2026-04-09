// https://nuxt.com/docs/api/configuration/nuxt-config
const runtimeEnv = (globalThis as typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>
  }
}).process?.env ?? {}

export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  compatibilityDate: '2026-03-09',

  app: {
    head: {
      style: [
        {
          textContent: `
            html, body, #__nuxt {
              min-height: 100%;
              margin: 0;
              background: #0b1220;
              color: #e5e7eb;
            }
            body {
              overflow-x: hidden;
              color-scheme: dark;
            }
          `
        }
      ]
    }
  },

  devServer: {
    https: {
      key: './.cert/localhost+2-key.pem',
      cert: './.cert/localhost+2.pem'
    }
  },
  
  runtimeConfig: {
    // Server-only — never exposed to the browser
    apiBaseUrl: runtimeEnv.NUXT_API_BASE_URL || runtimeEnv.NUXT_PUBLIC_API_BASE_URL || 'https://localhost:5000',
    public: {
      // Optional direct browser base URL (used by auth/session when needed)
      apiBaseUrl: runtimeEnv.NUXT_PUBLIC_API_BASE_URL || ''
    }
  }
})
