<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Add to Ignore List</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>Username</label>
          <input
            v-model="formData.username"
            type="text"
            placeholder="e.g., test-user"
          />
        </div>

        <div class="form-group">
          <label>Server</label>
          <input
            v-model="serverSearch"
            type="text"
            class="search-input"
            placeholder="Search servers..."
          />
          <div class="server-list">
            <div v-if="filteredServers.length === 0" class="empty-state">
              No servers match your search.
            </div>
            <div
              v-for="server in filteredServers"
              :key="server.id"
              class="server-item"
              :class="{ selected: formData.server_id === server.id }"
              @click="formData.server_id = server.id"
            >
              <div class="server-item-info">
                <strong>{{ server.name }}</strong>
                <code class="server-ip">{{ server.ip }}</code>
              </div>
              <UIcon v-if="formData.server_id === server.id" name="i-lucide-check" class="check-icon" />
            </div>
          </div>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
          <button
            type="button"
            class="btn-primary"
            :disabled="submitting || !formData.username || !formData.server_id"
            @click="handleSubmit"
          >
            {{ submitting ? 'Adding...' : 'Add to Ignore List' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  servers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'added'])

const { apiRequest } = useApi()

const formData = ref({ username: '', server_id: '' })
const submitting = ref(false)
const error = ref('')
const serverSearch = ref('')

const filteredServers = computed(() => {
  const term = serverSearch.value.toLowerCase().trim()
  if (!term) return props.servers
  return props.servers.filter(
    (s) =>
      s.name.toLowerCase().includes(term) ||
      s.ip.toLowerCase().includes(term)
  )
})

const handleSubmit = async () => {
  try {
    submitting.value = true
    error.value = ''
    await apiRequest('/api/ignorelist', {
      method: 'POST',
      body: {
        username: formData.value.username,
        server_id: formData.value.server_id
      }
    })
    emit('added')
    emit('close')
  } catch (err) {
    error.value = err.message || 'Failed to add user to Ignore List'
  } finally {
    submitting.value = false
  }
}

watch(() => props.show, (newVal) => {
  if (!newVal) {
    formData.value = { username: '', server_id: '' }
    error.value = ''
    serverSearch.value = ''
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #111827;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  font-size: 14px;
  color: #e5e7eb;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #3b82f6;
}

.form-group input::placeholder {
  color: #4b5563;
}

.search-input {
  margin-bottom: 8px;
}

.server-list {
  border: 1px solid #334155;
  border-radius: 8px;
  max-height: 220px;
  overflow-y: auto;
  background: #0f172a;
}

.server-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid #1e293b;
  transition: background 0.15s;
}

.server-item:last-child {
  border-bottom: none;
}

.server-item:hover {
  background: #1e293b;
}

.server-item.selected {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.2);
}

.server-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.server-item-info strong {
  font-size: 14px;
  color: #e5e7eb;
}

.server-ip {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #64748b;
  background: #1e293b;
  padding: 1px 6px;
  border-radius: 4px;
  width: fit-content;
}

.check-icon {
  color: #3b82f6;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #64748b;
  font-size: 13px;
}

.error-message {
  color: #ef4444;
  font-size: 14px;
  margin-bottom: 16px;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  margin-top: 4px;
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

.btn-secondary:hover {
  background: #334155;
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
  opacity: 0.6;
  cursor: not-allowed;
}
</style>