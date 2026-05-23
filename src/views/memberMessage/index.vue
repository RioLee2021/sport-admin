<template>
  <div class="member-message-container">
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
          <span class="title">会员私信列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增私信</el-button>
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

        <el-table-column label="私信内容" prop="message" min-width="200" show-overflow-tooltip />

        <el-table-column label="已读" prop="readied" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.readied ? 'success' : 'info'" size="small">
              {{ row.readied ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" prop="disabled" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
              {{ row.disabled ? '禁用' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
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

    <!-- ✏️ 新增私信对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新增会员私信"
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
        <el-form-item label="接收方式" prop="receiveType">
          <el-radio-group v-model="form.receiveType" @change="handleReceiveTypeChange">
            <el-radio label="username">用户名</el-radio>
            <el-radio label="phoneNumber">手机号</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="form.receiveType === 'username'"
          label="用户名"
          prop="username"
        >
          <el-input
            v-model="form.username"
            placeholder="请输入会员用户名"
            clearable
          />
        </el-form-item>

        <el-form-item
          v-if="form.receiveType === 'phoneNumber'"
          label="手机号"
          prop="phoneNumber"
        >
          <el-input
            v-model="form.phoneNumber"
            placeholder="请输入会员手机号"
            clearable
          />
        </el-form-item>

        <el-form-item label="私信内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入私信内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">发送</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  username: '',
  phoneNumber: '',
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
  receiveType: 'username', // 默认用户名
  username: '',
  phoneNumber: '',
  content: ''
})

// 校验规则（动态切换）
const rules = computed(() => ({
  content: [
    { required: true, message: '请输入私信内容', trigger: 'blur' },
    { min: 1, max: 500, message: '长度在 1 到 500 个字符', trigger: 'blur' }
  ],
  username: form.receiveType === 'username'
    ? [{ required: true, message: '请输入用户名', trigger: 'blur' }]
    : [],
  phoneNumber: form.receiveType === 'phoneNumber'
    ? [{ required: true, message: '请输入手机号', trigger: 'blur' }]
    : []
}))

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      username: queryParams.username || undefined,
      phoneNumber: queryParams.phoneNumber || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/memberMessage/page.do', payload)
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

// 🏷️ 辅助方法：会员状态标签颜色
const getMemberStatTag = (stat) => {
  const map = { '0': 'success', '1': 'warning', '2': 'danger', '3': 'info' }
  return map[stat] || 'info'
}

// ✏️ 接收方式切换时清空对应字段
const handleReceiveTypeChange = () => {
  if (form.receiveType === 'username') {
    form.phoneNumber = ''
  } else {
    form.username = ''
  }
  // 触发校验规则更新
  formRef.value?.clearValidate()
}

// ➕ 新增私信
const handleAdd = () => {
  Object.assign(form, {
    receiveType: 'username',
    username: '',
    phoneNumber: '',
    content: ''
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
      const payload = {
        content: form.content,
        // 二选一传参
        ...(form.receiveType === 'username'
          ? { username: form.username }
          : { phoneNumber: form.phoneNumber })
      }
      await request.post('/memberMessage/add.do', payload)
      ElMessage.success('私信发送成功')
      dialogVisible.value = false
      handleQuery()
    } catch (error) {
      ElMessage.error('发送失败：' + (error.message || '未知错误'))
    } finally {
      submitLoading.value = false
    }
  })
}

// 🗑️ 删除记录
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除该私信记录吗？此操作不可恢复！`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.post('/memberMessage/delete.do', { id: row.id })
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
.member-message-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
</style>
