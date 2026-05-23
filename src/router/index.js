// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 📦 静态路由（无需动态注册）
export const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { hidden: true }
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/welcome',
    meta: { hidden: true },
    children: [
      {
        path: 'welcome',
        name: 'Welcome',
        component: () => import('@/views/welcome/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/login', meta: { hidden: true } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes
})

// 🛡️ 修复后的路由守卫
router.beforeEach(async (to) => {
  const token = localStorage.getItem('token')
  const store = useUserStore()

  console.log('🛡️ 守卫触发:', to.path, 'Token:', !!token, 'UserInfo:', !!store.userInfo)

  // 1. 无 Token -> 踢回登录
  if (!token) {
    return to.path === '/login' ? true : `/login?redirect=${to.fullPath}`
  }

  // 2. 🔥 关键：有 Token 却在登录页 -> 踢去首页（触发初始化）
  if (to.path === '/login') {
    console.log('🔄 检测到登录态，自动跳转至首页...')
    return { path: '/', replace: true }
  }

  // 3. 已登录但 Store 未初始化（通常是 F5 刷新）
  if (!store.userInfo && !store._initializing) {
    console.log('🚀 触发 fetchInitData 重建路由...')
    try {
      store._initializing = true
      await store.fetchInitData()

      // 🔑 等待微任务完成，确保 addRoute 内部 matcher 已更新
      await new Promise(resolve => setTimeout(resolve, 0))

      // 重新进入当前路由
      return { ...to, replace: true }
    } catch (err) {
      console.error('❌ 初始化失败:', err)
      store.clearState()
      return `/login?redirect=${to.fullPath}`
    } finally {
      delete store._initializing
    }
  }

  // 4. 防死循环：如果正在初始化中，等待并重新进入
  if (!store.userInfo) {
    await new Promise(resolve => setTimeout(resolve, 100))
    return { ...to, replace: true }
  }

  // 5. 正常放行
  return true
})

export default router
