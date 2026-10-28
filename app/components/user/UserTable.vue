<template>
  <section class="content-section">
    <div class="section-header">
      <div>
        <h2>Users</h2>
        <p class="section-meta">Last synced: {{ formatDateTimeWithSeconds(lastSynced) }}</p>
      </div>
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
            <th>Public Key</th>
            <th>Servers</th>
            <th>Public Keys</th>
            <th>Created</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>
              <strong>{{ user.username }}</strong>
            </td>
            <td>
              <code class="public-key">{{ formatPubKey(user.pubKey) }}</code>
            </td>
            <td>
              <div class="server-assignment">
                <span class="server-count">
                  {{ user.assigned_servers_count ?? user.assigned_servers?.length ?? 0 }} server(s)
                </span>
                <span class="role-count admin">Admin: {{ getPrimaryServerCount(user) }}</span>
              </div>
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
              <span class="date-text">{{ formatDate(user.updated_at) }}</span>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="$emit('view-user', user)" class="action-btn view" title="View">
                  View
                </button>
                <button v-if="isAdmin" @click="$emit('assign-user', user)" class="action-btn assign" title="Assign">
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
  lastSynced: {
    type: String,
    default: ''
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
import { useFormatter } from '~/composables/useFormatter'
const { formatPubKey, formatDate, formatDateTimeWithSeconds } = useFormatter()

defineEmits(['sync-users', 'view-user', 'assign-user', 'retry'])
const getPrimaryServerCount = (user) => {
  if (!Array.isArray(user?.assigned_servers) || user.assigned_servers.length === 0) return 0
  return user.assigned_servers.filter((server) => server?.primary_user === true).length
}
</script>

<style scoped>
.content-section {
  background: var(--surface);
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
  color: var(--text);
}

.section-meta {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-muted);
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
  background: var(--surface-raised);
  color: var(--text-subtle);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--border);
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: var(--surface-sunken);
  border-bottom: 2px solid var(--border);
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid var(--surface-raised);
}

.data-table tbody tr:hover {
  background: var(--surface-sunken);
}

.public-key {
  background: var(--surface-raised);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: var(--text-subtle);
}

.key-count {
  color: var(--text-muted);
  font-size: 14px;
}

.server-count {
  color: var(--text-muted);
  font-size: 14px;
}

.server-assignment {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.role-count {
  font-size: 12px;
  line-height: 1.4;
}

.role-count.admin {
  color: var(--blue-text);
}

.date-text {
  color: var(--text-muted);
  font-size: 14px;
}

.text-muted {
  color: var(--text-muted);
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--surface-sunken);
  border-color: var(--text-subtle);
}

.action-btn.view {
  color: var(--blue-text);
  border-color: var(--blue-border);
}

.action-btn.view:hover {
  background: var(--blue-tint);
  border-color: var(--blue-text);
}

.action-btn.assign {
  color: var(--violet-text);
  border-color: var(--violet-border);
}

.action-btn.assign:hover {
  background: var(--violet-tint);
  border-color: #7c3aed;
}

.loading-state, .empty-state, .error-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.loading-state .spinner {
  border: 4px solid var(--surface-raised);
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
  color: var(--text);
  margin-bottom: 8px;
}
</style>
