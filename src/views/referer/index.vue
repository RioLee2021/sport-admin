<template>
  <div class="referer-container">
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
            <el-form-item label="上级手机" prop="parentPhone">
              <el-input
                v-model="queryParams.parentPhone"
                placeholder="请输入上级手机号"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="注册来源" prop="referer">
              <el-input
                v-model="queryParams.referer"
                placeholder="请输入注册来源"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="注册IP" prop="registerIp">
              <el-input
                v-model="queryParams.registerIp"
                placeholder="请输入注册IP"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="注册地区" prop="registerRegion">
              <el-input
                v-model="queryParams.registerRegion"
                placeholder="请输入注册地区"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
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
      <el-collapse-item name="stats" title="📈 注册来源统计">
        <el-row :gutter="20" class="stats-row" v-if="stsDataList.length > 0">
          <el-col
            v-for="item in stsDataList"
            :key="item.referer"
            :span="6"
            :xs="24" :sm="12" :md="8" :lg="6"
          >
            <el-card
              shadow="hover"
              class="metric-card"
              :style="{ borderLeft: `4px solid ${getStatColor(item.referer)}` }"
            >
              <div class="metric-header">
                <el-icon :style="{ color: getStatColor(item.referer) }" class="metric-icon">
                  <User />
                </el-icon>
                <span class="metric-title">{{ item.referer || '未知来源' }}</span>
              </div>

              <div class="metric-content">
                <div class="metric-value">
                  {{ item.registerCnt ?? 0 }}
                  <span class="metric-unit">人</span>
                </div>
                <div class="metric-label">注册数量</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <div v-else class="empty-stats">暂无统计数据</div>
      </el-collapse-item>
    </el-collapse>

    <!-- 📋 表格区域 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">注册来源列表</span>
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
        <el-table-column label="手机号" prop="phoneNumber" width="130" align="center" />
        <el-table-column label="上级手机号" prop="parentPhone" width="130" align="center" />
        <el-table-column label="来源" prop="referer" min-width="150" show-overflow-tooltip />
        <el-table-column label="注册IP" prop="registerIp" width="140" align="center" />
        <el-table-column label="注册地区" prop="registerRegion" width="120" align="center" />
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
import { Search, Refresh, User } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 📈 统计数据
const stsDataList = ref([])
const activeCollapse = ref(['stats']) // 默认展开统计区域

// 🔍 查询参数 (严格对照 分页请求参数_27)
const queryParams = reactive({
  parentPhone: '',
  referer: '',
  registerIp: '',
  registerRegion: '',
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

/** 🎨 统计卡片颜色映射 */
const getStatColor = (referer) => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#626AEF', '#00C4B3', '#FF9F7F']
  // 使用来源名称哈希生成稳定颜色
  let hash = 0
  for (let i = 0; i < (referer || '').length; i++) {
    hash = referer.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/** 📥 获取统计数据 */
const fetchStsData = async () => {
  try {
    // 传递相同的查询条件以获取对应筛选的统计
    const payload = {
      parentPhone: queryParams.parentPhone || undefined,
      referer: queryParams.referer || undefined,
      registerIp: queryParams.registerIp || undefined,
      registerRegion: queryParams.registerRegion || undefined
    }
    const res = await request.post('/referer/stsData.do', payload)
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
      parentPhone: queryParams.parentPhone || undefined,
      referer: queryParams.referer || undefined,
      registerIp: queryParams.registerIp || undefined,
      registerRegion: queryParams.registerRegion || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/referer/page.do', payload)
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

/** 🔄 重置查询 */
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
.referer-container { padding: 20px; }

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
}

.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header {
    display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}

.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }

/* 📱 响应式适配 */
@media (max-width: 768px) {
  .metric-card { margin-bottom: 16px; }
}
</style>
