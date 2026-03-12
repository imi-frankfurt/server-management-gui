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
const config = useRuntimeConfig()

onMounted(async () => {
  try {
    // Get current URL to extract query params
    const urlParams = new URLSearchParams(window.location.search)
    
    // Log all params for debugging
    console.log('Callback URL:', window.location.href)
    console.log('Query params:', Object.fromEntries(urlParams))
    
    // Extract authorization code
    const code = urlParams.get('code')
    
    if (!code) {
      error.value = 'No authorization code received from Keycloak. Please try logging in again.'
      console.error('Missing code parameter')
      return
    }
    
    console.log('Authorization code received:', code.substring(0, 20) + '...')
    
    const redirectUri = window.location.origin + '/auth/callback'
    console.log('Using redirect_uri:', redirectUri)
    
    // Exchange code for token
    console.log('Exchanging code for token...')
    const response = await $fetch(`${config.public.apiBaseUrl}/auth/exchange-code`, {
      method: 'POST',
      body: {
        code: code,
        redirect_uri: redirectUri
      }
    })
    
    console.log('Token received successfully')
    
    
    // Store tokens
    localStorage.setItem('access_token', response.access_token)
    
    if (response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token)
    }
    
    if (response.expires_in) {
      const expiresAt = Date.now() + (response.expires_in * 1000)
      localStorage.setItem('token_expires_at', expiresAt.toString())
    }
    
    console.log('Redirecting to dashboard...')
    
    // Redirect to dashboard
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
  border: 4px solid #f3f3f3;
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
