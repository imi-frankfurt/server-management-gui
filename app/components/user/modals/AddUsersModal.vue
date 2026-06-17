<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <div>
          <h3>Edit users {{ server?.name }}</h3>
          <p class="header-sub">{{ server?.ip }}</p>
        </div>
        <button @click="$emit('close')" class="close-btn">x</button>
      </div>

      <div class="modal-body">
        <div class="filter-bar">
          <input
            v-model="search"
            type="text"
            class="filter-input"
            placeholder="Search details..."
          />
        </div>

        <div class="primary-info" v-if="allUsers.length > 0">
          <div class="primary-text">
             <span class="primary-title">Primary user (admin)</span>
                <span class="primary-value" v-if="selectedPrimaryUser">
                  {{ selectedPrimaryUser.username }}
                </span>
                <span class="primary-value empty" v-else>
                  No primary user selected
            </span>
          </div>
          <div class="action-buttons">
            <button @click="$emit('close')" class="btn-secondary">Close</button>
            <button
              type="button"
              @click="handleAssign"
              class="btn-primary"
              :disabled="!hasChanges || assigning"
            >
              {{ assigning
                ? 'Saving...'
                : `Apply${selectedUsers.length > 0 ? ` (+${selectedUsers.length} assign)` : ''}${unSelectedUsers.length > 0 ? ` (+${unSelectedUsers.length} unassign)` : ''}${isPrimarySelectionChanged ? ' (+primary)' : ''}`
              }}
            </button>
          </div>  
        </div>

        

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading users...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
        </div>

        <div v-else-if="allUsers.length > 0">
          <div v-if="filteredUsers.length === 0" class="empty-state">
            <p>No users match the current filters.</p>
          </div>

          <div
            v-for="user in filteredUsers"
            :key="user.keycloak_id"
            class="user-assign-item"
            :class="{ 'already-assigned': isUserAssignedToServer(user, props.server.id) }"
          >
            <label class="user-label">
              <input
                type="checkbox"
                :checked="isUserAssignedAfterChanges(user)"
                :disabled="assigning"
                @change="onUserCheckboxChange($event, user)"
                class="user-checkbox"
              />

              <div class="user-info">
                <div class="user-avatar">{{ user.username?.substring(0, 2).toUpperCase() || '??' }}</div>
                <div class="user-details">
                  <strong>{{ user.username }}</strong>
                  <code class="public-key">{{ formatPubKey(user.pubKey) }}</code>
                </div>

                <label class="primary-select" v-if="canBePrimary(user)">
                  <input
                    type="radio"
                    name="server-primary-user"
                    :checked="adminUserId === user.id"
                    :disabled="assigning"
                    @change="onAdminSelectionChange(user.id)"
                  />
                  <span>Primary</span>
                </label>
              </div>

              <span v-if="isUserAssignedToServer(user, props.server.id)" class="assigned-badge">
                Already Assigned
              </span>
              <span v-if="isCurrentPrimaryUser(user)" class="admin-badge">
                Current Primary
              </span>
            </label>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>No users found.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useFormatter } from '~/composables/useFormatter'
const { formatPubKey } = useFormatter()

const props = defineProps({
  show: { type: Boolean, default: false },
  server: { type: Object, default: null },
  servers: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'addUsers', 'assigned'])

const { apiRequest } = useApi()
const search = ref('')
const allUsers = ref([])
const assigning = ref(false)
const selectedUsers = ref([])
const unSelectedUsers = ref([])
const adminUserId = ref(null)
const initialAdminUserId = ref(null)
const loading = ref(false)
const error = ref('')

const getServerAssignment = (user, serverId) => {
  return (user?.assigned_servers || []).find((server) => server?.id === serverId) || null
}

const isUserAssignedToServer = (user, serverId) => {
  return Boolean(getServerAssignment(user, serverId))
}

const isUserAssignedAfterChanges = (user) => {
  if (selectedUsers.value.includes(user.id)) return true
  if (unSelectedUsers.value.includes(user.id)) return false
  return isUserAssignedToServer(user, props.server?.id)
}

const canBePrimary = (user) => {
  return isUserAssignedAfterChanges(user)
}

const isCurrentPrimaryUser = (user) => {
  return getServerAssignment(user, props.server?.id)?.primary_user === true
}

const selectedPrimaryUser = computed(() => {
  if (!adminUserId.value) return null
  return allUsers.value.find((user) => user.id === adminUserId.value) || null
})

const isFiltered = computed(() => {
  return search.value.trim() !== ''
})

const filteredUsers = computed(() => {
  if (!isFiltered.value) return allUsers.value
  const term = search.value.toLowerCase()
  return allUsers.value.filter((user) =>
    (user.username || '').toLowerCase().includes(term) ||
    (user.keycloak_id || '').toLowerCase().includes(term)
  )
})

const isPrimarySelectionChanged = computed(() => {
  return adminUserId.value !== initialAdminUserId.value
})

const hasChanges = computed(() => {
  return selectedUsers.value.length > 0 || unSelectedUsers.value.length > 0 || isPrimarySelectionChanged.value
})

const fetchAllUsers = async (serverId) => {
  try {
    assigning.value = true
    loading.value = true
    error.value = ''

    const all = await apiRequest('/api/user')
    allUsers.value = all || []

    const currentPrimary = allUsers.value.find((user) => {
      return getServerAssignment(user, serverId)?.primary_user === true
    })

    adminUserId.value = currentPrimary?.id || null
    initialAdminUserId.value = adminUserId.value
  } catch (err) {
    console.error('Failed to load users:', err)
    error.value = err.message || 'Failed to load users'
  } finally {
    loading.value = false
    assigning.value = false
  }
}

const onAdminSelectionChange = (userId) => {
  adminUserId.value = userId
}

const onUserCheckboxChange = (event, user) => {
  if (event.target.checked) {
    enableUser(user)
  } else {
    disableUser(user)
  }
}

const enableUser = (user) => {
  const unassignIdx = unSelectedUsers.value.indexOf(user.id)
  if (unassignIdx > -1) {
    unSelectedUsers.value.splice(unassignIdx, 1)
  }

  if (!isUserAssignedToServer(user, props.server.id)) {
    const assignIdx = selectedUsers.value.indexOf(user.id)
    if (assignIdx === -1) {
      selectedUsers.value.push(user.id)
    }
  } else {
    const assignIdx = selectedUsers.value.indexOf(user.id)
    if (assignIdx > -1) {
      selectedUsers.value.splice(assignIdx, 1)
    }
  }

  if (!adminUserId.value) {
    adminUserId.value = user.id
  }
}

const disableUser = (user) => {
  const assignIdx = selectedUsers.value.indexOf(user.id)
  if (assignIdx > -1) {
    selectedUsers.value.splice(assignIdx, 1)
  }

  if (isUserAssignedToServer(user, props.server.id)) {
    const unassignIdx = unSelectedUsers.value.indexOf(user.id)
    if (unassignIdx === -1) {
      unSelectedUsers.value.push(user.id)
    }
  } else {
    const unassignIdx = unSelectedUsers.value.indexOf(user.id)
    if (unassignIdx > -1) {
      unSelectedUsers.value.splice(unassignIdx, 1)
    }
  }

  if (adminUserId.value === user.id) {
    adminUserId.value = null
  }
}

const getFinalAssignedUserIds = () => {
  const finalAssignedIds = new Set()

  for (const user of allUsers.value) {
    if (isUserAssignedAfterChanges(user)) {
      finalAssignedIds.add(user.id)
    }
  }

  return finalAssignedIds
}

const handleAssign = async () => {
  if (!props.server?.id) return

  const finalAssignedIds = getFinalAssignedUserIds()

  if (finalAssignedIds.size > 0 && !adminUserId.value) {
    alert('Please select one primary user for this server.')
    return
  }

  if (adminUserId.value && !finalAssignedIds.has(adminUserId.value)) {
    alert('Primary user must be assigned to this server.')
    return
  }

  try {
    assigning.value = true

    for (const userId of selectedUsers.value) {
      await apiRequest('/api/user/assign', {
        method: 'POST',
        body: {
          user_id: userId,
          server_id: props.server.id,
          primary_user: userId === adminUserId.value
        }
      })
    }

    for (const userId of unSelectedUsers.value) {
      await apiRequest('/api/user/unassign', {
        method: 'POST',
        body: {
          user_id: userId,
          server_id: props.server.id
        }
      })
    }

    if (isPrimarySelectionChanged.value) {
      for (const userId of finalAssignedIds) {
        await apiRequest(`/api/user/${userId}`, {
          method: 'PUT',
          body: {
            server_id: props.server.id,
            primary_user: userId === adminUserId.value
          }
        })
      }
    }

    emit('assigned')
    emit('close')
  } catch (err) {
    console.error('Failed to assign/unassign users:', err)
    alert('Failed to assign/unassign users: ' + err.message)
  } finally {
    assigning.value = false
  }
}

watch(() => props.show, (newVal) => {
  if (newVal && props.server?.id) {
    fetchAllUsers(props.server.id)
    selectedUsers.value = []
    unSelectedUsers.value = []
  } else if (!newVal) {
    allUsers.value = []
    selectedUsers.value = []
    unSelectedUsers.value = []
    adminUserId.value = null
    initialAdminUserId.value = null
    error.value = ''
    search.value = ''
  }
})

watch(() => props.server, (newServer) => {
  if (props.show && newServer?.id) {
    fetchAllUsers(newServer.id)
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #111827;
  border-radius: 16px;
  width: 100%;
  max-width: 760px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid #334155;
  position: sticky;
  top: 0;
  background: #111827;
  z-index: 10;
  height: 81px;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #e5e7eb;
  margin-bottom: 4px;
}

.header-sub {
  font-size: 13px;
  color: #64748b;
  font-family: 'Courier New', monospace;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #1e293b;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  color: #94a3b8;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #334155;
}

.modal-body {
  padding: 24px;
}

.primary-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;

  position: sticky;
  top: 81px;
  z-index: 9;
}

.primary-text {
  display: flex;
  align-items: center;
  gap: 12px;
}

.primary-title {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 600;
}

.primary-value {
  color: #f59e0b;
  font-size: 13px;
  font-weight: 600;
}

.primary-value.empty {
  color: #94a3b8;
  font-weight: 500;
}

.loading-state,
.empty-state,
.error-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 4px solid #1e293b;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  color: #ef4444;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-primary {
  padding: 10px 20px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 20px;
  background: #334155;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.user-assign-item {
  padding: 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  transition: border-color 0.2s;
  margin-bottom: 10px;
}

.user-assign-item:hover:not(.already-assigned) {
  border-color: #3b82f6;
}

.user-assign-item.already-assigned {
  opacity: 0.85;
}

.user-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.user-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #1d4ed8;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.user-details strong {
  font-size: 14px;
  color: #e5e7eb;
}

.public-key{
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #64748b;
  background: #1e293b;
  padding: 2px 6px;
  border-radius: 4px;
}

.primary-select {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #f59e0b;
  font-size: 12px;
  font-weight: 600;
}

.primary-select input {
  accent-color: #f59e0b;
}

.assigned-badge {
  font-size: 12px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.admin-badge {
  font-size: 12px;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.35);
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
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