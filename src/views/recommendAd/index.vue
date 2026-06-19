<template>
  <div class="recommend-ad-container">
    <!-- 🔍 查询表单 -->
    <el-card class="search-card" shadow="hover">
      <el-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        label-width="90px"
        @submit.prevent
      >
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="主播" prop="streamerId">
              <el-select
                v-model="queryParams.streamerId"
                placeholder="请选择主播"
                clearable
                filterable
                style="width: 100%;min-width: 200px"
              >
                <el-option
                  v-for="item in streamerOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="是否特推" prop="specialFlag">
              <el-select v-model="queryParams.specialFlag" placeholder="请选择" clearable style="width: 100%;min-width: 100px">
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
          <span class="title">推荐广告列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增广告</el-button>
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

        <el-table-column label="广告图片" width="120" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.adUrl"
              :src="row.adUrl"
              :preview-src-list="[row.adUrl]"
              style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover"
              preview-teleported
            />
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>

        <el-table-column label="广告链接" prop="adLink" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link :href="row.adLink" type="primary" target="_blank" :underline="false">
              {{ row.adLink }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column label="主播" prop="streamerName" width="120" align="center" />

        <el-table-column label="点击次数" prop="hitCnt" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.hitCnt ?? 0 }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="特推" prop="specialFlag" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.specialFlag ? 'danger' : 'info'" size="small">
              {{ row.specialFlag ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="排序号" prop="sortNum" width="90" align="center" />

        <el-table-column label="状态" prop="disabled" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link size="small" @click="handleClearHit(row)">清零</el-button>
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
      :title="isEdit ? '编辑广告' : '新增广告'"
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
        <el-form-item label="主播" prop="streamerId">
          <el-select
            v-model="form.streamerId"
            placeholder="请选择主播"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in streamerOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="广告图片" prop="adUrl">
          <el-upload
            class="ad-uploader"
            :show-file-list="false"
            :http-request="handleUploadAd"
            :before-upload="beforeUpload"
          >
            <img v-if="form.adUrl" :src="form.adUrl" class="ad-preview" />
            <el-icon v-else class="ad-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">支持 jpg/png，建议 300x200，最大 2MB</div>
        </el-form-item>

        <el-form-item label="广告链接" prop="adLink">
          <el-input
            v-model="form.adLink"
            placeholder="请输入广告跳转链接"
            clearable
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序号" prop="sortNum">
              <el-input-number
                v-model="form.sortNum"
                :min="0"
                :precision="0"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否特推" prop="specialFlag">
              <el-switch
                v-model="form.specialFlag"
                active-text="是"
                inactive-text="否"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 编辑时显示只读信息 -->
        <el-divider content-position="left" v-if="isEdit">广告信息（只读）</el-divider>
        <el-row :gutter="20" v-if="isEdit">
          <el-col :span="12">
            <el-form-item label="点击次数">
              <el-input v-model="form.hitCnt" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="创建时间">
              <el-input :value="$formatDateTime(form.createAt)" disabled />
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
  streamerId: undefined,
  specialFlag: undefined,
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

// 📥 主播下拉数据
const streamerOptions = ref([])

// ✏️ 对话框状态
const dialogVisible = ref(false)
const formRef = ref()
const submitLoading = ref(false)
const isEdit = ref(false)

// 表单数据
const form = reactive({
  id: null,
  streamerId: null,
  adUrl: '',
  adLink: '',
  sortNum: 0,
  specialFlag: false,
  hitCnt: 0,
  createAt: null
})

// 表单验证规则
const rules = {
  streamerId: [{ required: true, message: '请选择主播', trigger: 'change' }],
  adUrl: [{ required: true, message: '请上传广告图片', trigger: 'change' }],
  adLink: [
    { required: true, message: '请输入广告链接', trigger: 'blur' },
    { type: 'url', message: '请输入有效的 URL 地址', trigger: 'blur' }
  ],
  sortNum: [{ required: true, message: '请输入排序号', trigger: 'blur' }],
  specialFlag: [{ required: true, message: '请设置是否特推', trigger: 'change' }]
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      streamerId: queryParams.streamerId,
      specialFlag: queryParams.specialFlag,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/recommendAd/page.do', payload)
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

/** 📥 获取主播下拉列表 */
const fetchStreamerOptions = async () => {
  try {
    const res = await request.post('/recommendAd/streamerOpts.do', {})
    streamerOptions.value = res.data || []
  } catch (error) {
    console.error('获取主播列表失败', error)
  }
}

/** 🖼️ 广告图片上传相关 */
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) ElMessage.error('只能上传图片文件!')
  if (!isLt2M) ElMessage.error('图片大小不能超过 2MB!')
  return isImage && isLt2M
}

const handleUploadAd = async ({ file }) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    // ✅ type=5 代表推荐广告图片
    const res = await request.post('/pub/uploadPic.do', formData, {
      params: { type: 5 },
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const url = res.data || res.data?.url || ''
    if (url) {
      form.adUrl = url
      ElMessage.success('上传成功')
    } else {
      ElMessage.error('上传失败：未返回图片地址')
    }
  } catch (error) {
    ElMessage.error('上传失败：' + (error.message || '未知错误'))
  }
}

/** ➕ 新增广告 */
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null, streamerId: null, adUrl: '', adLink: '',
    sortNum: 0, specialFlag: false, hitCnt: 0, createAt: null
  })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

/** ✏️ 编辑广告 */
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
      const api = isEdit.value ? '/recommendAd/edit.do' : '/recommendAd/add.do'
      // ✅ 根据 Swagger 定义裁剪字段
      const payload = isEdit.value
        ? {
          id: form.id,
          streamerId: form.streamerId,
          adUrl: form.adUrl,
          adLink: form.adLink,
          sortNum: form.sortNum,
          specialFlag: form.specialFlag
        }
        : {
          streamerId: form.streamerId,
          adUrl: form.adUrl,
          adLink: form.adLink,
          sortNum: form.sortNum,
          specialFlag: form.specialFlag
        }
      await request.post(api, payload)
      ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
      dialogVisible.value = false
      await handleQuery()
    } catch (error) {
      ElMessage.error((isEdit.value ? '修改' : '新增') + '失败：' + (error.message || '未知错误'))
    } finally {
      submitLoading.value = false
    }
  })
}

/** 🔄 切换启用/禁用状态 */
const handleToggle = async (row) => {
  const action = row.disabled ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定要${action}该广告吗？`, '提示', { type: 'warning' })
    await request.post('/recommendAd/edit.do', {
      id: row.id,
      streamerId: row.streamerId,
      adUrl: row.adUrl,
      adLink: row.adLink,
      sortNum: row.sortNum,
      specialFlag: row.specialFlag
    })
    ElMessage.success(`${action}成功`)
    await handleQuery()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败：` + (error.message || '未知错误'))
    }
  }
}

/** 🗑️ 删除广告 */
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除该广告吗？此操作不可恢复！`, '警告', { type: 'warning' })
    .then(async () => {
      await request.post('/recommendAd/delete.do', { id: row.id })
      ElMessage.success('删除成功')
      await handleQuery()
    }).catch(() => {})
}

/** 🔢 点击次数清零 */
const handleClearHit = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要将"${row.streamerName}"的广告点击次数清零吗？`, '提示', { type: 'warning' })
    await request.post('/recommendAd/clearHit.do', { id: row.id })
    ElMessage.success('点击次数已清零')
    await handleQuery()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清零失败：' + (error.message || '未知错误'))
    }
  }
}

/** 🚫 关闭对话框清理 */
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchStreamerOptions()
  handleQuery()
})
</script>

<style scoped lang="scss">
.recommend-ad-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
.text-gray { color: #909399; }

/* 🖼️ 广告图片上传组件样式 */
.ad-uploader {
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9; border-radius: 8px; cursor: pointer; position: relative; overflow: hidden; transition: var(--el-transition-duration-fast);
    &:hover { border-color: var(--el-color-primary); }
  }
  .ad-uploader-icon { font-size: 28px; color: #8c939d; width: 120px; height: 80px; text-align: center; }
  .ad-preview { width: 120px; height: 80px; display: block; object-fit: cover; border-radius: 8px; }
}
.upload-tip { font-size: 12px; color: #909399; margin-top: 4px; }

/* 🔗 广告链接样式 */
:deep(.el-link) {
  font-size: 13px;
  max-width: 100%;
}
</style>
