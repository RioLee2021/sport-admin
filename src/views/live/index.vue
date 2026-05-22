<template>
  <div class="live-container">
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
            <el-form-item label="直播状态" prop="liveStat">
              <el-select
                v-model="queryParams.liveStat"
                placeholder="请选择状态"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option
                  v-for="item in getDictOptions('LiveStat')"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="赛事" prop="matchId">
              <el-select
                v-model="queryParams.matchId"
                placeholder="请选择赛事"
                clearable
                filterable
                style="width: 100%; min-width: 120px"
              >
                <el-option-group
                  v-for="group in matchDict"
                  :key="group.dictName"
                  :label="group.dictName"
                >
                  <el-option
                    v-for="item in group.items"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="主播" prop="streamerId">
              <el-select
                v-model="queryParams.streamerId"
                placeholder="请选择主播"
                clearable
                filterable
                style="width: 100%; min-width: 120px"
              >
                <el-option
                  v-for="item in streamerOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="是否推荐" prop="recommendFlag">
              <el-select
                v-model="queryParams.recommendFlag"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
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

    <!-- 📋 表格区域 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">直播数据列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增直播</el-button>
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

        <el-table-column label="赛事" prop="matchId" width="180" align="center">
          <template #default="{ row }">{{ getMatchTitle(row.matchId) }}</template>
        </el-table-column>

        <el-table-column label="主播" prop="streamerId" width="120" align="center">
          <template #default="{ row }">{{ getStreamerName(row.streamerId) }}</template>
        </el-table-column>

        <el-table-column label="直播状态" prop="liveStat" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatTagType(row.liveStat)">
              {{ getDictLabel('LiveStat', row.liveStat) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="是否推荐" prop="recommendFlag" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.recommendFlag ? 'success' : 'info'">
              {{ row.recommendFlag ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="观看人数" prop="viewNum" width="100" align="center" />
        <el-table-column label="源数量" prop="sourceCnt" width="90" align="center" />
        <el-table-column label="聊天数" prop="chatCnt" width="90" align="center" />

        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>
        <el-table-column label="更新时间" prop="updateAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.updateAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="info" link size="small" @click="handleViewChat(row)">聊天记录</el-button>
            <el-button type="warning" link size="small" @click="handleViewSource(row)">直播源</el-button>
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

    <!-- ✏️ 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑直播' : '新增直播'"
      width="600px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="110px"
        label-position="right"
      >
        <!-- 赛事下拉（分组展示） -->
        <el-form-item label="赛事" prop="matchId" v-if="!isEdit">
          <el-select
            v-model="form.matchId"
            placeholder="请选择赛事"
            filterable
            style="width: 100%"
          >
            <el-option-group
              v-for="group in matchDict"
              :key="group.dictName"
              :label="group.dictName"
            >
              <el-option
                v-for="item in group.items"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-option-group>
          </el-select>
        </el-form-item>

        <el-form-item label="主播" prop="streamerId" v-if="!isEdit">
          <el-select
            v-model="form.streamerId"
            placeholder="请选择主播"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in streamerOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="直播状态" prop="liveStat">
              <el-select v-model="form.liveStat" placeholder="请选择状态" style="width: 100%">
                <el-option
                  v-for="item in getDictOptions('LiveStat')"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否推荐" prop="recommendFlag">
              <el-switch v-model="form.recommendFlag" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 新增时填写随机观看数区间 -->
        <el-row :gutter="20" v-if="!isEdit">
          <el-col :span="12">
            <el-form-item label="最小观看数" prop="viewNumMin">
              <el-input-number
                v-model="form.viewNumMin"
                :min="0"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大观看数" prop="viewNumMax">
              <el-input-number
                v-model="form.viewNumMax"
                :min="0"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 编辑时直接修改观看数 -->
        <el-form-item label="观看人数" prop="viewNum" v-if="isEdit">
          <el-input-number
            v-model="form.viewNum"
            :min="0"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  liveStat: '',
  matchId: undefined,
  streamerId: undefined,
  recommendFlag: undefined,
  page: 1,
  pageSize: 10
})

// 📄 分页参数
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const queryFormRef = ref()

// 📥 下拉数据
const matchDict = ref([])  // ✅ 赛事字典（按联赛分组）
const streamerOptions = ref([])

// ✏️ 对话框状态
const dialogVisible = ref(false)
const formRef = ref()
const submitLoading = ref(false)
const isEdit = ref(false)

const form = reactive({
  id: null,
  matchId: undefined,
  streamerId: undefined,
  liveStat: '0',
  recommendFlag: false,
  viewNumMin: 0,
  viewNumMax: 0,
  viewNum: 0
})

// 校验规则（根据 AddForm / EditForm 动态生成）
const rules = computed(() => {
  const base = {
    liveStat: [{ required: true, message: '请选择直播状态', trigger: 'change' }],
    recommendFlag: [{ required: true, message: '请设置是否推荐', trigger: 'change' }]
  }
  if (!isEdit.value) {
    base.matchId = [{ required: true, message: '请选择赛事', trigger: 'change' }]
    base.streamerId = [{ required: true, message: '请选择主播', trigger: 'change' }]
    base.viewNumMin = [{ required: true, message: '请输入最小观看数', trigger: 'blur' }]
    base.viewNumMax = [{ required: true, message: '请输入最大观看数', trigger: 'blur' }]
  } else {
    base.viewNum = [{ required: true, message: '请输入观看人数', trigger: 'blur' }]
  }
  return base
})

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      liveStat: queryParams.liveStat || undefined,
      matchId: queryParams.matchId,
      streamerId: queryParams.streamerId,
      recommendFlag: queryParams.recommendFlag,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/live/page.do', payload)
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

const handleReset = () => {
  queryFormRef.value?.resetFields()
  pagination.page = 1
  handleQuery()
}

// 📥 初始化下拉数据
const fetchMatchDict = async () => {
  try {
    const res = await request.post('/live/matchDict.do', {})
    matchDict.value = res.data || []
  } catch (e) { console.error('获取赛事字典失败', e) }
}

const fetchStreamers = async () => {
  try {
    const res = await request.post('/live/allStreamer.do', {})
    streamerOptions.value = res.data || []
  } catch (e) { console.error('获取主播失败', e) }
}

// 🏷️ 辅助方法
const getStreamerName = (id) => {
  const item = streamerOptions.value.find(s => s.value === id)
  return item ? item.label : (id || '-')
}

const getMatchTitle = (id) => {
  // 遍历分组字典查找赛事名称
  for (const group of matchDict.value) {
    const item = group.items?.find(m => m.value === id)
    if (item) return item.label
  }
  return id || '-'
}

const getStatTagType = (stat) => {
  const map = { '0': 'info', '1': 'success', '2': 'warning' }
  return map[stat] || 'info'
}

// ✏️ 表单操作
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null, matchId: undefined, streamerId: undefined,
    liveStat: '0', recommendFlag: false, viewNumMin: 0, viewNumMax: 0, viewNum: 0
  })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

// 💾 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      const payload = isEdit.value
        ? { id: form.id, liveStat: form.liveStat, recommendFlag: form.recommendFlag, viewNum: form.viewNum }
        : {
          matchId: form.matchId,
          streamerId: form.streamerId,
          liveStat: form.liveStat,
          recommendFlag: form.recommendFlag,
          viewNumMin: form.viewNumMin,
          viewNumMax: form.viewNumMax
        }

      await request.post(isEdit.value ? '/live/edit.do' : '/live/add.do', payload)
      ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
      dialogVisible.value = false
      handleQuery()
    } catch (error) {
      ElMessage.error((isEdit.value ? '修改' : '新增') + '失败：' + (error.message || '未知错误'))
    } finally {
      submitLoading.value = false
    }
  })
}

// 🗑️ 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除该直播数据吗？此操作不可恢复！`, '警告', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(async () => {
    try {
      await request.post('/live/delete.do', { id: row.id })
      ElMessage.success('删除成功')
      handleQuery()
    } catch (error) {
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 👁️ 查看聊天记录 / 直播源（占位）
const handleViewChat = (row) => {
  ElMessage.info(`查看直播 ${row.id} 的聊天记录`)
}
const handleViewSource = (row) => {
  ElMessage.info(`查看直播 ${row.id} 的直播源`)
}

onMounted(() => {
  fetchMatchDict()  // ✅ 加载分组赛事字典
  fetchStreamers()
  handleQuery()
})
</script>

<style scoped lang="scss">
.live-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
</style>
