// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/origin-map',
      name: 'origin-map',
      component: () => import('../views/OriginMapView.vue'),
    },
    {
      path: '/herb-graph',
      name: 'herb-graph',
      component: () => import('../views/HerbGraphView.vue'),
    },
    {
      path: '/compatibility',
      name: 'compatibility',
      component: () => import('../views/CompatibilityView.vue'),
    },
    {
      path: '/efficacy-network',
      name: 'efficacy-network',
      component: () => import('../views/EfficacyNetworkView.vue'),
    },
    {
      path: '/nature-meridian',
      name: 'nature-meridian',
      component: () => import('../views/NatureMeridianView.vue'),
    },
    // 可选：重定向未匹配路由到首页
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router