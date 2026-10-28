<template>
  <section class="content-section">
    <div class="section-header">
      <div>
        <h2>Users</h2>
        <p class="section-meta">Last synced: {{ formatDateTimeWithSeconds(lastSynced) }}</p>
      </div>
      <div class="header-actions">
        <label class="status-toggle">
          <input v-model="showEnabled" type="checkbox" />
          Show enabled
        </label>
        <label class="status-toggle">
          <input v-model="showDisabled" type="checkbox" />
          Show disabled
        </label>
        <button v-if="isAdmin" @click="$emit('sync-users')" class="btn-primary">
          Sync Users
        </button>
      </div>
    </div>

    <div v-if="!loading && !error && users && users.length > 0" class="filter-bar">
      <input
        v-model="search"
        type="search"
        class="filter-input"
        placeholder="Filter by username…"
      />
      <button v-if="search" @click="search = ''" class="btn-clear">✕ Clear</button>
      <span class="filter-count">{{ visibleUsers.length }} of {{ users.length }} user(s)</span>
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
            <th :aria-sort="ariaSort('username')">
              <button type="button" class="sort-btn" @click="toggleSort('username')">
                Username <span class="sort-indicator">{{ sortIndicator('username') }}</span>
              </button>
            </th>
            <th>Public Key</th>
            <th>Servers</th>
            <th>Created</th>
            <th :aria-sort="ariaSort('updated_at')">
              <button type="button" class="sort-btn" @click="toggleSort('updated_at')">
                Updated <span class="sort-indicator">{{ sortIndicator('updated_at') }}</span>
              </button>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in visibleUsers"
            :key="user.id"
            :class="{ 'row-disabled': isDisabled(user) }"
          >
            <td>
              <strong>{{ user.username }}</strong>
              <span v-if="isDisabled(user)" class="disabled-badge">Disabled</span>
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
          <tr v-if="visibleUsers.length === 0">
            <td colspan="6" class="no-results">No users match the current filters.</td>
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
import { ref, computed } from 'vue'

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
const search = ref('')
const showEnabled = ref(true)
const showDisabled = ref(false)
// Newest updates first by default
const sortKey = ref('updated_at')
const sortDir = ref('desc')

const isDisabled = (user) => user?.enabled === false

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'updated_at' ? 'desc' : 'asc'
  }
}

const sortIndicator = (key) => {
  if (sortKey.value !== key) return '↕'
  return sortDir.value === 'asc' ? '▲' : '▼'
}

const ariaSort = (key) => {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}

const compareUsers = (a, b) => {
  if (sortKey.value === 'username') {
    return (a.username || '').localeCompare(b.username || '', undefined, { sensitivity: 'base' })
  }
  return new Date(a.updated_at || 0) - new Date(b.updated_at || 0)
}

const visibleUsers = computed(() => {
  const term = search.value.trim().toLowerCase()
  const direction = sortDir.value === 'asc' ? 1 : -1

  return (props.users || [])
    .filter((user) => (isDisabled(user) ? showDisabled.value : showEnabled.value))
    .filter((user) => !term || (user.username || '').toLowerCase().includes(term))
    .sort((a, b) => compareUsers(a, b) * direction)
})

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

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.status-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-muted);
  cursor: pointer;
  user-select: none;
}

.status-toggle input {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

.filter-input {
  flex: 1;
  min-width: 180px;
  padding: 8px 12px;
  background: var(--surface-soft);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.filter-input::placeholder {
  color: var(--text-subtle);
}

.filter-input:focus {
  border-color: #3b82f6;
}

.btn-clear {
  padding: 8px 14px;
  background: transparent;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  white-space: nowrap;
}

.btn-clear:hover {
  background: var(--border-soft);
  color: var(--red-text);
}

.filter-count {
  font-size: 13px;
  color: var(--text-subtle);
  white-space: nowrap;
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

.sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  background: none;
  border: none;
  font: inherit;
  color: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
  cursor: pointer;
}

.sort-btn:hover {
  color: var(--text);
}

.sort-indicator {
  font-size: 11px;
  opacity: 0.8;
}

.data-table tbody tr.row-disabled {
  background: var(--row-disabled);
}

.row-disabled td {
  color: var(--text-subtle);
}

.disabled-badge {
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--border);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  vertical-align: middle;
}

.no-results {
  text-align: center;
  color: var(--text-subtle);
  padding: 32px 0;
  font-size: 14px;
}

.public-key {
  background: var(--surface-raised);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: var(--text-subtle);
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
