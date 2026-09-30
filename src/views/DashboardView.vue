<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArcElement, CategoryScale, Chart as ChartJS, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip, type ChartOptions } from 'chart.js'
import { Doughnut, Line } from 'vue-chartjs'

ChartJS.register(ArcElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip)
const period = ref('12 months')
const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
const revenue = [42, 49, 45, 61, 58, 68, 64, 77, 73, 86, 82, 96]
function exportReport() {
  const csv = [['Month', 'Revenue ($k)'], ...months.map((month, index) => [month, String(revenue[index])])]
    .map((row) => row.join(','))
    .join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'fieldnote-revenue.csv'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const revenueData = computed(() => {
  const length = period.value === '30 days' ? 4 : period.value === '90 days' ? 6 : 12
  return {
    labels: months.slice(-length),
    datasets: [{ label: 'Revenue', data: revenue.slice(-length), borderColor: '#237a62', backgroundColor: 'rgba(35, 122, 98, 0.10)', fill: true, tension: 0.38, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2.5 }],
  }
})
const lineOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { displayColors: false, callbacks: { label: (context) => `$${context.parsed.y}k` } } },
  scales: {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: '#8a968f' } },
    y: { beginAtZero: true, border: { display: false, dash: [3, 4] }, grid: { color: '#edf0ed' }, ticks: { color: '#8a968f', callback: (value) => `$${value}k`, maxTicksLimit: 5 } },
  },
}
const sourceData = { labels: ['Direct', 'Organic', 'Referral', 'Social'], datasets: [{ data: [42, 28, 18, 12], backgroundColor: ['#237a62', '#f0b64c', '#78a993', '#dce8e0'], borderWidth: 0, hoverOffset: 3 }] }
const doughnutOptions: ChartOptions<'doughnut'> = { cutout: '72%', maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => `${context.label}: ${context.parsed}%` } } } }
const activities = [
  { initials: 'LM', name: 'Lena Morris', detail: 'Annual plan renewed', date: 'Today, 10:42 AM', value: '+$2,400' },
  { initials: 'JR', name: 'Jonah Reed', detail: 'New workspace created', date: 'Today, 9:18 AM', value: '+$840' },
  { initials: 'SK', name: 'Sana Kim', detail: 'Pro plan upgraded', date: 'Yesterday', value: '+$1,200' },
]
</script>

<template>
  <main class="page-wrap">
    <header class="page-heading">
      <div><div class="eyebrow">TUESDAY, SEPTEMBER 29, 2026</div><h1>Good morning, Alex<span>.</span></h1><p>Here is what is happening across your business.</p></div>
      <v-btn class="export-button" prepend-icon="mdi-tray-arrow-down" variant="outlined" rounded="lg" @click="exportReport">Export report</v-btn>
    </header>
    <section class="metric-grid" aria-label="Key performance indicators">
      <v-card v-for="metric in [{ label: 'Revenue', value: '$84,254', change: '12.8%', icon: 'mdi-currency-usd', tone: 'green' }, { label: 'Active customers', value: '2,410', change: '8.2%', icon: 'mdi-account-group-outline', tone: 'gold' }, { label: 'Conversion rate', value: '3.62%', change: '0.4%', icon: 'mdi-target', tone: 'coral' }, { label: 'Avg. order value', value: '$128.60', change: '4.6%', icon: 'mdi-basket-outline', tone: 'blue' }]" :key="metric.label" class="metric-card" rounded="lg" flat>
        <div class="metric-top"><span>{{ metric.label }}</span><v-icon :icon="metric.icon" /></div>
        <div class="metric-value">{{ metric.value }}</div>
        <div class="metric-foot"><span :class="['change', metric.tone === 'coral' ? 'down' : 'up']"><v-icon :icon="metric.tone === 'coral' ? 'mdi-arrow-bottom-right' : 'mdi-arrow-top-right'" size="14" />{{ metric.change }}</span><span>vs. last month</span></div>
        <div :class="['sparkline', metric.tone]"><i /><i /><i /><i /><i /><i /><i /><i /></div>
      </v-card>
    </section>
    <section class="content-grid">
      <v-card class="panel revenue-panel" rounded="lg" flat>
        <div class="panel-heading"><div><h2>Revenue over time</h2><p>Monthly recurring revenue</p></div>
          <v-btn-toggle v-model="period" mandatory color="primary" density="compact" rounded="lg" class="range-toggle">
            <v-btn value="30 days" size="small">30 days</v-btn><v-btn value="90 days" size="small">90 days</v-btn><v-btn value="12 months" size="small">12 months</v-btn>
          </v-btn-toggle>
        </div>
        <div class="revenue-total"><strong>$96.4k</strong><span class="change up">+12.8%</span></div>
        <div class="line-chart"><Line :data="revenueData" :options="lineOptions" aria-label="Revenue trend line chart" /></div>
      </v-card>
      <v-card class="panel sources-panel" rounded="lg" flat>
        <div class="panel-heading"><div><h2>Traffic sources</h2><p>Where visitors come from</p></div><v-btn icon="mdi-dots-horizontal" variant="text" size="small" aria-label="More traffic source options" /></div>
        <div class="source-chart"><Doughnut :data="sourceData" :options="doughnutOptions" aria-label="Traffic sources doughnut chart" /><div class="source-total"><strong>8,492</strong><span>visitors</span></div></div>
        <div class="source-legend"><div><i class="direct" />Direct<strong>42%</strong></div><div><i class="organic" />Organic<strong>28%</strong></div><div><i class="referral" />Referral<strong>18%</strong></div><div><i class="social" />Social<strong>12%</strong></div></div>
      </v-card>
    </section>
    <v-card class="panel activity-panel" rounded="lg" flat>
      <div class="panel-heading activity-heading"><div><h2>Recent activity</h2><p>Your latest customer updates</p></div><v-btn variant="text" color="primary" append-icon="mdi-arrow-right" to="/reports">View reports</v-btn></div>
      <div v-for="activity in activities" :key="activity.name" class="activity-row">
        <v-avatar class="activity-avatar" size="38">{{ activity.initials }}</v-avatar>
        <div class="activity-person"><strong>{{ activity.name }}</strong><span>{{ activity.detail }}</span></div><div class="activity-date">{{ activity.date }}</div><div class="activity-value">{{ activity.value }}</div>
      </div>
    </v-card>
  </main>
</template>

<style scoped>
.page-wrap { max-width: 1440px; margin: 0 auto; padding: 42px 46px 56px; }
.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 29px; }
.eyebrow { margin-bottom: 10px; color: #87948d; font-size: 10px; font-weight: 700; letter-spacing: 1px; }
h1 { margin: 0; color: var(--ink); font-size: 29px; font-weight: 600; line-height: 1.25; }
h1 span { color: var(--green); }
.page-heading p, .panel-heading p { margin: 6px 0 0; color: var(--muted); font-size: 13px; }
.export-button { height: 40px; border-color: #dce4de; color: #45564d; font-size: 12px; font-weight: 600; text-transform: none; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 15px; }
.metric-card, .panel { border: 1px solid #e8ece8; }
.metric-card { position: relative; min-height: 151px; overflow: hidden; padding: 19px 20px; }
.metric-top { display: flex; align-items: center; justify-content: space-between; color: #7d8982; font-size: 10px; font-weight: 700; text-transform: uppercase; }
.metric-top :deep(.v-icon) { color: #96a29b; font-size: 18px; }
.metric-value { margin-top: 15px; color: var(--ink); font-size: 27px; font-weight: 600; line-height: 1; }
.metric-foot { display: flex; align-items: center; gap: 7px; margin-top: 12px; color: #929c96; font-size: 11px; }
.change { display: inline-flex; align-items: center; gap: 2px; font-size: 11px; font-weight: 700; }.change.up { color: #258065; }.change.down { color: #c56c59; }
.sparkline { position: absolute; right: 16px; bottom: 22px; display: flex; align-items: end; gap: 3px; height: 25px; opacity: .58; color: var(--green); }
.sparkline i { width: 4px; height: 45%; border-radius: 4px; background: currentColor; }.sparkline i:nth-child(2) { height: 70%; }.sparkline i:nth-child(3) { height: 52%; }.sparkline i:nth-child(4) { height: 85%; }.sparkline i:nth-child(5) { height: 62%; }.sparkline i:nth-child(6) { height: 92%; }.sparkline i:nth-child(7) { height: 76%; }.sparkline i:nth-child(8) { height: 100%; }
.sparkline.gold { color: #d59c30; }.sparkline.coral { color: #c56c59; }.sparkline.blue { color: #6389a0; }
.content-grid { display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(280px, 1fr); gap: 15px; margin-top: 17px; }
.revenue-panel, .sources-panel { min-height: 365px; padding: 23px 24px 20px; }
.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }.panel-heading h2 { margin: 0; color: var(--ink); font-size: 14px; font-weight: 700; }.panel-heading p { margin-top: 4px; font-size: 11px; }
.range-toggle { border: 1px solid #e7ebe7; }.range-toggle :deep(.v-btn) { padding: 0 9px; color: #78857d; font-size: 10px; text-transform: none; }.range-toggle :deep(.v-btn--active) { color: var(--green) !important; background: #edf5f1; }
.revenue-total { display: flex; align-items: center; gap: 9px; margin-top: 20px; }.revenue-total strong { color: var(--ink); font-size: 23px; font-weight: 600; }
.line-chart { height: 197px; margin-top: 10px; }.source-chart { position: relative; width: 174px; height: 174px; margin: 22px auto 12px; }.source-total { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }.source-total strong { font-size: 19px; font-weight: 600; }.source-total span { margin-top: 2px; color: var(--muted); font-size: 10px; }
.source-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px; }.source-legend div { display: flex; align-items: center; gap: 6px; color: #6f7b74; font-size: 10px; }.source-legend strong { margin-left: auto; color: #46564d; }.source-legend i { width: 7px; height: 7px; border-radius: 50%; }.direct { background: #237a62; }.organic { background: #f0b64c; }.referral { background: #78a993; }.social { background: #dce8e0; }
.activity-panel { margin-top: 17px; padding: 22px 24px 6px; }.activity-heading { margin-bottom: 14px; }.activity-heading :deep(.v-btn) { font-size: 11px; font-weight: 600; text-transform: none; }
.activity-row { display: flex; align-items: center; gap: 12px; min-height: 63px; border-top: 1px solid #eef1ee; }.activity-avatar { color: #286c56; background: #e7f2eb; font-size: 10px; font-weight: 700; }.activity-person { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 3px; }.activity-person strong { overflow: hidden; color: #34443b; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.activity-person span, .activity-date { color: #89958e; font-size: 10px; }.activity-value { min-width: 62px; color: #2b6852; font-size: 11px; font-weight: 700; text-align: right; }
@media (max-width: 1200px) { .page-wrap { padding-right: 28px; padding-left: 28px; }.metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 960px) { .page-wrap { padding: 26px 18px 36px; }.page-heading { align-items: flex-start; flex-direction: column; margin-bottom: 21px; }.content-grid { grid-template-columns: 1fr; }.line-chart { height: 210px; } }
@media (max-width: 480px) { .metric-grid { gap: 9px; }.metric-card { min-height: 136px; padding: 15px 13px; }.metric-top { font-size: 8px; }.metric-value { font-size: 22px; }.sparkline { right: 12px; bottom: 17px; }.range-toggle :deep(.v-btn) { padding: 0 5px; font-size: 9px; }.revenue-panel, .sources-panel, .activity-panel { padding-right: 16px; padding-left: 16px; }.activity-date { display: none; } }
</style>