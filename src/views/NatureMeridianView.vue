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
  min-height: calc(100vh - 3rem);
  background: var(--herb-cream);
  border-radius: 20px;
  border: 1px solid var(--herb-border);
  overflow: visible;
}

.page__header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--herb-gradient-header);
  border-bottom: 1px solid var(--herb-border-on-dark);
}

.page__back {
  color: var(--herb-on-dark-soft);
  text-decoration: none;
  font-weight: 500;
  white-space: nowrap;
}

.page__back:hover {
  color: var(--herb-on-dark);
  text-decoration: underline;
}

.page__title {
  color: var(--herb-on-dark);
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: 0.06em;
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
