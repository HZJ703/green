import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CompatibilityView from '../views/CompatibilityView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/herb-graph',
      name: 'herb-graph',
      component: () => import('../views/HerbGraphView.vue'),
    },
    {
      path: '/compatibility',
      name: 'compatibility',
      component: CompatibilityView,
    },
    {
      path: '/origin-map',
      name: 'origin-map',
      component: () => import('../views/OriginMapView.vue'),
    },
    {
      path: '/nature-meridian',
      name: 'nature-meridian',
      component: () => import('../views/NatureMeridianView.vue'),
    },
    {
      path: '/efficacy-network',
      name: 'efficacy-network',
      component: () => import('../views/EfficacyNetworkView.vue'),
    },
  ],
})

export default router
