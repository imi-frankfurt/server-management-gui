<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>User Details</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading user details...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
        </div>

        <div v-else-if="userDetails">
          <div class="detail-group">
            <label>Username</label>
            <div class="detail-value">{{ userDetails.username || 'N/A' }}</div>
          </div>

          <div class="detail-group">
            <label>Keycloak ID</label>
            <div class="detail-value">
              <code class="code-text">{{ userDetails.keycloak_id || 'N/A' }}</code>
            </div>
          </div>

          <div class="detail-group">
            <label>User ID</label>
            <div class="detail-value">{{ userDetails.id || 'N/A' }}</div>
          </div>

          <div class="detail-group">
            <label>Created At</label>
            <div class="detail-value">{{ formatDateTime(userDetails.created_at) }}</div>
          </div>

          <div class="detail-group">
            <label>Updated At</label>
            <div class="detail-value">{{ formatDateTime(userDetails.updated_at) }}</div>
          </div>

          <div class="detail-group">
            <label>Public Keys</label>
            <div v-if="userDetails.pubKey && userDetails.pubKey.length > 0" class="keys-list">
              <div v-for="(key, index) in userDetails.pubKey" :key="index" class="key-item">
                <div class="key-header">Key {{ index + 1 }}</div>
                <code class="key-content">{{ key }}</code>
              </div>
            </div>
            <div v-else class="detail-value text-muted">No public keys configured</div>
          </div>

          <div class="detail-group">
            <label>Admin Assignments</label>
            <div class="detail-value">{{ adminAssignmentCount }} server(s)</div>
          </div>

          <div class="detail-group">
            <label>Assigned Servers ({{ userDetails.assigned_servers?.length || 0 }})</label>
            <div v-if="userDetails.assigned_servers && userDetails.assigned_servers.length > 0" class="servers-list">
              <div v-for="server in userDetails.assigned_servers" :key="server.id" class="server-item">
                <div class="server-info">
                  <div class="server-details">
                    <strong>{{ server.name }}</strong>
                    <span v-if="server.primary_user === true" class="role-badge">Admin</span>
                    <code class="ip-address">{{ server.ip }}</code>
                  </div>
                  <button 
                    v-if="isAdmin" 
                    @click="unassignServer(server.id)" 
                    class="btn-unassign"
                    :disabled="unassigning === server.id"
                  >
                    {{ unassigning === server.id ? 'Removing...' : 'Unassign' }}
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="detail-value text-muted">No servers assigned</div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="$emit('close')" class="btn-primary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useFormatter } from '~/composables/useFormatter'
const { formatDateTime } = useFormatter()
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: null
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'unassigned'])

const { apiRequest } = useApi()
const userDetails = ref(null)
const loading = ref(false)
const error = ref('')
const unassigning = ref(null)

const adminAssignmentCount = computed(() => {
  const assignedServers = userDetails.value?.assigned_servers
  if (!Array.isArray(assignedServers) || assignedServers.length === 0) return 0
  return assignedServers.filter((server) => server?.primary_user === true).length
})


const fetchUserDetails = async (keycloakId) => {
  try {
    loading.value = true
    error.value = ''
    userDetails.value = await apiRequest(`/api/user/${keycloakId}`)
  } catch (err) {
    console.error('Failed to load user details:', err)
    error.value = err.message || 'Failed to load user details'
  } finally {
    loading.value = false
  }
}

const unassignServer = async (serverId) => {
  if (!userDetails.value || !userDetails.value.id) return
  
  if (!confirm(`Are you sure you want to remove access to this server?`)) return
  
  try {
    unassigning.value = serverId
    await apiRequest('/api/user/unassign', {
      method: 'POST',
      body: {
        user_id: userDetails.value.id,
        server_id: serverId
      }
    })
    // Refresh user details after unassignment
    await fetchUserDetails(props.user.keycloak_id)
    // Notify parent so table/stats refresh without manual reload.
    emit('unassigned')
  } catch (err) {
    console.error('Failed to unassign server:', err)
    // alert('Failed to unassign server: ' + err.message)
  } finally {
    unassigning.value = null
  }
}

// Watch for user changes and fetch details
watch(() => props.user, (newUser) => {
  if (newUser && newUser.keycloak_id && props.show) {
    fetchUserDetails(newUser.keycloak_id)
  }
}, { immediate: true })

// Watch for show changes
watch(() => props.show, async (newShow) => {
  if (newShow && props.user && props.user.keycloak_id) {
    fetchUserDetails(props.user.keycloak_id)
  } else if (!newShow) {
    // Reset when modal closes
    userDetails.value = null
    error.value = ''
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
}

.close-btn:hover {
  background: #334155;
}

.modal-body {
  padding: 24px;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 40px 20px;
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  color: #ef4444;
}




.detail-group {
  margin-bottom: 24px;
}

.detail-group:last-of-type {
  margin-bottom: 0;
}

.detail-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.detail-value {
  padding: 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  font-size: 14px;
  color: #e5e7eb;
}

.code-text {
  font-family: 'Courier New', monospace;
  background: #1e293b;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  word-break: break-all;
}

.ip-address {
  font-family: 'Courier New', monospace;
  background: #1e293b;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.text-muted {
  color: #94a3b8;
  font-style: italic;
}

.keys-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.key-item {
  padding: 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
}

.key-header {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 8px;
}

.key-content {
  display: block;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #e5e7eb;
  background: #111827;
  padding: 8px;
  border-radius: 4px;
  word-break: break-all;
  white-space: pre-wrap;
  max-height: 150px;
  overflow-y: auto;
}

.servers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.server-item {
  padding: 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
}

.server-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.server-details {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.server-info strong {
  color: #e5e7eb;
  font-size: 14px;
}

.role-badge {
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid #1d4ed8;
  background: #172554;
  color: #bfdbfe;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}

.btn-unassign {
  padding: 6px 14px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-unassign:hover:not(:disabled) {
  background: #dc2626;
}

.btn-unassign:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  margin-top: 24px;
  border-top: 1px solid #334155;
}

.btn-primary {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
}
</style>
