<template>
  <div class="activity-rule-container">
    <!--  查询表单 -->
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
            <el-form-item label="活动编码" prop="activityCode">
              <el-input
                v-model="queryParams.activityCode"
                placeholder="请输入活动编码"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="周期类型" prop="periodic">
              <el-select
                v-model="queryParams.periodic"
                placeholder="请选择周期类型"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option
                  v-for="item in getDictOptions('Periodic')"
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
          <span class="title">活动规则列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增规则</el-button>
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

        <el-table-column label="活动编码" prop="activityCode" width="120" show-overflow-tooltip />

        <el-table-column label="活动名称" prop="activityName" min-width="150" show-overflow-tooltip />

        <el-table-column label="周期类型" prop="periodic" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ getDictLabel('Periodic', row.periodic) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="奖励金币" prop="activityCoins" width="100" align="center">
          <template #default="{ row }">
            {{ row.activityCoins === 0 ? '不固定' : row.activityCoins }}
          </template>
        </el-table-column>

        <el-table-column label="金币上限" prop="perLimit" width="100" align="center">
          <template #default="{ row }">
            {{ row.perLimit === 0 ? '无限' : row.perLimit }}
          </template>
        </el-table-column>

        <el-table-column label="获得次数" prop="perTimes" width="100" align="center">
          <template #default="{ row }">
            {{ row.perTimes === 0 ? '无限' : row.perTimes }}
          </template>
        </el-table-column>

        <el-table-column label="状态" prop="disabled" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="center" fixed="right">
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
      :title="isEdit ? '编辑规则' : '新增规则'"
      width="650px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="130px"
        label-position="right"
      >
        <!-- 新增专属字段 -->
        <el-form-item label="活动编码" prop="activityCode" v-if="!isEdit">
          <el-input
            v-model="form.activityCode"
            placeholder="请输入活动编码"
            maxlength="50"
            clearable
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="活动名称" prop="activityName">
              <el-input
                v-model="form.activityName"
                placeholder="请输入活动名称"
                maxlength="100"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="周期类型" prop="periodic">
              <el-select
                v-model="form.periodic"
                placeholder="请选择周期类型"
                style="width: 100%; min-width: 120px"
                :disabled="isEdit"
              >
                <el-option
                  v-for="item in getDictOptions('Periodic')"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="奖励金币" prop="activityCoins">
          <el-input-number
            v-model="form.activityCoins"
            :min="0"
            :precision="0"
            controls-position="right"
            style="width: 100%"
            placeholder="0表示不固定"
          />
          <div class="form-tip">0 = 不固定，>0 表示固定奖励金币数</div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="金币上限" prop="perLimit">
              <el-input-number
                v-model="form.perLimit"
                :min="0"
                :precision="0"
                controls-position="right"
                style="width: 100%"
                placeholder="0表示无限"
              />
              <div class="form-tip">0 = 无限</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="获得次数" prop="perTimes">
              <el-input-number
                v-model="form.perTimes"
                :min="0"
                :precision="0"
                controls-position="right"
                style="width: 100%"
                placeholder="0表示无限次"
              />
              <div class="form-tip">0 = 无限次</div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 编辑时显示状态 -->
        <el-form-item label="启用状态" prop="disabled" v-if="isEdit">
          <el-switch
            v-model="form.disabled"
            :active-value="false"
            :inactive-value="true"
            active-text="启用"
            inactive-text="禁用"
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
import { getDictOptions, getDictLabel } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  activityCode: '',
  periodic: '',
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

// ✏️ 对话框状态
const dialogVisible = ref(false)
const formRef = ref()
const submitLoading = ref(false)
const isEdit = ref(false)

// 表单数据
const form = reactive({
  id: null,
  activityCode: '',
  activityName: '',
  periodic: '',
  activityCoins: 0,
  perLimit: 0,
  perTimes: 0,
  disabled: false
})

// 表单验证规则
const rules = {
  activityCode: [
    { required: true, message: '请输入活动编码', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  activityName: [
    { required: true, message: '请输入活动名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  periodic: [
    { required: true, message: '请选择周期类型', trigger: 'change' }
  ],
  activityCoins: [
    { required: true, message: '请输入奖励金币', trigger: 'blur' },
    { type: 'number', min: 0, message: '值不能为负数', trigger: 'blur' }
  ],
  perLimit: [
    { required: true, message: '请输入经验上限', trigger: 'blur' },
    { type: 'number', min: 0, message: '值不能为负数', trigger: 'blur' }
  ],
  perTimes: [
    { required: true, message: '请输入获得次数', trigger: 'blur' },
    { type: 'number', min: 0, message: '值不能为负数', trigger: 'blur' }
  ]
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      activityCode: queryParams.activityCode || undefined,
      periodic: queryParams.periodic || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/activityRule/page.do', payload)
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

/** ➕ 新增规则 */
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null, activityCode: '', activityName: '', periodic: '',
    activityCoins: 0, perLimit: 0, perTimes: 0, disabled: false
  })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

/** ✏️ 编辑规则 */
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
      // ✅ 严格按接口定义提交字段
      const payload = isEdit.value
        ? {
          id: form.id,
          activityName: form.activityName,
          periodic: form.periodic,
          activityCoins: form.activityCoins,
          perLimit: form.perLimit,
          perTimes: form.perTimes
        }
        : {
          activityCode: form.activityCode,
          activityName: form.activityName,
          periodic: form.periodic,
          activityCoins: form.activityCoins,
          perLimit: form.perLimit,
          perTimes: form.perTimes
        }

      const api = isEdit.value ? '/activityRule/edit.do' : '/activityRule/add.do'
      await request.post(api, payload)
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

/** 🗑️ 删除规则 */
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除活动"${row.activityName}"的规则吗？`, '警告', { type: 'warning' })
    .then(async () => {
      await request.post('/activityRule/delete.do', { id: row.id })
      ElMessage.success('删除成功')
      handleQuery()
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
.activity-rule-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
.form-tip { font-size: 12px; color: #909399; margin-top: 4px; line-height: 1.5; }
</style>
