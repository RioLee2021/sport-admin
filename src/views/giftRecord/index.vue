<template>
  <div class="gift-record-container">
    <!-- 🔍 查询表单 -->
    <el-card class="search-card" shadow="hover">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="100px"
               @submit.prevent>
        <el-row :gutter="20">
          <el-col :span="4">
            <el-form-item label="订单编号" prop="orderNo">
              <el-input v-model="queryParams.orderNo" placeholder="请输入" clearable
                        @keyup.enter="handleQuery"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="手机号/账号" prop="phoneNumber">
              <el-input v-model="queryParams.phoneNumber" placeholder="请输入" clearable
                        @keyup.enter="handleQuery"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="关联账号" prop="giftCode">
              <el-input v-model="queryParams.giftCode" placeholder="请输入" clearable
                        @keyup.enter="handleQuery"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="备注模糊查询" prop="stockNo">
              <el-input v-model="queryParams.stockNo" placeholder="请输入" clearable
                        @keyup.enter="handleQuery"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="礼物类型" prop="giftType">
              <el-select v-model="queryParams.giftType" placeholder="请选择" clearable
                         style="width: 100%; min-width: 120px">
                <el-option v-for="item in getDictOptions('GiftType')" :key="item.value"
                           :label="item.label" :value="item.value"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="状态" prop="stat">
              <el-select v-model="queryParams.stat" placeholder="请选择" clearable
                         style="width: 100%; min-width: 120px">
                <el-option v-for="item in getDictOptions('GiftRecordStat')" :key="item.value"
                           :label="item.label" :value="item.value"/>
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
          <span class="title">兑换记录列表</span>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="orderNo" label="订单号" width="180" show-overflow-tooltip/>
        <el-table-column prop="username" label="会员账号" width="120" show-overflow-tooltip/>
        <el-table-column prop="giftValue" label="礼物价值" width="100" align="right"/>
        <el-table-column prop="relatedAccount" label="关联账号" width="120" show-overflow-tooltip/>
        <el-table-column prop="giftType" label="礼物类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getDictLabel('GiftType', row.giftType) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="stat" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatTagType(row.stat)" size="small">
              {{ getDictLabel('GiftRecordStat', row.stat) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" width="120" show-overflow-tooltip/>

        <el-table-column prop="createAt" label="创建时间" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <!-- ✅ 操作列：发货/退货/取消 + 查看相关账号 -->
        <el-table-column label="操作" width="320" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="warning" link size="small" @click="openDialog('deliver', row)">发货
            </el-button>
            <el-button type="danger" link size="small" @click="openDialog('refund', row)">退货
            </el-button>
            <el-button type="info" link size="small" @click="openDialog('cancel', row)">取消
            </el-button>
            <el-divider direction="vertical"/>
            <el-button type="primary" link size="small" @click="submitRollback(row)">回退</el-button>
            <el-button type="primary" link size="small" @click="openOtherAccountDialog(row)">
              查看相关账号
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- ✏️ 统一操作对话框（发货/退货/取消） -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px"
               :close-on-click-modal="false" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <template v-if="actionType === 'deliver'">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注信息"
                      clearable/>
          </el-form-item>
        </template>
        <template v-if="['refund', 'cancel'].includes(actionType)">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注信息"
                      clearable/>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 👥 查看相关账号对话框 -->
    <el-dialog
      v-model="otherAccountVisible"
      title="相关账号列表"
      width="500px"
      :close-on-click-modal="false"
      @close="handleOtherAccountClose"
    >
      <el-table
        v-loading="otherAccountLoading"
        :data="otherAccountList"
        border
        stripe
        style="width: 100%"
        :height="300"
      >
        <el-table-column type="index" label="序号" width="60" align="center"/>
        <el-table-column prop="account" label="账号" min-width="150" show-overflow-tooltip/>
        <el-table-column prop="accountType" label="账号类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getAccountTypeTag(row.accountType)">
              {{ getDictLabel('OtherAcctType', row.accountType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createAt" label="绑定时间" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>
        <el-table-column prop="disabled" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="otherAccountVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, reactive, computed, onMounted} from 'vue'
import {ElMessage,ElMessageBox} from 'element-plus'
import {Search, Refresh} from '@element-plus/icons-vue'
import request from '@/utils/request'
import {getDictOptions, getDictLabel} from '@/utils/dict'

const tableData = ref([])
const loading = ref(false)

const queryParams = reactive({
  orderNo: '',
  phoneNumber: '',
  giftCode: '',
  stockNo: '',
  giftType: '',
  stat: 1,
  page: 1,
  pageSize: 20
})
const pagination = reactive({page: 1, pageSize: 20, total: 0})
const queryFormRef = ref()

// ✏️ 操作对话框状态
const dialogVisible = ref(false)
const actionType = ref('')
const submitLoading = ref(false)
const formRef = ref()
const form = reactive({id: null, remark: ''})

const dialogTitle = computed(() => ({
  deliver: '发货',
  refund: '退货',
  cancel: '取消发货'
}[actionType.value] || ''))

const formRules = computed(() => {
  const rules = {}
  rules.remark = [{required: true, message: '请输入备注', trigger: 'blur'}]
  return rules
})

// 👥 相关账号对话框状态
const otherAccountVisible = ref(false)
const otherAccountLoading = ref(false)
const otherAccountList = ref([])
const currentRecordId = ref(null)

const getStatTagType = (stat) => {
  const map = {
    '0': 'info',
    '1': 'success',
    '2': 'warning',
    '3': 'primary',
    '4': 'danger',
    '5': 'danger',
    '6': 'info'
  }
  return map[stat] || 'info'
}

const getAccountTypeTag = (type) => {
  const map = {'0': 'info', '1': 'success', '2': 'warning', '3': 'danger'}
  return map[type] || 'info'
}

const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      orderNo: queryParams.orderNo || undefined,
      phoneNumber: queryParams.phoneNumber || undefined,
      giftCode: queryParams.giftCode || undefined,
      stockNo: queryParams.stockNo || undefined,
      giftType: queryParams.giftType || undefined,
      stat: queryParams.stat || undefined,
      page: pagination.page, pageSize: pagination.pageSize
    }
    const res = await request.post('/giftRecord/page.do', payload)
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

const openDialog = (type, row) => {
  actionType.value = type
  Object.assign(form, {id: row.id, remark: ''})
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      let api = '', payload = {}
      if (actionType.value === 'deliver') {
        api = '/giftRecord/delivered.do'
        payload = {id: form.id, remark: form.remark, documentUrl: 'undefined'}
      } else if (actionType.value === 'refund') {
        api = '/giftRecord/refunded.do'
        payload = {id: form.id, remark: form.remark}
      } else if (actionType.value === 'cancel') {
        api = '/giftRecord/cancel.do'
        payload = {id: form.id, remark: form.remark}
      }
      await request.post(api, payload)
      ElMessage.success('操作成功')
      dialogVisible.value = false
      handleQuery()
    } catch (error) {
      ElMessage.error('操作失败：' + (error.message || '未知错误'))
    } finally {
      submitLoading.value = false
    }
  })
}

const submitRollback = async (row) => {
  try {
    ElMessageBox.confirm('确定要回退吗？此操作不可恢复！', '警告', {type: 'warning'}).then(async () => {
      await request.post('/giftRecord/cancelBind.do', {id: row.id})
      ElMessage.success('操作成功')
      handleQuery()
    })
  } catch (e) {
    ElMessage.error('操作失败：' + (e.message || '未知错误'))
  }
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 👥 查看相关账号
const openOtherAccountDialog = async (row) => {
  currentRecordId.value = row.id
  otherAccountLoading.value = true
  otherAccountList.value = []
  otherAccountVisible.value = true

  try {
    const res = await request.post('/giftRecord/otherAccount.do', {id: row.id})
    otherAccountList.value = res.data || []
    if (otherAccountList.value.length === 0) {
      ElMessage.info('暂无相关账号')
    }
  } catch (error) {
    ElMessage.error('获取失败：' + (error.message || '未知错误'))
  } finally {
    otherAccountLoading.value = false
  }
}

const handleOtherAccountClose = () => {
  otherAccountList.value = []
  currentRecordId.value = null
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.gift-record-container {
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
