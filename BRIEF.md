# FastForward Logistics Operations Dashboard - Project Brief

## What is this?
An internal, single-page operations dashboard for FastForward Logistics, a fictional mid-size freight and supply chain company. The VP of Operations should be able to open it during a leadership meeting and quickly answer: How many shipments are moving, are they arriving on time, which regions need attention, and how many delivery exceptions remain open?

The dashboard should feel like a practical operations tool, not a generic sales dashboard. Put the current operating picture first, then show trends and regional differences. Use plain labels so a first-time operations leader can understand each measure without a walkthrough.

## Data
Generate a realistic, fictional dataset in `src/data/metrics.json`. Use 12 months of data (January-December 2025), with one record per month and region for four regions: Northeast, Southeast, Midwest, and West. Each record should contain:
- `month` and `region`
- `shipments`: number of shipments completed in that month and region, with plausible seasonal variation
- `onTimeShipments`: number delivered by the promised date, never greater than `shipments`
- `openExceptions`: number of unresolved shipment issues at month end, such as delays, damaged freight, or missing documentation
- `avgTransitDays`: average delivery time in days for completed shipments

Keep the numbers internally consistent. Calculate on-time delivery rate as `onTimeShipments / shipments`, rather than storing a conflicting percentage. Treat open exceptions as a month-end snapshot: sum regions within a month, but do not sum exception counts across months to create a yearly total. Use only fictional data; no client or Slalom information.

## Layout (Vuetify)
- A `v-app-bar` at the top with the FastForward Logistics name, an "Operations overview" title, a month picker, and a region picker
- Both pickers default to "All"; the month picker offers January-December 2025, and the region picker offers the four regions
- Below the app bar: a row of four summary cards (`v-card`) showing completed shipments, on-time delivery rate, open exceptions, and average transit time
- Below the cards: a row of two charts
  - Left: bar chart showing monthly shipment volume
  - Right: line chart showing monthly on-time delivery rates by region, with a clear legend
- Below that: one full-width area chart showing the month-end open exceptions trend
- Use `v-container`, `v-row`, and `v-col` for a responsive grid. Make the card a reusable `MetricCard` component with props for its label, value, comparison, and trend direction.

## Interactions
- The month and region pickers filter every summary card and chart. "All" months shows the 12-month view; "All" regions combines regional values where appropriate and shows separate regional lines in the on-time chart.
- When a specific month is selected, keep the 12-month chart context but clearly highlight that month. When a specific region is selected, show that region's data in the cards and charts. The selected scope must be visible near the metrics so nobody mistakes a regional or monthly number for a company-wide annual figure.
- For "All" months, show total completed shipments, a shipment-weighted on-time rate, a shipment-weighted average transit time, and open exceptions from December 2025. For a selected month, show the same measures for that month, with open exceptions taken from that month's end. For "All" regions, sum shipment, on-time shipment, and open exception counts across regions before calculating rates; weight average transit time by shipment volume.
- Cards should show a small up/down arrow or color cue for change from the previous month, with the comparison labeled. In the full-year view, use December versus November monthly values for these cues, even though the main card values summarize the year. January has no previous month in this dataset, so show a neutral "No prior month" state instead of inventing a comparison. Make clear that fewer exceptions and shorter transit times are improvements.
- Handle empty or unavailable filtered data with a helpful message. Do not show `NaN`, misleading zeros, or broken charts.

## Style
- Dark theme by default (Vuetify dark theme), with a restrained palette suited to an internal logistics tool
- Clean, minimal layout with generous spacing, readable labels, and consistent number formatting (commas, percentages, and days)
- Use a cohesive chart palette, with region colors consistent between the line chart and any regional labels. Do not rely on color alone to convey good or bad performance.
- Make the dashboard easy to scan in a meeting: metric names, selected scope, units, legends, and trend meaning should be immediately clear.
- Mobile responsive: cards stack on small screens, charts resize without clipping, and filters remain usable.

## Tech
- Vue 3 + TypeScript + Vuetify 3
- Chart.js via `vue-chartjs` for all charts
- Fake data from a local JSON file; no API calls
- Single page; no routing needed for this dashboard
