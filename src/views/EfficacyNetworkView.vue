<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import FunctionClustering from '../components/FunctionClustering.vue'

const searchKeyword = ref('')
const dropdownVisible = ref(false)
const clusteringRef = ref<InstanceType<typeof FunctionClustering> | null>(null)

const CATEGORY_TAG: Record<string, string> = {
  草药: '中药材',
  归经: '归经（脏腑）',
  功效: '功效关键词',
}

const matches = computed<Array<{ name: string; category: string; exact: boolean }>>(() => {
  const kw = searchKeyword.value.trim()
  if (!kw || !clusteringRef.value) return []
  return clusteringRef.value.searchMatches(kw)
})

watch(searchKeyword, (val) => {
  // 清空输入 → 自动解除搜索高亮 + 还原详情面板
  if (!val.trim()) {
    clusteringRef.value?.clearSearch()
  }
})

function onSelectMatch(name: string) {
  clusteringRef.value?.applySearch(name)
  dropdownVisible.value = false
}

function onEnter() {
  if (matches.value.length > 0) {
    onSelectMatch(matches.value[0].name)
  }
}

function onBlur() {
  // 延时关闭，让下拉项的 mousedown.click 先完成
  window.setTimeout(() => {
    dropdownVisible.value = false
  }, 180)
}

// 子组件内部 click 节点 → 解除搜索状态，让手动选择接管
function onClusteringNodeClick() {
  if (searchKeyword.value) {
    searchKeyword.value = ''
  }
  dropdownVisible.value = false
}
</script>

<template>
  <div class="page">
    <div class="page__header">
      <div class="page__header-left">
        <RouterLink class="page__back" to="/">← 返回</RouterLink>
        <h1 class="page__title">本草集・功效聚类与关联</h1>
      </div>
      <div class="page__header-right">
        <span class="page__search-icon">⌕</span>
        <input
          v-model="searchKeyword"
          class="page__search"
          type="text"
          placeholder="搜索药材 / 归经 / 功效"
          @focus="dropdownVisible = true"
          @blur="onBlur"
          @keydown.enter="onEnter"
          @keydown.escape="searchKeyword = ''"
        />
        <div
          v-if="dropdownVisible && searchKeyword.trim()"
          class="page__search-dropdown"
        >
          <template v-if="matches.length">
            <div
              v-for="m in matches"
              :key="m.category + '|' + m.name"
              class="page__search-item"
              :class="{ 'page__search-item--exact': m.exact }"
              @mousedown.prevent="onSelectMatch(m.name)"
            >
              <span class="page__search-item-name">{{ m.name }}</span>
              <span class="page__search-item-tag">{{ CATEGORY_TAG[m.category] }}</span>
            </div>
          </template>
          <div v-else class="page__search-empty">未找到匹配内容</div>
        </div>
      </div>
    </div>

    <div class="page__content">
      <FunctionClustering ref="clusteringRef" @node-clicked="onClusteringNodeClick" />
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
  background-color: var(--herb-cream);
  border-radius: 20px;
  border: 1px solid var(--herb-border);
}

.page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.5rem;
  background: var(--herb-gradient-header);
  color: var(--herb-on-dark);
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(30, 77, 58, 0.15);
}

.page__header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.page__back {
  color: var(--herb-on-dark-soft);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.85rem;
  white-space: nowrap;
  transition: color 0.2s;
}

.page__back:hover {
  color: var(--herb-on-dark);
  text-decoration: underline;
}

.page__title {
  color: var(--herb-on-dark);
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  margin: 0;
}

.page__header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.page__search-icon {
  position: absolute;
  left: 0.85rem;
  color: var(--herb-on-dark-muted);
  font-size: 0.95rem;
  pointer-events: none;
}

.page__search {
  width: 260px;
  padding: 0.45rem 0.9rem 0.45rem 2.1rem;
  border-radius: 999px;
  border: 1px solid var(--herb-border-on-dark);
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--herb-on-dark);
  font-size: 0.85rem;
  outline: none;
  transition: background 0.2s, border-color 0.2s;
}

.page__search::placeholder {
  color: var(--herb-on-dark-muted);
}

.page__search:focus {
  background-color: rgba(255, 255, 255, 0.16);
  border-color: var(--herb-leaf);
}

.page__search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  max-height: 320px;
  overflow-y: auto;
  background: var(--herb-paper);
  border: 1px solid var(--herb-border-soft);
  border-radius: 12px;
  box-shadow: var(--herb-shadow-lg);
  z-index: 50;
  padding: 0.35rem 0;
}

.page__search-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.9rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--herb-text);
  transition: background 0.15s;
}

.page__search-item:hover {
  background: var(--herb-parchment);
}

.page__search-item--exact .page__search-item-name {
  color: var(--herb-forest);
  font-weight: 600;
}

.page__search-item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page__search-item-tag {
  flex-shrink: 0;
  padding: 0.12rem 0.55rem;
  border-radius: 999px;
  background: var(--herb-parchment);
  color: var(--herb-sage);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}

.page__search-empty {
  padding: 0.85rem 0.9rem;
  text-align: center;
  font-size: 0.85rem;
  color: var(--herb-text-muted);
  letter-spacing: 0.04em;
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
    gap: 0.5rem;
    padding: 0.75rem 1rem;
  }

  .page__search {
    width: 100%;
  }

  .page__search-dropdown {
    width: 100%;
  }
}
</style>
