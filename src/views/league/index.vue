<template>
  <div class="league-container">
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
          <el-col :span="8">
            <el-form-item label="赛事CODE" prop="code">
              <el-input
                v-model="queryParams.code"
                placeholder="请输入赛事CODE"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="运动类型" prop="sportType">
              <el-select
                v-model="queryParams.sportType"
                placeholder="请选择运动类型"
                clearable
                style="width: 100%;min-width: 80px"
              >
                <el-option
                  v-for="item in getDictOptions('SportType')"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
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
          <span class="title">联赛列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增联赛</el-button>
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

        <el-table-column label="赛事CODE" prop="code" width="120" align="center" show-overflow-tooltip />
        <el-table-column label="赛事名称" prop="name" min-width="150" show-overflow-tooltip />

        <!-- ✅ 使用封装好的字典方法翻译 -->
        <el-table-column label="运动类型" prop="sportType" width="120" align="center">
          <template #default="{ row }">
            {{ getDictLabel('SportType', row.sportType) }}
          </template>
        </el-table-column>

        <el-table-column label="赛事Logo" prop="logo" width="100" align="center">
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
        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>
        <el-table-column label="更新时间" prop="updateAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.updateAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center" fixed="right">
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
      :title="isEdit ? '编辑联赛' : '新增联赛'"
      width="550px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="right"
      >
        <!-- ✅ 仅新增时显示 CODE 和 运动类型 -->
        <el-form-item label="赛事CODE" prop="code" v-if="!isEdit">
          <el-input
            v-model="form.code"
            placeholder="请输入唯一赛事CODE"
            maxlength="50"
            show-word-limit
            clearable
          />
        </el-form-item>

        <!-- ✅ 编辑时显示但禁用 -->
        <el-form-item label="运动类型" prop="sportType" v-if="!isEdit">
          <el-select
            v-model="form.sportType"
            placeholder="请选择运动类型"
            style="width: 100%"
          >
            <el-option
              v-for="item in getDictOptions('SportType')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="赛事名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入赛事名称"
            maxlength="50"
            show-word-limit
            clearable
          />
        </el-form-item>

        <el-form-item label="赛事Logo" prop="logo">
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
          <el-button
            v-if="form.logo"
            type="danger"
            link
            size="small"
            @click="form.logo = ''"
            style="margin-top: 8px"
          >
            清除图片
          </el-button>
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
import { getDictOptions, getDictLabel } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  code: null,
  sportType: null,
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
const formRef = ref()
const submitLoading = ref(false)
const isEdit = ref(false)

// 表单数据
const form = reactive({
  id: null,
  code: '',
  name: '',
  sportType: '',
  logo: ''
})

// 表单验证规则
const rules = {
  code: [
    { required: true, message: '请输入赛事CODE', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '仅支持字母、数字、下划线、短横线', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入赛事名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  sportType: [
    { required: true, message: '请选择运动类型', trigger: 'change' }
  ]
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const res = await request.post('/league/page.do', {
      code: queryParams.code,
      sportType: queryParams.sportType,
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

/** ➕ 新增联赛 */
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, { id: null, code: '', name: '', sportType: '', logo: '' })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

/** ✏️ 编辑联赛 */
const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

/** 💾 提交表单 (新增/编辑) */
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitLoading.value = true
    try {
      // ✅ 根据 isEdit 区分提交参数
      // 编辑时根据 Swagger 文档只能修改 name 和 logo
      const submitData = isEdit.value
        ? { id: form.id, name: form.name, logo: form.logo }
        : { code: form.code, name: form.name, sportType: form.sportType, logo: form.logo }

      const api = isEdit.value ? '/league/edit.do' : '/league/add.do'
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

/** 🗑️ 删除联赛 */
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除联赛"${row.name}"吗？此操作不可恢复！`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await request.post('/league/delete.do', { id: row.id })
      ElMessage.success('删除成功')
      handleQuery()
    } catch (error) {
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

/** 🖼️ 图片上传前校验 */
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) ElMessage.error('只能上传图片文件!')
  if (!isLt2M) ElMessage.error('图片大小不能超过 2MB!')
  return isImage && isLt2M
}

/** 📤 自定义上传逻辑 (type=0 代表联赛) */
const handleUploadLogo = async ({ file }) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await request.post('/pub/uploadPic.do', formData, {
      params: { type: 0 },
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    const url = res.data?.url || res.data || ''
    if (url) {
      form.logo = url
      ElMessage.success('上传成功')
    } else {
      ElMessage.error('上传失败：未返回图片地址')
    }
  } catch (error) {
    ElMessage.error('上传失败：' + (error.message || '未知错误'))
  }
}

/** 🚫 关闭对话框清理 */
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

/** 🖼️ 点击 Logo 新窗口打开 */
const openLogo = (url) => {
  if (url) window.open(url, '_blank')
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.league-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}
.search-buttons { display: flex; gap: 10px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }

/* 图片展示样式 */
.logo-cell { cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.table-logo { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #e4e7ed; transition: transform 0.2s; &:hover { transform: scale(1.15); } }
.no-data { color: #909399; font-size: 12px; }

/* 上传组件样式 */
.logo-uploader {
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9; border-radius: 6px; cursor: pointer; position: relative; overflow: hidden; transition: var(--el-transition-duration-fast);
    &:hover { border-color: var(--el-color-primary); }
  }
  .logo-uploader-icon { font-size: 28px; color: #8c939d; width: 100px; height: 100px; text-align: center; }
  .logo-preview { width: 100px; height: 100px; display: block; object-fit: cover; }
}
.upload-tip { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
