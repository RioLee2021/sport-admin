import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 9527,
    proxy: {
      // 开发环境：拦截 /pub 转发到 9060
      '/api': {
        target: 'http://localhost:9060',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')  // /api/pub/login.do → /pub/login.do
      }
    }
  }
})
