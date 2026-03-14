<template>
  <section class="content-section">
    <div class="section-header">
      <h2>Users</h2>
      <button v-if="isAdmin" @click="$emit('sync-users')" class="btn-primary">
        Sync Users
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading users...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="$emit('retry')" class="btn-secondary">Retry</button>
    </div>

    <div v-else-if="users && users.length > 0" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Keycloak ID</th>
            <th>Public Keys</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>
              <strong>{{ user.username }}</strong>
            </td>
            <td>
              <code class="keycloak-id">{{ formatKeycloakId(user.keycloak_id) }}</code>
            </td>
            <td>
              <span v-if="user.pubKey && user.pubKey.length > 0" class="key-count">
                {{ user.pubKey.length }} key(s)
              </span>
              <span v-else class="text-muted">No keys</span>
            </td>
            <td>
              <span class="date-text">{{ formatDate(user.created_at) }}</span>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="$emit('view-user', user)" class="action-btn view" title="View">
                  View
                </button>
                <button v-if="isAdmin" @click="$emit('assign-user', user)" class="action-btn edit" title="Assign">
                  Assign
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">
      <h3>No users found</h3>
      <p>Sync users from Keycloak to get started</p>
      <button v-if="isAdmin" @click="$emit('sync-users')" class="btn-primary">
        Sync Users
      </button>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  users: {
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

defineEmits(['sync-users', 'view-user', 'assign-user', 'retry'])

const formatKeycloakId = (id) => {
  if (!id) return 'N/A'
  return id.length > 16 ? `${id.substring(0, 16)}...` : id
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}
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

.keycloak-id {
  background: #1e293b;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: #64748b;
}

.key-count {
  color: #94a3b8;
  font-size: 14px;
}

.date-text {
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
