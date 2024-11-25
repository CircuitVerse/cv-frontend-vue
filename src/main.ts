import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router/index'
import { createPinia } from 'pinia'
import { loadFonts } from './plugins/webfontloader'
import i18n from './locales/i18n'
import * as Sentry from "@sentry/vue"
import 'bootstrap'

import './globalVariables'
import './styles/css/main.stylesheet.css'
import '../node_modules/bootstrap/scss/bootstrap.scss'
import './styles/color_theme.scss'
import './styles/simulator.scss'
import './styles/tutorials.scss'
import '@fortawesome/fontawesome-free/css/all.css'

loadFonts()

const app = createApp(App)
const isProd = import.meta.env.MODE === 'production'

Sentry.init({
  app,
  dsn: "https://20a3411a988862503af74d4d8e7ec450@o4508321713684480.ingest.us.sentry.io/4508321717747712",
  integrations: [],
  tracesSampleRate: isProd ? 0.2 : 1.0,
  replaysSessionSampleRate: isProd ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
  trackComponents: true,
  attachProps: true,
  logErrors: true,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION || '1.0.0',
  beforeSend(event) {
    if (!isProd) {
      console.error('Sentry error:', event);
      return null;
    }
    return event;
  },
  tracingOptions: {
    trackComponents: true,
    timeout: 2000,
    hooks: ['mount', 'update'],
  },
});

app.use(createPinia())
app.use(vuetify)
app.use(router)
app.use(i18n)
app.mount('#app')