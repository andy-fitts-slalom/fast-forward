import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import './style.css'
import App from './App.vue'

const vuetify = createVuetify({
	theme: {
		defaultTheme: 'dashboardDark',
		themes: {
			dashboardDark: {
				dark: true,
				colors: {
					primary: '#71d8b7',
					secondary: '#efbd62',
					background: '#101516',
					surface: '#171e20',
					success: '#71d8b7',
					error: '#ed817c',
					info: '#8ebfd3',
				},
			},
		},
	},
	icons: { defaultSet: 'mdi' },
})

createApp(App).use(vuetify).mount('#app')
