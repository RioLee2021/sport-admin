<template>
  <div class="i18n-container">
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
            <el-form-item label="字典类型" prop="dictType">
              <el-select
                v-model="queryParams.dictType"
                placeholder="请选择字典类型"
                clearable
                style="width: 100%; min-width: 150px"
                popper-class="i18n-dict-select"
              >
                <el-option
                  v-for="item in getDictOptions('DictType')"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="字典键" prop="keyCode">
              <el-input
                v-model="queryParams.keyCode"
                placeholder="请输入字典键"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="语言代码" prop="languageCode">
              <el-input
                v-model="queryParams.languageCode"
                placeholder="请输入语言代码"
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
          <span class="title">国际化字典列表</span>
          <div class="header-actions">
            <el-button type="warning" :icon="Refresh" @click="handleSync">同步基础数据</el-button>
            <el-button type="success" :icon="Download" @click="openDownloadDialog">下载字典</el-button>
            <el-button type="info" :icon="Upload" @click="openUploadDialog">上传字典</el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增字典</el-button>
          </div>
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

        <el-table-column label="字典类型" prop="dictType" width="120" align="center">
          <template #default="{ row }">
            {{ getDictLabel('DictType', row.dictType) }}
          </template>
        </el-table-column>

        <el-table-column label="字典键" prop="keyCode" min-width="150" show-overflow-tooltip />

        <el-table-column label="语言代码" prop="languageCode" width="120" align="center" />

        <el-table-column label="字典值" prop="value" min-width="200" show-overflow-tooltip />

        <el-table-column label="状态" prop="disabled" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建人" prop="createBy" width="120" align="center" />

        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <el-table-column label="更新时间" prop="updateAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.updateAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
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
        <el-form-item label="ID" prop="id" v-if="isEdit">
          <el-input v-model="editForm.id" disabled />
        </el-form-item>

        <el-form-item label="字典类型" prop="dictType">
          <el-select
            v-model="editForm.dictType"
            placeholder="请选择字典类型"
            style="width: 100%"
            :disabled="isEdit"
          >
            <el-option
              v-for="item in getDictOptions('DictType')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="字典键" prop="keyCode">
          <el-input
            v-model="editForm.keyCode"
            placeholder="请输入字典键（如：btn.submit）"
            maxlength="100"
            show-word-limit
            clearable
            :disabled="isEdit"
          />
        </el-form-item>

        <el-form-item label="语言代码" prop="languageCode">
          <el-input
            v-model="editForm.languageCode"
            placeholder="请输入语言代码（如：zh-CN, en-US）"
            maxlength="20"
            clearable
            :disabled="isEdit"
          />
        </el-form-item>

        <el-form-item label="字典值" prop="value">
          <el-input
            v-model="editForm.value"
            type="textarea"
            :rows="4"
            placeholder="请输入字典值（支持多语言文本）"
            maxlength="500"
            show-word-limit
            clearable
          />
        </el-form-item>

        <el-form-item label="启用状态" prop="disabled">
          <el-switch
            v-model="editForm.disabled"
            :active-value="false"
            :inactive-value="true"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>

        <el-divider content-position="left" v-if="isEdit">系统信息（只读）</el-divider>
        <el-row :gutter="20" v-if="isEdit">
          <el-col :span="12">
            <el-form-item label="创建人">
              <el-input v-model="editForm.createBy" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="创建时间">
              <el-input :value="$formatDateTime(editForm.createAt)" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="isEdit">
          <el-col :span="24">
            <el-form-item label="更新时间">
              <el-input :value="$formatDateTime(editForm.updateAt)" disabled />
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

    <!-- 🔄 同步基础数据对话框 -->
    <el-dialog
      v-model="syncDialogVisible"
      title="同步基础数据"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="syncForm" label-width="100px">
        <el-form-item label="字典类型" required>
          <el-select
            v-model="syncForm.dictType"
            placeholder="请选择需要同步的字典类型"
            style="width: 100%"
          >
            <el-option
              v-for="item in getDictOptions('DictType')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="syncDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="syncLoading" @click="confirmSync">
          开始同步
        </el-button>
      </template>
    </el-dialog>

    <!-- 📥 下载字典数据对话框 -->
    <el-dialog
      v-model="downloadDialogVisible"
      title="下载字典数据"
      width="420px"
      :close-on-click-modal="false"
      @close="handleDownloadClose"
    >
      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 16px"
        show-icon
      >
        提示：下载的文件为 Excel 格式，可直接用于批量编辑或备份
      </el-alert>
      <el-form :model="downloadForm" label-width="100px">
        <el-form-item label="字典类型" required>
          <el-select
            v-model="downloadForm.dictType"
            placeholder="请选择字典类型"
            style="width: 100%"
            @change="handleDictTypeChange"
          >
            <el-option
              v-for="item in getDictOptions('DictType')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="语言代码" required>
          <el-input
            v-model="downloadForm.languageCode"
            placeholder="如：zh-CN, en-US"
            maxlength="20"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="downloadDialogVisible = false">取消</el-button>
        <el-button type="success" :loading="downloadLoading" @click="confirmDownload">
          开始下载
        </el-button>
      </template>
    </el-dialog>

    <!-- 📤 上传字典数据对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传字典数据"
      width="450px"
      :close-on-click-modal="false"
      @close="handleUploadClose"
    >
      <el-alert
        type="warning"
        :closable="false"
        style="margin-bottom: 16px"
        show-icon
      >
        提示：上传的文件需为 Excel 格式，且列头需与模板一致
      </el-alert>
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="字典类型" required>
          <el-select
            v-model="uploadForm.dictType"
            placeholder="请选择字典类型"
            style="width: 100%"
          >
            <el-option
              v-for="item in getDictOptions('DictType')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="语言代码" required>
          <el-input
            v-model="uploadForm.languageCode"
            placeholder="如：zh-CN, en-US"
            maxlength="20"
            clearable
          />
        </el-form-item>
        <el-form-item label="Json文件" required>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".json"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
          >
            <template #trigger>
              <el-button type="primary">选取文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">仅支持 json 格式，大小不超过 5MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="info" link @click="downloadTemplate">下载模板</el-button>
        <el-button type="primary" :loading="uploadLoading" @click="confirmUpload">
          开始上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Download, Upload } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  dictType: null,
  keyCode: '',
  languageCode: '',
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
  dictType: null,
  keyCode: '',
  languageCode: '',
  value: '',
  disabled: false,
  createBy: '',
  createAt: null,
  updateAt: null
})

// 编辑表单验证规则
const editRules = {
  dictType: [{ required: true, message: '请选择字典类型', trigger: 'change' }],
  keyCode: [
    { required: true, message: '请输入字典键', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9._-]+$/, message: '仅支持字母、数字、点、下划线、短横线', trigger: 'blur' }
  ],
  languageCode: [
    { required: true, message: '请输入语言代码', trigger: 'blur' },
    { pattern: /^[a-z]{2}(-[A-Z]{2})?$/, message: '格式如：zh-CN, en-US', trigger: 'blur' }
  ],
  value: [
    { required: true, message: '请输入字典值', trigger: 'blur' },
    { min: 1, max: 500, message: '长度在 1 到 500 个字符', trigger: 'blur' }
  ]
}

// 对话框标题
const dialogTitle = computed(() => isEdit.value ? '编辑字典' : '新增字典')

// 🔄 同步状态
const syncDialogVisible = ref(false)
const syncLoading = ref(false)
const syncForm = reactive({ dictType: null })

// 📥 下载字典状态
const downloadDialogVisible = ref(false)
const downloadLoading = ref(false)
const downloadForm = reactive({ dictType: null, languageCode: '' })

// 📤 上传字典状态
const uploadDialogVisible = ref(false)
const uploadLoading = ref(false)
const uploadRef = ref()
const uploadForm = reactive({ dictType: null, languageCode: '', file: null })

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const res = await request.post('/i18n/page.do', {
      dictType: queryParams.dictType,
      keyCode: queryParams.keyCode,
      languageCode: queryParams.languageCode,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
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

/** ➕ 新增字典 */
const handleAdd = () => {
  isEdit.value = false
  Object.assign(editForm, {
    id: null, dictType: null, keyCode: '', languageCode: '', value: '',
    disabled: false, createBy: '', createAt: null, updateAt: null
  })
  dialogVisible.value = true
  setTimeout(() => editFormRef.value?.clearValidate(), 100)
}

/** ✏️ 编辑字典 */
const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(editForm, row)
  dialogVisible.value = true
  setTimeout(() => editFormRef.value?.clearValidate(), 100)
}

/** 💾 提交（新增/编辑） */
const handleSubmit = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      const submitData = {
        id: editForm.id, dictType: editForm.dictType, keyCode: editForm.keyCode,
        languageCode: editForm.languageCode, value: editForm.value, disabled: editForm.disabled
      }
      const api = isEdit.value ? '/i18n/edit.do' : '/i18n/add.do'
      await request.post(api, submitData)
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

/** 🗑️ 删除字典 */
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除字典"${row.keyCode}(${row.languageCode})"吗？此操作不可恢复！`, '警告', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(async () => {
    try {
      await request.post('/i18n/delete.do', { id: row.id })
      ElMessage.success('删除成功')
      handleQuery()
    } catch (error) {
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

/** 🔄 打开同步对话框 */
const handleSync = () => {
  syncForm.dictType = null
  syncDialogVisible.value = true
}

/** ✅ 确认同步 */
const confirmSync = async () => {
  if (syncForm.dictType == null) {
    return ElMessage.warning('请选择需要同步的字典类型')
  }

  syncLoading.value = true
  try {
    const res = await request.post('/i18n/syncBase.do', { dictType: syncForm.dictType })
    const data = res.data || {}

    ElMessageBox.alert(
      `同步完成！<br><b>新增：</b>${data.addCount || 0} 条<br><b>更新：</b>${data.syncCount || 0} 条<br><b>总计：</b>${data.totalCount || 0} 条`,
      '同步结果',
      { dangerouslyUseHTMLString: true, confirmButtonText: '确定', type: 'success' }
    ).then(() => {
      handleQuery()
    })
  } catch (error) {
    ElMessage.error('同步失败：' + (error.message || '未知错误'))
  } finally {
    syncLoading.value = false
    syncDialogVisible.value = false
  }
}

/** 📥 打开下载对话框 */
const openDownloadDialog = () => {
  downloadForm.dictType = null
  downloadForm.languageCode = ''
  downloadDialogVisible.value = true
}

/** 📥 字典类型变更时自动填充语言代码示例 */
const handleDictTypeChange = (val) => {
  // 可根据业务需求预设常用语言代码
  if (val === '0') downloadForm.languageCode = 'zh-CN'
  else if (val === '1') downloadForm.languageCode = 'en-US'
  else downloadForm.languageCode = ''
}

// src/views/i18n/index.vue 中的 confirmDownload 方法
const confirmDownload = async () => {
  if (!downloadForm.dictType || !downloadForm.languageCode?.trim()) {
    return ElMessage.warning('请选择字典类型并填写语言代码')
  }

  downloadLoading.value = true
  try {
    // 🔑 关键：添加 responseType: 'blob'
    const res = await request.post('/i18n/downloadDictData.do', {
      dictType: downloadForm.dictType,
      languageCode: downloadForm.languageCode.trim()
    }, {
      responseType: 'blob'  // ⚠️ 必须添加此项
    })

    // 🔑 关键：res 已经是 Blob，直接使用
    const blob = new Blob([res.data], { type: 'application/json;charset=UTF-8' })

    const link = document.createElement('a')
    const fileName = `${downloadForm.dictType}_${downloadForm.languageCode}.json`

    link.href = URL.createObjectURL(blob)
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)  // ✅ 释放内存

    ElMessage.success('下载成功')
    downloadDialogVisible.value = false
  } catch (error) {
    // 🔍 错误处理：blob 错误时解析为文本查看后端报错
    if (error.response?.data instanceof Blob) {
      const text = await error.response.data.text()
      ElMessage.error('下载失败：' + text)
    } else {
      ElMessage.error('下载失败：' + (error.message || '未知错误'))
    }
  } finally {
    downloadLoading.value = false
  }
}

/** 📥 关闭下载对话框 */
const handleDownloadClose = () => {
  downloadForm.dictType = null
  downloadForm.languageCode = ''
}

/** 📤 打开上传对话框 */
const openUploadDialog = () => {
  uploadForm.dictType = null
  uploadForm.languageCode = ''
  uploadForm.file = null
  if (uploadRef.value) uploadRef.value.clearFiles()
  uploadDialogVisible.value = true
}

/** 📤 文件变更处理 */
const handleFileChange = (file) => {
  // 校验文件大小（5MB）
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 5MB')
    uploadRef.value?.clearFiles()
    uploadForm.file = null
    return
  }
  uploadForm.file = file.raw
}

/** 📤 文件移除处理 */
const handleFileRemove = () => {
  uploadForm.file = null
}

/** 📤 下载上传模板 */
const downloadTemplate = () => {
  // 复用下载接口，传空语言代码获取模板（或后端提供独立模板接口）
  ElMessage.info('请联系管理员获取标准上传模板，或先下载任意字典数据作为参考')
}

/** 📤 确认上传 */
const confirmUpload = async () => {
  if (!uploadForm.dictType || !uploadForm.languageCode?.trim()) {
    return ElMessage.warning('请选择字典类型并填写语言代码')
  }
  if (!uploadForm.file) {
    return ElMessage.warning('请先选取要上传的文件')
  }

  uploadLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadForm.file)
    formData.append('dictType', uploadForm.dictType)
    formData.append('languageCode', uploadForm.languageCode.trim())

    // ✅ 调用 uploadDictData.do
    const res = await request.post('/i18n/uploadDictData.do', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    handleQuery() // 刷新列表
  } catch (error) {
    ElMessage.error('上传失败：' + (error.message || '未知错误'))
  } finally {
    uploadLoading.value = false
  }
}

/** 📤 关闭上传对话框 */
const handleUploadClose = () => {
  uploadForm.dictType = null
  uploadForm.languageCode = ''
  uploadForm.file = null
  if (uploadRef.value) uploadRef.value.clearFiles()
}

/** 🚫 关闭对话框清理 */
const handleDialogClose = () => editFormRef.value?.resetFields()

onMounted(() => handleQuery())
</script>

<style scoped lang="scss">
.i18n-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
    .header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  }
}
.search-buttons { display: flex; gap: 10px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
:deep(.el-divider__text) { font-size: 13px; color: #606266; font-weight: 500; }
:deep(.i18n-dict-select) { min-width: 180px !important; }
.el-upload__tip { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
