<template>
  <div class="push-notify-container">
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
              <el-input v-model="queryParams.notificationNo" placeholder="请输入推送编号" clearable
                        @keyup.enter="handleQuery"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="推送类型" prop="notificationsType">
              <el-select
                v-model="queryParams.notificationsType"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 140px"
              >
                <el-option
                  v-for="item in getDictOptions('NotificationsType')"
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
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 📋 表格区域 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">推送通知列表</span>
          <div>
            <el-button type="primary" :icon="Plus" @click="openDialog('add')">新增广播</el-button>
            <el-button type="warning" :icon="Promotion" @click="openDialog('zombie')">发给僵尸号
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center"/>
        <el-table-column prop="notificationsNo" label="推送编号" width="180" show-overflow-tooltip/>
        <el-table-column prop="notificationTitle" label="推送标题" min-width="150"
                         show-overflow-tooltip/>
        <el-table-column prop="notificationContent" label="推送内容" min-width="200"
                         show-overflow-tooltip/>

        <el-table-column prop="notificationsType" label="推送类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{
                getDictLabel('NotificationsType', row.notificationsType)
              }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="clickAction" label="点击动作" width="120" show-overflow-tooltip/>
        <el-table-column prop="arriveCnt" label="到达数" width="80" align="center"/>
        <el-table-column prop="clickCnt" label="点击数" width="80" align="center"/>

        <el-table-column prop="disabled" label="状态" width="80" align="center">
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

        <!-- ✅ 操作列：查询到达 -->
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleQueryArrival(row)">查询到达
            </el-button>
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

    <!-- ✏️ 新增广播 / 发给僵尸号 统一对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="520px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="推送类型" prop="notificationsType">
          <el-select
            v-model="form.notificationsType"
            placeholder="请选择"
            clearable
            style="width: 100%; min-width: 140px"
          >
            <el-option
              v-for="item in getDictOptions('NotificationsType')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="推送标题" prop="notificationTitle">
          <el-input v-model="form.notificationTitle" placeholder="请输入推送标题" clearable/>
        </el-form-item>
        <el-form-item label="推送内容" prop="notificationContent">
          <el-input v-model="form.notificationContent" type="textarea" :rows="3"
                    placeholder="请输入推送内容" clearable/>
        </el-form-item>
        <el-form-item label="点击动作" prop="clickAction">
          <el-input v-model="form.clickAction" placeholder="请输入点击跳转链接或动作标识" clearable/>
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
import {ref, reactive, computed, onMounted} from 'vue'
import {useRouter} from 'vue-router'
import {ElMessage} from 'element-plus'
import {Search, Refresh, Plus, Promotion} from '@element-plus/icons-vue'
import request from '@/utils/request'
import {getDictOptions, getDictLabel} from '@/utils/dict'

const router = useRouter()
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数 (严格对照 分页请求参数_30)
const queryParams = reactive({
  notificationNo: '',
  notificationsType: '',
  page: 1,
  pageSize: 20
})
const pagination = reactive({page: 1, pageSize: 20, total: 0})
const queryFormRef = ref()

// ✏️ 对话框状态
const dialogVisible = ref(false)
const dialogMode = ref('add') // 'add' | 'zombie'
const submitLoading = ref(false)
const formRef = ref()
const form = reactive({
  notificationTitle: '',
  notificationContent: '',
  clickAction: '',
  notificationsType: 0
})

const dialogTitle = computed(() => dialogMode.value === 'add' ? '新增广播' : '发给僵尸号')

const formRules = {
  notificationTitle: [{required: true, message: '请输入推送标题', trigger: 'blur'}],
  notificationContent: [{required: true, message: '请输入推送内容', trigger: 'blur'}],
  clickAction: [{required: true, message: '请输入点击动作', trigger: 'blur'}]
}

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      notificationNo: queryParams.notificationNo || undefined,
      notificationsType: queryParams.notificationsType || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/pushNotify/page.do', payload)
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

// 📥 打开对话框
const openDialog = (mode) => {
  dialogMode.value = mode
  Object.assign(form, {notificationTitle: '', notificationContent: '', clickAction: ''})
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
      const api = dialogMode.value === 'add' ? '/pushNotify/add.do' : '/pushNotify/pushZombie.do'
      await request.post(api, {...form})
      ElMessage.success(dialogMode.value === 'add' ? '新增成功' : '推送任务已下发')
      dialogVisible.value = false
      handleQuery()
    } catch (error) {
      ElMessage.error('操作失败：' + (error.message || '未知错误'))
    } finally {
      submitLoading.value = false
    }
  })
}

// 🔗 查询到达：携带推送编号跳转至到达日志页面
const handleQueryArrival = (row) => {
  // ⚠️ 请根据实际路由配置调整 path 路径，例如：'/arriveLog' 或 '/pushArrival'
  router.push({
    path: '/arriveLog',
    query: {notificationNo: row.notificationsNo}
  })
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.push-notify-container {
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
    flex-wrap: wrap;
    gap: 10px;

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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
