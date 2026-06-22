<template>
  <div class="welcome-container">
    <!-- 🎯 页面标题 + 刷新按钮 -->
    <div class="page-header">
      <h2 class="page-title">📊 数据看板</h2>
      <div>
      <el-button
        type="primary"
        :icon="Refresh"
        :loading="refreshLoading"
        @click="fetchData"
      >
        刷新数据
      </el-button>
      <el-button
        type="danger"
        :icon="Refresh"
        :loading="refreshLoading"
        @click="handleRefresh"
      >
        重载数据
      </el-button>
      </div>
    </div>

    <!-- 📈 核心指标卡片 (现共 8 个指标) -->
    <el-row :gutter="20" class="metrics-row">
      <el-col
        v-for="(item, index) in metricCards"
        :key="index"
        :span="24" :sm="12" :md="8" :lg="6" :xl="6"
      >
        <el-card
          shadow="hover"
          class="metric-card"
          :style="{ borderLeft: `4px solid ${item.color}` }"
        >
          <div class="metric-header">
            <el-icon :style="{ color: item.color }" class="metric-icon">
              <component :is="item.icon" />
            </el-icon>
            <span class="metric-title">{{ item.title }}</span>
          </div>

          <div class="metric-content">
            <!-- ✅ 特殊处理：观看人数显示比例 -->
            <template v-if="item.type === 'watch_people'">
              <div class="metric-value watch-ratio">
                {{ resolveValue(item, 'today', 'validMbrCnt') }}
                <span class="sep">/</span>
                {{ resolveValue(item, 'today', 'mbrCnt') }}
                <span class="metric-unit">{{ item.unit }}</span>
              </div>
            </template>

            <!-- ✅ 普通数值或金额 -->
            <template v-else>
              <div class="metric-value">
                {{ formatNumber(resolveValue(item, 'today')) }}
                <span class="metric-unit">{{ item.unit || '人' }}</span>
              </div>
            </template>

            <div class="metric-label">今日</div>
          </div>

          <el-divider class="metric-divider" />

          <div class="metric-compare">
            <div class="compare-item">
              <span class="compare-label">昨日</span>
              <span class="compare-value">
                 <!-- 对比数据同样适用 watch_people 拆分逻辑 -->
                 <template v-if="item.type === 'watch_people'">
                   {{ resolveValue(item, 'yesterday', 'validMbrCnt') }}/{{ resolveValue(item, 'yesterday', 'mbrCnt') }}
                 </template>
                 <template v-else>
                   {{ formatNumber(resolveValue(item, 'yesterday')) }}
                 </template>
              </span>
            </div>
            <div class="compare-item">
              <span class="compare-label">总计</span>
              <span class="compare-value">
                 <template v-if="item.type === 'watch_people'">
                   {{ resolveValue(item, 'total', 'validMbrCnt') }}/{{ resolveValue(item, 'total', 'mbrCnt') }}
                 </template>
                 <template v-else>
                   {{ formatNumber(resolveValue(item, 'total')) }}
                 </template>
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 📊 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <!-- 左侧：分布数据 -->
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span class="chart-title">📋 会员分布数据</span>
              <el-radio-group v-model="activeDistTab" size="small">
                <el-radio-button :value="'level'">等级分布</el-radio-button>
                <el-radio-button :value="'active'">活动量分布</el-radio-button>
                <el-radio-button :value="'zombie'">僵尸会员</el-radio-button>
                <el-radio-button :value="'gift'">礼物类型</el-radio-button>
              </el-radio-group>
            </div>
          </template>

          <div class="chart-container" ref="distChartRef" style="height: 350px" />
        </el-card>
      </el-col>

      <!-- 右侧：排行榜 + 本周注册 -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="rank-card">
          <template #header>
            <div class="chart-header">
              <span class="chart-title">🏆 会员排行榜</span>
              <el-radio-group v-model="activeRankTab" size="small">
                <el-radio-button :value="'coins'">金币榜</el-radio-button>
                <el-radio-button :value="'invite'">邀请榜</el-radio-button>
              </el-radio-group>
            </div>
          </template>

          <el-table
            :data="currentRankList"
            size="small"
            :show-header="false"
            class="rank-table"
          >
            <el-table-column width="50" align="center">
              <template #default="{ $index }">
                <span class="rank-num" :class="getRankClass($index)">
                  {{ $index + 1 }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="name" min-width="120">
              <template #default="{ row }">
                <span class="rank-name">{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="value" width="80" align="right">
              <template #default="{ row }">
                <span class="rank-value" :class="{ 'highlight': activeRankTab === 'coins' }">
                  {{ formatNumber(row.value) }}
                  {{ activeRankTab === 'coins' ? '金币' : '人' }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 本周注册分布 -->
        <el-card shadow="hover" class="chart-card" style="margin-top: 20px">
          <template #header>
            <span class="chart-title">📅 本周注册分布</span>
          </template>
          <div class="chart-container" ref="weekChartRef" style="height: 200px" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 📦 数据更新时间 -->
    <div class="update-time">
      <el-tag size="small" type="info">
        数据更新时间：{{ lastUpdateTime || '-' }}
      </el-tag>
    </div>
  </div>
</template>

<script setup>
import {ref, reactive, onMounted, computed, onUnmounted, watch, nextTick} from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  User,
  Connection,
  VideoPlay,
  Ticket,
  ShoppingCart,
  Money
} from '@element-plus/icons-vue'
import request from '@/utils/request'
import * as echarts from 'echarts'

// 🔄 刷新状态
const refreshLoading = ref(false)
const lastUpdateTime = ref('')

// 📊 核心指标卡片配置 (扩展为 8 个)
const metricCards = [
  // 1. 基础增长
  { key: 'register', title: '注册数', icon: User, color: '#409EFF', type: 'people' },
  { key: 'invite', title: '邀请数', icon: Connection, color: '#67C23A', type: 'people' },

  // 2. 观看板块 (拆分人数与金额)
  { key: 'watch', title: '观看人数', icon: VideoPlay, color: '#E6A23C', type: 'watch_people', unit: '人' },
  { key: 'watch', title: '观看金额', icon: Money, color: '#E6A23C', type: 'watch_money', unit: '金币' },

  // 3. 竞猜板块 (拆分人数与金额)
  { key: 'guess', title: '竞猜人数', icon: Ticket, color: '#F56C6C', type: 'guess_people', unit: '人' },
  { key: 'guess', title: '竞猜金额', icon: Money, color: '#F56C6C', type: 'guess_money', unit: '金币' },

  // 4. 兑换板块 (拆分人数与金额)
  { key: 'giftRedeem', title: '兑换人数', icon: ShoppingCart, color: '#909399', type: 'redeem_people', unit: '人' },
  { key: 'giftRedeem', title: '兑换金额', icon: Money, color: '#909399', type: 'redeem_money', unit: '金币' }
]

// 📈 图表 Tab 状态
const activeDistTab = ref('level')
const activeRankTab = ref('coins')

// 📊 图表实例
const distChartRef = ref(null)
const weekChartRef = ref(null)
let distChart = null
let weekChart = null

// 💾 看板数据
const welcomeData = reactive({
  register: null,
  invite: null,
  watch: null,
  guess: null,
  giftRedeem: null,
  currMbrLevelDistribution: [],
  currWeekRegisterDistribution: [],
  currZombieMbrDistribution: [],
  currActiveMbrDistribution: [],
  currCoinsTopList: [],
  currInviteTopList: [],
  allGiftTypeDistribution: []
})

/** 🛠️ 解析指标值 (支持多态) */
const resolveValue = (item, period, subField = 'mbrCnt') => {
  const group = welcomeData[item.key]
  if (!group || !group[period]) return 0

  // 1. 处理特殊的 "watch_people" 双值展示逻辑 (这里返回原始数字供模板拼接)
  if (item.type === 'watch_people') {
    return group[period][subField] || 0
  }

  // 2. 处理金额类型
  if (item.type.includes('_money')) {
    // 优先取通用 amt，若无则尝试特定字段 (兼容不同后端命名)
    return group[period]['amt'] || 0
  }

  // 3. 默认人数
  return group[period]['mbrCnt'] || 0
}

/** 🔢 数字格式化 */
const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '-'
  if (num >= 10000) return (num / 10000).toFixed(1) + '万'
  if (num >= 1000) return (num / 1000).toFixed(1) + '千'
  return num.toLocaleString()
}

/** 🏆 排行榜样式 */
const getRankClass = (index) => {
  if (index === 0) return 'rank-gold'
  if (index === 1) return 'rank-silver'
  if (index === 2) return 'rank-bronze'
  return ''
}

/** 📊 当前排行榜数据 (✅ 按 value 倒序排列) */
const currentRankList = computed(() => {
  const list = activeRankTab.value === 'coins'
    ? welcomeData.currCoinsTopList
    : welcomeData.currInviteTopList

  // ✅ 按 value 倒序排序
  return [...list].sort((a, b) => {
    const valA = Number(a.value) || 0
    const valB = Number(b.value) || 0
    return valB - valA
  })
})

/** 🔄 刷新数据 */
const handleRefresh = async () => {
  refreshLoading.value = true
  try {
    await request.post('/welcome/refresh.do', {})
    ElMessage.success('数据刷新成功')
    await fetchData()
  } catch (error) {
    ElMessage.error('刷新失败：' + (error.message || '未知错误'))
  } finally {
    refreshLoading.value = false
  }
}

/** 📥 获取看板数据 */
const fetchData = async () => {
  try {
    const res = await request.post('/welcome/data.do', {})
    if (res.data) {
      Object.assign(welcomeData, res.data)
      lastUpdateTime.value = new Date().toLocaleString('zh-CN')
      renderCharts()
    }
  } catch (error) {
    ElMessage.error('加载失败：' + (error.message || '未知错误'))
  }
}

/** 📊 渲染图表 */
const renderCharts = () => {
  renderDistChart()
  renderWeekChart()
}

/** 🥧 渲染分布图表 */
const renderDistChart = () => {
  if (!distChartRef.value) return
  if (!distChart) distChart = echarts.init(distChartRef.value)

  const getDistData = () => {
    switch (activeDistTab.value) {
      case 'level': return welcomeData.currMbrLevelDistribution
      case 'active': return welcomeData.currActiveMbrDistribution
      case 'zombie': return welcomeData.currZombieMbrDistribution
      case 'gift': return welcomeData.allGiftTypeDistribution
      default: return []
    }
  }

  let data = getDistData()
  const colors = ['#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE', '#3BA272', '#FC8452']

  // ✅ 获取注册总数（用于僵尸会员分布显示）
  const registerTotal = welcomeData.register?.total?.mbrCnt || 0

  // ✅ 特殊处理：僵尸会员分布使用注册总数作为分母计算占比
  if (activeDistTab.value === 'zombie' && registerTotal > 0) {
    data = data.map(item => ({
      ...item,
      // 将原始数量转换为相对于注册总数的百分比值
      value: (Number(item.value) / registerTotal) * 100,
      // 保留原始数量用于 tooltip 显示
      originalValue: item.value
    }))
  }

  const option = {
    // ✅ 动态标题：僵尸会员分布显示注册总数
    title: activeDistTab.value === 'zombie' ? {
      text: `注册总数：${formatNumber(registerTotal)} 人`,
      left: 'center',
      top: '5%',
      textStyle: { fontSize: 14, color: '#606266' },
      subtextStyle: { fontSize: 11, color: '#909399' }
    } : undefined,

    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        // ✅ 僵尸会员 tooltip 显示原始数量 + 占比
        if (activeDistTab.value === 'zombie' && params.data.originalValue !== undefined) {
          return `${params.name}<br/>
                  人数：${formatNumber(params.data.originalValue)} 人<br/>
                  占比：${params.value.toFixed(2)}%<br/>
                  <span style="font-size:10px;color:#909399">（占比 = 该分类 / 注册总数）</span>`
        }
        return `${params.name}: ${params.value} (${params.percent}%)`
      }
    },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: {
        show: true,
        position: 'center',
        formatter: (params) => {
          // ✅ 中心显示总占比（三个分类占比之和）
          if (activeDistTab.value === 'zombie') {
            const totalPercent = data.reduce((sum, item) => sum + item.value, 0)
            return ''
          }
          return '{a|' + params.name + '}\n{b|' + params.value + '}'
        },
        rich: {
          a: { fontSize: 12, color: '#606266', padding: [0, 0, 4, 0] },
          b: { fontSize: 16, fontWeight: 'bold', color: '#303133' }
        }
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold',
          formatter: (params) => {
            if (activeDistTab.value === 'zombie' && params.data.originalValue !== undefined) {
              return `${params.name}\n${params.data.originalValue} 人\n${params.value.toFixed(2)}%`
            }
            return params.name + '\n' + params.value
          }
        }
      },
      data: data.map((item, idx) => ({
        name: item.name,
        value: item.value,
        originalValue: item.originalValue, // 保留原始值
        itemStyle: { color: colors[idx % colors.length] }
      }))
    }]
  }
  distChart.setOption(option, true)
  distChart.resize()
}

/** 🔄 监听 TAB 切换，自动重绘图表 */
watch(activeDistTab, () => {
  nextTick(() => {
    renderCharts()
  })
})

/** 🔄 监听数据变化，自动重绘 */
watch(() => [
  welcomeData.currMbrLevelDistribution,
  welcomeData.currActiveMbrDistribution,
  welcomeData.currZombieMbrDistribution,
  welcomeData.allGiftTypeDistribution
], () => {
  if (activeDistTab.value) {
    nextTick(() => renderDistChart())
  }
}, { deep: true })

/** 📈 渲染周注册图表 */
const renderWeekChart = () => {
  if (!weekChartRef.value) return
  if (!weekChart) weekChart = echarts.init(weekChartRef.value)

  const data = welcomeData.currWeekRegisterDistribution || []
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { top: 10, bottom: 20, left: 40, right: 10 },
    xAxis: { type: 'category', data: data.map(item => item.name), axisLabel: { rotate: 30, fontSize: 10 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
    series: [{
      type: 'bar',
      data: data.map(item => item.value),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 0.5, color: '#188df0' },
          { offset: 1, color: '#1858f0' }
        ])
      },
      label: { show: true, position: 'top', fontSize: 10 }
    }]
  }
  weekChart.setOption(option)
  weekChart.resize()
}

/** 🔄 窗口 resize 时重绘图表 */
const handleResize = () => {
  distChart?.resize()
  weekChart?.resize()
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  distChart?.dispose()
  weekChart?.dispose()
  distChart = null
  weekChart = null
})
</script>

<style scoped lang="scss">
.welcome-container {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 4px;
  .page-title { font-size: 22px; font-weight: bold; color: #303133; margin: 0; }
}

.metrics-row { margin-bottom: 20px; }

.metric-card {
  border-radius: 12px;
  margin-top: 12px;
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12) !important; }
  :deep(.el-card__body) { padding: 16px; }

  .metric-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .metric-icon { font-size: 20px; }
  .metric-title { font-size: 14px; font-weight: 500; color: #606266; }

  .metric-content { text-align: center; }
  .metric-value {
    font-size: 26px;
    font-weight: bold;
    color: #303133;
    line-height: 1.2;

    .watch-ratio {
      font-size: 22px; /* 比例显示稍小以适应 */
    }

    .metric-unit {
      font-size: 12px;
      font-weight: normal;
      color: #909399;
      margin-left: 4px;
    }
  }

  .sep {
    margin: 0 6px;
    color: #dcdfe6;
    font-weight: 400;
  }

  .metric-label { font-size: 13px; color: #409EFF; margin-top: 4px; }

  .metric-divider { margin: 12px 0; }

  .metric-compare { display: flex; justify-content: space-between; }
  .compare-item { display: flex; flex-direction: column; align-items: center; }
  .compare-label { font-size: 12px; color: #909399; margin-bottom: 2px; }
  .compare-value { font-size: 14px; font-weight: 500; color: #606266; }
}

.charts-row { margin-bottom: 20px; }
.chart-card { border-radius: 12px; :deep(.el-card__body) { padding: 12px 16px 16px; } }
.chart-header { display: flex; justify-content: space-between; align-items: center; }
.chart-title { font-size: 15px; font-weight: 500; color: #303133; }

.rank-card { border-radius: 12px; :deep(.el-card__body) { padding: 12px 0 16px; } }
.rank-table {
  :deep(.el-table__row) { &:hover { background: #f5f9ff !important; } }
  .rank-num {
    display: inline-flex; align-items: center; justify-content: center;
    width: 24px; height: 24px; border-radius: 50%; font-size: 12px; font-weight: bold; color: #909399; background: #f4f4f5;
    &.rank-gold { background: linear-gradient(135deg, #FFD700, #FFA500); color: #fff; }
    &.rank-silver { background: linear-gradient(135deg, #C0C0C0, #A9A9A9); color: #fff; }
    &.rank-bronze { background: linear-gradient(135deg, #CD7F32, #B87333); color: #fff; }
  }
  .rank-name { font-size: 13px; color: #303133; }
  .rank-value {
    font-size: 13px; font-weight: 500; color: #606266;
    &.highlight { color: #E6A23C; font-weight: bold; }
  }
}

.update-time { text-align: right; padding: 0 4px; }

@media (max-width: 768px) {
  .metric-card { margin-bottom: 16px; }
}
</style>
