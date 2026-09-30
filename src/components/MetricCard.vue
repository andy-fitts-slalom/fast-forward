<script setup lang="ts">
import { computed } from 'vue'
import type { ChartData, ChartOptions } from 'chart.js'
import { Line } from 'vue-chartjs'

const props = defineProps<{
  label: string
  value: string
  icon: string
  chartLabels: string[]
  chartValues: number[]
  chartColor: string
  chartCaption: string
  chartDescription: string
  valueFormat: 'count' | 'percent' | 'days'
}>()

const integerFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const captionParts = computed(() => props.chartCaption.split('|').map((part, index) => {
  const text = part.trim()
  return index === 0 ? text : text.charAt(0).toLocaleUpperCase() + text.slice(1)
}))

function formatValue(value: number) {
  if (props.valueFormat === 'percent') return `${value.toFixed(1)}%`
  if (props.valueFormat === 'days') return `${value.toFixed(2)} days`
  return integerFormat.format(value)
}

const lineData = computed<ChartData<'line'>>(() => ({
  labels: props.chartLabels,
  datasets: [{
    label: props.label,
    data: props.chartValues,
    borderColor: props.chartColor,
    backgroundColor: props.chartColor,
    borderWidth: 2,
    pointRadius: 0,
    pointHoverRadius: 3,
    tension: 0.32,
  }],
}))

const lineOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      displayColors: false,
      callbacks: {
        title: (items) => items[0]?.label ?? '',
        label: (context) => ` ${formatValue(Number(context.parsed.y))}`,
      },
    },
  },
  scales: { x: { display: false }, y: { display: false } },
}
</script>

<template>
  <v-card class="metric-card" flat>
    <div class="metric-heading">
      <span>{{ label }}</span>
      <v-icon :icon="icon" aria-hidden="true" />
    </div>
    <div class="metric-value">{{ value }}</div>
    <div class="metric-chart">
      <Line
        :data="lineData"
        :options="lineOptions"
        :aria-label="chartDescription"
      />
    </div>
    <div class="chart-caption">
      <template v-for="(part, index) in captionParts" :key="`${index}-${part}`">
        <span v-if="index > 0" class="caption-divider"> | </span><span>{{ part }}</span>
      </template>
    </div>
  </v-card>
</template>

<style scoped>
.metric-card { height: 100%; min-height: 174px; padding: 17px 18px 13px; border: 1px solid rgba(176, 199, 191, 0.12); border-radius: 8px; background: #171e20; }
.metric-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: #98a8a4; font-size: 14px; font-weight: 600; }
.metric-heading :deep(.v-icon) { color: #778a85; font-size: 18px; }
.metric-value { margin-top: 11px; color: #edf4f1; font-size: 26px; font-weight: 650; line-height: 1.1; font-variant-numeric: tabular-nums; }
.metric-chart { position: relative; height: 41px; margin-top: 8px; }
.chart-caption { overflow: hidden; margin-top: 3px; color: #a5b2ad; font-size: 12px; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
.caption-divider { color: inherit; font-weight: 700; }
@media (max-width: 600px) { .metric-card { min-height: 166px; padding: 15px; }.metric-value { font-size: 23px; }.metric-chart { height: 38px; } }
</style>