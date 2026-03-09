<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Edit Server</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label>Server Name</label>
          <input 
            v-model="formData.name" 
            type="text" 
            placeholder="e.g., Production Server" 
            required 
          />
        </div>
        <div class="form-group">
          <label>IP Address</label>
          <input 
            v-model="formData.ip" 
            type="text" 
            placeholder="e.g., 192.168.1.1" 
            required 
          />
        </div>
        <div class="form-group">
          <label>Aliases (comma-separated)</label>
          <input 
            v-model="aliasInput" 
            type="text" 
            placeholder="e.g., prod, production, main" 
            @input="checkDuplicateAliases"
          />
          <small class="help-text">Separate multiple aliases with commas</small>
          <div v-if="duplicateAliases.length > 0" class="error-message">
            <strong>Duplicate aliases found:</strong>
            <div v-for="dup in duplicateAliases" :key="dup.alias" class="duplicate-item">
              "{{ dup.alias }}" already used by server "{{ dup.serverName }}"
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn-primary"
            :disabled="duplicateAliases.length > 0"
          >
            Update Server
          </button>
        </div>
      </form>
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
  server: {
    type: Object,
    default: null
  },
  servers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  name: '',
  ip: '',
  alias: []
})

const aliasInput = ref('')
const duplicateAliases = ref([])

const checkDuplicateAliases = () => {
  const aliases = aliasInput.value
    .split(',')
    .map(a => a.trim())
    .filter(a => a.length > 0)
  
  duplicateAliases.value = []
  
  // Check each alias against all servers (except current one)
  aliases.forEach(alias => {
    props.servers.forEach(server => {
      // Skip the current server being edited
      if (server.id === props.server?.id) return
      
      // Check if this server has the alias
      if (server.alias && server.alias.includes(alias)) {
        duplicateAliases.value.push({
          alias: alias,
          serverName: server.name
        })
      }
    })
  })
}

const handleSubmit = () => {
  // Convert comma-separated string to array
  const aliases = aliasInput.value
    .split(',')
    .map(a => a.trim())
    .filter(a => a.length > 0)
  
  emit('submit', {
    ...formData.value,
    alias: aliases
  })
}

// Populate form when server prop changes
watch(() => props.server, (newServer) => {
  if (newServer) {
    formData.value = {
      name: newServer.name || '',
      ip: newServer.ip || '',
      alias: newServer.alias || []
    }
    // Convert array to comma-separated string
    aliasInput.value = (newServer.alias || []).join(', ')
  }
}, { immediate: true })

// Reset form when modal is closed
watch(() => props.show, (newVal) => {
  if (!newVal) {
    formData.value = {
      name: '',
      ip: '',
      alias: []
    }
    aliasInput.value = ''
    duplicateAliases.value = []
  } else {
    // Check for duplicates when modal opens
    checkDuplicateAliases()
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
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f1f5f9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  color: #64748b;
}

.close-btn:hover {
  background: #e2e8f0;
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
  font-weight: 500;
  color: #475569;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.help-text {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.error-message {
  margin-top: 8px;
  padding: 10px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 13px;
  color: #991b1b;
}

.error-message strong {
  display: block;
  margin-bottom: 6px;
}

.duplicate-item {
  margin-top: 4px;
  padding-left: 8px;
  border-left: 2px solid #ef4444;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
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
  background: #94a3b8;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-secondary {
  padding: 10px 20px;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e2e8f0;
}
</style>
