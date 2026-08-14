<template>
  <div class="global-push-container">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline label-width="100px">
        <el-form-item label="推送编号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入" clearable style="width: 200px;" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="推送模式">
          <el-select v-model="searchForm.pushMode" placeholder="请选择" clearable style="width: 200px;">
            <el-option v-for="item in pushModeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标设备">
          <el-select v-model="searchForm.targetDevice" placeholder="请选择" clearable style="width: 200px;">
            <el-option v-for="item in targetDeviceOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 200px;">
            <el-option v-for="item in execStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
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
          <span>全局推送列表</span>
          <el-button type="primary" :icon="Plus" @click="openAddDialog">新增推送</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="orderNo" label="推送编号" width="150" show-overflow-tooltip />
        <el-table-column prop="title" label="标题" min-width="120" show-overflow-tooltip />
        <el-table-column prop="content" label="内容" min-width="150" show-overflow-tooltip />

        <el-table-column prop="pushMode" label="推送模式" width="100" align="center">
          <template #default="{ row }">
            <el-tag>{{ getDictLabel('PushMode', row.pushMode) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="targetDevice" label="目标设备" width="100" align="center">
          <template #default="{ row }">
            <el-tag>{{ getDictLabel('TargetDevice', row.targetDevice) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="执行状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getDictLabel('ExecStatus', row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="execTimes" label="执行次数" width="90" align="center" />

        <el-table-column label="安卓数据" width="120" align="center">
          <template #default="{ row }">
            <div>到达: {{ row.androidArrivedCnt || 0 }}</div>
            <div>点击: {{ row.androidClickCnt || 0 }}</div>
          </template>
        </el-table-column>

        <el-table-column label="PWA数据" width="120" align="center">
          <template #default="{ row }">
            <div>总数: {{ row.pwaTotalCnt || 0 }}</div>
            <div>成功: {{ row.pwaSucceedCnt || 0 }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="relatedHwdNo" label="关联安卓NO" width="130" show-overflow-tooltip />
        <el-table-column prop="relatedPwaId" label="关联PWA ID" width="110" align="center" />

        <el-table-column prop="latestExecTime" label="最近执行" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.latestExecTime) }}
          </template>
        </el-table-column>

        <el-table-column prop="createAt" label="创建时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createAt) }}
          </template>
        </el-table-column>

        <el-table-column prop="createBy" label="创建人" width="100" align="center" />

        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status !== 0" type="warning" link @click="handlePause(row)">暂停</el-button>
            <el-button v-if="row.status === 0" type="success" link @click="handleContinued(row)">继续</el-button>
            <el-button v-if="row.status === 0 || row.status > 2" type="primary" link @click="handleStart(row)">重新执行</el-button>
            <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="900px" destroy-on-close>
      <el-form :model="form" label-width="120px" :rules="rules" ref="formRef">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入标题" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="3" placeholder="请输入推送内容" />
        </el-form-item>

        <el-form-item label="点击动作" prop="action">
          <el-input v-model="form.action" placeholder="请输入点击后的动作/路由" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="推送模式" prop="pushMode">
              <el-select v-model="form.pushMode" placeholder="请选择" style="width: 100%;">
                <el-option v-for="item in pushModeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标设备" prop="targetDevice">
              <el-select v-model="form.targetDevice" placeholder="请选择" style="width: 100%;">
                <el-option v-for="item in targetDeviceOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 推送模式参数配置 -->
        <el-form-item label="推送模式参数">
          <div class="param-container">
            <div v-for="(field, index) in paramFields" :key="index" class="param-field">
              <el-card shadow="never" class="field-card">
                <el-row :gutter="15" align="middle">
                  <el-col :span="7">
                    <el-input v-model="field.key" placeholder="字段名 (Key)" size="default" />
                  </el-col>
                  <el-col :span="6">
                    <el-select v-model="field.type" placeholder="数据类型" size="default" style="width: 100%;">
                      <el-option label="字符串" value="String" />
                      <el-option label="数字" value="Number" />
                      <el-option label="布尔" value="Boolean" />
                      <el-option label="日期时间" value="DateTime" />
                    </el-select>
                  </el-col>
                  <el-col :span="8">
                    <el-input v-if="field.type === 'String'" v-model="field.value" placeholder="字段值 (Value)" size="default" />
                    <el-input-number v-else-if="field.type === 'Number'" v-model="field.value" placeholder="字段值" size="default" style="width: 100%;" :precision="0" />
                    <el-select v-else-if="field.type === 'Boolean'" v-model="field.value" placeholder="请选择" size="default" style="width: 100%;">
                      <el-option label="true" :value="true" />
                      <el-option label="false" :value="false" />
                    </el-select>
                    <el-date-picker
                      v-else-if="field.type === 'DateTime'"
                      v-model="field.value"
                      type="datetime"
                      placeholder="选择日期时间"
                      size="default"
                      style="width: 100%;"
                      format="YYYY-MM-DD HH:mm:ss"
                      value-format="YYYY-MM-DD HH:mm:ss"
                    />
                  </el-col>
                  <el-col :span="3">
                    <el-button type="danger" size="default" :icon="Delete" @click="removeField(index)">删除</el-button>
                  </el-col>
                </el-row>
              </el-card>
            </div>

            <el-button type="primary" :icon="Plus" @click="addField" class="add-field-btn">
              添加新字段
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Delete } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { formatDateTime } from '@/utils/format'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// ================= 公共字典选项 =================
const pushModeOptions = getDictOptions('PushMode')
const targetDeviceOptions = getDictOptions('TargetDevice')
const execStatusOptions = getDictOptions('ExecStatus')

// ================= 列表与搜索状态 =================
const loading = ref(false)
const tableData = ref([])
const searchForm = reactive({
  orderNo: '',
  pushMode: '',
  targetDevice: '',
  status: ''
})
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

// ================= 弹窗状态 =================
const dialogVisible = ref(false)
const dialogTitle = computed(() => form.id ? '编辑推送' : '新增推送')
const submitLoading = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  title: '',
  content: '',
  action: '',
  pushMode: '',
  targetDevice: '',
  modeParamJson: {}
})

// ================= 推送模式参数字段 =================
const paramFields = ref([])

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  action: [{ required: true, message: '请输入点击动作', trigger: 'blur' }],
  pushMode: [{ required: true, message: '请选择推送模式', trigger: 'change' }],
  targetDevice: [{ required: true, message: '请选择目标设备', trigger: 'change' }]
}

// ================= 辅助函数 =================
const getStatusType = (status) => {
  const types = {
    '0': 'info',
    '1': 'warning',
    '2': 'primary',
    '3': 'success',
    '4': 'danger'
  }
  return types[status] || 'info'
}

// ================= 参数字段操作 =================
const addField = () => {
  paramFields.value.push({ key: '', type: 'String', value: '' })
}

const removeField = (index) => {
  paramFields.value.splice(index, 1)
}

// 将参数字段转换为JSON对象 (注意：直接返回对象，不 stringify)
const convertParamsToJson = () => {
  const result = {}
  paramFields.value.forEach(field => {
    if (field.key) {
      let value = field.value
      if (field.type === 'Number') {
        value = Number(value) || 0
      } else if (field.type === 'Boolean') {
        value = Boolean(value)
      }
      result[field.key] = value
    }
  })
  return result
}

// 将JSON对象转换为参数字段
const convertJsonToParams = (jsonObj) => {
  paramFields.value = []
  if (!jsonObj) return

  Object.entries(jsonObj).forEach(([key, value]) => {
    let type = 'String'
    let fieldValue = value

    if (typeof value === 'number') {
      type = 'Number'
    } else if (typeof value === 'boolean') {
      type = 'Boolean'
    } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
      type = 'DateTime'
    }

    paramFields.value.push({ key, type, value: fieldValue })
  })
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

    const res = await request.post('/globalPush/page.do', params)
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
  Object.keys(searchForm).forEach(key => { searchForm[key] = '' })
  handleSearch()
}
const handleSizeChange = (val) => { pagination.pageSize = val; fetchData() }
const handleCurrentChange = (val) => { pagination.page = val; fetchData() }

// ================= 操作功能 =================
const openAddDialog = () => {
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  resetForm()
  form.id = row.id
  form.title = row.title
  form.content = row.content
  form.action = row.action
  form.pushMode = row.pushMode
  form.targetDevice = row.targetDevice

  let modeParamObj = {}
  try {
    modeParamObj = typeof row.modeParamJson === 'string'
      ? JSON.parse(row.modeParamJson)
      : row.modeParamJson
  } catch (e) {
    console.error('解析 modeParamJson 失败', e)
  }

  convertJsonToParams(modeParamObj)
  dialogVisible.value = true
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    title: '',
    content: '',
    action: '',
    pushMode: '',
    targetDevice: '',
    modeParamJson: {}
  })
  paramFields.value = []
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate()

  submitLoading.value = true
  try {
    // 直接传递对象，符合 Swagger 中 modeParamJson 为 object 的定义
    const modeParamJson = convertParamsToJson()

    const submitData = {
      title: form.title,
      content: form.content,
      action: form.action,
      pushMode: form.pushMode,
      targetDevice: form.targetDevice,
      modeParamJson: JSON.stringify(modeParamJson)
    }

    if (form.id) {
      submitData.id = form.id
      await request.post('/globalPush/edit.do', submitData)
    } else {
      await request.post('/globalPush/add.do', submitData)
    }

    ElMessage.success(form.id ? '编辑成功' : '新增成功')
    dialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

const handlePause = async (row) => {
  try {
    await ElMessageBox.confirm('确定暂停该推送吗？', '提示', { type: 'warning' })
    await request.post('/globalPush/pause.do', { id: row.id })
    ElMessage.success('暂停成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handleContinued = async (row) => {
  try {
    await ElMessageBox.confirm('确定继续执行该推送吗？', '提示', { type: 'warning' })
    await request.post('/globalPush/continued.do', { id: row.id })
    ElMessage.success('继续执行成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handleStart = async (row) => {
  try {
    await ElMessageBox.confirm('确定重新执行该推送吗？', '提示', { type: 'warning' })
    await request.post('/globalPush/start.do', { id: row.id })
    ElMessage.success('重新执行成功')
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
.global-push-container {
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

  .param-container {
    width: 100%;

    .param-field {
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .field-card {
        :deep(.el-card__body) {
          padding: 16px;
        }
      }
    }

    .add-field-btn {
      width: 100%;
      margin-top: 12px;
      height: 40px;
    }
  }
}
</style>
