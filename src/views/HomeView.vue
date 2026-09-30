<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { Bar, Line } from 'vue-chartjs'
import monthlyMetrics from '../data/metrics.json'

interface MonthlyMetric {
  month: string
  revenue: number
  visitors: number
  conversions: number
  orders: number
}

type MetricKey = 'revenue' | 'visitors' | 'conversions' | 'orders'

ChartJS.register(BarElement, CategoryScale, Filler, LineElement, LinearScale, PointElement, Tooltip)

const records = monthlyMetrics as MonthlyMetric[]
const selectedMonth = ref('all')
const monthOptions = [
  { title: 'All months', value: 'all' },
  ...records.map((record) => ({
    title: new Date(`${record.month}-15T12:00:00`).toLocaleDateString('en-US', { month: 'long' }),
    value: record.month,
  })),
]
const selectedIndex = computed(() => records.findIndex((record) => record.month === selectedMonth.value))
const summary = computed(() => {
  if (selectedMonth.value !== 'all') return records[selectedIndex.value]

  return {
    revenue: records.reduce((total, record) => total + record.revenue, 0),
    visitors: records.reduce((total, record) => total + record.visitors, 0),
    conversions: records.reduce((total, record) => total + record.conversions, 0) / records.length,
    orders: records.reduce((total, record) => total + record.orders, 0),
  }
})
const comparison = computed(() => {
  const currentIndex = selectedMonth.value === 'all' ? records.length - 1 : selectedIndex.value
  const previousIndex = (currentIndex + records.length - 1) % records.length
  const current = records[currentIndex]
  const previous = records[previousIndex]
  const currentLabel = monthOptions[currentIndex + 1].title.slice(0, 3)
  const previousLabel = monthOptions[previousIndex + 1].title.slice(0, 3)

  return {
    current,
    previous,
    label: selectedMonth.value === 'all' ? `${currentLabel} vs ${previousLabel}` : 'vs previous month',
  }
})
const chartFocus = computed(() => selectedMonth.value === 'all'
  ? 'All 12 months'
  : `${monthOptions[selectedIndex.value + 1].title} highlighted · 12-month context`)
const chartLabels = records.map((record) => new Date(`${record.month}-15T12:00:00`).toLocaleDateString('en-US', { month: 'short' }))
const integerFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function formatChange(key: MetricKey): string {
  const current = comparison.value.current[key]
  const previous = comparison.value.previous[key]

  if (key === 'conversions') {
    const difference = current - previous
    return `${difference >= 0 ? '+' : ''}${difference.toFixed(1)} pp`
  }

  const difference = previous === 0 ? 0 : ((current - previous) / previous) * 100
  return `${difference >= 0 ? '+' : ''}${difference.toFixed(1)}%`
}

function isChangePositive(key: MetricKey): boolean {
  return comparison.value.current[key] >= comparison.value.previous[key]
}

const summaryCards = computed(() => {
  const values = summary.value
  const cards: { key: MetricKey; label: string; value: string; icon: string }[] = [
    { key: 'revenue', label: 'Revenue', value: currencyFormat.format(values.revenue), icon: 'mdi-currency-usd' },
    { key: 'visitors', label: 'Visitors', value: integerFormat.format(values.visitors), icon: 'mdi-account-group-outline' },
    { key: 'conversions', label: 'Conversions', value: `${values.conversions.toFixed(1)}%`, icon: 'mdi-chart-areaspline' },
    { key: 'orders', label: 'Orders', value: integerFormat.format(values.orders), icon: 'mdi-package-variant-closed' },
  ]

  return cards.map((card) => ({
    ...card,
    change: formatChange(card.key),
    positive: isChangePositive(card.key),
  }))
})

const revenueChartData = computed(() => ({
  labels: chartLabels,
  datasets: [{
    label: 'Revenue',
    data: records.map((record) => record.revenue),
    backgroundColor: records.map((record) => record.month === selectedMonth.value ? '#efbd62' : '#61bda1'),
    hoverBackgroundColor: '#efbd62',
    borderRadius: 5,
    maxBarThickness: 38,
    categoryPercentage: 0.72,
    barPercentage: 0.78,
  }],
}))

const visitorsChartData = computed(() => ({
  labels: chartLabels,
  datasets: [{
    label: 'Visitors',
    data: records.map((record) => record.visitors),
    borderColor: '#78d4b5',
    pointBackgroundColor: records.map((record) => record.month === selectedMonth.value ? '#efbd62' : '#78d4b5'),
    pointBorderColor: '#171e20',
    pointRadius: records.map((record) => record.month === selectedMonth.value ? 5 : 3),
    pointHoverRadius: 6,
    borderWidth: 2.5,
    tension: 0.34,
  }],
}))

const conversionsChartData = computed(() => ({
  labels: chartLabels,
  datasets: [{
    label: 'Conversion rate',
    data: records.map((record) => record.conversions),
    borderColor: '#78d4b5',
    backgroundColor: 'rgba(120, 212, 181, 0.16)',
    pointBackgroundColor: records.map((record) => record.month === selectedMonth.value ? '#efbd62' : '#78d4b5'),
    pointBorderColor: '#171e20',
    pointRadius: records.map((record) => record.month === selectedMonth.value ? 5 : 3),
    pointHoverRadius: 6,
    borderWidth: 2.5,
    tension: 0.34,
    fill: true,
  }],
}))

const commonXAxis = {
  grid: { display: false },
  border: { display: false },
  ticks: { color: '#8c9b99', font: { family: 'DM Sans', size: 11 } },
}
const revenueOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (context) => ` ${currencyFormat.format(Number(context.parsed.y))}` } },
  },
  scales: {
    x: commonXAxis,
    y: {
      beginAtZero: true,
      border: { display: false, dash: [3, 4] },
      grid: { color: 'rgba(159, 178, 172, 0.12)' },
      ticks: { color: '#8c9b99', callback: (value) => `$${Number(value) / 1000}k`, maxTicksLimit: 5 },
    },
  },
}
const visitorsOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (context) => ` ${integerFormat.format(Number(context.parsed.y))} visitors` } },
  },
  scales: {
    x: commonXAxis,
    y: {
      beginAtZero: true,
      border: { display: false, dash: [3, 4] },
      grid: { color: 'rgba(159, 178, 172, 0.12)' },
      ticks: { color: '#8c9b99', callback: (value) => `${Number(value) / 1000}k`, maxTicksLimit: 5 },
    },
  },
}
const conversionsOptions: ChartOptions<'line'> = {
  ...visitorsOptions,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (context) => ` ${Number(context.parsed.y).toFixed(1)}% conversion` } },
  },
  scales: {
    x: commonXAxis,
    y: {
      suggestedMin: 2,
      suggestedMax: 5,
      border: { display: false, dash: [3, 4] },
      grid: { color: 'rgba(159, 178, 172, 0.12)' },
      ticks: { color: '#8c9b99', callback: (value) => `${value}%`, maxTicksLimit: 5 },
    },
  },
}
</script>

<template>
  <v-app-bar class="dashboard-app-bar" color="background" flat height="76">
    <div class="app-bar-content">
      <div class="app-title-group">
        <v-icon icon="mdi-chart-box-outline" class="app-title-icon" />
        <div>
          <div class="app-title">My Dashboard</div>
          <div class="app-subtitle">MONTHLY BUSINESS METRICS · 2025</div>
        </div>
      </div>
      <v-select
        v-model="selectedMonth"
        :items="monthOptions"
        aria-label="Filter dashboard by month"
        class="month-select"
        density="compact"
        hide-details
        item-title="title"
        item-value="value"
        prepend-inner-icon="mdi-calendar-month-outline"
        variant="outlined"
      />
    </div>
  </v-app-bar>

  <v-main>
    <v-container class="dashboard-container" fluid>
      <v-row class="metric-row">
        <v-col v-for="metric in summaryCards" :key="metric.key" cols="12" sm="6" xl="3">
          <v-card class="metric-card" flat>
            <div class="metric-heading">
              <span>{{ metric.label }}</span>
              <v-icon :icon="metric.icon" />
            </div>
            <div class="metric-value">{{ metric.value }}</div>
            <div class="metric-change-row">
              <span :class="['metric-change', metric.positive ? 'positive' : 'negative']">
                <v-icon :icon="metric.positive ? 'mdi-trending-up' : 'mdi-trending-down'" size="16" />
                {{ metric.change }}
              </span>
              <span class="comparison-label">{{ comparison.label }}</span>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="chart-row">
        <v-col cols="12" xl="6">
          <v-card class="chart-card" flat>
            <div class="chart-heading">
              <div>
                <div class="chart-title">Revenue</div>
                <div class="chart-subtitle">Monthly sales · {{ chartFocus }}</div>
              </div>
              <span class="chart-unit">USD</span>
            </div>
            <div class="chart-canvas revenue-canvas">
              <Bar :data="revenueChartData" :options="revenueOptions" aria-label="Monthly revenue bar chart" />
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" xl="6">
          <v-card class="chart-card" flat>
            <div class="chart-heading">
              <div>
                <div class="chart-title">Visitors</div>
                <div class="chart-subtitle">Monthly traffic · {{ chartFocus }}</div>
              </div>
              <span class="chart-unit">SESSIONS</span>
            </div>
            <div class="chart-canvas revenue-canvas">
              <Line :data="visitorsChartData" :options="visitorsOptions" aria-label="Visitors line chart" />
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card class="chart-card conversion-card" flat>
            <div class="chart-heading">
              <div>
                <div class="chart-title">Conversion rate</div>
                <div class="chart-subtitle">Orders as a share of visitors · {{ chartFocus }}</div>
              </div>
              <span class="chart-unit">PERCENT</span>
            </div>
            <div class="chart-canvas conversion-canvas">
              <Line :data="conversionsChartData" :options="conversionsOptions" aria-label="Monthly conversion rate area chart" />
            </div>
          </v-card>
        </v-col>
      </v-row>
      <footer class="dashboard-footer">LOCAL DATASET <span /> JAN — DEC 2025</footer>
    </v-container>
  </v-main>
</template>

<style scoped>
.dashboard-app-bar { border-bottom: 1px solid rgba(176, 199, 191, 0.1); }
.app-bar-content { display: flex; align-items: center; justify-content: space-between; width: min(100% - 56px, 1480px); height: 100%; margin: 0 auto; gap: 20px; }
.app-title-group { display: flex; align-items: center; gap: 12px; min-width: 0; }
.app-title-icon { color: #71d8b7; font-size: 27px; }
.app-title { color: #e8f0ed; font-size: 16px; font-weight: 650; line-height: 1.2; }
.app-subtitle { margin-top: 5px; color: #72807e; font-size: 9px; font-weight: 700; letter-spacing: 1px; }
.month-select { flex: 0 0 190px; }
.month-select :deep(.v-field) { border-radius: 8px; }
.month-select :deep(.v-field__input) { min-height: 40px; padding-top: 8px; padding-bottom: 8px; font-size: 12px; }
.dashboard-container { max-width: 1536px; padding: 26px 28px 24px; }
.metric-row { margin-bottom: 6px; }
.metric-card, .chart-card { height: 100%; padding: 20px; border: 1px solid rgba(176, 199, 191, 0.11); border-radius: 8px; background: #171e20; }
.metric-card { min-height: 143px; }
.metric-heading { display: flex; align-items: center; justify-content: space-between; color: #8f9f9c; font-size: 11px; font-weight: 600; }
.metric-heading :deep(.v-icon) { color: #738481; font-size: 18px; }
.metric-value { margin-top: 16px; color: #edf4f1; font-size: 27px; font-weight: 600; line-height: 1; font-variant-numeric: tabular-nums; }
.metric-change-row { display: flex; align-items: center; gap: 8px; margin-top: 14px; min-width: 0; }
.metric-change { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.metric-change.positive { color: #71d8b7; }
.metric-change.negative { color: #ed817c; }
.comparison-label { overflow: hidden; color: #73817e; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.chart-row { margin-top: 0; }
.chart-card { min-height: 326px; padding: 20px 22px 18px; }
.chart-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.chart-title { color: #e7efec; font-size: 13px; font-weight: 650; }
.chart-subtitle { margin-top: 5px; color: #788784; font-size: 10px; }
.chart-unit { padding-top: 2px; color: #71817d; font-size: 9px; font-weight: 700; letter-spacing: 0.8px; }
.chart-canvas { position: relative; width: 100%; height: 245px; margin-top: 15px; }
.conversion-card { min-height: 318px; }
.conversion-canvas { height: 225px; }
.dashboard-footer { display: flex; align-items: center; justify-content: center; gap: 9px; padding-top: 9px; color: #596764; font-size: 9px; font-weight: 700; letter-spacing: 0.9px; }
.dashboard-footer span { width: 3px; height: 3px; border-radius: 50%; background: #71d8b7; }
@media (max-width: 600px) {
  .app-bar-content { width: calc(100% - 32px); gap: 10px; }
  .app-title { font-size: 14px; }
  .app-subtitle { font-size: 8px; letter-spacing: 0.6px; }
  .app-title-group { gap: 8px; }
  .app-title-icon { font-size: 23px; }
  .month-select { flex-basis: 144px; }
  .month-select :deep(.v-field__input) { font-size: 11px; }
  .dashboard-container { padding: 16px 12px 18px; }
  .metric-card { min-height: 128px; padding: 16px; }
  .metric-value { font-size: 24px; }
  .chart-card { min-height: 292px; padding: 17px 15px 14px; }
  .chart-canvas { height: 216px; }
  .conversion-card { min-height: 286px; }
  .conversion-canvas { height: 205px; }
}
@media (max-width: 400px) { .app-subtitle { display: none; } }
</style>