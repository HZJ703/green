<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const keyword = ref('')
</script>

<template>
  <div class="home">
    <header class="home__header">
      <h1 class="home__title">本草集</h1>
      <p class="home__subtitle">Web 可视化（骨架页，功能待填充）</p>
    </header>

    <section class="home__search" aria-label="综合查询">
      <label class="sr-only" for="global-search">搜索草药或关键词</label>
      <input
        id="global-search"
        v-model="keyword"
        type="search"
        class="home__input"
        placeholder="搜索草药名称、功效、产地…（占位，后续接数据与接口）"
        autocomplete="off"
      />
    </section>

    <nav class="home__nav" aria-label="功能入口">
      <RouterLink class="home__link" to="/herb-graph">单味草药信息图谱</RouterLink>
      <RouterLink class="home__link" to="/origin-map">草药产地分布地图</RouterLink>
      <RouterLink class="home__link" to="/nature-meridian">药性与归经统计</RouterLink>
      <RouterLink class="home__link" to="/efficacy-network">功效聚类与关联网络</RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.home {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.home__header {
  text-align: center;
}

.home__title {
  font-size: 1.75rem;
  color: var(--color-heading);
  letter-spacing: 0.08em;
}

.home__subtitle {
  margin-top: 0.5rem;
  color: var(--color-text);
  opacity: 0.85;
  font-size: 0.95rem;
}

.home__search {
  width: 100%;
}

.home__input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-soft);
  color: var(--color-text);
  font-size: 1rem;
}

.home__input:focus {
  outline: 2px solid hsla(160, 100%, 37%, 0.45);
  outline-offset: 2px;
}

.home__nav {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 520px) {
  .home__nav {
    grid-template-columns: 1fr 1fr;
  }
}

.home__link {
  display: block;
  padding: 1rem 1.25rem;
  text-align: center;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-background-mute);
  color: var(--color-heading);
  font-weight: 500;
  text-decoration: none;
  transition:
    background 0.2s,
    border-color 0.2s;
}

.home__link:hover {
  border-color: var(--color-border-hover);
  background: var(--color-background-soft);
}
</style>
