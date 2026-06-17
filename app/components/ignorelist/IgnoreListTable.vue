<template>
  <section class="content-section">
    <div class="section-header">
      <h2>Ignore List</h2>
      <button v-if="isAdmin" @click="$emit('add-ignore-list')" class="btn-add">+ Add to Ignore List</button>
    </div>
    <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading Ignore List...</p>
    </div>

    <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="$emit('retry')" class="btn-secondary">Retry</button>
    </div>

    <div v-else-if="ignoreLists && ignoreLists.length > 0" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Servers</th>
            <th>Created On</th>
            <th>Updated On</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="group in groupedIgnoreLists" :key="group.username">
            <td>{{ group.username }}</td>
            <td>
                <span v-if="group.totalServers > 0" class="key-count">
                    {{ group.totalServers }} server(s)
                </span>
                <span v-else class="date-text">No servers</span>
            </td>
            <td class="date-text">{{ formatDate(group.created_at) }}</td>
            <td class="date-text">{{ formatDate(group.updated_at) }}</td>
            <td>
                <div class="action-buttons">
                    <button @click="$emit('view-ignore-list', group.firstEntry)" class="action-btn view" title="View">
                        View
                    </button>
                    <button v-if="isAdmin" @click="$emit('assign-ignore-list', group.firstEntry)" class="action-btn assign" title="Assign">
                        Assign
                    </button>
                </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">
      <h3>No Ignore Listed items found</h3>
      <p>There are no items in the Ignore List.</p>
    </div>
  </section>
</template>



<script setup>
import { computed } from 'vue'
import { useFormatter } from '~/composables/useFormatter'
const { formatDate } = useFormatter()

defineEmits(['add-ignore-list', 'view-ignore-list', 'assign-ignore-list', 'retry'])

const props = defineProps({
  ignoreLists: {
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

// Merge entries with the same username into one row
const groupedIgnoreLists = computed(() => {
  const map = new Map()
  for (const entry of (props.ignoreLists || [])) {
    if (map.has(entry.username)) {
      const group = map.get(entry.username)
      group.totalServers += (entry.servers?.length || 0)
      if (new Date(entry.updated_at || 0) > new Date(group.updated_at || 0)) {
        group.updated_at = entry.updated_at
      }
    } else {
      map.set(entry.username, {
        username: entry.username,
        totalServers: entry.servers?.length || 0,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        firstEntry: entry
      })
    }
  }
  return [...map.values()]
})

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

.btn-add {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add:hover {
  background: #2563eb;
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

.action-btn.assign {
  color: #a78bfa;
  border-color: #4c1d95;
}

.action-btn.assign:hover {
  background: #2e1065;
  border-color: #7c3aed;
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

.date-text {
  color: #94a3b8;
  font-size: 14px;
}

.detail-group {
  margin-bottom: 24px;
}

.detail-group:last-of-type {
  margin-bottom: 0;
}

.detail-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.key-count {
  color: #94a3b8;
  font-size: 14px;
}

.detail-value {
  padding: 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  font-size: 14px;
  color: #e5e7eb;
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