// https://nuxt.com/docs/api/configuration/nuxt-config
const runtimeEnv = (globalThis as typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>
  }
}).process?.env ?? {}

const isProduction = runtimeEnv.NODE_ENV === 'production'
const connectSrc = ["'self'", 'ws:', 'wss:']

if (runtimeEnv.NUXT_PUBLIC_API_BASE_URL) {
  connectSrc.push(runtimeEnv.NUXT_PUBLIC_API_BASE_URL)
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}`,
  "worker-src 'self' blob:",
  `connect-src ${connectSrc.join(' ')}`
].join('; ')

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
  icon: {
    serverBundle: 'remote' 
  },

  devServer: {
    https: {
      key: './.cert/localhost+2-key.pem',
      cert: './.cert/localhost+2.pem'
    }
  },

  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'Content-Security-Policy': contentSecurityPolicy
        }
      }
    }
  },

  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ]
    }
  },
  
  runtimeConfig: {
    // Server-only — never exposed to the browser
    apiBaseUrl: runtimeEnv.NUXT_API_BASE_URL || runtimeEnv.NUXT_PUBLIC_API_BASE_URL || 'https://localhost:5000',
    public: {
      // Optional direct browser base URL (used by auth/session when needed)
      apiBaseUrl: runtimeEnv.NUXT_PUBLIC_API_BASE_URL || '',
      // Keycloak base URL for account management
      keycloakBaseUrl: runtimeEnv.KEYCLOAK_BASE_URL || 'https://login.imi-frankfurt.de/realms/imi/account'
    }
  }
})
