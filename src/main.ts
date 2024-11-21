import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router/index'
import { createPinia } from 'pinia'
import { loadFonts } from './plugins/webfontloader'
import i18n from './locales/i18n'
import * as Sentry from "@sentry/vue";
import { BrowserTracing } from "@sentry/tracing";

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

Sentry.init({
  app,
  dsn: "https://20a3411a988862503af74d4d8e7ec450@o4508321713684480.ingest.us.sentry.io/4508321717747712",
  integrations: [
    new BrowserTracing({
      routingInstrumentation: Sentry.vueRouterInstrumentation(router),
      tracingOrigins: ["localhost", /^\//],
    }),
  ],
  tracesSampleRate: 1.0,
  trackComponents: true,
});

app.use(createPinia())
app.use(vuetify)
app.use(router)
app.use(i18n)
app.mount('#app')
