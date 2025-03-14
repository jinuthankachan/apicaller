/// <reference types="vite/client" />

import { createRouter, createWebHistory } from 'vue-router'
import ApiView from '@/views/ApiView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: ApiView
    }
  ]
})

export default router
