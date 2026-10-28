<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Assign Servers to {{ user?.username }}</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading servers...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
        </div>

        <div v-else>
          <p class="modal-description">
            Select servers to assign to this user. Already assigned servers are marked.
          </p>

          <div v-if="availableServers.length > 0" class="servers-list">
            <div 
              v-for="server in availableServers" 
              :key="server.id" 
              class="server-item"
              :class="{ 'already-assigned': isAssigned(server.id) }"
            >
              <label class="server-label">
                <input 
                  type="checkbox" 
                  :checked="isAssigned(server.id)"
                  :disabled="isAssigned(server.id) || assigning"
                  @change="toggleServer(server.id)"
                  class="server-checkbox"
                />
                <div class="server-info">
                  <div class="server-details">
                    <strong>{{ server.name }}</strong>
                    <code class="ip-address">{{ server.ip }}</code>
                  </div>
                  <span v-if="isAssigned(server.id)" class="assigned-badge">
                    Already Assigned
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div v-else class="empty-state">
            <p>No servers available</p>
          </div>

          <div v-if="selectedServers.length > 0" class="selection-info">
            {{ selectedServers.length }} server(s) selected for assignment
          </div>
        </div>

        <div class="modal-footer">
          <button 
            type="button" 
            @click="$emit('close')" 
            class="btn-secondary"
            :disabled="assigning"
          >
            Cancel
          </button>
          <button 
            type="button" 
            @click="handleAssign" 
            class="btn-primary"
            :disabled="selectedServers.length === 0 || assigning"
          >
            {{ assigning ? 'Assigning...' : `Assign ${selectedServers.length > 0 ? `(${selectedServers.length})` : ''}` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: null
  },
  servers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'assigned'])

const { apiRequest } = useApi()
const loading = ref(false)
const error = ref('')
const assigning = ref(false)
const selectedServers = ref([])
const assignedServerIds = ref([])

const availableServers = computed(() => {
  return props.servers || []
})

const isAssigned = (serverId) => {
  return assignedServerIds.value.includes(serverId)
}

const toggleServer = (serverId) => {
  const index = selectedServers.value.indexOf(serverId)
  if (index > -1) {
    selectedServers.value.splice(index, 1)
  } else {
    selectedServers.value.push(serverId)
  }
}

const fetchUserDetails = async (keycloakId) => {
  try {
    loading.value = true
    error.value = ''
    const userDetails = await apiRequest(`/api/user/${keycloakId}`)
    // Get list of already assigned server IDs
    assignedServerIds.value = (userDetails.assigned_servers || []).map(s => s.id)
  } catch (err) {
    console.error('Failed to load user details:', err)
    error.value = err.message || 'Failed to load user details'
  } finally {
    loading.value = false
  }
}

const handleAssign = async () => {
  if (selectedServers.value.length === 0 || !props.user) return
  
  try {
    assigning.value = true
    
    // Assign each selected server
    for (const serverId of selectedServers.value) {
      await apiRequest('/api/user/assign', {
        method: 'POST',
        body: {
          user_id: props.user.id,
          server_id: serverId
        }
      })
    }
    
    emit('assigned')
    emit('close')
  } catch (err) {
    console.error('Failed to assign servers:', err)
    // alert('Failed to assign servers: ' + err.message)
  } finally {
    assigning.value = false
  }
}

// Watch for user changes and fetch their assigned servers
watch(() => props.user, (newUser) => {
  if (newUser && newUser.keycloak_id && props.show) {
    fetchUserDetails(newUser.keycloak_id)
  }
}, { immediate: true })

// Watch for show changes
watch(() => props.show, (newShow) => {
  if (newShow && props.user && props.user.keycloak_id) {
    fetchUserDetails(props.user.keycloak_id)
    selectedServers.value = []
  } else if (!newShow) {
    // Reset when modal closes
    selectedServers.value = []
    assignedServerIds.value = []
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
  background: var(--surface);
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
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--surface);
  z-index: 10;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--surface-raised);
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  color: var(--text-muted);
}

.close-btn:hover {
  background: var(--border);
}

.modal-body {
  padding: 24px;
}

.modal-description {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 20px;
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
  border: 4px solid var(--surface-raised);
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

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

.servers-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.server-item {
  border: 2px solid var(--border);
  border-radius: 8px;
  transition: all 0.2s;
}

.server-item:hover:not(.already-assigned) {
  border-color: #3b82f6;
  background: var(--surface-sunken);
}

.server-item.already-assigned {
  background: var(--surface-sunken);
  opacity: 0.7;
}

.server-label {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  cursor: pointer;
  width: 100%;
}

.server-item.already-assigned .server-label {
  cursor: not-allowed;
}

.server-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
}

.server-checkbox:disabled {
  cursor: not-allowed;
}

.server-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  gap: 12px;
}

.server-details {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.server-details strong {
  color: var(--text);
  font-size: 14px;
}

.ip-address {
  font-family: 'Courier New', monospace;
  background: var(--surface-raised);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.assigned-badge {
  background: #10b981;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.selection-info {
  background: #eff6ff;
  border: 1px solid #3b82f6;
  color: #1e40af;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid var(--border);
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

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 20px;
  background: var(--surface-raised);
  color: var(--text-subtle);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
