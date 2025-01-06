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
        name: 'login',
        component: Login,
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL), 
    routes,
});

router.beforeEach((to, from, next) => {
    const loginCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('login='));
    
    if (!loginCookie && to.name !== 'login') {
        next({ name: 'login' });
    } else {
        next();
    }
});

export default router;
