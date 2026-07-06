<template>
  <div class="member-share-container">
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
            <el-form-item label="审核状态" prop="approveStatus">
              <el-select
                v-model="queryParams.approveStatus"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option label="待审核" value="0" />
                <el-option label="已通过" value="1" />
                <el-option label="已拒绝" value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="站点名称" prop="siteName">
              <el-select
                v-model="queryParams.siteName"
                placeholder="请选择站点"
                clearable
                filterable
                allow-create
                style="width: 100%; min-width: 140px"
              >
                <el-option
                  v-for="item in siteOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
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
          <span class="title">会员分享列表</span>
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

        <el-table-column label="分享图片" width="100" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.sharePicUrl"
              :src="row.sharePicUrl"
              :preview-src-list="[row.sharePicUrl]"
              fit="cover"
              class="share-image"
              preview-teleported
            >
              <template #error>
                <el-icon class="image-error"><Picture /></el-icon>
              </template>
            </el-image>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>

        <el-table-column label="站点名称" prop="siteName" width="120" align="center" />
        <el-table-column label="会员ID" prop="memberId" width="100" align="center" />

        <el-table-column label="证明链接" min-width="180">
          <template #default="{ row }">
            <div class="source-link-cell">
              <template v-if="isValidUrl(row.sourceLink)">
                <el-link
                  type="primary"
                  :href="row.sourceLink"
                  target="_blank"
                  :underline="false"
                  class="link-text"
                >
                  {{ truncateText(row.sourceLink, 20) }}
                  <el-icon class="link-icon"><Link /></el-icon>
                </el-link>
              </template>
              <template v-else>
                <el-tooltip content="点击复制" placement="top">
                  <el-link
                    type="info"
                    :underline="false"
                    class="copy-text"
                    @click="copyToClipboard(row.sourceLink)"
                  >
                    {{ truncateText(row.sourceLink, 20) }}
                    <el-icon class="copy-icon"><CopyDocument /></el-icon>
                  </el-link>
                </el-tooltip>
              </template>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="审核状态" prop="approveStatus" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getApproveStatusTag(row.approveStatus)" size="small">
              {{ getApproveStatusLabel(row.approveStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="启用状态" prop="disabled" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建人" prop="createBy" width="100" align="center" />
        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.approveStatus == '0'"
              type="primary"
              link
              size="small"
              @click="handleReview(row)"
            >
              审核
            </el-button>
            <el-button
              v-else
              type="info"
              link
              size="small"
              disabled
            >
              已审核
            </el-button>
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

    <!-- 🔍 审核对话框 -->
    <el-dialog
      v-model="reviewDialogVisible"
      title="审核分享"
      width="450px"
      :close-on-click-modal="false"
      @close="handleReviewDialogClose"
    >
      <el-form ref="reviewFormRef" :model="reviewForm" label-width="100px">
        <el-form-item label="站点名称" prop="siteName">
          <el-select
            v-model="reviewForm.siteName"
            placeholder="请选择或输入站点名称"
            filterable
            allow-create
            default-first-option
            :reserve-keyword="false"
            style="width: 100%"
          >
            <el-option
              v-for="item in siteOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="分享图片">
          <el-image
            :src="reviewForm.sharePicUrl"
            :preview-src-list="[reviewForm.sharePicUrl]"
            fit="cover"
            class="review-image"
            preview-teleported
          />
        </el-form-item>

        <el-form-item label="证明链接">
          <div class="review-source-link">
            <template v-if="isValidUrl(reviewForm.sourceLink)">
              <el-link
                type="primary"
                :href="reviewForm.sourceLink"
                target="_blank"
                :underline="false"
              >
                {{ truncateText(reviewForm.sourceLink, 30) }}
                <el-icon><Link /></el-icon>
              </el-link>
            </template>
            <template v-else>
              <el-tooltip content="点击复制" placement="top">
                <el-link
                  type="info"
                  :underline="false"
                  @click="copyToClipboard(reviewForm.sourceLink)"
                >
                  {{ truncateText(reviewForm.sourceLink, 30) }}
                  <el-icon><CopyDocument /></el-icon>
                </el-link>
              </el-tooltip>
            </template>
          </div>
        </el-form-item>

        <el-form-item label="审核结果" prop="accept" :rules="[{ required: true, message: '请选择审核结果', trigger: 'change' }]">
          <el-radio-group v-model="reviewForm.accept">
            <el-radio :label="true" border>✅ 通过</el-radio>
            <el-radio :label="false" border>❌ 拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
    <span class="dialog-footer">
      <el-button @click="reviewDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="reviewLoading" @click="submitReview">提交</el-button>
    </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Picture, Link, CopyDocument } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)
const siteOptions = ref([])

// 🔍 查询参数
const queryParams = reactive({
  approveStatus: '',
  siteName: '',
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

// 🔍 审核对话框状态
const reviewDialogVisible = ref(false)
const reviewFormRef = ref()
const reviewLoading = ref(false)
const reviewForm = reactive({
  id: null,
  siteName: '',
  sharePicUrl: '',
  sourceLink: '',
  accept: null
})

/** 🔗 判断是否为有效 URL */
const isValidUrl = (str) => {
  if (!str) return false
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** ✂️ 文本截断 */
const truncateText = (text, maxLength) => {
  if (!text) return '-'
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

/** 📋 复制到剪贴板 */
const copyToClipboard = async (text) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('已复制到剪贴板')
  }
}

/** 🏷️ 审核状态标签样式 */
const getApproveStatusTag = (status) => {
  const map = { '0': 'warning', '1': 'success', '2': 'danger' }
  return map[status] || 'info'
}

/** 🏷️ 审核状态文案 */
const getApproveStatusLabel = (status) => {
  const map = { '0': '待审核', '1': '已通过', '2': '已拒绝' }
  return map[status] || '-'
}

/** 📥 获取站点下拉列表 */
const fetchSiteOptions = async () => {
  try {
    const res = await request.post('/memberShare/siteOpts.do', {})
    siteOptions.value = res.data || []
  } catch (error) {
    console.error('获取站点下拉失败', error)
  }
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      approveStatus: queryParams.approveStatus || undefined,
      siteName: queryParams.siteName || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/memberShare/page.do', payload)
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

/** 🔍 打开审核对话框 */
const handleReview = (row) => {
  Object.assign(reviewForm, {
    id: row.id,
    siteName: row.siteName,
    sharePicUrl: row.sharePicUrl,
    sourceLink: row.sourceLink,
    accept: null
  })
  reviewDialogVisible.value = true
  setTimeout(() => reviewFormRef.value?.clearValidate(), 100)
}

/** 💾 提交审核 */
const submitReview = async () => {
  if (!reviewFormRef.value) return
  await reviewFormRef.value.validate(async (valid) => {
    if (!valid) return
    reviewLoading.value = true
    try {
      await request.post('/memberShare/review.do', {
        id: reviewForm.id,
        accept: reviewForm.accept,
        siteName: reviewForm.siteName
      })
      ElMessage.success('审核提交成功')
      reviewDialogVisible.value = false
      handleQuery()
    } catch (error) {
      ElMessage.error('审核失败：' + (error.message || '未知错误'))
    } finally {
      reviewLoading.value = false
    }
  })
}

const handleReviewDialogClose = () => {
  reviewFormRef.value?.resetFields()
}

onMounted(() => {
  fetchSiteOptions()
  handleQuery()
})
</script>

<style scoped lang="scss">
.member-share-container { padding: 20px; }

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

/* 🖼️ 图片样式 */
.share-image,
.review-image {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
}

.image-error {
  color: #909399;
  font-size: 24px;
}

.text-placeholder {
  color: #909399;
  font-size: 12px;
}

/* 🔗 证明链接样式 */
.source-link-cell,
.review-source-link {
  display: flex;
  align-items: center;
  gap: 4px;

  .link-text,
  .copy-text {
    font-size: 13px;
    max-width: 100%;

    .link-icon,
    .copy-icon {
      margin-left: 4px;
      font-size: 14px;
      vertical-align: middle;
    }
  }

  .link-text {
    color: #409EFF;
  }

  .copy-text {
    color: #909399;
    cursor: pointer;

    &:hover {
      color: #409EFF;
    }
  }
}

/* 🔍 审核对话框图片 */
:deep(.el-dialog) {
  .review-image {
    width: 100%;
    max-height: 200px;
    object-fit: contain;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
  }
}
</style>
