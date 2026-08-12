<template>
  <div class="card-asset-container">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline label-width="120px">
        <el-form-item label="会员账号">
          <el-input
            v-model="searchForm.username"
            placeholder="请输入会员账号"
            clearable
            style="width: 200px;"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="searchForm.phoneNumber"
            placeholder="请输入手机号"
            clearable
            style="width: 200px;"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="免费抽卡次数">
          <el-input-number
            v-model="searchForm.freeTimes"
            placeholder="大于等于该次数"
            :min="0"
            controls-position="right"
            style="width: 200px;"
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
          <span>会员球星卡资产列表</span>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="username" label="会员账号" min-width="120" show-overflow-tooltip />
        <el-table-column prop="phoneNumber" label="手机号" min-width="130" show-overflow-tooltip />

        <el-table-column prop="freeTimes" label="免费抽卡次数" width="130" align="center">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain">{{ row.freeTimes ?? 0 }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="dealTimes" label="交易成功次数" width="130" align="center" />
        <el-table-column prop="soldCardTimes" label="卡片出售次数" width="130" align="center" />

        <el-table-column prop="disabled" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="isDisabled(row.disabled) ? 'danger' : 'success'">
              {{ isDisabled(row.disabled) ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createAt" label="创建时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="warning" link :icon="Edit" @click="openChangeDialog(row)">
              调整次数
            </el-button>
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

    <!-- 调整抽卡次数弹窗 -->
    <el-dialog v-model="changeDialogVisible" title="调整抽卡次数" width="450px" destroy-on-close>
      <el-form :model="changeForm" label-width="120px" :rules="changeRules" ref="changeFormRef">
        <el-form-item label="当前免费次数">
          <el-input :model-value="currentRow.freeTimes" disabled style="width: 200px;" />
        </el-form-item>
        <el-form-item label="调整数量" prop="times">
          <el-input-number
            v-model="changeForm.times"
            :precision="0"
            controls-position="right"
            style="width: 200px;"
          />
          <div class="form-tip">提示：输入正数表示增加，输入负数表示减少</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="changeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="changeLoading" @click="submitChange">确定提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Edit } from '@element-plus/icons-vue'
import request from '@/utils/request' // ⚠️ 请根据实际路径调整
import { formatDateTime } from '@/utils/format' // ⚠️ 请根据实际路径调整

// ================= 列表与搜索状态 =================
const loading = ref(false)
const tableData = ref([])
const searchForm = reactive({
  username: '',
  phoneNumber: '',
  freeTimes: undefined // 使用 undefined 避免传 null 或 0 导致后端查询异常
})
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

// ================= 辅助函数 =================
// 兼容后端 disabled 字段可能是 boolean 或 0/1 数字/字符串的情况
const isDisabled = (val) => val === 1 || val === '1' || val === true

// ================= 核心列表方法 =================
const fetchData = async () => {
  loading.value = true
  try {
    // 过滤掉空值，避免给后端传递无意义的空字符串
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    if (!params.username) delete params.username
    if (!params.phoneNumber) delete params.phoneNumber
    if (params.freeTimes === undefined || params.freeTimes === null) delete params.freeTimes

    // 严格使用接口返回结构 res.list 和 res.total
    const res = await request.post('/cardAsset/page.do', params)
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.page = 1; fetchData() }
const handleReset = () => {
  searchForm.username = '';
  searchForm.phoneNumber = '';
  searchForm.freeTimes = undefined;
  handleSearch()
}
const handleSizeChange = (val) => { pagination.pageSize = val; fetchData() }
const handleCurrentChange = (val) => { pagination.page = val; fetchData() }

// ================= 调整抽卡次数功能 =================
const changeDialogVisible = ref(false)
const changeLoading = ref(false)
const changeFormRef = ref(null)
const currentRow = ref({})
const changeForm = reactive({ id: null, times: 0 })
const changeRules = {
  times: [{ required: true, message: '请输入调整数量', trigger: 'blur' }]
}

const openChangeDialog = (row) => {
  currentRow.value = row
  changeForm.id = row.id
  changeForm.times = 0 // 默认重置为 0，让用户自己输入正负数
  changeDialogVisible.value = true
}

const submitChange = async () => {
  if (!changeFormRef.value) return
  await changeFormRef.value.validate()

  if (changeForm.times === 0) {
    return ElMessage.warning('调整数量不能为 0')
  }

  changeLoading.value = true
  try {
    // 严格按照 Swagger 的 ChangeFreeTimesForm 结构提交 Body
    await request.post('/cardAsset/changeFreeTimes.do', {
      id: changeForm.id,
      times: changeForm.times
    })

    ElMessage.success('调整成功')
    changeDialogVisible.value = false
    fetchData() // 刷新列表
  } catch (e) {
    console.error(e)
  } finally {
    changeLoading.value = false
  }
}

// ================= 生命周期 =================
onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.card-asset-container {
  padding: 20px;

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

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    line-height: 1.5;
  }
}
</style>
