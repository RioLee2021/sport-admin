import { defineStore } from 'pinia'
import request from '@/utils/request'
import { useRouter } from 'vue-router'
import { saveDict, getDict } from '@/utils/dict'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null,
    menus: []
  }),
  actions: {
    async login(form) {
      const res = await request.post('/pub/login.do', form)
      this.token = res.data
      localStorage.setItem('token', this.token)
      return this.fetchInitData()
    },

    // src/store/user.js -> actions.fetchInitData
    async fetchInitData() {
      console.log('🚀 fetchInitData 开始执行')

      try {
        const [userRes, menuRes, dictRes] = await Promise.all([
          request.post('/pub/info.do', {}),
          request.post('/pub/menus.do', {}),
          request.post('/pub/dict.do', {})
        ])

        console.log('✅ 接口调用成功')
        console.log('📋 menus 数据:', menuRes.data)

        this.userInfo = userRes.data
        this.menus = menuRes.data
        saveDict(dictRes.data)

        // 🔥 关键：调用 generateRoutes 并捕获错误
        try {
          const { generateRoutes } = await import('@/router/dynamic')
          console.log('🔄 开始生成动态路由...')
          generateRoutes(menuRes.data)
          console.log('✅ 动态路由生成完成')
        } catch (routeErr) {
          console.error('❌ generateRoutes 执行失败:', routeErr)
          throw routeErr
        }

        return true
      } catch (e) {
        console.error('❌ fetchInitData 失败:', e)
        this.clearState()
        throw e
      }
    },

    // ✅ 修改 logout 方法
    async logout() {
      console.log('🔐 开始执行登出...')

      try {
        // 1. 调用后端接口
        await request.post('/pub/logout.do', {})
        console.log('✅ 登出接口调用成功')
      } catch (err) {
        console.warn('⚠️ 登出接口失败，继续清理本地:', err?.message)
      }

      // 2. 清理本地状态（一定执行）
      this.clearState()
      console.log('🧹 本地状态已清空')

      // 3. 🔥 跳转登录页（关键：加错误捕获 + 备选方案）
      try {
        // 方案 A：尝试用 Vue Router 跳转
        const { default: router } = await import('@/router')
        console.log('🔄 尝试 router.replace("/login")...')
        await router.replace('/login')
        console.log('✅ 路由跳转成功')
      } catch (e) {
        console.error('❌ router.replace 失败:', e?.message)

        // 方案 B：强制刷新跳转（兜底）
        console.log('🚨 启用兜底方案：window.location.href')
        window.location.href = '/login'
      }
    },

    clearState() {
      this.token = ''
      this.userInfo = null
      this.menus = []  // ✅ 也清空菜单
      localStorage.removeItem('token')
      localStorage.removeItem('dictData')

      // 4. 可选：重置动态路由（防止路由残留）
      import('@/router/dynamic').then(m => m.resetRoutes?.())
    }
  }
})
