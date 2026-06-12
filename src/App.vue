<template>
  <RouterView />
</template>

<script setup>
import { RouterView } from 'vue-router'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
#app {
  height: 100vh;
  width: 100vw;
}
/* 🔧 全局修复 TinyMCE 弹窗层级问题 */
.tox-dialog-wrap {
  z-index: 9999 !important;
}
.tox-dialog__backdrop {
  z-index: 9998 !important;
}
.tox-dialog {
  z-index: 10000 !important;
}
.tox-dialog input[type="file"] {
  z-index: 10001 !important;
  position: relative;
}
</style>
