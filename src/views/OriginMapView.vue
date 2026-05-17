<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="page">
    <RouterLink class="page__back" to="/">← 返回主界面</RouterLink>
    <h1 class="page__title">草药产地分布地图</h1>
    <p class="page__placeholder">空白页：后续在此接入地图（如 ECharts 地图或 GeoJSON + D3）。</p>
  </div>
</template>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
}

.page__back {
  display: inline-block;
  margin-bottom: 1.5rem;
  color: hsla(160, 100%, 32%, 1);
  text-decoration: none;
}

.page__back:hover {
  text-decoration: underline;
}

.page__title {
  font-size: 1.5rem;
  color: var(--color-heading);
  margin-bottom: 0.75rem;
}

.page__placeholder {
  color: var(--color-text);
  opacity: 0.8;
}
</style>
