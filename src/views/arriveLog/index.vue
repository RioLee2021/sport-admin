<template>
  <div class="arrive-log-container">
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
            <el-form-item label="推送编号" prop="notificationNo">
              <el-input
                v-model="queryParams.notificationNo"
                placeholder="请输入推送编号"
                clearable
                @keyup.enter="handleQuery"
              />
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
          <el-col :span="4">
            <el-form-item label="是否到达" prop="arriveFlag">
              <el-select
                v-model="queryParams.arriveFlag"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option label="是" :value="true"/>
                <el-option label="否" :value="false"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="是否点击" prop="clickFlag">
              <el-select
                v-model="queryParams.clickFlag"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option label="是" :value="true"/>
                <el-option label="否" :value="false"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
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
          <span class="title">推送到达日志列表</span>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center"/>
        <el-table-column prop="notificationsNo" label="推送编号" width="180" show-overflow-tooltip/>
        <el-table-column prop="username" label="会员账号" width="120" show-overflow-tooltip/>
        <el-table-column prop="phoneNumber" label="手机号" width="130" align="center"/>
        <el-table-column prop="hwdToken" label="硬件 Token" width="200" show-overflow-tooltip/>

        <el-table-column prop="arriveFlag" label="是否到达" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.arriveFlag ? 'success' : 'info'" size="small">
              {{ row.arriveFlag ? '✅ 是' : '❌ 否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="clickFlag" label="是否点击" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.clickFlag ? 'success' : 'warning'" size="small">
              {{ row.clickFlag ? '✅ 是' : ' 否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="disabled" label="启用状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createBy" label="创建人" width="100" align="center"/>
        <el-table-column prop="createAt" label="创建时间" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>
        <el-table-column prop="updateAt" label="更新时间" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.updateAt) }}</template>
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
import {ref, reactive, onMounted} from 'vue'
import {ElMessage} from 'element-plus'
import {Search, Refresh} from '@element-plus/icons-vue'
import request from '@/utils/request'
import {useRoute} from "vue-router";

const route = useRoute()

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数 (严格对照 分页请求参数_2)
const queryParams = reactive({
  notificationNo: route.query.notificationNo || '',
  username: '',
  arriveFlag: undefined,
  clickFlag: undefined,
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
      notificationNo: queryParams.notificationNo || undefined,
      username: queryParams.username || undefined,
      arriveFlag: queryParams.arriveFlag,
      clickFlag: queryParams.clickFlag,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/arriveLog/page.do', payload)
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
  queryParams.notificationNo = ''
  handleQuery()
})
</script>

<style scoped lang="scss">
.arrive-log-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;

  :deep(.el-card__body) {
    padding: 20px;
  }
}

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

.search-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  width: 100%;
}
</style>
