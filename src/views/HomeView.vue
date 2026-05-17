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
        <RouterLink to="/efficacy-network?view=compatibility">配伍关系</RouterLink>
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
      <RouterLink class="module module--wide" to="/efficacy-network?view=compatibility">
        <div class="module__header">
          <span class="module__mark">配</span>
          <div>
            <h2>配伍关系</h2>
            <p>预留关系网络图，后续接入药材配伍与关联强度。</p>
          </div>
          <span class="module__action">进入模块</span>
        </div>
        <div class="chart-space network-preview" aria-hidden="true">
          <span class="node node--main">君</span>
          <span class="node node--a">臣</span>
          <span class="node node--b">佐</span>
          <span class="node node--c">使</span>
          <span class="node node--d">引</span>
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
        <div class="chart-space origin-preview">
          <div class="ring" aria-hidden="true"><span>{{ topOrigins[0]?.value ?? 0 }}</span></div>
          <ul>
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
            <p>已接入本地草药数据，可进入查看单味草药详情。</p>
          </div>
        </div>
        <div class="chart-space herb-preview">
          <div class="herb-preview__image">药</div>
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
            <p>预留功效聚类图，当前展示真实功效分类排行。</p>
          </div>
        </div>
        <div class="chart-space bar-preview">
          <div v-for="effect in topEffects" :key="effect.name" class="bar-row">
            <span>{{ effect.name }}</span>
            <i :style="{ width: `${Math.max(18, effect.value * 6)}%` }"></i>
            <strong>{{ effect.value }}</strong>
          </div>
        </div>
      </RouterLink>

      <RouterLink class="module module--wide" to="/nature-meridian">
        <div class="module__header">
          <span class="module__mark">经</span>
          <div>
            <h2>药性归经</h2>
            <p>预留统计图表区域，后续替换为药性与归经可视化组件。</p>
          </div>
        </div>
        <div class="chart-space meridian-preview">
          <div class="nature-list">
            <span v-for="nature in topNatures" :key="nature.name">{{ nature.name }}</span>
          </div>
          <div class="meridian-bars" aria-hidden="true">
            <i
              v-for="meridian in topMeridians"
              :key="meridian.name"
              :style="{ height: `${Math.max(28, meridian.value * 9)}%` }"
            >
              <span>{{ meridian.name }}</span>
            </i>
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
  gap: 1.25rem;
  padding: clamp(1.2rem, 3vw, 2.4rem) clamp(1rem, 3vw, 2rem);
  background:
    radial-gradient(circle at 18% 26%, rgba(205, 245, 191, 0.18), transparent 30%),
    linear-gradient(135deg, rgba(67, 171, 130, 0.32), rgba(72, 189, 151, 0.14));
  border-bottom: 1px solid rgba(205, 239, 210, 0.2);
}

.hero__eyebrow {
  color: #e7f5b8;
  font-size: 0.82rem;
  letter-spacing: 0.28em;
}

.hero__title {
  margin-top: 0.1rem;
  font-family: 'KaiTi', 'STKaiti', serif;
  font-size: clamp(2.55rem, 5.8vw, 4.8rem);
  line-height: 0.95;
  letter-spacing: 0.08em;
  color: #fbfff7;
  text-shadow: 0 16px 40px rgba(20, 98, 72, 0.2);
}

.hero__subtitle {
  max-width: 520px;
  margin-top: 0.75rem;
  color: rgba(248, 255, 249, 0.9);
  font-size: 0.98rem;
}

.search {
  width: min(100%, 520px);
  margin-top: 1.15rem;
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

.network-preview {
  min-height: 178px;
}

.node {
  position: absolute;
  width: 2.5rem;
  height: 2.5rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #86dda9;
  color: #155640;
  font-weight: 700;
  box-shadow: 0 0 0 8px rgba(137, 231, 173, 0.13);
}

.node--main {
  left: 50%;
  top: 44%;
  width: 3.3rem;
  height: 3.3rem;
  background: #e3ee96;
  transform: translate(-50%, -50%);
}

.node--a {
  left: 22%;
  top: 22%;
}

.node--b {
  right: 20%;
  top: 18%;
}

.node--c {
  left: 28%;
  bottom: 18%;
}

.node--d {
  right: 23%;
  bottom: 20%;
}

.line {
  position: absolute;
  left: 50%;
  top: 45%;
  width: 28%;
  height: 1px;
  background: rgba(210, 246, 178, 0.34);
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

.origin-preview {
  display: grid;
  grid-template-columns: 142px 1fr;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem;
}

.ring {
  width: 118px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: conic-gradient(#86dda9 0 72%, rgba(226, 239, 151, 0.82) 72% 86%, rgba(255, 255, 255, 0.16) 86%);
  position: relative;
}

.ring::after {
  content: '';
  position: absolute;
  inset: 16px;
  border-radius: 50%;
  background: #2f8f70;
}

.ring span {
  position: relative;
  z-index: 1;
  color: #fbfff7;
  font-size: 1.55rem;
  font-weight: 700;
}

.origin-preview ul {
  display: grid;
  gap: 0.52rem;
  list-style: none;
}

.origin-preview li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: rgba(248, 255, 249, 0.82);
  font-size: 0.9rem;
}

.origin-preview strong {
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
  background: rgba(21, 93, 76, 0.22);
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

.bar-preview {
  display: grid;
  align-content: center;
  gap: 0.68rem;
  padding: 0.85rem;
}

.bar-row {
  display: grid;
  grid-template-columns: minmax(4.5rem, 1fr) 2fr auto;
  align-items: center;
  gap: 0.55rem;
  color: rgba(248, 255, 249, 0.88);
  font-size: 0.86rem;
}

.bar-row i {
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, #91e5ad, #e3ee96);
}

.bar-row strong {
  color: #fbfff7;
}

.meridian-preview {
  display: grid;
  grid-template-columns: 148px 1fr;
  gap: 0.9rem;
  padding: 0.85rem;
}

.nature-list {
  display: grid;
  align-content: center;
  gap: 0.48rem;
}

.nature-list span {
  padding: 0.42rem 0.7rem;
  border: 1px solid rgba(211, 246, 216, 0.2);
  border-radius: 999px;
  color: rgba(248, 255, 249, 0.82);
  background: rgba(21, 93, 76, 0.22);
  font-size: 0.88rem;
}

.meridian-bars {
  min-height: 128px;
  display: flex;
  align-items: end;
  justify-content: space-around;
  gap: 0.8rem;
  border-left: 1px solid rgba(211, 246, 216, 0.18);
  border-bottom: 1px solid rgba(211, 246, 216, 0.18);
  padding: 0.75rem 0.6rem 1.8rem;
}

.meridian-bars i {
  width: 12%;
  min-height: 44px;
  display: block;
  border-radius: 999px 999px 4px 4px;
  background: linear-gradient(180deg, #e3ee96, #86dda9);
  position: relative;
}

.meridian-bars span {
  position: absolute;
  left: 50%;
  bottom: -1.65rem;
  transform: translateX(-50%);
  color: rgba(248, 255, 249, 0.7);
  font-style: normal;
  white-space: nowrap;
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
  .origin-preview,
  .herb-preview,
  .meridian-preview {
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

  .ring {
    width: 112px;
    margin: 0 auto;
  }
}
</style>
