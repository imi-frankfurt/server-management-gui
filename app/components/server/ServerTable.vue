<template>
  <section class="content-section">
    <div class="section-header">
      <div>
        <h2>Servers</h2>
        <p class="section-meta">Last updated: {{ formatDateTime(lastUpdated) }}</p>
      </div>
      <button v-if="isAdmin" @click="$emit('add-server')" class="btn-primary">
        Add Server
      </button>
    </div>

    <div v-if="servers && servers.length > 0" class="filter-bar">
      <input
        v-model="search"
        type="text"
        class="filter-input"
        placeholder="Search by name or IP address..."
      />
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading servers...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="$emit('retry')" class="btn-secondary">Retry</button>
    </div>

    <div v-else-if="processedServers && processedServers.length > 0" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th @click="handleSort('name')" style="cursor: pointer; user-select: none;">
              Name <span v-if="sortCol === 'name'">{{ sortAsc ? '↑' : '↓' }}</span>
            </th>
            <th @click="handleSort('ip')" style="cursor: pointer; user-select: none;">
              IP Address <span v-if="sortCol === 'ip'">{{ sortAsc ? '↑' : '↓' }}</span>
            </th>
            <th>Server ID</th>
            <th>Assigned Users</th>
            <th>Aliases</th>
            <th @click="handleSort('updated_at')" style="cursor: pointer; user-select: none;">
              Updated <span v-if="sortCol === 'updated_at'">{{ sortAsc ? '↑' : '↓' }}</span>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="server in processedServers" :key="server.id">
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
              <span class="count-text">
                {{ getAssignedUserCount(server) }} user(s)
              </span>
            </td>
            <td>
              <span v-if="server.alias && server.alias.length > 0" class="alias-count">
                {{ server.alias.length }} alias(es)
              </span>
              <span v-else class="text-muted">No aliases</span>
            </td>
            <td>
              <span class="date-text">{{ formatDate(server.updated_at) }}</span>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="$emit('view-server', server)" class="action-btn view" title="View">
                  View
                </button>
                <button @click="$emit('view-server-users', server)" class="action-btn users" title="Users">
                  Users
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

    <div v-else-if="servers && servers.length > 0 && processedServers.length === 0" class="empty-state">
      <h3>No servers found</h3>
      <p>No servers match your search criteria.</p>
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
import { ref, computed } from 'vue'

const props = defineProps({
  servers: {
    type: Array,
    default: () => []
  },
  users: {
    type: Array,
    default: () => []
  },
  lastUpdated: {
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

defineEmits(['add-server', 'view-server', 'view-server-users', 'edit-server', 'delete-server', 'retry'])

const search = ref('')
const sortCol = ref('name')
const sortAsc = ref(true)

const processedServers = computed(() => {
  let result = props.servers || []

  if (search.value.trim() !== '') {
    const term = search.value.toLowerCase()
    result = result.filter(server => {
      const name = (server.name || '').toLowerCase()
      const ip = (server.ip || '').toLowerCase()
      return name.includes(term) || ip.includes(term)
    })
  }

  result = [...result].sort((a, b) => {
    let valA = a[sortCol.value]
    let valB = b[sortCol.value]

    if (sortCol.value === 'updated_at') {
      valA = valA ? new Date(valA).getTime() : 0
      valB = valB ? new Date(valB).getTime() : 0
    } else {
      valA = (valA || '').toString().toLowerCase()
      valB = (valB || '').toString().toLowerCase()
    }

    if (valA < valB) return sortAsc.value ? -1 : 1
    if (valA > valB) return sortAsc.value ? 1 : -1
    return 0
  })

  return result
})

const handleSort = (column) => {
  if (sortCol.value === column) {
    sortAsc.value = !sortAsc.value
  } else {
    sortCol.value = column
    sortAsc.value = true
  }
}

const getAssignedUserCount = (server) => {
  if (Array.isArray(props.users) && props.users.length > 0) {
    return props.users.filter((user) =>
      (user.assigned_servers || []).some((assignedServer) => assignedServer.id === server.id)
    ).length
  }

  return server.assigned_users_count ?? server.assigned_users?.length ?? 0
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'

  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'

  try {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return dateString
  }
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

.section-meta {
  margin-top: 6px;
  font-size: 13px;
  color: #94a3b8;
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

.count-text {
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

.action-btn.view {
  color: #60a5fa;
  border-color: #1e40af;
}

.action-btn.view:hover {
  background: #1e3a8a;
  border-color: #60a5fa;
}

.action-btn.edit {
  color: #fbbf24;
  border-color: rgb(144, 58, 9);
}

.action-btn.edit:hover {
  background: #3b1a03;
  border-color: #f59e0b;
}

.action-btn.delete {
  color: #f87171;
  border-color: #7f1d1d;
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #fca5a5;
  color: #dc2626;
}

.action-btn.users {
  color: #34d399;
  border-color: #064e3b;
}

.action-btn.users:hover {
  background: #022c22;
  border-color: #10b981;
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
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  color: #e5e7eb;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.filter-input::placeholder {
  color: #6b7280;
}

.filter-input:focus {
  border-color: #3b82f6;
}
</style>
