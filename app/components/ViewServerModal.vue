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
          <label>Aliases</label>
          <div v-if="server?.alias && server.alias.length > 0" class="aliases-list">
            <div v-for="(alias, index) in server.alias" :key="index" class="alias-item">
              {{ alias }}
            </div>
          </div>
          <div v-else class="detail-value text-muted">No aliases configured</div>
        </div>
        <div class="modal-footer">
          <button @click="$emit('close')" class="btn-primary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  server: {
    type: Object,
    default: null
  }
})

defineEmits(['close'])
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
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #334155;
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

.aliases-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alias-item {
  padding: 10px 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  font-size: 14px;
  color: #e5e7eb;
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
