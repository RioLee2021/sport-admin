<template>
  <div class="home-banner-container">
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
            <el-form-item label="语言代码" prop="languageCode">
              <el-input
                v-model="queryParams.languageCode"
                placeholder="请输入语言代码"
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
          <span class="title">首页轮播图列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增轮播图</el-button>
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

        <el-table-column label="语言代码" prop="languageCode" width="120" align="center" />

        <el-table-column label="轮播图片" prop="bannerUrl" width="180" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.bannerUrl"
              :src="row.bannerUrl"
              fit="cover"
              style="width: 100px; height: 60px; border-radius: 4px; cursor: pointer"
              :preview-src-list="[row.bannerUrl]"
            />
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>

        <el-table-column label="排序号" prop="sortNum" width="100" align="center" />

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
      :title="isEdit ? '编辑轮播图' : '新增轮播图'"
      width="600px"
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
        <!-- 新增时输入语言代码，编辑时不可修改 -->
        <el-form-item label="语言代码" prop="languageCode">
          <el-input
            v-model="form.languageCode"
            placeholder="请输入语言代码 (如 zh-CN, en-US)"
            :disabled="isEdit"
            clearable
          />
        </el-form-item>

        <el-form-item label="轮播图片" prop="bannerUrl">
          <el-upload
            class="banner-uploader"
            :show-file-list="false"
            :http-request="handleUploadBanner"
            :before-upload="beforeUpload"
          >
            <img v-if="form.bannerUrl" :src="form.bannerUrl" class="banner-preview" />
            <el-icon v-else class="banner-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">支持 jpg/png，建议尺寸 1920x600</div>
          <el-button
            v-if="form.bannerUrl"
            type="danger"
            link
            size="small"
            @click="form.bannerUrl = ''"
            style="margin-top: 8px"
          >
            清除图片
          </el-button>
        </el-form-item>

        <el-form-item label="排序号" prop="sortNum">
          <el-input-number
            v-model="form.sortNum"
            :min="0"
            :precision="0"
            controls-position="right"
            style="width: 100%"
          />
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
const formRef = ref()
const submitLoading = ref(false)
const isEdit = ref(false)

// 表单数据
const form = reactive({
  id: null,
  languageCode: '',
  bannerUrl: '',
  sortNum: 0
})

// 表单验证规则
const rules = {
  languageCode: [
    { required: true, message: '请输入语言代码', trigger: 'blur' },
    { pattern: /^[a-z]{2}(-[A-Z]{2})?$/, message: '格式如：zh-CN, en-US', trigger: 'blur' }
  ],
  bannerUrl: [
    { required: true, message: '请上传轮播图片', trigger: 'change' }
  ],
  sortNum: [
    { required: true, message: '请输入排序号', trigger: 'blur' }
  ]
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const res = await request.post('/homeBanner/page.do', {
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

/** ➕ 新增轮播图 */
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null,
    languageCode: '',
    bannerUrl: '',
    sortNum: 0
  })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

/** ✏️ 编辑轮播图 */
const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

/** 💾 提交表单 */
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitLoading.value = true
    try {
      // 根据 Swagger 文档，编辑接口不需要 languageCode
      const submitData = isEdit.value
        ? { id: form.id, bannerUrl: form.bannerUrl, sortNum: form.sortNum }
        : { languageCode: form.languageCode, bannerUrl: form.bannerUrl, sortNum: form.sortNum }

      const api = isEdit.value ? '/homeBanner/edit.do' : '/homeBanner/add.do'
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

/** 🗑️ 删除轮播图 */
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除该轮播图配置吗？此操作不可恢复！`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await request.post('/homeBanner/delete.do', { id: row.id })
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

/** 📤 自定义上传逻辑 */
const handleUploadBanner = async ({ file }) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    // ⚠️ 注意：请根据后端实际定义修改 type 值 (如 2 或 3)
    const res = await request.post('/pub/uploadPic.do', formData, {
      params: { type: 2 },
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    const url = res.data?.url || res.data || ''
    if (url) {
      form.bannerUrl = url
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

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.home-banner-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}
.search-buttons { display: flex; gap: 10px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
.no-data { color: #909399; font-size: 12px; }

/* 上传组件样式 */
.banner-uploader {
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9; border-radius: 6px; cursor: pointer; position: relative; overflow: hidden; transition: var(--el-transition-duration-fast);
    &:hover { border-color: var(--el-color-primary); }
  }
  .banner-uploader-icon { font-size: 28px; color: #8c939d; width: 100px; height: 100px; text-align: center; }
  .banner-preview { width: 100px; height: 100px; display: block; object-fit: cover; }
}
.upload-tip { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
