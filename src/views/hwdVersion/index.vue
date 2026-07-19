<template>
  <div class="hwd-version-container">
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
            <el-form-item label="是否当前版本" prop="currentFlag">
              <el-select
                v-model="queryParams.currentFlag"
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
            <el-form-item label="版本号" prop="version">
              <el-input v-model="queryParams.version" placeholder="请输入" clearable @keyup.enter="handleQuery" />
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
          <span class="title">版本管理列表</span>
          <el-button type="primary" :icon="Plus" @click="openAddDialog">新增版本</el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
        :row-class-name="tableRowClassName"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="version" label="版本号" width="120" align="center" />

        <el-table-column prop="hwdType" label="硬件类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getDictLabel('HwdType', row.hwdType) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="currentFlag" label="当前版本" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.currentFlag" type="success" size="small">✅ 是</el-tag>
            <el-tag v-else type="info" size="small">❌ 否</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="installedCnt" label="已安装数" width="100" align="center" />
        <el-table-column prop="url" label="下载地址" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link v-if="row.url" :href="row.url" target="_blank" type="primary">下载</el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>

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

        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.currentFlag"
              type="warning"
              link
              size="small"
              @click="handleSetCurrent(row)"
            >设为当前</el-button>
            <el-button
              v-else
              type="info"
              link
              size="small"
              disabled
            >当前版本</el-button>
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

    <!-- ✏️ 新增版本对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增版本"
      width="500px"
      :close-on-click-modal="false"
      @close="handleAddDialogClose"
    >
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="100px">
        <el-form-item label="硬件类型" prop="hwdType">
          <el-select
            v-model="addForm.hwdType"
            placeholder="请选择硬件类型"
            style="width: 100%"
          >
            <el-option
              v-for="item in getDictOptions('HwdType')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="版本号" prop="version">
          <el-input v-model="addForm.version" placeholder="请输入版本号，如 1.0.0" clearable />
        </el-form-item>
        <el-form-item label="开发标识" prop="developFlag">
          <el-switch
            v-model="addForm.developFlag"
            active-text="开发版"
            inactive-text="正式版"
          />
        </el-form-item>
        <el-form-item label="安装包" prop="file">
          <el-upload
            class="upload-box"
            action="#"
            :http-request="handleFileUpload"
            :show-file-list="true"
            :limit="1"
            accept=".apk,.ipa,.exe,.dmg"
          >
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">支持 apk/ipa/exe/dmg 格式，大小不超过 500MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="addLoading" @click="submitAdd">提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数 (严格对照 分页请求参数_10)
const queryParams = reactive({
  hwdType: '',
  currentFlag: undefined,
  version: '',
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
  hwdType: '',
  version: '',
  developFlag: false,
  file: null
})

const addRules = {
  hwdType: [{ required: true, message: '请选择硬件类型', trigger: 'change' }],
  version: [
    { required: true, message: '请输入版本号', trigger: 'blur' },
    { pattern: /^\d+\.\d+\.\d+$/, message: '版本号格式如 1.0.0', trigger: 'blur' }
  ],
  file: [{ required: true, message: '请上传安装包文件', trigger: 'change' }]
}

// 🎨 表格行样式：高亮当前版本
const tableRowClassName = ({ row }) => {
  if (row.currentFlag) {
    return 'current-version-row'
  }
  return ''
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      hwdType: queryParams.hwdType || undefined,
      currentFlag: queryParams.currentFlag !== '' ? queryParams.currentFlag : undefined,
      version: queryParams.version || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/hwdVersion/page.do', payload)
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

/** ➕ 打开新增对话框 */
const openAddDialog = () => {
  Object.assign(addForm, {
    hwdType: '',
    version: '',
    developFlag: false,
    file: null
  })
  addDialogVisible.value = true
  setTimeout(() => addFormRef.value?.clearValidate(), 100)
}

/** 📤 文件上传处理 */
const handleFileUpload = (options) => {
  const file = options.file
  if (file.size > 500 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 500MB')
    return
  }
  addForm.file = file
  // 触发表单校验更新
  addFormRef.value?.validateField('file')
}

/** 💾 提交新增 */
const submitAdd = async () => {
  if (!addFormRef.value) return
  await addFormRef.value.validate(async (valid) => {
    if (!valid) return
    if (!addForm.file) {
      return ElMessage.warning('请选择安装包文件')
    }

    addLoading.value = true
    try {
      const formData = new FormData()
      formData.append('file', addForm.file)

      // 调用新增接口，query 参数 + formData body
      await request.post('/hwdVersion/add.do', formData, {
        params: {
          hwdType: addForm.hwdType,
          version: addForm.version,
          developFlag: addForm.developFlag
        },
        headers: { 'Content-Type': 'multipart/form-data' }
      })

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

/** 🗑️ 删除版本 */
const handleDelete = (row) => {
  if (row.currentFlag) {
    return ElMessage.warning('当前版本不能删除')
  }
  ElMessageBox.confirm(`确定要删除版本 "${row.version}" 吗？此操作不可恢复！`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.post('/hwdVersion/delete.do', { id: row.id })
      ElMessage.success('删除成功')
      handleQuery()
    } catch (error) {
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

/** ⭐ 设置为当前版本 */
const handleSetCurrent = (row) => {
  ElMessageBox.confirm(`确定要将版本 "${row.version}" 设置为当前版本吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      await request.post('/hwdVersion/setCurrent.do', { id: row.id })
      ElMessage.success('设置成功')
      handleQuery()
    } catch (error) {
      ElMessage.error('设置失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.hwd-version-container { padding: 20px; }

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

/* 🎨 当前版本行高亮样式 */
:deep(.current-version-row) {
  background-color: #f0f9ff !important;

  &:hover {
    background-color: #e6f7ff !important;
  }
}

/* 📤 上传组件样式 */
:deep(.el-upload__tip) {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
