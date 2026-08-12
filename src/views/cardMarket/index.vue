<template>
  <div class="card-market-container">
    <!-- 统计数据区域 -->
    <el-row :gutter="20" class="sts-card-row">
      <el-col :span="12">
        <el-card shadow="hover" class="sts-card">
          <div class="sts-title">
            <el-icon color="#409EFF"><ShoppingCart /></el-icon>
            <span>出售统计 (人数)</span>
          </div>
          <el-row :gutter="20" class="sts-content">
            <el-col :span="6">
              <el-statistic title="今日" :value="sellSts.todayMembers || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="昨日" :value="sellSts.yesterdayMembers || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="本周" :value="sellSts.weeklyMembers || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="本月" :value="sellSts.monthlyMembers || 0" />
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="sts-card">
          <div class="sts-title">
            <el-icon color="#67C23A"><TrendCharts /></el-icon>
            <span>成交统计 (笔数)</span>
          </div>
          <el-row :gutter="20" class="sts-content">
            <el-col :span="6">
              <el-statistic title="今日" :value="dealSts.todayTimes || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="昨日" :value="dealSts.yesterdayTimes || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="本周" :value="dealSts.weeklyTimes || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="本月" :value="dealSts.monthlyTimes || 0" />
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline label-width="90px">
        <el-form-item label="买家账号">
          <el-input v-model="searchForm.buyerUsername" placeholder="请输入" clearable style="width: 180px;" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="买家手机">
          <el-input v-model="searchForm.buyerPhoneNumber" placeholder="请输入" clearable style="width: 180px;" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="卖家账号">
          <el-input v-model="searchForm.sellerUsername" placeholder="请输入" clearable style="width: 180px;" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="卖家手机">
          <el-input v-model="searchForm.sellerPhoneNumber" placeholder="请输入" clearable style="width: 180px;" @keyup.enter="handleSearch" />
        </el-form-item>

        <el-form-item label="卡等级">
          <el-select v-model="searchForm.cardLevel" placeholder="请选择" clearable style="width: 180px;">
            <el-option v-for="item in levelOpts" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="卡系列">
          <el-select v-model="searchForm.cardSeries" placeholder="请选择" clearable style="width: 180px;">
            <el-option v-for="item in seriesOpts" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="卡名称">
          <el-select v-model="searchForm.cardName" placeholder="请选择" clearable style="width: 180px;">
            <el-option v-for="item in nameOpts" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否成交">
          <el-select v-model="searchForm.dealFlag" placeholder="全部" clearable style="width: 180px;">
            <el-option label="已成交" :value="true" />
            <el-option label="未成交" :value="false" />
          </el-select>
        </el-form-item>
        <!-- 🔑 新增：多少天之前查询条件 -->
        <el-form-item label="多少天前">
          <el-input-number
            v-model="searchForm.daysAgo"
            placeholder="天数"
            :min="0"
            controls-position="right"
            style="width: 180px;"
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
      <template #header>
        <div class="card-header">
          <span>卡片市场列表</span>
          <div>
            <!-- 🔑 新增：批量操作按钮 -->
            <el-button type="success" :icon="ShoppingCart" @click="handleBuyAll">全部购买</el-button>
            <el-button type="danger" :icon="Close" @click="handleCancelAll">全部取消</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="buyer" label="买家账号" min-width="120" show-overflow-tooltip />
        <el-table-column prop="seller" label="卖家账号" min-width="120" show-overflow-tooltip />

        <el-table-column prop="cardLevel" label="卡等级" width="100" align="center" />
        <el-table-column prop="cardSeries" label="卡系列" min-width="120" show-overflow-tooltip />
        <el-table-column prop="cardName" label="卡名称" min-width="120" show-overflow-tooltip />

        <el-table-column prop="cardPicUrl" label="卡片图片" width="100" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.cardPicUrl"
              :src="row.cardPicUrl"
              :preview-src-list="[row.cardPicUrl]"
              fit="cover"
              style="width: 50px; height: 70px; border-radius: 4px;"
              preview-teleported
            />
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column prop="price" label="价格" width="100" align="center" />

        <el-table-column prop="dealFlag" label="是否成交" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.dealFlag ? 'success' : 'info'">
              {{ row.dealFlag ? '已成交' : '未成交' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createAt" label="创建时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="handleManualBuy(row)">人工购买</el-button>
            <el-button type="warning" link @click="handleToggleDeal(row)">切换成交</el-button>
            <el-popconfirm title="确定要人工取消该交易吗？" @confirm="handleManualCancel(row)">
              <template #reference>
                <el-button type="danger" link>人工取消</el-button>
              </template>
            </el-popconfirm>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, ShoppingCart, TrendCharts, Close } from '@element-plus/icons-vue'
import request from '@/utils/request' // ⚠️ 请根据实际路径调整
import { formatDateTime } from '@/utils/format' // ⚠️ 请根据实际路径调整

// ================= 字典与下拉状态 =================
const levelOpts = ref([])
const seriesOpts = ref([])
const nameOpts = ref([])

// ================= 列表与搜索状态 =================
const loading = ref(false)
const tableData = ref([])
const searchForm = reactive({
  buyerUsername: '',
  buyerPhoneNumber: '',
  sellerUsername: '',
  sellerPhoneNumber: '',
  cardLevel: '',
  cardSeries: '',
  cardName: '',
  dealFlag: undefined,
  daysAgo: undefined // 🔑 新增：多少天之前
})
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

// ================= 统计数据状态 =================
const sellSts = ref({ todayMembers: 0, yesterdayMembers: 0, weeklyMembers: 0, monthlyMembers: 0 })
const dealSts = ref({ todayTimes: 0, yesterdayTimes: 0, weeklyTimes: 0, monthlyTimes: 0 })

// ================= 核心列表方法 =================
const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize, ...searchForm }
    // 过滤空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined || params[key] === null) {
        delete params[key]
      }
    })

    const res = await request.post('/cardMarket/page.do', params)
    const pageData = res.data || res
    tableData.value = pageData.list || []
    pagination.total = pageData.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 🔑 新增：获取统计数据
const fetchStsData = async () => {
  try {
    const [sellRes, dealRes] = await Promise.all([
      request.post('/cardMarket/sellStsData.do', {}),
      request.post('/cardMarket/dealStsData.do', {})
    ])
    sellSts.value = sellRes.data || sellRes || {}
    dealSts.value = dealRes.data || dealRes || {}
  } catch (e) {
    console.error('获取统计数据失败:', e)
  }
}

// 获取下拉选项
const fetchLevelOpts = async () => {
  try {
    const res = await request.post('/cardMarket/levelOpts.do')
    levelOpts.value = res.data || res || []
  } catch (e) { console.error(e) }
}
const fetchSeriesOpts = async () => {
  try {
    const res = await request.post('/cardMarket/seriesOpts.do')
    seriesOpts.value = res.data || res || []
  } catch (e) { console.error(e) }
}
const fetchNameOpts = async () => {
  try {
    const res = await request.post('/cardMarket/nameOpts.do')
    nameOpts.value = res.data || res || []
  } catch (e) { console.error(e) }
}

const handleSearch = () => { pagination.page = 1; fetchData() }
const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = (key === 'dealFlag' || key === 'daysAgo') ? undefined : ''
  })
  handleSearch()
}
const handleSizeChange = (val) => { pagination.pageSize = val; fetchData() }
const handleCurrentChange = (val) => { pagination.page = val; fetchData() }

// ================= 操作功能 =================
// 🔑 新增：全部购买 (带当前搜索条件)
const handleBuyAll = async () => {
  try {
    await ElMessageBox.confirm('确定要【全部购买】当前筛选条件下的卡片吗？此操作不可逆！', '高危操作警告', {
      type: 'warning',
      confirmButtonText: '确定购买',
      cancelButtonText: '取消'
    })
    const params = { ...searchForm }
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined || params[key] === null) delete params[key]
    })
    await request.post('/cardMarket/buyAll.do', params)
    ElMessage.success('全部购买操作已提交')
    fetchData()
    fetchStsData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

// 🔑 新增：全部取消 (带当前搜索条件)
const handleCancelAll = async () => {
  try {
    await ElMessageBox.confirm('确定要【全部取消】当前筛选条件下的交易吗？此操作不可逆！', '高危操作警告', {
      type: 'warning',
      confirmButtonText: '确定取消',
      cancelButtonText: '取消'
    })
    const params = { ...searchForm }
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined || params[key] === null) delete params[key]
    })
    await request.post('/cardMarket/cancelAll.do', params)
    ElMessage.success('全部取消操作已提交')
    fetchData()
    fetchStsData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

// 单条人工购买
const handleManualBuy = async (row) => {
  try {
    await ElMessageBox.confirm('确定要执行【人工购买】操作吗？', '提示', { type: 'warning' })
    await request.post('/cardMarket/manualBuy.do', { id: row.id })
    ElMessage.success('操作成功')
    fetchData()
    fetchStsData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

// 单条切换成交状态
const handleToggleDeal = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要【切换成交状态】吗？当前状态：${row.dealFlag ? '已成交' : '未成交'}`, '提示', { type: 'warning' })
    await request.post('/cardMarket/toggleDeal.do', { id: row.id })
    ElMessage.success('操作成功')
    fetchData()
    fetchStsData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

// 单条人工取消
const handleManualCancel = async (row) => {
  try {
    await request.post('/cardMarket/manualCancel.do', { id: row.id })
    ElMessage.success('取消成功')
    fetchData()
    fetchStsData()
  } catch (e) {
    console.error(e)
  }
}

// ================= 生命周期 =================
onMounted(() => {
  fetchStsData()
  fetchData()
  fetchLevelOpts()
  fetchSeriesOpts()
  fetchNameOpts()
})
</script>

<style scoped lang="scss">
.card-market-container {
  padding: 20px;

  .sts-card-row {
    margin-bottom: 20px;

    .sts-card {
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .sts-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: bold;
        color: #303133;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #ebeef5;
      }

      .sts-content {
        :deep(.el-statistic__head) {
          font-size: 13px;
          color: #909399;
          margin-bottom: 4px;
        }
        :deep(.el-statistic__content) {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
        }
      }
    }
  }

  .search-card { margin-bottom: 16px; }

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
}
</style>
