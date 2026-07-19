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
                style="width: 100%; min-width: 140px"
              >
                <el-option label="待审核" value="0" />
                <el-option label="已通过" value="1" />
                <el-option label="已拒绝" value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="验证状态" prop="validateResult">
              <el-select
                v-model="queryParams.validateResult"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 140px"
              >
                <el-option label="未验证" value="0" />
                <el-option label="验证成功" value="1" />
                <el-option label="验证失败" value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="站点名称" prop="siteName">
              <el-select
                v-model="queryParams.siteName"
                placeholder="请选择或输入"
                clearable
                filterable
                allow-create
                default-first-option
                style="width: 100%; min-width: 160px"
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
        <el-table-column label="站点名称" prop="siteName" width="120" show-overflow-tooltip />
        <el-table-column label="会员ID" prop="memberId" width="100" align="center" />

        <!-- ✅ 图片预览 -->
        <el-table-column label="分享截图" width="120" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.sharePicUrl"
              :src="row.sharePicUrl"
              :preview-src-list="[row.sharePicUrl]"
              fit="cover"
              class="share-thumb"
              preview-teleported
            >
              <template #error>
                <el-icon class="image-error"><Picture /></el-icon>
              </template>
            </el-image>
            <span v-else class="placeholder">-</span>
          </template>
        </el-table-column>

        <!-- ✅ 链接智能识别：URL跳转 / 非URL复制 -->
        <el-table-column label="分享网站" min-width="200">
          <template #default="{ row }">
            <div class="link-cell">
              <template v-if="isUrl(row.sourceLink)">
                <el-link type="primary" :href="row.sourceLink" target="_blank" :underline="false">
                  {{ truncateText(row.sourceLink, 30) }}
                  <el-icon><Link /></el-icon>
                </el-link>
              </template>
              <template v-else>
                <div class="copy-wrapper">
                  <span>{{ truncateText(row.sourceLink, 25) }}</span>
                  <el-button type="primary" link size="small" @click="copyToClipboard(row.sourceLink)">
                    <el-icon><CopyDocument /></el-icon>
                  </el-button>
                </div>
              </template>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="审核状态" prop="approveStatus" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getDictLabelType('ApproveStatus', row.approveStatus)" size="small">
              {{ getDictLabel('ApproveStatus', row.approveStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="验证状态" prop="validateResult" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getDictLabelType('ValidateResult', row.validateResult)" size="small">
              {{ getDictLabel('ValidateResult', row.validateResult) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建人" prop="createBy" width="100" align="center" />
        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.approveStatus == '0'"
              type="primary" link size="small"
              @click="openReviewDialog(row)"
            >审核</el-button>

            <!-- ✅ 新增：校验链接按钮（弹出输入框） -->
            <el-button type="success" link size="small" @click="openValidateLinkDialog(row)">
              校验链接
            </el-button>

            <el-button type="warning" link size="small" @click="openPosterDialog(row)">
              校验海报
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

    <!-- ✏️ 审核对话框 -->
    <el-dialog
      v-model="reviewVisible"
      title="审核分享记录"
      width="500px"
      :close-on-click-modal="false"
      @close="handleReviewClose"
    >
      <el-form ref="reviewFormRef" :model="reviewForm" :rules="reviewRules" label-width="100px">
        <el-form-item label="站点名称" prop="siteName">
          <!-- ✅ 支持下拉选择 + 手动输入 -->
          <el-select
            v-model="reviewForm.siteName"
            placeholder="请选择或输入站点名称"
            filterable
            allow-create
            default-first-option
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

        <!-- ✅ 新增：备注下拉（支持输入+localStorage缓存） -->
        <el-form-item label="备注" prop="remark">
          <el-select
            v-model="reviewForm.remark"
            placeholder="请选择或输入备注"
            filterable
            allow-create
            default-first-option
            :reserve-keyword="false"
            style="width: 100%"
            @change="handleRemarkChange"
          >
            <el-option
              v-for="item in remarkOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="审核结果" prop="accept">
          <el-radio-group v-model="reviewForm.accept">
            <el-radio :label="true">✅ 通过</el-radio>
            <el-radio :label="false">❌ 拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="primary" :loading="reviewLoading" @click="submitReview">提交审核</el-button>
      </template>
    </el-dialog>

    <!-- 🔗 校验链接对话框（前台输入） -->
    <el-dialog
      v-model="validateLinkVisible"
      title="校验分享链接"
      width="450px"
      :close-on-click-modal="false"
      @close="handleValidateLinkClose"
    >
      <el-form ref="validateLinkFormRef" :model="validateLinkForm" :rules="validateLinkRules" label-width="100px">
        <el-form-item label="分享链接" prop="shareLink">
          <el-input
            v-model="validateLinkForm.shareLink"
            placeholder="请输入待校验的分享链接"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="validateLinkVisible = false">取消</el-button>
        <el-button type="primary" :loading="validateLinkLoading" @click="submitValidateLink">提交校验</el-button>
      </template>
    </el-dialog>

    <!-- 🖼️ 海报校验对话框 -->
    <el-dialog
      v-model="posterVisible"
      title="校验海报图片"
      width="500px"
      :close-on-click-modal="false"
      @close="handlePosterClose"
    >
      <el-form label-width="100px">
        <el-form-item label="选择图片">
          <el-upload
            :auto-upload="false"
            :limit="1"
            accept="image/*"
            :on-change="handlePosterChange"
            :on-remove="handlePosterRemove"
          >
            <template #trigger>
              <el-button type="primary">选择图片</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">支持 jpg/png 格式，大小不超过 5MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="posterVisible = false">取消</el-button>
        <el-button type="primary" :loading="posterLoading" @click="submitPosterValidate">提交校验</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Picture, Link, CopyDocument } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// ✅ 备注下拉选项（localStorage 缓存）
const remarkOptions = ref([])
const REMARK_STORAGE_KEY = 'member_share_remark_options'

// 📦 从 localStorage 加载备注选项
const loadRemarkOptions = () => {
  try {
    const stored = localStorage.getItem(REMARK_STORAGE_KEY)
    if (stored) {
      remarkOptions.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('加载备注选项失败:', error)
  }
}

// 💾 保存备注选项到 localStorage（去重）
const saveRemarkOptions = () => {
  try {
    // 去重 + 过滤空值
    const uniqueOptions = [...new Set(remarkOptions.value.filter(item => item?.trim()))]
    localStorage.setItem(REMARK_STORAGE_KEY, JSON.stringify(uniqueOptions))
  } catch (error) {
    console.error('保存备注选项失败:', error)
  }
}

// 🔄 备注变更处理：新增到 localStorage
const handleRemarkChange = (value) => {
  if (!value) return
  // 如果输入的值不在现有列表中，则添加
  if (!remarkOptions.value.includes(value)) {
    remarkOptions.value.unshift(value) // 新值放前面
    saveRemarkOptions()
  }
}

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)
const siteOptions = ref([])

// 🔍 查询参数
const queryParams = reactive({
  approveStatus: '0',
  validateResult: '',
  siteName: '',
  page: 1,
  pageSize: 20
})
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const queryFormRef = ref()

// ✏️ 审核对话框状态
const reviewVisible = ref(false)
const reviewLoading = ref(false)
const reviewFormRef = ref()
const reviewForm = reactive({ id: null, siteName: '', accept: null,  remark: '' })
const reviewRules = {
  siteName: [{ required: true, message: '请输入或选择站点名称', trigger: 'blur' }],
  accept: [{ required: true, message: '请选择审核结果', trigger: 'change' }]
}

// 🔗 校验链接对话框状态
const validateLinkVisible = ref(false)
const validateLinkLoading = ref(false)
const validateLinkFormRef = ref()
const validateLinkForm = reactive({ id: null, shareLink: '' })
const validateLinkRules = {
  shareLink: [{ required: true, message: '请输入待校验的分享链接', trigger: 'blur' }]
}

// 🖼️ 海报校验对话框状态
const posterVisible = ref(false)
const posterLoading = ref(false)
const posterFormRef = ref() // 用于清理
const currentValidateId = ref(null)
const posterFile = ref(null)

//  ️ 辅助函数：判断是否为有效 URL
const isUrl = (str) => {
  if (!str) return false
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// 📏 辅助函数：文本截断
const truncateText = (text, maxLen) => {
  if (!text) return '-'
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

// 📋 辅助函数：复制到剪贴板
const copyToClipboard = async (text) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

// ️ 辅助函数：根据字典值返回标签类型
const getDictLabelType = (dictType, value) => {
  const maps = {
    ApproveStatus: { '0': 'warning', '1': 'success', '2': 'danger' },
    ValidateResult: { '0': 'info', '1': 'success', '2': 'danger' }
  }
  return maps[dictType]?.[value] || 'info'
}

// 🌐 获取站点下拉选项
const fetchSiteOptions = async () => {
  try {
    const res = await request.post('/memberShare/siteOpts.do', {})
    siteOptions.value = res.data || []
  } catch (error) {
    console.error('获取站点下拉失败:', error)
  }
}

// 🔍 分页查询
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      approveStatus: queryParams.approveStatus || undefined,
      validateResult: queryParams.validateResult || undefined,
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

// 🔄 重置查询
const handleReset = () => {
  queryFormRef.value?.resetFields()
  pagination.page = 1
  handleQuery()
}

// 📝 打开审核对话框
const openReviewDialog = (row) => {
  reviewForm.id = row.id
  reviewForm.siteName = row.siteName
  reviewForm.accept = null
  reviewVisible.value = true
  reviewForm.remark = ''
  setTimeout(() => reviewFormRef.value?.clearValidate(), 100)
}

// 💾 提交审核
const submitReview = async () => {
  if (!reviewFormRef.value) return
  await reviewFormRef.value.validate(async (valid) => {
    if (!valid) return
    reviewLoading.value = true
    try {
      await request.post('/memberShare/review.do', {
        id: reviewForm.id,
        siteName: reviewForm.siteName,
        accept: reviewForm.accept,
        remark: reviewForm.remark
      })
      ElMessage.success('审核提交成功')
      reviewVisible.value = false
      handleQuery()
    } catch (error) {
      ElMessage.error('审核失败：' + (error.response?.data || error.message))
    } finally {
      reviewLoading.value = false
    }
  })
}

const handleReviewClose = () => {
  reviewFormRef.value?.resetFields()
}

// 🔗 打开校验链接对话框（前台输入）
const openValidateLinkDialog = (row) => {
  validateLinkForm.id = row.id
  validateLinkForm.shareLink = '' // 清空输入框
  validateLinkVisible.value = true
  setTimeout(() => validateLinkFormRef.value?.clearValidate(), 100)
}

// 📤 提交校验链接
const submitValidateLink = async () => {
  if (!validateLinkFormRef.value) return
  await validateLinkFormRef.value.validate(async (valid) => {
    if (!valid) return
    validateLinkLoading.value = true
    try {
      const res = await request.post('/memberShare/validateLink.do', {
        id: validateLinkForm.id,
        shareLink: validateLinkForm.shareLink
      })
      if (res.data === 'success') {
        ElMessage.success('海报校验成功')
        posterVisible.value = false
        handleQuery()
      } else {
        ElMessage.error('海报校验失败：' + res.data)
      }
    } catch (error) {
      ElMessage.error('校验失败：' + (error.response?.data || error.message))
    } finally {
      validateLinkLoading.value = false
    }
  })
}

const handleValidateLinkClose = () => {
  validateLinkFormRef.value?.resetFields()
}

// 🖼️ 打开海报校验对话框
const openPosterDialog = (row) => {
  currentValidateId.value = row.id
  posterFile.value = null
  posterVisible.value = true
}

// 📤 海报文件选择
const handlePosterChange = (file) => {
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return
  }
  posterFile.value = file.raw
}

const handlePosterRemove = () => {
  posterFile.value = null
}

// 📤 提交海报校验
const submitPosterValidate = async () => {
  if (!posterFile.value) {
    return ElMessage.warning('请选择要校验的图片')
  }
  posterLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', posterFile.value)

    const res = await request.post('/memberShare/validatePoster.do', formData, {
      params: { id: currentValidateId.value },
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    if (res.data === 'success') {
      ElMessage.success('海报校验成功')
      posterVisible.value = false
      handleQuery()
    } else {
      ElMessage.error('海报校验失败：' + res.data)
    }
  } catch (error) {
    ElMessage.error('校验请求失败：' + (error.message || '未知错误'))
  } finally {
    posterLoading.value = false
  }
}

const handlePosterClose = () => {
  posterFile.value = null
}

onMounted(() => {
  loadRemarkOptions()
  fetchSiteOptions()
  handleQuery()
})
</script>

<style scoped lang="scss">
.member-share-container { padding: 20px; }

.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }

.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header {
    display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}

.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }

/* 🖼️ 图片样式 */
.share-thumb {
  width: 60px; height: 60px; border-radius: 4px; cursor: pointer; transition: transform 0.2s;
  &:hover { transform: scale(1.05); }
}
.image-error { color: #909399; font-size: 24px; }
.placeholder { color: #c0c4cc; font-size: 12px; }

/*  链接单元格样式 */
.link-cell { display: flex; align-items: center; gap: 6px; }
.copy-wrapper { display: flex; align-items: center; gap: 4px; color: #606266; font-size: 13px; }

/* 📄 表单提示 */
:deep(.el-upload__tip) { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
