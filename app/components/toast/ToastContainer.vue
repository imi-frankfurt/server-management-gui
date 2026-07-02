<template>
  <Teleport to="body">
    <div class="toast-container">
      <Transition name="toast" v-for="t in toasts" :key="t.id">
        <div :class="['toast', `toast--${t.type}`]">
          <span class="toast-icon">{{ icons[t.type] }}</span>
          <span class="toast-message">{{ t.message }}</span>
          <button class="toast-close" @click="removeToast(t.id)">×</button>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '~/composables/useToast'
const { toasts, removeToast } = useToast()

const icons = {
  error: '✕',
  success: '✓',
  warning: '⚠',
  info: 'ℹ',
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9999;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  max-width: 380px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  pointer-events: all;
  border: 1px solid transparent;
}

.toast--error {
  background: #1f0e0e;
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.35);
}

.toast--success {
  background: #0a1f12;
  color: #86efac;
  border-color: rgba(34, 197, 94, 0.35);
}

.toast--warning {
  background: #1a1500;
  color: #fde68a;
  border-color: rgba(245, 158, 11, 0.35);
}

.toast--info {
  background: #0c1829;
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.35);
}

.toast-icon {
  font-size: 13px;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  flex-shrink: 0;
}

.toast-close:hover {
  opacity: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>