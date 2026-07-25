<template>
  <div class="hwd-device-container">
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
            <el-form-item label="硬件类型" prop="hwdType">
              <el-select
                v-model="queryParams.hwdType"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 140px"
              >
                <el-option
                  v-for="item in getDictOptions('HwdType')"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="queryParams.username"
                placeholder="请输入用户名"
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
          <span class="title">硬件设备列表</span>
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
        <el-table-column prop="username" label="会员账号" width="120" show-overflow-tooltip />
        <el-table-column prop="phoneNumber" label="手机号" width="130" align="center" />

        <!-- ✅ 补充所有缺失的字段 -->
        <el-table-column prop="hwdType" label="硬件类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getDictLabel('HwdType', row.hwdType) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="realDeviceId" label="真实设备ID" width="180" show-overflow-tooltip />
        <el-table-column prop="virtualDeviceId" label="虚拟设备ID" width="180" show-overflow-tooltip />
        <el-table-column prop="bundleId" label="当前版本" width="120" show-overflow-tooltip />
        <el-table-column prop="fcmToken" label="FCM Token" width="200" show-overflow-tooltip />

        <el-table-column prop="subscribedAllUsers" label="订阅所有用户" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.subscribedAllUsers ? 'success' : 'info'" size="small">
              {{ row.subscribedAllUsers ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="pushPermissionStatus" label="推送权限状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.pushPermissionStatus === 'granted' ? 'success' : 'warning'" size="small">
              {{ row.pushPermissionStatus || '未知' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="contactsPermissionStatus" label="通讯录权限状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.contactsPermissionStatus === 'granted' ? 'success' : 'warning'" size="small">
              {{ row.contactsPermissionStatus || '未知' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="disabled" label="启用状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- JSON 字段查看按钮 -->
        <el-table-column label="设备信息JSON" width="120" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.deviceInfoJson"
              type="primary"
              link
              size="small"
              @click="openJsonDialog(row.deviceInfoJson)"
            >
              查看 JSON
            </el-button>
            <span v-else class="no-data">-</span>
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

    <!--  JSON 美化查看对话框 (使用 vue-json-pretty) -->
    <el-dialog
      v-model="jsonDialogVisible"
      title="设备信息 JSON"
      width="700px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-if="jsonParseError" class="json-error">
        <el-icon color="#f56c6c"><WarningFilled /></el-icon>
        {{ jsonParseError }}
      </div>

      <!-- ✅ 替换为 vue-json-pretty -->
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
import { getDictOptions, getDictLabel } from '@/utils/dict'
// ✅ 导入 vue-json-pretty
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数 (严格对照 分页请求参数_12)
const queryParams = reactive({
  hwdType: '',
  username: '',
  phoneNumber: '',
  page: 1,
  pageSize: 20
})

//  分页参数
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

//  打开 JSON 对话框
const openJsonDialog = (jsonStr) => {
  jsonParseError.value = ''
  try {
    parsedJson.value = JSON.parse(jsonStr)
    jsonDialogVisible.value = true
    console.log('parsedJson的值为：', parsedJson.value)
  } catch (e) {
    jsonParseError.value = 'JSON 格式解析失败，请检查数据完整性'
    jsonDialogVisible.value = true
  }
}

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      hwdType: queryParams.hwdType || undefined,
      username: queryParams.username || undefined,
      phoneNumber: queryParams.phoneNumber || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/hwdDevice/page.do', payload)
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

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.hwd-device-container { padding: 20px; }
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

/* 🌳 JSON Viewer 样式 */
.json-error {
  display: flex; align-items: center; gap: 8px;
  color: #f56c6c; font-size: 14px; padding: 12px;
}
.json-viewer-wrapper {
  max-height: 60vh;
  overflow-y: auto;
  border-radius: 6px;
}

/* 自定义 vue-json-pretty 样式 */
:deep(.jv-container) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
}

:deep(.jv-key) {
  color: #9cdcfe;
}

:deep(.jv-string) {
  color: #ce9178;
}

:deep(.jv-number) {
  color: #b5cea8;
}

:deep(.jv-boolean) {
  color: #569cd6;
}

:deep(.jv-null) {
  color: #569cd6;
}

:deep(.jv-item) {
  margin-left: 20px;
}

:deep(.jv-toggle) {
  cursor: pointer;
  color: #808080;
  &:hover {
    color: #409eff;
  }
}

:deep(.jv-copy-btn) {
  background: #333;
  color: #fff;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background: #444;
  }
}
</style>
