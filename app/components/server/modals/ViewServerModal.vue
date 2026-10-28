<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Server Details</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <div class="detail-group">
          <label>Server Name</label>
          <div class="detail-value">{{ server?.name || 'N/A' }}</div>
        </div>
        <div class="detail-group">
          <label>IP Address</label>
          <div class="detail-value">
            <code class="ip-address">{{ server?.ip || 'N/A' }}</code>
          </div>
        </div>
        <div class="detail-group">
          <label>Server ID</label>
          <div class="detail-value">{{ server?.id || 'N/A' }}</div>
        </div>
        <div class="detail-group">
          <label>Assigned Users</label>
          <div class="detail-value">{{ assignedUserCount }}</div>
        </div>
        <div class="detail-group">
          <label>Aliases</label>
          <div v-if="server?.alias && server.alias.length > 0" class="aliases-list">
            <div v-for="(alias, index) in server.alias" :key="index" class="alias-item">
              {{ alias }}
            </div>
          </div>
          <div v-else class="detail-value text-muted">No aliases configured</div>
        </div>
        <div class="detail-group">
          <label>Updated At</label>
          <div class="detail-value">{{ formatDateTime(server?.updated_at) }}</div>
        </div>
        <div class="modal-footer">
          <button @click="$emit('close')" class="btn-primary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFormatter } from '~/composables/useFormatter'
const { formatDateTime } = useFormatter()
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  server: {
    type: Object,
    default: null
  },
  users: {
    type: Array,
    default: () => []
  }
})

defineEmits(['close'])

const assignedUserCount = computed(() => {
  if (!props.server?.id) return 0

  if (Array.isArray(props.users) && props.users.length > 0) {
    return props.users.filter((user) =>
      (user.assigned_servers || []).some((assignedServer) => assignedServer.id === props.server.id)
    ).length
  }

  return props.server?.assigned_users_count ?? props.server?.assigned_users?.length ?? 0
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
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border);
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

.detail-group {
  margin-bottom: 24px;
}

.detail-group:last-child {
  margin-bottom: 0;
}

.detail-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-subtle);
  margin-bottom: 8px;
}

.detail-value {
  padding: 12px;
  background: var(--surface-sunken);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text);
}

.ip-address {
  font-family: 'Courier New', monospace;
  background: var(--surface-raised);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.text-muted {
  color: var(--text-muted);
  font-style: italic;
}

.aliases-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alias-item {
  padding: 10px 12px;
  background: var(--surface-sunken);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text);
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  margin-top: 24px;
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

.btn-primary:hover {
  background: #2563eb;
}
</style>
