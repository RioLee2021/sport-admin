<template>
  <div class="sts-data-container">
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
          <el-col :span="4">
            <el-form-item label="报表类型" prop="rptType">
              <el-select
                v-model="queryParams.rptType"
                placeholder="请选择"
                clearable
                style="width: 100%;min-width: 100px"
              >
                <el-option
                  v-for="item in getDictOptions('StsDataReportType')"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="年份" prop="rptYear">
              <el-input-number
                v-model="queryParams.rptYear"
                :min="2020"
                :max="2099"
                controls-position="right"
                placeholder="年"
                clearable
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="月份" prop="rptMonth">
              <el-input-number
                v-model="queryParams.rptMonth"
                :min="1"
                :max="12"
                controls-position="right"
                placeholder="月"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="周数" prop="rptWeek">
              <el-input-number
                v-model="queryParams.rptWeek"
                :min="1"
                :max="53"
                controls-position="right"
                placeholder="周"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="日期" prop="rptDay">
              <el-input-number
                v-model="queryParams.rptDay"
                :min="1"
                :max="31"
                controls-position="right"
                placeholder="日"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="小时" prop="rptHour">
              <el-input-number
                v-model="queryParams.rptHour"
                :min="0"
                :max="23"
                controls-position="right"
                placeholder="时"
                style="width: 100%"
              />
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
          <span class="title">数据统计报表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增报表</el-button>
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

        <el-table-column label="报表类型" prop="rptType" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ getDictLabel('StsDataReportType', row.rptType) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="报表周期" prop="rptPeriod" min-width="140" show-overflow-tooltip />

        <el-table-column label="活跃会员" prop="activeMbrCnt" width="90" align="center">
          <template #default="{ row }">{{ row.activeMbrCnt ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="注册数" prop="registerCnt" width="80" align="center">
          <template #default="{ row }">{{ row.registerCnt ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="邀请数" prop="inviteCnt" width="80" align="center">
          <template #default="{ row }">{{ row.inviteCnt ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="观看会员" prop="watchMbrCnt" width="90" align="center">
          <template #default="{ row }">{{ row.watchMbrCnt ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="观看奖励" prop="watchAwardAmt" width="90" align="center">
          <template #default="{ row }">{{ row.watchAwardAmt ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="竞猜会员" prop="guessMbrCnt" width="90" align="center">
          <template #default="{ row }">{{ row.guessMbrCnt ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="竞猜金额" prop="guessAmt" width="90" align="center">
          <template #default="{ row }">{{ row.guessAmt ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="兑换会员" prop="giftRedeemMbrCnt" width="90" align="center">
          <template #default="{ row }">{{ row.giftRedeemMbrCnt ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="兑换金额" prop="giftRedeemAmt" width="90" align="center">
          <template #default="{ row }">{{ row.giftRedeemAmt ?? 0 }}</template>
        </el-table-column>

        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="info" link size="small" @click="handleViewDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link size="small" @click="handleReload(row)">重新计算</el-button>
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
      :title="isEdit ? '编辑报表' : '新增报表'"
      width="650px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" label-position="right">
        <el-form-item label="报表ID" prop="id" v-if="isEdit">
          <el-input v-model="form.id" disabled />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报表类型" prop="rptType">
              <el-select v-model="form.rptType" placeholder="请选择类型" style="width: 100%" :disabled="isEdit">
                <el-option
                  v-for="item in getDictOptions('StsDataReportType')"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="!isEdit">
            <el-form-item label="报表时间" prop="rptTime">
              <el-date-picker
                v-model="form.rptTime"
                type="datetime"
                placeholder="选择报表时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <template v-if="isEdit">
          <el-divider content-position="left">统计指标（可编辑）</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="活跃会员" prop="activeMbrCnt">
                <el-input-number v-model="form.activeMbrCnt" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="注册数" prop="registerCnt">
                <el-input-number v-model="form.registerCnt" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="邀请数" prop="inviteCnt">
                <el-input-number v-model="form.inviteCnt" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="观看会员" prop="watchMbrCnt">
                <el-input-number v-model="form.watchMbrCnt" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="观看奖励" prop="watchAwardAmt">
                <el-input-number v-model="form.watchAwardAmt" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="竞猜会员" prop="guessMbrCnt">
                <el-input-number v-model="form.guessMbrCnt" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="竞猜金额" prop="guessAmt">
                <el-input-number v-model="form.guessAmt" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="兑换会员" prop="giftRedeemMbrCnt">
                <el-input-number v-model="form.giftRedeemMbrCnt" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="兑换金额" prop="giftRedeemAmt">
                <el-input-number v-model="form.giftRedeemAmt" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="观看奖励会员" prop="watchAwardMbrCnt">
                <el-input-number v-model="form.watchAwardMbrCnt" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 🔍 详情弹窗 (新增) -->
    <el-dialog
      v-model="detailDialogVisible"
      title="报表详情"
      width="700px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="detail-container">
        <!-- 基础信息 -->
        <el-descriptions :column="2" border class="mb-20">
          <el-descriptions-item label="报表类型">{{ getDictLabel('StsDataReportType', detailRow?.rptType) }}</el-descriptions-item>
          <el-descriptions-item label="报表周期">{{ detailRow?.rptPeriod }}</el-descriptions-item>
          <el-descriptions-item label="活跃会员">{{ detailRow?.activeMbrCnt ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="注册数">{{ detailRow?.registerCnt ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="邀请数">{{ detailRow?.inviteCnt ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="观看会员">{{ detailRow?.watchMbrCnt ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="观看奖励">{{ detailRow?.watchAwardAmt ?? 0 }} 金币</el-descriptions-item>
          <el-descriptions-item label="竞猜会员">{{ detailRow?.guessMbrCnt ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="竞猜金额">{{ detailRow?.guessAmt ?? 0 }} 金币</el-descriptions-item>
          <el-descriptions-item label="兑换会员">{{ detailRow?.giftRedeemMbrCnt ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="兑换金额">{{ detailRow?.giftRedeemAmt ?? 0 }} 金币</el-descriptions-item>
          <el-descriptions-item label="观看奖励会员">{{ detailRow?.watchAwardMbrCnt ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="报表时间">{{ $formatDateTime(detailRow?.rptTime) }}</el-descriptions-item>
          <el-descriptions-item label="报表时区">{{ detailRow?.zoneId ?? '---' }}</el-descriptions-item>
        </el-descriptions>

        <!-- JSON 分布数据 -->
        <el-divider content-position="left">📊 分布数据</el-divider>

        <el-collapse v-model="activeCollapse" accordion>
          <el-collapse-item name="mbrLevel" v-if="detailRow?.mbrLevelDistribution">
            <template #title>
              <span class="collapse-title">会员等级分布</span>
              <el-tag size="small" type="info" style="margin-left: 8px">{{ parseJsonCount(detailRow.mbrLevelDistribution) }} 项</el-tag>
            </template>
            <div class="json-list">
              <div v-for="(val, key) in parseJson(detailRow.mbrLevelDistribution)" :key="key" class="json-item">
                <span class="json-key">{{ key }}</span>
                <span class="json-sep">:</span>
                <span class="json-value">{{ val }}</span>
              </div>
            </div>
          </el-collapse-item>

          <el-collapse-item name="giftType" v-if="detailRow?.giftTypeDistribution">
            <template #title>
              <span class="collapse-title">礼物类型分布</span>
              <el-tag size="small" type="info" style="margin-left: 8px">{{ parseJsonCount(detailRow.giftTypeDistribution) }} 项</el-tag>
            </template>
            <div class="json-list">
              <div v-for="(val, key) in parseJson(detailRow.giftTypeDistribution)" :key="key" class="json-item">
                <span class="json-key">{{ key }}</span>
                <span class="json-sep">:</span>
                <span class="json-value">{{ val }}</span>
              </div>
            </div>
          </el-collapse-item>

          <el-collapse-item name="weekRegister" v-if="detailRow?.weekRegisterDistribution">
            <template #title>
              <span class="collapse-title">周注册分布</span>
              <el-tag size="small" type="info" style="margin-left: 8px">{{ parseJsonCount(detailRow.weekRegisterDistribution) }} 项</el-tag>
            </template>
            <div class="json-list">
              <div v-for="(val, key) in parseJson(detailRow.weekRegisterDistribution)" :key="key" class="json-item">
                <span class="json-key">{{ key }}</span>
                <span class="json-sep">:</span>
                <span class="json-value">{{ val }}</span>
              </div>
            </div>
          </el-collapse-item>

          <el-collapse-item name="zombieMbr" v-if="detailRow?.zombieMbrDistribution">
            <template #title>
              <span class="collapse-title">僵尸会员分布</span>
              <el-tag size="small" type="info" style="margin-left: 8px">{{ parseJsonCount(detailRow.zombieMbrDistribution) }} 项</el-tag>
            </template>
            <div class="json-list">
              <div v-for="(val, key) in parseJson(detailRow.zombieMbrDistribution)" :key="key" class="json-item">
                <span class="json-key">{{ key }}</span>
                <span class="json-sep">:</span>
                <span class="json-value">{{ val }}</span>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>

        <!-- JSON 排行榜数据 -->
        <el-divider content-position="left">🏆 排行榜数据</el-divider>

        <el-collapse v-model="activeCollapse" accordion>
          <el-collapse-item name="coinsTop" v-if="detailRow?.mbrCoinsTopList">
            <template #title>
              <span class="collapse-title">会员金币排行榜</span>
              <el-tag size="small" type="warning" style="margin-left: 8px">{{ parseJsonCount(detailRow.mbrCoinsTopList) }} 项</el-tag>
            </template>
            <div class="json-list">
              <div v-for="(val, key) in parseJson(detailRow.mbrCoinsTopList)" :key="key" class="json-item">
                <span class="json-key">{{ key }}</span>
                <span class="json-sep">:</span>
                <span class="json-value">{{ val }} 金币</span>
              </div>
            </div>
          </el-collapse-item>

          <el-collapse-item name="inviteTop" v-if="detailRow?.mbrInviteTopList">
            <template #title>
              <span class="collapse-title">会员邀请排行榜</span>
              <el-tag size="small" type="warning" style="margin-left: 8px">{{ parseJsonCount(detailRow.mbrInviteTopList) }} 项</el-tag>
            </template>
            <div class="json-list">
              <div v-for="(val, key) in parseJson(detailRow.mbrInviteTopList)" :key="key" class="json-item">
                <span class="json-key">{{ key }}</span>
                <span class="json-sep">:</span>
                <span class="json-value">{{ val }} 人</span>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
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
  rptType: '',
  rptYear: undefined,
  rptMonth: undefined,
  rptWeek: undefined,
  rptDay: undefined,
  rptHour: undefined,
  page: 1,
  pageSize: 10
})

// 📄 分页参数
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const queryFormRef = ref()

// ✏️ 对话框状态
const dialogVisible = ref(false)
const formRef = ref()
const submitLoading = ref(false)
const isEdit = ref(false)

// 🔍 详情弹窗状态
const detailDialogVisible = ref(false)
const detailRow = ref(null)
const activeCollapse = ref('')

//  表单数据
const form = reactive({
  id: null,
  rptType: undefined,
  rptTime: '',
  activeMbrCnt: 0,
  registerCnt: 0,
  inviteCnt: 0,
  watchMbrCnt: 0,
  watchAwardAmt: 0,
  guessMbrCnt: 0,
  guessAmt: 0,
  giftRedeemMbrCnt: 0,
  giftRedeemAmt: 0,
  watchAwardMbrCnt: 0
})

// ✅ 校验规则
const rules = {
  rptType: [{ required: true, message: '请选择报表类型', trigger: 'change' }],
  rptTime: [{ required: true, message: '请选择报表时间', trigger: 'change' }]
}

/** 🔍 解析 JSON 字符串 */
const parseJson = (jsonStr) => {
  if (!jsonStr) return {}
  try {
    return JSON.parse(jsonStr)
  } catch {
    return {}
  }
}

/** 🔍 获取 JSON 项数 */
const parseJsonCount = (jsonStr) => {
  const obj = parseJson(jsonStr)
  return Object.keys(obj).length
}

/** 🔍 查询列表 */
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      ...queryParams,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === '') delete payload[key]
    })

    const res = await request.post('/stsData/page.do', payload)
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

/** ➕ 新增报表 */
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null, rptType: undefined, rptTime: '',
    activeMbrCnt: 0, registerCnt: 0, inviteCnt: 0, watchMbrCnt: 0,
    watchAwardAmt: 0, guessMbrCnt: 0, guessAmt: 0, giftRedeemMbrCnt: 0, giftRedeemAmt: 0, watchAwardMbrCnt: 0
  })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

/** ✏️ 编辑报表 */
const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

/** 💾 提交表单 */
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      const payload = isEdit.value
        ? {
          id: form.id,
          activeMbrCnt: form.activeMbrCnt,
          registerCnt: form.registerCnt,
          inviteCnt: form.inviteCnt,
          watchMbrCnt: form.watchMbrCnt,
          watchAwardAmt: form.watchAwardAmt,
          guessMbrCnt: form.guessMbrCnt,
          guessAmt: form.guessAmt,
          giftRedeemMbrCnt: form.giftRedeemMbrCnt,
          giftRedeemAmt: form.giftRedeemAmt,
          watchAwardMbrCnt: form.watchAwardMbrCnt
        }
        : {
          rptType: form.rptType,
          rptTime: form.rptTime ? Math.floor(new Date(form.rptTime).getTime() / 1000) : undefined
        }

      const api = isEdit.value ? '/stsData/edit.do' : '/stsData/add.do'
      await request.post(api, payload)
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

/** 🗑️ 删除报表 */
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除该报表记录吗？`, '警告', { type: 'warning' })
    .then(async () => {
      await request.post('/stsData/delete.do', { id: row.id })
      ElMessage.success('删除成功')
      handleQuery()
    }).catch(() => {})
}

/** 🔄 重新计算 */
const handleReload = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要重新计算报表 [${row.rptPeriod || row.id}] 的数据吗？`, '提示', { type: 'warning' })
    await request.post('/stsData/reload.do', { id: row.id })
    ElMessage.success('重新计算成功')
    handleQuery()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重新计算失败：' + (error.message || '未知错误'))
    }
  }
}

/** 🔍 查看详情 */
const handleViewDetail = (row) => {
  detailRow.value = { ...row }
  activeCollapse.value = '' // 默认全部折叠
  detailDialogVisible.value = true
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.sts-data-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
:deep(.el-divider__text) { font-size: 13px; color: #606266; font-weight: 500; }

/* 🔍 详情弹窗样式 */
:deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 10px;
}

.detail-container {
  padding: 0 10px;
}

.mb-20 {
  margin-bottom: 20px;
}

:deep(.el-descriptions) {
  .el-descriptions__label {
    width: 100px;
    background: #f8f9fa;
    font-weight: 500;
  }
}

/* 📊 JSON 列表样式 */
.json-list {
  padding: 10px 20px;
  background: #f8f9fa;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.json-item {
  display: flex;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed #e4e7ed;
  font-size: 13px;

  &:last-child {
    border-bottom: none;
  }

  .json-key {
    flex: 1;
    font-weight: 500;
    color: #606266;
    word-break: break-all;
  }

  .json-sep {
    margin: 0 8px;
    color: #909399;
  }

  .json-value {
    flex: 2;
    color: #409EFF;
    font-weight: 500;
    word-break: break-all;
  }
}

/* 🎯 折叠面板样式 */
:deep(.el-collapse) {
  border: none;

  .el-collapse-item__header {
    background: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 8px;
    padding: 12px 16px;

    .collapse-title {
      font-weight: 500;
      color: #303133;
    }
  }

  .el-collapse-item__wrap {
    border: none;
  }
}
</style>
