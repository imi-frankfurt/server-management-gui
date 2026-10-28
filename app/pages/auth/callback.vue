<template>
  <div class="callback-container">
    <div v-if="error" class="error">
      <h2>Login Failed</h2>
      <p>{{ error }}</p>
      <button @click="navigateTo('/login')">Back to Login</button>
    </div>
    <div v-else class="loading">
      <div class="spinner"></div>
      <h2>Processing login...</h2>
      <p>Please wait while we complete your authentication.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const error = ref('')
let exchanged = false
const { getCsrfToken } = useCsrf()

onMounted(async () => {
  try {
    if (exchanged) return
    exchanged = true

    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')

    if (!code) {
      error.value = 'No authorization code received from Keycloak. Please try logging in again.'
      return
    }

    const redirectUri = window.location.origin + '/auth/callback'

    const { setCsrfToken } = useCsrf()
    const response = await $fetch('/api/auth/exchange-code', {
      method: 'POST',
      headers: {
        ...(getCsrfToken() ? { 'X-CSRF-Token': getCsrfToken() } : {})
      },
      body: { code, redirect_uri: redirectUri }
    })
    
    if (response && response.csrf_token) {
      setCsrfToken(response.csrf_token)
    }

    await navigateTo('/dashboard')
  } catch (err) {
    console.error('Callback error:', err)
    error.value = err?.data?.detail || err.message || 'Failed to complete login'
  }
})
</script>

<style scoped>
.callback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.loading, .error {
  text-align: center;
  max-width: 400px;
}

.spinner {
  border: 4px solid var(--surface-raised);
  border-top: 4px solid #4a90e2;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #dc3545;
}

button {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>
