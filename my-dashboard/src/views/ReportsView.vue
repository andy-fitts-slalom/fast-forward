<script setup lang="ts">
import { Bar, Line } from 'vue-chartjs'
import { BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip, type ChartOptions } from 'chart.js'

ChartJS.register(BarElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip)
const trendData = {
  labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  datasets: [
    { label: 'This year', data: [61, 68, 72, 79, 86, 96], borderColor: '#237a62', backgroundColor: 'rgba(35, 122, 98, 0.10)', fill: true, tension: 0.35, pointRadius: 2 },
    { label: 'Last year', data: [48, 52, 57, 62, 65, 71], borderColor: '#d8b66d', backgroundColor: 'transparent', fill: false, tension: 0.35, pointRadius: 2 },
  ],
}
const channelData = { labels: ['Direct', 'Organic search', 'Referral', 'Social', 'Email'], datasets: [{ label: 'Conversions', data: [480, 360, 245, 172, 126], backgroundColor: ['#237a62', '#78a993', '#f0b64c', '#c56c59', '#9aab9f'], borderRadius: 4, maxBarThickness: 28 }] }
const trendOptions: ChartOptions<'line'> = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 7, color: '#718078', padding: 20 } } },
  scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: '#89958e' } }, y: { border: { display: false }, grid: { color: '#edf0ed' }, ticks: { color: '#89958e', callback: (value) => `$${value}k` } } },
}
const channelOptions: ChartOptions<'bar'> = {
  indexAxis: 'y', responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { x: { border: { display: false }, grid: { color: '#edf0ed' }, ticks: { color: '#89958e' } }, y: { border: { display: false }, grid: { display: false }, ticks: { color: '#65736b' } } },
}
</script>

<template>
  <main class="reports-page">
    <header class="reports-heading"><div><div class="eyebrow">PERFORMANCE</div><h1>Reports</h1><p>Track the trends behind your growth.</p></div><v-btn prepend-icon="mdi-calendar-range" variant="outlined" rounded="lg">Last 6 months</v-btn></header>
    <section class="report-stats">
      <v-card v-for="stat in [{ label: 'Total revenue', value: '$426.8k', note: '+14.2% year over year' }, { label: 'New customers', value: '1,284', note: '+9.6% year over year' }, { label: 'Returning rate', value: '38.4%', note: '+2.1 pts year over year' }]" :key="stat.label" class="stat-card" rounded="lg" flat><span>{{ stat.label }}</span><strong>{{ stat.value }}</strong><small>{{ stat.note }}</small></v-card>
    </section>
    <section class="report-charts">
      <v-card class="report-panel" rounded="lg" flat><div class="panel-title"><h2>Revenue comparison</h2><p>Current year against the previous year</p></div><div class="chart"><Line :data="trendData" :options="trendOptions" aria-label="Revenue comparison line chart" /></div></v-card>
      <v-card class="report-panel" rounded="lg" flat><div class="panel-title"><h2>Conversions by channel</h2><p>Completed purchases this period</p></div><div class="chart"><Bar :data="channelData" :options="channelOptions" aria-label="Conversions by channel bar chart" /></div></v-card>
    </section>
  </main>
</template>

<style scoped>
.reports-page { max-width: 1440px; margin: 0 auto; padding: 42px 46px 56px; }.reports-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 28px; }.eyebrow { margin-bottom: 9px; color: #87948d; font-size: 10px; font-weight: 700; letter-spacing: 1px; }
h1 { margin: 0; color: #23332d; font-size: 29px; font-weight: 600; }.reports-heading p, .panel-title p { margin: 6px 0 0; color: #7c8982; font-size: 13px; }.reports-heading :deep(.v-btn) { border-color: #dce4de; color: #45564d; font-size: 12px; text-transform: none; }
.report-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 15px; }.stat-card { display: flex; min-height: 134px; flex-direction: column; align-items: flex-start; justify-content: center; gap: 8px; padding: 20px 22px; border: 1px solid #e8ece8; }.stat-card span { color: #7c8982; font-size: 11px; text-transform: uppercase; }.stat-card strong { color: #23332d; font-size: 25px; font-weight: 600; }.stat-card small { color: #237a62; font-size: 11px; }
.report-charts { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(300px, 1fr); gap: 15px; margin-top: 17px; }.report-panel { min-height: 380px; padding: 24px; border: 1px solid #e8ece8; }.panel-title h2 { margin: 0; color: #23332d; font-size: 14px; }.panel-title p { font-size: 11px; }.chart { height: 290px; margin-top: 20px; }
@media (max-width: 1100px) { .reports-page { padding-right: 28px; padding-left: 28px; }.report-charts { grid-template-columns: 1fr; } }
@media (max-width: 700px) { .reports-page { padding: 26px 18px 36px; }.reports-heading { align-items: flex-start; flex-direction: column; }.report-stats { grid-template-columns: 1fr; gap: 9px; }.stat-card { min-height: 108px; }.report-panel { min-height: 340px; padding: 18px; }.chart { height: 260px; } }
</style>