<template>
  <div class="live-chat-container">
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
            <el-form-item label="会员类型" prop="memberType">
              <el-select
                v-model="queryParams.memberType"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option
                  v-for="item in getDictOptions('MemberType')"
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

          <el-col :span="6">
            <el-form-item label="手机号" prop="phoneNumber">
              <el-input
                v-model="queryParams.phoneNumber"
                placeholder="请输入手机号"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
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
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />

        <el-table-column label="用户名" prop="username" width="120" align="center" />
        <el-table-column label="手机号" prop="phoneNumber" width="130" align="center" />

        <el-table-column label="会员类型" prop="memberType" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.memberType === '1' ? 'warning' : ''">
              {{ getDictLabel('MemberType', row.memberType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="会员状态" prop="memberStat" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getMemberStatTag(row.memberStat)" size="small">
              {{ getDictLabel('MemberStat', row.memberStat) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="聊天内容" prop="content" min-width="200" show-overflow-tooltip />

        <el-table-column label="所属直播" prop="matchTitle" width="150" align="center" show-overflow-tooltip />

        <el-table-column label="状态" prop="disabled" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
              {{ row.disabled ? '禁用' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="warning"
              link
              size="small"
              @click="handleToggleDisabled(row)"
            >
              {{ row.disabled ? '启用' : '禁用' }}
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  memberType: '',
  username: '',
  phoneNumber: '',
  page: 1,
  pageSize: 10
})

// 📄 分页参数
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const queryFormRef = ref()

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      memberType: queryParams.memberType || undefined,
      username: queryParams.username || undefined,
      phoneNumber: queryParams.phoneNumber || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/liveChat/page.do', payload)
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

// 🔄 重置查询
const handleReset = () => {
  queryFormRef.value?.resetFields()
  pagination.page = 1
  handleQuery()
}

// 🏷️ 辅助方法：会员状态标签颜色
const getMemberStatTag = (stat) => {
  const map = { '0': 'success', '1': 'warning', '2': 'danger', '3': 'info' }
  return map[stat] || 'info'
}

// ⚡ 启/禁用单条记录
const handleToggleDisabled = async (row) => {
  const action = row.disabled ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定要${action}该聊天记录吗？`, '提示', { type: 'warning' })
    await request.post('/liveChat/toggleDisabled.do', { id: row.id })
    ElMessage.success(`${action}成功`)
    handleQuery()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败：` + (error.message || '未知错误'))
    }
  }
}

// 🗑️ 删除记录
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除该聊天记录吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await request.post('/liveChat/delete.do', { id: row.id })
    ElMessage.success('删除成功')
    handleQuery()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.live-chat-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
}
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
</style>
