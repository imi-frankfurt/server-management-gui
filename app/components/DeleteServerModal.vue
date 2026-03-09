<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Delete Server</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <div class="warning-icon">⚠️</div>
        <p class="warning-text">
          Are you sure you want to delete the server <strong>{{ server?.name }}</strong>?
        </p>
        <p class="warning-subtext">
          This action cannot be undone. All data associated with this server will be permanently removed.
        </p>
        <div class="server-details">
          <div class="detail-row">
            <span class="label">Server Name:</span>
            <span class="value">{{ server?.name }}</span>
          </div>
          <div class="detail-row">
            <span class="label">IP Address:</span>
            <span class="value">{{ server?.ip }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Server ID:</span>
            <span class="value">{{ server?.id }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="button" @click="handleDelete" class="btn-danger">
            Delete Server
          </button>
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

const emit = defineEmits(['close', 'confirm'])

const handleDelete = () => {
  emit('confirm', props.server)
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

.warning-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 16px;
}

.warning-text {
  font-size: 16px;
  color: #1e293b;
  text-align: center;
  margin-bottom: 8px;
}

.warning-subtext {
  font-size: 14px;
  color: #64748b;
  text-align: center;
  margin-bottom: 24px;
}

.server-details {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.detail-row:not(:last-child) {
  border-bottom: 1px solid #e2e8f0;
}

.detail-row .label {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
}

.detail-row .value {
  font-size: 14px;
  color: #1e293b;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
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

.btn-danger {
  padding: 10px 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #dc2626;
}
</style>
