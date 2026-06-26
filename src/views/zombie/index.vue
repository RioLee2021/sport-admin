<template>
  <div class="zombie-container">
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
            <el-form-item label="会员名称" prop="username">
              <el-input
                v-model="queryParams.username"
                placeholder="请输入会员名称"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="手机号" prop="phoneNumber">
              <el-input
                v-model="queryParams.phoneNumber"
                placeholder="请输入手机号"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="僵尸天数" prop="zombieDays">
              <el-input-number
                v-model="queryParams.zombieDays"
                :min="0"
                :precision="0"
                controls-position="right"
                placeholder="请输入天数"
                clearable
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="僵尸次数" prop="zombieTimes">
              <el-input-number
                v-model="queryParams.zombieTimes"
                :min="0"
                :precision="0"
                controls-position="right"
                placeholder="请输入次数"
                clearable
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="关联单号" prop="lastReleaseRelatedNo">
              <el-input
                v-model="queryParams.lastReleaseRelatedNo"
                placeholder="请输入关联单号"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <!-- ✅ 查询下拉选项添加 min-width -->
            <el-form-item label="是否释放" prop="releaseFlag">
              <el-select
                v-model="queryParams.releaseFlag"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
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
          <span class="title">僵尸会员列表</span>
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
        <el-table-column label="会员名称" prop="username" min-width="120" show-overflow-tooltip />
        <el-table-column label="手机号" prop="phoneNumber" width="130" align="center" />
        <el-table-column label="会员等级" prop="level" width="100" align="center" />
        <el-table-column label="上级会员名称" prop="parentUsername" min-width="120" show-overflow-tooltip />
        <el-table-column label="僵尸天数" prop="zombieDays" width="100" align="center" />
        <el-table-column label="僵尸次数" prop="zombieTimes" width="100" align="center" />
        <el-table-column label="最后释放关联单号" prop="lastReleaseRelatedNo" min-width="140" show-overflow-tooltip />

        <el-table-column label="是否释放" prop="releaseFlag" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.releaseFlag ? 'success' : 'info'" size="small">
              {{ row.releaseFlag ? '已释放' : '未释放' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" prop="disabled" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <!-- ✅ 仅包含文档定义的行级功能：删除、给上级发私信 -->
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleSendMessage(row)">发私信</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 📄 分页 -->
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

    <!-- 💬 给上级发私信对话框 -->
    <el-dialog
      v-model="msgDialogVisible"
      title="给上级发私信"
      width="500px"
      :close-on-click-modal="false"
      @close="handleMsgDialogClose"
    >
      <el-form ref="msgFormRef" :model="msgForm" :rules="msgRules" label-width="100px">
        <el-form-item label="会员名称">
          <el-input v-model="msgForm.username" disabled />
        </el-form-item>
        <el-form-item label="私信内容" prop="remark">
          <el-input
            v-model="msgForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入私信内容"
            maxlength="500"
            show-word-limit
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="msgDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="msgLoading" @click="submitMessage">发送</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数 (严格对照 分页请求参数_31)
const queryParams = reactive({
  username: '',
  phoneNumber: '',
  zombieDays: undefined,
  zombieTimes: undefined,
  lastReleaseRelatedNo: '',
  releaseFlag: undefined,
  page: 1,
  pageSize: 20
})

// 📄 分页参数
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const queryFormRef = ref()

// 💬 发私信状态
const msgDialogVisible = ref(false)
const msgFormRef = ref()
const msgLoading = ref(false)
const msgForm = reactive({
  id: null,
  username: '',
  remark: ''
})

const msgRules = {
  remark: [
    { required: true, message: '请输入私信内容', trigger: 'blur' }
  ]
}

/** 🕒 时间格式化辅助函数 */
const formatDateTime = (timeStr) => {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  const pad = (n) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      username: queryParams.username || undefined,
      phoneNumber: queryParams.phoneNumber || undefined,
      zombieDays: queryParams.zombieDays,
      zombieTimes: queryParams.zombieTimes,
      lastReleaseRelatedNo: queryParams.lastReleaseRelatedNo || undefined,
      releaseFlag: queryParams.releaseFlag,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/zombie/page.do', payload)
    if (res.data) {
      tableData.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    ElMessage.error('查询失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

/** 🔄 重置查询 */
const handleReset = () => {
  queryFormRef.value?.resetFields()
  pagination.page = 1
  handleQuery()
}

/** ️ 删除会员 (UpdatedForm: id) */
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除僵尸会员"${row.username}"的记录吗？此操作不可恢复！`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.post('/zombie/delete.do', { id: row.id })
      ElMessage.success('删除成功')
      handleQuery()
    } catch (error) {
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

/** 💬 打开私信弹窗 */
const handleSendMessage = (row) => {
  msgForm.id = row.id
  msgForm.username = row.username
  msgForm.remark = ''
  msgDialogVisible.value = true
  setTimeout(() => msgFormRef.value?.clearValidate(), 100)
}

/**  提交私信 (BaseRemarkForm: id, remark) */
const submitMessage = async () => {
  if (!msgFormRef.value) return
  await msgFormRef.value.validate(async (valid) => {
    if (!valid) return
    msgLoading.value = true
    try {
      await request.post('/zombie/sendMessageToParent.do', {
        id: msgForm.id,
        remark: msgForm.remark
      })
      ElMessage.success('私信发送成功')
      msgDialogVisible.value = false
    } catch (error) {
      ElMessage.error('发送失败：' + (error.message || '未知错误'))
    } finally {
      msgLoading.value = false
    }
  })
}

const handleMsgDialogClose = () => {
  msgFormRef.value?.resetFields()
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.zombie-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header {
    display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}
.search-buttons { display: flex; gap: 10px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
</style>
