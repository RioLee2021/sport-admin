<template>
  <div class="card-market-container">
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

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格区域 -->
    <el-card class="table-card" shadow="never">
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
import { Search, Refresh } from '@element-plus/icons-vue'
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
  dealFlag: undefined
})
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

// ================= 核心列表方法 =================
const fetchData = async () => {
  loading.value = true
  try {
    // 过滤空值
    const params = { page: pagination.page, pageSize: pagination.pageSize, ...searchForm }
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined || params[key] === null) {
        delete params[key]
      }
    })

    const res = await request.post('/cardMarket/page.do', params)

    // 🔑 核心适配：列表返回数据外层统一包一个 data
    // 经过 request 拦截器后，res 为 { code: 200, data: { list: [], total: 0 } }
    const pageData = res.data || res
    tableData.value = pageData.list || []
    pagination.total = pageData.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 获取卡等级下拉
const fetchLevelOpts = async () => {
  try {
    const res = await request.post('/cardMarket/levelOpts.do')
    levelOpts.value = res.data || res || []
  } catch (e) { console.error(e) }
}

// 获取卡系列下拉
const fetchSeriesOpts = async () => {
  try {
    const res = await request.post('/cardMarket/seriesOpts.do')
    seriesOpts.value = res.data || res || []
  } catch (e) { console.error(e) }
}

// 获取卡名下拉
const fetchNameOpts = async () => {
  try {
    const res = await request.post('/cardMarket/nameOpts.do')
    nameOpts.value = res.data || res || []
  } catch (e) { console.error(e) }
}

const handleSearch = () => { pagination.page = 1; fetchData() }
const handleReset = () => {
  Object.keys(searchForm).forEach(key => { searchForm[key] = key === 'dealFlag' ? undefined : '' })
  handleSearch()
}
const handleSizeChange = (val) => { pagination.pageSize = val; fetchData() }
const handleCurrentChange = (val) => { pagination.page = val; fetchData() }

// ================= 操作功能 =================
// 人工购买
const handleManualBuy = async (row) => {
  try {
    await ElMessageBox.confirm('确定要执行【人工购买】操作吗？', '提示', { type: 'warning' })
    await request.post('/cardMarket/manualBuy.do', { id: row.id })
    ElMessage.success('操作成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

// 切换成交状态
const handleToggleDeal = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要【切换成交状态】吗？当前状态：${row.dealFlag ? '已成交' : '未成交'}`, '提示', { type: 'warning' })
    await request.post('/cardMarket/toggleDeal.do', { id: row.id })
    ElMessage.success('操作成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

// 人工取消
const handleManualCancel = async (row) => {
  try {
    await request.post('/cardMarket/manualCancel.do', { id: row.id })
    ElMessage.success('取消成功')
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

// ================= 生命周期 =================
onMounted(() => {
  fetchData()
  fetchLevelOpts()
  fetchSeriesOpts()
  fetchNameOpts()
})
</script>

<style scoped lang="scss">
.card-market-container {
  padding: 20px;

  .search-card { margin-bottom: 16px; }

  .table-card {
    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
