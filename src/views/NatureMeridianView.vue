<script setup lang="ts">
import { RouterLink } from 'vue-router'
import DynamicPropertyChart from '../components/DynamicPropertyChart.vue'
</script>

<template>
  <div class="page">
    <div class="page__header">
      <RouterLink class="page__back" to="/">← 返回主界面</RouterLink>
      <h1 class="page__title">药性与归经统计</h1>
    </div>

    <div class="page__content">
      <DynamicPropertyChart />
    </div>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
}

.page__header {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem 1rem;
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
  font-size: 1.5rem;
  font-weight: 600;
}

.page__content {
  width: 100%;
}

@media (max-width: 640px) {
  .page__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.35rem;
  }
}
</style>
