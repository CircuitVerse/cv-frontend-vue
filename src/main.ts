// 1. Must load global variables first before any libraries or components touch window.*
import "./globalVariables";
import { createApp } from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import router from "./router/index";
import { createPinia } from "pinia";
import { loadFonts } from "./plugins/webfontloader";
import i18n from "./locales/i18n";
import "bootstrap";
import "./styles/css/main.stylesheet.css";
import "../node_modules/bootstrap/scss/bootstrap.scss";
import "./styles/color_theme.scss";
import "./styles/simulator.scss";
import "./styles/tutorials.scss";
import "@fortawesome/fontawesome-free/css/all.css";

loadFonts();
const app = createApp(App);

// 2. Error handler to log errors without breaking the entire Vue runtime
app.config.errorHandler = (err, _instance, info) => {
  console.error(`[Vue Error: ${info}]`, err);
};

app.use(createPinia());
app.use(vuetify);
app.use(router);
app.use(i18n);

// 3. Guarded element check & try-catch mounting protection
const mountElement = document.getElementById("app");
if (mountElement) {
  try {
    app.mount(mountElement);
  } catch (err) {
    console.error("[Vue Mount Error]", err);
  }
}
