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
              <el-select v-model="queryParams.giftType" placeholder="请选择" clearable style="width: 100%; min-width: 120px">
                <el-option v-for="item in getDictOptions('GiftType')" :key="item.value" :label="item.label" :value="item.value" />
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
              <el-select v-model="queryParams.stat" placeholder="请选择" clearable style="width: 100%; min-width: 120px">
                <el-option v-for="item in getDictOptions('GiftRecordStat')" :key="item.value" :label="item.label" :value="item.value" />
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
          <div class="header-actions">
            <!-- ✅ 新增：校验票据按钮 -->
            <el-button type="info" :icon="Key" @click="openValidDialog">校验票据</el-button>
          </div>
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
        <el-table-column label="订单号" prop="orderNo" width="160" show-overflow-tooltip />
        <el-table-column label="礼物编号" prop="giftCode" width="120" align="center" />
        <el-table-column label="礼物说明" prop="giftInfo" min-width="150" show-overflow-tooltip />
        <el-table-column label="价格" prop="price" width="100" align="center">
          <template #default="{ row }">{{ row.price }} 金币</template>
        </el-table-column>
        <el-table-column label="面值" prop="giftValue" width="100" align="center">
          <template #default="{ row }">{{ row.giftValue }} THB</template>
        </el-table-column>
        <el-table-column label="库存编号" prop="stockNo" width="130" align="center" />
        <el-table-column label="会员名称" prop="username" width="120" align="center" />
        <el-table-column label="手机号" prop="phoneNumber" width="130" align="center" />
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
        <!-- ✅ 操作列增加退货按钮 -->
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link size="small" @click="openActionDialog(row, 'deliver')">发货</el-button>
            <el-button type="warning" link size="small" @click="openActionDialog(row, 'cancel')">取消发货</el-button>
            <el-button type="danger" link size="small" @click="openActionDialog(row, 'refund')">退货</el-button>
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

    <!-- 📝 发货/取消/退货 统一备注弹窗 -->
    <el-dialog
      v-model="actionDialogVisible"
      :title="actionTitle"
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
            placeholder="请输入备注说明"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="actionDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleActionSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 🔑 校验票据对话框 (修正版) -->
    <el-dialog
      v-model="validDialogVisible"
      title="校验票据"
      width="550px"
      :close-on-click-modal="false"
      @close="handleValidDialogClose"
    >
      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 16px"
        show-icon
      >
        提示：输入单号、内容和手机号进行票据校验
      </el-alert>

      <!-- 校验输入表单 -->
      <el-form
        v-if="!validResult"
        ref="validFormRef"
        :model="validForm"
        :rules="validRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="单号" prop="orderNo">
          <el-input
            v-model="validForm.orderNo"
            placeholder="请输入订单编号"
            clearable
          />
        </el-form-item>
        <el-form-item label="礼物内容" prop="giftContent">
          <el-input
            v-model="validForm.giftContent"
            type="textarea"
            :rows="3"
            placeholder="请输入礼物内容"
            clearable
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phoneNumber">
          <el-input
            v-model="validForm.phoneNumber"
            placeholder="请输入会员手机号"
            clearable
          />
        </el-form-item>
      </el-form>

      <!-- 校验结果显示 + 凭证输入 -->
      <div v-else>
        <el-descriptions
          :column="1"
          border
          style="margin-bottom: 16px"
        >
          <el-descriptions-item label="订单号">{{ validResult.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="礼物编号">{{ validResult.giftCode }}</el-descriptions-item>
          <el-descriptions-item label="礼物说明">{{ validResult.giftInfo }}</el-descriptions-item>
          <el-descriptions-item label="面值">{{ validResult.giftValue }} THB</el-descriptions-item>
          <el-descriptions-item label="会员名称">{{ validResult.username }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ validResult.phoneNumber }}</el-descriptions-item>
          <el-descriptions-item label="库存编号">{{ validResult.stockNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatTag(validResult.stat)" size="small">
              {{ getDictLabel('GiftRecordStat', validResult.stat) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- ✅ 手动输入凭证号 -->
        <el-form label-width="100px" label-position="right">
          <el-form-item label="凭证号" prop="relatedNo" required>
            <el-input
              v-model="validForm.relatedNo"
              placeholder="请输入凭证号（如：物流单号/转账记录等）"
              clearable
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="validDialogVisible = false">取消</el-button>
          <!-- 校验按钮 -->
          <el-button
            v-if="!validResult"
            type="primary"
            :loading="validLoading"
            @click="handleValidSubmit"
          >
            校验票据
          </el-button>
          <!-- 确认票据按钮 -->
          <el-button
            v-if="validResult"
            type="success"
            :loading="confirmLoading"
            @click="handleConfirmSubmit"
          >
            确认票据
          </el-button>
          <!-- 重新校验按钮 -->
          <el-button v-if="validResult" @click="resetValid">重新校验</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Key } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 🔍 查询参数
const queryParams = reactive({
  giftCode: null,
  giftType: null,
  orderNo: null,
  phoneNumber: null,
  stockNo: null,
  stat: null,
  page: 1,
  pageSize: 10
})
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const queryFormRef = ref()

// 📝 操作弹窗状态
const actionDialogVisible = ref(false)
const actionFormRef = ref()
const submitLoading = ref(false)
const actionType = ref('deliver') // 'deliver' | 'cancel' | 'refund'

const actionForm = reactive({ id: null, orderNo: '', remark: '' })
const actionRules = {
  remark: [{ required: true, message: '请输入操作备注', trigger: 'blur' }]
}

// 🔑 校验票据弹窗状态 (修正版)
const validDialogVisible = ref(false)
const validFormRef = ref()
const validLoading = ref(false)
const confirmLoading = ref(false)
const validResult = ref(null) // 校验成功后返回的记录

const validForm = reactive({
  orderNo: '',          // 单号
  giftContent: '',      // 礼物内容
  phoneNumber: '',      // 手机号
  relatedNo: ''         // 凭证号（手动输入）
})

const validRules = {
  orderNo: [{ required: true, message: '请输入单号', trigger: 'blur' }],
  giftContent: [{ required: true, message: '请输入礼物内容', trigger: 'blur' }],
  phoneNumber: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  relatedNo: [{ required: true, message: '请输入凭证号', trigger: 'blur' }]
}

// ✅ 动态弹窗标题
const actionTitle = computed(() => {
  const map = { deliver: '发货备注', cancel: '取消发货备注', refund: '退货备注' }
  return map[actionType.value] || '操作备注'
})

// 🏷️ 状态标签颜色映射
const getStatTag = (stat) => {
  const map = { '0': 'info', '1': 'warning', '2': 'success', '3': 'danger' }
  return map[stat] || 'info'
}

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const res = await request.post('/giftRecord/page.do', {
      ...queryParams,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
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

// 📦 打开操作弹窗
const openActionDialog = (row, type) => {
  actionType.value = type
  Object.assign(actionForm, { id: row.id, orderNo: row.orderNo, remark: '' })
  actionDialogVisible.value = true
  setTimeout(() => actionFormRef.value?.clearValidate(), 100)
}

// 💾 提交操作
const handleActionSubmit = async () => {
  if (!actionFormRef.value) return
  await actionFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      // ✅ 根据类型动态匹配接口与提示
      let api = ''
      let successMsg = ''
      switch (actionType.value) {
        case 'deliver': api = '/giftRecord/delivered.do'; successMsg = '发货成功'; break
        case 'cancel':  api = '/giftRecord/cancel.do';    successMsg = '取消发货成功'; break
        case 'refund':  api = '/giftRecord/refunded.do';  successMsg = '退货成功'; break
      }

      // 参数与取消发货一致：{ id, remark }
      await request.post(api, { id: actionForm.id, remark: actionForm.remark })
      ElMessage.success(successMsg)
      actionDialogVisible.value = false
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

// 🔑 校验票据相关方法 (修正版)

// 打开校验弹窗
const openValidDialog = () => {
  validForm.orderNo = ''
  validForm.giftContent = ''
  validForm.phoneNumber = ''
  validForm.relatedNo = ''
  validResult.value = null
  validDialogVisible.value = true
  setTimeout(() => validFormRef.value?.clearValidate(), 100)
}

// 提交校验
const handleValidSubmit = async () => {
  if (!validFormRef.value) return
  await validFormRef.value.validate(async (valid) => {
    if (!valid) return
    validLoading.value = true
    try {
      // ✅ 调用 /giftRecord/validSoldRecord.do 接口
      // 参数：orderNo, giftContent, phoneNumber
      const res = await request.post('/giftRecord/validSoldRecord.do', {
        orderNo: validForm.orderNo.trim(),
        giftContent: validForm.giftContent.trim(),
        phoneNumber: validForm.phoneNumber.trim()
      })

      if (res.data) {
        validResult.value = res.data
        ElMessage.success('校验成功')
      } else {
        ElMessage.warning('未找到匹配的票据记录')
      }
    } catch (error) {
      ElMessage.error('校验失败：' + (error.message || '未知错误'))
    } finally {
      validLoading.value = false
    }
  })
}

// 确认票据
const handleConfirmSubmit = async () => {
  // ✅ 单独校验凭证号
  if (!validForm.relatedNo?.trim()) {
    return ElMessage.warning('请输入凭证号')
  }

  if (!validResult.value) return
  try {
    await ElMessageBox.confirm('确定要确认该票据吗？', '提示', { type: 'warning' })
    confirmLoading.value = true

    // ✅ 调用 /giftRecord/confirmSoldRecord.do 接口
    // 🔑 关键：提交 4 个参数
    await request.post('/giftRecord/confirmSoldRecord.do', {
      orderNo: validForm.orderNo.trim(),        // 单号（锁定）
      giftContent: validForm.giftContent.trim(), // 内容（锁定）
      phoneNumber: validForm.phoneNumber.trim(), // 手机号（锁定）
      relatedNo: validForm.relatedNo.trim()      // 凭证号（手动输入）
    })

    ElMessage.success('票据确认成功')
    validDialogVisible.value = false
    handleQuery() // 刷新表格更新状态
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('确认失败：' + (error.message || '未知错误'))
    }
  } finally {
    confirmLoading.value = false
  }
}

// 重新校验
const resetValid = () => {
  validResult.value = null
  validForm.relatedNo = ''  // 清空凭证号
  validFormRef.value?.clearValidate()
}

const handleValidDialogClose = () => {
  validFormRef.value?.resetFields()
  validResult.value = null
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.gift-record-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header {
    display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
    .header-actions { display: flex; gap: 10px; }
  }
}
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
</style>
