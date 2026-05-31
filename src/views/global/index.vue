<template>
  <div class="global-settings-container">
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
            <el-form-item label="设置KEY" prop="settingKey">
              <el-input v-model="queryParams.settingKey" placeholder="请输入设置KEY" clearable @keyup.enter="handleQuery" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="设置类型" prop="settingsType">
              <el-select v-model="queryParams.settingsType" placeholder="请选择" clearable style="width: 100%; min-width: 120px">
                <el-option v-for="item in getDictOptions('GlobalSettingsType')" :key="item.value" :label="item.label" :value="item.value" />
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
          <span class="title">全局设置列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增设置</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="设置KEY" prop="settingsKey" width="150" align="center" show-overflow-tooltip />
        <el-table-column label="设置名称" prop="settingsName" width="150" align="center" show-overflow-tooltip />
        <el-table-column label="设置类型" prop="settingsType" width="100" align="center">
          <template #default="{ row }">{{ getDictLabel('GlobalSettingsType', row.settingsType) }}</template>
        </el-table-column>
        <el-table-column label="状态" prop="disabled" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">{{ row.disabled ? '禁用' : '启用' }}</el-tag>
          </template>
        </el-table-column>
        <!-- ✅ 修改：直接显示未转换的原始设置数据 -->
        <el-table-column label="设置数据(原始JSON)" prop="settingsData" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="json-text">{{ row.settingsData }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

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
      :title="isEdit ? '编辑设置' : '新增设置'"
      width="650px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
        <el-form-item label="设置KEY" prop="settingKey">
          <el-input v-model="form.settingKey" :disabled="isEdit" placeholder="请输入设置KEY (如: app.version)" clearable />
        </el-form-item>
        <el-form-item label="设置名称" prop="settingName">
          <el-input v-model="form.settingName" placeholder="请输入设置名称" clearable />
        </el-form-item>
        <el-form-item label="设置类型" prop="settingsType">
          <el-select v-model="form.settingsType" :disabled="isEdit" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in getDictOptions('GlobalSettingsType')" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Java类型" prop="className">
          <el-input v-model="form.className" :disabled="isEdit" placeholder="请输入JAVA类型 (如: java.lang.String)" clearable />
        </el-form-item>

        <!-- 🔑 数据结构切换 -->
        <el-form-item label="数据结构" prop="dataType">
          <el-radio-group v-model="form.dataType">
            <el-radio label="object">对象 (键值对)</el-radio>
            <el-radio label="array">数组 (列表)</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 🔑 对象模式：垂直布局，每行一个字段 -->
        <div v-if="form.dataType === 'object'" class="dynamic-block">
          <div v-for="(item, index) in form.objectData" :key="index" class="dynamic-item">
            <div class="field-line">
              <span class="field-label">字段名 (Key)</span>
              <el-input v-model="item.key" placeholder="请输入字段名" clearable />
            </div>
            <div class="field-line">
              <span class="field-label">数据类型</span>
              <el-select v-model="item.type" style="width: 100%">
                <el-option label="String" value="String" />
                <el-option label="Number" value="Number" />
                <el-option label="Boolean" value="Boolean" />
              </el-select>
            </div>
            <div class="field-line">
              <span class="field-label">字段值 (Value)</span>
              <el-input v-if="item.type === 'String'" v-model="item.value" placeholder="请输入字段值" clearable />
              <el-input-number v-else-if="item.type === 'Number'" v-model="item.value" :controls="false" placeholder="请输入数字值" style="width: 100%" />
              <el-switch v-else v-model="item.value" active-value="true" inactive-value="false" />
            </div>
            <div class="field-line action-line">
              <el-button type="danger" :icon="Delete" link @click="removeObjectItem(index)">删除此字段</el-button>
            </div>
          </div>
          <el-button type="primary" :icon="Plus" class="add-btn" @click="addObjectItem">添加新字段</el-button>
        </div>

        <!-- 🔑 数组模式：垂直布局，每行一个字段 -->
        <div v-if="form.dataType === 'array'" class="dynamic-block">
          <div v-for="(item, index) in form.arrayData" :key="index" class="dynamic-item">
            <div class="field-line">
              <span class="field-label">元素类型</span>
              <el-select v-model="item.type" style="width: 100%">
                <el-option label="String" value="String" />
                <el-option label="Number" value="Number" />
                <el-option label="Boolean" value="Boolean" />
              </el-select>
            </div>
            <div class="field-line">
              <span class="field-label">元素值 (Value)</span>
              <el-input v-if="item.type === 'String'" v-model="item.value" placeholder="请输入元素值" clearable />
              <el-input-number v-else-if="item.type === 'Number'" v-model="item.value" :controls="false" placeholder="请输入数字值" style="width: 100%" />
              <el-switch v-else v-model="item.value" active-value="true" inactive-value="false" />
            </div>
            <div class="field-line action-line">
              <el-button type="danger" :icon="Delete" link @click="removeArrayItem(index)">删除此元素</el-button>
            </div>
          </div>
          <el-button type="primary" :icon="Plus" class="add-btn" @click="addArrayItem">添加新元素</el-button>
        </div>
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
import { Search, Refresh, Plus, Delete } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({ settingKey: '', settingsType: '', page: 1, pageSize: 10 })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const queryFormRef = ref()

// ✏️ 对话框状态
const dialogVisible = ref(false)
const formRef = ref()
const submitLoading = ref(false)
const isEdit = ref(false)

// 🔑 表单数据（扩展类型字段）
const form = reactive({
  id: null,
  settingKey: '',
  settingName: '',
  settingsType: '',
  className: '',
  dataType: 'object',
  objectData: [{ key: '', type: 'String', value: '' }],
  arrayData: [{ type: 'String', value: '' }]
})

// 校验规则
const rules = computed(() => ({
  settingKey: isEdit.value ? [] : [{ required: true, message: '请输入设置KEY', trigger: 'blur' }],
  settingName: [{ required: true, message: '请输入设置名称', trigger: 'blur' }],
  settingsType: isEdit.value ? [] : [{ required: true, message: '请选择设置类型', trigger: 'change' }],
  className: isEdit.value ? [] : [{ required: true, message: '请输入Java类型', trigger: 'blur' }]
}))

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const res = await request.post('/global/page.do', {
      settingKey: queryParams.settingKey || undefined,
      settingsType: queryParams.settingsType || undefined,
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

const handleReset = () => { queryFormRef.value?.resetFields(); pagination.page = 1; handleQuery() }

// 🛠️ 动态行操作
const addObjectItem = () => form.objectData.push({ key: '', type: 'String', value: '' })
const removeObjectItem = (idx) => form.objectData.splice(idx, 1)
const addArrayItem = () => form.arrayData.push({ type: 'String', value: '' })
const removeArrayItem = (idx) => form.arrayData.splice(idx, 1)

// 🔄 类型转换辅助
const convertValue = (type, raw) => {
  if (type === 'Number') return raw === '' || raw == null ? 0 : Number(raw)
  if (type === 'Boolean') return raw === 'true' || raw === true
  return String(raw ?? '')
}

const detectType = (val) => {
  if (typeof val === 'number') return 'Number'
  if (typeof val === 'boolean') return 'Boolean'
  return 'String'
}

// 📦 提交前序列化 JSON
const buildSettingData = () => {
  if (form.dataType === 'object') {
    const obj = {}
    form.objectData.forEach(item => {
      if (item.key?.trim()) obj[item.key.trim()] = convertValue(item.type, item.value)
    })
    return JSON.stringify(obj)
  }
  return JSON.stringify(form.arrayData.map(item => convertValue(item.type, item.value)))
}

// 📥 编辑时反序列化
const parseSettingData = (jsonStr) => {
  try {
    const parsed = JSON.parse(jsonStr || 'null')
    if (Array.isArray(parsed)) {
      form.dataType = 'array'
      form.arrayData = parsed.length ? parsed.map(v => ({ type: detectType(v), value: String(v) })) : [{ type: 'String', value: '' }]
      form.objectData = []
    } else if (parsed && typeof parsed === 'object') {
      form.dataType = 'object'
      form.objectData = Object.keys(parsed).length
        ? Object.entries(parsed).map(([k, v]) => ({ key: k, type: detectType(v), value: String(v) }))
        : [{ key: '', type: 'String', value: '' }]
      form.arrayData = []
    } else {
      form.dataType = 'object'
      form.objectData = [{ key: 'value', type: detectType(parsed), value: String(parsed ?? '') }]
      form.arrayData = []
    }
  } catch {
    form.dataType = 'object'
    form.objectData = [{ key: '', type: 'String', value: '' }]
    form.arrayData = []
  }
}

// ➕ 新增
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, { id: null, settingKey: '', settingName: '', settingsType: '', className: '', dataType: 'object', objectData: [{ key: '', type: 'String', value: '' }], arrayData: [{ type: 'String', value: '' }] })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

// ✏️ 编辑
const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, { id: row.id, settingKey: row.settingsKey, settingName: row.settingsName, settingsType: row.settingsType, className: row.className })
  parseSettingData(row.settingsData)
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
      const api = isEdit.value ? '/global/edit.do' : '/global/add.do'
      const payload = isEdit.value
        ? { id: form.id, settingName: form.settingName, settingData: buildSettingData() }
        : { settingKey: form.settingKey, settingName: form.settingName, className: form.className, settingsType: form.settingsType, settingData: buildSettingData() }

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

// 🗑️ 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除设置 "${row.settingsKey}" 吗？此操作不可恢复！`, '警告', { type: 'warning' })
    .then(async () => {
      await request.post('/global/delete.do', { id: row.id })
      ElMessage.success('删除成功'); handleQuery()
    }).catch(() => {})
}

const handleDialogClose = () => { formRef.value?.resetFields() }

onMounted(() => handleQuery())
</script>

<style scoped lang="scss">
.global-settings-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
.json-text { font-family: 'Courier New', monospace; font-size: 12px; color: #409EFF; }

/* 🔑 垂直动态表单样式 */
.dynamic-block { width: 100%; padding-left: 4px; }
.dynamic-item {
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  background: #fafafa;
  transition: all 0.2s;
  &:hover { border-color: #409EFF; background: #f5f9ff; }
}
.field-line {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  &:last-child { margin-bottom: 0; }
  .field-label {
    width: 70px;
    font-size: 13px;
    color: #606266;
    flex-shrink: 0;
  }
  :deep(.el-input), :deep(.el-select) { flex: 1; }
}
.action-line { justify-content: flex-end; margin-top: 4px; }
.add-btn { width: 100%; margin-top: 8px; border-style: dashed; }
</style>
