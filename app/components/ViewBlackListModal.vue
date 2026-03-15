<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>User Details</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <div v-if="userEntries.length === 0" class="error-state">
          <p>No blacklist entries found for this user.</p>
        </div>

        <div v-else>
          <div class="detail-group">
            <label>Username</label>
            <div class="detail-value">{{ user?.username || 'N/A' }}</div>
          </div>

          <div class="detail-group">
            <label>Blacklisted Since</label>
            <div class="detail-value">{{ formatDate(userEntries[0]?.created_at) }}</div>
          </div>

          <div class="detail-group">
            <label>Blacklisted Servers ({{ serverList.length }})</label>
            <div v-if="serverList.length > 0" class="servers-list">
              <div
                v-for="server in serverList"
                :key="`${server.serverId}-${server.serverName}`"
                class="server-item"
              >
                <div class="server-info">
                  <div class="server-details">
                    <strong>{{ server.serverName }}</strong>
                  </div>
                  <button
                    v-if="isAdmin"
                    @click="removeServerEntry(server.entryId, server.serverId, server.serverName)"
                    class="btn-unassign"
                    :disabled="removingServer === `${server.entryId}-${server.serverName}`"
                  >
                    {{ removingServer === `${server.entryId}-${server.serverName}` ? 'Removing...' : 'Remove' }}
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
import { computed, ref } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  user: { type: Object, default: null },
  isAdmin: { type: Boolean, default: false },
  blacklists: { type: Array, default: () => [] },
  servers: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'removed'])

const { apiRequest } = useApi()
const removingServer = ref(null)

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

// All blacklist entries for this user across all servers
const userEntries = computed(() => {
  if (!props.user?.username || !props.blacklists?.length) return []
  return props.blacklists.filter(b => b.username === props.user.username)
})

// Flat list of { entryId, serverId, serverName } — one item per server per entry
const serverList = computed(() => {
  return userEntries.value.flatMap(entry =>
    (entry.servers || []).map(serverName => {
      const match = props.servers.find(s => s.name === serverName)
      return { entryId: entry.id, serverId: match?.id ?? null, serverName }
    })
  )
})

const removeServerEntry = async (entryId, serverId, serverName) => {
  if (!confirm(`Remove "${props.user?.username}" from "${serverName}" blacklist?`)) return
  const key = `${entryId}-${serverName}`
  try {
    removingServer.value = key
    await apiRequest('/api/blacklist/unassign', {
      method: 'DELETE',
      body: { username: props.user.username, server_id: serverId }
    })
    emit('removed')
    if (serverList.value.length === 1) emit('close')
  } catch (err) {
    console.error('Failed to remove from blacklist:', err)
    alert('Failed to remove from blacklist: ' + err.message)
  } finally {
    removingServer.value = null
  }
}
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

.btn-danger {
  padding: 10px 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: auto;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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