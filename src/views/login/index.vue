<template>
  <div class="login-wrap">
    <el-card class="login-card">
      <h2>Sport Admin</h2>
      <el-form :model="form" @submit.prevent="handleLogin" label-position="top">
        <el-form-item required label="账号"><el-input v-model="form.account" /></el-form-item>
        <el-form-item required label="密码"><el-input v-model="form.password" type="password" /></el-form-item>
        <el-form-item label="验证码"><el-input v-model="form.otpCode" maxlength="6" /></el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" style="width:100%">登录</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { encryptPassword, isValidPassword } from '@/utils/encrypt'  // ✅ 引入
const userStore = useUserStore()
const router = useRouter()
const loading = ref(false)
const form = reactive({ account: '', password: '', otpCode: '' })

const handleLogin = async () => {
  // 1. 必填校验（账号/密码）
  if (!form.account?.trim()) {
    return ElMessage.warning('请输入账号')
  }
  if (!form.password) {
    return ElMessage.warning('请输入密码')
  }

  // 2. 验证码：有值则校验格式，无值则跳过
  const otpCode = form.otpCode?.trim()
  if (otpCode && !/^\d{6}$/.test(otpCode)) {
    return ElMessage.warning('验证码为 6 位数字')
  }

  // 3. 密码强度校验
  if (!isValidPassword(form.password)) {
    return ElMessage.warning('密码长度为 6-20 位')
  }

  loading.value = true
  try {
    // 🔥 关键：动态构造参数，验证码为空时不传该字段
    const loginData = {
      account: form.account.trim(),
      password: encryptPassword(form.password)
      // ✅ otpCode: 有值才添加，无值则完全省略
    }

    // 单独添加验证码字段（仅当有值时）
    if (otpCode) {
      loginData.otpCode = otpCode
    }

    await userStore.login(loginData)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap { height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0f2f5 }
.login-card { width: 360px; padding: 20px }
</style>
