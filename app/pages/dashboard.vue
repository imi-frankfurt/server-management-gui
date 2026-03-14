<template>
  <div class="dashboard-container">
    <DashboardSidebar
      :user-name="userName"
      :user-roles="userRoles"
      :user-initials="userInitials"
      @logout="handleLogout"
      @navigate="handleNavigation"
    />

    <main class="main-content">
      <header class="dashboard-header">
        <div class="header-left">
          <h1>{{ activeTab === 'users' ? 'Users' : 'Dashboard' }}</h1>
          <p class="subtitle">Welcome back, {{ userName }}</p>
        </div>
      </header>

      <DashboardStats v-if="activeTab === 'dashboard'"
        :total-servers="servers?.length || 0"
        :active-servers="activeServers"
        :total-users="0"
        :access-level="userRoles"
      />

      <DashboardStats v-if="activeTab === 'users'"
        :total-servers="users?.length || 0"
        :active-servers="users?.filter(u => u.pubKey && u.pubKey.length > 0).length || 0"
        :total-users="users?.reduce((sum, u) => sum + (u.pubKey?.length || 0), 0)"
        :access-level="userRoles"
        label1="Total Users"
        label2="Users with Keys"
        label3="Total Public Keys"
      />

      <DashboardStats v-if="activeTab === 'blacklist'"
        :total-servers="blacklists?.filter(b => b.username && b.username.length > 0).length || 0"
        :active-servers="blacklists?.filter(b => b.servers && b.servers.length > 0).length || 0"
        :total-users="0"
        :access-level="userRoles"
        label1="Total Blacklisted Users"
        label2="Total Blacklisted Servers"
        label3=""
        :show-card3="false"
        > </DashboardStats>

      <ServerTable v-if="activeTab === 'dashboard'"
        :servers="servers"
        :loading="loading"
        :error="error"
        :is-admin="isAdmin"
        @add-server="showAddServerModal = true"
        @view-server="viewServer"
        @edit-server="editServer"
        @delete-server="deleteServer"
        @retry="fetchServers"
      />

      <BlackListTable v-if="activeTab === 'blacklist'"
        :blacklists="blacklists"
        :loading="loading"
        :error="error"
        @retry="fetchBlacklist"
      />



      <UserTable v-if="activeTab === 'users'"
        :users="users"
        :loading="usersLoading"
        :error="usersError"
        :is-admin="isAdmin"
        @sync-users="syncUsers"
        @view-user="viewUser"
        @assign-user="assignUser"
        @retry="fetchUsers"
      />
    </main>

    <AddServerModal
      :show="showAddServerModal"
      :servers="servers"
      @close="showAddServerModal = false"
      @submit="addServer"
    />
    
    <ViewServerModal
      :show="showViewServerModal"
      :server="selectedServer"
      @close="showViewServerModal = false"
    />
    
    <EditServerModal
      :show="showEditServerModal"
      :server="selectedServer"
      :servers="servers"
      @close="showEditServerModal = false"
      @submit="updateServer"
    />
    
    <DeleteServerModal
      :show="showDeleteServerModal"
      :server="selectedServer"
      @close="showDeleteServerModal = false"
      @confirm="confirmDelete"
    />
    
    <ViewUserModal
      :show="showViewUserModal"
      :user="selectedUser"
      :is-admin="isAdmin"
      @close="showViewUserModal = false"
    />
    
    <AssignUserModal
      :show="showAssignUserModal"
      :user="selectedUser"
      :servers="servers"
      @close="showAssignUserModal = false"
      @assigned="handleUserAssigned"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DashboardSidebar from '../components/DashboardSidebar.vue'
import DashboardStats from '../components/DashboardStats.vue'
import ServerTable from '../components/ServerTable.vue'
import UserTable from '../components/UserTable.vue'
import AddServerModal from '../components/AddServerModal.vue'
import ViewServerModal from '../components/ViewServerModal.vue'
import EditServerModal from '../components/EditServerModal.vue'
import DeleteServerModal from '../components/DeleteServerModal.vue'
import ViewUserModal from '../components/ViewUserModal.vue'
import AssignUserModal from '../components/AssignUserModal.vue'
import BlackListTable from '../components/BlackListTable.vue'

definePageMeta({
  middleware: 'auth'
})

const { logout, getSession } = useAuth()
const { apiRequest } = useApi()

// Data
const activeTab = ref('dashboard')
const servers = ref(null)
const users = ref(null)
const blacklists = ref(null)
const loading = ref(true)
const error = ref('')
const usersLoading = ref(false)
const usersError = ref('')
const showAddServerModal = ref(false)
const showViewServerModal = ref(false)
const showEditServerModal = ref(false)
const showDeleteServerModal = ref(false)
const showViewUserModal = ref(false)
const showAssignUserModal = ref(false)
const selectedServer = ref(null)
const selectedUser = ref(null)
const tokenData = ref(null)

// Computed
const activeServers = computed(() => {
  return servers.value?.length || 0
})

const userName = computed(() => {
  return tokenData.value?.preferred_username || 'User'
})

const userRoles = computed(() => {
  const roles = tokenData.value?.roles || []
  const hasAdmin = roles.some(role => String(role)
  .toLowerCase()
  .includes('admin')
  )
  if (hasAdmin) {
    return 'Admin'
  }
  else {
    return "User"
  }
  // return roles.length > 0 ? roles.join(', ') : 'No roles'
})

const userInitials = computed(() => {
  const name = userName.value
  return name ? name.substring(0, 2).toUpperCase() : 'U'
})

const isAdmin = computed(() => {
  const roles = tokenData.value?.roles || []
  return roles.includes('admin-role')
})

// Methods
const fetchServers = async () => {
  try {
    loading.value = true
    error.value = ''
    servers.value = await apiRequest('/api/server')
  } catch (err) {
    console.error('Failed to load servers:', err)
    error.value = err.message || 'Failed to load servers'
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    usersLoading.value = true
    usersError.value = ''
    users.value = await apiRequest('/api/user')
  } catch (err) {
    console.error('Failed to load users:', err)
    usersError.value = err.message || 'Failed to load users'
  } finally {
    usersLoading.value = false
  }
}

const fetchBlacklist = async () => {
  try {
    loading.value = true
    error.value = ''
    blacklists.value = await apiRequest('/api/blacklist')
  } catch (err) {
    console.error('Failed to load blacklist:', err)
    error.value = err.message || 'Failed to load blacklist'
  } finally {
    loading.value = false
  }
}


const decodeToken = async () => {
  const session = await getSession()
  if (session) {
    tokenData.value = {
      preferred_username: session.preferred_username || session.sub,
      roles: session.roles || []
    }
  }
}

const addServer = async (serverData) => {
  try {
    await apiRequest('/api/server', {
      method: 'POST',
      body: serverData
    })
    showAddServerModal.value = false
    await fetchServers()
  } catch (err) {
    alert('Failed to add server: ' + err.message)
  }
}

const viewServer = (server) => {
  selectedServer.value = server
  showViewServerModal.value = true
}

const editServer = (server) => {
  selectedServer.value = server
  showEditServerModal.value = true
}

const updateServer = async (serverData) => {
  try {
    await apiRequest(`/api/server/${selectedServer.value.id}`, {
      method: 'PUT',
      body: serverData
    })
    showEditServerModal.value = false
    await fetchServers()
  } catch (err) {
    alert('Failed to update server: ' + err.message)
  }
}

const deleteServer = (server) => {
  selectedServer.value = server
  showDeleteServerModal.value = true
}

const confirmDelete = async (server) => {
  try {
    await apiRequest(`/api/server/${server.id}`, { method: 'DELETE' })
    showDeleteServerModal.value = false
    await fetchServers()
  } catch (err) {
    alert('Failed to delete server: ' + err.message)
  }
}

const handleLogout = () => {
  logout()
}

const handleNavigation = (tab) => {
  activeTab.value = tab
}

const syncUsers = async () => {
  try {
    usersLoading.value = true
    usersError.value = ''
    const result = await apiRequest('/api/user/sync')
    console.log('Sync result:', result)
    // Refresh users list after sync
    await fetchUsers()
    alert('Users synchronized successfully!')
  } catch (err) {
    console.error('Failed to sync users:', err)
    alert('Failed to sync users: ' + err.message)
    usersError.value = err.message || 'Failed to sync users'
  } finally {
    usersLoading.value = false
  }
}

const viewUser = (user) => {
  selectedUser.value = user
  showViewUserModal.value = true
}

const assignUser = (user) => {
  selectedUser.value = user
  showAssignUserModal.value = true
}

const handleUserAssigned = async () => {
  // Refresh users list after assignment
  await fetchUsers()
}

// Lifecycle
onMounted(async () => {
  await decodeToken()
  await fetchServers()
  await fetchUsers()
  await fetchBlacklist()
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.dashboard-container {
  display: flex;
  min-height: 100vh;
  background: #0b1220;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

.main-content {
  flex: 1;
  margin-left: 260px;
  padding: 24px;
  overflow-y: auto;
}

.dashboard-header {
  margin-bottom: 32px;
}

.header-left h1 {
  font-size: 32px;
  font-weight: 700;
  color: #e5e7eb;
  margin-bottom: 4px;
}

.subtitle {
  color: #94a3b8;
  font-size: 16px;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 70px;
  }
}
</style>
