<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <h2>IMI Portal</h2>
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
        :class="{ active: activeTab === 'blacklist' }"
        @click="handleNavClick('blacklist')"
        >
        <span>Blacklist</span>
      </div>
      
    </nav>



    <div class="sidebar-footer">
      <div class="user-profile">
        <div class="user-avatar">{{ userInitials }}</div>
        <div class="user-info">
          <p class="user-name">{{ userName }}</p>
          <p class="user-role">{{ userRoles }}</p>
        </div>
      </div>
      <button @click="handleLogout" class="logout-btn">
        Logout
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'

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
</script>

<style scoped>
.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.logo {
  display: flex;
  align-items: center;
}

.logo h2 {
  font-size: 20px;
  font-weight: 600;
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
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s;
  margin-bottom: 4px;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(255,255,255,0.1);
  color: white;
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.2);
  color: white;
  font-weight: 500;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 12px;
  background: rgba(255,255,255,0.05);
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
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  width: 100%;
  padding: 10px;
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
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
}
</style>
