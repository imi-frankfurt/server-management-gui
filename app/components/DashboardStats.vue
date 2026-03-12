<template>
  <section class="stats-grid">
    <DashboardStatCard
      v-if="showCard1"
      :label="label1 || 'Total Servers'"
      :value="totalServers"
    />
    <DashboardStatCard
      v-if="showCard2"
      :label="label2 || 'Active Servers'"
      :value="activeServers"
    />
    <DashboardStatCard
      v-if="showCard3"
      :label="label3 || 'Total Users'"
      :value="totalUsers"
    />
    <DashboardStatCard
      label="Access Level"
      :value="accessLevel"
    />
  </section>
</template>

<script setup>
import DashboardStatCard from './DashboardStatCard.vue'

const props = defineProps({
  totalServers: {
    type: Number,
    default: 0
  },
  activeServers: {
    type: Number,
    default: 0
  },
  totalUsers: {
    type: Number,
    default: 0
  },
  accessLevel: {
    type: String,
    default: 'No roles'
  },
  label1: {
    type: String,
    default: 'Total Servers'
  },
  label2: {
    type: String,
    default: 'Active Servers'
  },
  label3: {
    type: String,
    default: 'Total Users'
  },
  showCard1: {
    type: Boolean,
    default: true
  },
  showCard2: {
    type: Boolean,
    default: true
  },
  showCard3: {
    type: Boolean,
    default: true
  },
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
