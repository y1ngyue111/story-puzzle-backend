<template>
  <div id="app">
    <!-- 这里就是所有页面渲染的出口 -->
    <router-view />
  </div>
</template>

<script setup>
// 暂时不需要写逻辑
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
}
</style>
