<template>
  <div class="mbr-roulette-container">
    <!-- 统计数据区域 -->
    <el-row :gutter="20" class="sts-card-row">
      <el-col :span="6">
        <el-card shadow="hover" class="sts-card">
          <el-statistic title="今日参与人数" :value="stsData.todayMembers || 0">
            <template #prefix>
              <el-icon color="#409EFF"><User /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="sts-card">
          <el-statistic title="昨日参与人数" :value="stsData.yesterdayMembers || 0">
            <template #prefix>
              <el-icon color="#67C23A"><User /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="sts-card">
          <el-statistic title="本周参与人数" :value="stsData.weeklyMembers || 0">
            <template #prefix>
              <el-icon color="#E6A23C"><User /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="sts-card">
          <el-statistic title="本月参与人数" :value="stsData.monthlyMembers || 0">
            <template #prefix>
              <el-icon color="#F56C6C"><User /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline label-width="100px">
        <el-form-item label="单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入" clearable style="width: 200px;" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="会员账号">
          <el-input v-model="searchForm.username" placeholder="请输入" clearable style="width: 200px;" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="会员手机号">
          <el-input v-model="searchForm.phoneNumber" placeholder="请输入" clearable style="width: 200px;" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="奖品类型">
          <el-select v-model="searchForm.prizeType" placeholder="请选择" clearable style="width: 200px;">
            <el-option v-for="item in prizeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
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
      <template #header>
        <div class="card-header">
          <span>轮盘日志列表</span>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="orderNo" label="单号" width="180" show-overflow-tooltip />
        <el-table-column prop="username" label="会员账号" width="120" show-overflow-tooltip />
        <el-table-column prop="phoneNumber" label="手机号" width="130" />

        <el-table-column prop="itemNum" label="奖品序号" width="100" align="center" />

        <el-table-column prop="prizeType" label="奖品类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag>{{ getDictLabel('PrizeType', row.prizeType) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="probability" label="中奖概率" width="100" align="center">
          <template #default="{ row }">
            {{ (row.probability / 10).toFixed(2) }}%
          </template>
        </el-table-column>

        <el-table-column prop="prizeParam" label="奖品参数" min-width="150" show-overflow-tooltip />
        <el-table-column prop="i18nCode" label="国际化编码" width="150" show-overflow-tooltip />

        <el-table-column prop="createAt" label="创建时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createAt) }}
          </template>
        </el-table-column>

        <el-table-column prop="createBy" label="创建人" width="100" align="center" />
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
import { Search, Refresh, User } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { formatDateTime } from '@/utils/format'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// ================= 公共字典选项 =================
const prizeTypeOptions = getDictOptions('PrizeType')

// ================= 列表与搜索状态 =================
const loading = ref(false)
const tableData = ref([])
const searchForm = reactive({
  orderNo: '',
  username: '',
  phoneNumber: '',
  prizeType: ''
})
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

// ================= 统计数据状态 =================
const stsData = ref({
  todayMembers: 0,
  yesterdayMembers: 0,
  weeklyMembers: 0,
  monthlyMembers: 0
})

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

    const res = await request.post('/mbrRoulette/page.do', params)
    // 数据在 data 里面
    const pageData = res.data || res
    tableData.value = pageData.list || []
    pagination.total = pageData.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStsData = async () => {
  try {
    const res = await request.post('/mbrRoulette/stsData.do', {})
    // 数据在 data 里面
    stsData.value = res.data || res || {}
  } catch (e) {
    console.error('获取统计数据失败:', e)
  }
}

const handleSearch = () => { pagination.page = 1; fetchData() }
const handleReset = () => {
  Object.keys(searchForm).forEach(key => { searchForm[key] = '' })
  handleSearch()
}
const handleSizeChange = (val) => { pagination.pageSize = val; fetchData() }
const handleCurrentChange = (val) => { pagination.page = val; fetchData() }

// ================= 生命周期 =================
onMounted(() => {
  fetchStsData()
  fetchData()
})
</script>

<style scoped lang="scss">
.mbr-roulette-container {
  padding: 20px;

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
