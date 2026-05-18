<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import rawHerbs from '../data/herbs.json'

interface Herb {
  '中药名称': string
  '药性': string
  '归经': string
  '产地': string
  '功效关键词': string
  '具体功效': string
  '功效分类': string
  '药材基原': string
  '科属分类': string
}

const keyword = ref('')
const herbs = rawHerbs as Herb[]

const matchedHerb = computed(() => {
  const key = keyword.value.trim()
  if (!key) return herbs[0]

  return (
    herbs.find((herb) =>
      [herb['中药名称'], herb['功效关键词'], herb['产地'], herb['归经']]
        .join(' ')
        .includes(key),
    ) ?? herbs[0]
  )
})

function countBy(field: keyof Herb) {
  const counts = new Map<string, number>()

  herbs.forEach((herb) => {
    String(herb[field] ?? '')
      .split(/[、,，；;\s]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1))
  })

  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

const topOrigins = computed(() => countBy('产地').slice(0, 4))
const topNatures = computed(() => countBy('药性').slice(0, 4))
const topMeridians = computed(() => countBy('归经').slice(0, 5))
const topEffects = computed(() => countBy('功效分类').slice(0, 4))

const overviewStats = computed(() => [
  { label: '草药条目', value: herbs.length },
  { label: '产地线索', value: countBy('产地').length },
  { label: '功效分类', value: countBy('功效分类').length },
  { label: '归经维度', value: countBy('归经').length },
])
</script>

<template>
  <main class="overview">
    <nav class="top-nav" aria-label="首页模块导航">
      <RouterLink class="top-nav__brand" to="/">本草集</RouterLink>
      <div class="top-nav__links">
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/compatibility">配伍关系</RouterLink>
        <RouterLink to="/origin-map">产地地图</RouterLink>
        <RouterLink to="/herb-graph">草药图谱</RouterLink>
        <RouterLink to="/efficacy-network">功能聚类</RouterLink>
        <RouterLink to="/nature-meridian">药性归经</RouterLink>
      </div>
    </nav>

    <section class="hero" aria-labelledby="home-title">
      <div class="hero__content">
        <p class="hero__eyebrow">中草药文化数据可视化平台</p>
        <h1 id="home-title" class="hero__title">本草集</h1>
        <p class="hero__subtitle">以数据视角梳理药性、归经、产地、功效与草药知识图谱。</p>

        <label class="search" for="global-search">
          <span class="search__icon" aria-hidden="true">⌕</span>
          <input
            id="global-search"
            v-model="keyword"
            type="search"
            placeholder="搜索本草、功效、产地或归经..."
            autocomplete="off"
          />
        </label>
      </div>

      <div class="hero__panel" aria-label="数据概览">
        <div v-for="stat in overviewStats" :key="stat.label" class="stat">
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.label }}</span>
        </div>
      </div>
    </section>

    <section class="dashboard" aria-label="可视化模块总览">
      <RouterLink class="module module--wide" to="/compatibility">
        <div class="module__header">
          <span class="module__mark">配</span>
          <div>
            <h2>配伍关系</h2>
            <p>展示常见中药配伍关系与关联结构。</p>
          </div>
          <span class="module__action">进入模块</span>
        </div>
        <div class="chart-space network-preview" aria-hidden="true">
          <span class="node node--main">关系</span>
          <span class="node node--a">核心节点</span>
          <span class="node node--b">关联节点</span>
          <span class="node node--c">辅助节点</span>
          <span class="node node--d">调和节点</span>
          <i class="line line--one"></i>
          <i class="line line--two"></i>
          <i class="line line--three"></i>
          <i class="line line--four"></i>
        </div>
      </RouterLink>

      <RouterLink class="module module--map" to="/origin-map">
        <div class="module__header">
          <span class="module__mark">地</span>
          <div>
            <h2>产地地图</h2>
            <p>展示草药产区分布，当前先呈现真实产地排行。</p>
          </div>
        </div>
        <div class="chart-space map-preview">
          <div class="map-thumb" aria-hidden="true">
            <div class="china-shape"></div>
            <span class="map-marker map-marker--one"></span>
            <span class="map-marker map-marker--two"></span>
            <span class="map-marker map-marker--three"></span>
            <span class="map-marker map-marker--four"></span>
          </div>
          <ul class="origin-rank">
            <li v-for="origin in topOrigins" :key="origin.name">
              <span>{{ origin.name }}</span>
              <strong>{{ origin.value }} 种</strong>
            </li>
          </ul>
        </div>
      </RouterLink>

      <RouterLink class="module module--herb" to="/herb-graph">
        <div class="module__header">
          <span class="module__mark">草</span>
          <div>
            <h2>单味草药信息图谱</h2>
            <p>展示单味草药属性、归经与功效信息。</p>
          </div>
        </div>
        <div class="chart-space herb-preview">
          <div class="herb-preview__image">
            <span class="herb-preview__glyph">药</span>
            <i class="herb-preview__leaf herb-preview__leaf--one"></i>
            <i class="herb-preview__leaf herb-preview__leaf--two"></i>
            <small>{{ matchedHerb['药材基原'] }}</small>
          </div>
          <dl>
            <div>
              <dt>名称</dt>
              <dd>{{ matchedHerb['中药名称'] }}</dd>
            </div>
            <div>
              <dt>药性</dt>
              <dd>{{ matchedHerb['药性'] }}</dd>
            </div>
            <div>
              <dt>归经</dt>
              <dd>{{ matchedHerb['归经'] }}</dd>
            </div>
            <div>
              <dt>功效</dt>
              <dd>{{ matchedHerb['功效关键词'] }}</dd>
            </div>
          </dl>
        </div>
      </RouterLink>

      <RouterLink class="module" to="/efficacy-network">
        <div class="module__header">
          <span class="module__mark">效</span>
          <div>
            <h2>功能聚类</h2>
            <p>展示中药功效分类与聚类分布。</p>
          </div>
        </div>
        <div class="chart-space cluster-preview">
          <div class="cluster-map" aria-hidden="true">
            <span class="cluster-node cluster-node--core">功</span>
            <span class="cluster-node cluster-node--a">{{ topEffects[0]?.value ?? 0 }}</span>
            <span class="cluster-node cluster-node--b">{{ topEffects[1]?.value ?? 0 }}</span>
            <span class="cluster-node cluster-node--c">{{ topEffects[2]?.value ?? 0 }}</span>
            <span class="cluster-node cluster-node--d">{{ topEffects[3]?.value ?? 0 }}</span>
            <i class="cluster-link cluster-link--a"></i>
            <i class="cluster-link cluster-link--b"></i>
            <i class="cluster-link cluster-link--c"></i>
            <i class="cluster-link cluster-link--d"></i>
          </div>
          <div class="cluster-rank">
            <div v-for="effect in topEffects" :key="effect.name" class="cluster-row">
              <span>{{ effect.name }}</span>
              <i :style="{ width: `${Math.max(22, effect.value * 6)}%` }"></i>
              <strong>{{ effect.value }}</strong>
            </div>
          </div>
        </div>
      </RouterLink>

      <RouterLink class="module module--wide" to="/nature-meridian">
        <div class="module__header">
          <span class="module__mark">经</span>
          <div>
            <h2>药性归经</h2>
            <p>展示药性特征与归经分布统计。</p>
          </div>
        </div>
        <div class="chart-space property-preview">
          <div class="property-mini-dashboard" aria-hidden="true">
            <div class="property-mini-charts">
              <div class="property-mini-card">
                <span class="property-mini-title">五性分布</span>
                <div class="property-pie"></div>
                <div class="property-legend">
                  <i>寒</i>
                  <i>热</i>
                  <i>温</i>
                  <i>凉</i>
                  <i>平</i>
                </div>
              </div>
              <div class="property-mini-card">
                <span class="property-mini-title">药性分类</span>
                <div class="property-donut">
                  <span>{{ topNatures.length }}</span>
                </div>
                <div class="property-note">品种占比</div>
              </div>
            </div>
            <div class="meridian-mini-panel">
              <div class="meridian-mini-head">
                <span>十二经脉归经统计</span>
                <em>条形图</em>
              </div>
              <div class="meridian-ranked-bars">
                <i
                  v-for="meridian in topMeridians"
                  :key="meridian.name"
                  :style="{ width: `${Math.min(96, Math.max(28, meridian.value * 7))}%` }"
                >
                  <span>{{ meridian.name }}</span>
                  <strong>{{ meridian.value }}</strong>
                </i>
              </div>
            </div>
          </div>
        </div>
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.overview {
  min-height: calc(100vh - 3rem);
  color: #f3fff7;
  background:
    radial-gradient(circle at 16% 18%, rgba(151, 221, 165, 0.2), transparent 30%),
    radial-gradient(circle at 78% 10%, rgba(78, 197, 167, 0.2), transparent 28%),
    linear-gradient(135deg, rgba(43, 139, 111, 0.98), rgba(73, 164, 124, 0.96) 48%, rgba(33, 127, 118, 0.98)),
    repeating-linear-gradient(90deg, rgba(216, 246, 211, 0.055) 0 1px, transparent 1px 88px);
  border: 1px solid rgba(199, 238, 205, 0.24);
  border-radius: 24px;
  overflow: hidden;
  position: relative;
}

.overview::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(120deg, transparent 0 58%, rgba(205, 241, 210, 0.09) 58% 59%, transparent 59%),
    radial-gradient(ellipse at 8% 78%, rgba(205, 239, 191, 0.11), transparent 34%),
    repeating-linear-gradient(0deg, rgba(238, 255, 241, 0.035) 0 1px, transparent 1px 44px);
  pointer-events: none;
}

.top-nav,
.hero,
.dashboard {
  position: relative;
  z-index: 1;
}

.top-nav {
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.48rem clamp(1rem, 3vw, 2rem);
  border-bottom: 1px solid rgba(223, 255, 225, 0.14);
  background: rgba(42, 139, 111, 0.22);
  backdrop-filter: blur(8px);
}

.top-nav__brand {
  color: #f8fff9;
  font-family: 'KaiTi', 'STKaiti', serif;
  font-size: 1.18rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-decoration: none;
  white-space: nowrap;
}

.top-nav__links {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: clamp(0.4rem, 1.5vw, 1rem);
  flex-wrap: wrap;
}

.top-nav__links a {
  padding: 0.35rem 0.55rem;
  border-radius: 999px;
  color: rgba(245, 255, 249, 0.74);
  font-size: 0.86rem;
  text-decoration: none;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.top-nav__links a:hover,
.top-nav__links a.router-link-active {
  color: #ffffff;
  background: rgba(187, 239, 200, 0.16);
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 460px);
  gap: 1rem;
  padding: clamp(1rem, 2.4vw, 2rem) clamp(1rem, 3vw, 2rem);
  background:
    radial-gradient(circle at 18% 26%, rgba(205, 245, 191, 0.18), transparent 30%),
    linear-gradient(135deg, rgba(67, 171, 130, 0.32), rgba(72, 189, 151, 0.14));
  border-bottom: 1px solid rgba(205, 239, 210, 0.2);
}

.hero__content {
  width: fit-content;
  max-width: 680px;
  position: relative;
}

.hero__content::before {
  content: '';
  position: absolute;
  inset: -1.4rem -3.5rem -1.2rem -1.6rem;
  background:
    radial-gradient(ellipse at 24% 42%, rgba(14, 77, 65, 0.34), transparent 58%),
    radial-gradient(ellipse at 0% 18%, rgba(16, 88, 72, 0.18), transparent 52%);
  pointer-events: none;
}

.hero__content > * {
  position: relative;
  z-index: 1;
}

.hero__eyebrow {
  color: #f0f8bd;
  font-weight: 600;
  font-size: 0.82rem;
  letter-spacing: 0.28em;
  text-shadow: 0 1px 8px rgba(12, 69, 58, 0.18);
}

.hero__title {
  margin-top: 0.1rem;
  font-family: 'KaiTi', 'STKaiti', serif;
  font-size: clamp(2.55rem, 5.8vw, 4.8rem);
  line-height: 0.95;
  letter-spacing: 0.08em;
  color: #fffdf1;
  text-shadow:
    0 1px 8px rgba(13, 71, 60, 0.24),
    0 10px 24px rgba(20, 98, 72, 0.14);
}

.hero__subtitle {
  max-width: 520px;
  margin-top: 0.75rem;
  color: rgba(251, 255, 247, 0.94);
  font-size: 0.98rem;
  font-weight: 500;
  text-shadow: 0 1px 8px rgba(13, 71, 60, 0.18);
}

.search {
  width: min(100%, 520px);
  margin-top: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.9rem;
  border: 1px solid rgba(211, 250, 217, 0.32);
  border-radius: 999px;
  background: rgba(33, 118, 96, 0.34);
  backdrop-filter: blur(10px);
}

.search__icon {
  color: #e6f6b9;
  font-size: 1.15rem;
}

.search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #fbfff7;
  font-size: 0.98rem;
}

.search input::placeholder {
  color: rgba(246, 255, 248, 0.72);
}

.hero__panel {
  align-self: center;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.stat {
  min-height: 86px;
  padding: 0.9rem;
  border: 1px solid rgba(224, 255, 228, 0.3);
  border-radius: 18px;
  background: rgba(38, 132, 104, 0.38);
  box-shadow:
    0 14px 34px rgba(23, 98, 75, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.13);
  backdrop-filter: blur(12px);
}

.stat strong {
  display: block;
  color: #fbfff7;
  font-size: 1.85rem;
  line-height: 1;
}

.stat span {
  display: block;
  margin-top: 0.45rem;
  color: rgba(246, 255, 248, 0.8);
  font-size: 0.86rem;
}

.dashboard {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  padding: clamp(0.75rem, 2vw, 1.35rem);
  background:
    radial-gradient(circle at 82% 8%, rgba(115, 205, 154, 0.12), transparent 26%),
    linear-gradient(180deg, rgba(23, 111, 94, 0.26), rgba(17, 93, 82, 0.36));
}

.module {
  min-height: 268px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid rgba(195, 237, 202, 0.24);
  border-radius: 22px;
  color: inherit;
  text-decoration: none;
  background:
    linear-gradient(145deg, rgba(42, 130, 104, 0.62), rgba(22, 101, 84, 0.56)),
    rgba(21, 98, 82, 0.5);
  box-shadow:
    0 18px 42px rgba(18, 88, 68, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(12px);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.dashboard > .module:first-child {
  border-color: rgba(196, 255, 206, 0.44);
  box-shadow:
    0 20px 48px rgba(16, 82, 64, 0.24),
    0 0 0 1px rgba(217, 255, 191, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.dashboard > .module:first-child .module__mark {
  background: rgba(217, 255, 191, 0.1);
  box-shadow: 0 0 18px rgba(151, 232, 178, 0.22);
}

.module:hover {
  transform: translateY(-4px);
  border-color: rgba(181, 255, 205, 0.62);
  background:
    linear-gradient(145deg, rgba(55, 150, 118, 0.66), rgba(29, 121, 98, 0.56)),
    rgba(27, 112, 94, 0.54);
  box-shadow:
    0 20px 46px rgba(30, 143, 102, 0.26),
    0 0 24px rgba(150, 255, 196, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.module--wide {
  grid-column: span 2;
}

.module--map {
  grid-column: span 2;
}

.module__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.65rem;
  align-items: start;
}

.module__mark {
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  border: 1px solid rgba(217, 255, 191, 0.48);
  border-radius: 50%;
  color: #ecf8b6;
  font-family: 'KaiTi', 'STKaiti', serif;
  font-size: 1.05rem;
}

.module h2 {
  color: #fbfff7;
  font-size: 1.08rem;
  font-weight: 700;
}

.module p {
  margin-top: 0.16rem;
  color: rgba(246, 255, 248, 0.74);
  font-size: 0.82rem;
  line-height: 1.45;
}

.module__action {
  padding: 0.32rem 0.65rem;
  border: 1px solid rgba(217, 255, 191, 0.6);
  border-radius: 999px;
  color: #ecf8b6;
  white-space: nowrap;
}

.chart-space {
  flex: 1;
  min-height: 158px;
  border-radius: 16px;
  border: 1px solid rgba(181, 225, 193, 0.18);
  background:
    radial-gradient(circle at 24% 20%, rgba(170, 231, 184, 0.08), transparent 38%),
    rgba(12, 72, 63, 0.42);
  position: relative;
  overflow: hidden;
}

.chart-space::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle, rgba(213, 255, 220, 0.12) 1px, transparent 1.4px),
    radial-gradient(circle at 72% 18%, rgba(143, 226, 176, 0.06), transparent 24%);
  background-size:
    28px 28px,
    100% 100%;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.52), rgba(0, 0, 0, 0.18));
  pointer-events: none;
}

.chart-space > * {
  position: relative;
  z-index: 1;
}

.network-preview {
  min-height: 178px;
}

.node {
  position: absolute;
  min-width: 4.4rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0 0.55rem;
  border: 1px solid rgba(215, 247, 181, 0.36);
  border-radius: 999px;
  background:
    radial-gradient(circle at 25% 20%, rgba(255, 255, 236, 0.42), transparent 28%),
    linear-gradient(145deg, rgba(134, 221, 169, 0.95), rgba(70, 174, 132, 0.9));
  color: #155640;
  font-size: 0.78rem;
  font-weight: 700;
  box-shadow:
    0 0 0 6px rgba(137, 231, 173, 0.1),
    0 10px 18px rgba(10, 55, 45, 0.14);
}

.node em {
  color: rgba(21, 86, 64, 0.78);
  font-size: 0.66rem;
  font-style: normal;
  font-weight: 600;
}

.node--main {
  left: 50%;
  top: 44%;
  min-width: 3.6rem;
  height: 3rem;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 236, 0.72), transparent 26%),
    linear-gradient(145deg, #e8f2a6, #9ee9b9);
  transform: translate(-50%, -50%);
  font-size: 0.92rem;
  box-shadow:
    0 0 0 9px rgba(227, 238, 150, 0.08),
    0 0 26px rgba(145, 229, 173, 0.22),
    0 12px 24px rgba(10, 55, 45, 0.16);
}

.node--a {
  left: 14%;
  top: 18%;
}

.node--b {
  right: 11%;
  top: 18%;
}

.node--c {
  left: 18%;
  bottom: 16%;
}

.node--d {
  right: 14%;
  bottom: 18%;
}

.line {
  position: absolute;
  left: 50%;
  top: 45%;
  width: 24%;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(227, 238, 150, 0.4), rgba(134, 221, 169, 0.08));
  transform-origin: left center;
}

.line--one {
  transform: rotate(-146deg);
}

.line--two {
  transform: rotate(-34deg);
}

.line--three {
  transform: rotate(142deg);
}

.line--four {
  transform: rotate(34deg);
}

.map-preview {
  display: grid;
  grid-template-columns: minmax(160px, 1.05fr) 1fr;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem;
}

.map-thumb {
  min-height: 128px;
  position: relative;
  display: grid;
  place-items: center;
}

.china-shape {
  width: min(100%, 170px);
  height: 112px;
  border: 1px solid rgba(215, 247, 181, 0.34);
  border-radius: 48% 42% 44% 36% / 38% 44% 48% 52%;
  background:
    radial-gradient(circle at 58% 42%, rgba(145, 229, 173, 0.4), transparent 13%),
    radial-gradient(circle at 36% 46%, rgba(227, 238, 150, 0.32), transparent 16%),
    linear-gradient(145deg, rgba(61, 156, 120, 0.54), rgba(20, 93, 77, 0.58));
  box-shadow:
    inset 0 0 30px rgba(145, 229, 173, 0.12),
    0 14px 28px rgba(10, 55, 45, 0.14);
  clip-path: polygon(
    12% 42%,
    22% 24%,
    42% 18%,
    56% 26%,
    70% 20%,
    88% 36%,
    82% 54%,
    92% 70%,
    68% 82%,
    44% 74%,
    28% 86%,
    18% 66%
  );
}

.map-marker {
  position: absolute;
  width: 0.72rem;
  height: 0.72rem;
  border-radius: 50%;
  background: #e3ee96;
  box-shadow:
    0 0 0 5px rgba(227, 238, 150, 0.1),
    0 0 18px rgba(145, 229, 173, 0.38);
}

.map-marker::after {
  content: '';
  position: absolute;
  inset: -0.35rem;
  border: 1px solid rgba(227, 238, 150, 0.28);
  border-radius: 50%;
}

.map-marker--one {
  left: 28%;
  top: 34%;
}

.map-marker--two {
  left: 48%;
  top: 48%;
  width: 0.9rem;
  height: 0.9rem;
}

.map-marker--three {
  right: 22%;
  top: 38%;
}

.map-marker--four {
  right: 30%;
  bottom: 24%;
  width: 0.58rem;
  height: 0.58rem;
}

.origin-rank {
  display: grid;
  gap: 0.52rem;
  list-style: none;
}

.origin-rank li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: rgba(248, 255, 249, 0.82);
  font-size: 0.9rem;
}

.origin-rank strong {
  color: #fbfff7;
}

.herb-preview {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 0.8rem;
  padding: 0.85rem;
}

.herb-preview__image {
  height: 88px;
  display: grid;
  place-items: center;
  border: 1px dashed rgba(215, 247, 181, 0.48);
  border-radius: 18px;
  color: #e3ee96;
  font-family: 'KaiTi', 'STKaiti', serif;
  font-size: 2rem;
  background:
    radial-gradient(circle at 50% 36%, rgba(227, 238, 150, 0.16), transparent 34%),
    linear-gradient(145deg, rgba(32, 121, 98, 0.38), rgba(15, 78, 66, 0.24));
  position: relative;
  overflow: hidden;
}

.herb-preview__image::before {
  content: '';
  position: absolute;
  left: 48%;
  top: 18%;
  width: 1px;
  height: 58%;
  background: rgba(227, 238, 150, 0.32);
  transform: rotate(18deg);
}

.herb-preview__glyph {
  position: relative;
  z-index: 2;
  line-height: 1;
  text-shadow: 0 8px 18px rgba(12, 72, 63, 0.28);
}

.herb-preview__leaf {
  position: absolute;
  display: block;
  width: 2.4rem;
  height: 1rem;
  border-radius: 100% 0 100% 0;
  background: linear-gradient(135deg, rgba(145, 229, 173, 0.88), rgba(227, 238, 150, 0.38));
  opacity: 0.78;
}

.herb-preview__leaf--one {
  left: 14%;
  top: 24%;
  transform: rotate(-28deg);
}

.herb-preview__leaf--two {
  right: 12%;
  bottom: 24%;
  transform: rotate(152deg) scale(0.82);
}

.herb-preview__image small {
  position: absolute;
  left: 50%;
  bottom: 0.45rem;
  max-width: calc(100% - 1rem);
  padding: 0.16rem 0.42rem;
  border: 1px solid rgba(215, 247, 181, 0.3);
  border-radius: 999px;
  background: rgba(12, 72, 63, 0.32);
  color: rgba(251, 255, 247, 0.78);
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-size: 0.62rem;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  transform: translateX(-50%);
}

.herb-preview dl {
  display: grid;
  gap: 0.42rem;
  align-content: start;
}

.herb-preview div {
  display: grid;
  grid-template-columns: 3.2rem 1fr;
  gap: 0.55rem;
  font-size: 0.9rem;
}

.herb-preview dt {
  color: rgba(248, 255, 249, 0.72);
}

.herb-preview dd {
  color: #fbfff7;
}

.cluster-preview {
  display: grid;
  grid-template-columns: minmax(96px, 0.95fr) 1.35fr;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem;
}

.cluster-map {
  min-height: 122px;
  position: relative;
}

.cluster-node {
  position: absolute;
  width: 2.05rem;
  height: 2.05rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background:
    radial-gradient(circle at 32% 28%, rgba(252, 255, 229, 0.58), transparent 28%),
    linear-gradient(145deg, rgba(157, 238, 184, 0.96), rgba(91, 197, 150, 0.9));
  color: #155640;
  font-size: 0.76rem;
  font-weight: 700;
  box-shadow:
    0 0 0 6px rgba(137, 231, 173, 0.08),
    0 0 20px rgba(127, 235, 171, 0.22),
    0 8px 18px rgba(10, 55, 45, 0.14);
}

.cluster-node--core {
  left: 50%;
  top: 48%;
  width: 3rem;
  height: 3rem;
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 236, 0.72), transparent 26%),
    linear-gradient(145deg, #e8f2a6, #9ee9b9);
  transform: translate(-50%, -50%);
  font-size: 1.05rem;
  box-shadow:
    0 0 0 8px rgba(227, 238, 150, 0.08),
    0 0 28px rgba(154, 238, 184, 0.28),
    0 12px 24px rgba(10, 55, 45, 0.16);
}

.cluster-node--a {
  left: 8%;
  top: 14%;
  width: 2.35rem;
  height: 2.35rem;
}

.cluster-node--b {
  right: 8%;
  top: 16%;
  width: 2.15rem;
  height: 2.15rem;
}

.cluster-node--c {
  left: 18%;
  bottom: 10%;
  width: 1.95rem;
  height: 1.95rem;
}

.cluster-node--d {
  right: 16%;
  bottom: 12%;
  width: 1.78rem;
  height: 1.78rem;
  font-size: 0.7rem;
}

.cluster-link {
  position: absolute;
  left: 50%;
  top: 49%;
  width: 34%;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(227, 238, 150, 0.36), rgba(134, 221, 169, 0.06));
  transform-origin: left center;
}

.cluster-link--a {
  transform: rotate(-148deg);
}

.cluster-link--b {
  transform: rotate(-28deg);
}

.cluster-link--c {
  transform: rotate(138deg);
}

.cluster-link--d {
  transform: rotate(34deg);
}

.cluster-rank {
  display: grid;
  gap: 0.48rem;
}

.cluster-row {
  display: grid;
  grid-template-columns: minmax(3.8rem, 1fr) 1.4fr auto;
  align-items: center;
  gap: 0.5rem;
  color: rgba(248, 255, 249, 0.88);
  font-size: 0.82rem;
}

.cluster-row i {
  height: 7px;
  border-radius: 999px;
  background: linear-gradient(90deg, #91e5ad, #e3ee96);
}

.cluster-row strong {
  color: #fbfff7;
}

.property-preview {
  padding: 0.85rem;
}

.property-mini-dashboard {
  display: grid;
  grid-template-columns: minmax(210px, 0.95fr) 1.35fr;
  gap: 0.85rem;
  align-items: stretch;
  position: relative;
}

.property-mini-dashboard::before {
  content: '药性特征 / 归经统计';
  position: absolute;
  left: 0.4rem;
  top: -0.15rem;
  padding: 0.12rem 0.48rem;
  border: 1px solid rgba(227, 238, 150, 0.22);
  border-radius: 999px;
  background: rgba(12, 72, 63, 0.38);
  color: rgba(251, 255, 247, 0.72);
  font-size: 0.64rem;
  z-index: 2;
}

.property-mini-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem;
  padding-top: 0.8rem;
}

.property-mini-card,
.meridian-mini-panel {
  border: 1px solid rgba(211, 246, 216, 0.2);
  border-radius: 14px;
  background: rgba(21, 93, 76, 0.22);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.property-mini-card {
  display: grid;
  justify-items: center;
  gap: 0.42rem;
  min-height: 132px;
  padding: 0.62rem;
}

.property-mini-title,
.meridian-mini-head span {
  color: rgba(248, 255, 249, 0.86);
  font-size: 0.78rem;
  font-weight: 700;
}

.property-pie,
.property-donut {
  width: 68px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  position: relative;
}

.property-pie {
  background:
    conic-gradient(#6ad19a 0 28%, #9ee9b9 28% 48%, #e3ee96 48% 67%, rgba(145, 229, 173, 0.72) 67% 84%, rgba(255, 255, 255, 0.16) 84%),
    rgba(12, 72, 63, 0.28);
}

.property-donut {
  background:
    conic-gradient(#e3ee96 0 42%, #86dda9 42% 72%, rgba(145, 229, 173, 0.42) 72%),
    rgba(12, 72, 63, 0.28);
}

.property-donut::after {
  content: '';
  position: absolute;
  inset: 14px;
  border-radius: 50%;
  background: #1c705b;
}

.property-pie span,
.property-donut span {
  position: relative;
  z-index: 1;
  color: #fbfff7;
  font-size: 0.9rem;
  font-weight: 800;
}

.property-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.24rem;
}

.property-legend i,
.property-note {
  color: rgba(248, 255, 249, 0.7);
  font-size: 0.64rem;
  font-style: normal;
}

.property-legend i {
  padding: 0.12rem 0.28rem;
  border-radius: 999px;
  background: rgba(12, 72, 63, 0.25);
}

.meridian-mini-panel {
  padding: 0.72rem;
  padding-top: 1rem;
}

.meridian-mini-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.68rem;
}

.meridian-mini-head em {
  padding: 0.16rem 0.42rem;
  border: 1px solid rgba(227, 238, 150, 0.28);
  border-radius: 999px;
  color: #e3ee96;
  font-size: 0.66rem;
  font-style: normal;
}

.meridian-ranked-bars {
  display: grid;
  gap: 0.48rem;
}

.meridian-ranked-bars i {
  min-width: 34%;
  height: 1.05rem;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.4rem;
  padding: 0 0.48rem;
  border-radius: 999px;
  background:
    linear-gradient(90deg, #91e5ad, #e3ee96),
    rgba(12, 72, 63, 0.28);
  color: rgba(18, 86, 64, 0.9);
  font-style: normal;
  font-weight: 700;
}

.meridian-ranked-bars span {
  font-size: 0.74rem;
  white-space: nowrap;
}

.meridian-ranked-bars strong {
  justify-self: end;
  font-size: 0.68rem;
}

@media (max-width: 1100px) {
  .top-nav {
    align-items: flex-start;
    flex-direction: column;
  }

  .top-nav__links {
    justify-content: flex-start;
  }

  .hero {
    grid-template-columns: 1fr;
  }

  .hero__panel {
    align-self: auto;
  }

  .dashboard {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .overview {
    border-radius: 18px;
  }

  .top-nav {
    padding: 0.8rem 1rem;
  }

  .top-nav__links {
    gap: 0.25rem;
  }

  .top-nav__links a {
    padding: 0.28rem 0.42rem;
    font-size: 0.82rem;
  }

  .hero {
    padding: 1rem;
  }

  .hero__title {
    font-size: 3rem;
  }

  .hero__panel,
  .dashboard,
  .map-preview,
  .herb-preview,
  .cluster-preview,
  .property-mini-dashboard {
    grid-template-columns: 1fr;
  }

  .module,
  .module--wide,
  .module--map {
    grid-column: span 1;
  }

  .module__header {
    grid-template-columns: auto 1fr;
  }

  .module__action {
    display: none;
  }

  .property-mini-charts {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
