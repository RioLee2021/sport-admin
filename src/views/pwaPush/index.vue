<template>
  <div class="pwa-push-container">
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
            <el-form-item label="标题" prop="title">
              <el-input
                v-model="queryParams.title"
                placeholder="请输入标题"
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
          <span class="title">PWA推送列表</span>
          <el-button type="primary" :icon="Plus" @click="openAddDialog">新增推送</el-button>
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
        <el-table-column prop="title" label="标题" min-width="150" show-overflow-tooltip />
        <el-table-column prop="body" label="内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="targetUrl" label="目标URL" min-width="180" show-overflow-tooltip />

        <el-table-column prop="totalCnt" label="到达数" width="100" align="center" />
        <el-table-column prop="succeedCnt" label="点击数" width="90" align="center">
          <template #default="{ row }">
            <span class="text-success">{{ row.succeedCnt }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="failedCnt" label="失败数" width="90" align="center">
          <template #default="{ row }">
            <span class="text-danger">{{ row.failedCnt }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="errorCnt" label="错误数" width="90" align="center">
          <template #default="{ row }">
            <span class="text-warning">{{ row.errorCnt }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="costTime" label="耗时(秒)" width="90" align="center" />

        <el-table-column prop="disabled" label="状态" width="80" align="center">
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

        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="warning" link size="small" @click="handleRePush(row)">重新推送</el-button>
            <el-button type="info" link size="small" @click="viewDetail(row)">详情</el-button>
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

    <!-- ✏️ 新增推送对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增PWA推送"
      width="600px"
      :close-on-click-modal="false"
      @close="handleAddDialogClose"
    >
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="addForm.title" placeholder="请输入推送标题" clearable />
        </el-form-item>
        <el-form-item label="内容" prop="body">
          <el-input
            v-model="addForm.body"
            type="textarea"
            :rows="4"
            placeholder="请输入推送内容"
            clearable
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="跳转链接" prop="targetUrl">
          <el-input v-model="addForm.targetUrl" placeholder="请输入跳转链接" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="addLoading" @click="submitAdd">提交</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 📖 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="推送详情"
      width="600px"
    >
      <el-descriptions :column="2" border v-if="currentDetail">
        <el-descriptions-item label="标题" :span="2">{{ currentDetail.title }}</el-descriptions-item>
        <el-descriptions-item label="内容" :span="2">{{ currentDetail.body }}</el-descriptions-item>
        <el-descriptions-item label="目标URL" :span="2">{{ currentDetail.targetUrl }}</el-descriptions-item>
        <el-descriptions-item label="到达数">{{ currentDetail.totalCnt }}</el-descriptions-item>
        <el-descriptions-item label="点击数">
          <span class="text-success">{{ currentDetail.succeedCnt }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="失败数">
          <span class="text-danger">{{ currentDetail.failedCnt }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="错误数">
          <span class="text-warning">{{ currentDetail.errorCnt }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="耗时(秒)">{{ currentDetail.costTime }}</el-descriptions-item>
        <el-descriptions-item label="信息" :span="2">{{ currentDetail.exprText || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentDetail.createBy }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ $formatDateTime(currentDetail.createAt) }}</el-descriptions-item>
        <el-descriptions-item label="状态" :span="2">
          <el-tag :type="currentDetail.disabled ? 'danger' : 'success'" size="small">
            {{ currentDetail.disabled ? '禁用' : '启用' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  title: '',
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

// ✏️ 新增对话框状态
const addDialogVisible = ref(false)
const addLoading = ref(false)
const addFormRef = ref()
const addForm = reactive({
  title: '',
  body: '',
  targetUrl: ''
})

const addRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  body: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  targetUrl: [{ required: true, message: '请输入跳转链接', trigger: 'blur' }]
}

// 📖 详情对话框状态
const detailVisible = ref(false)
const currentDetail = ref(null)

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      title: queryParams.title || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/pwaPush/page.do', payload)
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

// 🔄 重置查询
const handleReset = () => {
  queryFormRef.value?.resetFields()
  pagination.page = 1
  handleQuery()
}

// ➕ 打开新增对话框
const openAddDialog = () => {
  Object.assign(addForm, {
    title: '',
    body: '',
    targetUrl: ''
  })
  addDialogVisible.value = true
  setTimeout(() => addFormRef.value?.clearValidate(), 100)
}

// 💾 提交新增
const submitAdd = async () => {
  if (!addFormRef.value) return
  await addFormRef.value.validate(async (valid) => {
    if (!valid) return
    addLoading.value = true
    try {
      await request.post('/pwaPush/add.do', { ...addForm })
      ElMessage.success('新增成功')
      addDialogVisible.value = false
      handleQuery()
    } catch (error) {
      ElMessage.error('新增失败：' + (error.message || '未知错误'))
    } finally {
      addLoading.value = false
    }
  })
}

const handleAddDialogClose = () => {
  addFormRef.value?.resetFields()
}

// 🔄 重新推送
const handleRePush = (row) => {
  ElMessageBox.confirm(
    `确定要重新推送 "${row.title}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await request.post('/pwaPush/rePush.do', { id: row.id })
      ElMessage.success('重新推送成功')
      handleQuery()
    } catch (error) {
      ElMessage.error('重新推送失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

//  查看详情
const viewDetail = (row) => {
  currentDetail.value = row
  detailVisible.value = true
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.pwa-push-container { padding: 20px; }

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
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }

/* 文本颜色 */
.text-success { color: #67c23a; font-weight: 500; }
.text-danger { color: #f56c6c; font-weight: 500; }
.text-warning { color: #e6a23c; font-weight: 500; }
</style>
