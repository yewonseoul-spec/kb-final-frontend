import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import admin from './admin.js';
import asset from './asset.js';
import benefits from './benefits.js';
import mypage from './mypage.js';
import consumption from './consumption.js';
import auth from './auth.js';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home },
    ...admin,
    ...asset,
    ...benefits,
    ...mypage,
    ...consumption,
    ...auth,
  ],
});

export default router;
