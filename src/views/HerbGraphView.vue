<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ref, computed } from 'vue'
import rawHerbs from '../data/herbs.json'

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

const herbsData = ref<Herb[]>(rawHerbs as Herb[])
const currentIndex = ref(0)
const searchKeyword = ref('')

const currentHerb = computed(() => herbsData.value[currentIndex.value] ?? null)
const herbTotal = computed(() => herbsData.value.length)

function searchHerb() {
  const key = searchKeyword.value.trim()
  if (!key) return
  const idx = herbsData.value.findIndex(item => item['中药名称'] === key)
  if (idx !== -1) currentIndex.value = idx
}

function prevHerb() {
  if (currentIndex.value > 0) currentIndex.value--
}
function nextHerb() {
  if (currentIndex.value < herbTotal.value - 1) {
    currentIndex.value++
  }
}
</script>

<template>
  <div class="page">
    <RouterLink class="page__back" to="/">← 返回主界面</RouterLink>
    <h1 class="page__title">单味草药信息图谱</h1>

    <div class="search-box">
      <input
        v-model="searchKeyword"
        placeholder="输入草药名称搜索"
        @keyup.enter="searchHerb"
      />
      <button @click="searchHerb">搜索</button>
    </div>

    <div class="flip-container">
      <button class="flip-btn" @click="prevHerb" :disabled="currentIndex === 0">《</button>

      <div class="card" v-if="currentHerb">
        <div class="image-box">
          <div class="no-image">暂无药材图片</div>
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

      <button class="flip-btn" @click="nextHerb" :disabled="currentIndex >= herbTotal - 1">》</button>
    </div>
  </div>
</template>

<style scoped>
/* 全局页面：古典青绿渐变 + 植物暗纹背景 */
.page {
  min-height: 100vh;
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1rem;
  box-sizing: border-box;

  background: linear-gradient(135deg, #e8f5ee 0%, #d4e9dc 50%, #c2dfce 100%);
  background-image:
    radial-gradient(circle at 10% 20%, rgba(120, 180, 140, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(120, 180, 140, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(100, 160, 120, 0.1) 0%, transparent 60%);
  background-attachment: fixed;
}

/* 返回链接 */
.page__back {
  display: inline-block;
  margin-bottom: 1.5rem;
  color: #2c5c42;
  text-decoration: none;
  font-size: 15px;
  letter-spacing: 1px;
}
.page__back:hover {
  color: #1f4733;
  text-decoration: underline;
}

/* 标题：好看的古风字体（安全版，不崩溃） */
.page__title {
  font-size: 2rem;
  color: #234d36;
  text-align: center;
  margin-bottom: 1.5rem;
  font-weight: 600;
  letter-spacing: 3px;
  text-shadow: 0 2px 4px rgba(60, 110, 80, 0.15);
  font-family: "KaiTi", "STKaiti", "Serif";
}

/* 搜索栏 */
.search-box {
  display: flex;
  gap: 10px;
  margin: 16px 0 28px;
}
.search-box input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #b8d4c5;
  border-radius: 8px;
  outline: none;
  font-size: 15px;
  background: rgba(255, 255, 255, 0.7);
  color: #234d36;
}
.search-box input::placeholder {
  color: #6b8c7b;
}
.search-box button {
  padding: 10px 20px;
  background: #3a7d5e;
  color: #f5f9f7;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}
.search-box button:hover {
  background: #2c5c42;
}

/* 翻页容器 */
.flip-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 翻页按钮 */
.flip-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid #b8d4c5;
  background: rgba(255, 255, 255, 0.75);
  color: #2c5c42;
  font-size: 22px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.flip-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.flip-btn:hover:not(:disabled) {
  background: #3a7d5e;
  color: #fff;
}

/* 信息卡片 */
.card {
  flex: 1;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 14px;
  padding: 28px;
  display: flex;
  gap: 28px;
  box-shadow: 0 6px 20px rgba(60, 120, 90, 0.18);
  border: 1px solid rgba(150, 190, 170, 0.4);
}

/* 图片框 */
.image-box {
  width: 200px;
  height: 200px;
  background: rgba(232, 245, 238, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px dashed #b8d4c5;
}
.no-image {
  color: #6b8c7b;
  font-size: 14px;
}

/* 信息文字 */
.info-list {
  flex: 1;
}
.info-item {
  margin-bottom: 12px;
  line-height: 1.7;
  font-size: 15px;
  color: #234d36;
}
.info-item label {
  font-weight: 600;
  min-width: 90px;
  display: inline-block;
  color: #2c5c42;
}
.info-item.detail {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #b8d4c5;
}
</style>
