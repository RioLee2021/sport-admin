<template>
  <div class="user-container">
    <!-- 🔍 查询表单 -->
    <el-card class="search-card" shadow="hover">
      <el-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        label-width="80px"
        @submit.prevent
      >
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="账号" prop="account">
              <el-input
                v-model="queryParams.account"
                placeholder="请输入账号"
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
          <span class="title">用户列表</span>
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

        <el-table-column label="账号" prop="account" min-width="120" show-overflow-tooltip />
        <el-table-column label="姓名" prop="name" min-width="100" show-overflow-tooltip />

        <!-- ✅ 字典翻译 -->
        <el-table-column label="角色类型" prop="roleType" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getRoleTypeTag(row.roleType)">
              {{ getDictLabel('RoleType', row.roleType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="商户ID" prop="merchantId" width="100" align="center" />
        <el-table-column label="最后登录IP" prop="lastLoginIp" width="140" align="center" />
        <el-table-column label="最后登录地区" prop="lastLoginRegion" width="140" show-overflow-tooltip />

        <!-- ✅ 统一使用 $formatDateTime -->
        <el-table-column label="最后登录时间" prop="lastLoginAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.lastLoginAt) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!--  分页 -->
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

    <!-- ✏️ 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="`编辑用户 - ${editForm.account}`"
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
        <el-form-item label="用户ID" prop="id">
          <el-input v-model="editForm.id" disabled />
        </el-form-item>
        <el-form-item label="账号" prop="account">
          <el-input v-model="editForm.account" disabled />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入姓名" maxlength="50" show-word-limit clearable />
        </el-form-item>

        <!-- ✅ 字典下拉 -->
        <el-form-item label="角色类型" prop="roleType">
          <el-select v-model="editForm.roleType" placeholder="请选择角色类型" style="width: 100%">
            <el-option
              v-for="item in getDictOptions('RoleType')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="商户ID" prop="merchantId">
          <el-input-number
            v-model="editForm.merchantId"
            :min="0"
            :precision="0"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-divider content-position="left">登录信息（只读）</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最后登录IP"><el-input v-model="editForm.lastLoginIp" disabled /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最后登录地区"><el-input v-model="editForm.lastLoginRegion" disabled /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <!-- ✅ 统一使用 $formatDateTime -->
            <el-form-item label="最后登录时间">
              <el-input :value="$formatDateTime(editForm.lastLoginAt)" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="创建时间">
              <el-input :value="$formatDateTime(editForm.createAt)" disabled />
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
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'
// ❌ 已移除局部导入，统一使用模板全局属性 $formatDateTime
import { getDictOptions, getDictLabel } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  account: '',
  page: 1,
  pageSize: 10
})

//  分页参数
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const queryFormRef = ref()

// ✏️ 编辑弹窗状态
const dialogVisible = ref(false)
const editFormRef = ref()
const submitLoading = ref(false)
const editForm = reactive({
  id: null,
  account: '',
  name: '',
  roleType: null,
  merchantId: null,
  lastLoginIp: '',
  lastLoginRegion: '',
  lastLoginAt: null,
  createAt: null
})

const editRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 1, max: 50, message: '长度 1-50 个字符', trigger: 'blur' }
  ],
  roleType: [{ required: true, message: '请选择角色类型', trigger: 'change' }],
  merchantId: [{ required: true, message: '请输入商户ID', trigger: 'blur' }]
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const res = await request.post('/user/page.do', {
      account: queryParams.account,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res.data) {
      tableData.value = res.data.list || res.data.records || []
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

/** ️ 打开编辑 */
const handleEdit = (row) => {
  Object.assign(editForm, row)
  dialogVisible.value = true
  setTimeout(() => editFormRef.value?.clearValidate(), 100)
}

/** 💾 提交编辑 */
const handleSubmit = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      await request.post('/user/edit.do', {
        id: editForm.id,
        name: editForm.name,
        roleType: editForm.roleType,
        merchantId: editForm.merchantId
      })
      ElMessage.success('修改成功')
      dialogVisible.value = false
      handleQuery()
    } catch (error) {
      ElMessage.error('修改失败：' + (error.message || '未知错误'))
    } finally {
      submitLoading.value = false
    }
  })
}

/** 🚫 关闭弹窗清理 */
const handleDialogClose = () => {
  editFormRef.value?.resetFields()
  Object.assign(editForm, {
    id: null, account: '', name: '', roleType: null, merchantId: null,
    lastLoginIp: '', lastLoginRegion: '', lastLoginAt: null, createAt: null
  })
}

/** 🏷️ 角色标签颜色映射 */
const getRoleTypeTag = (roleType) => {
  const map = { 0: 'info', 1: 'success', 2: 'warning', 3: 'danger' }
  return map[roleType] || 'info'
}

onMounted(() => handleQuery())
</script>

<style scoped lang="scss">
.user-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}
.search-buttons { display: flex; gap: 10px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
:deep(.el-divider__text) { font-size: 13px; color: #606266; font-weight: 500; }
</style>
