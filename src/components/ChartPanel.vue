<script setup lang="ts">
defineProps<{
  title: string
  panelClass?: string
  chartClass?: string
}>()
</script>

<template>
  <v-card :class="['chart-card', panelClass]" flat>
    <div class="chart-heading">
      <div>
        <div class="chart-title">{{ title }}</div>
        <div class="chart-subtitle"><slot name="subtitle" /></div>
      </div>
    </div>
    <div :class="['chart-canvas', chartClass]">
      <slot />
    </div>
  </v-card>
</template>

<style scoped>
.chart-card { height: 100%; min-height: 330px; padding: 19px 20px 15px; border: 1px solid rgba(176, 199, 191, .12); border-radius: 8px; background: #171e20; }
.chart-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.chart-title { color: #e6efeb; font-size: 14px; font-weight: 650; }
.chart-subtitle { margin-top: 5px; color: #879590; font-size: 12px; line-height: 1.45; }
.chart-canvas { position: relative; width: 100%; margin-top: 14px; }
.primary-chart { height: 244px; }
.exceptions-card { min-height: 302px; }
.exception-chart { height: 220px; }
@media (max-width: 600px) {
  .chart-card { min-height: 294px; padding: 16px 14px 13px; }
  .primary-chart { height: 212px; }
  .exceptions-card { min-height: 276px; }
  .exception-chart { height: 196px; }
}
</style>