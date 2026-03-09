import { createRouter, createWebHistory } from "vue-router";
import simulatorHandler from "../pages/simulatorHandler.vue";
import Embed from "../pages/embed.vue";
// Lazy-load theme editor page
const ThemeEditorPage = () => import("../pages/theme-editor.vue");

export const routes = [
  {
    path: "/embed/:projectId?",
    name: "embed",
    component: Embed,
  },
  {
    path: "/theme-editor",
    name: "theme-editor",
    component: ThemeEditorPage,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "simulator",
    component: simulatorHandler,
  },
];
const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
