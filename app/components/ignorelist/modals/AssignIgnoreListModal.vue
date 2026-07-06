<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Assign Servers to {{ user?.username }}</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <p class="modal-description">
          Select servers to add to Ignore List this user on. Already ignored servers are marked.
        </p>

        <div v-if="availableServers.length > 0" class="servers-list">
          <div
            v-for="server in availableServers"
            :key="server.id"
            class="server-item"
            :class="{ 'already-assigned': isIgnored(server.id) }"
          >
            <label class="server-label">
              <input
                type="checkbox"
                :checked="isIgnored(server.id)"
                :disabled="isIgnored(server.id) || assigning"
                @change="toggleServer(server.id)"
                class="server-checkbox"
              />
              <div class="server-info">
                <div class="server-details">
                  <strong>{{ server.name }}</strong>
                  <code class="ip-address">{{ server.ip }}</code>
                </div>
                <span v-if="isIgnored(server.id)" class="assigned-badge">
                  Already Ignored
                </span>
              </div>
            </label>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>No servers available</p>
        </div>

        <div v-if="selectedServers.length > 0" class="selection-info">
          {{ selectedServers.length }} server(s) selected
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary" :disabled="assigning">
            Cancel
          </button>
          <button
            type="button"
            @click="handleAssign"
            class="btn-primary"
            :disabled="selectedServers.length === 0 || assigning"
          >
            {{ assigning ? 'Assigning...' : `Assign${selectedServers.length > 0 ? ` (${selectedServers.length})` : ''}` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  user: { type: Object, default: null },
  servers: { type: Array, default: () => [] },
  ignoreLists: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'assigned'])

const { apiRequest } = useApi()
const assigning = ref(false)
const selectedServers = ref([])

const availableServers = computed(() => props.servers || [])

// IDs of servers this user is already ignored on
const ignoredServerIds = computed(() => {
  if (!props.user?.username) return []
  const userEntries = props.ignoreLists.filter(b => b.username === props.user.username)
  const ignoredNames = new Set(userEntries.flatMap(e => e.servers || []))
  return props.servers
    .filter(s => ignoredNames.has(s.name))
    .map(s => s.id)
})

const isIgnored = (serverId) => ignoredServerIds.value.includes(serverId)

const toggleServer = (serverId) => {
  const index = selectedServers.value.indexOf(serverId)
  if (index > -1) {
    selectedServers.value.splice(index, 1)
  } else {
    selectedServers.value.push(serverId)
  }
}

const handleAssign = async () => {
  if (!selectedServers.value.length || !props.user?.username) return
  try {
    assigning.value = true
    for (const serverId of selectedServers.value) {
      await apiRequest('/api/ignorelist', {
        method: 'POST',
        body: { username: props.user.username, server_id: serverId }
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

watch(() => props.show, (newVal) => {
  if (!newVal) selectedServers.value = []
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

.close-btn:hover { background: #334155; }

.modal-body { padding: 24px; }

.modal-description {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 20px;
}

.servers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.server-item {
  padding: 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  transition: border-color 0.2s;
}

.server-item:hover:not(.already-assigned) { border-color: #3b82f6; }

.server-item.already-assigned { opacity: 0.6; }

.server-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.server-item.already-assigned .server-label { cursor: default; }

.server-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  flex-shrink: 0;
}

.server-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.server-details {
  display: flex;
  align-items: center;
  gap: 12px;
}

.server-details strong { color: #e5e7eb; font-size: 14px; }

.ip-address {
  font-family: 'Courier New', monospace;
  background: #1e293b;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #94a3b8;
}

.assigned-badge {
  font-size: 12px;
  color: #f59e0b;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.3);
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.selection-info {
  font-size: 13px;
  color: #3b82f6;
  margin-bottom: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  margin-top: 16px;
  border-top: 1px solid #334155;
}

.btn-secondary {
  padding: 10px 20px;
  background: #1e293b;
  color: #94a3b8;
  border: 1px solid #334155;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) { background: #334155; }

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

.btn-primary:hover:not(:disabled) { background: #2563eb; }

.btn-primary:disabled,
.btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
