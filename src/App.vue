`<template>
  <el-container>
    <el-header>
      <h1 class="title">API Caller</h1>
    </el-header>
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ElContainer, ElHeader, ElMain } from 'element-plus'
</script>

<style>
.el-header {
  background-color: #409EFF;
  color: white;
  text-align: center;
  line-height: 60px;
}

.el-main {
  padding: 20px;
}

.title {
  margin: 0;
  font-size: 2.5em;
  font-weight: 500;
}
</style>`
