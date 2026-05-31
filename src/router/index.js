import { createRouter, createWebHashHistory } from 'vue-router'
import CalendarView from '../views/CalendarView.vue'
import LoginView from '../views/LoginView.vue'
import { isLoggedIn } from '../api/auth.js'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'calendar',
      component: CalendarView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
  ],
})

// 路由守卫 - 可选：强制登录
// router.beforeEach((to, from, next) => {
//   if (to.name !== 'login' && !isLoggedIn()) {
//     next({ name: 'login' })
//   } else {
//     next()
//   }
// })

export default router
