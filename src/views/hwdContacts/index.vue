<template>
  <div class="hwd-contacts-container">
    <!--  查询表单 -->
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
            <el-form-item label="姓名" prop="fullName">
              <el-input
                v-model="queryParams.fullName"
                placeholder="请输入姓名"
                clearable
                @keyup.enter="handleQuery"
              />
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
          <span class="title">通讯录列表</span>
          <el-button type="primary"  @click="handleFormatNumber">压缩并导出</el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="fullName" label="姓名" width="auto" show-overflow-tooltip />

        <!-- ✅ JSON 字段查看按钮 -->
        <el-table-column label="手机号码" min-width="100">
          <template #default="{ row }">
            <el-button
              v-if="row.phoneNumbersJson"
              type="primary"
              link
              size="small"
              @click="openJsonDialog(row.phoneNumbersJson)"
            >
              查看号码详情
            </el-button>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="deviceId" label="设备ID" width="120" align="center" />
        <el-table-column prop="disabled" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createAt" label="创建时间" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
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

    <!-- 🌳 JSON 查看对话框 -->
    <el-dialog
      v-model="jsonDialogVisible"
      title="手机号码详情"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-if="jsonParseError" class="json-error">
        <el-icon color="#f56c6c"><WarningFilled /></el-icon>
        {{ jsonParseError }}
      </div>
      <VueJsonPretty
        v-else
        :data="parsedJson"
        :deep="3"
        show-line
        show-length
        show-copy-btn
        style="background: #1e1e1e; padding: 12px; border-radius: 6px; max-height: 60vh; overflow-y: auto;"
      />
      <template #footer>
        <el-button @click="jsonDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, WarningFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'

// ✅ 导入 JSON 查看器组件
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  fullName: '',
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

// 🌳 JSON 查看器状态
const jsonDialogVisible = ref(false)
const parsedJson = ref(null)
const jsonParseError = ref('')

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      fullName: queryParams.fullName || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/hwdContacts/page.do', payload)
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

//  重置查询
const handleReset = () => {
  queryFormRef.value?.resetFields()
  pagination.page = 1
  handleQuery()
}

// 🔗 打开 JSON 对话框
const openJsonDialog = (jsonStr) => {
  jsonParseError.value = ''
  try {
    parsedJson.value = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
    jsonDialogVisible.value = true
  } catch (e) {
    jsonParseError.value = 'JSON 格式解析失败，请检查数据完整性'
    jsonDialogVisible.value = true
  }
}

const handleFormatNumber = () =>{
  request.post('/hwdContacts/formatNumber.do', {}).then(res=>{
    ElMessage.success('格式化成功')
  }).catch(err=>{
    ElMessage.error('格式化失败：' + (err.message || '未知错误'))
  })
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.hwd-contacts-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header {
    display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
.no-data { color: #c0c4cc; font-size: 12px; }

/* JSON Error 样式 */
.json-error {
  display: flex; align-items: center; gap: 8px;
  color: #f56c6c; font-size: 14px; padding: 12px;
}
</style>
