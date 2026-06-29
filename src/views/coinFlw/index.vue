<template>
  <div class="coin-flw-container">
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
            <el-form-item label="会员账号" prop="username">
              <el-input
                v-model="queryParams.username"
                placeholder="请输入会员账号"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="变更类型" prop="changeType">
              <el-select
                v-model="queryParams.changeType"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option
                  v-for="item in getDictOptions('CoinChangeType')"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="关联编号" prop="relatedNo">
              <el-input
                v-model="queryParams.relatedNo"
                placeholder="请输入关联编号"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="操作人" prop="createBy">
              <el-input
                v-model="queryParams.createBy"
                placeholder="请输入操作人"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="时间范围" prop="timeRange">
              <el-date-picker
                v-model="queryParams.timeRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <div class="search-buttons">
              <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 📊 可折叠统计卡片区域 -->
    <el-collapse v-model="activeCollapse" class="stats-collapse" style="margin-bottom: 20px">
      <el-collapse-item name="stats" title="📈 统计数据概览">
        <el-row :gutter="20" class="stats-row" v-if="stsDataList.length > 0">
          <el-col
            v-for="item in stsDataList"
            :key="item.changeType"
            :span="6"
            :xs="24" :sm="12" :md="8" :lg="6"
          >
            <el-card
              shadow="hover"
              class="metric-card"
              :style="{ borderLeft: `4px solid ${getStatColor(item.changeType)}` }"
            >
              <div class="metric-header">
                <el-icon :style="{ color: getStatColor(item.changeType) }" class="metric-icon">
                  <Wallet />
                </el-icon>
                <span class="metric-title">{{ getDictLabel('CoinChangeType', item.changeType) }}</span>
              </div>

              <div class="metric-content">
                <div class="metric-value">
                  {{ formatNumber(item.coinsCnt) }}
                  <span class="metric-unit">金币</span>
                </div>
                <div class="metric-label">金币总额</div>
              </div>

              <el-divider class="metric-divider" />

              <div class="metric-compare">
                <div class="compare-item">
                  <span class="compare-label">会员数</span>
                  <span class="compare-value">{{ item.memberCnt ?? 0 }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <div v-else class="empty-stats">暂无统计数据</div>
      </el-collapse-item>
    </el-collapse>

    <!-- 📋 表格区域 -->
    <el-card class="table-card" shadow="hover">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />

        <el-table-column label="会员账号" prop="username" width="120" align="center" />

        <el-table-column label="会员类型" prop="memberType" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.memberType === '1' ? 'warning' : ''">
              {{ getDictLabel('MemberType', row.memberType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="变更类型" prop="changeType" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getChangeTypeTag(row.changeType)" size="small">
              {{ getDictLabel('CoinChangeType', row.changeType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="变更前积分" prop="beforeCoins" width="110" align="center" />
        <el-table-column label="变更后积分" prop="afterCoins" width="110" align="center" />
        <el-table-column label="变更积分" prop="changeCoins" width="110" align="center">
          <template #default="{ row }">
            <span :class="getChangeCoinsClass(row.changeCoins)">
              {{ formatChangeCoins(row.changeCoins) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="关联编号" prop="relatedNo" width="150" align="center" show-overflow-tooltip />
        <el-table-column label="备注" prop="remark" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作人" prop="createBy" width="100" align="center" />

        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
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
import { Search, Refresh, Wallet } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'
import { toTimestamp } from "../../utils/format"

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 📈 统计数据
const stsDataList = ref([])
const activeCollapse = ref(['stats']) // 默认展开统计区域

// 🔍 查询参数
const queryParams = reactive({
  username: '',
  phoneNumber: '',
  changeType: '',
  relatedNo: '',
  createBy: '',
  timeRange: [],
  page: 1,
  pageSize: 10
})

// 📄 分页参数
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const queryFormRef = ref()

// 🏷️ 辅助方法：变更类型标签颜色
const getChangeTypeTag = (type) => {
  const map = { '0': 'success', '1': 'warning', '2': 'info', '3': 'danger' }
  return map[type] || 'info'
}

// 🏷️ 辅助方法：变更积分文字颜色
const getChangeCoinsClass = (coins) => {
  if (coins > 0) return 'text-success'
  if (coins < 0) return 'text-danger'
  return ''
}

// 🏷️ 辅助方法：格式化变更积分（显示 +/- 符号）
const formatChangeCoins = (coins) => {
  if (coins == null) return '-'
  const num = Number(coins)
  if (num > 0) return `+${num}`
  if (num < 0) return `${num}`
  return '0'
}

// 🔢 数字格式化
const formatNumber = (num) => {
  if (num === null || num === undefined) return '-'
  if (num >= 10000) return (num / 10000).toFixed(1) + '万'
  if (num >= 1000) return (num / 1000).toFixed(1) + '千'
  return num.toLocaleString()
}

// 🎨 统计卡片颜色映射
const getStatColor = (changeType) => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#626AEF', '#00C4B3']
  return colors[Number(changeType) % colors.length] || '#409EFF'
}

// 📥 获取统计数据
const fetchStsData = async () => {
  try {
    // 传递相同的查询条件以获取对应筛选的统计
    const payload = {
      username: queryParams.username || undefined,
      phoneNumber: queryParams.phoneNumber || undefined,
      changeType: queryParams.changeType || undefined,
      relatedNo: queryParams.relatedNo || undefined,
      createBy: queryParams.createBy || undefined,
      startTime: toTimestamp(queryParams.timeRange?.[0]) || undefined,
      endTime: toTimestamp(queryParams.timeRange?.[1]) || undefined
    }
    const res = await request.post('/coinFlw/stsData.do', payload)
    if (res.data && Array.isArray(res.data)) {
      stsDataList.value = res.data
    }
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
}

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      username: queryParams.username || undefined,
      phoneNumber: queryParams.phoneNumber || undefined,
      changeType: queryParams.changeType || undefined,
      relatedNo: queryParams.relatedNo || undefined,
      createBy: queryParams.createBy || undefined,
      startTime: toTimestamp(queryParams.timeRange?.[0]) || undefined,
      endTime: toTimestamp(queryParams.timeRange?.[1]) || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/coinFlw/page.do', payload)
    if (res.data) {
      tableData.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
    // 查询时同步刷新统计数据
    await fetchStsData()
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
  handleQuery()
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.coin-flw-container { padding: 20px; }

.search-card {
  margin-bottom: 20px;
  :deep(.el-card__body) { padding: 20px; }
}

/* 📊 折叠统计区域样式 */
.stats-collapse {
  :deep(.el-collapse-item__header) {
    font-size: 15px;
    font-weight: 500;
    color: #303133;
    background: #f8f9fa;
    border-radius: 4px;
    padding: 12px 16px;
  }
  :deep(.el-collapse-item__wrap) {
    border: none;
  }
}

.stats-row {
  padding: 16px 20px;
}

.empty-stats {
  padding: 20px;
  text-align: center;
  color: #909399;
}

/* 📈 统计卡片样式 (复用欢迎页) */
.metric-card {
  border-radius: 12px;
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12) !important; }
  :deep(.el-card__body) { padding: 16px; }

  .metric-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .metric-icon { font-size: 20px; }
  .metric-title { font-size: 14px; font-weight: 500; color: #606266; }

  .metric-content { text-align: center; }
  .metric-value {
    font-size: 26px; font-weight: bold; color: #303133; line-height: 1.2;
    .metric-unit { font-size: 12px; font-weight: normal; color: #909399; margin-left: 4px; }
  }
  .metric-label { font-size: 13px; color: #409EFF; margin-top: 4px; }

  .metric-divider { margin: 12px 0; }

  .metric-compare { display: flex; justify-content: space-between; }
  .compare-item { display: flex; flex-direction: column; align-items: center; }
  .compare-label { font-size: 12px; color: #909399; margin-bottom: 2px; }
  .compare-value { font-size: 14px; font-weight: 500; color: #606266; }
}

.table-card {
  :deep(.el-card__body) { padding: 20px; }
}

.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }

/* 🔑 变更积分颜色样式 */
:deep(.text-success) { color: #67c23a; font-weight: 500; }
:deep(.text-danger) { color: #f56c6c; font-weight: 500; }

/* 📱 响应式适配 */
@media (max-width: 768px) {
  .metric-card { margin-bottom: 16px; }
}
</style>
