<template>
  <div class="match-schedule-container">
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
            <el-form-item label="排除联赛" prop="excludeLeagueCode">
              <el-select
                v-model="queryParams.excludeLeagueCode"
                placeholder="请选择联赛"
                clearable
                style="width: 100%; min-width: 140px"
              >
                <el-option
                  v-for="item in leagueOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="EXP 标识" prop="expFlag">
              <el-select
                v-model="queryParams.expFlag"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="金币标识" prop="winFlag">
              <el-select
                v-model="queryParams.winFlag"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="小时" prop="hour">
              <el-select
                v-model="queryParams.hour"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 100px"
              >
                <el-option
                  v-for="h in 24"
                  :key="h - 1"
                  :label="`${h - 1}`"
                  :value="h - 1"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="分钟" prop="min">
              <el-select
                v-model="queryParams.min"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 100px"
              >
                <el-option label="0" :value="0" />
                <el-option label="30" :value="30" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
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
          <span class="title">比赛安排列表</span>
          <el-button type="warning" :icon="Refresh" @click="handleInit">初始化</el-button>
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
        <el-table-column label="小时" prop="hour" width="80" align="center" />
        <el-table-column label="分钟" prop="min" width="80" align="center" />

        <el-table-column label="EXP 标识" prop="expFlag" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.expFlag ? 'success' : 'info'" size="small">
              {{ row.expFlag ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="金币标识" prop="winFlag" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.winFlag ? 'warning' : 'info'" size="small">
              {{ row.winFlag ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="当前 EXP" prop="currExpCnt" width="100" align="center">
          <template #default="{ row }">
            <span :class="{ 'num-zero': row.currExpCnt === 0, 'num-nonzero': row.currExpCnt !== 0 }">
              {{ row.currExpCnt ?? 0 }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="当前 WIN" prop="currWinCnt" width="100" align="center">
          <template #default="{ row }">
            <span :class="{ 'num-zero': row.currWinCnt === 0, 'num-nonzero': row.currWinCnt !== 0 }">
              {{ row.currWinCnt ?? 0 }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="最大场次" prop="limitCnt" width="100" align="center">
          <template #default="{ row }">
            <span :class="{ 'num-zero': row.limitCnt === 0, 'num-nonzero': row.limitCnt !== 0 }">
              {{ row.limitCnt === 0 ? '无限' : row.limitCnt }}
            </span>
          </template>
        </el-table-column>

        <!-- ✅ 排除联赛：显示数量，点击弹窗查看 -->
        <el-table-column label="排除联赛" width="120" align="center">
          <template #default="{ row }">
            <el-link
              type="primary"
              @click="showLeagueDialog(row.excludeLeagueNames, row.excludeLeagueCodes)"
              :underline="false"
            >
              {{ parseLeagueArray(row.excludeLeagueNames)?.length ?? 0 }} 个
            </el-link>
          </template>
        </el-table-column>

        <el-table-column label="创建人" prop="createBy" width="120" align="center" />
        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="resetDefault(row)">恢复默认</el-button>
            <el-button type="danger" link size="small" @click="copyToDefault(row)">批量排除</el-button>
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

    <!-- 🔍 联赛详情弹窗 (width=80vw) -->
    <el-dialog
      v-model="leagueDialogVisible"
      title="排除联赛详情"
      width="80vw"
      :close-on-click-modal="false"
    >
      <div class="league-dialog-content">
        <el-descriptions :column="2" border class="mb-16">
          <el-descriptions-item label="联赛名称">联赛编码</el-descriptions-item>
        </el-descriptions>

        <!-- ✅ 支持竖向滚动的联赛列表 -->
        <div class="league-list">
          <div
            v-for="(name, index) in currentLeagueNames"
            :key="index"
            class="league-item"
          >
            <span class="league-name">{{ name }}</span>
            <span class="league-code">{{ currentLeagueCodes?.[index] || '-' }}</span>
          </div>
          <div v-if="!currentLeagueNames?.length" class="empty-tip">
            暂无排除联赛
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="leagueDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ✏️ 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑比赛安排"
      width="600px"
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
        <el-form-item label="ID" prop="id">
          <el-input v-model="form.id" disabled />
        </el-form-item>

        <el-form-item label="EXP 标识" prop="expFlag">
          <el-switch
            v-model="form.expFlag"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>

        <el-form-item label="金币标识" prop="winFlag">
          <el-switch
            v-model="form.winFlag"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>

        <el-form-item label="最大场次" prop="limitCnt">
          <el-input-number
            v-model="form.limitCnt"
            :min="0"
            :precision="0"
            controls-position="right"
            style="width: 100%"
            placeholder="0 表示不限制"
          />
        </el-form-item>

        <el-form-item label="排除联赛" prop="excludeLeagueCodes">
          <el-select
            v-model="form.excludeLeagueCodes"
            multiple
            placeholder="请选择排除的联赛"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in leagueOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <div class="form-tip">多选，以 JSONArray 格式提交</div>
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
import { Search, Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)
const leagueOptions = ref([])

// 🔍 查询参数 (严格对照 分页请求参数_19)
const queryParams = reactive({
  excludeLeagueCode: '',
  expFlag: undefined,
  winFlag: undefined,
  hour: undefined,
  min: undefined,
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

// 🔍 联赛弹窗状态
const leagueDialogVisible = ref(false)
const currentLeagueNames = ref([])
const currentLeagueCodes = ref([])

// ✏️ 编辑对话框状态
const dialogVisible = ref(false)
const formRef = ref()
const submitLoading = ref(false)

// 表单数据
const form = reactive({
  id: null,
  expFlag: false,
  winFlag: false,
  limitCnt: 0,
  excludeLeagueCodes: []
})

// 表单验证规则 (严格对照接口 required 字段)
const rules = {
  expFlag: [{ required: true, message: '请选择 EXP 标识', trigger: 'change' }],
  winFlag: [{ required: true, message: '请选择金币标识', trigger: 'change' }],
  limitCnt: [
    { required: true, message: '请输入最大场次', trigger: 'blur' },
    { type: 'number', min: 0, message: '值不能为负数', trigger: 'blur' }
  ],
  excludeLeagueCodes: [{ required: true, message: '请选择排除的联赛', trigger: 'change' }]
}

const resetDefault = (row) => {
  ElMessageBox.confirm(`确定要恢复默认该记录吗？此操作不可恢复！`, '警告', { type: 'warning' })
    .then(async () => {
      await request.post('/matchSchedule/resetDefault.do', { id: row.id })
      ElMessage.success('成功')
      handleQuery()
    }).catch(() => {})
}

const copyToDefault = (row) => {
  ElMessageBox.confirm(`确定要批量排除吗？此操作不可恢复！`, '警告', { type: 'warning' })
    .then(async () => {
      await request.post('/matchSchedule/copyToDefault.do', { id: row.id })
      ElMessage.success('成功')
      handleQuery()
    }).catch(() => {})
}

/** 🎨 解析联赛数组字符串 (JSONArray) */
const parseLeagueArray = (jsonStr) => {
  if (!jsonStr) return []
  try {
    return JSON.parse(jsonStr)
  } catch {
    return []
  }
}

/** 👁️ 显示联赛详情弹窗 */
const showLeagueDialog = (namesJson, codesJson) => {
  currentLeagueNames.value = parseLeagueArray(namesJson)
  currentLeagueCodes.value = parseLeagueArray(codesJson)
  leagueDialogVisible.value = true
}

/** 🔍 获取联赛下拉列表 */
const fetchLeagueOptions = async () => {
  try {
    const res = await request.post('/pub/leagueOptions.do', {})
    leagueOptions.value = res.data || []
  } catch (error) {
    console.error('获取联赛下拉失败', error)
  }
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      excludeLeagueCode: queryParams.excludeLeagueCode || undefined,
      expFlag: queryParams.expFlag,
      winFlag: queryParams.winFlag,
      hour: queryParams.hour,
      min: queryParams.min,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/matchSchedule/page.do', payload)
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

/** 🔄 初始化配置 */
const handleInit = async () => {
  try {
    await ElMessageBox.confirm('确定要初始化比赛安排配置吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await request.post('/matchSchedule/init.do', {})
    ElMessage.success('初始化成功')
    handleQuery()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('初始化失败：' + (error.message || '未知错误'))
    }
  }
}

/** ✏️ 编辑配置 */
const handleEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    expFlag: row.expFlag,
    winFlag: row.winFlag,
    limitCnt: row.limitCnt,
    excludeLeagueCodes: parseLeagueArray(row.excludeLeagueCodes)
  })
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
      // ✅ 严格按接口定义提交字段，excludeLeagueCodes 转为 JSONArray 字符串
      const payload = {
        id: form.id,
        expFlag: form.expFlag,
        winFlag: form.winFlag,
        limitCnt: form.limitCnt,
        excludeLeagueCodes: JSON.stringify(form.excludeLeagueCodes)
      }
      await request.post('/matchSchedule/edit.do', payload)
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

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchLeagueOptions()
  handleQuery()
})
</script>

<style scoped lang="scss">
.match-schedule-container { padding: 20px; }

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

.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
.form-tip { font-size: 12px; color: #909399; margin-top: 4px; line-height: 1.5; }
.mb-16 { margin-bottom: 16px; }

/* 🔢 数字颜色区分：0 为灰色，非 0 为蓝色加粗 */
.num-zero {
  color: #909399;
  font-weight: normal;
}
.num-nonzero {
  color: #409EFF;
  font-weight: 600;
}

/* 🔍 联赛弹窗样式 (width=80vw) */
:deep(.el-dialog) {
  max-width: 80vw;
}

.league-dialog-content {
  max-height: 60vh;
  overflow-y: auto;
}

/* ✅ 联赛列表支持竖向滚动 */
.league-list {
  margin-top: 16px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;

  /* 滚动条样式优化 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #c0c4cc;
    border-radius: 3px;
  }
}

.league-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #ebeef5;

  &:last-child {
    border-bottom: none;
  }

  .league-name {
    font-weight: 500;
    color: #303133;
  }

  .league-code {
    font-size: 12px;
    color: #909399;
  }
}

.empty-tip {
  padding: 20px;
  text-align: center;
  color: #909399;
}
</style>
