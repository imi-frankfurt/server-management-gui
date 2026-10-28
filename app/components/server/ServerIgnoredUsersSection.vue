<template>
  <div class="ignored-section">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading ignored usernames...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchIgnored()" class="btn-retry">Retry</button>
    </div>

    <template v-else>
      <div v-if="ignoredUsers.length > 0" class="ignored-list">
        <div
          v-for="entry in ignoredUsers"
          :key="entry.username"
          class="ignored-item"
          :title="entry.created_at ? `Ignored since ${formatDateTime(entry.created_at)}` : undefined"
        >
          <code class="ignored-name">{{ entry.username }}</code>
          <button
            v-if="isAdmin"
            @click="removeUsername(entry.username)"
            class="btn-remove"
            :disabled="busy"
          >
            {{ removingUsername === entry.username ? 'Removing...' : 'Remove' }}
          </button>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>No usernames are ignored on this server.</p>
      </div>

      <div v-if="isAdmin" class="add-form">
        <div class="add-row">
          <input
            ref="usernameInput"
            v-model="newUsername"
            type="text"
            placeholder="e.g., backup-user"
            :disabled="busy"
            @keydown.enter.prevent="addUsername"
          />
          <button
            @click="addUsername"
            class="btn-add"
            :disabled="busy || !newUsername.trim()"
          >
            {{ adding ? 'Adding...' : 'Add' }}
          </button>
        </div>
        <p v-if="validationError" class="validation-error">{{ validationError }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { useFormatter } from '~/composables/useFormatter'

const props = defineProps({
  server: { type: Object, default: null },
  isAdmin: { type: Boolean, default: false },
  active: { type: Boolean, default: false }
})

// Letters (any case), digits, ".", "_" and "-" (not leading), optional trailing "$".
// Deliberately permissive so AD/SSSD names like "john.doe" or "Admin" are accepted.
const USERNAME_PATTERN = /^[A-Za-z0-9._][A-Za-z0-9._-]*\$?$/
const USERNAME_MAX_LENGTH = 32

const { apiRequest } = useApi()
const { toast } = useToast()
const { formatDateTime } = useFormatter()

const entries = ref([])
const loading = ref(false)
const error = ref('')
const newUsername = ref('')
const validationError = ref('')
const adding = ref(false)
const removingUsername = ref(null)
const usernameInput = ref(null)

const busy = computed(() => adding.value || removingUsername.value !== null)

// The API lists the servers of an entry by name; accept {id, name} objects too.
const matchesServer = (entryServer) => {
  if (!props.server) return false
  if (entryServer && typeof entryServer === 'object') {
    if (entryServer.id != null && props.server.id != null) return entryServer.id === props.server.id
    return entryServer.name === props.server.name
  }
  return entryServer === props.server.name
}

// One row per username (sorted, deduplicated), keeping the earliest created_at
const ignoredUsers = computed(() => {
  const map = new Map()
  for (const entry of entries.value) {
    if (!entry?.username || !(entry.servers || []).some(matchesServer)) continue
    const existing = map.get(entry.username)
    if (!existing) {
      map.set(entry.username, { username: entry.username, created_at: entry.created_at })
    } else if (entry.created_at && (!existing.created_at || new Date(entry.created_at) < new Date(existing.created_at))) {
      existing.created_at = entry.created_at
    }
  }
  return [...map.values()].sort((a, b) => a.username.localeCompare(b.username))
})

// Initial load shows the full loading state; a refresh after a change keeps
// the list and form mounted and leaves the current list in place on failure.
const fetchIgnored = async ({ refresh = false } = {}) => {
  try {
    if (!refresh) {
      loading.value = true
      error.value = ''
    }
    entries.value = (await apiRequest('/api/ignorelist')) || []
  } catch (err) {
    console.error('Failed to load ignored usernames:', err)
    if (!refresh) error.value = err.message || 'Failed to load ignored usernames'
  } finally {
    if (!refresh) loading.value = false
  }
}

const validate = (username) => {
  if (!username) return 'Please enter a username.'
  if (username.length > USERNAME_MAX_LENGTH || !USERNAME_PATTERN.test(username)) {
    return `Invalid username: use letters, digits, ".", "_" or "-" (not at the start), optionally ending in "$", at most ${USERNAME_MAX_LENGTH} characters.`
  }
  if (ignoredUsers.value.some(u => u.username === username)) {
    return `"${username}" is already ignored on this server.`
  }
  return ''
}

const addUsername = async () => {
  if (busy.value || !props.server?.id) return
  const username = newUsername.value.trim()
  validationError.value = validate(username)
  if (validationError.value) return

  let added = false
  try {
    adding.value = true
    await apiRequest('/api/ignorelist', {
      method: 'POST',
      body: { username, server_id: props.server.id }
    })
    added = true
    toast.success(`"${username}" is now ignored on ${props.server.name}.`)
    newUsername.value = ''
    await fetchIgnored({ refresh: true })
  } catch (err) {
    // useApi already shows an error toast
    console.error('Failed to add ignored username:', err)
  } finally {
    adding.value = false
  }
  if (added) {
    // The input is disabled while saving; focus once it is enabled again
    await nextTick()
    usernameInput.value?.focus()
  }
}

const removeUsername = async (username) => {
  if (busy.value || !props.server?.id) return
  if (!confirm(`Remove "${username}" from the ignore list of ${props.server.name}?`)) return
  try {
    removingUsername.value = username
    await apiRequest('/api/ignorelist/unassign', {
      method: 'DELETE',
      body: { username, server_id: props.server.id }
    })
    toast.success(`"${username}" is no longer ignored on ${props.server.name}.`)
    await fetchIgnored({ refresh: true })
  } catch (err) {
    // useApi already shows an error toast
    console.error('Failed to remove ignored username:', err)
  } finally {
    removingUsername.value = null
  }
}

watch(newUsername, () => {
  validationError.value = ''
})

watch(() => props.active, (isActive) => {
  if (isActive && props.server) {
    fetchIgnored()
  } else if (!isActive) {
    entries.value = []
    error.value = ''
    newUsername.value = ''
    validationError.value = ''
  }
}, { immediate: true })

watch(() => props.server, (newServer) => {
  if (props.active && newServer) {
    newUsername.value = ''
    validationError.value = ''
    fetchIgnored()
  }
})
</script>

<style scoped>
.ignored-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ignored-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: var(--surface-sunken);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.ignored-name {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: var(--text);
  background: var(--surface-raised);
  padding: 2px 8px;
  border-radius: 4px;
}

.btn-remove {
  padding: 6px 14px;
  background: transparent;
  color: var(--red-text);
  border: 1px solid var(--red-border);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-remove:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

.add-form {
  margin-top: 12px;
}

.add-row {
  display: flex;
  gap: 8px;
}

.add-row input {
  flex: 1;
  padding: 10px 14px;
  background: var(--surface-sunken);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.add-row input:focus {
  border-color: #3b82f6;
}

.add-row input::placeholder {
  color: var(--border-strong);
}

.btn-add {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover:not(:disabled) {
  background: #2563eb;
}

.btn-add:disabled,
.btn-remove:disabled,
.add-row input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.validation-error {
  margin-top: 8px;
  color: #ef4444;
  font-size: 13px;
}

.loading-state, .empty-state, .error-state {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  font-size: 14px;
}

.error-state { color: #ef4444; }

.btn-retry {
  margin-top: 8px;
  padding: 6px 14px;
  background: var(--surface-raised);
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.btn-retry:hover { background: var(--border); }

.spinner {
  width: 28px;
  height: 28px;
  margin: 0 auto 12px;
  border: 3px solid var(--surface-raised);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
