<template>
  <section class="content-section">
    <div class="section-header">
      <h2>Ansible logs</h2>
      <button class="btn-refresh" @click="$emit('retry')">
          ↻ Refresh
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading Ansible Logs...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="$emit('retry')" class="btn-secondary">Retry</button>
    </div>

    <div v-else-if="ansibleLogs && ansibleLogs.length > 0" class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Actor</th>
            <th>Hash</th>
            <th>Last called</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="log in sortedLogs" :key="log.id">
            <tr class="main-row">
              <td>
                <span class="system-label">system</span>
              </td>

              <td>
                <span class="hash-chip" :title="log.content_hash">
                  {{ log.content_hash ? log.content_hash.slice(0, 10) : '—' }}
                </span>
              </td>

              <td class="date-cell">
                {{ latestQuery(log.queries) ? formatDateTimeWithSeconds(latestQuery(log.queries).created_at) : '—' }}
              </td>

              <td class="actions-cell">
                <div class="actions">
                  <button class="btn-json" @click="openJsonModal(log)" title="JSON anzeigen">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                      <path d="M5 3H4a2 2 0 0 0-2 2v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a2 2 0 0 0 2 2h1M11 3h1a2 2 0 0 1 2 2v1a1 1 0 0 0 1 1 1 1 0 0 0-1 1v1a2 2 0 0 1-2 2h-1"/>
                    </svg>
                    JSON
                  </button>

                  <button
                    :class="['btn-hist', { active: openHist === log.id }]"
                    @click="toggleHist(log.id)"
                  >
                    History
                    <span class="hist-count-badge">{{ log.queries.length > 99 ? '99+' : log.queries.length }}</span>
                    <svg
                      :class="['chevron', { open: openHist === log.id }]"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <polyline points="2,4 6,8 10,4"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>

            <!-- History expand row -->
            <tr v-if="openHist === log.id" class="expand-row">
              <td colspan="4">
                <div class="expand-inner">
                  <div class="history-list">
                    <div
                      v-for="(query, index) in sortedQueries(log.queries)"
                      :key="query.id"
                      :class="['hist-item', { first: index === 0 }]"
                    >
                      <span class="hist-dot"></span>
                      <span class="hist-ts">{{ formatDateTimeWithSeconds(query.created_at) }}</span>
                      <span v-if="index === 0" class="hist-latest-badge">latest</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">
      <h3>No Ansible Logs found</h3>
      <p>There are no logs available.</p>
    </div>

    <!-- JSON Modal -->
    <Teleport to="body">
      <div v-if="modalLog" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">JSON Data</span>
            <div class="modal-header-actions">
              <button class="btn-copy" @click="copyJson" aria-label="Copy JSON">
                <svg v-if="!copied" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="5" y="5" width="9" height="9" rx="1.5"/>
                  <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/>
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#3fb950" stroke-width="2">
                  <polyline points="3,8 6,11 13,4"/>
                </svg>
                {{ copied ? 'Copied!' : 'Copy' }}
              </button>
              <button class="modal-close" @click="closeModal" aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3l10 10M13 3L3 13"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="modal-body">
            <textarea class="json-textarea" readonly :value="JSON.stringify(modalLog.json_data, null, 2)"></textarea>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFormatter } from '~/composables/useFormatter'

const { formatDateTimeWithSeconds } = useFormatter()

defineEmits(['retry', 'refresh'])

const props = defineProps({
  ansibleLogs: {
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

const sortedLogs = computed(() => {
  if (!props.ansibleLogs?.length) return []
  return [...props.ansibleLogs].sort((a, b) => {
    const aLatest = a.queries?.length ? Math.max(...a.queries.map(q => new Date(q.created_at))) : 0
    const bLatest = b.queries?.length ? Math.max(...b.queries.map(q => new Date(q.created_at))) : 0
    return bLatest - aLatest
  })
})

const openHist = ref(null)
const modalLog = ref(null)
const copied = ref(false)

function sortedQueries(queries) {
  if (!queries?.length) return []
  return [...queries].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

function latestQuery(queries) {
  if (!queries?.length) return null
  return queries.reduce((latest, q) =>
    new Date(q.created_at) > new Date(latest.created_at) ? q : latest
  )
}

function toggleHist(id) {
  openHist.value = openHist.value === id ? null : id
}

function openJsonModal(log) {
  modalLog.value = log
  copied.value = false
}

function closeModal() {
  modalLog.value = null
  copied.value = false
}

async function copyJson() {
  if (!modalLog.value) return
  await navigator.clipboard.writeText(JSON.stringify(modalLog.value.json_data, null, 2))
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<style scoped>
.content-section {
  background: #111827;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 15px;
  font-weight: 500;
  color: #e5e7eb;
}

.btn-refresh {
  padding: 8px 16px;
  background: #1f2937;
  color: #9ca3af;
  border: 1px solid #374151;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-refresh:hover {
  background: #374151;
  color: #e5e7eb;
}


.table-wrap {
  border: 1px solid #1e293b;
  border-radius: 10px;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.data-table thead { background: #0f172a; }

.data-table th {
  padding: 10px 16px;
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  border-bottom: 1px solid #1e293b;
}

.data-table th:nth-child(1) { width: 20%; }
.data-table th:nth-child(2) { width: 22%; }
.data-table th:nth-child(3) { width: 28%; }
.data-table th:nth-child(4) { width: 30%; }

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #1e293b;
  vertical-align: middle;
  text-align: center;
}

.main-row td { transition: background 0.1s; }
.main-row:hover td { background: #0f172a; }

.system-label {
  font-size: 13px;
  font-weight: 500;
  color: #f1f5f9;
}

.hash-chip {
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #64748b;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 5px;
  padding: 2px 7px;
  cursor: default;
  user-select: all;
}

.date-cell {
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #cbd5e1;
}

.actions-cell {
  text-align: center;
}

.actions {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

.btn-json {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 6px;
  padding: 4px 9px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.btn-json:hover {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.btn-hist {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 4px 9px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.btn-hist:hover,
.btn-hist.active {
  background: #0f172a;
  border-color: #475569;
}

.hist-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 20px;
  padding: 0 6px;
  min-width: 18px;
  height: 16px;
  line-height: 1;
}

.chevron {
  width: 12px;
  height: 12px;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}
.chevron.open { transform: rotate(180deg); }

/* History */
.expand-row td {
  padding: 0;
  background: #0b1120;
  border-bottom: 1px solid #1e293b;
}

.expand-inner { padding: 12px 16px; }

.history-list {
  display: flex;
  flex-direction: column;
}

.hist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid #1a2540;
}
.hist-item:last-child { border-bottom: none; }

.hist-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #334155;
  flex-shrink: 0;
}
.hist-item.first .hist-dot { background: #3b82f6; }

.hist-ts {
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #94a3b8;
}
.hist-item.first .hist-ts { color: #e2e8f0; font-weight: 500; }

.hist-latest-badge {
  font-size: 10px;
  font-weight: 500;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 20px;
  padding: 1px 7px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal {
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 14px;
  width: 100%;
  max-width: 640px;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #1e293b;
  flex-shrink: 0;
}

.modal-title {
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}
.btn-copy:hover { background: #0f172a; color: #e2e8f0; }

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid #1e293b;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.modal-close:hover { background: #1e293b; color: #e2e8f0; }

.modal-body {
  flex: 1;
  overflow: hidden;
  padding: 0;
  display: flex;
}

.json-textarea {
  width: 100%;
  height: 100%;
  min-height: 360px;
  background: #0b1120;
  color: #e2e8f0;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  line-height: 1.6;
  border: none;
  outline: none;
  resize: none;
  padding: 16px;
  cursor: default;
}

/* Loading / empty / error */
.loading-state, .empty-state, .error-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.loading-state .spinner {
  border: 3px solid #1e293b;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

.empty-state h3 {
  color: #e5e7eb;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 6px;
}

.btn-secondary {
  margin-top: 12px;
  padding: 6px 14px;
  font-size: 13px;
  color: #94a3b8;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-secondary:hover { background: #0f172a; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>