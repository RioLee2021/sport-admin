<template>
  <div class="exp-cfg-container">
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
            <el-form-item label="周期类型" prop="periodic">
              <el-select
                v-model="queryParams.periodic"
                placeholder="请选择周期类型"
                clearable
                style="width: 100%;min-width: 100px"
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
          <span class="title">经验配置列表</span>
          <div class="header-actions">
            <el-button type="warning" :icon="Refresh" @click="handleSync">同步配置</el-button>
            <el-button type="info" :icon="Connection" @click="handleSyncI18n">同步字典</el-button>
          </div>
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

        <el-table-column label="经验类型" prop="expType" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">
              {{ getDictLabel('ExpType', row.expType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="周期类型" prop="periodic" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getPeriodicTagType(row.periodic)">
              {{ getDictLabel('Periodic', row.periodic) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="经验值" prop="expValue" width="100" align="center">
          <template #default="{ row }">
            <span class="exp-value">{{ row.expValue ?? 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="周期上限" prop="perLimit" width="120" align="center">
          <template #default="{ row }">
            {{ row.perLimit === 0 ? '无限' : row.perLimit }}
          </template>
        </el-table-column>

        <el-table-column label="获得次数" prop="perTimes" width="120" align="center">
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

        <el-table-column label="更新时间" prop="updateAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.updateAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
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

    <!-- ✏️ 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑经验配置"
      width="550px"
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
        <el-form-item label="配置ID" prop="id">
          <el-input v-model="form.id" disabled />
        </el-form-item>

        <el-form-item label="经验类型" prop="expType">
          <el-tag size="large">{{ getDictLabel('ExpType', form.expType) }}</el-tag>
        </el-form-item>

        <el-form-item label="周期类型" prop="periodic">
          <el-tag size="large">{{ getDictLabel('Periodic', form.periodic) }}</el-tag>
        </el-form-item>

        <el-divider content-position="left">可编辑参数</el-divider>

        <el-form-item label="经验值" prop="expValue">
          <el-input-number
            v-model="form.expValue"
            :min="0"
            :precision="0"
            controls-position="right"
            style="width: 100%"
            placeholder="请输入经验值"
          />
          <div class="form-tip">用户完成该行为可获得的经验值</div>
        </el-form-item>

        <el-form-item label="周期内经验上限" prop="perLimit">
          <el-input-number
            v-model="form.perLimit"
            :min="0"
            :precision="0"
            controls-position="right"
            style="width: 100%"
            placeholder="0表示无上限"
          />
          <div class="form-tip">0 = 无限次，>0 表示周期内最多获得该经验值</div>
        </el-form-item>

        <el-form-item label="周期内获得次数" prop="perTimes">
          <el-input-number
            v-model="form.perTimes"
            :min="0"
            :precision="0"
            controls-position="right"
            style="width: 100%"
            placeholder="0表示无限制"
          />
          <div class="form-tip">0 = 无限次，>0 表示周期内最多触发该次数</div>
        </el-form-item>

        <el-form-item label="启用状态" prop="disabled">
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
import { Search, Refresh, Connection } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
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

// 编辑表单数据
const form = reactive({
  id: null,
  expType: '',
  periodic: '',
  expValue: 0,
  perLimit: 0,
  perTimes: 0,
  disabled: false
})

// 表单验证规则
const rules = {
  expValue: [
    { required: true, message: '请输入经验值', trigger: 'blur' },
    { type: 'number', min: 0, message: '经验值不能为负数', trigger: 'blur' }
  ],
  perLimit: [
    { required: true, message: '请输入周期内经验上限', trigger: 'blur' },
    { type: 'number', min: 0, message: '值不能为负数', trigger: 'blur' }
  ],
  perTimes: [
    { required: true, message: '请输入周期内获得次数', trigger: 'blur' },
    { type: 'number', min: 0, message: '值不能为负数', trigger: 'blur' }
  ]
}

/** 🎨 周期类型标签样式 */
const getPeriodicTagType = (periodic) => {
  const map = {
    '0': 'info',    // 无周期
    '1': 'success', // 每日
    '2': 'warning', // 每周
    '3': 'primary', // 每月
    '4': 'danger'   // 自定义
  }
  return map[periodic] || 'info'
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      periodic: queryParams.periodic || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/expCfg/page.do', payload)
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

/** ✏️ 编辑配置 */
const handleEdit = (row) => {
  Object.assign(form, { ...row })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

/** 💾 提交编辑 */
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      // ✅ 严格按接口定义提交字段
      const payload = {
        id: form.id,
        expValue: form.expValue,
        perLimit: form.perLimit,
        perTimes: form.perTimes
      }
      await request.post('/expCfg/edit.do', payload)
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

/** 🔄 同步配置 */
const handleSync = async () => {
  try {
    await ElMessageBox.confirm('确定要同步经验配置吗？此操作将更新系统默认配置。', '提示', {
      confirmButtonText: '确认同步',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await request.post('/expCfg/sync.do', {})
    const data = res.data || {}
    ElMessage.success(`同步完成！新增：${data.addCount || 0}，更新：${data.syncCount || 0}，总计：${data.totalCount || 0}`)
    handleQuery()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('同步失败：' + (error.message || '未知错误'))
    }
  }
}

/** 🌐 同步中英文字典 */
const handleSyncI18n = async () => {
  try {
    await ElMessageBox.confirm('确定要同步经验配置的中英文字典吗？', '提示', {
      confirmButtonText: '确认同步',
      cancelButtonText: '取消',
      type: 'info'
    })
    const res = await request.post('/expCfg/syncI18n.do', {})
    const data = res.data || {}
    ElMessage.success(`字典同步完成！新增：${data.addCount || 0}，更新：${data.syncCount || 0}`)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('同步失败：' + (error.message || '未知错误'))
    }
  }
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.exp-cfg-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header {
    display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
    .header-actions { display: flex; gap: 10px; }
  }
}
.search-buttons { display: flex; gap: 10px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
.form-tip { font-size: 12px; color: #909399; margin-top: 4px; line-height: 1.5; }
.exp-value { font-weight: 600; color: #E6A23C; }
:deep(.el-divider__text) { font-size: 13px; color: #606266; font-weight: 500; }
</style>
