<template>
  <div class="level-up-container">
    <!-- 🔍 查询表单 (接口无查询条件，仅保留分页控制) -->
    <el-card class="search-card" shadow="hover">
      <el-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        label-width="80px"
        @submit.prevent
      >
        <el-row :gutter="20">
          <!-- 接口无查询条件，预留扩展位 -->
          <el-col :span="6">
            <el-form-item label="等级" prop="level">
              <el-input-number
                v-model="queryParams.level"
                :min="1"
                :max="100"
                controls-position="right"
                placeholder="请输入等级"
                clearable
                style="width: 100%; min-width: 120px"
              />
            </el-form-item>
          </el-col>

          <el-col :span="18">
            <div class="search-buttons">
              <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
              <el-button type="warning" :icon="CircleCheck" @click="handleCheckConfig">检查配置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 📋 表格区域 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">升级配置列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增配置</el-button>
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

        <el-table-column label="等级" prop="level" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">{{ row.level }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="下一等级" prop="nextLevel" width="100" align="center">
          <template #default="{ row }">
            {{ row.nextLevel === -1 ? '顶级' : row.nextLevel }}
          </template>
        </el-table-column>

        <el-table-column label="升级经验" prop="upgradeExp" width="100" align="center">
          <template #default="{ row }">
            <span class="exp-text">{{ row.upgradeExp === -1 ? '∞' : row.upgradeExp }}</span>
          </template>
        </el-table-column>

        <el-table-column label="奖励金币" prop="coinsAward" width="100" align="center">
          <template #default="{ row }">
            <span class="coin-text">{{ row.coinsAward ?? 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="额外经验上限" prop="extExpLimit" width="120" align="center">
          <template #default="{ row }">
            {{ row.extExpLimit === 0 ? '无限' : row.extExpLimit }}
          </template>
        </el-table-column>

        <el-table-column label="额外礼物次数" prop="extGiftTimes" width="120" align="center">
          <template #default="{ row }">
            {{ row.extGiftTimes === 0 ? '无限' : row.extGiftTimes }}
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

    <!-- ✏️ 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑升级配置' : '新增升级配置'"
      width="580px"
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
        <!-- 编辑时显示 ID -->
        <el-form-item label="配置ID" prop="id" v-if="isEdit">
          <el-input v-model="form.id" disabled />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="等级" prop="level">
              <el-input-number
                v-model="form.level"
                :min="1"
                :max="100"
                :precision="0"
                controls-position="right"
                style="width: 100%"
                :disabled="isEdit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="下一等级" prop="nextLevel">
              <el-input-number
                v-model="form.nextLevel"
                :min="-1"
                :max="100"
                :precision="0"
                controls-position="right"
                style="width: 100%"
                placeholder="-1 表示顶级"
                disabled
              />
              <div class="form-tip">系统自动计算，-1=顶级</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">升级条件</el-divider>

        <el-form-item label="升级所需经验" prop="upgradeExp">
          <el-input-number
            v-model="form.upgradeExp"
            :min="-1"
            :precision="0"
            controls-position="right"
            style="width: 100%"
            placeholder="-1 表示无需经验"
          />
          <div class="form-tip">-1 = 无需经验直接升级</div>
        </el-form-item>

        <el-divider content-position="left">升级奖励</el-divider>

        <el-form-item label="奖励金币" prop="coinsAward">
          <el-input-number
            v-model="form.coinsAward"
            :min="0"
            :precision="0"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="额外经验上限" prop="extExpLimit">
              <el-input-number
                v-model="form.extExpLimit"
                :min="0"
                :precision="0"
                controls-position="right"
                style="width: 100%"
                placeholder="0=无限"
              />
              <div class="form-tip">0 = 无限，>0 表示上限</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="额外礼物次数" prop="extGiftTimes">
              <el-input-number
                v-model="form.extGiftTimes"
                :min="0"
                :precision="0"
                controls-position="right"
                style="width: 100%"
                placeholder="0=无限"
              />
              <div class="form-tip">0 = 无限，>0 表示次数上限</div>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, CircleCheck } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数 (接口仅支持分页)
const queryParams = reactive({
  level: undefined, // 预留扩展
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
  level: 1,
  nextLevel: 2,
  upgradeExp: 100,
  coinsAward: 0,
  extExpLimit: 0,
  extGiftTimes: 0
})

// 表单验证规则 (严格对照接口 required 字段)
const rules = {
  level: [
    { required: true, message: '请输入等级', trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: '等级范围 1-100', trigger: 'blur' }
  ],
  upgradeExp: [
    { required: true, message: '请输入升级经验', trigger: 'blur' },
    { type: 'number', min: -1, message: '经验值不能小于 -1', trigger: 'blur' }
  ],
  coinsAward: [
    { required: true, message: '请输入奖励金币', trigger: 'blur' },
    { type: 'number', min: 0, message: '金币不能为负数', trigger: 'blur' }
  ],
  extExpLimit: [
    { required: true, message: '请输入额外经验上限', trigger: 'blur' },
    { type: 'number', min: 0, message: '值不能为负数', trigger: 'blur' }
  ],
  extGiftTimes: [
    { required: true, message: '请输入额外礼物次数', trigger: 'blur' },
    { type: 'number', min: 0, message: '值不能为负数', trigger: 'blur' }
  ]
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    // 接口分页请求参数仅含 page/pageSize
    const payload = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/levelUp/page.do', payload)
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

/** ➕ 新增配置 */
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null, level: 1, nextLevel: 2, upgradeExp: 100,
    coinsAward: 0, extExpLimit: 0, extGiftTimes: 0
  })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

/** ✏️ 编辑配置 */
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
          coinsAward: form.coinsAward,
          extExpLimit: form.extExpLimit,
          extGiftTimes: form.extGiftTimes,
          upgradeExp: form.upgradeExp
        }
        : {
          level: form.level,
          coinsAward: form.coinsAward,
          extExpLimit: form.extExpLimit,
          extGiftTimes: form.extGiftTimes,
          upgradeExp: form.upgradeExp
        }

      const api = isEdit.value ? '/levelUp/edit.do' : '/levelUp/add.do'
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

/** 🗑️ 删除配置 */
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除等级 ${row.level} 的升级配置吗？`, '警告', { type: 'warning' })
    .then(async () => {
      await request.post('/levelUp/delete.do', { id: row.id })
      ElMessage.success('删除成功')
      handleQuery()
    }).catch(() => {})
}

/** 🔍 检查配置合法性 */
const handleCheckConfig = async () => {
  try {
    const res = await request.post('/levelUp/checkLevelConfig.do', {})
    ElMessage.success('配置检查通过：' + (res.msg || '所有配置合法'))
  } catch (error) {
    ElMessage.error('配置检查失败：' + (error.message || '存在非法配置'))
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
.level-up-container { padding: 20px; }

.search-card {
  margin-bottom: 20px;
  :deep(.el-card__body) { padding: 20px; }
}

.search-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}

.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
.form-tip { font-size: 12px; color: #909399; margin-top: 4px; line-height: 1.5; }

.exp-text { font-weight: 600; color: #E6A23C; }
.coin-text { font-weight: 600; color: #F56C6C; }

/* 🎯 下拉/输入框最小宽度 */
:deep(.el-input-number),
:deep(.el-select) {
  min-width: 120px;
}
</style>
