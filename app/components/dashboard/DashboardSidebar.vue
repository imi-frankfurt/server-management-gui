<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <img src="/logo_dark.svg" alt="IMI Server Verwaltung" class="logo-mark logo-dark" />
        <img src="/logo_light.svg" alt="IMI Server Verwaltung" class="logo-mark logo-light" />
        <h2>IMI Server Verwaltung</h2>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div 
        class="nav-item" 
        :class="{ active: activeTab === 'dashboard' }"
        @click="handleNavClick('dashboard')"
      >
        <span>Dashboard</span>
      </div>

      <div 
        class="nav-item"
        :class="{ active: activeTab === 'users' }"
        @click="handleNavClick('users')"
      >
        <span>Users</span>
      </div>

      <div
        class="nav-item"
        :class="{ active: activeTab === 'logs' }"
        v-if="isAdmin"
        @click="handleNavClick('logs')"
      >
        <span>Logs</span>
      </div>

      <div
        class="nav-item"
        :class="{ active: activeTab === 'ansible_logs' }"
        v-if="isAdmin"
        @click="handleNavClick('ansible_logs')"
      >
        <span>Ansible Logs</span>
      </div>
    </nav>



    <div class="sidebar-footer">
      <ThemeToggle class="theme-toggle-row" />
      <div class="user-profile">
        <div class="user-avatar">{{ userInitials }}</div>
        <div class="user-info">
          <p class="user-name">{{ userName }}</p>
          <p class="user-role">{{ userRoles }}</p>
        </div>
        <a v-if="keycloakAccountUrl" :href="keycloakAccountUrl" target="_blank" class="keycloak-account-link" title="Keycloak Account Settings">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </a>
      </div>
      <button @click="handleLogout" class="logout-btn">
        Logout
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRuntimeConfig } from '#imports'
import { useApi } from '~/composables/useApi'

const props = defineProps({
  userName: {
    type: String,
    required: true
  },
  userRoles: {
    type: String,
    required: true
  },
  userInitials: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['logout', 'navigate'])

const activeTab = ref('dashboard')

const handleNavClick = (tab) => {
  activeTab.value = tab
  emit('navigate', tab)
}

const handleLogout = () => {
  emit('logout')
}

const keycloakAccountUrl = ref('')
onMounted(async () => {
  try {
    const { apiRequest } = useApi()
    const loginData = await apiRequest('/api/auth/login-url')
    
    if (loginData && loginData.auth_url) {
      const authUrl = loginData.auth_url
      
      // Parse the base URL from auth_url until /protocol
      const protocolIndex = authUrl.indexOf('/protocol')
      if (protocolIndex !== -1) {
        const baseUrl = authUrl.substring(0, protocolIndex)
        keycloakAccountUrl.value = `${baseUrl}/account`
        // console.log('Derived Keycloak account URL:', keycloakAccountUrl.value)
      }
    }
  } catch (error) {
    // Fallback to default if anything goes wrong
    console.warn('Could not derive Keycloak account URL, using default', error)
    const config = useRuntimeConfig()
    const keycloakBaseUrl = config.public.keycloakBaseUrl
    keycloakAccountUrl.value = `${keycloakBaseUrl}`
  }
})
</script>

<style scoped>
.sidebar {
  width: 260px;
  background: linear-gradient(180deg, var(--sidebar-from) 0%, var(--sidebar-to) 100%);
  border-right: 1px solid var(--sidebar-border);
  color: var(--text);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid var(--overlay-2);
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.logo-mark {
  width: 100%;
  max-height: 70px;
  object-fit: contain;
  background: transparent;
  padding: 0;
}

.logo-light,
:root.light .logo-dark {
  display: none;
}

:root.light .logo-light {
  display: block;
}

.logo h2 {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin: 0;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  color: var(--text-subtle);
  text-decoration: none;
  transition: all 0.2s;
  margin-bottom: 4px;
  cursor: pointer;
}

.nav-item:hover {
  background: var(--overlay-2);
  color: var(--text);
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.2);
  color: var(--text);
  font-weight: 500;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--overlay-2);
}

.theme-toggle-row {
  margin-bottom: 12px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 12px;
  background: var(--overlay-1);
  border-radius: 8px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.keycloak-account-link {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  color: var(--text-muted);
  transition: all 0.2s;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid transparent;
}

.keycloak-account-link:hover {
  color: var(--text);
  background: var(--overlay-2);
  border-color: var(--overlay-3);
  transform: scale(1.1);
}

.logout-btn {
  width: 100%;
  padding: 10px;
  background: rgba(239, 68, 68, 0.2);
  color: var(--red-text);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.3);
}

@media (max-width: 768px) {
  .sidebar {
    width: 70px;
  }

  .sidebar-header h2,
  .nav-item span,
  .user-info,
  .logout-btn {
    display: none;
  }

  .logo {
    justify-content: center;
  }

  .logo-mark {
    width: 100%;
    padding: 4px;
  }
}
</style>
