<template>
  <div class="member-guess-container">


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
          <el-col :span="6">
            <el-form-item label="竞猜类型" prop="guessType">
              <el-select
                v-model="queryParams.guessType"
                placeholder="请选择竞猜类型"
                clearable
                style="width: 100%;min-width: 100px"
              >
                <el-option
                  v-for="item in getDictOptions('GuessType')"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="联赛" prop="leagueCode">
              <el-select
                v-model="queryParams.leagueCode"
                placeholder="请选择联赛"
                clearable
                filterable
                style="width: 100%;min-width: 100px"
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

          <el-col :span="6">
            <el-form-item label="订单号" prop="orderNo">
              <el-input
                v-model="queryParams.orderNo"
                placeholder="请输入订单号"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="会员手机号" prop="phoneNumber">
              <el-input
                v-model="queryParams.phoneNumber"
                placeholder="请输入手机号"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="是否中奖" prop="winFlag">
              <el-select v-model="queryParams.winFlag" placeholder="请选择" clearable style="width: 100%;min-width: 80px">
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <div class="search-buttons">
              <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
              <el-button type="warning" :icon="RefreshLeft" @click="fetchStsData">刷新统计</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 📊 统计面板 (美化版) -->
    <el-row :gutter="20" class="stats-row" v-if="stsDataList.length > 0">
      <el-col
        v-for="item in stsDataList"
        :key="item.guessType"
        :span="6"
        class="stats-col"
      >
        <el-card shadow="hover" class="stats-card" :body-style="{ padding: '16px' }">
          <div class="stats-header">
            <el-icon class="stats-icon" :style="{ color: getStatColor(item) }">
              <component :is="getStatIcon(item)" />
            </el-icon>
            <span class="stats-title">{{ getDictLabel('GuessType', item.guessType) }}</span>
          </div>

          <div class="stats-content">
            <div class="stats-number">{{ item.totalCnt ?? 0 }}</div>
            <div class="stats-label">总笔数</div>
          </div>

          <!-- 进度条可视化 -->
          <div class="stats-progress">
            <el-progress
              :percentage="getWinRate(item)"
              :color="getProgressColor(item)"
              :show-text="false"
              :stroke-width="6"
            />
            <div class="progress-text">
              <span class="win-text">✅ 中奖会员数 {{ item.winMemberCnt ?? 0 }}</span>
              <span class="lose-text">❌ 未中会员数 {{ item.loseMemberCnt ?? 0 }}</span>
            </div>
          </div>

          <div class="stats-footer">
            <span class="reward-label">中奖金额：</span>
            <span class="reward-value" :style="{ color: getStatColor(item) }">
              {{ item.rewardCnt ?? 0 }} 金币
            </span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 📋 表格区域 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">竞猜记录列表</span>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
        :row-style="getRowStyle"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />

        <el-table-column label="订单号" prop="orderNo" width="140" show-overflow-tooltip />

        <el-table-column label="比赛" min-width="200">
          <template #default="{ row }">
            <div class="match-info">
              <span class="team-name home">{{ row.homeName }}</span>
              <span class="score">{{ row.homeScore }} : {{ row.awayScore }}</span>
              <span class="team-name away">{{ row.awayName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="竞猜类型" prop="guessType" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ getDictLabel('GuessType', row.guessType) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="让球" prop="handicap" width="80" align="center">
          <template #default="{ row }">
            <span class="handicap-text">{{ formatHandicap(row.handicap) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="竞猜结果" prop="guessResult" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getResultTagType(row.guessResult)" size="small">
              {{ getDictLabel('GuessResult', row.guessResult) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="中奖标识" prop="winFlag" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.winFlag ? 'success' : 'danger'" size="small">
              {{ row.winFlag ? '✅ 中奖' : '❌ 未中' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="基础奖金" prop="baseWinCoins" width="100" align="center">
          <template #default="{ row }">
            <span class="coin-text">{{ row.baseWinCoins ?? 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="实发奖金" prop="rewardCoins" width="100" align="center">
          <template #default="{ row }">
            <span class="coin-text reward" :class="{ 'highlight': row.winFlag }">
              {{ row.rewardCoins ?? 0 }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="会员" min-width="150">
          <template #default="{ row }">
            <div class="member-info">
              <span class="member-name">{{ row.username || '-' }}</span>
              <span class="member-phone">{{ row.phoneNumber ? `(${row.phoneNumber})` : '' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" prop="finished" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.finished ? 'success' : 'warning'" size="small">
              {{ row.finished ? '已完成' : '进行中' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="竞猜时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">详情</el-button>
            <el-button
              v-if="!row.finished"
              type="warning"
              link
              size="small"
              @click="handleSettle(row)"
            >
              结算
            </el-button>
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

    <!-- 🔍 详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="竞猜详情"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="订单号">{{ currentRow?.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="比赛">
          <div class="match-detail">
            <span>{{ currentRow?.homeName }} {{ currentRow?.homeScore }}</span>
            <span class="vs">VS</span>
            <span>{{ currentRow?.awayName }} {{ currentRow?.awayScore }}</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="竞猜类型">{{ getDictLabel('GuessType', currentRow?.guessType) }}</el-descriptions-item>
        <el-descriptions-item label="让球">{{ formatHandicap(currentRow?.handicap) }}</el-descriptions-item>
        <el-descriptions-item label="竞猜结果">
          <el-tag :type="getResultTagType(currentRow?.guessResult)">
            {{ getDictLabel('GuessResult', currentRow?.guessResult) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="中奖标识">
          <el-tag :type="currentRow?.winFlag ? 'success' : 'danger'">
            {{ currentRow?.winFlag ? '✅ 中奖' : '❌ 未中' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="基础奖金">{{ currentRow?.baseWinCoins }} 金币</el-descriptions-item>
        <el-descriptions-item label="实发奖金" :span="2">
          <span class="reward-coins">{{ currentRow?.rewardCoins }} 金币</span>
        </el-descriptions-item>
        <el-descriptions-item label="会员信息">
          {{ currentRow?.username }} {{ currentRow?.phoneNumber ? `(${currentRow.phoneNumber})` : '' }}
        </el-descriptions-item>
        <el-descriptions-item label="竞猜时间">{{ $formatDateTime(currentRow?.createAt) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentRow?.finished ? 'success' : 'warning'">
            {{ currentRow?.finished ? '已完成' : '进行中' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Refresh, Download, RefreshLeft,
  TrendCharts, Money, User, Check, Close
} from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictLabel,getDictOptions } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 📈 统计数据
const stsDataList = ref([])

// 🔍 查询参数
const queryParams = reactive({
  guessType: undefined,
  leagueCode: undefined,
  orderNo: undefined,
  winFlag: undefined,
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
const leagueOptions = ref([])

// 🔍 详情弹窗
const detailDialogVisible = ref(false)
const currentRow = ref(null)

/** 🎨 统计卡片样式辅助方法 */
const getStatColor = (item) => {
  const winRate = item.totalCnt ? (item.winMemberCnt / item.totalCnt) * 100 : 0
  if (winRate >= 70) return '#67C23A'  // 绿色 - 高胜率
  if (winRate >= 40) return '#E6A23C'  // 橙色 - 中胜率
  return '#F56C6C'  // 红色 - 低胜率
}

const getStatIcon = (item) => {
  const winRate = item.totalCnt ? (item.winMemberCnt / item.totalCnt) * 100 : 0
  if (winRate >= 70) return Check
  if (winRate >= 40) return TrendCharts
  return Close
}

const getStatTitle = (item) => {
  return `竞猜类型 ${item.guessType ?? '0'}`
}

const getProgressColor = (item) => {
  return getStatColor(item)
}

const getWinRate = (item) => {
  return Math.round((item.winMemberCnt / (item.lossMemberCnt+item.winMemberCnt)) * 100)
}

/** 🏷️ 表格辅助方法 */
const getResultTagType = (result) => {
  const map = { '0': 'info', '1': 'success', '2': 'danger' }
  return map[result] || 'info'
}

const formatHandicap = (val) => {
  if (val === undefined || val === null) return '-'
  if (val > 0) return `+${val}`
  return val.toString()
}

const getRowStyle = ({ row }) => {
  if (row.winFlag) {
    return { background: 'rgba(103, 194, 58, 0.05)' }
  }
  return {}
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      ...queryParams,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/memberGuess/page.do', payload)
    if (res.data) {
      tableData.value = res.data.list || []
      pagination.total = res.data.total || 0
      await fetchStsData()
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

/** 📈 获取统计数据 */
const fetchStsData = async () => {
  try {
    const payload = {
      ...queryParams,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/memberGuess/stsGuess.do', payload)
    if (res.data && Array.isArray(res.data)) {
      stsDataList.value = res.data
    }
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

/** 📥 初始化联赛下拉 */
const fetchLeagues = async () => {
  try {
    const res = await request.post('/pub/leagueOptions.do', {})
    leagueOptions.value = res.data || []
  } catch (e) {
    console.error('获取联赛失败', e)
  }
}

/** 🔍 查看详情 */
const handleViewDetail = (row) => {
  currentRow.value = { ...row }
  detailDialogVisible.value = true
}

/** 💰 手动结算（如需） */
const handleSettle = (row) => {
  ElMessageBox.confirm(`确定要结算订单 "${row.orderNo}" 吗？`, '提示', {
    confirmButtonText: '确定结算',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // 根据实际接口调整
      await request.post('/memberGuess/settle.do', { id: row.id })
      ElMessage.success('结算成功')
      handleQuery()
    } catch (error) {
      ElMessage.error('结算失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

/** 📤 导出记录 */
const handleExport = () => {
  ElMessage.info('导出功能开发中...')
  // 实际可调用后端导出接口
}

onMounted(() => {
  fetchLeagues()
  fetchStsData()
  handleQuery()
})
</script>

<style scoped lang="scss">
.member-guess-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 📊 统计面板样式 */
.stats-row {
  margin-bottom: 20px;
}

.stats-col {
  display: flex;
}

.stats-card {
  width: 100%;
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12) !important;
  }

  .stats-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;

    .stats-icon {
      font-size: 24px;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(64, 158, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stats-title {
      font-size: 14px;
      font-weight: 600;
      color: #606266;
    }
  }

  .stats-content {
    text-align: center;
    margin-bottom: 16px;

    .stats-number {
      font-size: 32px;
      font-weight: bold;
      color: #303133;
      line-height: 1.2;
    }

    .stats-label {
      font-size: 13px;
      color: #909399;
      margin-top: 4px;
    }
  }

  .stats-progress {
    margin-bottom: 12px;

    :deep(.el-progress-bar) {
      border-radius: 3px;
    }

    .progress-text {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 12px;

      .win-text {
        color: #67C23A;
        font-weight: 500;
      }

      .lose-text {
        color: #F56C6C;
        font-weight: 500;
      }
    }
  }

  .stats-footer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    padding-top: 12px;
    border-top: 1px dashed #e4e7ed;

    .reward-label {
      font-size: 13px;
      color: #909399;
    }

    .reward-value {
      font-size: 16px;
      font-weight: bold;
    }
  }
}

/* 🔍 查询表单 */
.search-card {
  margin-bottom: 20px;

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.search-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* 📋 表格区域 */
.table-card {
  :deep(.el-card__body) {
    padding: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 16px;
      font-weight: bold;
      color: #303133;
    }
  }
}

/* 🏷️ 表格内容样式 */
:deep(.el-table) {
  .el-table__row:hover {
    background: #f9fafc !important;
  }
}

.match-info {
  display: flex;
  align-items: center;
  gap: 8px;

  .team-name {
    font-size: 13px;
    color: #606266;

    &.home {
      color: #409EFF;
      font-weight: 500;
    }

    &.away {
      color: #F56C6C;
      font-weight: 500;
    }
  }

  .score {
    font-size: 12px;
    color: #909399;
    background: #f4f4f5;
    padding: 2px 8px;
    border-radius: 10px;
  }
}

.handicap-text {
  font-weight: 600;
  color: #E6A23C;
}

.coin-text {
  font-weight: 500;
  color: #606266;

  &.reward {
    color: #F56C6C;

    &.highlight {
      color: #67C23A;
      font-weight: bold;
    }
  }
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .member-name {
    font-weight: 500;
    color: #303133;
  }

  .member-phone {
    font-size: 12px;
    color: #909399;
  }
}

/* 🔍 详情弹窗样式 */
:deep(.el-descriptions) {
  .el-descriptions__label {
    width: 100px;
    background: #f8f9fa;
  }

  .match-detail {
    display: flex;
    align-items: center;
    gap: 12px;

    .vs {
      color: #909399;
      font-size: 12px;
    }
  }

  .reward-coins {
    font-size: 16px;
    font-weight: bold;
    color: #67C23A;
  }
}
</style>
