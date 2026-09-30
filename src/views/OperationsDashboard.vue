<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { Bar, Line } from 'vue-chartjs'
import MetricCard from '../components/MetricCard.vue'
import monthlyMetrics from '../data/metrics.json'

interface ShipmentMetric {
  month: string
  region: string
  shipments: number
  onTimeShipments: number
  openExceptions: number
  avgTransitDays: number
}

type MetricKey = 'shipments' | 'onTimeRate' | 'openExceptions' | 'avgTransitDays'

ChartJS.register(BarElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip)

const records = monthlyMetrics as ShipmentMetric[]
const regions = ['Northeast', 'Southeast', 'Midwest', 'West']
const regionColors: Record<string, string> = {
  Northeast: '#70d6b4',
  Southeast: '#e4b65e',
  Midwest: '#8eafe6',
  West: '#df8e7e',
}
const metricColors: Record<MetricKey, string> = {
  shipments: '#70d6b4',
  onTimeRate: '#8eafe6',
  openExceptions: '#e4b65e',
  avgTransitDays: '#df8e7e',
}
const monthIds = Array.from(new Set(records.map((record) => record.month))).sort()
const monthOptions = [
  { title: 'All months', value: 'all' },
  ...monthIds.map((month) => ({
    title: new Date(`${month}-15T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    value: month,
  })),
]
const regionOptions = ['All regions', ...regions]
const selectedMonth = ref('all')
const selectedRegion = ref('All regions')
const numberFormat = new Intl.NumberFormat('en-US')
const monthLabels = monthIds.map((month) => new Date(`${month}-15T12:00:00`).toLocaleDateString('en-US', { month: 'short' }))
const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4']

function recordsForMonth(month: string) {
  return records.filter((record) => record.month === month
    && (selectedRegion.value === 'All regions' || record.region === selectedRegion.value))
}

function aggregate(items: ShipmentMetric[]) {
  const shipments = items.reduce((total, record) => total + record.shipments, 0)
  const onTimeShipments = items.reduce((total, record) => total + record.onTimeShipments, 0)
  const weightedTransitDays = items.reduce((total, record) => total + record.avgTransitDays * record.shipments, 0)
  return {
    shipments,
    onTimeRate: shipments ? onTimeShipments / shipments : null,
    openExceptions: items.reduce((total, record) => total + record.openExceptions, 0),
    avgTransitDays: shipments ? weightedTransitDays / shipments : null,
  }
}

const availableRecords = computed(() => records.filter((record) =>
  selectedRegion.value === 'All regions' || record.region === selectedRegion.value))
const hasAvailableData = computed(() => availableRecords.value.length > 0)
const summary = computed(() => {
  if (selectedMonth.value === 'all') {
    const yearly = aggregate(availableRecords.value)
    const december = aggregate(recordsForMonth(monthIds[monthIds.length - 1]))
    return { ...yearly, openExceptions: december.openExceptions }
  }

  return aggregate(recordsForMonth(selectedMonth.value))
})

const overviewDescription = computed(() => {
  const month = selectedMonth.value === 'all'
    ? 'all of 2025'
    : monthOptions.find((option) => option.value === selectedMonth.value)?.title ?? 'the selected month'
  const region = selectedRegion.value === 'All regions'
    ? 'across all regions'
    : `in the ${selectedRegion.value} region`
  return `This view summarizes shipment volume, on-time delivery, and open exceptions for ${month} ${region}.`
})

function valueForMetric(values: ReturnType<typeof aggregate>, key: MetricKey): number | null {
  return values[key]
}

function formatMetricValue(key: MetricKey, value: number | null): string {
  if (value === null) return '—'
  if (key === 'shipments' || key === 'openExceptions') return numberFormat.format(value)
  if (key === 'onTimeRate') return `${(value * 100).toFixed(1)}%`
  return `${value.toFixed(2)} days`
}

function weeklyTrend(key: MetricKey) {
  const selectedRecords = recordsForMonth(selectedMonth.value)
  const current = aggregate(selectedRecords)
  const monthIndex = monthIds.indexOf(selectedMonth.value)
  const previousRecords = monthIndex > 0 ? recordsForMonth(monthIds[monthIndex - 1]) : []
  const phase = (monthIndex + Math.max(0, regions.indexOf(selectedRegion.value))) % 4
  const weeklySharePattern = [0.21, 0.26, 0.29, 0.24]
  const weeklyShares = weeklySharePattern.map((_, index) => weeklySharePattern[(index + phase) % 4])
  const shareTotal = weeklyShares.reduce((total, share) => total + share, 0)
  const normalizedShares = weeklyShares.map((share) => share / shareTotal)

  if (key === 'shipments') {
    return normalizedShares.map((share) => current.shipments * share)
  }

  if (key === 'openExceptions') {
    const previous = previousRecords.length ? aggregate(previousRecords).openExceptions : current.openExceptions * 0.9
    const change = current.openExceptions - previous
    const wiggles = [0, 0.08, -0.05, 0]
    return [0.2, 0.48, 0.74, 1].map((progress, index) =>
      previous + change * progress + wiggles[index] * Math.max(previous, current.openExceptions, 1))
  }

  const baseline = key === 'onTimeRate'
    ? (current.onTimeRate ?? 0) * 100
    : current.avgTransitDays ?? 0
  const offsets = [-0.8, 0.45, 0.9, -0.3].map((_, index, pattern) => pattern[(index + phase) % pattern.length])
  const weightedMean = offsets.reduce((total, offset, index) => total + offset * normalizedShares[index], 0)
  const scale = key === 'onTimeRate' ? 0.7 : 0.08
  return offsets.map((offset) => baseline + (offset - weightedMean) * scale)
}

function chartSeries(key: MetricKey) {
  if (selectedMonth.value === 'all') {
    const values = monthIds.map((month) => {
      const value = valueForMetric(aggregate(recordsForMonth(month)), key)
      return key === 'onTimeRate' ? (value ?? 0) * 100 : value ?? 0
    })
    const regionCaption = selectedRegion.value === 'All regions' ? 'Regions combined' : selectedRegion.value
    return {
      labels: monthLabels,
      values,
      caption: `Jan-Dec | ${regionCaption}`,
    }
}

  const monthLabel = monthOptions.find((option) => option.value === selectedMonth.value)?.title.replace(' 2025', '') ?? 'Selected month'
  const regionCaption = selectedRegion.value === 'All regions' ? 'Regions combined' : selectedRegion.value

  return {
    labels: weekLabels,
    values: weeklyTrend(key),
    caption: `Illustrative weekly estimate | ${monthLabel} | ${regionCaption}`,
  }
}

const metricCards = computed(() => {
  const definitions: { key: MetricKey; label: string; icon: string; format: 'count' | 'percent' | 'days' }[] = [
    { key: 'shipments', label: 'Completed shipments', icon: 'mdi-truck-check-outline', format: 'count' },
    { key: 'onTimeRate', label: 'On-time delivery rate', icon: 'mdi-clock-check-outline', format: 'percent' },
    { key: 'openExceptions', label: 'Open exceptions', icon: 'mdi-alert-circle-outline', format: 'count' },
    { key: 'avgTransitDays', label: 'Average transit time', icon: 'mdi-timer-outline', format: 'days' },
  ]

  return definitions.map((definition) => {
    const value = valueForMetric(summary.value, definition.key)
    const series = chartSeries(definition.key)

    return {
      ...definition,
      value: hasAvailableData.value ? formatMetricValue(definition.key, value) : '—',
      chartLabels: series.labels,
      chartValues: series.values,
      chartColor: metricColors[definition.key],
      chartCaption: series.caption,
      chartDescription: `${definition.label}: ${series.caption}`,
    }
  })
})

const shipmentTotals = computed(() => monthIds.map((month) => ({
  month,
  value: recordsForMonth(month).reduce((total, record) => total + record.shipments, 0),
})))
const shipmentChartData = computed(() => ({
  labels: monthLabels,
  datasets: [{
    label: 'Completed shipments',
    data: shipmentTotals.value.map((item) => item.value),
    backgroundColor: shipmentTotals.value.map((item) => item.month === selectedMonth.value ? '#e4b65e' : '#70d6b4'),
    borderRadius: 4,
    maxBarThickness: 40,
  }],
}))

const onTimeChartData = computed(() => {
  const visibleRegions = selectedRegion.value === 'All regions' ? regions : [selectedRegion.value]
  return {
    labels: monthLabels,
    datasets: visibleRegions.map((region) => ({
      label: region,
      data: monthIds.map((month) => {
        const row = records.find((record) => record.month === month && record.region === region)
        return row ? row.onTimeShipments / row.shipments * 100 : null
      }),
      borderColor: regionColors[region],
      backgroundColor: regionColors[region],
      pointBackgroundColor: monthIds.map((month) => month === selectedMonth.value ? '#f0f3ee' : regionColors[region]),
      pointBorderColor: regionColors[region],
      pointRadius: monthIds.map((month) => month === selectedMonth.value ? 5 : 2.5),
      pointHoverRadius: 6,
      borderWidth: 2,
      tension: 0.28,
      spanGaps: false,
    })),
  }
})

const exceptionChartData = computed(() => ({
  labels: monthLabels,
  datasets: [{
    label: 'Open exceptions at month end',
    data: monthIds.map((month) => recordsForMonth(month).reduce((total, record) => total + record.openExceptions, 0)),
    borderColor: '#e4b65e',
    backgroundColor: 'rgba(228, 182, 94, 0.13)',
    pointBackgroundColor: monthIds.map((month) => month === selectedMonth.value ? '#f0f3ee' : '#e4b65e'),
    pointBorderColor: '#e4b65e',
    pointRadius: monthIds.map((month) => month === selectedMonth.value ? 5 : 2.5),
    pointHoverRadius: 6,
    borderWidth: 2,
    tension: 0.3,
    fill: true,
  }],
}))

const commonXAxis = {
  grid: { display: false },
  border: { display: false },
  ticks: { color: '#8c9b99', font: { family: 'DM Sans', size: 10 } },
}
const commonYAxis = {
  border: { display: false, dash: [3, 4] },
  grid: { color: 'rgba(159, 178, 172, 0.12)' },
  ticks: { color: '#8c9b99', maxTicksLimit: 5 },
}
const shipmentOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (context) => ` ${numberFormat.format(Number(context.parsed.y))} shipments` } },
  },
  scales: {
    x: commonXAxis,
    y: { ...commonYAxis, beginAtZero: true, ticks: { ...commonYAxis.ticks, callback: (value) => numberFormat.format(Number(value)) } },
  },
}
const onTimeOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'bottom', align: 'start', labels: { color: '#9caaa6', usePointStyle: true, boxWidth: 7, pointStyleWidth: 14, padding: 18, font: { size: 10 } } },
    tooltip: { callbacks: { label: (context) => ` ${context.dataset.label}: ${Number(context.parsed.y).toFixed(1)}%` } },
  },
  scales: {
    x: commonXAxis,
    y: { ...commonYAxis, min: 75, max: 100, ticks: { ...commonYAxis.ticks, callback: (value) => `${value}%` } },
  },
}
const exceptionOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (context) => ` ${numberFormat.format(Number(context.parsed.y))} open exceptions` } },
  },
  scales: {
    x: commonXAxis,
    y: { ...commonYAxis, beginAtZero: true, ticks: { ...commonYAxis.ticks, callback: (value) => numberFormat.format(Number(value)) } },
  },
}
</script>

<template>
  <v-app-bar class="operations-app-bar" flat height="82">
    <div class="app-bar-content">
      <div class="brand-lockup">
        <span class="brand-word">FastForward</span>
        <div class="brand-mark"><v-icon icon="mdi-truck-fast-outline" aria-hidden="true" /></div>
        <span class="brand-word brand-word-secondary">Logistics</span>
      </div>
    </div>
  </v-app-bar>

  <v-main>
    <v-container class="dashboard-container" fluid>
      <div class="overview-heading">
        <div>
          <h1>2025 Operations Performance</h1>
          <p>{{ overviewDescription }}</p>
        </div>
        <div class="dashboard-filters" aria-label="Dashboard filters">
          <v-select
            v-model="selectedMonth"
            :items="monthOptions"
            aria-label="Filter by month"
            class="main-filter"
            density="compact"
            hide-details
            item-title="title"
            item-value="value"
            label="Month"
            :menu-props="{ contentClass: 'dashboard-filter-menu' }"
            prepend-inner-icon="mdi-calendar-month-outline"
            variant="outlined"
          />
          <v-select
            v-model="selectedRegion"
            :items="regionOptions"
            aria-label="Filter by region"
            class="main-filter"
            density="compact"
            hide-details
            label="Region"
            :menu-props="{ contentClass: 'dashboard-filter-menu' }"
            prepend-inner-icon="mdi-map-marker-outline"
            variant="outlined"
          />
        </div>
      </div>

      <v-row class="metric-row">
        <v-col v-for="metric in metricCards" :key="metric.key" cols="12" sm="6" xl="3">
          <MetricCard
            :label="metric.label"
            :value="metric.value"
            :icon="metric.icon"
            :chart-labels="metric.chartLabels"
            :chart-values="metric.chartValues"
            :chart-color="metric.chartColor"
            :chart-caption="metric.chartCaption"
            :chart-description="metric.chartDescription"
            :value-format="metric.format"
          />
        </v-col>
      </v-row>

      <v-alert v-if="!hasAvailableData" class="empty-state" type="info" variant="tonal">
        No shipment records are available for this selection. Choose another region to see operations data.
      </v-alert>

      <template v-else>
        <v-row class="chart-row">
          <v-col cols="12" lg="6">
            <v-card class="chart-card" flat>
              <div class="chart-heading">
                <div>
                  <div class="chart-title">Monthly shipment volume</div>
                  <div class="chart-subtitle">Completed shipments <span class="chart-separator">|</span> Selected month highlighted</div>
                </div>
              </div>
              <div class="chart-canvas primary-chart">
                <Bar :data="shipmentChartData" :options="shipmentOptions" aria-label="Monthly completed shipment volume bar chart" />
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" lg="6">
            <v-card class="chart-card" flat>
              <div class="chart-heading">
                <div>
                  <div class="chart-title">On-time delivery by region</div>
                  <div class="chart-subtitle">Shipments delivered by their promised date <span class="chart-separator">|</span> Selected month highlighted</div>
                </div>
              </div>
              <div class="chart-canvas primary-chart">
                <Line :data="onTimeChartData" :options="onTimeOptions" aria-label="Monthly on-time delivery rate by region line chart" />
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-card class="chart-card exceptions-card" flat>
              <div class="chart-heading">
                <div>
                  <div class="chart-title">Open delivery exceptions</div>
                  <div class="chart-subtitle">Unresolved delays, damage, or documentation issues at month end <span class="chart-separator">|</span> Selected month highlighted</div>
                </div>
              </div>
              <div class="chart-canvas exception-chart">
                <Line :data="exceptionChartData" :options="exceptionOptions" aria-label="Month-end open shipment exceptions area chart" />
              </div>
            </v-card>
          </v-col>
        </v-row>
      </template>

      <footer class="dashboard-footer">
        <span class="status-dot" /> FICTIONAL OPERATIONS DATA <span class="footer-divider">/</span> JAN—DEC 2025
      </footer>
    </v-container>
  </v-main>
</template>

<style scoped>
.operations-app-bar { border-bottom: 1px solid rgba(176, 199, 191, 0.1); background: #12191a !important; }
.app-bar-content { display: flex; align-items: center; justify-content: center; width: min(100% - 56px, 1480px); height: 100%; margin: 0 auto; }
.brand-lockup { display: grid; grid-template-columns: minmax(0, 1fr) 38px minmax(0, 1fr); align-items: center; gap: 12px; width: min(100%, 420px); margin: 0 auto; }
.brand-mark { display: grid; width: 38px; height: 38px; place-items: center; border: 1px solid rgba(112, 214, 180, .25); border-radius: 8px; background: rgba(112, 214, 180, .08); color: #70d6b4; }
.brand-mark :deep(.v-icon) { font-size: 21px; }
.brand-word { justify-self: end; color: #e8f0ed; font-size: 16px; font-weight: 700; line-height: 1.2; white-space: nowrap; }
.brand-word-secondary { justify-self: start; color: #a5b3af; font-weight: 450; }
.dashboard-container { max-width: 1536px; padding: 29px 28px 22px; }
.overview-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 16px; }
.overview-heading h1 { margin: 7px 0 4px; color: #edf4f1; font-size: 24px; font-weight: 650; line-height: 1.2; }
.overview-heading p { color: #8c9a96; font-size: 14px; }
.dashboard-filters { display: grid; grid-template-columns: 180px 165px; gap: 9px; flex: 0 0 auto; }
.main-filter :deep(.v-field) { min-height: 42px; border-radius: 7px; }
.main-filter :deep(.v-field__input) { min-height: 42px; padding-top: 7px; padding-bottom: 7px; font-size: 14px; }
.main-filter :deep(.v-field__prepend-inner .v-icon) { color: #83938e; font-size: 17px; }
:global(.dashboard-filter-menu .v-list-item-title) { font-size: 14px; }
.metric-row { margin-bottom: 8px; }
.chart-row { margin-top: 0; }
.chart-card { height: 100%; min-height: 330px; padding: 19px 20px 15px; border: 1px solid rgba(176, 199, 191, .12); border-radius: 8px; background: #171e20; }
.chart-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.chart-title { color: #e6efeb; font-size: 14px; font-weight: 650; }
.chart-subtitle { margin-top: 5px; color: #879590; font-size: 12px; line-height: 1.45; }
.chart-separator { margin-inline: 0.35em; color: inherit; font-weight: 700; }
.chart-canvas { position: relative; width: 100%; margin-top: 14px; }
.primary-chart { height: 244px; }
.exceptions-card { min-height: 302px; }
.exception-chart { height: 220px; }
.empty-state { margin-top: 14px; }
.dashboard-footer { display: flex; align-items: center; justify-content: center; gap: 8px; padding-top: 10px; color: #697773; font-size: 10px; font-weight: 700; }
.status-dot { width: 5px; height: 5px; border-radius: 50%; background: #70d6b4; }
.footer-divider { color: #46534f; }
@media (max-width: 900px) {
  .app-bar-content { width: calc(100% - 56px); }
  .overview-heading { align-items: flex-start; flex-direction: column; }
  .dashboard-filters { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); width: 100%; }
}
@media (max-width: 600px) {
  .app-bar-content { width: calc(100% - 24px); }
  .brand-word { font-size: 16px; }
  .dashboard-container { padding: 22px 12px 18px; }
  .overview-heading { gap: 12px; }
  .overview-heading h1 { font-size: 21px; }
  .main-filter :deep(.v-field__input) { font-size: 14px; }
  .metric-row { margin-bottom: 5px; }
  .chart-card { min-height: 294px; padding: 16px 14px 13px; }
  .primary-chart { height: 212px; }
  .exceptions-card { min-height: 276px; }
  .exception-chart { height: 196px; }
}
</style>