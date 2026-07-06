<template>
  <div class="gift-record-container">
    <!-- 🔍 查询表单 -->
    <el-card class="search-card" shadow="hover">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="100px" @submit.prevent>
        <el-row :gutter="20">
          <el-col :span="4">
            <el-form-item label="订单编号" prop="orderNo">
              <el-input v-model="queryParams.orderNo" placeholder="请输入" clearable @keyup.enter="handleQuery" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="手机号" prop="phoneNumber">
              <el-input v-model="queryParams.phoneNumber" placeholder="请输入" clearable @keyup.enter="handleQuery" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="礼物编号" prop="giftCode">
              <el-input v-model="queryParams.giftCode" placeholder="请输入" clearable @keyup.enter="handleQuery" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="库存编号" prop="stockNo">
              <el-input v-model="queryParams.stockNo" placeholder="请输入" clearable @keyup.enter="handleQuery" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="礼物类型" prop="giftType">
              <el-select v-model="queryParams.giftType" placeholder="请选择" clearable style="width: 100%; min-width: 120px">
                <el-option v-for="item in getDictOptions('GiftType')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
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
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="orderNo" label="订单号" width="180" show-overflow-tooltip />
        <el-table-column prop="username" label="会员账号" width="120" show-overflow-tooltip />
<!--        <el-table-column prop="giftInfo" label="礼物说明" min-width="150" show-overflow-tooltip />-->
        <el-table-column prop="giftValue" label="礼物价值" width="100" align="right" />
        <el-table-column prop="relatedAccount" label="关联账号" width="120" show-overflow-tooltip />
        <el-table-column label="凭证图片" prop="documentUrl" width="180" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.documentUrl"
              :src="row.documentUrl"
              fit="cover"
              style="width: 100px; height: 60px; border-radius: 4px; cursor: pointer"
              :preview-src-list="[row.documentUrl]"
            />
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
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
        <el-table-column prop="remark" label="备注" width="120" show-overflow-tooltip />

        <el-table-column prop="createAt" label="创建时间" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <!-- ✅ 仅保留文档明确定义的 3 个行级操作 -->
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="warning" link size="small" @click="openDialog('deliver', row)">发货</el-button>
            <el-button type="danger" link size="small" @click="openDialog('refund', row)">退货</el-button>
            <el-button type="info" link size="small" @click="openDialog('cancel', row)">取消</el-button>
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

    <!-- ️ 统一操作对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" :close-on-click-modal="false" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <!-- 发货专用 -->
        <template v-if="actionType === 'deliver'">
          <el-form-item label="凭证图片" prop="documentUrl">
            <el-upload class="upload-box" action="#" :http-request="handleUpload" :show-file-list="false" accept="image/*">
              <el-button type="primary" :loading="uploadLoading">{{ form.documentUrl ? '重新上传' : '选择图片' }}</el-button>
            </el-upload>
            <div v-if="form.documentUrl" class="upload-preview">
              <el-image :src="form.documentUrl" style="width: 100px; height: 100px; margin-top: 8px" fit="cover" />
            </div>
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注信息" clearable />
          </el-form-item>
        </template>

        <!-- 退货/取消 专用 -->
        <template v-if="['refund', 'cancel'].includes(actionType)">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注信息" clearable />
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getDictOptions, getDictLabel } from '@/utils/dict'

const tableData = ref([])
const loading = ref(false)

const queryParams = reactive({
  orderNo: '', phoneNumber: '', giftCode: '', stockNo: '', giftType: '', stat: '', page: 1, pageSize: 20
})
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const queryFormRef = ref()

const dialogVisible = ref(false)
const actionType = ref('') // deliver | refund | cancel
const submitLoading = ref(false)
const uploadLoading = ref(false)
const formRef = ref()
const form = reactive({ id: null, documentUrl: '', remark: '' })

const dialogTitle = computed(() => ({ deliver: '发货', refund: '退货', cancel: '取消发货' }[actionType.value] || ''))

const formRules = computed(() => {
  const rules = {}
  if (actionType.value === 'deliver') {
    rules.documentUrl = [{ required: true, message: '请上传凭证图片', trigger: 'change' }]
    rules.remark = [{ required: true, message: '请输入备注', trigger: 'blur' }]
  } else {
    rules.remark = [{ required: true, message: '请输入备注', trigger: 'blur' }]
  }
  return rules
})

const getStatTagType = (stat) => {
  const map = { '0': 'info', '1': 'success', '2': 'warning', '3': 'primary', '4': 'danger', '5': 'danger', '6': 'info' }
  return map[stat] || 'info'
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
  Object.assign(form, { id: row.id, documentUrl: '', remark: '' })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

const handleUpload = async (options) => {
  uploadLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', options.file)
    formData.append('type', 7)
    const res = await request.post('/pub/uploadPic.do', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    form.documentUrl = res.data?.url || res.data
    ElMessage.success('图片上传成功')
  } catch (error) {
    ElMessage.error('上传失败：' + (error.message || '未知错误'))
  } finally {
    uploadLoading.value = false
  }
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
        payload = { id: form.id, documentUrl: form.documentUrl, remark: form.remark }
      } else if (actionType.value === 'refund') {
        api = '/giftRecord/refunded.do'
        payload = { id: form.id, remark: form.remark }
      } else if (actionType.value === 'cancel') {
        api = '/giftRecord/cancel.do'
        payload = { id: form.id, remark: form.remark }
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

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(() => { handleQuery() })
</script>

<style scoped lang="scss">
.gift-record-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center; .title { font-size: 16px; font-weight: bold; color: #303133; } }
}
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
:deep(.el-upload__tip) { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
