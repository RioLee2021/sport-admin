import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/stores/user'

const service = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || '/api',
  timeout: 30000
})

service.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = token
  return config
})

service.interceptors.response.use(
  response => {
    // 🔑 核心修复：文件下载请求直接放行，不解析 JSON
    if (response.config.responseType === 'blob') {
      // 兼容后端异常时返回的 JSON 错误信息（被包装成 blob）
      if (response.data.type === 'application/json') {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            try {
              const errData = JSON.parse(reader.result)
              reject(new Error(errData.message || errData.msg || '下载失败'))
            } catch {
              reject(new Error('下载失败'))
            }
          }
          reader.readAsText(response.data)
        })
      }
      return response // ✅ 正常文件流，直接返回完整 response 对象
    }

    const res = response.data
    // 🔥 拦截 code=1000 登录失效
    if (res.code === '1000' || res.code === 1000) {
      useUserStore().clearState()
      ElMessageBox.alert('登录已失效，请重新登录', '提示', {
        confirmButtonText: '重新登录',
        callback: () => router.push('/login')
      })
      return Promise.reject(new Error('登录失效'))
    }
    if (res.code !== '200' && res.code !== 200) {
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    return res
  },
  error => {
    if (error.response?.status === 401) {
      useUserStore().clearState()
      router.push('/login')
    } else {
      ElMessage.error(error.message || '请求失败')
    }
    return Promise.reject(error)
  }
)

export default service
