<template>
  <el-container class="layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
      <div class="logo">
        <span v-if="!isCollapse">Sport Admin</span>
        <span v-else>SA</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        router
        :collapse="isCollapse"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        :collapse-transition="false"
      >
        <template v-for="item in userStore.menus" :key="item.id || item.menuName">
          <el-menu-item v-if="!item.children?.length" :index="item.menuPath">
            <el-icon><component :is="formatIconName(item.icon)" /></el-icon>
            <template #title><span>{{ item.menuName }}</span></template>
          </el-menu-item>

          <el-sub-menu v-else :index="item.menuPath">
            <template #title>
              <el-icon><component :is="formatIconName(item.icon)" /></el-icon>
              <span>{{ item.menuName }}</span>
            </template>
            <el-menu-item
              v-for="child in item.children"
              :key="child.id || child.menuName"
              :index="child.menuPath"
            >
              {{ child.menuName }}
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="header-collapse" @click="toggleCollapse">
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $route.meta.title || '当前页面' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <span class="username">{{ userStore.userInfo?.name || '管理员' }}</span>
          <!-- ✅ 新增：重置密码按钮 -->
          <el-button type="warning" link size="small" @click="handleResetPassword">重置密码</el-button>
          <el-button type="danger" link size="small" @click="handleLogout">退出</el-button>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>

    <!-- 🔑 重置密码结果弹窗 -->
    <el-dialog
      v-model="resetPwdDialogVisible"
      title="密码重置成功"
      width="420px"
      :close-on-click-modal="false"
      @close="newPwdValue = ''"
    >
      <div class="pwd-result">
        <p>您的新密码已生成：</p>
        <div class="pwd-box">
          <el-input v-model="newPwdValue" readonly type="text" style="width: 100%" />
        </div>
        <el-alert type="warning" :closable="false" style="margin-top: 12px">
          请妥善保管该密码，关闭弹窗后将无法再次查看。
        </el-alert>
      </div>
      <template #footer>
        <el-button type="primary" @click="copyPassword" style="margin-right: 10px">📋 复制密码</el-button>
        <el-button type="info" @click="resetPwdDialogVisible = false">我知道了</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isCollapse = ref(false)
const activeMenu = computed(() => route.path)
const toggleCollapse = () => { isCollapse.value = !isCollapse.value }

const formatIconName = (icon) => {
  if (!icon) return 'Menu'
  if (icon.startsWith('el-icon-')) {
    return icon.replace('el-icon-', '').split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  }
  return icon
}

// 🔑 重置密码弹窗状态
const resetPwdDialogVisible = ref(false)
const newPwdValue = ref('')

// 🔑 重置密码功能
const handleResetPassword = async () => {
  try {
    await ElMessageBox.confirm('确定要重置登录密码吗？重置后原密码将失效。', '提示', {
      confirmButtonText: '确定重置',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // ✅ 调用 /pub/resetMyPassword.do 接口
    const res = await request.post('/pub/resetMyPassword.do', {})

    // 显示新密码弹窗
    newPwdValue.value = res.data || res || '获取失败'
    resetPwdDialogVisible.value = true
    ElMessage.success('密码重置成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重置失败：' + (error.message || '未知错误'))
    }
  }
}

// 📋 复制密码到剪贴板
const copyPassword = async () => {
  if (!newPwdValue.value) return ElMessage.warning('密码为空')

  try {
    // 优先使用 Clipboard API
    await navigator.clipboard.writeText(newPwdValue.value)
    ElMessage.success('✅ 密码已复制到剪贴板')
  } catch {
    // 降级方案：兼容旧浏览器
    const textarea = document.createElement('textarea')
    textarea.value = newPwdValue.value
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('✅ 密码已复制')
  }
}

// 🔚 退出登录
const handleLogout = async () => {
  await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  })
  await userStore.logout()
}
</script>

<style scoped lang="scss">
.layout { height: 100vh; overflow: hidden }

.aside {
  background: #304156;
  transition: width 0.3s;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;

  .logo {
    height: 60px; line-height: 60px; text-align: center;
    color: #fff; font-size: 18px; font-weight: bold; background: #2b3649;
    flex-shrink: 0;
  }

  // 📜 菜单容器允许垂直滚动
  :deep(.el-menu) {
    border-right: none;
    overflow-y: auto;
    flex: 1;
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
  }
}

// 📂 菜单组（父级）样式
:deep(.el-sub-menu) {
  .el-sub-menu__title {
    background-color: transparent !important;
    color: #bfcbd9 !important;
    font-weight: bold;
    font-size: 16px;
    height: 48px;
    line-height: 48px;
    border-radius: 6px;
    margin: 0 8px 6px 8px;
    padding-left: 12px !important;
    transition: all 0.2s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.08) !important;
      color: #fff !important;
    }
    .el-icon { margin-right: 10px; color: #a0a9b9; }
  }

  &.is-active > .el-sub-menu__title {
    background-color: rgba(64, 158, 255, 0.1) !important;
    color: #409EFF !important;
    .el-icon { color: #409EFF !important; }
  }
}

// 🖱️ 叶子菜单（按钮样式）
:deep(.el-menu--inline) {
  background-color: transparent !important;
  padding: 0 4px;

  .el-menu-item {
    background-color: #364055;
    color: #a0a9b9;
    height: 38px;
    line-height: 38px;
    margin: 0 8px 8px 8px;
    border-radius: 8px;
    padding-left: 16px !important;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(255, 255, 255, 0.04);
    position: relative;
    overflow: hidden;

    &:hover {
      background-color: #409EFF;
      color: #fff;
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.35);
      border-color: transparent;
    }

    &.is-active {
      background: linear-gradient(90deg, #409EFF, #66b1ff);
      color: #fff;
      font-weight: 600;
      border-color: transparent;
      box-shadow: 0 4px 14px rgba(64, 158, 255, 0.45);

      &::after {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        background: #fff;
        border-radius: 0 2px 2px 0;
      }
    }

    .el-icon { margin-right: 8px; font-size: 15px; }
  }
}

// 📉 折叠状态适配
:deep(.el-menu--collapse) {
  .el-sub-menu__title, .el-menu-item {
    margin: 0 6px 8px 6px !important;
    border-radius: 8px;
    padding-left: 0 !important;
    justify-content: center;
  }
  .el-sub-menu__title .el-icon, .el-menu-item .el-icon {
    margin-right: 0 !important;
    font-size: 18px;
  }
  .el-menu-item.is-active::after { display: none; }
}

.header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 20px; background: #fff; border-bottom: 1px solid #eee; height: 60px;

  .header-left { display: flex; align-items: center; gap: 20px; }
  .header-collapse {
    font-size: 20px; cursor: pointer; color: #606266; transition: color 0.3s;
    &:hover { color: #409EFF; }
  }
}
.header-right {
  display: flex; align-items: center; gap: 15px;
  .username { color: #666; font-size: 14px }
}
.main { padding: 20px; background: #f0f2f5; overflow: auto }

/* 🔑 重置密码弹窗样式 */
:deep(.pwd-result) {
  .pwd-box { margin: 16px 0; :deep(.el-input__inner) {
    font-family: 'Courier New', monospace;
    letter-spacing: 1px;
    background-color: #f5f7fa;
    font-weight: 500;
  }}
  :deep(.el-alert) { padding: 8px 12px; font-size: 13px; }
}
</style>
