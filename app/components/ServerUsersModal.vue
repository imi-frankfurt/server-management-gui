<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <div>
          <h3>Users on {{ server?.name }}</h3>
          <p class="header-sub">{{ server?.ip }}</p>
        </div>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading users...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
        </div>

        <div v-else-if="assignedUsers.length > 0">
          <div class="user-count">{{ assignedUsers.length }} user(s) assigned to this server</div>
          <div class="users-list">
            <div v-for="user in assignedUsers" :key="user.id" class="user-item">
              <div class="user-avatar">{{ user.username?.substring(0, 2).toUpperCase() || '??' }}</div>
              <div class="user-details">
                <strong>{{ user.username }}</strong>
                <code class="keycloak-id">{{ user.keycloak_id }}</code>
              </div>
              <button @click="openUserModal(user)" class="btn-view-user">View</button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>No users assigned to this server.</p>
        </div>

        <div class="modal-footer">
          <button @click="$emit('add-users')" class="btn-primary">Add Users</button>
          <button @click="$emit('close')" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>

  <ViewUserModal
    :show="showUserModal"
    :user="selectedUser"
    :isAdmin="false"
    @close="showUserModal = false"
  />
</template>

<script setup>
import { ref, watch } from 'vue'

const showUserModal = ref(false)
const selectedUser = ref(null)

const openUserModal = (user) => {
  selectedUser.value = user
  showUserModal.value = true
}

const props = defineProps({
  show: { type: Boolean, default: false },
  server: { type: Object, default: null }
})

defineEmits(['close', 'add-users'])

const { apiRequest } = useApi()
const assignedUsers = ref([])
const loading = ref(false)
const error = ref('')

const fetchUsers = async (serverId) => {
  try {
    loading.value = true
    error.value = ''
    const all = await apiRequest('/api/user')
    assignedUsers.value = (all || []).filter(u =>
      (u.assigned_servers || []).some(s => s.id === serverId)
    )
  } catch (err) {
    console.error('Failed to load users:', err)
    error.value = err.message || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

watch(() => props.show, (newVal) => {
  if (newVal && props.server?.id) {
    fetchUsers(props.server.id)
  } else if (!newVal) {
    assignedUsers.value = []
    error.value = ''
  }
})

watch(() => props.server, (newServer) => {
  if (props.show && newServer?.id) {
    fetchUsers(newServer.id)
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #111827;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid #334155;
  position: sticky;
  top: 0;
  background: #111827;
  z-index: 10;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #e5e7eb;
  margin-bottom: 4px;
}

.header-sub {
  font-size: 13px;
  color: #64748b;
  font-family: 'Courier New', monospace;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #1e293b;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  color: #94a3b8;
  flex-shrink: 0;
}

.close-btn:hover { background: #334155; }

.modal-body { padding: 24px; }

.user-count {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 16px;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 10px;
}

.btn-view-user {
  margin-left: auto;
  padding: 6px 14px;
  background: transparent;
  color: #60a5fa;
  border: 1px solid #1d4ed8;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-view-user:hover {
  background: #1e3a8a;
  border-color: #60a5fa;
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #1d4ed8;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-details strong {
  font-size: 14px;
  color: #e5e7eb;
}

.keycloak-id {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #64748b;
  background: #1e293b;
  padding: 2px 6px;
  border-radius: 4px;
}

.loading-state, .empty-state, .error-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 4px solid #1e293b;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.error-state { color: #ef4444; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
  margin-top: 24px;
  border-top: 1px solid #334155;
}

.btn-primary {
  padding: 10px 20px;
  margin: 5px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  padding: 10px 20px;
  margin: 5px;
  background: #334155;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover { background: #2563eb; }
</style>
