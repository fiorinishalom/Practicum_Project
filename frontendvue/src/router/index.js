// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Main from '../FrontendComponents/Main.vue';
import Login from '../FrontendComponents/Login.vue';

const routes = [
    {
        path: '/',
        name: 'Main',
        component: Main,
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL), // Use import.meta.env instead of process.env
    routes,
});

export default router;
