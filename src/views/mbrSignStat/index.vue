<template>
  <div class="mbr-sign-stat-container">
    <!-- 合计数据统计区域 -->
    <el-row :gutter="20" class="sts-card-row">
      <el-col :span="6">
        <el-card shadow="hover" class="sts-card">
          <el-statistic title="今日签到人数" :value="stsData.todayMembers || 0">
            <template #prefix>
              <el-icon color="#409EFF"><User /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="sts-card">
          <el-statistic title="昨日签到人数" :value="stsData.yesterdayMembers || 0">
            <template #prefix>
              <el-icon color="#67C23A"><User /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="sts-card">
          <el-statistic title="本周签到人数" :value="stsData.weeklyMembers || 0">
            <template #prefix>
              <el-icon color="#E6A23C"><User /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="sts-card">
          <el-statistic title="本月签到人数" :value="stsData.monthlyMembers || 0">
            <template #prefix>
              <el-icon color="#F56C6C"><User /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline label-width="80px">
        <el-form-item label="会员账号">
          <el-input
            v-model="searchForm.username"
            placeholder="请输入会员账号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="searchForm.phoneNumber"
            placeholder="请输入手机号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格区域 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="username" label="会员账号" min-width="120" show-overflow-tooltip />
        <el-table-column prop="phoneNumber" label="手机号" min-width="130" show-overflow-tooltip />

        <el-table-column prop="lastSignDate" label="最后签到日期" min-width="130" align="center">
          <template #default="{ row }">
            {{ formatDateSafe(row.lastSignDate) }}
          </template>
        </el-table-column>

        <el-table-column prop="weeklyContinuousDays" label="本周连续签到(天)" min-width="140" align="center">
          <template #default="{ row }">
            <el-tag type="success" effect="plain">{{ row.weeklyContinuousDays ?? 0 }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="disabled" label="状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="isDisabled(row.disabled) ? 'danger' : 'success'">
              {{ isDisabled(row.disabled) ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createAt" label="签到时间" min-width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.lastSignDate) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="handleViewLog(row)">
              签到明细
            </el-button>
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

    <!-- 签到历史明细弹窗 -->
    <el-dialog
      v-model="logDialogVisible"
      title="签到历史明细"
      width="800px"
      destroy-on-close
    >
      <el-table v-loading="logLoading" :data="logTableData" border stripe>
        <el-table-column prop="id" label="明细ID" width="80" align="center" />
        <el-table-column prop="signDate" label="签到日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDateSafe(row.signDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="dayOfWeek" label="星期" width="80" align="center">
          <template #default="{ row }">
            {{ getDayOfWeek(row.dayOfWeek) }}
          </template>
        </el-table-column>
        <el-table-column prop="rewardDesc" label="签到奖励描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="createAt" label="记录时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createAt) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="logPagination.page"
          v-model:page-size="logPagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="logPagination.total"
          layout="total, prev, pager, next"
          @size-change="handleLogSizeChange"
          @current-change="handleLogCurrentChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, View, User } from '@element-plus/icons-vue'
import request from '@/utils/request' // ⚠️ 请根据实际路径调整
import { formatDate, formatDateTime } from '@/utils/format' // ⚠️ 请根据实际路径调整

// ================= 状态定义 =================
const loading = ref(false)
const tableData = ref([])
const searchForm = reactive({
  username: undefined,
  phoneNumber: undefined
})
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 明细弹窗状态
const logDialogVisible = ref(false)
const logLoading = ref(false)
const logTableData = ref([])
const currentStatId = ref(null)
const logPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 🔑 新增：合计数据状态
const stsData = ref({
  todayMembers: 0,
  yesterdayMembers: 0,
  weeklyMembers: 0,
  monthlyMembers: 0
})

// ================= 辅助函数 =================
const formatDateSafe = (dateStr) => {
  if (!dateStr) return '-'
  let safeDate = String(dateStr)
  if (/^\d{8}$/.test(safeDate)) {
    safeDate = `${safeDate.slice(0, 4)}-${safeDate.slice(4, 6)}-${safeDate.slice(6, 8)}`
  }
  const formatted = formatDate(safeDate)
  return formatted === '-' ? String(dateStr) : formatted
}

const getDayOfWeek = (day) => {
  const weeks = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return weeks[day] || '-'
}

const isDisabled = (val) => {
  return val === 1 || val === '1' || val === true
}

// ================= 核心方法 =================
// 🔑 新增：获取合计数据
const fetchStsData = async () => {
  try {
    const res = await request.post('/mbrSignStat/stsData.do', {})
    // 兼容外层包 data 的情况
    stsData.value = res.data || res || {}
  } catch (error) {
    console.error('获取合计数据失败:', error)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    const res = await request.post('/mbrSignStat/page.do', params)
    tableData.value = res.data?.list || res.list || []
    pagination.total = res.data?.total || res.total || 0
  } catch (error) {
    console.error('获取签到统计失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.username = undefined
  searchForm.phoneNumber = undefined
  handleSearch()
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchData()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  fetchData()
}

const handleViewLog = (row) => {
  currentStatId.value = row.id
  logPagination.page = 1
  logDialogVisible.value = true
  fetchLogData()
}

const fetchLogData = async () => {
  if (!currentStatId.value) return
  logLoading.value = true
  try {
    const params = {
      page: logPagination.page,
      pageSize: logPagination.pageSize,
      id: currentStatId.value
    }
    const res = await request.post('/mbrSignStat/pageLog.do', params)
    logTableData.value = res.data?.list || res.list || []
    logPagination.total = res.data?.total || res.total || 0
  } catch (error) {
    console.error('获取签到明细失败:', error)
  } finally {
    logLoading.value = false
  }
}

const handleLogSizeChange = (val) => {
  logPagination.pageSize = val
  fetchLogData()
}

const handleLogCurrentChange = (val) => {
  logPagination.page = val
  fetchLogData()
}

// ================= 生命周期 =================
onMounted(() => {
  fetchStsData() // 页面加载时获取合计数据
  fetchData()
})
</script>

<style scoped lang="scss">
.mbr-sign-stat-container {
  padding: 20px;

  // 🔑 新增：统计卡片样式
  .sts-card-row {
    margin-bottom: 20px;

    .sts-card {
      text-align: center;
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      :deep(.el-statistic__head) {
        font-size: 14px;
        color: #606266;
        margin-bottom: 8px;
      }

      :deep(.el-statistic__content) {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
      }
    }
  }

  .search-card {
    margin-bottom: 16px;
  }

  .table-card {
    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
