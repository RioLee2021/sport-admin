import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const constantRoutes = [
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
  {
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    meta: { hidden: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
    meta: { hidden: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes
})

// ✅ 修复：完全移除 next()，改用 return
router.beforeEach(async (to) => {
  console.log('📋 当前路由表:', router.getRoutes().map(r => r.path))
  const token = localStorage.getItem('token')

  // 1. 访问登录页，直接放行
  if (to.path === '/login') return true

  // 2. 无 Token，踢回登录
  if (!token) return '/login'

  // 3. 已登录，但 Store 未初始化（通常是刷新页面触发）
  const store = useUserStore()
  if (!store.userInfo) {
    console.log('🚀 [Guard] 触发 fetchInitData...')
    try {
      await store.fetchInitData()
      console.log('✅ [Guard] 初始化成功')
      // 🔑 关键：Vue Router 4 注册路由是异步的，需等微任务完成再重定向
      await new Promise(resolve => setTimeout(resolve, 0))

      return { ...to, replace: true } // 重新进入当前路由
    } catch (err) {
      console.error('初始化失败，清除登录状态', err)
      store.clearState()
      return '/login'
    }
  }

  // 4. 正常放行
  console.log('✅ [Guard] 正常放行')
  return true
})

export default router
