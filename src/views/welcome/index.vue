<template>
  <div class="welcome">
    <h1>欢迎使用 Sport Admin</h1>
    <el-button @click="testDict">测试字典调用</el-button>
  </div>
</template>
<script setup>
import { getDictLabel, getDictOptions } from '@/utils/dict'
const testDict = () => console.log('字典示例:', getDictOptions('RoleType'))
</script>
