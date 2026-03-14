<template>
  <section class="content-section">
    <div class="section-header">
      <h2>Servers</h2>
      <button v-if="isAdmin" @click="$emit('add-server')" class="btn-primary">
        Add Server
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading servers...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="$emit('retry')" class="btn-secondary">Retry</button>
    </div>

    <div v-else-if="servers && servers.length > 0" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>IP Address</th>
            <th>Server ID</th>
            <th>Aliases</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="server in servers" :key="server.id">
            <td>
              <strong>{{ server.name }}</strong>
            </td>
            <td>
              <code class="ip-address">{{ server.ip }}</code>
            </td>
            <td>
              <span class="ip-address">{{ server.id }}</span>
            </td>
            <td>
              <span v-if="server.alias && server.alias.length > 0" class="alias-count">
                {{ server.alias.length }} alias(es)
              </span>
              <span v-else class="text-muted">No aliases</span>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="$emit('view-server', server)" class="action-btn view" title="View">
                  View
                </button>
                <button v-if="isAdmin" @click="$emit('edit-server', server)" class="action-btn edit" title="Edit">
                  Edit
                </button>
                <button v-if="isAdmin" @click="$emit('delete-server', server)" class="action-btn delete" title="Delete">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">
      <h3>No servers found</h3>
      <p>Add your first server to get started</p>
      <button v-if="isAdmin" @click="$emit('add-server')" class="btn-primary">
        Add Server
      </button>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  servers: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
})

defineEmits(['add-server', 'view-server', 'edit-server', 'delete-server', 'retry'])
</script>

<style scoped>
.content-section {
  background: #111827;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #e5e7eb;
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

.btn-secondary {
  padding: 10px 20px;
  background: #1e293b;
  color: #64748b;
  border: 1px solid #334155;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #334155;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #0f172a;
  border-bottom: 2px solid #334155;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid #1e293b;
}

.data-table tbody tr:hover {
  background: #0f172a;
}

.ip-address {
  background: #1e293b;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-family: 'Courier New', monospace;
  color: #64748b;
}


.alias-count {
  color: #94a3b8;
  font-size: 14px;
}

.text-muted {
  color: #94a3b8;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #334155;
  background: #111827;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #0f172a;
  border-color: #64748b;
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #fca5a5;
  color: #dc2626;
}

.loading-state, .empty-state, .error-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.loading-state .spinner {
  border: 4px solid #1e293b;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state h3 {
  color: #e5e7eb;
  margin-bottom: 8px;
}
</style>
