<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value: string
  comparison: string
  trendDirection: 'up' | 'down' | 'neutral'
  favorable?: boolean
  icon: string
}>(), {
  favorable: true,
})
</script>

<template>
  <v-card class="metric-card" flat>
    <div class="metric-heading">
      <span>{{ label }}</span>
      <v-icon :icon="icon" aria-hidden="true" />
    </div>
    <div class="metric-value">{{ value }}</div>
    <div class="metric-comparison">
      <span :class="['trend', trendDirection, { unfavorable: !favorable && trendDirection !== 'neutral' }]">
        <v-icon
          v-if="trendDirection !== 'neutral'"
          :icon="trendDirection === 'up' ? 'mdi-arrow-top-right' : 'mdi-arrow-bottom-right'"
          size="15"
          aria-hidden="true"
        />
        <v-icon v-else icon="mdi-minus" size="15" aria-hidden="true" />
        {{ comparison }}
      </span>
    </div>
  </v-card>
</template>

<style scoped>
.metric-card { height: 100%; min-height: 142px; padding: 19px 20px; border: 1px solid rgba(176, 199, 191, 0.12); border-radius: 8px; background: #171e20; }
.metric-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: #98a8a4; font-size: 11px; font-weight: 600; }
.metric-heading :deep(.v-icon) { color: #778a85; font-size: 18px; }
.metric-value { margin-top: 16px; color: #edf4f1; font-size: 27px; font-weight: 650; line-height: 1.1; font-variant-numeric: tabular-nums; }
.metric-comparison { display: flex; align-items: center; margin-top: 14px; }
.trend { display: inline-flex; align-items: center; gap: 4px; color: #72d4b3; font-size: 10px; font-weight: 650; }
.trend.down.unfavorable, .trend.up.unfavorable { color: #ee9188; }
.trend.neutral { color: #9aa6a2; font-weight: 500; }
@media (max-width: 600px) { .metric-card { min-height: 128px; padding: 16px; }.metric-value { font-size: 23px; } }
</style>