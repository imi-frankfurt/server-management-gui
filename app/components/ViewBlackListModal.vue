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

        <div v-else-if="blackListDetails">
          <div class="detail-group">
            <label>Username</label>
            <div class="detail-value">{{ blackListDetails.username || 'N/A' }}</div>
          </div>

          <div class="detail-group">
            <label>User ID</label>
            <div class="detail-value">{{ blackListDetails.id || 'N/A' }}</div>
          </div>

          <div class="detail-group">
            <label>Created At</label>
            <div class="detail-value">{{ formatDate(blackListDetails.created_at) }}</div>
          </div>

          <div class="detail-group">
            <label>Updated At</label>
            <div class="detail-value">{{ formatDate(blackListDetails.updated_at) }}</div>
          </div>

          <div class="detail-group">
            <label>Assigned Servers ({{ serverList.length }})</label>
            <div v-if="serverList.length > 0" class="servers-list">
              <div
                v-for="(server, index) in serverList"
                :key="server.id || server.name || index"
                class="server-item"
              >
                <div class="server-info">
                  <div class="server-details">
                    <strong>{{ server.name }}</strong>
                    <code v-if="server.ip" class="ip-address">{{ server.ip }}</code>
                  </div>
                  <button 
                    v-if="isAdmin && server.id" 
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

defineEmits(['close'])

const { apiRequest } = useApi()
const blackListDetails = ref(null)
const loading = ref(false)
const error = ref('')
const unassigning = ref(null)

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

const normalizeBlacklistResponse = (payload) => {
  if (!payload) return null

  // Support array responses like [{...}] from /api/blacklist/:id
  if (Array.isArray(payload)) {
    return payload[0] || null
  }

  const wrapped = payload.data || payload.user || payload.blacklist || payload
  if (Array.isArray(wrapped)) {
    return wrapped[0] || null
  }

  return wrapped
}

const getUserIdentifier = (user) => {
  if (!user) return null
  return user.id || null
}

const serverList = computed(() => {
  if (!blackListDetails.value) return []
  if (Array.isArray(blackListDetails.value.assigned_servers)) {
    return blackListDetails.value.assigned_servers
  }

  // Your blacklist endpoint returns `servers` as strings.
  if (Array.isArray(blackListDetails.value.servers)) {
    return blackListDetails.value.servers.map((name, index) => ({
      id: null,
      name: name || `Server ${index + 1}`,
      ip: null
    }))
  }

  return []
})

const fetchUserDetails = async (identifier) => {
  if (!identifier) {
    blackListDetails.value = null
    return
  }

  try {
    loading.value = true
    error.value = ''
    const response = await apiRequest(`/api/blacklist/${identifier}`)
    blackListDetails.value = normalizeBlacklistResponse(response)
  } catch (err) {
    console.error('Failed to load user details:', err)
    error.value = err.message || 'Failed to load user details'
  } finally {
    loading.value = false
  }
}

const unassignServer = async (serverId) => {
  if (!blackListDetails.value || !blackListDetails.value.id) return
  if (!serverId) return
  
  if (!confirm(`Are you sure you want to remove access to this server?`)) return
  
  try {
    unassigning.value = serverId
    await apiRequest('/api/blacklist/unassign', {
      method: 'POST',
      body: {
        user_id: blackListDetails.value.id,
        server_id: serverId
      }
    })
    // Refresh user details after unassignment
    await fetchUserDetails(getUserIdentifier(props.user))
  } catch (err) {
    console.error('Failed to unassign server:', err)
    alert('Failed to unassign server: ' + err.message)
  } finally {
    unassigning.value = null
  }
}

// Watch for user changes and fetch details
watch(() => props.user, (newUser) => {
  const identifier = getUserIdentifier(newUser)
  if (identifier && props.show) {
    fetchUserDetails(identifier)
  }
}, { immediate: true })

// Watch for show changes
watch(() => props.show, (newShow) => {
  const identifier = getUserIdentifier(props.user)
  if (newShow && identifier) {
    fetchUserDetails(identifier)
  } else if (!newShow) {
    // Reset when modal closes
    blackListDetails.value = null
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