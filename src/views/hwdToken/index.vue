<template>
  <div class="hwd-token-container">
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
            <el-form-item label="硬件类型" prop="hwdType">
              <el-select
                v-model="queryParams.hwdType"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 140px"
              >
                <el-option
                  v-for="item in getDictOptions('HwdType')"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="queryParams.username"
                placeholder="请输入用户名"
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
          <span class="title">硬件 TOKEN 列表</span>
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
        <el-table-column prop="hwdToken" label="硬件 TOKEN" width="200" show-overflow-tooltip />
        <el-table-column prop="username" label="会员账号" width="120" show-overflow-tooltip />
        <el-table-column prop="phoneNumber" label="手机号" width="130" align="center" />

        <el-table-column prop="hwdType" label="硬件类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getDictLabel('HwdType', row.hwdType) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="zombieDays" label="僵尸天数" width="100" align="center">
          <template #default="{ row }">
            <span :class="{ 'text-warning': row.zombieDays > 0 }">{{ row.zombieDays ?? 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="distorted" label="销毁标识" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.distorted ? 'danger' : 'success'" size="small">
              {{ row.distorted ? '已销毁' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="disabled" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createBy" label="创建人" width="100" align="center" />
        <el-table-column prop="createAt" label="创建时间" width="180" align="center">
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

// 🔍 查询参数 (严格对照 分页请求参数_11)
const queryParams = reactive({
  hwdType: '',
  username: '',
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

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      hwdType: queryParams.hwdType || undefined,
      username: queryParams.username || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/hwdToken/page.do', payload)
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
.hwd-token-container { padding: 20px; }

.search-card {
  margin-bottom: 20px;
  :deep(.el-card__body) { padding: 20px; }
}

.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header {
    display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}

.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }

/* 🔢 僵尸天数高亮样式 */
.text-warning {
  color: #E6A23C;
  font-weight: 500;
}
</style>
