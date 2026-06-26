<template>
  <div class="member-container">
    <!-- 🔍 查询表单 -->
    <el-card class="search-card" shadow="hover">
      <el-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        label-width="100px"
        @submit.prevent
      >
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="会员账号" prop="username">
              <el-input v-model="queryParams.username" placeholder="请输入账号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="手机号" prop="phoneNumber">
              <el-input v-model="queryParams.phoneNumber" placeholder="请输入手机号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="会员等级" prop="level">
              <el-input-number v-model="queryParams.level" placeholder="请输入等级" clearable @keyup.enter="handleQuery"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="邀请码" prop="shareCode">
              <el-input v-model="queryParams.shareCode" placeholder="请输入邀请码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="会员状态" prop="stat">
              <el-select v-model="queryParams.stat" placeholder="请选择" clearable style="width: 100%; min-width: 120px">
                <el-option v-for="item in getDictOptions('MemberStat')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
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
          <span class="title">会员列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增会员</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column label="最后活跃时间" width="180" align="lastActivityTime">
          <template #default="{row}">{{$formatDateTime(row.lastActivityTime)}}</template>
        </el-table-column>
        <el-table-column label="账号" prop="username" width="120" align="center" />
        <el-table-column label="手机号" prop="phoneNumber" width="130" align="center" />
        <el-table-column label="类型" prop="memberType" width="90" align="center">
          <template #default="{ row }"><el-tag size="small" :type="row.memberType === '1' ? 'warning' : ''">{{ getDictLabel('MemberType', row.memberType) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="状态" prop="stat" width="90" align="center">
          <template #default="{ row }"><el-tag :type="getMemberStatTag(row.stat)" size="small">{{ getDictLabel('MemberStat', row.stat) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="等级" prop="level" width="70" align="center" />
        <el-table-column label="金币" prop="coins" width="80" align="center">
          <template #default="{ row }"><span class="coin-text">{{ row.coins }}</span></template>
        </el-table-column>
        <el-table-column label="注册码" prop="inviteCode" width="100" align="center" />
        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link size="small" :loading="resetLoadingMap[row.id]" @click="handleResetPassword(row)">重置密码</el-button>
            <!-- ✅ 新增：加减款按钮 -->
            <el-button type="success" link size="small" @click="openCoinDialog(row)">加减款</el-button>
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
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑会员' : '新增会员'" width="580px" :close-on-click-modal="false" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
        <!-- 新增专属字段 -->
        <template v-if="!isEdit">
          <el-form-item label="会员账号" prop="username"><el-input v-model="form.username" placeholder="请输入账号" clearable /></el-form-item>
          <el-form-item label="手机号" prop="phoneNumber"><el-input v-model="form.phoneNumber" placeholder="请输入手机号" clearable /></el-form-item>
          <el-form-item label="登录密码" prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码 (MD5 加密)" show-password clearable />
          </el-form-item>
        </template>

        <!-- 编辑专属字段 -->
        <template v-if="isEdit">
          <el-form-item label="会员 ID"><el-input v-model="form.id" disabled /></el-form-item>
          <el-row :gutter="20">
            <el-col :span="12"><el-form-item label="会员金币" prop="coins"><el-input-number v-model="form.coins" :min="0" controls-position="right" style="width: 100%" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="会员等级" prop="level"><el-input-number v-model="form.level" :min="0" controls-position="right" style="width: 100%" /></el-form-item></el-col>
          </el-row>
          <el-form-item label="会员描述" prop="description"><el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入描述" maxlength="200" show-word-limit /></el-form-item>
          <el-form-item label="直播公告" prop="liveNotice"><el-input v-model="form.liveNotice" type="textarea" :rows="2" placeholder="请输入公告" maxlength="200" show-word-limit /></el-form-item>
          <el-form-item label="直播封面" prop="coverUrl">
            <el-upload class="cover-uploader" :show-file-list="false" :http-request="handleUploadCover" :before-upload="beforeUpload">
              <img v-if="form.coverUrl" :src="form.coverUrl" class="cover-preview" />
              <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">支持 jpg/png，建议 800x600</div>
            <el-button v-if="form.coverUrl" type="danger" link size="small" @click="form.coverUrl = ''" style="margin-top: 8px">清除封面</el-button>
          </el-form-item>
        </template>

        <!-- 新增/编辑共有字段 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="会员类型" prop="memberType">
              <el-select v-model="form.memberType" placeholder="请选择" style="width: 100%">
                <el-option v-for="item in getDictOptions('MemberType')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="会员状态" prop="stat">
              <el-select v-model="form.stat" placeholder="请选择" style="width: 100%">
                <el-option v-for="item in getDictOptions('MemberStat')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 🔑 重置密码结果弹窗 -->
    <el-dialog v-model="resetPwdDialogVisible" title="密码重置成功" width="420px" :close-on-click-modal="false" @close="newPwdValue = ''">
      <div class="pwd-result">
        <p>会员 <strong style="color: #409EFF">{{ resetTargetUsername }}</strong> 的新密码已生成：</p>
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

    <!-- 💰 会员加减款对话框 (新增) -->
    <el-dialog
      v-model="coinDialogVisible"
      title="会员加减款"
      width="450px"
      :close-on-click-modal="false"
      @close="handleCoinDialogClose"
    >
      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 16px"
        show-icon
      >
        提示：正数表示加款，负数表示减款（如：-100 表示扣除 100 金币）
      </el-alert>
      <el-form ref="coinFormRef" :model="coinForm" :rules="coinRules" label-width="100px" label-position="right">
        <el-form-item label="会员账号">
          <el-input v-model="coinForm.username" disabled />
        </el-form-item>
        <el-form-item label="当前金币">
          <el-input :value="coinForm.coins" disabled>
            <template #append>金币</template>
          </el-input>
        </el-form-item>
        <el-form-item label="变动金额" prop="amount">
          <el-input-number
            v-model="coinForm.amount"
            :min="-999999"
            :max="999999"
            :precision="0"
            controls-position="right"
            style="width: 100%"
            placeholder="正数加款，负数减款"
          >
            <template #append>金币</template>
          </el-input-number>
        </el-form-item>
        <el-form-item label="操作备注" prop="remark">
          <el-input
            v-model="coinForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入加减款原因备注"
            maxlength="200"
            show-word-limit
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="coinDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="coinLoading" @click="handleCoinSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'
import md5 from 'blueimp-md5' // 已在 package.json 中

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)
const resetLoadingMap = ref({}) // 记录每行重置按钮 loading 状态

// 🔍 查询参数
const queryParams = reactive({ username: undefined, phoneNumber: undefined, level: undefined, stat: undefined,shareCode:undefined, page: 1, pageSize: 10 })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const queryFormRef = ref()

// ✏️ 对话框状态
const dialogVisible = ref(false)
const formRef = ref()
const submitLoading = ref(false)
const isEdit = ref(false)

const form = reactive({
  id: null, username: '', phoneNumber: '', password: '',
  memberType: '0', stat: '0',
  coins: 0, level: 0, description: '', liveNotice: '', coverUrl: ''
})

// 🔑 重置密码弹窗状态
const resetPwdDialogVisible = ref(false)
const newPwdValue = ref('')
const resetTargetUsername = ref('')

// 💰 加减款对话框状态 (新增)
const coinDialogVisible = ref(false)
const coinFormRef = ref()
const coinLoading = ref(false)
const coinForm = reactive({
  id: null,
  username: '',
  coins: 0,
  amount: null,
  remark: ''
})

const coinRules = {
  amount: [
    { required: true, message: '请输入变动金额', trigger: 'blur' },
    { validator: (rule, value, callback) => {
        if (value === null || value === undefined || value === 0) {
          callback(new Error('变动金额不能为 0'))
        } else {
          callback()
        }
      }, trigger: 'blur'
    }
  ],
  remark: [{ required: true, message: '请输入操作备注', trigger: 'blur' }]
}

// 校验规则 (动态切换)
const rules = computed(() => ({
  username: isEdit.value ? [] : [{ required: true, message: '请输入会员账号', trigger: 'blur' }],
  phoneNumber: isEdit.value ? [] : [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: isEdit.value ? [] : [{ required: true, message: '请输入密码', trigger: 'blur' }],
  memberType: [{ required: true, message: '请选择会员类型', trigger: 'change' }],
  stat: [{ required: true, message: '请选择会员状态', trigger: 'change' }],
  coins: isEdit.value ? [{ required: true, message: '请输入金币', trigger: 'blur' }] : [],
  level: isEdit.value ? [{ required: true, message: '请输入等级', trigger: 'blur' }] : [],
  description: isEdit.value ? [{ required: true, message: '请输入描述', trigger: 'blur' }] : [],
  liveNotice: isEdit.value ? [{ required: true, message: '请输入公告', trigger: 'blur' }] : []
}))

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      username: queryParams.username || undefined,
      phoneNumber: queryParams.phoneNumber || undefined,
      level: queryParams.level || undefined,
      stat: queryParams.stat || undefined,
      shareCode: queryParams.shareCode || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/member/page.do', payload)
    if (res.data) {
      tableData.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (e) {
    ElMessage.error('查询失败：' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const handleReset = () => { queryFormRef.value?.resetFields(); pagination.page = 1; handleQuery() }

// 🏷️ 辅助方法
const getMemberStatTag = (stat) => ({ '0': 'success', '1': 'warning', '2': 'danger', '3': 'info' }[stat] || 'info')

// ➕ 新增
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, { id: null, username: '', phoneNumber: '', password: '', memberType: '0', stat: '0', coins: 0, level: 0, description: '', liveNotice: '', coverUrl: '' })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

// ✏️ 编辑
const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, { ...row, password: '' })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

// 💾 提交
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      const api = isEdit.value ? '/member/edit.do' : '/member/add.do'
      const payload = { ...form }

      // 🔐 新增时密码 MD5 加密
      if (!isEdit.value) {
        payload.password = md5(form.password)
        delete payload.id; delete payload.coins; delete payload.level
        delete payload.description; delete payload.liveNotice; delete payload.coverUrl
      } else {
        delete payload.username; delete payload.phoneNumber; delete payload.password
      }

      await request.post(api, payload)
      ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
      dialogVisible.value = false
      handleQuery()
    } catch (e) {
      ElMessage.error((isEdit.value ? '修改' : '新增') + '失败：' + (e.message || '未知错误'))
    } finally {
      submitLoading.value = false
    }
  })
}

const handleDialogClose = () => { formRef.value?.resetFields() }

// 🔐 重置密码 + 弹窗展示
const handleResetPassword = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要重置会员 "${row.username}" 的密码吗？`, '提示', { type: 'warning' })
    resetLoadingMap.value[row.id] = true
    const res = await request.post('/member/resetPassword.do', { id: row.id })
    newPwdValue.value = res.data || res || '获取失败'
    resetTargetUsername.value = row.username
    resetPwdDialogVisible.value = true
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('重置失败：' + (e.message || '未知错误'))
  } finally {
    resetLoadingMap.value[row.id] = false
  }
}

// 📋 复制密码
const copyPassword = async () => {
  if (!newPwdValue.value) return ElMessage.warning('密码为空')
  try {
    await navigator.clipboard.writeText(newPwdValue.value)
    ElMessage.success('✅ 密码已复制到剪贴板')
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = newPwdValue.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('✅ 密码已复制')
  }
}

// 💰 加减款功能 (新增)

// 打开加减款弹窗
const openCoinDialog = (row) => {
  Object.assign(coinForm, {
    id: row.id,
    username: row.username,
    coins: row.coins,
    amount: null,
    remark: ''
  })
  coinDialogVisible.value = true
  setTimeout(() => coinFormRef.value?.clearValidate(), 100)
}

// 提交加减款
const handleCoinSubmit = async () => {
  if (!coinFormRef.value) return
  await coinFormRef.value.validate(async (valid) => {
    if (!valid) return
    coinLoading.value = true
    try {
      // ✅ 调用 /member/manualChangeCoins.do 接口
      await request.post('/member/manualChangeCoins.do', {
        id: coinForm.id,
        amount: coinForm.amount,  // 正数加款，负数减款
        remark: coinForm.remark
      })

      const action = coinForm.amount > 0 ? '加款' : '减款'
      ElMessage.success(`${action}${Math.abs(coinForm.amount)}金币成功`)
      coinDialogVisible.value = false
      handleQuery() // 刷新表格更新金币余额
    } catch (e) {
      ElMessage.error('操作失败：' + (e.message || '未知错误'))
    } finally {
      coinLoading.value = false
    }
  })
}

const handleCoinDialogClose = () => {
  coinFormRef.value?.resetFields()
}

// 🗑️ 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除会员 "${row.username}" 吗？此操作不可恢复！`, '警告', { type: 'warning' })
    .then(async () => {
      await request.post('/member/delete.do', { id: row.id })
      ElMessage.success('删除成功'); handleQuery()
    }).catch(() => {})
}

// 🖼️ 封面上传 (type=3)
const beforeUpload = (file) => {
  const isImg = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImg) ElMessage.error('只能上传图片')
  if (!isLt2M) ElMessage.error('图片不能超过 2MB')
  return isImg && isLt2M
}

const handleUploadCover = async ({ file }) => {
  try {
    const fd = new FormData(); fd.append('file', file)
    const res = await request.post('/pub/uploadPic.do', fd, { params: { type: 3 }, headers: { 'Content-Type': 'multipart/form-data' } })
    const url = res.data?.url || res.data || ''
    if (url) { form.coverUrl = url; ElMessage.success('上传成功') }
    else ElMessage.error('上传失败')
  } catch (e) { ElMessage.error('上传失败：' + (e.message || '未知错误')) }
}

onMounted(() => handleQuery())
</script>

<style scoped lang="scss">
.member-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
.cover-uploader { :deep(.el-upload) { border: 1px dashed #d9d9d9; border-radius: 6px; cursor: pointer; position: relative; overflow: hidden; transition: var(--el-transition-duration-fast); &:hover { border-color: var(--el-color-primary); } }
  .cover-uploader-icon { font-size: 28px; color: #8c939d; width: 100px; height: 100px; text-align: center; }
  .cover-preview { width: 100px; height: 100px; display: block; object-fit: cover; }
}
.upload-tip { font-size: 12px; color: #909399; margin-top: 4px; }

/* 重置密码弹窗样式 */
:deep(.pwd-result) {
  .pwd-box { margin: 16px 0; :deep(.el-input__inner) { font-family: 'Courier New', monospace; letter-spacing: 1px; background-color: #f5f7fa; } }
  :deep(.el-alert) { padding: 8px 12px; font-size: 13px; }
}

/* 🔑 加减款弹窗样式 */
:deep(.coin-text) { font-weight: 500; color: #e6a23c; }
</style>
