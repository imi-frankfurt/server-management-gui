<template>
  <div class="login-container">
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
const config = useRuntimeConfig()

const loginWithKeycloak = async () => {
  try {
    const frontendCallbackUrl = window.location.origin + '/auth/callback'
    console.log('Frontend callback URL:', frontendCallbackUrl)
    
    // Get Keycloak login URL from backend
    const response = await $fetch(`${config.public.apiBaseUrl}/auth/login-url`, {
      params: {
        frontend_callback_url: frontendCallbackUrl
      }
    })
    
    console.log('Keycloak auth URL:', response.auth_url)
    
    // Redirect to Keycloak login page
    window.location.href = response.auth_url
    
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
  background-color: #f5f5f5;
}

.login-card {
  background: white;
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
