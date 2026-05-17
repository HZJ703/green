<script setup lang="ts">
import { RouterLink } from 'vue-router'
import FunctionClustering from '../components/FunctionClustering.vue'
</script>

<template>
  <div class="page">
    <div class="page__header">
      <RouterLink class="page__back" to="/">← 返回主界面</RouterLink>
      <h1 class="page__title">功效聚类与关联网络</h1>
    </div>

    <div class="page__content">
      <FunctionClustering />
    </div>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  height: calc(100vh - 3rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page__header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.page__back {
  color: hsla(160, 100%, 32%, 1);
  text-decoration: none;
  font-weight: 500;
  white-space: nowrap;
}

.page__back:hover {
  text-decoration: underline;
}

.page__title {
  color: var(--color-heading);
  font-size: 1.25rem;
  font-weight: 600;
}

.page__content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 640px) {
  .page__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.35rem;
  }
}
</style>
