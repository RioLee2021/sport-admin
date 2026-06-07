<template>
  <div class="gift-record-container">
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
            <el-form-item label="礼物编号" prop="giftCode">
              <el-input v-model="queryParams.giftCode" placeholder="请输入礼物编号" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="礼物类型" prop="giftType">
              <el-select
                v-model="queryParams.giftType"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option
                  v-for="item in getDictOptions('GiftType')"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="订单编号" prop="orderNo">
              <el-input v-model="queryParams.orderNo" placeholder="请输入订单编号" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="会员手机号" prop="phoneNumber">
              <el-input v-model="queryParams.phoneNumber" placeholder="请输入手机号" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="库存编号" prop="stockNo">
              <el-input v-model="queryParams.stockNo" placeholder="请输入库存编号" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="状态" prop="stat">
              <el-select
                v-model="queryParams.stat"
                placeholder="请选择"
                clearable
                style="width: 100%; min-width: 120px"
              >
                <el-option
                  v-for="item in getDictOptions('GiftRecordStat')"
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
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="订单号" prop="orderNo" width="160" show-overflow-tooltip />
        <el-table-column label="礼物编号" prop="giftCode" width="120" align="center" />
        <el-table-column label="礼物说明" prop="giftInfo" min-width="150" show-overflow-tooltip />
        <el-table-column label="库存编号" prop="stockNo" width="130" align="center" />
        <el-table-column label="会员名称" prop="username" width="120" align="center" />
        <el-table-column label="手机号" prop="phoneNumber" width="130" align="center" />
        <el-table-column label="价格" prop="price" width="100" align="center">
          <template #default="{ row }">{{ row.price }} 金币</template>
        </el-table-column>
        <el-table-column label="状态" prop="stat" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatTag(row.stat)" size="small">
              {{ getDictLabel('GiftRecordStat', row.stat) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="120" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link size="small" @click="openActionDialog(row, 'deliver')">发货</el-button>
            <el-button type="danger" link size="small" @click="openActionDialog(row, 'cancel')">取消发货</el-button>
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

    <!-- 📦 发货/取消发货 对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="actionType === 'deliver' ? '发货确认' : '取消发货确认'"
      width="450px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form ref="actionFormRef" :model="actionForm" :rules="actionRules" label-width="80px">
        <el-form-item label="订单号">
          <el-input v-model="actionForm.orderNo" disabled />
        </el-form-item>
        <el-form-item label="操作备注" prop="remark">
          <el-input
            v-model="actionForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入发货或取消原因"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleActionSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
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

// 🔍 查询参数
const queryParams = reactive({
  giftCode: '',
  giftType: '',
  orderNo: '',
  phoneNumber: '',
  stockNo: '',
  stat: '',
  page: 1,
  pageSize: 10
})
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const queryFormRef = ref()

// 📦 操作对话框状态
const dialogVisible = ref(false)
const actionFormRef = ref()
const submitLoading = ref(false)
const actionType = ref('deliver') // 'deliver' | 'cancel'
const actionForm = reactive({ id: null, orderNo: '', remark: '' })
const actionRules = {
  remark: [{ required: true, message: '请输入操作备注', trigger: 'blur' }]
}

// 🏷️ 状态标签颜色映射（可根据实际业务调整）
const getStatTag = (stat) => {
  const map = { '0': 'info', '1': 'success', '2': 'warning', '3': 'danger' }
  return map[stat] || 'info'
}

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      giftCode: queryParams.giftCode || undefined,
      giftType: queryParams.giftType || undefined,
      orderNo: queryParams.orderNo || undefined,
      phoneNumber: queryParams.phoneNumber || undefined,
      stockNo: queryParams.stockNo || undefined,
      stat: queryParams.stat || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
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

// 🔄 重置查询
const handleReset = () => {
  queryFormRef.value?.resetFields()
  pagination.page = 1
  handleQuery()
}

// 📦 打开操作弹窗
const openActionDialog = (row, type) => {
  actionType.value = type
  Object.assign(actionForm, { id: row.id, orderNo: row.orderNo, remark: '' })
  dialogVisible.value = true
  setTimeout(() => actionFormRef.value?.clearValidate(), 100)
}

// 💾 提交发货/取消
const handleActionSubmit = async () => {
  if (!actionFormRef.value) return
  await actionFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      const api = actionType.value === 'deliver' ? '/giftRecord/delivered.do' : '/giftRecord/cancel.do'
      // 严格遵循 BaseRemarkForm 定义：id + remark
      await request.post(api, { id: actionForm.id, remark: actionForm.remark })
      ElMessage.success(actionType.value === 'deliver' ? '发货成功' : '已取消发货')
      dialogVisible.value = false
      handleQuery()
    } catch (error) {
      ElMessage.error('操作失败：' + (error.message || '未知错误'))
    } finally {
      submitLoading.value = false
    }
  })
}

const handleDialogClose = () => {
  actionFormRef.value?.resetFields()
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.gift-record-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card { :deep(.el-card__body) { padding: 20px; } }
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
</style>
