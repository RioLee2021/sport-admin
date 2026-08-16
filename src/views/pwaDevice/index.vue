<template>
  <div class="pwa-device-container">
    <!-- 🔍 查询表单 -->
    <el-card class="search-card" shadow="hover">
      <el-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        label-width="120px"
        @submit.prevent
      >
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="推送权限状态" prop="pushPermissionStatus">
              <el-select
                v-model="queryParams.pushPermissionStatus"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 150px"
              >
                <el-option label="已授权" value="granted" />
                <el-option label="未授权" value="denied" />
                <el-option label="默认" value="default" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="推送支持标识" prop="pushSupportFlag">
              <el-select
                v-model="queryParams.pushSupportFlag"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 150px"
              >
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
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
          <span class="title">PWA设备列表</span>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="memberId" label="会员ID" width="100" align="center" />
        <el-table-column prop="uuid" label="UUID" width="200" show-overflow-tooltip />
        <el-table-column prop="endpoint" label="推送端点" min-width="250" show-overflow-tooltip />
        <el-table-column prop="auth" label="推送密钥" min-width="200" show-overflow-tooltip />
        <el-table-column prop="p256dh" label="推送公钥" min-width="200" show-overflow-tooltip />

        <el-table-column prop="pushPermissionStatus" label="推送权限状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getPermissionStatusTag(row.pushPermissionStatus)" size="small">
              {{ row.pushPermissionStatus || '未知' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="pushSupportFlag" label="推送支持" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.pushSupportFlag ? 'success' : 'info'" size="small">
              {{ row.pushSupportFlag ? '支持' : '不支持' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="disabled" label="启用状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createBy" label="创建人" width="100" align="center" />
        <el-table-column prop="createAt" label="创建时间" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>
        <el-table-column prop="updateAt" label="更新时间" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.updateAt) }}</template>
        </el-table-column>

        <!-- ✅ 操作列固定在右侧 -->
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" :icon="Bell" @click="handlePush(row)">推送</el-button>
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

    <!-- 🔔 推送消息弹窗 -->
    <el-dialog
      v-model="pushDialogVisible"
      title="推送消息"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="pushFormRef"
        :model="pushForm"
        :rules="pushFormRules"
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="pushForm.title" placeholder="请输入推送标题" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" prop="body">
          <el-input
            v-model="pushForm.body"
            type="textarea"
            :rows="3"
            placeholder="请输入推送内容"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="跳转链接" prop="targetUrl">
          <el-input v-model="pushForm.targetUrl" placeholder="请输入点击通知后的跳转链接" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pushDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pushLoading" @click="submitPush">确定推送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Bell } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 📋 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  pushPermissionStatus: '',
  pushSupportFlag: undefined,
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

// 🔔 推送弹窗状态
const pushDialogVisible = ref(false)
const pushLoading = ref(false)
const pushFormRef = ref()
const pushForm = reactive({
  id: null,
  title: '',
  body: '',
  targetUrl: ''
})

const pushFormRules = {
  title: [{ required: true, message: '请输入推送标题', trigger: 'blur' }],
  body: [{ required: true, message: '请输入推送内容', trigger: 'blur' }],
  targetUrl: [{ required: true, message: '请输入跳转链接', trigger: 'blur' }]
}

/** 🏷️ 获取权限状态标签类型 */
const getPermissionStatusTag = (status) => {
  const map = {
    'granted': 'success',
    'denied': 'danger',
    'default': 'info'
  }
  return map[status] || 'info'
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      pushPermissionStatus: queryParams.pushPermissionStatus || undefined,
      pushSupportFlag: queryParams.pushSupportFlag,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/pwaDevice/page.do', payload)
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

/** 🔔 打开推送弹窗 */
const handlePush = (row) => {
  pushForm.id = row.id
  pushForm.title = ''
  pushForm.body = ''
  pushForm.targetUrl = ''
  pushDialogVisible.value = true

  // 清除之前的校验状态
  if (pushFormRef.value) {
    pushFormRef.value.clearValidate()
  }
}

/** 🚀 提交推送 */
const submitPush = async () => {
  if (!pushFormRef.value) return

  await pushFormRef.value.validate(async (valid) => {
    if (valid) {
      pushLoading.value = true
      try {
        // 严格按照 Swagger 的 PwaPushOneForm 结构提交
        await request.post('/pwaDevice/push.do', {
          id: pushForm.id,
          title: pushForm.title,
          body: pushForm.body,
          targetUrl: pushForm.targetUrl
        })
        ElMessage.success('推送成功')
        pushDialogVisible.value = false
      } catch (error) {
        ElMessage.error('推送失败：' + (error.message || '未知错误'))
      } finally {
        pushLoading.value = false
      }
    }
  })
}

/** 🗑️ 删除设备 */
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除该PWA设备吗？此操作不可恢复！`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await request.post('/pwaDevice/delete.do', { id: row.id })
      ElMessage.success('删除成功')
      handleQuery()
    } catch (error) {
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.pwa-device-container { padding: 20px; }

.search-card {
  margin-bottom: 20px;
  :deep(.el-card__body) { padding: 20px; }
}

.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header {
    display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}

.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
</style>
