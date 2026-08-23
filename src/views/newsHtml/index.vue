<template>
  <div class="news-html-container">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline label-width="100px">
        <el-form-item label="语言代码">
          <el-input v-model="searchForm.languageCode" placeholder="如: th" clearable style="width: 200px;" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="新闻来源">
          <el-select v-model="searchForm.newsSource" placeholder="请选择" clearable style="width: 200px;">
            <el-option v-for="item in newsSourceOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="新闻状态">
          <el-select v-model="searchForm.newsStatus" placeholder="请选择" clearable style="width: 200px;">
            <el-option v-for="item in newsStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="热门标识">
          <el-select v-model="searchForm.hotFlag" placeholder="全部" clearable style="width: 200px;">
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格区域 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>新闻列表</span>
          <div>
            <el-button type="success" :icon="Upload" @click="openTplUploadDialog">上传模板</el-button>
            <el-button type="primary" :icon="Plus" @click="openInputDialog">录入新闻</el-button>
            <el-button type="success" :icon="Upload" @click="openUploadDialog">上传新闻</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <!-- 外部链接列 -->
        <el-table-column prop="url" label="外部链接" width="100" align="center">
          <template #default="{ row }">
            <el-link
              v-if="row.url"
              type="primary"
              :href="row.url"
              target="_blank"
              :underline="false"
            >
              打开
            </el-link>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="newsTitle" label="新闻标题" min-width="100" show-overflow-tooltip />
        <el-table-column prop="languageCode" label="语言" width="100" align="center" />

        <el-table-column prop="newsSource" label="来源" width="100" align="center">
          <template #default="{ row }">
            <el-tag>{{ getDictLabel('NewsSource', row.newsSource) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="newsStatus" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.newsStatus)">
              {{ getDictLabel('NewsStatus', row.newsStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="hotFlag" label="热门" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.hotFlag ? 'danger' : 'info'" size="small">
              {{ row.hotFlag ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="htmlFilename" label="HTML文件名" width="150" show-overflow-tooltip />

        <el-table-column prop="createAt" label="新闻时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.newsTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="320" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handlePreview(row)">预览</el-button>
            <el-button type="warning" link @click="openEditDialog(row)">编辑</el-button>
            <el-button type="success" link @click="openReviewDialog(row)">审核</el-button>
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
              <el-button type="primary" link>
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="deploy" :disabled="row.newsStatus === '3'">发布</el-dropdown-item>
                  <el-dropdown-item command="createHtml">生成HTML</el-dropdown-item>
                  <el-dropdown-item command="toggleHot">{{ row.hotFlag ? '取消热门' : '设为热门' }}</el-dropdown-item>
                  <el-dropdown-item command="unlisted" :disabled="row.newsStatus === '4'">下架</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 录入/编辑新闻弹窗 -->
    <el-dialog v-model="inputDialogVisible" :title="inputForm.id ? '编辑新闻' : '录入新闻'" width="800px" destroy-on-close>
      <el-form :model="inputForm" label-width="100px" :rules="inputRules" ref="inputFormRef">
        <el-form-item label="新闻标题" prop="newsTitle">
          <el-input v-model="inputForm.newsTitle" placeholder="请输入新闻标题" />
        </el-form-item>
        <el-form-item label="语言代码" prop="languageCode">
          <el-input v-model="inputForm.languageCode" placeholder="如: th" :disabled="!!inputForm.id" />
        </el-form-item>
        <el-form-item label="新闻内容" prop="newsContent">
          <!-- 注：实际项目中可替换为您项目中的富文本编辑器组件 (如 WangEditor 或 TinyMCE) -->
          <el-input v-model="inputForm.newsContent" type="textarea" :rows="10" placeholder="请输入新闻内容 (支持HTML)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inputDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="inputLoading" @click="submitInput">确定</el-button>
      </template>
    </el-dialog>

    <!-- 审核新闻弹窗 -->
    <el-dialog v-model="reviewDialogVisible" title="审核新闻" width="400px" destroy-on-close>
      <el-form :model="reviewForm" label-width="100px" :rules="reviewRules" ref="reviewFormRef">
        <el-form-item label="审核结果" prop="pass">
          <el-radio-group v-model="reviewForm.pass">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="reviewLoading" @click="submitReview">确定</el-button>
      </template>
    </el-dialog>

    <!-- 上传新闻弹窗 -->
    <el-dialog v-model="uploadDialogVisible" title="上传新闻" width="500px" destroy-on-close>
      <el-form :model="uploadForm" label-width="100px" :rules="uploadRules" ref="uploadFormRef">
        <el-form-item label="新闻标题" prop="title">
          <el-input v-model="uploadForm.title" placeholder="请输入新闻标题" />
        </el-form-item>
        <el-form-item label="语言代码" prop="languageCode">
          <el-input v-model="uploadForm.languageCode" placeholder="如: th" />
        </el-form-item>
        <el-form-item label="上传文件" prop="file">
          <el-upload
            :auto-upload="false"
            :limit="1"
            :on-change="handleUploadFileChange"
            :on-remove="handleUploadFileRemove"
          >
            <el-button type="primary">选择文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploadLoading" @click="submitUpload">确定上传</el-button>
      </template>
    </el-dialog>
    <!-- 上传模板弹窗 -->
    <el-dialog v-model="tplUploadDialogVisible" title="上传新闻模板" width="500px" destroy-on-close>
      <el-form :model="tplUploadForm" label-width="100px" :rules="tplUploadRules" ref="tplUploadFormRef">
        <el-form-item label="新闻来源" prop="source">
          <el-select v-model="tplUploadForm.source" placeholder="请选择新闻来源" style="width: 100%;">
            <el-option v-for="item in newsSourceOptions" :key="item.value" :label="item.label" :value="Number(item.value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板文件" prop="file">
          <el-upload
            ref="tplUploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".html,.htm"
            :on-change="handleTplFileChange"
            :on-remove="handleTplFileRemove"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">请上传 HTML 格式的新闻模板文件</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tplUploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="tplUploadLoading" @click="submitTplUpload">确定上传</el-button>
      </template>
    </el-dialog>
    <!-- 新闻预览弹窗 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="新闻预览"
      width="85%"
      top="5vh"
      destroy-on-close
    >
      <!-- 使用 iframe 的 srcdoc 属性直接渲染 HTML 字符串 -->
      <iframe
        v-if="previewHtml"
        :srcdoc="previewHtml"
        class="preview-iframe"
        sandbox="allow-scripts allow-same-origin"
      ></iframe>
      <el-empty v-else description="暂无预览内容" />

      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Upload, ArrowDown } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { formatDateTime } from '@/utils/format'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// ================= 上传模板状态 =================
const tplUploadDialogVisible = ref(false)
const tplUploadLoading = ref(false)
const tplUploadFormRef = ref(null)
const tplUploadRef = ref(null)
const tplUploadForm = reactive({
  source: null,
  file: null
})
const tplUploadRules = {
  source: [{ required: true, message: '请选择新闻来源', trigger: 'change' }]
}
// ================= 预览状态 =================
const previewDialogVisible = ref(false)
const previewHtml = ref('')
// 处理模板文件选择
const handleTplFileChange = (file) => {
  tplUploadForm.file = file.raw
}

// 处理模板文件移除
const handleTplFileRemove = () => {
  tplUploadForm.file = null
}

// 打开上传模板弹窗
const openTplUploadDialog = () => {
  Object.assign(tplUploadForm, { source: null, file: null })
  if (tplUploadRef.value) {
    tplUploadRef.value.clearFiles()
  }
  tplUploadDialogVisible.value = true
}

// 提交上传模板
const submitTplUpload = async () => {
  if (!tplUploadFormRef.value) return
  await tplUploadFormRef.value.validate()

  if (!tplUploadForm.file) {
    return ElMessage.warning('请选择模板文件')
  }

  tplUploadLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', tplUploadForm.file)

    // source 是 query 参数
    const url = `/newsHtml/tplUpload.do?source=${tplUploadForm.source}`
    await request.post(url, formData)

    ElMessage.success('上传成功')
    tplUploadDialogVisible.value = false
  } catch (e) {
    console.error(e)
  } finally {
    tplUploadLoading.value = false
  }
}

// ================= 公共字典选项 =================
const newsSourceOptions = getDictOptions('NewsSource')
const newsStatusOptions = getDictOptions('NewsStatus')

// ================= 列表与搜索状态 =================
const loading = ref(false)
const tableData = ref([])
const searchForm = reactive({
  languageCode: '',
  newsSource: '',
  newsStatus: '',
  hotFlag: undefined
})
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

// ================= 录入/编辑弹窗状态 =================
const inputDialogVisible = ref(false)
const inputLoading = ref(false)
const inputFormRef = ref(null)
const inputForm = reactive({
  id: null,
  newsTitle: '',
  languageCode: '',
  newsContent: ''
})
const inputRules = {
  newsTitle: [{ required: true, message: '请输入新闻标题', trigger: 'blur' }],
  languageCode: [{ required: true, message: '请输入语言代码', trigger: 'blur' }],
  newsContent: [{ required: true, message: '请输入新闻内容', trigger: 'blur' }]
}

// ================= 审核弹窗状态 =================
const reviewDialogVisible = ref(false)
const reviewLoading = ref(false)
const reviewFormRef = ref(null)
const reviewForm = reactive({
  id: null,
  pass: true
})
const reviewRules = {
  pass: [{ required: true, message: '请选择审核结果', trigger: 'change' }]
}

// ================= 上传弹窗状态 =================
const uploadDialogVisible = ref(false)
const uploadLoading = ref(false)
const uploadFormRef = ref(null)
const uploadForm = reactive({
  title: '',
  languageCode: '',
  file: null
})
const uploadRules = {
  title: [{ required: true, message: '请输入新闻标题', trigger: 'blur' }],
  languageCode: [{ required: true, message: '请输入语言代码', trigger: 'blur' }]
}

// ================= 辅助函数 =================
const getStatusType = (status) => {
  const types = {
    '0': 'info',
    '1': 'warning',
    '2': 'primary',
    '3': 'success',
    '4': 'danger',
    '5': 'info'
  }
  return types[status] || 'info'
}

// ================= 核心列表方法 =================
const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize, ...searchForm }
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined || params[key] === null) {
        delete params[key]
      }
    })

    const res = await request.post('/newsHtml/page.do', params)
    const pageData = res.data || res
    tableData.value = pageData.list || []
    pagination.total = pageData.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.page = 1; fetchData() }
const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = key === 'hotFlag' ? undefined : ''
  })
  handleSearch()
}
const handleSizeChange = (val) => { pagination.pageSize = val; fetchData() }
const handleCurrentChange = (val) => { pagination.page = val; fetchData() }

// ================= 录入/编辑功能 =================
const openInputDialog = () => {
  Object.assign(inputForm, { id: null, newsTitle: '', languageCode: 'th', newsContent: '' })
  inputDialogVisible.value = true
}

const openEditDialog = (row) => {
  Object.assign(inputForm, {
    id: row.id,
    newsTitle: row.newsTitle,
    languageCode: row.languageCode,
    newsContent: row.newsContent
  })
  inputDialogVisible.value = true
}

const submitInput = async () => {
  if (!inputFormRef.value) return
  await inputFormRef.value.validate()

  inputLoading.value = true
  try {
    if (inputForm.id) {
      await request.post('/newsHtml/edit.do', {
        id: inputForm.id,
        newsTitle: inputForm.newsTitle,
        newsContent: inputForm.newsContent
      })
    } else {
      await request.post('/newsHtml/newsInput.do', {
        languageCode: inputForm.languageCode,
        newsTitle: inputForm.newsTitle,
        newsContent: inputForm.newsContent
      })
    }
    ElMessage.success(inputForm.id ? '编辑成功' : '录入成功')
    inputDialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    inputLoading.value = false
  }
}

// ================= 审核功能 =================
const openReviewDialog = (row) => {
  Object.assign(reviewForm, { id: row.id, pass: true })
  reviewDialogVisible.value = true
}

const submitReview = async () => {
  if (!reviewFormRef.value) return
  await reviewFormRef.value.validate()

  reviewLoading.value = true
  try {
    await request.post('/newsHtml/review.do', {
      id: reviewForm.id,
      pass: reviewForm.pass
    })
    ElMessage.success('审核成功')
    reviewDialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    reviewLoading.value = false
  }
}

// ================= 上传功能 =================
const openUploadDialog = () => {
  Object.assign(uploadForm, { title: '', languageCode: 'th', file: null })
  uploadDialogVisible.value = true
}

const handleUploadFileChange = (file) => { uploadForm.file = file.raw }
const handleUploadFileRemove = () => { uploadForm.file = null }

const submitUpload = async () => {
  if (!uploadFormRef.value) return
  await uploadFormRef.value.validate()
  if (!uploadForm.file) return ElMessage.warning('请选择文件')

  uploadLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadForm.file)

    // title 和 languageCode 是 query 参数
    const url = `/newsHtml/newsUpload.do?title=${encodeURIComponent(uploadForm.title)}&languageCode=${encodeURIComponent(uploadForm.languageCode)}`
    await request.post(url, formData)

    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    uploadLoading.value = false
  }
}

// ================= 预览功能 =================
const handlePreview = async (row) => {
  try {
    const res = await request.post('/newsHtml/preview.do', { id: row.id })

    // 🔑 核心兼容处理：
    // 1. 如果后端没有用统一响应体包装，res 直接就是 HTML 字符串
    // 2. 如果后端用了统一响应体包装 {code:200, data: "<html>..."}，则 res.data 是字符串
    let htmlContent = ''
    if (typeof res === 'string') {
      htmlContent = res
    } else if (res && typeof res.data === 'string') {
      htmlContent = res.data
    }

    if (htmlContent) {
      previewHtml.value = htmlContent
      previewDialogVisible.value = true
    } else {
      ElMessage.warning('未获取到有效的 HTML 预览内容')
    }
  } catch (e) {
    console.error('预览失败:', e)
  }
}

const handleCommand = async (command, row) => {
  const apiMap = {
    deploy: { url: '/newsHtml/deploy.do', msg: '发布', confirm: '确定要发布该新闻吗？' },
    createHtml: { url: '/newsHtml/createHtml.do', msg: '生成HTML', confirm: '确定要生成该新闻的HTML吗？' },
    toggleHot: { url: '/newsHtml/toggleHot.do', msg: '切换热门', confirm: `确定要${row.hotFlag ? '取消热门' : '设为热门'}吗？` },
    unlisted: { url: '/newsHtml/unlisted.do', msg: '下架', confirm: '确定要下架该新闻吗？' }
  }

  const action = apiMap[command]
  if (!action) return

  try {
    await ElMessageBox.confirm(action.confirm, '提示', { type: 'warning' })
    await request.post(action.url, { id: row.id })
    ElMessage.success(`${action.msg}成功`)
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

// ================= 生命周期 =================
onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">

.preview-iframe {
  width: 100%;
  height: 75vh; /* 占据弹窗 75% 的高度 */
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fff;
}

.news-html-container {
  padding: 20px;

  .search-card {
    margin-bottom: 16px;
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
