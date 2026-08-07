<template>
  <div class="card-series-container">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline label-width="80px">
        <el-form-item label="卡等级">
          <!-- 字典下拉，设置默认宽度 -->
          <el-select
            v-model="searchForm.cardLevel"
            placeholder="请选择卡等级"
            clearable
            style="width: 200px;"
          >
            <el-option
              v-for="item in cardLevelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="系列名称">
          <el-input
            v-model="searchForm.cardSeries"
            placeholder="请输入系列名称"
            clearable
            style="width: 200px;"
            @keyup.enter="handleSearch"
          />
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
          <span>卡系列列表</span>
          <el-button type="primary" :icon="Plus" @click="openAddDialog">新增卡系列</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="cardLevel" label="卡等级" width="120" align="center">
          <template #default="{ row }">
            <el-tag>{{ getDictLabel('CardLevel', row.cardLevel) || row.cardLevel }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="cardSeries" label="系列名称" width="250" show-overflow-tooltip />

        <el-table-column prop="picUrl" label="卡片图片" width="120" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.picUrl"
              :src="row.picUrl"
              :preview-src-list="[row.picUrl]"
              fit="cover"
              style="width: 60px; height: 80px; border-radius: 4px;"
              preview-teleported
            />
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column prop="probability" label="概率" width="80" align="center" />

        <el-table-column prop="updateAt" label="更新时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.updateAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="auto" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Editor" @click="openParamDialog(row)">修改概率</el-button>
            <el-button type="warning" link :icon="Upload" @click="openUploadDialog(row)">重新上传</el-button>
            <el-popconfirm title="确定删除该卡系列吗？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button type="danger" link :icon="Delete">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增弹窗 -->
    <el-dialog v-model="addDialogVisible" title="新增卡系列" width="500px" destroy-on-close>
      <el-form :model="addForm" label-width="100px" :rules="addRules" ref="addFormRef">
        <el-form-item label="卡等级" prop="cardLevel">
          <el-select v-model="addForm.cardLevel" placeholder="请选择" style="width: 100%;">
            <el-option v-for="item in cardLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="系列名称" prop="cardSeries">
          <el-input v-model="addForm.cardSeries" placeholder="请输入系列名称" />
        </el-form-item>
        <el-form-item label="上传图片" prop="file">
          <el-upload
            ref="addUploadRef"
            :auto-upload="false"
            :limit="1"
            accept="image/*"
            list-type="picture-card"
            :on-change="handleAddFileChange"
            :on-remove="handleAddFileRemove"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="addLoading" @click="submitAdd">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重新上传弹窗 -->
    <el-dialog v-model="uploadDialogVisible" title="重新上传图片" width="500px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="当前图片">
          <el-image v-if="currentRow.picUrl" :src="currentRow.picUrl" fit="cover" style="width: 60px; height: 80px;" />
        </el-form-item>
        <el-form-item label="新图片">
          <el-upload
            :auto-upload="false"
            :limit="1"
            accept="image/*"
            list-type="picture-card"
            :on-change="handleReUploadFileChange"
            :on-remove="handleReUploadFileRemove"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploadLoading" @click="submitReUpload">确定上传</el-button>
      </template>
    </el-dialog>

    <!-- 图片参数配置弹窗 -->
    <el-dialog v-model="paramDialogVisible" title="配置图片参数" width="700px" destroy-on-close>
      <el-form :model="paramForm" label-width="120px">
        <el-form-item label="系列">
          <el-input label="系列" v-model="paramForm.cardSeries" style="width: 200px;" disabled />
        </el-form-item>
        <el-form-item label="等级">
          <el-input label="等级" v-model="paramForm.levelName" style="width: 200px;" disabled />
        </el-form-item>
        <el-form-item label="概率">
          <el-input-number v-model="paramForm.probability" :min="0" style="width: 200px;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="paramDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="paramLoading" @click="submitParam">保存参数</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Plus, Delete, Upload, Setting } from '@element-plus/icons-vue'
import request from '@/utils/request' // ⚠️ 请根据实际路径调整
import { getDictOptions, getDictLabel } from '@/utils/dict' // ⚠️ 请根据实际路径调整
import { formatDateTime } from '@/utils/format' // ⚠️ 请根据实际路径调整

// ================= 字典与常量 =================
// ⚠️ 注意：这里的 'card_level' 需要与您系统中实际的字典编码保持一致
const cardLevelOptions = getDictOptions('CardLevel')

// ================= 列表与搜索状态 =================
const loading = ref(false)
const tableData = ref([])
const searchForm = reactive({ cardLevel: undefined, cardSeries: undefined })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

// ================= 辅助函数 =================
const isDisabled = (val) => val === 1 || val === '1' || val === true

const getEmptyParamDetail = () => ({ startX: 0, startY: 0, endX: 0, endY: 0, width: 0, height: 0 })

// ================= 核心列表方法 =================
const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize, ...searchForm }
    const res = await request.post('/cardSeries/page.do', params)
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const handleSearch = () => { pagination.page = 1; fetchData() }
const handleReset = () => { searchForm.cardLevel = ''; searchForm.cardSeries = ''; handleSearch() }
const handleSizeChange = (val) => { pagination.pageSize = val; fetchData() }
const handleCurrentChange = (val) => { pagination.page = val; fetchData() }

// ================= 删除功能 =================
const handleDelete = async (row) => {
  try {
    await request.post('/cardSeries/delete.do', { id: row.id })
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) { console.error(e) }
}

// ================= 新增功能 =================
const addDialogVisible = ref(false)
const addLoading = ref(false)
const addFormRef = ref(null)
const addUploadRef = ref(null)
const addForm = reactive({ cardLevel: '', cardSeries: '' })
const addFile = ref(null)
const addRules = {
  cardLevel: [{ required: true, message: '请选择卡等级', trigger: 'change' }],
  cardSeries: [{ required: true, message: '请输入系列名称', trigger: 'blur' }]
}

const openAddDialog = () => {
  addForm.cardLevel = ''; addForm.cardSeries = ''; addFile.value = null
  addDialogVisible.value = true
}

const handleAddFileChange = (file) => { addFile.value = file.raw }
const handleAddFileRemove = () => { addFile.value = null }

const submitAdd = async () => {
  if (!addFormRef.value) return
  await addFormRef.value.validate()
  if (!addFile.value) return ElMessage.warning('请上传图片')

  addLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', addFile.value)

    // 严格按照 Swagger：cardLevel 和 cardSeries 是 query 参数，拼接到 URL 上
    const url = `/cardSeries/add.do?cardLevel=${addForm.cardLevel}&cardSeries=${encodeURIComponent(addForm.cardSeries)}`
    await request.post(url, formData)

    ElMessage.success('新增成功')
    addDialogVisible.value = false
    fetchData()
  } catch (e) { console.error(e) }
  finally { addLoading.value = false }
}

// ================= 重新上传功能 =================
const uploadDialogVisible = ref(false)
const uploadLoading = ref(false)
const currentRow = ref({})
const reUploadFile = ref(null)

const openUploadDialog = (row) => {
  currentRow.value = row
  reUploadFile.value = null
  uploadDialogVisible.value = true
}

const handleReUploadFileChange = (file) => { reUploadFile.value = file.raw }
const handleReUploadFileRemove = () => { reUploadFile.value = null }

const submitReUpload = async () => {
  if (!reUploadFile.value) return ElMessage.warning('请选择新图片')

  uploadLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', reUploadFile.value)

    // id 是 query 参数
    const url = `/cardSeries/uploadPic.do?id=${currentRow.value.id}`
    await request.post(url, formData)

    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    fetchData()
  } catch (e) { console.error(e) }
  finally { uploadLoading.value = false }
}

// ================= 图片参数配置功能 =================
const paramDialogVisible = ref(false)
const paramLoading = ref(false)
const paramForm = reactive({
  id: null,
  probability: 0,
  levelName: '',
  cardSeries: ''
})

const openParamDialog = (row) => {
  paramForm.id = row.id
  paramForm.cardSeries = row.cardSeries
  paramForm.levelName = getDictLabel('CardLevel',row.cardLevel)

  paramDialogVisible.value = true
}

const submitParam = async () => {
  paramLoading.value = true
  try {
    await request.post('/cardSeries/edit.do', paramForm)
    ElMessage.success('参数保存成功')
    paramDialogVisible.value = false
    fetchData()
  } catch (e) { console.error(e) }
  finally { paramLoading.value = false }
}

// ================= 生命周期 =================
onMounted(() => { fetchData() })
</script>

<style scoped lang="scss">
.card-series-container {
  padding: 20px;

  .search-card { margin-bottom: 16px; }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
