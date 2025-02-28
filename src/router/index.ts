import { createRouter, createWebHistory } from 'vue-router'
import simulatorHandler from '../pages/simulatorHandler.vue'
import Embed from '../pages/embed.vue'

export const routes = [
    {
        path: '/',
        name: 'simulator',
        component: simulatorHandler,
        children: [
            {
                path: 'edit/:projectId',
                name: 'simulator-edit',
                component: simulatorHandler,
                props: true,
            },
        ],
    },
    {
        path: '/:projectId',
        name: 'simulator-view',
        component: Embed,
        props: true,
    },
    {
        path: '/embed/:projectId',
        name: 'simulator-embed',
        component: Embed,
        props: true,
    },
]
const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
