<template>
  <div class="live-source-container">
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
            <el-form-item label="所属直播" prop="liveId">
              <el-select
                v-model="queryParams.liveId"
                placeholder="请选择直播"
                filterable
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option
                  v-for="item in liveOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="视频状态" prop="videoStat">
              <el-select
                v-model="queryParams.videoStat"
                placeholder="请选择状态"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option
                  v-for="item in getDictOptions('VideoStat')"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="视频URL" prop="videoUrl">
              <el-input
                v-model="queryParams.videoUrl"
                placeholder="请输入视频URL"
                clearable
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
      <template #header>
        <div class="card-header">
          <span class="title">直播源列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增直播源</el-button>
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

        <el-table-column label="赛事" prop="liveTitle" width="200" show-overflow-tooltip />
        <el-table-column label="开赛" prop="startTime" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.startTime) }}</template>
        </el-table-column>
        <el-table-column label="完结" prop="endTime" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.endTime) }}</template>
        </el-table-column>
        <el-table-column label="会员信息" prop="memberTitle" width="180" show-overflow-tooltip />

        <el-table-column label="视频URL" prop="videoUrl" min-width="200" show-overflow-tooltip />

        <el-table-column label="视频状态" prop="videoStat" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.videoStat === '1' ? 'success' : 'danger'">
              {{ getDictLabel('VideoStat', row.videoStat) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>
        <el-table-column label="更新时间" prop="updateAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.updateAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
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
      :title="isEdit ? '编辑直播源' : '新增直播源'"
      width="600px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="所属直播" prop="liveId">
          <el-select
            v-model="form.liveId"
            placeholder="请选择直播"
            filterable
            :disabled="isEdit"
            style="width: 100%"
          >
            <el-option
              v-for="item in liveOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="视频URL" prop="videoUrl">
          <el-input
            v-model="form.videoUrl"
            placeholder="请输入视频URL"
            clearable
          />
        </el-form-item>

        <el-form-item label="视频状态" prop="videoStat">
          <el-radio-group v-model="form.videoStat">
            <el-radio
              v-for="item in getDictOptions('VideoStat')"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  liveId: undefined,
  videoStat: '',
  videoUrl: '',
  page: 1,
  pageSize: 10
})

// 📄 分页参数
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const queryFormRef = ref()

// 📥 下拉数据
const liveOptions = ref([])

// ✏️ 对话框状态
const dialogVisible = ref(false)
const formRef = ref()
const submitLoading = ref(false)
const isEdit = ref(false)

const form = reactive({
  id: null,
  liveId: undefined,
  videoUrl: '',
  videoStat: '0'
})

// 校验规则
const rules = {
  liveId: [{ required: true, message: '请选择所属直播', trigger: 'change' }],
  videoUrl: [{ required: true, message: '请输入视频URL', trigger: 'blur' }],
  videoStat: [{ required: true, message: '请选择视频状态', trigger: 'change' }]
}

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      liveId: queryParams.liveId,
      videoStat: queryParams.videoStat || undefined,
      videoUrl: queryParams.videoUrl || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/liveSource/page.do', payload)
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
const fetchLiveDict = async () => {
  try {
    const res = await request.post('/liveSource/liveDict.do', {})
    liveOptions.value = res.data || []
  } catch (e) { console.error('获取直播字典失败', e) }
}

// ✏️ 表单操作
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, { id: null, liveId: undefined, videoUrl: '', videoStat: '0' })
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
      const payload = {
        id: form.id,
        liveId: form.liveId,
        videoUrl: form.videoUrl,
        videoStat: form.videoStat
      }
      await request.post(isEdit.value ? '/liveSource/edit.do' : '/liveSource/add.do', payload)
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
  ElMessageBox.confirm(`确定要删除该直播源吗？此操作不可恢复！`, '警告', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(async () => {
    try {
      await request.post('/liveSource/delete.do', { id: row.id })
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

onMounted(() => {
  fetchLiveDict()
  handleQuery()
})
</script>

<style scoped lang="scss">
.live-source-container { padding: 20px; }
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
