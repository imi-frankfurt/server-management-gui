<template>
  <div class="login-container">
    <div class="login-theme-toggle">
      <ThemeToggle />
    </div>
    <div class="login-card">
      <h1>Login</h1>
      <button @click="loginWithKeycloak" class="keycloak-btn">
        <span>🔐</span> Login with Keycloak
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const error = ref('')
const route = useRoute()

const loginWithKeycloak = async () => {
  try {
    const frontendCallbackUrl = window.location.origin + '/auth/callback'
    const forceReauth = route.query.force_reauth === '1'

    const response = await $fetch('/api/auth/login-url', {
      params: {
        frontend_callback_url: frontendCallbackUrl,
        ...(forceReauth ? { prompt: 'login', max_age: 0 } : {})
      }
    })
    
    // Some backend implementations ignore optional params, so enforce them here too.
    let authUrl = response.auth_url
    if (forceReauth) {
      const parsed = new URL(authUrl)
      parsed.searchParams.set('prompt', 'login')
      parsed.searchParams.set('max_age', '0')
      authUrl = parsed.toString()
    }

    window.location.href = authUrl
    
  } catch (err) {
    console.error('Login error:', err)
    error.value = 'Failed to initiate login. Please try again.'
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--bg);
}

.login-theme-toggle {
  position: fixed;
  top: 16px;
  right: 16px;
  width: 180px;
}

.login-card {
  background: var(--surface);
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
}

.keycloak-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin: 20px auto;
}

.keycloak-btn:hover {
  background-color: #357abd;
}

.error {
  color: #dc3545;
  margin-top: 10px;
}
</style>
