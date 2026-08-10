<template>
  <div class="player-card-container">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline label-width="80px">
        <el-form-item label="卡等级">
          <!-- 字典下拉，Key 使用接口说明括号中的英文 card_level，设置默认宽度 -->
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
        <el-form-item label="卡名称">
          <el-input
            v-model="searchForm.cardName"
            placeholder="请输入卡名称"
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
          <span>球星卡列表</span>
          <div>
            <el-button type="success" :icon="Upload" @click="openBatchAddDialog">批量添加</el-button>
            <el-button type="primary" :icon="Plus" @click="openAddDialog">新增球星卡</el-button>
            <el-button type="success" :icon="Editor" @click="batchEditDialogVisible = true">批量概率
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="cardLevel" label="卡等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag>{{ getDictLabel('CardLevel', row.cardLevel) || row.cardLevel }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="cardSeries" label="系列名称" min-width="120" show-overflow-tooltip/>
        <el-table-column prop="cardName" label="卡名称" min-width="120" show-overflow-tooltip/>

        <el-table-column prop="cardPicUrl" label="卡片图片" width="100" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.cardPicUrl"
              :src="row.cardPicUrl"
              :preview-src-list="[row.cardPicUrl]"
              fit="cover"
              style="width: 50px; height: 70px; border-radius: 4px;"
              preview-teleported
            />
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column prop="probability" label="概率" width="80" align="center"/>

        <el-table-column prop="disabled" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="isDisabled(row.disabled) ? 'danger' : 'success'">
              {{ isDisabled(row.disabled) ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createAt" label="创建时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
            <el-popconfirm title="确定删除该球星卡吗？" @confirm="handleDelete(row)">
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
    <el-dialog v-model="addDialogVisible" title="新增球星卡" width="500px" destroy-on-close>
      <el-form :model="addForm" label-width="100px" :rules="addRules" ref="addFormRef">
        <el-form-item label="所属系列" prop="backgroundId">
          <el-select v-model="addForm.backgroundId" placeholder="请选择系列" style="width: 100%;">
            <el-option
              v-for="item in backgroundOpts"
              :key="item.id"
              :label="item.cardSeries +` (` + getDictLabel(`CardLevel`,item.cardLevel)+`)`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="卡名称" prop="cardName">
          <el-input v-model="addForm.cardName" placeholder="请输入卡名称"/>
        </el-form-item>
        <el-form-item label="上传图片" prop="file">
          <el-upload
            :auto-upload="false"
            :limit="1"
            accept="image/*"
            list-type="picture-card"
            :on-change="handleAddFileChange"
            :on-remove="handleAddFileRemove"
          >
            <el-icon>
              <Plus/>
            </el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="addLoading" @click="submitAdd">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量添加弹窗 -->
    <el-dialog v-model="batchDialogVisible" title="批量添加球星卡" width="500px" destroy-on-close>
      <el-form :model="batchForm" label-width="100px" :rules="batchRules" ref="batchFormRef">
        <el-form-item label="卡等级" prop="level">
          <el-select v-model="batchForm.level" placeholder="请选择卡等级" clearable style="width: 100%;">
            <el-option v-for="item in cardLevelOptions" :key="item.value" :label="item.label"
                       :value="item.value"/>
          </el-select>
        </el-form-item>
        <el-form-item label="系列名称" prop="series">
          <el-input v-model="batchForm.series" placeholder="请输入系列名称"/>
        </el-form-item>
        <el-form-item label="上传文件" prop="file">
          <el-upload
            :auto-upload="false"
            :limit="1"
            :on-change="handleBatchFileChange"
            :on-remove="handleBatchFileRemove"
            accept=".zip"
          >
            <el-button type="primary">选择文件 (Zip)</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchLoading" @click="submitBatchAdd">确定上传</el-button>
      </template>
    </el-dialog>

    <!-- 编辑弹窗 (仅修改概率) -->
    <el-dialog v-model="editDialogVisible" title="编辑概率" width="400px" destroy-on-close>
      <el-form :model="editForm" label-width="80px" :rules="editRules" ref="editFormRef">
        <el-form-item label="概率" prop="probability">
          <el-input-number v-model="editForm.probability" :min="0" :max="100" style="width: 100%;"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑弹窗 (仅修改概率) -->
    <el-dialog v-model="batchEditDialogVisible" title="编辑概率" width="400px" destroy-on-close>
      <el-form :model="editForm" label-width="80px" :rules="editRules" ref="editFormRef">
        <el-form-item label="卡等级">
          <!-- 字典下拉，Key 使用接口说明括号中的英文 card_level，设置默认宽度 -->
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
        <el-form-item label="卡名称">
          <el-input
            v-model="searchForm.cardName"
            placeholder="请输入卡名称"
            clearable
            style="width: 200px;"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="概率" prop="probability">
          <el-input-number v-model="editForm.probability" :min="0" :max="100" style="width: 100%;"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchEditDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="handleBatchEdit">确定</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import {ref, reactive, onMounted} from 'vue'
import {ElMessage} from 'element-plus'
import {Search, Refresh, Plus, Delete, Upload, Edit} from '@element-plus/icons-vue'
import request from '@/utils/request' // ⚠️ 请根据实际路径调整
import {getDictOptions, getDictLabel} from '@/utils/dict' // ⚠️ 请根据实际路径调整
import {formatDateTime} from '@/utils/format' // ⚠️ 请根据实际路径调整

// ================= 字典与常量 =================
// 接口说明: 卡等级(CardLevel) -> 提取英文转为下划线命名作为字典 Key
const cardLevelOptions = getDictOptions('CardLevel')

// ================= 列表与搜索状态 =================
const loading = ref(false)
const tableData = ref([])
const searchForm = reactive({cardLevel: undefined, cardSeries: undefined, cardName: undefined})
const pagination = reactive({page: 1, pageSize: 10, total: 0})

// 系列下拉数据 (来自 /playerCard/backgroundOpts.do)
const backgroundOpts = ref([])

const batchEditDialogVisible = ref(false)

const handleBatchEdit = () => {
  const payload = {...searchForm, ...editForm}
  request.post('/playerCard/batchEdit.do', payload).then(fetchData)
  batchEditDialogVisible.value = false
}

// ================= 辅助函数 =================
const isDisabled = (val) => val === 1 || val === '1' || val === true

// ================= 核心列表方法 =================
const fetchData = async () => {
  loading.value = true
  try {
    const params = {page: pagination.page, pageSize: pagination.pageSize, ...searchForm}
    // 严格使用接口返回结构 res.list 和 res.total
    const res = await request.post('/playerCard/page.do', params)
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 获取系列下拉选项
const fetchBackgroundOpts = async () => {
  try {
    const res = await request.post('/playerCard/backgroundOpts.do')
    // 接口返回的是 CardBackground 数组，直接赋值
    backgroundOpts.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

const handleSearch = () => {
  pagination.page = 1;
  fetchData()
}
const handleReset = () => {
  searchForm.cardLevel = '';
  searchForm.cardSeries = '';
  searchForm.cardName = '';
  handleSearch()
}
const handleSizeChange = (val) => {
  pagination.pageSize = val;
  fetchData()
}
const handleCurrentChange = (val) => {
  pagination.page = val;
  fetchData()
}

// ================= 删除功能 =================
const handleDelete = async (row) => {
  try {
    // 接口要求 body 传 { id: xxx }
    await request.post('/playerCard/delete.do', {id: row.id})
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

// ================= 新增功能 =================
const addDialogVisible = ref(false)
const addLoading = ref(false)
const addFormRef = ref(null)
const addForm = reactive({backgroundId: '', cardName: ''})
const addFile = ref(null)
const addRules = {
  backgroundId: [{required: true, message: '请选择所属系列', trigger: 'change'}],
  cardName: [{required: true, message: '请输入卡名称', trigger: 'blur'}]
}

const openAddDialog = () => {
  addForm.backgroundId = '';
  addForm.cardName = '';
  addFile.value = null
  addDialogVisible.value = true
}

const handleAddFileChange = (file) => {
  addFile.value = file.raw
}
const handleAddFileRemove = () => {
  addFile.value = null
}

const submitAdd = async () => {
  if (!addFormRef.value) return
  await addFormRef.value.validate()
  if (!addFile.value) return ElMessage.warning('请上传图片')

  addLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', addFile.value)

    // 严格按照 Swagger：backgroundId 和 cardName 是 query 参数，拼接到 URL 上
    const url = `/playerCard/add.do?backgroundId=${addForm.backgroundId}&cardName=${encodeURIComponent(addForm.cardName)}`
    await request.post(url, formData)

    ElMessage.success('新增成功')
    addDialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    addLoading.value = false
  }
}

// ================= 批量添加功能 =================
const batchDialogVisible = ref(false)
const batchLoading = ref(false)
const batchFormRef = ref(null)
const batchForm = reactive({level: -1, series: ''})
const batchFile = ref(null)
const batchRules = {
  series: [{required: true, message: '请输入系列名称', trigger: 'blur'}]
}

const openBatchAddDialog = () => {
  batchForm.level = '';
  batchForm.series = '';
  batchFile.value = null
  batchDialogVisible.value = true
}

const handleBatchFileChange = (file) => {
  batchFile.value = file.raw
}
const handleBatchFileRemove = () => {
  batchFile.value = null
}

const submitBatchAdd = async () => {
  if (!batchFormRef.value) return
  await batchFormRef.value.validate()
  if (!batchFile.value) return ElMessage.warning('请选择文件')

  batchLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', batchFile.value)
    const level = batchForm.level || -1
    // 严格按照 Swagger：level 和 series 是 query 参数
    const url = `/playerCard/batchAdd.do?level=${level}&series=${encodeURIComponent(batchForm.series)}`
    await request.post(url, formData)

    ElMessage.success('批量添加成功')
    batchDialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    batchLoading.value = false
  }
}

// ================= 编辑功能 (修改概率) =================
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editFormRef = ref(null)
const editForm = reactive({id: null, probability: 0})
const editRules = {
  probability: [{required: true, message: '请输入概率', trigger: 'blur'}]
}

const openEditDialog = (row) => {
  editForm.id = row.id
  editForm.probability = row.probability || 0
  editDialogVisible.value = true
}

const submitEdit = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate()

  editLoading.value = true
  try {
    // 严格按照 Swagger：body 传 StarPlayerCardEditForm (id, probability)
    await request.post('/playerCard/edit.do', {
      id: editForm.id,
      probability: editForm.probability
    })

    ElMessage.success('编辑成功')
    editDialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    editLoading.value = false
  }
}

// ================= 生命周期 =================
onMounted(() => {
  fetchData()
  fetchBackgroundOpts()
})
</script>

<style scoped lang="scss">
.player-card-container {
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

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
