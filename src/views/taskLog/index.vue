<template>
  <div class="task-log-container">
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
            <el-form-item label="任务名称" prop="taskName">
              <el-select
                v-model="queryParams.taskName"
                placeholder="请选择任务名称"
                clearable
                filterable
                style="width: 100%; min-width: 140px"
              >
                <el-option
                  v-for="item in taskNameOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="执行结果" prop="taskResult">
              <el-select
                v-model="queryParams.taskResult"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option
                  v-for="item in getDictOptions('TaskResult')"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <div class="search-buttons">
              <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
              <el-button type="danger" :icon="Delete" @click="handleClearLogs">清空日志</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

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

        <el-table-column label="任务名称" prop="taskName" width="150" show-overflow-tooltip />
        <el-table-column label="任务描述" prop="taskDesc" width="180" show-overflow-tooltip />

        <el-table-column label="执行结果" prop="taskResult" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getTaskResultTag(row.taskResult)" size="small">
              {{ getDictLabel('TaskResult', row.taskResult) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="任务耗时" prop="taskCost" width="110" align="center">
          <template #default="{ row }">
            <span v-if="row.taskCost !== null && row.taskCost !== undefined">{{ row.taskCost }} ms</span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="任务日志" prop="taskLog" min-width="250" show-overflow-tooltip />
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
import { Search, Refresh, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  taskName: '',
  taskResult: '',
  page: 1,
  pageSize: 10
})

// 📄 分页参数
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const queryFormRef = ref()

// 📥 任务名称下拉选项
const taskNameOptions = ref([])

// 🏷️ 辅助方法：执行结果标签颜色映射
const getTaskResultTag = (val) => {
  const map = { '0': 'danger', '1': 'success', '2': 'warning' }
  return map[val] || 'info'
}

/** 📥 获取任务名称下拉列表 */
const fetchTaskNameOptions = async () => {
  try {
    const res = await request.post('/taskLog/taskNameOpts.do', {})
    taskNameOptions.value = res.data || []
  } catch (error) {
    console.error('获取任务名称下拉失败', error)
    ElMessage.error('获取任务列表失败')
  }
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      taskName: queryParams.taskName || undefined,
      taskResult: queryParams.taskResult || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/taskLog/page.do', payload)
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

/** 🗑️ 清空日志（带确认弹窗 + 传查询条件） */
const handleClearLogs = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空当前查询条件下的日志吗？此操作不可恢复！',
      '⚠️ 警告',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning',
        distinguishCancelAndClose: true
      }
    )

    // 🔥 调用清空接口，参数与查询条件一致
    await request.post('/taskLog/clear.do', { ...queryParams })

    ElMessage.success('日志清空成功')
    // 清空后重置到第一页并刷新列表
    pagination.page = 1
    handleQuery()
  } catch (error) {
    // 用户点击取消或关闭弹窗时不报错
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('清空失败：' + (error.message || '未知错误'))
    }
  }
}

onMounted(() => {
  fetchTaskNameOptions()
  handleQuery()
})
</script>

<style scoped lang="scss">
.task-log-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card { :deep(.el-card__body) { padding: 20px; } }
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
</style>
