<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import rawHerbs from '../data/herbs.json'
import HerbRelatedPanels from '../components/HerbRelatedPanels.vue'

// 草药数据类型定义
interface Herb {
  '中药名称': string
  '药性': string
  '归经': string
  '产地': string
  '科属分类': string
  '药材基原': string
  '功效关键词': string
  '具体功效': string
}

// 路由实例
const route = useRoute()
const router = useRouter()

// 响应式数据
const herbsData = ref<Herb[]>(rawHerbs)
const currentIndex = ref(0)
const searchKeyword = ref('')

// 当前显示的草药
const currentHerb = computed(() => {
  return herbsData.value[currentIndex.value] ?? null
})

// 数据总数
const herbTotal = computed(() => herbsData.value.length)

// Vite 动态加载图片
const getImageUrl = (name: string) => {
  try {
    return new URL(`../data/images/${name}.jpg`, import.meta.url).href
  } catch {
    return ''
  }
}

// 图片加载失败安全处理
const handleImageError = (e: Event) => {
  const target = e.currentTarget
  if (target instanceof HTMLImageElement) {
    target.src = ''
  }
}

// 搜索功能
function searchHerb() {
  const key = searchKeyword.value.trim()
  if (!key) return
  const idx = herbsData.value.findIndex(item => item['中药名称'] === key)
  if (idx !== -1) currentIndex.value = idx
}

// 上一页
function prevHerb() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

// 下一页
function nextHerb() {
  if (currentIndex.value < herbTotal.value - 1) {
    currentIndex.value++
  }
}

// ----- 定位到指定药材（由路由参数触发） -----
function locateHerb(name: string) {
  if (!name) return
  const target = name.trim()
  const idx = herbsData.value.findIndex(item => item['中药名称'] === target)
  if (idx !== -1) {
    currentIndex.value = idx
    searchKeyword.value = ''   // 清空搜索框，避免干扰
  } else {
    console.warn(`未找到药材: ${target}`)
  }
}

// ----- 返回上一页或来源页 -----
function goBack() {
  const from = route.query.from as string
  if (from) {
    router.push(from)
  } else {
    router.back()
  }
}

// ---------- 生命周期 ----------
// 组件挂载时读取 URL 参数
onMounted(() => {
  const name = route.query.name as string
  if (name) {
    nextTick(() => {
      locateHerb(name)
    })
  }
})

// 监听路由参数变化（当用户从地图多次点击不同药材时）
watch(
  () => route.query.name,
  (newName) => {
    if (newName && typeof newName === 'string') {
      locateHerb(newName)
    }
  }
)
</script>

<template>
  <div class="page">
    <!-- 头部：返回按钮 + 标题 -->
    <div class="page__header">
      <button class="page__back-btn" @click="goBack">
        <i class="fas fa-arrow-left"></i> 返回
      </button>
      <h1 class="page__title">单味草药信息图谱</h1>
      <span style="width: 80px;"></span> <!-- 占位保持标题居中 -->
    </div>

    <div class="search-box">
      <input
        v-model="searchKeyword"
        placeholder="输入草药名称搜索"
        @keyup.enter="searchHerb"
      />
      <button @click="searchHerb">搜索</button>
    </div>

    <div class="flip-container">
      <span class="flip-text" @click="prevHerb" :class="{ disable: currentIndex === 0 }">
        上一页 《
      </span>

      <div class="card" v-if="currentHerb">
        <div class="image-box">
          <img
            :src="getImageUrl(currentHerb['中药名称'])"
            class="herb-img"
            alt="药材"
            @error="handleImageError"
          />
          <div class="no-image" v-if="!getImageUrl(currentHerb['中药名称'])">暂无图片</div>
        </div>

        <div class="info-list">
          <div class="info-item"><label>中药名称：</label><span>{{ currentHerb['中药名称'] }}</span></div>
          <div class="info-item"><label>药性：</label><span>{{ currentHerb['药性'] }}</span></div>
          <div class="info-item"><label>归经：</label><span>{{ currentHerb['归经'] }}</span></div>
          <div class="info-item"><label>产地：</label><span>{{ currentHerb['产地'] }}</span></div>
          <div class="info-item"><label>科属分类：</label><span>{{ currentHerb['科属分类'] }}</span></div>
          <div class="info-item"><label>药材基原：</label><span>{{ currentHerb['药材基原'] }}</span></div>
          <div class="info-item"><label>功效关键词：</label><span>{{ currentHerb['功效关键词'] }}</span></div>
          <div class="info-item detail"><label>具体功效：</label><span>{{ currentHerb['具体功效'] }}</span></div>
        </div>
      </div>

      <span class="flip-text" @click="nextHerb" :class="{ disable: currentIndex >= herbTotal - 1 }">
        》 下一页
      </span>
    </div>

    <HerbRelatedPanels
      v-if="currentHerb"
      :key="currentHerb['中药名称']"
      :herb="currentHerb"
    />
  </div>
</template>

<style scoped>
/* 页面整体 — 本草绿韵 */
.page {
  min-height: 100vh;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1rem;
  box-sizing: border-box;
  background: var(--herb-cream);
  border-radius: 20px;
  border: 1px solid var(--herb-border);
  box-shadow: var(--herb-shadow);
}

.page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--herb-border);
}

.page__back-btn {
  background: var(--herb-parchment);
  border: 1px solid var(--herb-border-soft);
  border-radius: 30px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 15px;
  color: var(--herb-forest);
  transition: background 0.2s, border-color 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.page__back-btn:hover {
  background: var(--herb-leaf);
  color: var(--herb-ink);
  border-color: var(--herb-mint);
}

.page__title {
  font-size: 2rem;
  color: var(--herb-forest);
  text-align: center;
  font-weight: 600;
  letter-spacing: 3px;
  text-shadow: 0 2px 4px rgba(30, 77, 58, 0.1);
  font-family: "KaiTi", "STKaiti", "Serif";
  margin: 0;
}

.search-box {
  display: flex;
  gap: 10px;
  margin: 16px 0 28px;
}
.search-box input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--herb-border-soft);
  border-radius: 8px;
  outline: none;
  font-size: 15px;
  background: var(--herb-paper);
  color: var(--herb-text);
}
.search-box input::placeholder {
  color: var(--herb-text-muted);
}
.search-box button {
  padding: 10px 20px;
  background: var(--herb-sage);
  color: var(--herb-paper);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}
.search-box button:hover {
  background: var(--herb-forest);
}

.flip-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.flip-text {
  font-size: 16px;
  color: var(--herb-sage);
  cursor: pointer;
  padding: 6px 12px;
  user-select: none;
  transition: 0.2s;
}
.flip-text:hover:not(.disable) {
  color: var(--herb-forest);
  text-decoration: underline;
}
.flip-text.disable {
  color: var(--herb-text-muted);
  cursor: not-allowed;
}

.card {
  flex: 1;
  background: var(--herb-paper);
  border-radius: 14px;
  padding: 28px;
  display: flex;
  gap: 28px;
  box-shadow: var(--herb-shadow);
  border: 1px solid var(--herb-border-soft);
}

.image-box {
  width: 200px;
  height: 200px;
  background: var(--herb-parchment);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px dashed var(--herb-border-soft);
  position: relative;
}
.herb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}
.no-image {
  color: var(--herb-text-muted);
  font-size: 14px;
  position: absolute;
}

.info-list {
  flex: 1;
}
.info-item {
  margin-bottom: 12px;
  line-height: 1.7;
  font-size: 15px;
  color: var(--herb-text);
}
.info-item label {
  font-weight: 600;
  min-width: 90px;
  display: inline-block;
  color: var(--herb-sage);
}
.info-item.detail {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--herb-border-soft);
}

@media (max-width: 700px) {
  .page__header {
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
  .card {
    flex-direction: column;
    align-items: center;
  }
  .image-box {
    width: 150px;
    height: 150px;
  }
}
</style>