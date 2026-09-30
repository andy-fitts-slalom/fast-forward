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
type TrendDirection = 'up' | 'down' | 'neutral'

ChartJS.register(BarElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip)

const records = monthlyMetrics as ShipmentMetric[]
const regions = ['Northeast', 'Southeast', 'Midwest', 'West']
const regionColors: Record<string, string> = {
  Northeast: '#70d6b4',
  Southeast: '#e4b65e',
  Midwest: '#8eafe6',
  West: '#df8e7e',
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

const currentMonthIndex = computed(() => selectedMonth.value === 'all'
  ? monthIds.length - 1
  : monthIds.indexOf(selectedMonth.value))
const comparison = computed(() => {
  const index = currentMonthIndex.value
  if (index <= 0) return { label: 'No prior month', values: null }

  const currentMonth = monthIds[index]
  const previousMonth = monthIds[index - 1]
  const current = aggregate(recordsForMonth(currentMonth))
  const previous = aggregate(recordsForMonth(previousMonth))
  const shortMonth = (month: string) => new Date(`${month}-15T12:00:00`).toLocaleDateString('en-US', { month: 'short' })
  return { label: `${shortMonth(currentMonth)} vs ${shortMonth(previousMonth)}`, values: { current, previous } }
})

const scopeLabel = computed(() => {
  const month = selectedMonth.value === 'all'
    ? 'Full year 2025'
    : monthOptions.find((option) => option.value === selectedMonth.value)?.title ?? 'Selected month'
  return `${month} · ${selectedRegion.value}`
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

function signed(value: number, digits = 1, suffix = '%') {
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}${suffix}`
}

const metricCards = computed(() => {
  const definitions: { key: MetricKey; label: string; icon: string; betterWhen: 'higher' | 'lower' }[] = [
    { key: 'shipments', label: 'Completed shipments', icon: 'mdi-truck-check-outline', betterWhen: 'higher' },
    { key: 'onTimeRate', label: 'On-time delivery rate', icon: 'mdi-clock-check-outline', betterWhen: 'higher' },
    { key: 'openExceptions', label: 'Open exceptions', icon: 'mdi-alert-circle-outline', betterWhen: 'lower' },
    { key: 'avgTransitDays', label: 'Average transit time', icon: 'mdi-timer-outline', betterWhen: 'lower' },
  ]

  return definitions.map((definition) => {
    const value = valueForMetric(summary.value, definition.key)
    const current = comparison.value.values?.current
    const previous = comparison.value.values?.previous
    const currentValue = current ? valueForMetric(current, definition.key) : null
    const previousValue = previous ? valueForMetric(previous, definition.key) : null
    let changeText = comparison.value.label
    let trendDirection: TrendDirection = 'neutral'
    let favorable = true

    if (currentValue !== null && currentValue !== undefined && previousValue !== null && previousValue !== undefined) {
      const difference = currentValue - previousValue
      trendDirection = difference > 0 ? 'up' : difference < 0 ? 'down' : 'neutral'
      favorable = definition.betterWhen === 'higher' ? difference >= 0 : difference <= 0
      if (definition.key === 'onTimeRate') {
        changeText = `${signed(difference * 100, 1, ' pp')} · ${comparison.value.label}`
      } else {
        const percent = previousValue ? (difference / previousValue) * 100 : 0
        changeText = `${signed(percent)} · ${comparison.value.label}`
      }
    }

    return {
      ...definition,
      value: hasAvailableData.value ? formatMetricValue(definition.key, value) : '—',
      comparison: hasAvailableData.value ? changeText : 'No data for this selection',
      trendDirection: hasAvailableData.value ? trendDirection : 'neutral',
      favorable,
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
    legend: { position: 'bottom', align: 'start', labels: { color: '#9caaa6', usePointStyle: true, boxWidth: 7, padding: 18, font: { size: 10 } } },
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
        <div class="brand-mark"><v-icon icon="mdi-truck-fast-outline" aria-hidden="true" /></div>
        <div class="brand-copy">
          <div class="brand-name">FastForward <span>Logistics</span></div>
          <div class="brand-subtitle">OPERATIONS CONTROL</div>
        </div>
      </div>
      <div class="app-bar-title">Operations overview</div>
    </div>
  </v-app-bar>

  <v-main>
    <v-container class="dashboard-container" fluid>
      <div class="overview-heading">
        <div>
          <div class="eyebrow">NETWORK PERFORMANCE <span> / </span> 2025</div>
          <h1>Operating picture</h1>
          <p>Shipment movement, delivery reliability, and unresolved exceptions.</p>
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
            prepend-inner-icon="mdi-map-marker-outline"
            variant="outlined"
          />
        </div>
      </div>

      <div class="scope-note">
        <v-icon class="scope-icon" icon="mdi-information-outline" size="17" aria-hidden="true" />
        <div class="scope-copy">
          <div class="scope-title">Current view: {{ scopeLabel }}</div>
          <p v-if="selectedMonth === 'all'" class="scope-description">
            Shipment, on-time, and transit figures cover all of 2025. Open exceptions show December's month-end count. Fewer exceptions and shorter transit times are better.
          </p>
          <p v-else class="scope-description">
            Metrics match the selected month and region. Open exceptions are unresolved issues at month-end; fewer exceptions and shorter transit times are better.
          </p>
        </div>
      </div>

      <v-row class="metric-row">
        <v-col v-for="metric in metricCards" :key="metric.key" cols="12" sm="6" xl="3">
          <MetricCard
            :label="metric.label"
            :value="metric.value"
            :comparison="metric.comparison"
            :trend-direction="metric.trendDirection"
            :favorable="metric.favorable"
            :icon="metric.icon"
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
                  <div class="chart-subtitle">Completed shipments · selected month highlighted</div>
                </div>
                <span class="chart-unit">SHIPMENTS</span>
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
                  <div class="chart-subtitle">Shipments delivered by their promised date · selected month highlighted</div>
                </div>
                <span class="chart-unit">ON TIME</span>
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
                  <div class="chart-subtitle">Unresolved delays, damage, or documentation issues at month end · selected month highlighted</div>
                </div>
                <span class="chart-unit">MONTH-END SNAPSHOT</span>
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
.app-bar-content { display: flex; align-items: center; justify-content: space-between; width: min(100% - 56px, 1480px); height: 100%; margin: 0 auto; gap: 24px; }
.brand-lockup { display: flex; align-items: center; gap: 12px; min-width: 230px; }
.brand-mark { display: grid; width: 38px; height: 38px; place-items: center; border: 1px solid rgba(112, 214, 180, .25); border-radius: 8px; background: rgba(112, 214, 180, .08); color: #70d6b4; }
.brand-mark :deep(.v-icon) { font-size: 21px; }
.brand-name { color: #e8f0ed; font-size: 14px; font-weight: 700; line-height: 1.2; }
.brand-name span { color: #a5b3af; font-weight: 450; }
.brand-subtitle { margin-top: 5px; color: #74827f; font-size: 8px; font-weight: 700; }
.app-bar-title { margin-left: auto; color: #dce5e1; font-size: 13px; font-weight: 600; }
.dashboard-container { max-width: 1536px; padding: 29px 28px 22px; }
.overview-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 16px; }
.eyebrow { color: #78a594; font-size: 9px; font-weight: 700; }
.eyebrow span { margin: 0 5px; color: #556460; }
.overview-heading h1 { margin: 7px 0 4px; color: #edf4f1; font-size: 24px; font-weight: 650; line-height: 1.2; }
.overview-heading p { color: #8c9a96; font-size: 11px; }
.dashboard-filters { display: grid; grid-template-columns: 180px 165px; gap: 9px; flex: 0 0 auto; }
.main-filter :deep(.v-field) { min-height: 42px; border-radius: 7px; }
.main-filter :deep(.v-field__input) { min-height: 42px; padding-top: 7px; padding-bottom: 7px; font-size: 11px; }
.main-filter :deep(.v-field__prepend-inner .v-icon) { color: #83938e; font-size: 17px; }
.scope-note { display: flex; align-items: flex-start; gap: 10px; min-height: 48px; margin-bottom: 11px; padding: 9px 12px; border-left: 2px solid #70d6b4; background: rgba(112, 214, 180, .045); }
.scope-icon { flex: 0 0 auto; margin-top: 1px; color: #70d6b4; }
.scope-copy { min-width: 0; }
.scope-title { color: #d5dfda; font-size: 10px; font-weight: 650; line-height: 1.3; }
.scope-description { margin-top: 3px; color: #9aa8a3; font-size: 10px; line-height: 1.45; }
.metric-row { margin-bottom: 8px; }
.chart-row { margin-top: 0; }
.chart-card { height: 100%; min-height: 330px; padding: 19px 20px 15px; border: 1px solid rgba(176, 199, 191, .12); border-radius: 8px; background: #171e20; }
.chart-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.chart-title { color: #e6efeb; font-size: 12px; font-weight: 650; }
.chart-subtitle { margin-top: 5px; color: #879590; font-size: 9px; line-height: 1.45; }
.chart-unit { padding-top: 2px; color: #71817d; font-size: 8px; font-weight: 700; white-space: nowrap; }
.chart-canvas { position: relative; width: 100%; margin-top: 14px; }
.primary-chart { height: 244px; }
.exceptions-card { min-height: 302px; }
.exception-chart { height: 220px; }
.empty-state { margin-top: 14px; }
.dashboard-footer { display: flex; align-items: center; justify-content: center; gap: 8px; padding-top: 10px; color: #697773; font-size: 8px; font-weight: 700; }
.status-dot { width: 5px; height: 5px; border-radius: 50%; background: #70d6b4; }
.footer-divider { color: #46534f; }
@media (max-width: 900px) {
  .app-bar-content { width: calc(100% - 36px); gap: 14px; }
  .brand-lockup { min-width: auto; }
  .overview-heading { align-items: flex-start; flex-direction: column; }
  .dashboard-filters { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); width: 100%; }
}
@media (max-width: 600px) {
  .app-bar-content { width: calc(100% - 28px); }
  .brand-name { font-size: 13px; }
  .app-bar-title { font-size: 11px; }
  .dashboard-container { padding: 22px 12px 18px; }
  .overview-heading { gap: 12px; }
  .overview-heading h1 { font-size: 21px; }
  .main-filter :deep(.v-field__input) { font-size: 10px; }
  .scope-note { padding: 9px 10px; }
  .metric-row { margin-bottom: 5px; }
  .chart-card { min-height: 294px; padding: 16px 14px 13px; }
  .primary-chart { height: 212px; }
  .exceptions-card { min-height: 276px; }
  .exception-chart { height: 196px; }
}
</style>