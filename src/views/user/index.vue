<template>
  <div class="user-container">
    <!-- 🔍 查询表单 -->
    <el-card class="search-card" shadow="hover">
      <el-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        label-width="80px"
        @submit.prevent
      >
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="账号" prop="account">
              <el-input
                v-model="queryParams.account"
                placeholder="请输入账号"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <div class="search-buttons">
              <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 📋 表格区域 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">用户列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增用户</el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="账号" prop="account" min-width="120" show-overflow-tooltip />
        <el-table-column label="姓名" prop="name" min-width="100" show-overflow-tooltip />

        <el-table-column label="角色类型" prop="roleType" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getRoleTypeTag(row.roleType)">
              {{ getDictLabel('RoleType', row.roleType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="登录验证" prop="loginOtpFlag" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.loginOtpFlag ? 'success' : 'info'">
              {{ row.loginOtpFlag ? '已开启' : '未开启' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="商户ID" prop="merchantId" width="100" align="center" />
        <el-table-column label="最后登录IP" prop="lastLoginIp" width="140" align="center" />
        <el-table-column label="最后登录地区" prop="lastLoginRegion" width="140" show-overflow-tooltip />

        <el-table-column label="最后登录时间" prop="lastLoginAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.lastLoginAt) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="handleAuthConfig(row)">权限配置</el-button>
            <el-button type="warning" link size="small" @click="handleResetOtp(row)">重置OTP</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleQuery"
        @current-change="handleQuery"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- ✏️ 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="120px"
        label-position="right"
      >
        <el-form-item label="用户ID" prop="id" v-if="isEdit">
          <el-input v-model="editForm.id" disabled />
        </el-form-item>

        <el-form-item label="账号" prop="account">
          <el-input
            v-model="editForm.account"
            :disabled="isEdit"
            placeholder="请输入账号"
            maxlength="50"
            show-word-limit
            clearable
          />
        </el-form-item>

        <el-form-item label="姓名" prop="name">
          <el-input
            v-model="editForm.name"
            placeholder="请输入姓名"
            maxlength="50"
            show-word-limit
            clearable
          />
        </el-form-item>

        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input
            v-model="editForm.password"
            type="password"
            placeholder="请输入密码（6-20位）"
            maxlength="20"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item label="角色类型" prop="roleType">
          <el-select
            v-model="editForm.roleType"
            placeholder="请选择角色类型"
            style="width: 100%"
          >
            <el-option
              v-for="item in getDictOptions('RoleType')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="商户ID" prop="merchantId">
          <el-input-number
            v-model="editForm.merchantId"
            :min="0"
            :precision="0"
            controls-position="right"
            style="width: 100%"
            placeholder="请输入商户ID"
          />
        </el-form-item>

        <el-form-item label="登录验证" prop="loginOtpFlag">
          <el-switch
            v-model="editForm.loginOtpFlag"
            active-text="开启"
            inactive-text="关闭"
          />
        </el-form-item>

        <el-form-item label="登录白名单" prop="loginWhiteList">
          <el-input
            v-model="editForm.loginWhiteList"
            type="textarea"
            :rows="3"
            placeholder="请输入登录白名单IP，多个用英文逗号分隔（如：192.168.1.1,10.0.0.1）"
            maxlength="500"
            show-word-limit
            clearable
          />
          <div class="form-tip">多个IP地址用英文逗号分隔，留空表示不限制</div>
        </el-form-item>

        <el-divider content-position="left" v-if="isEdit">登录信息（只读）</el-divider>
        <el-row :gutter="20" v-if="isEdit">
          <el-col :span="12">
            <el-form-item label="最后登录IP">
              <el-input v-model="editForm.lastLoginIp" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最后登录地区">
              <el-input v-model="editForm.lastLoginRegion" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="isEdit">
          <el-col :span="12">
            <el-form-item label="最后登录时间">
              <el-input :value="$formatDateTime(editForm.lastLoginAt)" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="创建时间">
              <el-input :value="$formatDateTime(editForm.createAt)" disabled />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 🔐 权限配置对话框 -->
    <el-dialog
      v-model="authDialogVisible"
      :title="`权限配置 - ${currentUserAccount}`"
      width="700px"
      :close-on-click-modal="false"
    >
      <div class="auth-config-container">
        <el-alert
          title="提示：勾选菜单即授予用户访问权限，父子节点自动联动"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 20px"
        />

        <!-- ✅ 移除 check-strictly，启用默认级联勾选 -->
        <el-tree
          ref="authTreeRef"
          :data="authTreeData"
          :props="treeProps"
          node-key="id"
          show-checkbox
          default-expand-all
          :expand-on-click-node="false"
          class="auth-tree"
        >
          <template #default="{ node, data }">
            <span class="tree-node">
              <el-icon v-if="data.uriFlag" class="node-icon"><Document /></el-icon>
              <el-icon v-else class="node-icon"><Menu /></el-icon>
              <span class="node-label">{{ node.label }}</span>
              <el-tag v-if="data.uriFlag" size="small" type="info" style="margin-left: 8px">URI</el-tag>
              <span class="node-path">{{ data.menuPath }}</span>
            </span>
          </template>
        </el-tree>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="authDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="authSubmitLoading" @click="handleAuthSubmit">
            保存配置
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 🔐 重置OTP弹窗 -->
    <el-dialog
      v-model="otpDialogVisible"
      title="重置谷歌验证器"
      width="480px"
      :close-on-click-modal="false"
      center
      @close="handleOtpDialogClose"
    >
      <div class="otp-container">
        <img
          v-if="qrCodeUrl"
          :src="qrCodeUrl"
          alt="QR Code"
          class="qr-code"
        />
        <div v-else class="qr-loading">生成中...</div>

        <div class="otp-info">
          <span class="otp-code">{{ otpCode }}</span>
          <el-button type="primary" link size="small" @click="copyOtpCode">
            <el-icon><CopyDocument /></el-icon> 复制
          </el-button>
        </div>
        <div class="otp-tip">请使用 Google Authenticator 扫描上方二维码</div>
      </div>
      <template #footer>
        <el-button type="primary" @click="otpDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, CopyDocument, Menu, Document } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'
import QRCode from 'qrcode'
import md5 from 'blueimp-md5'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  account: '',
  page: 1,
  pageSize: 10
})

// 📄 分页参数
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const queryFormRef = ref()

// ✏️ 对话框状态
const dialogVisible = ref(false)
const editFormRef = ref()
const submitLoading = ref(false)
const isEdit = ref(false)

// 编辑/新增表单数据
const editForm = reactive({
  id: null,
  account: '',
  name: '',
  password: '',
  roleType: null,
  merchantId: null,
  loginOtpFlag: false,
  loginWhiteList: '',
  lastLoginIp: '',
  lastLoginRegion: '',
  lastLoginAt: null,
  createAt: null
})

// 编辑表单验证规则
const editRules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  roleType: [
    { required: true, message: '请选择角色类型', trigger: 'change' }
  ],
  merchantId: [
    { required: true, message: '请输入商户ID', trigger: 'blur' }
  ]
}

const dialogTitle = computed(() => isEdit.value ? '编辑用户' : '新增用户')

// 🔐 OTP 弹窗状态
const otpDialogVisible = ref(false)
const otpCode = ref('')
const qrCodeUrl = ref('')

// 🔐 权限配置状态
const authDialogVisible = ref(false)
const authTreeRef = ref()
const authSubmitLoading = ref(false)
const currentUserAccount = ref('')
const currentUserId = ref(null)
const authTreeData = ref([])
const availableUriList = ref([])
const currentUriList = ref([])

const treeProps = {
  children: 'children',
  label: 'menuName',
  value: 'id'
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const res = await request.post('/user/page.do', {
      account: queryParams.account,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res.data) {
      tableData.value = res.data.list || res.data.records || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    ElMessage.error('查询失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  queryFormRef.value?.resetFields()
  pagination.page = 1
  handleQuery()
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(editForm, {
    id: null, account: '', name: '', password: '', roleType: null,
    merchantId: null, loginOtpFlag: false, loginWhiteList: '',
    lastLoginIp: '', lastLoginRegion: '', lastLoginAt: null, createAt: null
  })
  dialogVisible.value = true
  setTimeout(() => editFormRef.value?.clearValidate(), 100)
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(editForm, row)
  dialogVisible.value = true
  setTimeout(() => editFormRef.value?.clearValidate(), 100)
}

const handleSubmit = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      const submitData = {
        id: editForm.id, account: editForm.account, name: editForm.name,
        roleType: editForm.roleType, merchantId: editForm.merchantId,
        loginOtpFlag: editForm.loginOtpFlag, loginWhiteList: editForm.loginWhiteList
      }
      if (!isEdit.value) submitData.password = md5(editForm.password)

      await request.post(isEdit.value ? '/user/edit.do' : '/user/add.do', submitData)
      ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
      dialogVisible.value = false
      handleQuery()
    } catch (error) {
      ElMessage.error((isEdit.value ? '修改' : '新增') + '失败：' + (error.message || '未知错误'))
    } finally {
      submitLoading.value = false
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除用户"${row.account}"吗？此操作不可恢复！`, '警告', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(async () => {
    try {
      await request.post('/user/delete.do', { id: row.id })
      ElMessage.success('删除成功')
      handleQuery()
    } catch (error) {
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

/** 🔐 打开权限配置 */
const handleAuthConfig = async (row) => {
  currentUserId.value = row.id
  currentUserAccount.value = row.account
  authDialogVisible.value = true
  authSubmitLoading.value = true

  try {
    // ✅ 接口参数改为 id
    const [availableRes, currentRes] = await Promise.all([
      request.post('/user/uriList.do', { id: row.id }),
      request.post('/user/currentUriList.do', { id: row.id })
    ])

    availableUriList.value = availableRes.data || []
    currentUriList.value = currentRes.data || []
    buildAuthTree()

    setTimeout(() => {
      const checkedKeys = currentUriList.value.map(item => item.id)
      authTreeRef.value?.setCheckedKeys(checkedKeys, false)
    }, 100)
  } catch (error) {
    ElMessage.error('加载权限配置失败：' + (error.message || '未知错误'))
  } finally {
    authSubmitLoading.value = false
  }
}

const buildAuthTree = () => {
  const treeMap = new Map()
  const rootNodes = []

  availableUriList.value.forEach(item => {
    treeMap.set(item.id, { ...item, children: [] })
  })

  availableUriList.value.forEach(item => {
    const node = treeMap.get(item.id)
    const parentPath = getParentPath(item.menuPath)

    if (parentPath) {
      const parentNode = Array.from(treeMap.values()).find(n => n.menuPath === parentPath)
      parentNode ? parentNode.children.push(node) : rootNodes.push(node)
    } else {
      rootNodes.push(node)
    }
  })

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => (a.sortNo || 0) - (b.sortNo || 0))
    nodes.forEach(node => node.children?.length && sortNodes(node.children))
  }
  sortNodes(rootNodes)
  authTreeData.value = rootNodes
}

const getParentPath = (path) => {
  if (!path || path === '/') return null
  const parts = path.split('/').filter(p => p)
  if (parts.length <= 1) return null
  parts.pop()
  return '/' + parts.join('/')
}

/** 💾 提交权限配置 */
const handleAuthSubmit = async () => {
  const checkedKeys = authTreeRef.value?.getCheckedKeys() || []
  const halfCheckedKeys = authTreeRef.value?.getHalfCheckedKeys() || []
  const allCheckedKeys = [...new Set([...checkedKeys, ...halfCheckedKeys])]

  try {
    // ✅ 接口参数改为 id
    await request.post('/user/submitAuthConfig.do', {
      id: currentUserId.value,
      menuIds: allCheckedKeys
    })
    ElMessage.success('权限配置保存成功')
    authDialogVisible.value = false
  } catch (error) {
    ElMessage.error('保存失败：' + (error.message || '未知错误'))
  }
}

const handleDialogClose = () => editFormRef.value?.resetFields()

/** 🔐 重置 OTP（增加二次确认） */
const handleResetOtp = (row) => {
  ElMessageBox.confirm(
    `确定要重置用户"${row.account}"的谷歌验证器吗？重置后需重新扫码绑定。`,
    '提示',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const res = await request.post('/user/resetOtp.do', { id: row.id })
      otpCode.value = res.data
      const issuer = 'SportAdmin'
      const uri = `otpauth://totp/${issuer}:${row.account}?secret=${otpCode.value}&issuer=${issuer}`
      qrCodeUrl.value = await QRCode.toDataURL(uri, {
        width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' }
      })
      otpDialogVisible.value = true
    } catch (error) {
      ElMessage.error('重置失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

const handleOtpDialogClose = () => { qrCodeUrl.value = ''; otpCode.value = '' }

const copyOtpCode = async () => {
  try {
    await navigator.clipboard.writeText(otpCode.value)
    ElMessage.success('复制成功')
  } catch {
    ElMessage.error('复制失败，请手动长按选择复制')
  }
}

const getRoleTypeTag = (roleType) => {
  const map = { 0: 'info', 1: 'success', 2: 'warning', 3: 'danger' }
  return map[roleType] || 'info'
}

onMounted(() => handleQuery())
</script>

<style scoped lang="scss">
.user-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}
.search-buttons { display: flex; gap: 10px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
:deep(.el-divider__text) { font-size: 13px; color: #606266; font-weight: 500; }
.form-tip { font-size: 12px; color: #909399; margin-top: 4px; line-height: 1.5; }

.auth-config-container { max-height: 500px; overflow-y: auto; padding: 10px; }
.auth-tree :deep(.el-tree-node__content) { height: auto; padding: 8px 0; &:hover { background-color: #f5f7fa; } }
.tree-node { display: flex; align-items: center; flex: 1;
  .node-icon { margin-right: 8px; color: #409EFF; font-size: 16px; }
  .node-label { font-weight: 500; flex: 1; }
  .node-path { margin-left: 12px; font-size: 12px; color: #909399; font-family: monospace; }
}

.otp-container { display: flex; flex-direction: column; align-items: center; gap: 20px;
  .qr-code { width: 280px; height: 280px; border: 1px solid #eee; border-radius: 8px; padding: 15px; background: #fff; object-fit: contain; }
  .qr-loading { width: 280px; height: 280px; display: flex; align-items: center; justify-content: center; color: #909399; background: #f5f7fa; border-radius: 8px; }
  .otp-info { display: flex; align-items: center; gap: 16px; background: #f5f7fa; padding: 12px 20px; border-radius: 6px;
    .otp-code { font-family: monospace; font-size: 20px; font-weight: bold; color: #303133; letter-spacing: 1px; }
  }
  .otp-tip { font-size: 13px; color: #909399; text-align: center; line-height: 1.6; }
}
</style>
