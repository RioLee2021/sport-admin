<template>
  <div class="roulette-container">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline label-width="100px">
        <el-form-item label="奖品序号">
          <el-input v-model="searchForm.itemNum" placeholder="请输入" clearable style="width: 200px;" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="奖品类型">
          <el-select v-model="searchForm.prizeType" placeholder="请选择" clearable style="width: 200px;">
            <el-option v-for="item in prizeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
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
          <span>轮盘奖品列表</span>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="itemNum" label="奖品序号" width="100" align="center" />
        <el-table-column prop="prizeType" label="奖品类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag>{{ getDictLabel('PrizeType', row.prizeType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="probability" label="中奖概率" width="100" align="center">
          <template #default="{ row }">
            {{ (row.probability / 1000).toFixed(2) }}%
          </template>
        </el-table-column>
        <el-table-column prop="picUrl" label="奖品图片" width="100" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.picUrl"
              :src="row.picUrl"
              fit="cover"
              style="width: 50px; height: 50px; border-radius: 4px;"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="prizeParam" label="奖品参数" min-width="150" show-overflow-tooltip />
        <el-table-column prop="i18nCode" label="国际化编码" width="150" show-overflow-tooltip />
        <el-table-column prop="disabled" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createAt" label="创建时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openI18nDialog(row)">多语言描述</el-button>
            <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑奖品" width="600px" destroy-on-close>
      <el-form :model="editForm" label-width="120px" :rules="editRules" ref="editFormRef">
        <el-form-item label="奖品序号">
          <el-input :model-value="editForm.itemNum" disabled />
        </el-form-item>
        <el-form-item label="奖品类型" prop="prizeType">
          <el-select v-model="editForm.prizeType" placeholder="请选择" style="width: 100%;">
            <el-option v-for="item in prizeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="国际化代码" prop="prizeParam">
          <el-input v-model="editForm.i18nCode" placeholder="请输入国际化代码" />
        </el-form-item>
        <el-form-item label="中奖概率" prop="probability">
          <el-input-number v-model="editForm.probability" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="奖品图片" prop="picUrl">
          <el-upload
            :http-request="handleUploadBanner"
            :before-upload="beforeUpload"
            list-type="picture-card"
            :limit="1"
          >
            <el-image v-if="editForm.picUrl" :src="editForm.picUrl" style="width: 100px; height: 100px;" fit="cover" />
            <el-icon v-else><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="奖品参数" prop="prizeParam">
          <el-input v-model="editForm.prizeParam" placeholder="请输入奖品参数" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 多语言描述弹窗 -->
    <el-dialog v-model="i18nDialogVisible" title="礼物多语言描述" width="900px" destroy-on-close>
      <el-alert
        title="提示：每行可独立保存/删除，新增描述保存后会自动创建记录"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      />

      <el-table :data="i18nList" border style="width: 100%; margin-bottom: 16px;">
        <el-table-column label="语言代码" width="200">
          <template #default="{ row, $index }">
            <el-input
              v-if="row.isNew"
              v-model="row.languageCode"
              placeholder="如: zh-CN"
              size="small"
              style="width: 150px;"
            />
            <span v-else>{{ row.languageCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="描述内容" min-width="300">
          <template #default="{ row }">
            <el-input
              v-model="row.value"
              placeholder="请输入描述内容"
              size="small"
              type="textarea"
              :rows="2"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row, $index }">
            <el-button
              v-if="row.isNew"
              type="primary"
              link
              @click="saveI18n(row, $index)"
            >
              新增
            </el-button>
            <el-button
              v-else
              type="primary"
              link
              @click="updateI18n(row)"
            >
              更新
            </el-button>
            <el-button
              type="danger"
              link
              @click="deleteI18n(row, $index)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-button type="primary" link :icon="Plus" @click="addI18nRow">
        添加语言描述
      </el-button>

      <template #footer>
        <el-button @click="i18nDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { formatDateTime } from '@/utils/format'
import { getDictOptions, getDictLabel } from '@/utils/dict'

// ================= 公共字典选项 =================
const prizeTypeOptions = getDictOptions('PrizeType')

// ================= 列表与搜索状态 =================
const loading = ref(false)
const tableData = ref([])
const searchForm = reactive({
  itemNum: '',
  prizeType: ''
})

// ================= 编辑弹窗状态 =================
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  id: null,
  i18nCode: '',
  picUrl: '',
  prizeParam: '',
  prizeType: '',
  probability: 0
})

const editRules = {
  prizeType: [{ required: true, message: '请选择奖品类型', trigger: 'change' }],
  probability: [{ required: true, message: '请输入中奖概率', trigger: 'blur' }],
  picUrl: [{ required: true, message: '请上传奖品图片', trigger: 'change' }],
  prizeParam: [{ required: true, message: '请输入奖品参数', trigger: 'blur' }]
}

// ================= 多语言描述状态 =================
const i18nDialogVisible = ref(false)
const currentPrizeId = ref(null)
const i18nList = ref([])

// ================= 上传配置 =================
const uploadUrl = '/pub/uploadPic.do'
const uploadHeaders = computed(() => ({
  'Authorization': localStorage.getItem('token') || ''
}))

// ================= 辅助函数 =================
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 5
  if (!isImage) ElMessage.error('只能上传图片文件!')
  if (!isLt2M) ElMessage.error('图片大小不能超过 5MB!')
  return isImage && isLt2M
}

const handlePicSuccess = (response) => {
  // 假设返回格式为 { code: 200, data: '图片URL' }
  editForm.picUrl = response.data || response.url
}

/** 📤 自定义上传逻辑 */
const handleUploadBanner = async ({ file }) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    // ⚠️ 注意：请根据后端实际定义修改 type 值 (如 2 或 3)
    const res = await request.post('/pub/uploadPic.do', formData, {
      params: { type: 8 },
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    const url = res.data?.url || res.data || ''
    if (url) {
      editForm.picUrl = url
      ElMessage.success('上传成功')
    } else {
      ElMessage.error('上传失败：未返回图片地址')
    }
  } catch (error) {
    ElMessage.error('上传失败：' + (error.message || '未知错误'))
  }
}

// ================= 核心列表方法 =================
const fetchData = async () => {
  loading.value = true
  try {
    const params = { ...searchForm }
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined || params[key] === null) {
        delete params[key]
      }
    })

    const res = await request.post('/roulette/list.do', params)
    tableData.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { fetchData() }
const handleReset = () => {
  searchForm.itemNum = ''
  searchForm.prizeType = ''
  handleSearch()
}

// ================= 编辑功能 =================
const openEditDialog = (row) => {
  Object.assign(editForm, {
    id: row.id,
    itemNum: row.itemNum,
    i18nCode: row.i18nCode,
    picUrl: row.picUrl,
    prizeParam: row.prizeParam,
    prizeType: row.prizeType,
    probability: row.probability
  })
  editDialogVisible.value = true
}

const submitEdit = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate()

  editLoading.value = true
  try {
    await request.post('/roulette/edit.do', editForm)
    ElMessage.success('编辑成功')
    editDialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    editLoading.value = false
  }
}

// ================= 多语言描述功能 =================
const openI18nDialog = async (row) => {
  currentPrizeId.value = row.id
  i18nList.value = []
  i18nDialogVisible.value = true

  // 加载已有的多语言描述
  try {
    const res = await request.post('/roulette/infoList.do', { id: row.id })
    if (res.data && res.data.length > 0) {
      i18nList.value = res.data.map(item => ({
        id: item.id,
        languageCode: item.languageCode,
        value: item.value,
        isNew: false
      }))
    }
  } catch (e) {
    console.error('加载多语言描述失败', e)
  }
}

const addI18nRow = () => {
  i18nList.value.push({
    languageCode: '',
    value: '',
    isNew: true
  })
}

const saveI18n = async (row, index) => {
  if (!row.languageCode || !row.value) {
    ElMessage.warning('请输入语言代码和描述内容')
    return
  }

  try {
    await request.post('/roulette/saveInfo.do', {
      id: currentPrizeId.value,
      languageCode: row.languageCode,
      info: row.value
    })
    ElMessage.success('保存成功')
    row.isNew = false
    // 重新加载列表
    await openI18nDialog({ id: currentPrizeId.value })
  } catch (e) {
    console.error('保存失败', e)
  }
}

const updateI18n = async (row) => {
  if (!row.value) {
    ElMessage.warning('请输入描述内容')
    return
  }

  try {
    await request.post('/roulette/saveInfo.do', {
      id: row.id,
      languageCode: row.languageCode,
      info: row.value
    })
    ElMessage.success('更新成功')
  } catch (e) {
    console.error('更新失败', e)
  }
}

const deleteI18n = async (row, index) => {
  try {
    await ElMessageBox.confirm('确定删除该语言描述吗？', '提示', { type: 'warning' })

    if (row.isNew) {
      // 新增的行直接删除
      i18nList.value.splice(index, 1)
    } else {
      // 已保存的行调用删除接口
      await request.post('/roulette/deleteInfo.do', { id: row.id })
      ElMessage.success('删除成功')
      // 重新加载列表
      await openI18nDialog({ id: currentPrizeId.value })
    }
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

// ================= 生命周期 =================
onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.roulette-container {
  padding: 20px;

  .search-card {
    margin-bottom: 16px;
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}
</style>
