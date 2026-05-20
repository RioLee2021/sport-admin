<template>
  <div class="team-container">
    <!-- 🔍 查询表单 -->
    <el-card class="search-card" shadow="hover">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="100px" @submit.prevent>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="球队名称" prop="name">
              <el-input v-model="queryParams.name" placeholder="请输入球队名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="球队CODE" prop="code">
              <el-input v-model="queryParams.code" placeholder="请输入球队CODE" clearable @keyup.enter="handleQuery" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="所属联赛" prop="leagueCode">
              <el-select v-model="queryParams.leagueCode" placeholder="请选择联赛" clearable filterable style="width: 100%;min-width: 120px;">
                <el-option v-for="item in leagueOptions" :key="item.value" :label="item.label" :value="item.value" />
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
          <span class="title">球队列表</span>
          <!-- 在表格 header 的按钮区追加 -->
          <div class="header-actions">
            <el-button type="success" :icon="Download" @click="downloadTemplate">下载模板</el-button>
            <el-button type="warning" :icon="Upload" @click="importDialogVisible = true">批量导入</el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增球队</el-button>
          </div>

          <!-- 批量导入弹窗 -->
          <el-dialog v-model="importDialogVisible" title="批量导入球队" width="520px" :close-on-click-modal="false">
            <el-form :model="importForm" label-width="100px">
              <el-form-item label="所属联赛" required>
                <el-select v-model="importForm.leagueCode" placeholder="请选择联赛" style="width: 100%">
                  <el-option v-for="item in leagueOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="上传文件" required>
                <el-upload
                  drag
                  :auto-upload="false"
                  :limit="1"
                  accept=".xlsx,.xls"
                  :on-change="handleFileChange"
                  :on-remove="() => importForm.file = null"
                >
                  <el-icon class="el-icon--upload"><Upload /></el-icon>
                  <div class="el-upload__text">拖拽文件到此处，或 <em>点击上传</em></div>
                  <template #tip>
                    <div class="el-upload__tip">仅支持 .xlsx/.xls，单次 ≤5MB。表格内无需填写联赛CODE</div>
                  </template>
                </el-upload>
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="importDialogVisible = false">取消</el-button>
              <el-button type="primary" :loading="importLoading" :disabled="!importForm.file || !importForm.leagueCode" @click="submitImport">
                开始导入
              </el-button>
            </template>
          </el-dialog>
        </div>

      </template>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />

        <el-table-column label="球队CODE" prop="code" width="120" align="center" show-overflow-tooltip />
        <el-table-column label="球队名称" prop="name" min-width="150" show-overflow-tooltip />

        <el-table-column label="所属联赛" prop="leagueCode" width="140" align="center">
          <template #default="{ row }">
            {{ getLeagueLabel(row.leagueCode) }}
          </template>
        </el-table-column>

        <el-table-column label="球队Logo" prop="logo" width="100" align="center">
          <template #default="{ row }">
            <div v-if="row.logo" class="logo-cell" @click="openLogo(row.logo)">
              <img :src="row.logo" class="table-logo" />
            </div>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" prop="disabled" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建人" prop="createBy" width="100" align="center" />
        <el-table-column label="创建时间" prop="createAt" width="160" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>
        <el-table-column label="更新时间" prop="updateAt" width="160" align="center">
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
      :title="isEdit ? '编辑球队' : '新增球队'"
      width="550px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
        <el-form-item label="球队CODE" prop="code" v-if="!isEdit">
          <el-input v-model="form.code" placeholder="请输入球队唯一CODE" maxlength="50" show-word-limit clearable />
        </el-form-item>

        <el-form-item label="球队名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入球队名称" maxlength="50" show-word-limit clearable />
        </el-form-item>

        <el-form-item label="所属联赛" prop="leagueCode">
          <el-select v-model="form.leagueCode" placeholder="请选择联赛" filterable style="width: 100%">
            <el-option v-for="item in leagueOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="球队Logo" prop="logo">
          <el-upload
            class="logo-uploader"
            :show-file-list="false"
            :http-request="handleUploadLogo"
            :before-upload="beforeUpload"
          >
            <img v-if="form.logo" :src="form.logo" class="logo-preview" />
            <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">支持 jpg/png，建议尺寸 200x200</div>
          <el-button v-if="form.logo" type="danger" link size="small" @click="form.logo = ''" style="margin-top: 8px">清除图片</el-button>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
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

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  name: '',
  code: '',
  leagueCode: '',
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
const leagueOptions = ref([])

// ✏️ 对话框状态
const dialogVisible = ref(false)
const formRef = ref()
const submitLoading = ref(false)
const isEdit = ref(false)
const uploadLoading = ref(false)

/** 🖼️ 点击Logo新窗口打开（替代不稳定的表格内预览） */
const openLogo = (url) => {
  if (url) window.open(url, '_blank')
}

// 表单数据
const form = reactive({
  id: null,
  code: '',
  name: '',
  leagueCode: '',
  logo: ''
})

// 表单校验规则
const rules = {
  code: [
    { required: true, message: '请输入球队CODE', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '仅支持字母、数字、下划线、短横线', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入球队名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度 1-50 个字符', trigger: 'blur' }
  ],
  leagueCode: [{ required: true, message: '请选择所属联赛', trigger: 'change' }]
}

/** 📥 获取联赛下拉数据 */
const fetchLeagueOptions = async () => {
  try {
    const res = await request.post('/team/leagueOptions.do', {})
    // 兼容 value 为 object 的情况，统一转为字符串
    leagueOptions.value = (res.data || []).map(item => ({
      label: item.label,
      value: String(item.value)
    }))
  } catch (error) {
    console.error('获取联赛列表失败:', error)
  }
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const res = await request.post('/team/page.do', {
      name: queryParams.name,
      code: queryParams.code,
      leagueCode: queryParams.leagueCode,
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

/** 🏷️ 获取联赛显示名称 */
const getLeagueLabel = (code) => {
  const item = leagueOptions.value.find(i => i.value === String(code))
  return item ? item.label : code || '-'
}

/** ➕ 新增球队 */
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, { id: null, code: '', name: '', leagueCode: '', logo: '' })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

/** ✏️ 编辑球队 */
const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

/** 🖼️ 图片上传前校验 */
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) ElMessage.error('只能上传图片文件!')
  if (!isLt2M) ElMessage.error('图片大小不能超过 2MB!')
  return isImage && isLt2M
}

/** 📤 自定义上传逻辑 (type=1 代表球队) */
const handleUploadLogo = async ({ file }) => {
  uploadLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await request.post('/pub/uploadPic.do', formData, {
      params: { type: 1 }, // 1=球赛/球队
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    // 兼容不同后端返回结构
    const url = res.data?.url || res.data || ''
    if (url) {
      form.logo = url
      ElMessage.success('上传成功')
    } else {
      ElMessage.error('上传失败：未返回图片地址')
    }
  } catch (error) {
    ElMessage.error('上传失败：' + (error.message || '未知错误'))
  } finally {
    uploadLoading.value = false
  }
}

/** 💾 提交表单 */
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitLoading.value = true
    try {
      // 根据新增/编辑组装不同参数
      const payload = isEdit.value
        ? { id: form.id, leagueCode: form.leagueCode, name: form.name, logo: form.logo }
        : { code: form.code, leagueCode: form.leagueCode, name: form.name, logo: form.logo }

      const api = isEdit.value ? '/team/edit.do' : '/team/add.do'
      await request.post(api, payload)

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

/** 🗑️ 删除球队 */
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除球队"${row.name}"吗？此操作不可恢复！`, '警告', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(async () => {
    try {
      // 假设删除接口为 /team/delete.do，参数 { id }
      await request.post('/team/delete.do', { id: row.id })
      ElMessage.success('删除成功')
      handleQuery()
    } catch (error) {
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

/** 🚫 关闭对话框清理 */
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

import { Download, Upload } from '@element-plus/icons-vue'

// 导入相关状态
const importDialogVisible = ref(false)
const importLoading = ref(false)
const importForm = reactive({ leagueCode: '', file: null })

/** 📥 下载模板（适配修复后的拦截器） */
const downloadTemplate = async () => {
  try {
    const res = await request.get('/team/downloadTemplate.do', {
      responseType: 'blob'
    })

    // ✅ 拦截器已放行，res 是完整的 response 对象
    const blob = res.data

    // 解析文件名（兼容后端 Content-Disposition）
    let filename = '球队导入模板.xlsx'
    const disposition = res.headers['content-disposition']
    if (disposition) {
      const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^;"\n]+)"?/)
      if (match && match[1]) filename = decodeURIComponent(match[1])
    }

    // 触发浏览器下载
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

  } catch (error) {
    // 拦截器已统一处理错误提示，这里只需静默捕获或补日志
    console.error('模板下载异常:', error)
  }
}

/** 📁 文件选择 */
const handleFileChange = (file) => { importForm.file = file.raw }

/** 🚀 提交导入 */
const submitImport = async () => {
  if (!importForm.leagueCode) return ElMessage.warning('请选择所属联赛')

  importLoading.value = true
  const formData = new FormData()
  formData.append('file', importForm.file)
  formData.append('leagueCode', importForm.leagueCode) // ✅ 下拉参数提交到后台

  try {
    const res = await request.post('/team/import.do', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const { successCount = 0, failCount = 0, errorList = [] } = res.data || {}

    if (failCount === 0) {
      ElMessage.success(`✅ 导入成功 ${successCount} 条`)
      importDialogVisible.value = false
      handleQuery()
    } else {
      ElMessageBox.alert(
        `<p>📊 成功: ${successCount} 条 | ❌ 失败: ${failCount} 条</p>
         ${errorList.length ? '<ul style="max-height:200px;overflow-y:auto">' +
          errorList.map(e => `<li>第 ${e.row} 行: ${e.msg}</li>`).join('') + '</ul>' : ''}`,
        '导入结果',
        { dangerouslyUseHTMLString: true, confirmButtonText: '确定' }
      )
    }
  } catch (e) {
    ElMessage.error('导入失败: ' + (e.message || '未知错误'))
  } finally {
    importLoading.value = false
  }
}

onMounted(() => {
  fetchLeagueOptions()
  handleQuery()
})
</script>

<style scoped lang="scss">
.team-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}
.search-buttons { display: flex; gap: 10px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
.logo-cell {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.table-logo {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: scale(1.15);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
}
.no-data { color: #909399; font-size: 12px; }

/* 🖼️ 上传组件样式 */
.logo-uploader {
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
    &:hover { border-color: var(--el-color-primary); }
  }
  .logo-uploader-icon {
    font-size: 28px; color: #8c939d; width: 100px; height: 100px; text-align: center;
  }
  .logo-preview { width: 100px; height: 100px; display: block; object-fit: cover; }
}
.upload-tip { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
