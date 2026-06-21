<script setup lang="ts">
import { RouterLink } from 'vue-router'
import HerbMap from '@/components/HerbMap.vue'
</script>

<template>
  <div class="page">
    <div class="page__header">
      <RouterLink class="page__back" to="/">← 返回主界面</RouterLink>
      <div>
        <h1 class="page__title">草药产地分布地图</h1>
        <p class="page__description">搜索药材后，地图将以颜色高亮其产区；点击省份可查看该省药材列表。</p>
      </div>
    </div>
    <div class="map-container">
      <HerbMap />
    </div>
  </div>
</template>

<style scoped>
/* 使页面背景与地图一致，并让地图填满剩余空间 */
.page {
  width: calc(100% + 2 * clamp(1rem, 4vw, 2.5rem));
  height: 100vh;
  margin: -1.5rem calc(-1 * clamp(1rem, 4vw, 2.5rem));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--herb-bg-deep);
}
.page__header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--herb-pine);
  flex-shrink: 0;
  background: var(--herb-gradient-header);
}
.page__back {
  color: var(--herb-on-dark-soft);
  text-decoration: none;
  font-weight: 500;
  white-space: nowrap;
}
.page__back:hover { text-decoration: underline; color: var(--herb-on-dark); }
.page__title {
  color: var(--herb-on-dark);
  font-size: 1.2rem;
  font-weight: 600;
}
.page__description {
  margin-top: 0.1rem;
  color: var(--herb-on-dark-soft);
  opacity: 0.9;
  font-size: 0.9rem;
}
.map-container {
  flex: 1;                    /* 占据剩余全部高度 */
  min-height: 0;
  padding: 0.4rem 0.8rem 0.8rem;
  overflow: hidden;
}
.map-container :deep(.herb-map-app) {
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--herb-pine);
}
</style>