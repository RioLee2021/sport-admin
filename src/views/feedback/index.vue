<template>
  <div class="feedback-container">
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
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="queryParams.username"
                placeholder="请输入用户名"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="手机号" prop="phoneNumber">
              <el-input
                v-model="queryParams.phoneNumber"
                placeholder="请输入手机号"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="处理状态" prop="handledFlag">
              <el-select
                v-model="queryParams.handledFlag"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option label="已处理" :value="true" />
                <el-option label="未处理" :value="false" />
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
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />

        <el-table-column label="用户名" prop="username" width="120" align="center" />
        <el-table-column label="手机号" prop="phoneNumber" width="130" align="center" />

        <el-table-column label="会员类型" prop="memberType" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.memberType === '1' ? 'warning' : ''">
              {{ getDictLabel('MemberType', row.memberType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="会员状态" prop="stat" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getMemberStatTag(row.stat)" size="small">
              {{ getDictLabel('MemberStat', row.stat) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="反馈内容" prop="feedbackContent" min-width="180" show-overflow-tooltip />
        <el-table-column label="回复内容" prop="replyContent" min-width="180" show-overflow-tooltip />

        <el-table-column label="处理状态" prop="handledFlag" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.handledFlag ? 'success' : 'info'" size="small">
              {{ row.handledFlag ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">回复/编辑</el-button>
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

    <!-- ✏️ 回复/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.handledFlag ? '已处理反馈' : '回复反馈'"
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
        <el-form-item label="反馈ID" prop="id">
          <el-input v-model="form.id" disabled />
        </el-form-item>

        <el-form-item label="处理状态" prop="handledFlag">
          <el-switch v-model="form.handledFlag" active-text="已处理" inactive-text="未处理" />
        </el-form-item>

        <el-form-item label="回复内容" prop="replyContent">
          <el-input
            v-model="form.replyContent"
            type="textarea"
            :rows="4"
            placeholder="请输入回复内容"
            maxlength="500"
            show-word-limit
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  username: '',
  phoneNumber: '',
  handledFlag: undefined,
  page: 1,
  pageSize: 10
})

// 📄 分页参数
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const queryFormRef = ref()

// ✏️ 对话框状态
const dialogVisible = ref(false)
const formRef = ref()
const submitLoading = ref(false)

const form = reactive({
  id: null,
  handledFlag: false,
  replyContent: ''
})

// 校验规则 (严格遵循 MemberFeedbackEditForm)
const rules = {
  handledFlag: [{ required: true, message: '请设置处理状态', trigger: 'change' }],
  replyContent: [{ required: true, message: '请输入回复内容', trigger: 'blur' }]
}

// 🏷️ 辅助方法：会员状态标签颜色
const getMemberStatTag = (stat) => {
  const map = { '0': 'success', '1': 'warning', '2': 'danger', '3': 'info' }
  return map[stat] || 'info'
}

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      username: queryParams.username || undefined,
      phoneNumber: queryParams.phoneNumber || undefined,
      handledFlag: queryParams.handledFlag,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/feedback/page.do', payload)
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

// ✏️ 打开编辑/回复
const handleEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    handledFlag: row.handledFlag,
    replyContent: row.replyContent || ''
  })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

// 💾 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      // 接口仅支持 id, handledFlag, replyContent
      await request.post('/feedback/edit.do', { ...form })
      ElMessage.success('操作成功')
      dialogVisible.value = false
      handleQuery()
    } catch (error) {
      ElMessage.error('操作失败：' + (error.message || '未知错误'))
    } finally {
      submitLoading.value = false
    }
  })
}

// 🗑️ 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除该反馈记录吗？此操作不可恢复！`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.post('/feedback/delete.do', { id: row.id })
      ElMessage.success('删除成功')
      handleQuery()
    } catch (error) {
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.feedback-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
}
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
</style>
