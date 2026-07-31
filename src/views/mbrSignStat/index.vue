<template>
  <div class="mbr-sign-stat-container">
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
            <!-- 兼容后端 Swagger 中 boolean 类型但描述为 0-禁用, 1-启用 的情况 -->
            <el-tag :type="isDisabled(row.disabled) ? 'danger' : 'success'">
              {{ isDisabled(row.disabled) ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createAt" label="创建时间" min-width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createAt) }}
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
import { Search, Refresh, View } from '@element-plus/icons-vue'
// ⚠️ 请根据您项目中 request 的实际路径进行修改，例如 '@/utils/request' 或 '@/api/request'
import request from '@/utils/request'
// 引入您提供的格式化工具 (请根据实际路径调整)
import { formatDate, formatDateTime } from '@/utils/format'

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

// ================= 辅助函数 =================
// 兼容处理：如果后端返回的是纯数字 yyyyMMdd (如 20231031)，new Date 在某些浏览器会失效
const formatDateSafe = (dateStr) => {
  if (!dateStr) return '-'
  let safeDate = String(dateStr)
  // 如果是 8 位纯数字，插入横杠转为 yyyy-MM-dd 格式再格式化
  if (/^\d{8}$/.test(safeDate)) {
    safeDate = `${safeDate.slice(0, 4)}-${safeDate.slice(4, 6)}-${safeDate.slice(6, 8)}`
  }
  const formatted = formatDate(safeDate)
  return formatted === '-' ? String(dateStr) : formatted
}

// 星期几映射 (1-7)
const getDayOfWeek = (day) => {
  const weeks = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return weeks[day] || '-'
}

// 兼容后端 disabled 字段可能是 boolean 或 0/1 数字/字符串的情况
const isDisabled = (val) => {
  return val === 1 || val === '1' || val === true
}

// ================= 核心方法 =================
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    // 直接使用 request.post 传入 URI 和数据
    const res = await request.post('/mbrSignStat/page.do', params)
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
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

// 查看签到明细
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
      id: currentStatId.value // 传入会员签到统计ID
    }
    // 直接使用 request.post 传入 URI 和数据
    const res = await request.post('/mbrSignStat/pageLog.do', params)
    logTableData.value = res.data.list || []
    logPagination.total = res.data.total || 0
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
  fetchData()
})
</script>

<style scoped lang="scss">
.mbr-sign-stat-container {
  padding: 20px;

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
