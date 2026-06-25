<template>
  <div class="exp-log-container">
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
            <el-form-item label="经验类型" prop="expType">
              <el-select
                v-model="queryParams.expType"
                placeholder="请选择经验类型"
                clearable
                style="width: 100%; min-width: 140px"
              >
                <el-option
                  v-for="item in getDictOptions('ExpType')"
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

    <!-- 📋 表格区域 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">经验日志列表</span>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column label="会员名称" prop="username" width="100" show-overflow-tooltip />
        <el-table-column label="手机号" prop="phoneNumber" width="130" align="center" />
        <el-table-column label="订单号" prop="orderNo" width="180" show-overflow-tooltip />

        <el-table-column label="经验类型" prop="expType" width="130" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">
              {{ getDictLabel('ExpType', row.expType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="经验值" prop="expValue" width="80" align="center">
          <template #default="{ row }">
            <span class="exp-text">+{{ row.expValue ?? 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="周期类型" prop="periodic" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getPeriodicTagType(row.periodic)">
              {{ getDictLabel('Periodic', row.periodic) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建人" show-overflow-tooltip prop="createBy" width="110" align="center" />
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
import { Search, Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数 (严格对照 分页请求参数_4)
const queryParams = reactive({
  expType: '',
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

/** 🎨 周期类型标签样式 */
const getPeriodicTagType = (periodic) => {
  const map = {
    '0': 'info',    // 无周期
    '1': 'success', // 每日
    '2': 'warning', // 每周
    '3': 'primary', // 每月
    '4': 'danger'   // 自定义
  }
  return map[periodic] || 'info'
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      expType: queryParams.expType || undefined,
      phoneNumber: queryParams.phoneNumber || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/expLog/page.do', payload)
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
  handleQuery()
})
</script>

<style scoped lang="scss">
.exp-log-container { padding: 20px; }

.search-card {
  margin-bottom: 20px;
  :deep(.el-card__body) { padding: 20px; }
}

.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}

.search-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.exp-text {
  font-weight: 600;
  color: #67C23A;
}
</style>
