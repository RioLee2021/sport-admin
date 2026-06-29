<template>
  <div class="activity-log-container">
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
            <el-form-item label="活动编码" prop="activityCode">
              <el-select
                v-model="queryParams.activityCode"
                placeholder="请选择活动"
                clearable
                filterable
                style="width: 100%; min-width: 160px"
              >
                <el-option
                  v-for="item in activityOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="会员手机号" prop="phoneNumber">
              <el-input
                v-model="queryParams.phoneNumber"
                placeholder="请输入手机号"
                clearable
                style="width: 100%; min-width: 160px"
                @keyup.enter="handleQuery"
              />
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

    <!-- 📊 统计数据卡片 (复用欢迎页样式) -->
    <el-row :gutter="20" class="stats-row" v-if="stsDataList.length > 0">
      <el-col
        v-for="item in stsDataList"
        :key="item.activityName"
        :span="8"
        :xs="24" :sm="12" :md="8" :lg="8"
      >
        <el-card
          shadow="hover"
          class="metric-card"
          :style="{ borderLeft: `4px solid ${getStatColor(item.activityName)}` }"
        >
          <div class="metric-header">
            <el-icon :style="{ color: getStatColor(item.activityName) }" class="metric-icon">
              <Trophy />
            </el-icon>
            <span class="metric-title">{{ item.activityName }}</span>
          </div>

          <div class="metric-content">
            <div class="metric-value">
              {{ item.memberCnt ?? 0 }}
              <span class="metric-unit">人</span>
            </div>
            <div class="metric-label">参与会员</div>
          </div>

          <el-divider class="metric-divider" />

          <div class="metric-compare">
            <div class="compare-item">
              <span class="compare-label">总奖励</span>
              <span class="compare-value coin-text">{{ item.coinsCnt ?? 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 📋 表格区域 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">活动日志列表</span>
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

        <el-table-column label="活动编码" prop="activityCode" width="120" align="center" />
        <el-table-column label="活动名称" prop="activityName" min-width="150" show-overflow-tooltip />

        <el-table-column label="会员信息" width="180">
          <template #default="{ row }">
            <div class="member-info">
              <span class="member-name">{{ row.uername || '-' }}</span>
              <span class="member-phone">{{ row.phoneNumber }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="订单号" prop="orderNo" width="160" show-overflow-tooltip />

        <el-table-column label="周期类型" prop="periodic" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getPeriodicTagType(row.periodic)">
              {{ getPeriodicLabel(row.periodic) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="奖励金币" prop="coinsAward" width="100" align="center">
          <template #default="{ row }">
            <span class="coin-text">{{ row.coinsAward ?? 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="创建人" prop="createBy" width="100" align="center" />
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
import { Search, Refresh, Trophy } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)
const activityOptions = ref([])

// 📈 统计数据
const stsDataList = ref([])

// 🔍 查询参数 (严格对照接口 分页请求参数)
const queryParams = reactive({
  activityCode: '',
  phoneNumber: '',
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

/** 🎨 周期类型映射 (参考 Periodic 枚举) */
const getPeriodicLabel = (val) => {
  const map = { '0': '无周期', '1': '每日', '2': '每周', '3': '每月', '4': '自定义' }
  return map[String(val)] || '-'
}

const getPeriodicTagType = (val) => {
  const map = { '0': 'info', '1': 'success', '2': 'warning', '3': 'primary', '4': 'danger' }
  return map[String(val)] || 'info'
}

/** 🎨 统计卡片颜色映射 */
const getStatColor = (activityName) => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#626AEF', '#00C4B3']
  // 使用活动名称哈希生成稳定颜色
  let hash = 0
  for (let i = 0; i < activityName.length; i++) {
    hash = activityName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/** 📥 获取活动下拉列表 */
const fetchActivityOpts = async () => {
  try {
    const res = await request.post('/activityLog/activityOpts.do', {})
    activityOptions.value = res.data || []
  } catch (error) {
    console.error('获取活动下拉失败', error)
  }
}

/** 📥 获取统计数据 */
const fetchStsData = async () => {
  try {
    const res = await request.post('/activityLog/stsData.do', {})
    if (res.data && Array.isArray(res.data)) {
      stsDataList.value = res.data
    }
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      activityCode: queryParams.activityCode || undefined,
      phoneNumber: queryParams.phoneNumber || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/activityLog/page.do', payload)
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

onMounted(() => {
  fetchActivityOpts()
  fetchStsData() // 加载统计数据
  handleQuery()
})
</script>

<style scoped lang="scss">
.activity-log-container { padding: 20px; }

.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }

/* 📈 统计卡片样式 (复用欢迎页) */
.stats-row { margin-bottom: 20px; }

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
  .card-header {
    display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}

.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
.member-info { display: flex; flex-direction: column; gap: 2px; }
.member-name { font-weight: 500; color: #303133; }
.member-phone { font-size: 12px; color: #909399; }
.coin-text { font-weight: 600; color: #E6A23C; }

/* 📱 响应式适配 */
@media (max-width: 768px) {
  .metric-card { margin-bottom: 16px; }
}
</style>
