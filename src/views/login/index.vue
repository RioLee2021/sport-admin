<template>
  <div class="login-container">
    <el-card class="login-card">
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <h3 class="login-title">系统登录</h3>

        <el-form-item prop="account">
          <el-input
            v-model="loginForm.account"
            placeholder="请输入账号"
            prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            size="large"
          />
        </el-form-item>

        <el-form-item prop="otpCode">
          <el-input
            v-model="loginForm.otpCode"
            placeholder="请输入OTP验证码（选填）"
            prefix-icon="Key"
            size="large"
            clearable
          />
        </el-form-item>

        <!-- ✅ 记住账号 -->
        <el-form-item class="remember-row">
          <el-checkbox v-model="rememberAccount" size="large">记住账号</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="login-btn"
            size="large"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user' // ⚠️ 请根据实际 store 路径调整
import { ElMessage } from 'element-plus'
import md5 from 'blueimp-md5' // 已在 package.json 中

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref()
const loading = ref(false)

const REMEMBER_KEY = 'sys_login_remember_account'
const rememberAccount = ref(false)

const loginForm = reactive({
  account: '',
  password: '',
  otpCode: ''
})

// ✅ 规则调整：otpCode 移除 required
const loginRules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  otpCode: []
}

// 📥 页面加载：恢复记住的账号
onMounted(() => {
  const saved = localStorage.getItem(REMEMBER_KEY)
  if (saved) {
    loginForm.account = saved
    rememberAccount.value = true
  }
})

// 🔐 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      // ✅ 构造请求参数
      const payload = {
        account: loginForm.account,
        password: md5(loginForm.password), // 🔑 密码 MD5 加密
        otpCode: loginForm.otpCode || null // 🔑 OTP 为空时传 null
      }

      // 💡 若后端严格要求“空值不传字段”而非“传 null”，请取消下方注释：
      // if (!payload.otpCode) delete payload.otpCode

      // 调用 store 登录（假设 store.login 接收完整 payload）
      await userStore.login(payload)

      // ✅ 处理记住账号
      if (rememberAccount.value && loginForm.account) {
        localStorage.setItem(REMEMBER_KEY, loginForm.account)
      } else {
        localStorage.removeItem(REMEMBER_KEY)
      }

      ElMessage.success('登录成功')
      router.push('/')
    } catch (error) {
      ElMessage.error(error.message || '登录失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex; justify-content: center; align-items: center;
  min-height: 100vh; background: #f0f2f5;
}
.login-card { width: 400px; padding: 20px; }
.login-title { text-align: center; margin-bottom: 24px; color: #303133; font-weight: 500; }
.remember-row { margin-bottom: 16px; :deep(.el-form-item__content) { justify-content: flex-end; } }
.login-btn { width: 100%; }
</style>
