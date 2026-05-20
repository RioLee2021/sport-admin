<template>
  <div class="merchant-container">
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
            <el-form-item label="商户编号" prop="code">
              <el-input
                v-model="queryParams.code"
                placeholder="请输入商户编号"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="语言" prop="languageCode">
              <el-input
                v-model="queryParams.languageCode"
                placeholder="请输入语言代码"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="时区" prop="zoneId">
              <el-input
                v-model="queryParams.zoneId"
                placeholder="请输入时区ID"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="域名前缀" prop="serverPreName">
              <el-input
                v-model="queryParams.serverPreName"
                placeholder="请输入域名前缀"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="是否默认" prop="defaultFlag">
              <el-select
                v-model="queryParams.defaultFlag"
                placeholder="请选择"
                clearable
                style="width: 60px"
              >
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <div class="search-buttons">
              <el-button type="primary" :icon="Search" @click="handleQuery">
                查询
              </el-button>
              <el-button :icon="Refresh" @click="handleReset">
                重置
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 📋 表格区域 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">商户列表</span>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" fixed="left" />

        <el-table-column
          label="商户名称"
          prop="name"
          min-width="150"
          fixed="left"
          show-overflow-tooltip
        />

        <el-table-column label="商户编号" prop="code" width="120" align="center" />

        <el-table-column label="语言代码" prop="languageCode" width="120" align="center" />

        <el-table-column label="时区ID" prop="zoneId" width="150" align="center" />

        <el-table-column
          label="域名前缀"
          prop="serverPreNames"
          min-width="200"
          show-overflow-tooltip
        />

        <el-table-column label="是否默认" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.defaultFlag ? 'success' : 'info'">
              {{ row.defaultFlag ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createAt) }}
          </template>
        </el-table-column>

        <!-- ✅ 只保留编辑按钮 -->
        <el-table-column
          label="操作"
          width="100"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ✏️ 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="`编辑商户 - ${editForm.name}`"
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
        <el-form-item label="商户ID" prop="id">
          <el-input v-model="editForm.id" disabled />
        </el-form-item>

        <el-form-item label="商户名称" prop="name">
          <el-input
            v-model="editForm.name"
            placeholder="请输入商户名称"
            maxlength="50"
            show-word-limit
            clearable
          />
        </el-form-item>

        <el-form-item label="域名前缀" prop="serverPreNames">
          <el-input
            v-model="editForm.serverPreNames"
            type="textarea"
            :rows="3"
            placeholder="请输入域名前缀，多个用逗号分隔"
            maxlength="200"
            show-word-limit
            clearable
          />
          <div class="form-tip">多个域名前缀用英文逗号分隔，例如：localhost,live,test</div>
        </el-form-item>

        <!-- 只读字段展示 -->
        <el-divider content-position="left">其他信息（不可修改）</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商户编号">
              <el-input v-model="editForm.code" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="语言代码">
              <el-input v-model="editForm.languageCode" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="时区ID">
              <el-input v-model="editForm.zoneId" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否默认">
              <el-tag :type="editForm.defaultFlag ? 'success' : 'info'">
                {{ editForm.defaultFlag ? '是' : '否' }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { formatDateTime } from '@/utils/format'

// 📊 表格数据
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  code: '',
  languageCode: '',
  zoneId: '',
  serverPreName: '',
  defaultFlag: null
})

// 📋 选中的行
const selectedRows = ref([])

// 查询表单引用
const queryFormRef = ref()

// ✏️ 编辑对话框
const dialogVisible = ref(false)
const editFormRef = ref()
const submitLoading = ref(false)

// 编辑表单数据
const editForm = reactive({
  id: null,
  name: '',
  code: '',
  languageCode: '',
  zoneId: '',
  serverPreNames: '',
  defaultFlag: null,
  createAt: null
})

// 编辑表单验证规则
const editRules = {
  name: [
    { required: true, message: '请输入商户名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  serverPreNames: [
    { required: true, message: '请输入域名前缀', trigger: 'blur' }
  ]
}

/**
 * 🔍 查询商户列表
 */
const handleQuery = async () => {
  loading.value = true
  try {
    const res = await request.post('/merchant/list.do', {
      ...queryParams
    })

    if (res.data) {
      tableData.value = Array.isArray(res.data) ? res.data : (res.data.list || res.data.records || [])
    }
  } catch (error) {
    ElMessage.error('查询失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

/**
 * 🔄 重置查询
 */
const handleReset = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/**
 * ✏️ 编辑商户
 */
const handleEdit = (row) => {
  // 复制数据到编辑表单
  Object.assign(editForm, row)
  dialogVisible.value = true

  // 对话框打开后重置验证状态
  setTimeout(() => {
    editFormRef.value?.clearValidate()
  }, 100)
}

/**
 * 💾 提交编辑
 */
const handleSubmit = async () => {
  if (!editFormRef.value) return

  await editFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitLoading.value = true
    try {
      // 只提交可修改的字段
      const submitData = {
        id: editForm.id,
        name: editForm.name,
        serverPreNames: editForm.serverPreNames
      }

      await request.post('/merchant/edit.do', submitData)

      ElMessage.success('修改成功')
      dialogVisible.value = false
      handleQuery() // 刷新列表
    } catch (error) {
      ElMessage.error('修改失败：' + (error.message || '未知错误'))
    } finally {
      submitLoading.value = false
    }
  })
}

/**
 * 🚫 关闭对话框
 */
const handleDialogClose = () => {
  editFormRef.value?.resetFields()
  Object.assign(editForm, {
    id: null,
    name: '',
    code: '',
    languageCode: '',
    zoneId: '',
    serverPreNames: '',
    defaultFlag: null,
    createAt: null
  })
}

/**
 * 📋 选择变化
 */
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 🚀 页面加载时查询
onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.merchant-container {
  padding: 20px;

  .search-card {
    margin-bottom: 20px;

    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .table-card {
    :deep(.el-card__body) {
      padding: 20px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        font-size: 16px;
        font-weight: bold;
        color: #303133;
      }
    }

    :deep(.el-table) {
      overflow-x: auto;

      .el-table__fixed,
      .el-table__fixed-right {
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
    }
  }

  .search-buttons {
    display: flex;
    gap: 10px;
    margin-left: 10px;
  }
}

// ✏️ 编辑对话框样式
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-divider__text) {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}
</style>
