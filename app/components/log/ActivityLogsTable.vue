<template>
  <section class="content-section">
    <div class="section-header">
      <div>
        <h2>Activity Logs</h2>
        <p class="section-meta">{{ logs?.length || 0 }} record(s)</p>
      </div>
      <button @click="$emit('retry')" class="btn-refresh">
        ↻ Refresh
      </button>
    </div>

    <div class="filter-bar">
      <input
        v-model="search"
        type="text"
        class="filter-input"
        placeholder="Search details…"
      />
      <select v-model="filterAction" class="filter-select">
        <option value="">All actions</option>
        <option v-for="a in availableActions" :key="a" :value="a">{{ a }}</option>
      </select>
      <select v-model="filterResource" class="filter-select">
        <option value="">All resources</option>
        <option v-for="r in availableResources" :key="r" :value="r">{{ formatResource(r) }}</option>
      </select>
      <button v-if="isFiltered" @click="clearFilters" class="btn-clear">✕ Clear</button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading logs...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="$emit('retry')" class="btn-secondary">Retry</button>
    </div>

    <div v-else-if="logs && logs.length > 0" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Resource</th>
            <th>Details</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredLogs.length === 0">
            <td colspan="6" class="no-results">No logs match the current filters.</td>
          </tr>
          <tr v-for="log in filteredLogs" :key="log.id">
            <td class="id-cell">{{ log.id }}</td>
            <td class="actor-cell">{{ log.actor || 'System' }}</td>
            <td>
              <span :class="['action-badge', `action-${log.action}`]">
                {{ log.action }}
              </span>
            </td>
            <td>
              <span :class="['resource-badge', `resource-${log.resource}`]">
                {{ formatResource(log.resource) }}
              </span>
            </td>
            <td class="details-cell">
              <span v-for="(part, index) in parseDetails(log.details)" :key="index" class="detail-part">
                <span class="detail-key">{{ part.key }}</span>
                <span class="detail-sep">=</span>
                <span class="detail-value">{{ part.value }}</span>
                <span v-if="index < parseDetails(log.details).length - 1" class="detail-divider"> · </span>
              </span>
            </td>
            <td class="date-text">{{ formatDateTimeWithSeconds(log.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">
      <h3>No activity logs found</h3>
      <p>Activity will appear here as actions are performed.</p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFormatter } from '~/composables/useFormatter'
const { formatDateTimeWithSeconds, formatResource } = useFormatter()
const props = defineProps({
  logs: {
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
  }
})

defineEmits(['retry'])

const search = ref('')
const filterAction = ref('')
const filterResource = ref('')

const availableActions = computed(() => {
  return [...new Set((props.logs || []).map((l) => l.action).filter(Boolean))].sort()
})

const availableResources = computed(() => {
  return [...new Set((props.logs || []).map((l) => l.resource).filter(Boolean))].sort()
})

const isFiltered = computed(() => {
  return search.value.trim() !== '' || filterAction.value !== '' || filterResource.value !== ''
})

const filteredLogs = computed(() => {
  let result = props.logs || []
  if (filterAction.value) {
    result = result.filter((l) => l.action === filterAction.value)
  }
  if (filterResource.value) {
    result = result.filter((l) => l.resource === filterResource.value)
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    result = result.filter((l) =>
      (l.details || '').toLowerCase().includes(q) ||
      (l.action || '').toLowerCase().includes(q) ||
      (l.resource || '').toLowerCase().includes(q)
    )
  }
  return result
})

const clearFilters = () => {
  search.value = ''
  filterAction.value = ''
  filterResource.value = ''
}

const parseDetails = (details) => {
  if (!details) return []
  return details.split(';').map((part) => {
    const idx = part.indexOf('=')
    if (idx === -1) return { key: part, value: '' }
    return { key: part.slice(0, idx), value: part.slice(idx + 1) }
  })
}

</script>

<style scoped>
.content-section {
  background: var(--surface);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  margin: 0 0 4px 0;
}

.section-meta {
  font-size: 13px;
  color: var(--text-subtle);
  margin: 0;
}

/* Filter bar */
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

.filter-select {
  padding: 8px 12px;
  background: var(--surface-soft);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  color: var(--text);
  font-size: 14px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:focus {
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

.no-results {
  text-align: center;
  color: var(--text-subtle);
  padding: 32px 0;
  font-size: 14px;
}

.btn-refresh {
  padding: 8px 16px;
  background: var(--surface-soft);
  color: var(--text-muted);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-refresh:hover {
  background: var(--border-soft);
  color: var(--text);
}

.btn-secondary {
  padding: 8px 16px;
  background: var(--surface-soft);
  color: var(--text-muted);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-subtle);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-soft);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state p {
  color: #ef4444;
  margin-bottom: 12px;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.table-container {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid var(--surface-soft);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table thead {
  background: var(--surface-soft);
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-soft);
}

.data-table tbody tr {
  border-bottom: 1px solid var(--surface-soft);
  transition: background 0.15s;
}

.data-table tbody tr:hover {
  background: var(--row-hover);
}

.data-table td {
  padding: 12px 16px;
  color: var(--text-soft);
  vertical-align: middle;
}

.id-cell {
  color: var(--text-subtle);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.actor-cell {
  color: var(--text);
  font-weight: 500;
  font-size: 13px;
}

/* Action badges */
.action-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.action-post   { background: rgba(59, 130, 246, 0.15); color: var(--blue-text); border: 1px solid rgba(59, 130, 246, 0.3); }
.action-put    { background: rgba(245, 158, 11, 0.15); color: var(--amber-text); border: 1px solid rgba(245, 158, 11, 0.3); }
.action-delete { background: rgba(239, 68, 68, 0.15);  color: var(--red-text); border: 1px solid rgba(239, 68, 68, 0.3); }
.action-sync   { background: rgba(16, 185, 129, 0.15); color: var(--green-text); border: 1px solid rgba(16, 185, 129, 0.3); }
.action-get    { background: rgba(139, 92, 246, 0.15); color: var(--violet-text); border: 1px solid rgba(139, 92, 246, 0.3); }

/* Resource badges */
.resource-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  background: var(--surface-soft);
  color: var(--text-muted);
  border: 1px solid var(--border-soft);
}

.resource-server          { color: var(--blue-text); border-color: rgba(59, 130, 246, 0.3); background: rgba(59, 130, 246, 0.08); }
.resource-user            { color: var(--violet-text); border-color: rgba(139, 92, 246, 0.3); background: rgba(139, 92, 246, 0.08); }
.resource-user_assignment { color: var(--green-text); border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.08); }
.resource-user_unassign   { color: var(--amber-text); border-color: rgba(245, 158, 11, 0.3);  background: rgba(245, 158, 11, 0.08); }
.resource-ignorelist       { color: var(--red-text); border-color: rgba(239, 68, 68, 0.3);   background: rgba(239, 68, 68, 0.08); }

/* Details */
.details-cell {
  font-size: 13px;
}

.detail-key {
  color: var(--text-subtle);
  font-family: monospace;
}

.detail-sep {
  color: var(--border-strong);
}

.detail-value {
  color: var(--text-soft);
  font-family: monospace;
}

.detail-divider {
  color: var(--border-soft);
  margin: 0 4px;
}

.date-text {
  color: var(--text-subtle);
  font-size: 13px;
  white-space: nowrap;
}
</style>
