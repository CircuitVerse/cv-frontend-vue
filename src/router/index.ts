import { createRouter, createWebHistory } from 'vue-router'
import simulator from '../pages/simulator.vue'

const routes = [
    {
        path: '/',
        redirect: '/simulatorvue',
    },
    {
        path: '/simulatorvue',
        name: 'simulator',
        component: simulator,
    },
]
const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
