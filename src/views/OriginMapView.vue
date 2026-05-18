<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="page">
    <div class="page__header">
      <RouterLink class="page__back" to="/">← 返回主界面</RouterLink>
      <div>
        <h1 class="page__title">草药产地分布地图</h1>
        <p class="page__description">基于地图视图查看中药材产地分布、产区热度与药材对比信息。</p>
      </div>
    </div>

    <div class="map-frame">
      <iframe
        title="草药产地分布地图"
        src="/herbmap/index.html"
        loading="lazy"
        class="map-frame__iframe"
      ></iframe>
    </div>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  min-height: calc(100vh - 3rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page__header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
}

.page__back {
  color: hsla(160, 100%, 32%, 1);
  text-decoration: none;
  font-weight: 500;
  white-space: nowrap;
  line-height: 2rem;
}

.page__back:hover {
  text-decoration: underline;
}

.page__title {
  color: var(--color-heading);
  font-size: 1.5rem;
  font-weight: 600;
}

.page__description {
  margin-top: 0.25rem;
  color: var(--color-text);
  opacity: 0.78;
}

.map-frame {
  flex: 1;
  max-width: 1280px;
  width: 100%;
  min-height: 720px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: #f0f7ea;
  box-shadow: 0 18px 48px rgba(31, 92, 71, 0.14);
}

.map-frame__iframe {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 720px;
  border: 0;
  background: #f0f7ea;
}

@media (max-width: 720px) {
  .page__header {
    flex-direction: column;
    gap: 0.35rem;
  }

  .page__back {
    line-height: 1.4;
  }

  .map-frame,
  .map-frame__iframe {
    min-height: 640px;
    border-radius: 14px;
  }
}
</style>
