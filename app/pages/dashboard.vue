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
          <h1>{{ activeTab === 'users' ? 'Users' : activeTab === 'ignorelist' ? 'Ignore List' : activeTab === 'logs' ? 'Activity Logs' : activeTab === 'ansible_logs' ? 'Ansible Logs' : 'Dashboard' }}</h1>
          <p class="subtitle">Welcome back, {{ userName }}</p>
        </div>
      </header>

      <DashboardStats v-if="activeTab === 'dashboard'"
        :total-servers="servers?.length || 0"
        :active-servers="activeServers"
        :total-users="users?.length || 0"
        :access-level="userRoles"
      />

      <DashboardStats v-if="activeTab === 'users'"
        :total-servers="users?.length || 0"
        :active-servers="users?.reduce((sum, u) => sum + ((u.assigned_servers || []).filter(s => s.primary_user === true).length), 0) || 0"
        :total-users="users?.reduce((sum, u) => sum + (u.pubKey?.length || 0), 0)"
        :access-level="userRoles"
        label1="Total Users"
        label2="Admin Assignments"
        label3=""
        :show-card3="false"

      />

      <DashboardStats v-if="activeTab === 'ignorelist'"
        :total-servers="new Set(ignoreLists?.map(i => i.username)).size || 0"
        :active-servers="ignoreLists?.reduce((sum, i) => sum + (i.servers?.length || 0), 0) || 0"
        :total-users="0"
        :access-level="userRoles"
        label1="Total Ignored Users"
        label2="Total Ignored Servers"
        label3=""
        :show-card3="false"
        > </DashboardStats>

      <ServerTable v-if="activeTab === 'dashboard'"
        :servers="servers"
        :users="users"
        :last-updated="activityStatus?.last_updated"
        :loading="loading"
        :error="error"
        :is-admin="isAdmin"
        @add-server="showAddServerModal = true"
        @view-server="viewServer"
        @view-server-users="viewServerUsers"
        @edit-server="editServer"
        @delete-server="deleteServer"
        @retry="fetchServers"
      />

      <IgnoreListTable v-if="activeTab === 'ignorelist'"
        :ignoreLists="ignoreLists"
        :loading="loading"
        :error="error"
        :is-admin="isAdmin"
        @add-ignore-list="showAddIgnorelistModal = true"
        @view-ignore-list="viewIgnorelist"
        @assign-ignore-list="assignIgnorelist"
        @retry="fetchIgnoreList"
      />

      <AnsibleLogTable v-if="activeTab === 'ansible_logs'"
        :ansibleLogs="ansibleLogs"
        :loading="loading"
        :error="error"
        :is-admin="isAdmin"
        @retry="fetchAnsibleLogs"
      />

      <ActivityLogsTable v-if="activeTab === 'logs'"
        :logs="logs"
        :loading="logsLoading"
        :error="logsError"
        @retry="fetchLogs"
      />

      <UserTable v-if="activeTab === 'users'"
        :users="users"
        :last-synced="activityStatus?.last_synced"
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
      :users="users"
      @close="showViewServerModal = false"
    />

    <AddUsersModal
      :show="showAddUsersModal"
      :server="selectedServer"
      :servers="servers"
      @addUsers="viewAddUser"
      @close="showAddUsersModal = false"
      @assigned="handleUserAssigned"
    />

    <ServerUsersModal
      :show="showServerUsersModal"
      :server="selectedServerForUsers"
      :isAdmin="isAdmin"
      @addUsers="viewAddUser"
      @close="showServerUsersModal = false"
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
      @unassigned="handleUserUnassigned"
      @close="showViewUserModal = false"
    />

    <AddIgnoreListModal
      :show="showAddIgnorelistModal"
      :servers="servers"
      @close="showAddIgnorelistModal = false"
      @added="fetchIgnoreList"
    />

    <ViewIgnoreListModal
      :show="showViewIgnorelistModal"
      :user="selectedIgnorelist"
      :is-admin="isAdmin"
      :ignoreLists="ignoreLists"
      :servers="servers"
      @view-server="viewServerFromIgnorelist"
      @close="showViewIgnorelistModal = false"
      @removed="fetchIgnoreList"
    />
    
    <AssignIgnoreListModal
      :show="showAssignIgnorelistModal"
      :user="selectedIgnorelistForAssign"
      :servers="servers"
      :ignoreLists="ignoreLists"
      @close="showAssignIgnorelistModal = false"
      @assigned="fetchIgnoreList"
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
import { DashboardSidebar, DashboardStats } from '~/components/dashboard'
import { ServerTable, AddServerModal, ViewServerModal, EditServerModal, DeleteServerModal, ServerUsersModal, AssignUserModal } from '~/components/server'
import { UserTable, ViewUserModal, AddUsersModal } from '~/components/user'
import { IgnoreListTable, ViewIgnoreListModal, AddIgnoreListModal, AssignIgnoreListModal } from '~/components/ignorelist'
import { ActivityLogsTable } from '~/components/log'
import { AnsibleLogTable } from '~/components/ansible_log'

definePageMeta({
  middleware: 'auth'
})


const { logout, getSession } = useAuth()
const { apiRequest } = useApi()


// Data
const activeTab = ref('dashboard')
const servers = ref(null)
const users = ref(null)
const ignoreLists = ref(null)
const ansibleLogs = ref(null)
const logs = ref(null)
const activityStatus = ref(null)
const loading = ref(true)
const error = ref('')
const usersLoading = ref(false)
const usersError = ref('')
const logsLoading = ref(false)
const logsError = ref('')
const showAddServerModal = ref(false)
const showViewServerModal = ref(false)
const showAddUsersModal = ref(false)
const showServerUsersModal = ref(false)
const showEditServerModal = ref(false)
const showDeleteServerModal = ref(false)
const showViewUserModal = ref(false)
const showAddIgnorelistModal = ref(false)
const showViewIgnorelistModal = ref(false)
const showAssignIgnorelistModal = ref(false)
const showAssignUserModal = ref(false)
const selectedServer = ref(null)
const selectedServerForUsers = ref(null)
const selectedUser = ref(null)
const selectedIgnorelist = ref(null)
const selectedIgnorelistForAssign = ref(null)
const tokenData = ref(null)

// Computed
const activeServers = computed(() => {
  if (!Array.isArray(servers.value) || servers.value.length === 0) return 0

  if (Array.isArray(users.value) && users.value.length > 0) {
    const assignedServerIds = new Set()

    users.value.forEach((user) => {
      ;(user.assigned_servers || []).forEach((server) => {
        if (server?.id !== undefined && server?.id !== null) {
          assignedServerIds.add(server.id)
        }
      })
    })

    return servers.value.filter((server) => assignedServerIds.has(server.id)).length
  }

  return servers.value.filter((server) => {
    const count = server?.assigned_users_count ?? server?.assigned_users?.length ?? 0
    return count > 0
  }).length
})

const userName = computed(() => {
  return (
    tokenData.value?.preferred_username ||
    tokenData.value?.username ||
    tokenData.value?.name ||
    tokenData.value?.sub ||
    'User'
  )
})

const extractRoles = (source) => {
  const roles = []

  const visit = (value) => {
    if (!value) return

    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return

      // Handle comma-separated roles if backend returns a single string.
      trimmed.split(',').forEach((part) => {
        const item = part.trim().toLowerCase()
        if (item) roles.push(item)
      })
      return
    }

    if (typeof value === 'object') {
      if (Array.isArray(value.roles)) {
        visit(value.roles)
      }
      Object.values(value).forEach(visit)
    }
  }

  visit(source)
  return [...new Set(roles)]
}

const normalizedRoles = computed(() => {
  return extractRoles(tokenData.value?.roles)
})

const userRoles = computed(() => {
  return normalizedRoles.value.some((role) => role.includes('admin')) ? 'Admin' : 'User'
})

const userInitials = computed(() => {
  const name = userName.value
  return name ? name.substring(0, 2).toUpperCase() : 'U'
})

const isAdmin = computed(() => {
  return Boolean(tokenData.value?.isAdmin) || normalizedRoles.value.some((role) => role.includes('admin'))
})

const fetchActivityStatus = async () => {
  try {
    activityStatus.value = await apiRequest('/api/activity/status')
  } catch (err) {
    console.error('Failed to load activity status:', err)
  }
}

const refreshServerData = async () => {
  await Promise.all([fetchServers(), fetchActivityStatus()])
}

const refreshUserData = async () => {
  await Promise.all([fetchUsers(), fetchActivityStatus()])
}

// Methods
const fetchServers = async () => {
  try {
    loading.value = true
    error.value = ''
    servers.value = await apiRequest('/api/server')
  } catch (err) {
      error.value = 'Failed to load servers.'
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
    usersError.value = 'Failed to load users.'
  } finally {
    usersLoading.value = false
  }
}

const fetchLogs = async () => {
  try {
    logsLoading.value = true
    logsError.value = ''
    logs.value = await apiRequest('/api/activity/logs')
  } catch (err) {
    logsError.value = 'Failed to load activity logs.'
  } finally {
    logsLoading.value = false
  }
}

const fetchIgnoreList = async () => {
  try {
    loading.value = true
    error.value = ''
    ignoreLists.value = await apiRequest('/api/ignorelist')
  } catch (err) {
    error.value = 'Failed to load ignore list.'
  } finally {
    loading.value = false
  }
}

const fetchAnsibleLogs = async () => {
  try {
    loading.value = true
    error.value = ''
    ansibleLogs.value = await apiRequest('/api/ansible/history')
  } catch (err) {
    error.value = 'Failed to load ansible logs.'
  } finally {
    loading.value = false
  }
}


const applySession = (session) => {
  if (!session) return

  const payload = session.data ?? session.user ?? session

  const extractedRoles =
    payload.roles ??
    payload.realm_access ??
    payload.resource_access ??
    []

  tokenData.value = {
    preferred_username:
      payload.preferred_username ||
      payload.username ||
      payload.name ||
      payload.sub,
    username: payload.username,
    name: payload.name,
    sub: payload.sub,
    roles: extractedRoles,
    isAdmin: payload.is_admin ?? payload.isAdmin ?? false
  }
}

const decodeToken = async () => {
  const session = await getSession()
  applySession(session)
}

await decodeToken()

const addServer = async (serverData) => {
  try {
    await apiRequest('/api/server', {
      method: 'POST',
      body: serverData
    })
    showAddServerModal.value = false
    await refreshServerData()
  } catch (err) {
    // alert('Failed to add server: ' + err.message)
  }
}

const viewServer = (server) => {
  selectedServer.value = server
  showViewServerModal.value = true
}

const viewAddUser = (server) => {
  // disable ServerUsersModal when opening AddUsersModal to prevent conflicts
  showServerUsersModal.value = false
  selectedServer.value = server
  showAddUsersModal.value = true
}

const viewServerUsers = (server) => {
  selectedServerForUsers.value = server
  showServerUsersModal.value = true
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
    await refreshServerData()
  } catch (err) {
    // alert('Failed to update server: ' + err.message)
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
    await refreshServerData()
  } catch (err) {
    // alert('Failed to delete server: ' + err.message)
  }
}

const handleLogout = () => {
  logout()
}

const handleNavigation = (tab) => {
  activeTab.value = tab
  if (tab === 'logs') {
    fetchLogs()
  }
}

const syncUsers = async () => {
  try {
    usersLoading.value = true
    usersError.value = ''
    const result = await apiRequest('/api/user/sync', { method: 'POST' })
    console.log('Sync result:', result)
    await refreshUserData()
    await fetchLogs()
    // alert('Users synchronized successfully!')
  } catch (err) {
    // alert('Failed to sync users: ' + err.message)
  } finally {
    usersLoading.value = false
  }
}

const viewUser = (user) => {
  selectedUser.value = user
  showViewUserModal.value = true
}

const viewIgnorelist = (ignorelist) => {
  selectedIgnorelist.value = ignorelist
  showViewIgnorelistModal.value = true
}

const viewServerFromIgnorelist = (server) => {
  if (!server) return
  showViewIgnorelistModal.value = false
  viewServer(server)
}

const assignIgnorelist = (ignorelist) => {
  selectedIgnorelistForAssign.value = ignorelist
  showAssignIgnorelistModal.value = true
}

const assignUser = (user) => {
  selectedUser.value = user
  showAssignUserModal.value = true
}

const handleUserAssigned = async () => {
  await refreshUserData()
}

const handleUserUnassigned = async () => {
  await refreshUserData()
}

// Lifecycle
onMounted(async () => {
  await fetchActivityStatus()
  await fetchServers()
  await fetchUsers()
  await fetchIgnoreList()
  await fetchLogs()
  await fetchAnsibleLogs()
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
