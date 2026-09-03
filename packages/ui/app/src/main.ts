import Aura from '@primevue/themes/aura'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import { createApp } from 'vue'
import App from './App.vue'
import 'primeicons/primeicons.css'
import './style.css'

createApp(App)
	.use(PrimeVue, { theme: { preset: Aura } })
	.use(ConfirmationService)
	.use(ToastService)
	.mount('#app')
