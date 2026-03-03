import { createApp, defineComponent } from "vue";
import Embed from "./pages/embed.vue";
import vuetify from "./plugins/vuetify";
import { createRouter, createWebHistory } from "vue-router";
import { createPinia } from "pinia";
import i18n from "./locales/i18n";

import "./globalVariables";

import "./styles/color_theme.scss";
import "./styles/simulator.scss";
import "@fortawesome/fontawesome-free/css/all.css";

const embedRouter = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/embed/:projectId?",
            name: "embed",
            component: Embed,
        },
        {
            path: "/:pathMatch(.*)*",
            redirect: "/embed",
        },
    ],
});

const EmbedApp = defineComponent({ template: "<router-view />" });

const app = createApp(EmbedApp);

app.use(createPinia());
app.use(vuetify);
app.use(embedRouter);
app.use(i18n);
app.mount("#app");
