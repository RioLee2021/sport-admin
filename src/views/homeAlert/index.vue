<template>
  <div class="home-alert-container">
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
          <span class="title">首页弹窗列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增弹窗</el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center"/>
        <el-table-column label="语言代码" prop="languageCode" width="120" align="center"/>

        <el-table-column label="弹窗内容" prop="content" min-width="250">
          <template #default="{ row }">
            <div class="content-preview">
              <span>{{ stripHtml(row.content) }}</span>
              <el-button
                v-if="row.content"
                type="primary"
                link
                size="small"
                @click="viewRichContent(row.content)"
                style="margin-left: 8px"
              >
                查看
              </el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="排序号" prop="sortNum" width="100" align="center"/>
        <el-table-column label="状态" prop="disabled" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建人" prop="createBy" width="120" align="center"/>
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

    <!-- 富文本预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      title="内容预览"
      width="700px"
      :close-on-click-modal="false"
    >
      <div class="rich-preview" v-html="previewContent"></div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ✏️ 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑弹窗' : '新增弹窗'"
      width="700px"
      :close-on-click-modal="false"
      :lock-scroll="false"
      append-to-body
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="语言代码" prop="languageCode">
          <el-input
            v-model="form.languageCode"
            placeholder="请输入语言代码 (如 zh-CN, en-US)"
            clearable
          />
        </el-form-item>

        <!-- 📝 wangEditor 富文本编辑器 -->
        <el-form-item label="弹窗内容" prop="content">
          <div class="editor-wrapper" v-if="dialogVisible">
            <Toolbar
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              :mode="mode"
            />
            <Editor
              v-model="form.content"
              :defaultConfig="editorConfig"
              :mode="mode"
              @onCreated="handleCreated"
              @onDestroyed="handleDestroyed"
            />
          </div>
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
import { ref, reactive, onMounted, shallowRef, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

// ✅ wangEditor 导入
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 预览状态
const previewVisible = ref(false)
const previewContent = ref('')

/** 👁️ 查看完整富文本 */
const viewRichContent = (html) => {
  previewContent.value = html
  previewVisible.value = true
}

/** 🧹 过滤 HTML 标签，返回纯文本预览 */
const stripHtml = (html) => {
  if (!html) return '-'
  // 移除 HTML 标签 + 解码实体字符 + 截取前 50 字
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
  return text.length > 50 ? text.slice(0, 50) + '...' : text
}

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

// 📝 wangEditor 实例 (使用 shallowRef)
const editorRef = shallowRef()
const mode = ref('default') // 或 'simple'
const toolbarConfig = {}
const editorConfig = {
  placeholder: '请输入弹窗公告内容...',
  MENU_CONF: {
    uploadImage: {
      // ✅ 图片上传配置
      async customUpload(file, insertFn) {
        const formData = new FormData()
        formData.append('file', file)

        try {
          const res = await request.post('/pub/uploadPic.do', formData, {
            params: { type: 2 },
            headers: { 'Content-Type': 'multipart/form-data' }
          })

          const url = res.data?.url || res.data
          if (url) {
            // wangEditor 5 插入图片方式
            insertFn(url, file.name, url)
          }
        } catch (error) {
          ElMessage.error('图片上传失败')
        }
      }
    }
  }
}

// 表单数据
const form = reactive({
  id: null,
  languageCode: '',
  content: '',
  sortNum: 0
})

// 表单验证规则
const rules = {
  languageCode: [
    { required: true, message: '请输入语言代码', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入弹窗内容', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        // 过滤 HTML 标签和 &nbsp; 后检查是否为空
        const text = value ? value.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim() : ''
        if (!text) {
          callback(new Error('弹窗内容不能为空'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  sortNum: [
    { required: true, message: '请输入排序号', trigger: 'blur' }
  ]
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const res = await request.post('/homeAlert/page.do', {
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

/** ➕ 新增弹窗 */
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, { id: null, languageCode: '', content: '', sortNum: 0 })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

/** ✏️ 编辑弹窗 */
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
      const submitData = {
        id: form.id,
        languageCode: form.languageCode,
        content: form.content,
        sortNum: form.sortNum
      }

      const api = isEdit.value ? '/homeAlert/edit.do' : '/homeAlert/add.do'
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

/** 🗑️ 删除弹窗 */
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除该弹窗配置吗？此操作不可恢复！`,
    '警告',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      await request.post('/homeAlert/delete.do', { id: row.id })
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
  // ✅ 销毁编辑器实例
  const editor = editorRef.value
  if (editor) {
    editor.destroy()
    editorRef.value = null
  }
}

/** 📝 编辑器生命周期 */
const handleCreated = (editor) => {
  editorRef.value = editor
}

const handleDestroyed = (editor) => {
  editorRef.value = null
}

// 🧹 组件卸载时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) {
    editor.destroy()
  }
})

onMounted(() => handleQuery())
</script>

<style scoped lang="scss">
.home-alert-container {
  padding: 20px;
}

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

.search-buttons { display: flex; gap: 10px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }

/* 📝 wangEditor 样式优化 */
.editor-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  z-index: 100;

  :deep(.w-e-toolbar) {
    border-bottom: 1px solid #dcdfe6 !important;
  }

  :deep(.w-e-text-container) {
    min-height: 300px !important;
  }
}

.content-preview {
  display: flex; align-items: center;
  color: #606266; font-size: 14px; line-height: 1.5;
}

/* 🔐 富文本预览样式 */
:deep(.rich-preview) {
  max-height: 400px; overflow-y: auto;
  padding: 12px; background: #f8f9fa;
  border-radius: 4px; border: 1px solid #e4e7ed;
  script, iframe, object, embed { display: none !important; }
  img { max-width: 100%; height: auto; border-radius: 4px; }
  p, ul, ol { margin: 8px 0; }
}
</style>
