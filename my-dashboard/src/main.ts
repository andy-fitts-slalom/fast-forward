import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import './style.css'
import App from './App.vue'
import router from './router'

const vuetify = createVuetify({
	theme: {
		defaultTheme: 'dashboardTheme',
		themes: {
			dashboardTheme: {
				dark: false,
				colors: {
					primary: '#237a62',
					secondary: '#f0b64c',
					surface: '#ffffff',
					background: '#f5f7f4',
					success: '#237a62',
					error: '#c25e4b',
				},
			},
		},
	},
	icons: { defaultSet: 'mdi' },
})

createApp(App).use(router).use(vuetify).mount('#app')
