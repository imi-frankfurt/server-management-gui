<template>
  <section class="content-section">
    <div class="section-header">
      <h2>Blacklist</h2>
    </div>
    <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading blacklist...</p>
    </div>

    <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="$emit('retry')" class="btn-secondary">Retry</button>
    </div>

    <div v-else-if="blacklists && blacklists.length > 0" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Servers</th>
            <th>Created On</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="blacklist in blacklists" :key="blacklist.id">
            <td>{{ blacklist.username }}</td>
            <td>
                <span v-if="blacklist.servers && blacklist.servers.length > 0" class="key-count">
                    {{ blacklist.servers.length }} server(s)
                </span>
                <span v-else class="text-muted">No servers</span>
            </td>
            <td>{{ formatDate(blacklist.created_at) }}</td>
            <td>
                <div class="action-buttons">
                    <button @click="$emit('view-blacklist', blacklist)" class="action-btn view" title="View">
                        View
                    </button>
                </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">
      <h3>No blacklisted items found</h3>
      <p>There are no items in the blacklist.</p>
    </div>
  </section>
</template>



<script setup>
const props = defineProps({
  blacklists: {
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
})

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