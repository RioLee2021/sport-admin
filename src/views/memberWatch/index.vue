<template>
  <div class="member-watch-container">
    <!-- 📊 统计面板 (保留原有美化样式) -->
    <el-row :gutter="20" class="stats-row" v-if="false">
      <!-- 暂无统计数据接口，预留 -->
    </el-row>

    <!-- 🔍 查询表单 -->
    <el-card class="search-card" shadow="hover">
      <el-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        label-width="90px"
        @submit.prevent
      >
        <el-row :gutter="20">
          <!-- ✅ 新增：联赛下拉 -->
          <el-col :span="6">
            <el-form-item label="所属联赛" prop="leagueCode">
              <el-select
                v-model="queryParams.leagueCode"
                placeholder="请选择联赛"
                clearable
                filterable
                style="width: 100%;min-width: 150px"
                @change="handleLeagueChange"
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

          <!-- ✅ 修改：球队下拉 (级联) -->
          <el-col :span="6">
            <el-form-item label="球队名称" prop="teamName">
              <el-select
                v-model="queryParams.teamName"
                placeholder="请选择球队"
                clearable
                filterable
                style="width: 100%;min-width: 180px"
                :disabled="!queryParams.leagueCode"
              >
                <el-option
                  v-for="item in teamOptions"
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
          <span class="title">观看数据列表</span>
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
        <el-table-column label="主播名称" prop="streamerName" width="120" align="center" />
        <el-table-column label="主场名称" prop="homeName" width="120" align="center" />
        <el-table-column label="客场名称" prop="awayName" width="120" align="center" />
        <el-table-column label="观看人数" prop="memberCnt" width="100" align="center" />

        <!-- ✅ 观看时长 (秒转时分秒) -->
        <el-table-column label="观看时长" prop="durationCnt" width="150" align="center">
          <template #default="{ row }">
            {{ formatDuration(row.durationCnt) }}
          </template>
        </el-table-column>

        <!-- ✅ 观看时长平均值 -->
        <el-table-column label="观看时长平均值" prop="durationAvg" width="160" align="center">
          <template #default="{ row }">
            {{ formatDuration(row.durationAvg) }}
          </template>
        </el-table-column>

        <!-- ✅ 有效观看时长 -->
        <el-table-column label="有效观看时长" prop="durationValidCnt" width="150" align="center">
          <template #default="{ row }">
            {{ formatDuration(row.durationValidCnt) }}
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'

//  表格状态
const tableData = ref([])
const loading = ref(false)

//  下拉数据
const leagueOptions = ref([])
const teamOptions = ref([])

// 🔍 查询参数 (增加 leagueCode)
const queryParams = reactive({
  leagueCode: undefined,
  teamName: undefined,
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

// ⏱️ 时长格式化：秒 → xx小时xx分钟xx秒
const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined) return '-'
  const totalSeconds = Number(seconds)
  if (isNaN(totalSeconds)) return '-'

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  if (hours > 0) return `${hours}小时${minutes}分钟${secs}秒`
  if (minutes > 0) return `${minutes}分钟${secs}秒`
  return `${secs}秒`
}

// 🔗 级联逻辑：联赛变化触发球队列表更新
const handleLeagueChange = async (val) => {
  // 联赛切换时清空已选球队
  queryParams.teamName = ''
  // 重新获取球队列表
  await fetchTeamOptions(val)
}

// 📥 获取联赛下拉数据
const fetchLeagues = async () => {
  try {
    const res = await request.post('/pub/leagueOptions.do', {})
    leagueOptions.value = res.data || []
  } catch (error) {
    console.error('获取联赛列表失败', error)
  }
}

// 📥 获取球队下拉数据 (需传 leagueCode)
const fetchTeamOptions = async (leagueCode) => {
  if (!leagueCode) {
    teamOptions.value = []
    return
  }
  try {
    const res = await request.post('/pub/teamOptions.do', { leagueCode })
    teamOptions.value = res.data || []
  } catch (error) {
    console.error('获取球队列表失败', error)
    teamOptions.value = []
  }
}

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const res = await request.post('/memberWatch/page.do', {
      leagueCode: queryParams.leagueCode || undefined,
      teamName: queryParams.teamName || undefined,
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

// 🔄 重置查询
const handleReset = () => {
  queryFormRef.value?.resetFields()
  pagination.page = 1
  // 重置时清空球队列表
  teamOptions.value = []
  handleQuery()
}

onMounted(() => {
  fetchLeagues()
  handleQuery()
})
</script>

<style scoped lang="scss">
.member-watch-container {
  padding: 20px;
}

.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}
.search-buttons { display: flex; gap: 10px; }
</style>
