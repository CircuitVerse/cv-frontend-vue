import { createRouter, createWebHistory } from "vue-router";
import simulatorHandler from "../pages/simulatorHandler.vue";
import Embed from "../pages/embed.vue";

export const routes = [
  {
    path: "/embed/:projectId?",
    name: "embed",
    component: Embed,
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
