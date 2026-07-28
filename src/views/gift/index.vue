<template>
  <div class="gift-container">
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
              <el-input
                v-model="queryParams.giftCode"
                placeholder="请输入礼物编号"
                clearable
                @keyup.enter="handleQuery"
              />
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
            <el-form-item label="热门" prop="hotFlag">
              <el-select v-model="queryParams.hotFlag" placeholder="请选择" clearable style="width: 100%; min-width: 80px">
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="上架" prop="listedFlag">
              <el-select v-model="queryParams.listedFlag" placeholder="请选择" clearable style="width: 100%; min-width: 80px">
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="价格起" prop="startPrice">
              <el-input-number
                v-model="queryParams.startPrice"
                :min="0"
                controls-position="right"
                placeholder="最小价格"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="价格止" prop="endPrice">
              <el-input-number
                v-model="queryParams.endPrice"
                :min="0"
                controls-position="right"
                placeholder="最大价格"
                style="width: 100%"
              />
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
          <span class="title">礼物列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增礼物</el-button>
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

        <el-table-column label="礼物编号" prop="giftCode" width="120" align="center" />
        <el-table-column label="类型" prop="giftType" width="90" align="center">
          <template #default="{ row }">
            {{ getDictLabel('GiftType', row.giftType) }}
          </template>
        </el-table-column>

        <el-table-column label="价格" prop="price" width="90" align="center">
          <template #default="{ row }">{{ row.price }} 金币</template>
        </el-table-column>
        <el-table-column label="价值" prop="giftValue" width="90" align="center">
          <template #default="{ row }">{{ row.giftValue }} THB</template>
        </el-table-column>
        <el-table-column label="封面" width="100" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.coverUrl"
              :src="row.coverUrl"
              :preview-src-list="[row.coverUrl]"
              style="width: 60px; height: 60px; border-radius: 4px; object-fit: cover"
              preview-teleported
            />
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>

        <el-table-column label="库存/已售" width="110" align="center">
          <template #default="{ row }">
            <div>{{ row.stockCnt ?? '-' }} / {{ row.soldCnt ?? 0 }}</div>
          </template>
        </el-table-column>

        <el-table-column label="限购" width="120" align="center">
          <template #default="{ row }">
            <div>每人: {{ row.eachMaxBuy ?? '不限' }}</div>
            <div>总计: {{ row.totalMaxBuy ?? '不限' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="热门" prop="hotFlag" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.hotFlag ? 'warning' : 'info'" size="small">
              {{ row.hotFlag ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="上架" prop="listedFlag" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.listedFlag ? 'success' : 'info'" size="small">
              {{ row.listedFlag ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" prop="disabled" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" prop="createAt" width="180" align="center">
          <template #default="{ row }">{{ $formatDateTime(row.createAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="320" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              :type="row.disabled ? 'success' : 'warning'"
              link
              size="small"
              @click="handleToggle(row)"
            >
              {{ row.disabled ? '启用' : '禁用' }}
            </el-button>
            <el-button type="info" link size="small" @click="openDescDialog(row)">描述管理</el-button>
            <!-- ✅ 库存按钮 -->
            <el-button type="success" link size="small" @click="handleGoStock(row)">库存</el-button>
            <!-- ✅ 自动生成库存按钮（仅 giftType=1 显示） -->
            <el-button
              v-if="row.giftType === 1 || row.giftType === 3"
              type="primary"
              link
              size="small"
              @click="openAutoStockDialog(row)"
            >
              生成库存
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

    <!-- ✏️ 新增/编辑礼物对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑礼物' : '新增礼物'"
      width="650px"
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
        <el-form-item label="礼物编号" prop="giftCode" :disabled="isEdit">
          <el-input
            v-model="form.giftCode"
            :disabled="isEdit"
            placeholder="请输入礼物编号"
            clearable
          />
        </el-form-item>

        <el-form-item label="礼物类型" prop="giftType" :disabled="isEdit">
          <el-select
            v-model="form.giftType"
            :disabled="isEdit"
            placeholder="请选择类型"
            style="width: 100%"
          >
            <el-option
              v-for="item in getDictOptions('GiftType')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="价格 (金币)" prop="price">
          <el-input-number
            v-model="form.price"
            :min="0"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="价值 (THB)" prop="giftValue">
          <el-input-number
            v-model="form.giftValue"
            :min="0"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="封面图片" prop="coverUrl">
          <el-upload
            class="cover-uploader"
            :show-file-list="false"
            :http-request="handleUploadCover"
            :before-upload="beforeUpload"
          >
            <img v-if="form.coverUrl" :src="form.coverUrl" class="cover-preview" />
            <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">支持 jpg/png，建议 200x200，最大 2MB</div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="每人限购" prop="eachMaxBuy">
              <el-input-number
                v-model="form.eachMaxBuy"
                :min="0"
                controls-position="right"
                style="width: 100%"
                placeholder="0 表示不限购"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总限购" prop="totalMaxBuy">
              <el-input-number
                v-model="form.totalMaxBuy"
                :min="0"
                controls-position="right"
                style="width: 100%"
                placeholder="0 表示不限购"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否热门" prop="hotFlag">
              <el-switch v-model="form.hotFlag" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否上架" prop="listedFlag">
              <el-switch v-model="form.listedFlag" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 📝 礼物描述管理对话框 (行级操作版) -->
    <el-dialog
      v-model="descDialogVisible"
      title="礼物多语言描述"
      width="700px"
      :close-on-click-modal="false"
      @close="handleDescDialogClose"
    >
      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 16px"
        show-icon
      >
        提示：每行可独立保存/删除，新增描述保存后会自动创建记录
      </el-alert>

      <el-table :data="descList" border stripe style="width: 100%">
        <el-table-column label="语言代码" prop="languageCode" width="130" align="center">
          <template #default="{ row }">
            <el-input v-model="row.languageCode" placeholder="如: zh-CN" size="small" clearable />
          </template>
        </el-table-column>
        <el-table-column label="描述内容" prop="value" min-width="220">
          <template #default="{ row }">
            <el-input v-model="row.value" type="textarea" :rows="2" placeholder="请输入描述内容" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row, $index }">
            <!-- ✅ 行级保存按钮 -->
            <el-button
              type="primary"
              link
              size="small"
              :loading="row.saving"
              @click="handleSaveDescItem(row, $index)"
            >
              {{ row.id ? '更新' : '新增' }}
            </el-button>
            <!-- ✅ 智能删除按钮 -->
            <el-button
              type="danger"
              link
              size="small"
              :loading="row.deleting"
              @click="handleDeleteDescItem(row, $index)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 12px">
        <el-button type="primary" :icon="Plus" link @click="addDescItem">添加语言描述</el-button>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="descDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 🎁 自动生成库存对话框 (新增) -->
    <el-dialog
      v-model="autoStockDialogVisible"
      title="自动生成库存"
      width="480px"
      :close-on-click-modal="false"
      @close="handleAutoStockDialogClose"
    >
      <el-alert
        type="warning"
        :closable="false"
        style="margin-bottom: 16px"
        show-icon
      >
        提示：生成数量不超过 200 个，库存编号将按前缀 + 序号自动生成
      </el-alert>

      <el-form
        ref="autoStockFormRef"
        :model="autoStockForm"
        :rules="autoStockRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="礼物编号">
          <el-input v-model="autoStockForm.giftCode" disabled />
        </el-form-item>
        <el-form-item label="礼物名称">
          <el-input v-model="autoStockForm.giftName" disabled />
        </el-form-item>
        <el-form-item label="价值(THB)" prop="giftValue">
          <el-input-number
            v-model="autoStockForm.giftValue"
            controls-position="right"
            style="width: 100%"

            disabled
          />
        </el-form-item>
        <el-form-item label="生成数量" prop="num">
          <el-input-number
            v-model="autoStockForm.num"
            :min="1"
            :max="200"
            controls-position="right"
            style="width: 100%"
            placeholder="1-200"
          />
        </el-form-item>
        <el-form-item label="编号前缀" prop="stockNoPrefix">
          <el-input
            v-model="autoStockForm.stockNoPrefix"
            placeholder="如：GIFT2024，将生成 GIFT2024001、GIFT2024002..."
            maxlength="20"
            clearable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="autoStockDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="autoStockLoading" @click="handleAutoStockSubmit">生成库存</el-button>
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
import { useRouter } from 'vue-router'

const router = useRouter()

// 📊 表格状态
const tableData = ref([])
const loading = ref(false)

// 📦 跳转库存页
const handleGoStock = (row) => {
  router.push({
    path: '/stock',
    query: { giftCode: row.giftCode }
  })
}

// 🔍 查询参数
const queryParams = reactive({
  giftCode: '',
  giftType: '',
  hotFlag: undefined,
  listedFlag: undefined,
  startPrice: undefined,
  endPrice: undefined,
  page: 1,
  pageSize: 10
})

// 📄 分页参数
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const queryFormRef = ref()

// ✏️ 礼物表单状态
const dialogVisible = ref(false)
const formRef = ref()
const submitLoading = ref(false)
const isEdit = ref(false)

const form = reactive({
  id: null,
  giftCode: '',
  giftType: '0',
  price: 0,
  giftValue: 0,
  coverUrl: '',
  stockCnt: 0,
  soldCnt: 0,
  eachMaxBuy: 0,
  totalMaxBuy: 0,
  hotFlag: false,
  listedFlag: false
})

// 校验规则
const rules = computed(() => ({
  giftCode: isEdit.value ? [] : [{ required: true, message: '请输入礼物编号', trigger: 'blur' }],
  giftType: isEdit.value ? [] : [{ required: true, message: '请选择礼物类型', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  coverUrl: [{ required: true, message: '请上传封面图片', trigger: 'change' }],
  eachMaxBuy: [{ required: true, message: '请输入每人限购数量', trigger: 'blur' }],
  totalMaxBuy: [{ required: true, message: '请输入总限购数量', trigger: 'blur' }]
}))

// 📝 描述管理状态
const descDialogVisible = ref(false)
const currentGiftId = ref(null)
const descList = ref([])

// 🎁 自动生成库存状态 (新增)
const autoStockDialogVisible = ref(false)
const autoStockFormRef = ref()
const autoStockLoading = ref(false)
const autoStockForm = reactive({
  id: null,
  giftCode: '',
  giftName: '',
  giftValue: null,
  num: null,
  stockNoPrefix: ''
})

const autoStockRules = {
  num: [
    { required: true, message: '请输入生成数量', trigger: 'blur' },
    { type: 'number', min: 1, max: 200, message: '数量必须在 1-200 之间', trigger: 'blur' }
  ],
  stockNoPrefix: [
    { required: true, message: '请输入库存编号前缀', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '仅支持字母、数字、下划线、短横线', trigger: 'blur' }
  ]
}

// 🔍 查询列表
const handleQuery = async () => {
  loading.value = true
  try {
    const payload = {
      giftCode: queryParams.giftCode || undefined,
      giftType: queryParams.giftType || undefined,
      hotFlag: queryParams.hotFlag,
      listedFlag: queryParams.listedFlag,
      startPrice: queryParams.startPrice,
      endPrice: queryParams.endPrice,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await request.post('/gift/page.do', payload)
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

// 🖼️ 封面上传相关
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) ElMessage.error('只能上传图片文件!')
  if (!isLt2M) ElMessage.error('图片大小不能超过 2MB!')
  return isImage && isLt2M
}

const handleUploadCover = async ({ file }) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    // ✅ type=4 代表礼物封面
    const res = await request.post('/pub/uploadPic.do', formData, {
      params: { type: 4 },
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    const url = res.data?.url || res.data || ''
    if (url) {
      form.coverUrl = url
      ElMessage.success('上传成功')
    } else {
      ElMessage.error('上传失败：未返回图片地址')
    }
  } catch (error) {
    ElMessage.error('上传失败：' + (error.message || '未知错误'))
  }
}

// ➕ 新增礼物
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null, giftCode: '', giftType: '0', price: 0, coverUrl: '',
    stockCnt: 0, soldCnt: 0, eachMaxBuy: 0, totalMaxBuy: 0,
    hotFlag: false, listedFlag: false
  })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

// ✏️ 编辑礼物
const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
  setTimeout(() => formRef.value?.clearValidate(), 100)
}

// 💾 提交礼物表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      const api = isEdit.value ? '/gift/edit.do' : '/gift/add.do'
      // ✅ 根据 Swagger 定义裁剪字段
      const payload = isEdit.value
        ? {
          id: form.id,
          coverUrl: form.coverUrl,
          price: form.price,
          giftValue: form.giftValue,
          eachMaxBuy: form.eachMaxBuy,
          totalMaxBuy: form.totalMaxBuy,
          hotFlag: form.hotFlag,
          listedFlag: form.listedFlag
        }
        : {
          giftCode: form.giftCode,
          giftType: form.giftType,
          price: form.price,
          giftValue: form.giftValue,
          coverUrl: form.coverUrl,
          eachMaxBuy: form.eachMaxBuy,
          totalMaxBuy: form.totalMaxBuy,
          hotFlag: form.hotFlag,
          listedFlag: form.listedFlag
        }

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

// 🔄 切换状态
const handleToggle = async (row) => {
  const action = row.disabled ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定要${action}礼物 "${row.giftCode}" 吗？`, '提示', { type: 'warning' })
    await request.post('/gift/toggle.do', { id: row.id })
    ElMessage.success(`${action}成功`)
    handleQuery()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败：` + (error.message || '未知错误'))
    }
  }
}

// 🗑️ 删除礼物
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除礼物 "${row.giftCode}" 吗？此操作不可恢复！`, '警告', { type: 'warning' })
    .then(async () => {
      await request.post('/gift/delete.do', { id: row.id })
      ElMessage.success('删除成功')
      handleQuery()
    }).catch(() => {})
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 📝 描述管理相关 (重构版)

// 🔹 打开描述弹窗 + 加载数据
const openDescDialog = async (row) => {
  currentGiftId.value = row.id
  descList.value = []
  descDialogVisible.value = true

  try {
    // ✅ 调用 infoList.do 获取当前礼物的描述列表
    const res = await request.post('/gift/infoList.do', { id: row.id })
    if (res.data && Array.isArray(res.data)) {
      descList.value = res.data.map(item => ({
        id: item.id || null,           // 🔑 描述记录的唯一 ID
        languageCode: item.languageCode || '',
        value: item.value || '',
        saving: false,                 // 行级保存 loading
        deleting: false                // 行级删除 loading
      }))
    }
    // 如果为空，默认添加一行空描述
    if (descList.value.length === 0) {
      addDescItem()
    }
  } catch (error) {
    ElMessage.error('获取描述失败：' + (error.message || '未知错误'))
    addDescItem() // 失败时仍允许用户添加
  }
}

// 🔹 添加空描述行
const addDescItem = () => {
  descList.value.push({
    id: null,                    // 新增行无 id
    languageCode: '',
    value: '',
    saving: false,
    deleting: false
  })
}

// 🔹 行级保存描述 (核心逻辑)
const handleSaveDescItem = async (row, index) => {
  // 基础校验
  if (!row.languageCode?.trim()) {
    return ElMessage.warning('请输入语言代码')
  }
  if (!row.value?.trim()) {
    return ElMessage.warning('请输入描述内容')
  }
  if (!currentGiftId.value) {
    return ElMessage.error('礼物 ID 丢失，请关闭重试')
  }

  row.saving = true
  try {
    // ✅ 调用 saveInfo.do，id 参数传礼物 ID (不是描述 ID)
    await request.post('/gift/saveInfo.do', {
      id: currentGiftId.value,        // 🔑 关键：传礼物 ID
      languageCode: row.languageCode.trim(),
      info: row.value.trim()
    })

    ElMessage.success(`${row.id ? '更新' : '新增'}成功`)

    // ✅ 如果是新增行，后端会返回新记录的 id，但接口未定义返回值，需重新拉取或乐观更新
    // 这里采用乐观更新：新增行标记一个临时 id，实际使用中以礼物 ID+languageCode 为唯一键
    if (!row.id) {
      row.id = `temp_${Date.now()}_${index}` // 临时标记，避免重复新增
    }
  } catch (error) {
    ElMessage.error('保存失败：' + (error.message || '未知错误'))
  } finally {
    row.saving = false
  }
}

// 🔹 智能删除描述 (核心逻辑)
const handleDeleteDescItem = async (row, index) => {
  // 有 id → 调用后台删除接口；无 id → 仅前端移除
  if (row.id && !String(row.id).startsWith('temp_')) {
    // ✅ 已存在的记录，调用 deleteInfo.do 删除
    try {
      await ElMessageBox.confirm('确定要删除该语言描述吗？', '提示', { type: 'warning' })
      row.deleting = true

      // ✅ 调用 deleteInfo.do，id 参数传描述记录的 ID
      await request.post('/gift/deleteInfo.do', { id: row.id })

      ElMessage.success('删除成功')
      descList.value.splice(index, 1) // 前端移除
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败：' + (error.message || '未知错误'))
      }
    } finally {
      row.deleting = false
    }
  } else {
    // ✅ 新增的临时行，直接前端移除
    descList.value.splice(index, 1)
    ElMessage.success('已移除')
  }
}

const handleDescDialogClose = () => {
  descList.value = []
  currentGiftId.value = null
}

// 🎁 自动生成库存相关方法 (新增)

// 🔹 打开自动生成库存弹窗
const openAutoStockDialog = (row) => {
  Object.assign(autoStockForm, {
    id: row.id,
    giftCode: row.giftCode,
    giftName: row.giftInfo || row.giftCode,
    giftValue: row.giftValue,  // 默认填入礼物价格
    num: 500,
    stockNoPrefix: `${row.giftCode.toUpperCase()}_${Date.now().toString().slice(-6)}` // 默认前缀
  })
  autoStockDialogVisible.value = true
  setTimeout(() => autoStockFormRef.value?.clearValidate(), 100)
}

// 🔹 提交自动生成库存
const handleAutoStockSubmit = async () => {
  if (!autoStockFormRef.value) return
  await autoStockFormRef.value.validate(async (valid) => {
    if (!valid) return
    autoStockLoading.value = true
    try {
      // ✅ 调用 /gift/autoCreateStock.do 接口
      await request.post('/gift/autoCreateStock.do', {
        id: autoStockForm.id,
        num: autoStockForm.num,
        stockNoPrefix: autoStockForm.stockNoPrefix.trim()
      })

      ElMessage.success(`成功生成 ${autoStockForm.num} 个库存`)
      autoStockDialogVisible.value = false
      handleQuery() // 刷新表格更新库存数量
    } catch (error) {
      ElMessage.error('生成失败：' + (error.message || '未知错误'))
    } finally {
      autoStockLoading.value = false
    }
  })
}

const handleAutoStockDialogClose = () => {
  autoStockFormRef.value?.resetFields()
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.gift-container { padding: 20px; }
.search-card { margin-bottom: 20px; :deep(.el-card__body) { padding: 20px; } }
.table-card {
  :deep(.el-card__body) { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .title { font-size: 16px; font-weight: bold; color: #303133; }
  }
}
.search-buttons { display: flex; gap: 10px; justify-content: flex-end; width: 100%; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
.text-gray { color: #909399; }

/* 封面上传组件样式 */
.cover-uploader {
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9; border-radius: 6px; cursor: pointer; position: relative; overflow: hidden; transition: var(--el-transition-duration-fast);
    &:hover { border-color: var(--el-color-primary); }
  }
  .cover-uploader-icon { font-size: 28px; color: #8c939d; width: 100px; height: 100px; text-align: center; }
  .cover-preview { width: 100px; height: 100px; display: block; object-fit: cover; }
}
.upload-tip { font-size: 12px; color: #909399; margin-top: 4px; }

/* 描述表格输入框样式 */
:deep(.el-table__cell) {
  .el-input__inner, .el-textarea__inner {
    border: none; box-shadow: none; background: transparent;
    &:focus { border: 1px solid var(--el-color-primary); border-radius: 4px; background: #fff; }
  }
}
</style>
