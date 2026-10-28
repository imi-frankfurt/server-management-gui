<template>
  <div class="stat-card">
    <div class="stat-content">
      <p class="stat-label">{{ label }}</p>
      <h3 :class="['stat-value', valueClass]">{{ value }}</h3>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  valueClass: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.stat-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-content {
  width: 100%;
}

.stat-label {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
}

.stat-value.access-admin {
  color: var(--green-text);
}

.stat-value.access-user {
  color: var(--blue-text);
}
</style>
