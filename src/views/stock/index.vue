<template>
  <div class="stock-container">
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
            <el-form-item label="礼物" prop="giftCode">
              <el-select
                v-model="queryParams.giftCode"
                placeholder="请选择礼物"
                filterable
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option
                  v-for="item in giftOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="是否售出" prop="soldFlag">
              <el-select
                v-model="queryParams.soldFlag"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
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
          <span class="title">礼物库存列表</span>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" @click="openAddDialog">新增库存</el-button>
            <el-button type="success" :icon="Upload" @click="openImportDialog">导入库存</el-button>
            <el-button
              type="warning"
              :icon="Delete"
              :disabled="!queryParams.giftCode"
              @click="handleClearLeft"
            >
              清空剩余库存
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="礼物编号" prop="giftCode" width="140" align="center" show-overflow-tooltip />
        <el-table-column label="礼物内容" prop="giftContent" min-width="200" show-overflow-tooltip />

        <el-table-column label="是否售出" prop="soldFlag" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.soldFlag ? 'success' : 'info'" size="small">
              {{ row.soldFlag ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建人" prop="createBy" width="100" align="center" />
        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>
        <el-table-column label="更新时间" prop="updateAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.updateAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleToggle(row)">
              {{ row.soldFlag ? '取消售出' : '标记售出' }}
            </el-button>
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

    <!-- ✏️ 新增库存对话框 -->
    <el-dialog
      v-model="addVisible"
      title="新增库存"
      width="500px"
      :close-on-click-modal="false"
      @close="handleAddClose"
    >
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="80px">
        <el-form-item label="礼物" prop="giftCode">
          <el-select v-model="addForm.giftCode" placeholder="请选择礼物" filterable style="width: 100%">
            <el-option
              v-for="item in giftOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="giftContent">
          <el-input
            v-model="addForm.giftContent"
            type="textarea"
            :rows="3"
            placeholder="请输入礼物内容"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" :loading="addLoading" @click="handleAddSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 📥 导入库存对话框 -->
    <el-dialog
      v-model="importVisible"
      title="导入库存"
      width="500px"
      :close-on-click-modal="false"
      @close="handleImportClose"
    >
      <el-alert title="导入将覆盖或追加该礼物的库存数据，请谨慎操作" type="warning" :closable="false" style="margin-bottom: 16px" />
      <el-form ref="importFormRef" :model="importForm" :rules="importRules" label-width="80px">
        <el-form-item label="礼物" prop="giftCode">
          <el-select v-model="importForm.giftCode" placeholder="请选择礼物" filterable style="width: 100%">
            <el-option
              v-for="item in giftOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Excel文件" prop="file">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            :on-change="handleFileChange"
          >
            <template #trigger>
              <el-button type="primary">选取文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">仅支持 xlsx/xls 格式，大小不超过 5MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" :loading="importLoading" @click="handleImportSubmit">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Upload, Delete } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 🚀 路由参数获取
const route = useRoute()

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)
const giftOptions = ref([])

// 🔍 查询参数
const queryParams = reactive({
  giftCode: '',
  soldFlag: undefined,
  page: 1,
  pageSize: 10
})
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const queryFormRef = ref()

// ✏️ 新增对话框
const addVisible = ref(false)
const addLoading = ref(false)
const addFormRef = ref()
const addForm = reactive({ giftCode: '', giftContent: '' })
const addRules = {
  giftCode: [{ required: true, message: '请选择礼物', trigger: 'change' }],
  giftContent: [{ required: true, message: '请输入礼物内容', trigger: 'blur' }]
}

// 📥 导入对话框
const importVisible = ref(false)
const importLoading = ref(false)
const importFormRef = ref()
const uploadRef = ref()
const importForm = reactive({ giftCode: '', file: null })
const importRules = {
  giftCode: [{ required: true, message: '请选择礼物', trigger: 'change' }],
  file: [{ required: true, message: '请上传文件', trigger: 'change' }]
}

// 📥 初始化礼物下拉字典
const fetchGiftOptions = async () => {
  try {
    const res = await request.post('/stock/giftOptions.do', {})
    giftOptions.value = res.data || []
  } catch (e) { console.error('获取礼物字典失败', e) }
}

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      giftCode: queryParams.giftCode || undefined,
      soldFlag: queryParams.soldFlag,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/stock/page.do', payload)
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

const handleReset = () => {
  queryFormRef.value?.resetFields()
  pagination.page = 1
  handleQuery()
}

// ✏️ 新增操作
const openAddDialog = () => {
  addForm.giftCode = queryParams.giftCode || '' // 默认带入当前筛选条件
  addVisible.value = true
  setTimeout(() => addFormRef.value?.clearValidate(), 100)
}

const handleAddSubmit = async () => {
  if (!addFormRef.value) return
  await addFormRef.value.validate(async (valid) => {
    if (!valid) return
    addLoading.value = true
    try {
      await request.post('/stock/add.do', { ...addForm })
      ElMessage.success('新增成功')
      addVisible.value = false
      handleQuery()
    } catch (error) {
      ElMessage.error('新增失败：' + (error.message || '未知错误'))
    } finally {
      addLoading.value = false
    }
  })
}

const handleAddClose = () => { addFormRef.value?.resetFields() }

// 📥 导入操作
const openImportDialog = () => {
  importForm.giftCode = queryParams.giftCode || ''
  importForm.file = null
  if (uploadRef.value) uploadRef.value.clearFiles()
  importVisible.value = true
  setTimeout(() => importFormRef.value?.clearValidate(), 100)
}

const handleFileChange = (file) => { importForm.file = file.raw }

const handleImportSubmit = async () => {
  if (!importFormRef.value) return
  await importFormRef.value.validate(async (valid) => {
    if (!valid) return
    if (!importForm.file) return ElMessage.warning('请选取文件')

    importLoading.value = true
    try {
      const fd = new FormData()
      fd.append('file', importForm.file)
      // ✅ giftCode 通过 query 参数传递
      await request.post('/stock/importStock.do', fd, {
        params: { giftCode: importForm.giftCode },
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      ElMessage.success('导入成功')
      importVisible.value = false
      handleQuery()
    } catch (error) {
      ElMessage.error('导入失败：' + (error.message || '未知错误'))
    } finally {
      importLoading.value = false
    }
  })
}

const handleImportClose = () => { importFormRef.value?.resetFields() }

// 🔄 切换售出状态
const handleToggle = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要${row.soldFlag ? '取消' : '标记'}该库存为${row.soldFlag ? '未售出' : '已售出'}吗？`, '提示', { type: 'warning' })
    await request.post('/stock/toggle.do', { id: row.id })
    ElMessage.success('状态更新成功')
    handleQuery()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('操作失败：' + (error.message || '未知错误'))
  }
}

// 🗑️ 删除记录
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除该库存记录吗？此操作不可恢复！`, '警告', { type: 'warning' })
    .then(async () => {
      await request.post('/stock/delete.do', { id: row.id })
      ElMessage.success('删除成功')
      handleQuery()
    }).catch(() => {})
}

// 🧹 清空剩余库存
const handleClearLeft = async () => {
  if (!queryParams.giftCode) return ElMessage.warning('请先在查询条件中选择一个礼物')
  try {
    await ElMessageBox.confirm(`确定要清空礼物 [${queryParams.giftCode}] 的剩余库存吗？`, '高危操作确认', { type: 'warning', confirmButtonText: '确认清空' })
    await request.post('/stock/clearLeft.do', { giftCode: queryParams.giftCode })
    ElMessage.success('清空成功')
    handleQuery()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('清空失败：' + (error.message || '未知错误'))
  }
}

onMounted(() => {
  fetchGiftOptions()

  // ✅ 接收路由跳转传入的 query 参数初始化
  if (route.query.giftCode) {
    queryParams.giftCode = route.query.giftCode
  }

  handleQuery()
})
</script>

<style scoped lang="scss">
.stock-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
    .header-actions { display: flex; gap: 10px; }
  }
}
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
.el-upload__tip { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
