import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { formatDateTime, formatDate, formatTimestamp } from '@/utils/format'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 全局属性（可在任意组件通过 $formatDateTime 访问）
app.config.globalProperties.$formatDateTime = formatDateTime
app.config.globalProperties.$formatDate = formatDate
app.config.globalProperties.$formatTimestamp = formatTimestamp

app.mount('#app')

// 🔧 开发环境：自动验证组件映射
/*if (import.meta.env.DEV) {
  setTimeout(async () => {
    try {
      const views = import.meta.glob('@/views/!**!/index.vue')
      const hasMerchant = '@/views/merchant/index.vue' in views

      console.group('🔍 [Auto-Check] 组件映射验证')
      console.log('📦 merchant 组件:', hasMerchant ? '✅ 已注册' : '❌ 未注册')

      if (!hasMerchant) {
        console.warn('💡 建议: 1. 确认文件存在  2. 重启 Vite  3. 检查文件夹大小写')
      }
      console.groupEnd()
    } catch (e) {
      console.error('❌ 验证失败:', e)
    }
  }, 2000)
}*/
