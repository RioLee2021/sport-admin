<template>
  <div class="match-container">
    <!-- 🔍 查询表单 -->
    <el-card class="search-card" shadow="hover">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="100px" @submit.prevent>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="所属联赛" prop="leagueCode">
              <el-select v-model="queryParams.leagueCode" placeholder="请选择联赛" clearable filterable style="width: 100%;min-width: 120px">
                <el-option v-for="item in leagueOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="比赛状态" prop="stat">
              <el-select v-model="queryParams.stat" placeholder="请选择状态" clearable style="width: 100%;min-width: 120px">
                <el-option v-for="item in getDictOptions('MatchStat')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="是否热门" prop="hotFlag">
              <el-select v-model="queryParams.hotFlag" placeholder="请选择" clearable style="width: 100%;min-width: 80px">
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="开赛时间" prop="timeRange">
              <el-date-picker
                v-model="queryParams.timeRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
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
          <span class="title">比赛列表</span>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增比赛</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />

        <el-table-column label="主队" prop="homeTeamName" width="120" align="center">
          <template #default="{ row }">{{ row.homeTeamName }}</template>
        </el-table-column>

        <el-table-column label="比分" width="100" align="center">
          <template #default="{ row }">
            <span class="score-text">{{ row.homeScore ?? '-' }} : {{ row.awayScore ?? '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="客队" prop="awayTeamCode" width="120" align="center">
          <template #default="{ row }">{{ row.awayTeamName }}</template>
        </el-table-column>

        <el-table-column label="所属联赛" prop="leagueCode" width="120" align="center">
          <template #default="{ row }">{{ getLeagueName(row.leagueCode) }}</template>
        </el-table-column>

        <el-table-column label="状态" prop="stat" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatTagType(row.stat)">{{ getDictLabel('MatchStat', row.stat) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="热门" prop="hotFlag" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.hotFlag ? 'warning' : 'info'">{{ row.hotFlag ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="开赛" prop="startTime" width="160" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.startTime) }}</template>
        </el-table-column>

        <el-table-column label="结束" prop="endTime" width="160" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.endTime) }}</template>
        </el-table-column>

        <el-table-column label="排序号" prop="sortNum" width="90" align="center" />
        <el-table-column label="直播数" prop="liveCnt" width="90" align="center" />

        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
            <el-button type="success" link size="small" :icon="VideoCamera" @click="openBatchLiveDialog(row)">生成直播</el-button>
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
      :title="isEdit ? '编辑比赛' : '新增比赛'"
      width="650px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" label-position="right">
        <!-- 联赛 & 球队 (仅新增时可用) -->
        <el-form-item label="所属联赛" prop="leagueCode" v-if="!isEdit">
          <el-select v-model="form.leagueCode" placeholder="请选择联赛" filterable style="width: 100%" @change="handleLeagueChange">
            <el-option v-for="item in leagueOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-row :gutter="20" v-if="!isEdit">
          <el-col :span="12">
            <el-form-item label="主队" prop="homeTeamCode">
              <el-select v-model="form.homeTeamCode" placeholder="请选择主队" filterable style="width: 100%">
                <el-option v-for="item in currentTeamOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客队" prop="awayTeamCode">
              <el-select v-model="form.awayTeamCode" placeholder="请选择客队" filterable style="width: 100%">
                <el-option v-for="item in currentTeamOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="开赛时间" prop="startTime" v-if="!isEdit">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            placeholder="选择开赛时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="主队得分" prop="homeScore">
              <el-input-number v-model="form.homeScore" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客队得分" prop="awayScore">
              <el-input-number v-model="form.awayScore" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="比赛状态" prop="stat">
              <el-select v-model="form.stat" placeholder="请选择状态" style="width: 100%">
                <el-option v-for="item in getDictOptions('MatchStat')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否热门" prop="hotFlag">
              <el-switch v-model="form.hotFlag" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序号" prop="sortNum">
              <el-input-number v-model="form.sortNum" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="isEdit">
            <el-form-item label="结束时间" prop="endTime">
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                placeholder="选择结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
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

    <!-- 🎥 批量生成直播数据对话框 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="批量生成直播数据"
      width="500px"
      :close-on-click-modal="false"
      @close="handleBatchDialogClose"
    >
      <el-form ref="batchFormRef" :model="batchForm" :rules="batchRules" label-width="120px">
        <el-form-item label="比赛ID" prop="id">
          <el-input v-model="batchForm.id" disabled />
        </el-form-item>
        <el-form-item label="主播列表" prop="streamerIds">
          <el-select v-model="batchForm.streamerIds" multiple placeholder="请选择主播" filterable style="width: 100%">
            <el-option v-for="item in streamerOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最小观看数" prop="viewNumMin">
              <el-input-number v-model="batchForm.viewNumMin" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大观看数" prop="viewNumMax">
              <el-input-number v-model="batchForm.viewNumMax" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="是否推荐" prop="recommendFlag">
          <el-switch v-model="batchForm.recommendFlag" active-text="是" inactive-text="否" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="batchLoading" @click="handleBatchSubmit">生成</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, VideoCamera } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  leagueCode: '',
  stat: '',
  hotFlag: undefined,
  timeRange: [],
  page: 1,
  pageSize: 10
})

// 📄 分页参数
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const queryFormRef = ref()

// 📥 下拉数据
const leagueOptions = ref([])
const teamOptionsMap = ref({}) // { leagueCode: [teams] }
const streamerOptions = ref([])

// 当前可用的球队列表
const currentTeamOptions = computed(() => {
  return teamOptionsMap.value[form.leagueCode] || []
})

// ✏️ 对话框状态
const dialogVisible = ref(false)
const formRef = ref()
const submitLoading = ref(false)
const isEdit = ref(false)

const form = reactive({
  id: null,
  leagueCode: '',
  homeTeamCode: '',
  awayTeamCode: '',
  homeScore: 0,
  awayScore: 0,
  stat: '0',
  hotFlag: false,
  sortNum: 0,
  startTime: '',
  endTime: ''
})

// 校验规则 (根据 Swagger AddForm/EditForm 动态调整)
const rules = computed(() => {
  const base = {
    homeScore: [{ required: true, message: '请输入主队得分', trigger: 'blur' }],
    awayScore: [{ required: true, message: '请输入客队得分', trigger: 'blur' }],
    stat: [{ required: true, message: '请选择比赛状态', trigger: 'change' }],
    hotFlag: [{ required: true, message: '请设置是否热门', trigger: 'change' }],
    sortNum: [{ required: true, message: '请输入排序号', trigger: 'blur' }]
  }
  if (!isEdit.value) {
    base.leagueCode = [{ required: true, message: '请选择所属联赛', trigger: 'change' }]
    base.homeTeamCode = [{ required: true, message: '请选择主队', trigger: 'change' }]
    base.awayTeamCode = [{ required: true, message: '请选择客队', trigger: 'change' }]
    base.startTime = [{ required: true, message: '请选择开赛时间', trigger: 'change' }]
  }
  return base
})

// 🎥 批量直播对话框状态
const batchDialogVisible = ref(false)
const batchFormRef = ref()
const batchLoading = ref(false)
const batchForm = reactive({
  id: null,
  streamerIds: [],
  viewNumMin: 0,
  viewNumMax: 0,
  recommendFlag: false
})

const batchRules = {
  streamerIds: [{ required: true, message: '请至少选择一个主播', trigger: 'change' }],
  viewNumMin: [{ required: true, message: '请输入最小观看数', trigger: 'blur' }],
  viewNumMax: [{ required: true, message: '请输入最大观看数', trigger: 'blur' }]
}

// 原生 JS 转换（无需额外依赖）
const toTimestamp = (dateStr) => dateStr ? Math.floor(new Date(dateStr).getTime() / 1000) : undefined

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      leagueCode: queryParams.leagueCode || undefined,
      stat: queryParams.stat || undefined,
      hotFlag: queryParams.hotFlag,
      startTimeBegin: toTimestamp(queryParams.timeRange?.[0]),
      startTimeEnd: toTimestamp(queryParams.timeRange?.[1]),
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/match/page.do', payload)
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

const handleReset = () => {
  queryFormRef.value?.resetFields()
  pagination.page = 1
  handleQuery()
}

// 📥 初始化下拉数据
const fetchLeagues = async () => {
  try {
    const res = await request.post('/pub/leagueOptions.do', {})
    leagueOptions.value = res.data || []
  } catch (e) { console.error('获取联赛失败', e) }
}

const fetchTeams = async (leagueCode) => {
  if (!leagueCode || teamOptionsMap.value[leagueCode]) return
  try {
    const res = await request.post('/pub/teamOptions.do', { leagueCode })
    teamOptionsMap.value[leagueCode] = res.data || []
  } catch (e) { console.error('获取球队失败', e) }
}

const fetchStreamers = async () => {
  try {
    const res = await request.post('/match/streamerOptions.do', {})
    streamerOptions.value = res.data || []
  } catch (e) { console.error('获取主播失败', e) }
}

// ️ 辅助方法
const getTeamName = (code) => {
  for (const leagueCode in teamOptionsMap.value) {
    const team = teamOptionsMap.value[leagueCode].find(t => t.value === code)
    if (team) return team.label
  }
  return code || '-'
}

const getLeagueName = (code) => {
  const item = leagueOptions.value.find(l => l.value === code)
  return item ? item.label : code || '-'
}

const getStatTagType = (stat) => {
  const map = { '0': 'info', '1': 'primary', '2': 'warning', '3': 'success' }
  return map[stat] || 'info'
}

// ✏️ 表单操作
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, { id: null, leagueCode: '', homeTeamCode: '', awayTeamCode: '', homeScore: 0, awayScore: 0, stat: '0', hotFlag: false, sortNum: 0, startTime: '', endTime: '' })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, { ...row })
  // 编辑时加载该联赛的球队列表（用于展示名称，虽然不可改）
  if (row.leagueCode) fetchTeams(row.leagueCode)
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

const handleLeagueChange = (val) => {
  form.homeTeamCode = ''
  form.awayTeamCode = ''
  fetchTeams(val)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      const payload = isEdit.value
        ? { id: form.id, homeScore: form.homeScore, awayScore: form.awayScore, stat: form.stat, hotFlag: form.hotFlag, sortNum: form.sortNum, endTime: toTimestamp(form.endTime) || undefined }
        : { leagueCode: form.leagueCode, homeTeamCode: form.homeTeamCode, awayTeamCode: form.awayTeamCode, homeScore: form.homeScore, awayScore: form.awayScore, stat: form.stat, hotFlag: form.hotFlag, sortNum: form.sortNum, startTime: toTimestamp(form.startTime) }

      await request.post(isEdit.value ? '/match/edit.do' : '/match/add.do', payload)
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

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除比赛 "${getTeamName(row.homeTeamCode)} vs ${getTeamName(row.awayTeamCode)}" 吗？`, '警告', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(async () => {
    try {
      await request.post('/match/delete.do', { id: row.id })
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

// 🎥 批量直播操作
const openBatchLiveDialog = (row) => {
  if (row) {
    batchForm.id = row.id
  } else {
    ElMessage.warning('请先在表格中选择一场比赛')
    return
  }
  batchForm.streamerIds = []
  batchForm.viewNumMin = 0
  batchForm.viewNumMax = 0
  batchForm.recommendFlag = false
  batchDialogVisible.value = true
  fetchStreamers()
  setTimeout(() => batchFormRef.value?.clearValidate(), 100)
}

const handleBatchSubmit = async () => {
  if (!batchFormRef.value) return
  await batchFormRef.value.validate(async (valid) => {
    if (!valid) return
    batchLoading.value = true
    try {
      await request.post('/match/batchCreateLiveData.do', { ...batchForm })
      ElMessage.success('直播数据生成成功')
      batchDialogVisible.value = false
      handleQuery()
    } catch (error) {
      ElMessage.error('生成失败：' + (error.message || '未知错误'))
    } finally {
      batchLoading.value = false
    }
  })
}

const handleBatchDialogClose = () => {
  batchFormRef.value?.resetFields()
}

onMounted(() => {
  fetchLeagues()
  handleQuery()
})
</script>

<style scoped lang="scss">
.match-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
    .header-actions { display: flex; gap: 10px; }
  }
}
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
.score-text { font-weight: bold; color: #409EFF; font-size: 14px; }
</style>
