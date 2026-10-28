<template>
  <ClientOnly>
    <button
      type="button"
      role="switch"
      class="theme-toggle"
      :aria-checked="isDark"
      :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggle"
    >
      <span class="theme-toggle-label">{{ isDark ? 'Dark mode' : 'Light mode' }}</span>
      <span class="theme-toggle-track" :class="{ dark: isDark }">
        <span class="theme-toggle-thumb">
          <UIcon :name="isDark ? 'i-lucide-moon' : 'i-lucide-sun'" />
        </span>
      </span>
    </button>
    <template #fallback>
      <div class="theme-toggle theme-toggle-placeholder" />
    </template>
  </ClientOnly>
</template>

<script setup>
import { computed } from 'vue'

const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

const toggle = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<style scoped>
.theme-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: var(--overlay-1);
  color: var(--text-muted);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.theme-toggle:hover {
  background: var(--overlay-2);
  color: var(--text);
}

.theme-toggle-placeholder {
  height: 38px;
}

.theme-toggle-track {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 22px;
  border-radius: 999px;
  background: #f59e0b;
  transition: background 0.2s;
}

.theme-toggle-track.dark {
  background: #3b82f6;
}

.theme-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  color: #f59e0b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: transform 0.2s, color 0.2s;
}

.theme-toggle-track.dark .theme-toggle-thumb {
  transform: translateX(22px);
  color: #2563eb;
}

@media (max-width: 768px) {
  .theme-toggle {
    justify-content: center;
    padding: 8px 0;
  }

  .theme-toggle-label {
    display: none;
  }

  .theme-toggle-track {
    width: 36px;
  }

  .theme-toggle-track.dark .theme-toggle-thumb {
    transform: translateX(14px);
  }
}
</style>
