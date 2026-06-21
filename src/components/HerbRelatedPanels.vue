<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import * as echarts from 'echarts'
import { herbPairs } from '../data/herbPairs'
import { herbData, getRelatedHerbs, natureColors } from '../data/herbData'
import {
  parseOriginToProvinces,
  loadChinaGeoJSON,
  buildProvinceNameMap,
  PROVINCE_LIST,
} from '../utils/originUtils'

export interface HerbJsonRow {
  '中药名称': string
  '药性': string
  '归经': string
  '产地': string
  '功效关键词'?: string
  '功效分类'?: string
}

const props = defineProps<{
  herb: HerbJsonRow
}>()

const mapRef = ref<HTMLElement>()
const meridianChartRef = ref<HTMLElement>()
let mapChart: echarts.ECharts | null = null
let meridianChart: echarts.ECharts | null = null
let shortToFullMap: Record<string, string> = {}
let mapReady = false

const herbName = computed(() => props.herb['中药名称'])
const originProvinces = computed(() => parseOriginToProvinces(props.herb['产地'] || ''))
const originText = computed(() => props.herb['产地'] || '暂无产地记录')

const natureTokens = computed(() =>
  (props.herb['药性'] || '')
    .split(/[；;、,，]/)
    .map(s => s.trim())
    .filter(Boolean),
)

const primaryNature = computed(() => {
  const known = Object.keys(natureColors)
  return natureTokens.value.find(t => known.includes(t)) || natureTokens.value[0] || '—'
})

const tasteTokens = computed(() =>
  natureTokens.value.filter(t => t !== primaryNature.value && !Object.keys(natureColors).includes(t)),
)

const meridians = computed(() =>
  (props.herb['归经'] || '')
    .split(/[；;、,，]/)
    .map(s => s.trim())
    .filter(Boolean),
)

const herbMeta = computed(() => herbData.find(h => h.name === herbName.value))

interface PairDisplay {
  herbs: [string, string]
  partner: string
  effect: string
  description: string
  prescriptions?: string[]
  score?: number
  fromPairs: boolean
}

const compatibilityItems = computed<PairDisplay[]>(() => {
  const name = herbName.value
  const fromPairs = herbPairs
    .filter(p => p.herbs.includes(name))
    .map(p => ({
      herbs: p.herbs,
      partner: p.herbs[0] === name ? p.herbs[1] : p.herbs[0],
      effect: p.effect,
      description: p.description,
      prescriptions: p.prescriptions,
      fromPairs: true,
    }))

  if (fromPairs.length > 0) return fromPairs.slice(0, 8)

  const meta = herbMeta.value
  if (!meta) return []

  return getRelatedHerbs(meta, herbData, 25)
    .slice(0, 6)
    .map(r => ({
      herbs: [name, r.herb.name] as [string, string],
      partner: r.herb.name,
      effect: r.herb.effect,
      description: `基于性味归经与功效相似度推算，配伍参考指数 ${r.score.toFixed(0)}`,
      score: r.score,
      fromPairs: false,
    }))
})

function getNatureColor(token: string) {
  return natureColors[token] || '#5cb87a'
}

async function ensureMap() {
  if (!mapRef.value || mapChart) return
  const geoJson = await loadChinaGeoJSON()
  shortToFullMap = buildProvinceNameMap(geoJson)
  echarts.registerMap('china-mini', geoJson)
  mapChart = echarts.init(mapRef.value)
  mapReady = true
}

function renderOriginMap() {
  if (!mapChart || !mapReady) return
  const originSet = new Set(originProvinces.value)
  const heatData = PROVINCE_LIST.map(prov => ({
    name: shortToFullMap[prov] || prov,
    value: originSet.has(prov) ? 1 : 0,
  }))
  const regions = originProvinces.value
    .filter(p => shortToFullMap[p])
    .map(p => ({
      name: shortToFullMap[p],
      itemStyle: {
        borderColor: '#2e7d32',
        borderWidth: 2,
        areaColor: '#a8d08d',
      },
    }))

  mapChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (params: { name: string; value?: number }) =>
        params.value ? `${herbName.value}<br/>产区：${params.name}` : params.name,
    },
    visualMap: {
      show: false,
      min: 0,
      max: 1,
      inRange: { color: ['#eef5ea', '#a8d08d'] },
    },
    series: [{
      type: 'map',
      map: 'china-mini',
      roam: false,
      selectedMode: false,
      zoom: 1.15,
      itemStyle: { borderColor: '#b8cfae', borderWidth: 0.6, areaColor: '#f4f9f0' },
      emphasis: { itemStyle: { areaColor: '#c9e6a8' } },
      data: heatData,
      regions,
    }],
  }, true)
}

function renderMeridianChart() {
  if (!meridianChartRef.value) return
  if (!meridianChart) meridianChart = echarts.init(meridianChartRef.value)
  const list = meridians.value
  if (!list.length) {
    meridianChart.setOption({
      title: { text: '暂无归经数据', left: 'center', top: 'middle', textStyle: { color: '#7a9a88', fontSize: 14 } },
      series: [],
    }, true)
    return
  }

  const palette = ['#5cb87a', '#527e72', '#c9a059', '#6b8e4e', '#4a8478', '#b89248', '#3d7a62', '#a08050']
  meridianChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '4%', right: '8%', top: '8%', bottom: '4%', containLabel: true },
    xAxis: { type: 'value', show: false, max: 1 },
    yAxis: {
      type: 'category',
      data: list,
      axisLabel: { color: '#2c4a3e', fontWeight: 600 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: list.map((_, i) => ({
        value: 1,
        itemStyle: { color: palette[i % palette.length], borderRadius: [0, 6, 6, 0] },
      })),
      barWidth: 14,
      label: { show: true, position: 'right', formatter: '归经', color: '#7a9a88', fontSize: 11 },
    }],
  }, true)
}

async function refreshAll() {
  await nextTick()
  await ensureMap()
  renderOriginMap()
  renderMeridianChart()
}

watch(() => props.herb['中药名称'], () => {
  refreshAll()
})

onMounted(() => {
  refreshAll()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  mapChart?.dispose()
  meridianChart?.dispose()
  mapChart = null
  meridianChart = null
})

function handleResize() {
  mapChart?.resize()
  meridianChart?.resize()
}
</script>

<template>
  <section class="related" :aria-label="`${herbName} 关联信息`">
    <h2 class="related__title">关联信息</h2>

    <div class="related__grid">
      <!-- 产地地图 -->
      <article class="panel panel--map">
        <header class="panel__head">
          <div>
            <h3 class="panel__title">产地分布</h3>
            <p class="panel__desc">{{ originText }}</p>
          </div>
          <RouterLink
            class="panel__link"
            :to="{ path: '/origin-map', query: { herb: herbName } }"
          >
            完整地图 →
          </RouterLink>
        </header>
        <div v-if="originProvinces.length" class="panel__tags">
          <span v-for="p in originProvinces" :key="p" class="tag tag--origin">{{ p }}</span>
        </div>
        <p v-else class="panel__empty">未能从产地字段解析到省级产区</p>
        <div ref="mapRef" class="panel__map" />
      </article>

      <!-- 药性归经 -->
      <article class="panel panel--property">
        <header class="panel__head">
          <div>
            <h3 class="panel__title">药性归经</h3>
            <p class="panel__desc">性味与脏腑归经概览</p>
          </div>
          <RouterLink class="panel__link" to="/nature-meridian">详细统计 →</RouterLink>
        </header>
        <div class="nature-row">
          <span class="nature-row__label">主药性</span>
          <span
            class="nature-badge nature-badge--main"
            :style="{ backgroundColor: getNatureColor(primaryNature) }"
          >
            {{ primaryNature }}
          </span>
          <span v-for="t in tasteTokens" :key="t" class="nature-badge">{{ t }}</span>
        </div>
        <div class="nature-row">
          <span class="nature-row__label">功效</span>
          <span class="panel__meta">{{ herb['功效关键词'] || '—' }}</span>
        </div>
        <div ref="meridianChartRef" class="panel__meridian-chart" />
        <div v-if="meridians.length" class="panel__tags">
          <span v-for="m in meridians" :key="m" class="tag tag--meridian">{{ m }}经</span>
        </div>
      </article>

      <!-- 配伍关系 -->
      <article class="panel panel--compat">
        <header class="panel__head">
          <div>
            <h3 class="panel__title">配伍关系</h3>
            <p class="panel__desc">经典药对与相似配伍参考</p>
          </div>
          <RouterLink class="panel__link" to="/compatibility">配伍图谱 →</RouterLink>
        </header>
        <ul v-if="compatibilityItems.length" class="pair-list">
          <li v-for="(item, idx) in compatibilityItems" :key="idx" class="pair-card">
            <div class="pair-card__head">
              <strong>{{ herbName }} + {{ item.partner }}</strong>
              <span v-if="item.score" class="pair-card__score">指数 {{ item.score.toFixed(0) }}</span>
              <span v-else-if="item.fromPairs" class="pair-card__score pair-card__score--classic">经典</span>
            </div>
            <p class="pair-card__effect">{{ item.effect }}</p>
            <p class="pair-card__desc">{{ item.description }}</p>
            <div v-if="item.prescriptions?.length" class="pair-card__rx">
              <span v-for="rx in item.prescriptions" :key="rx" class="tag tag--rx">{{ rx }}</span>
            </div>
          </li>
        </ul>
        <p v-else class="panel__empty">暂无该药材的配伍记录</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.related {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--herb-border-soft);
}

.related__title {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  color: var(--herb-forest);
  font-family: 'KaiTi', 'STKaiti', serif;
  letter-spacing: 0.12em;
}

.related__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.panel {
  background: var(--herb-paper);
  border: 1px solid var(--herb-border-soft);
  border-radius: 14px;
  padding: 1rem 1.1rem;
  box-shadow: var(--herb-shadow);
}

.panel--compat {
  grid-column: 1 / -1;
}

.panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.panel__title {
  margin: 0;
  font-size: 1rem;
  color: var(--herb-forest);
  font-weight: 600;
}

.panel__desc {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: var(--herb-text-muted);
  line-height: 1.45;
}

.panel__link {
  flex-shrink: 0;
  font-size: 0.78rem;
  color: var(--herb-sage);
  text-decoration: none;
  white-space: nowrap;
  padding: 0.25rem 0.55rem;
  border: 1px solid var(--herb-border-soft);
  border-radius: 999px;
  background: var(--herb-parchment);
  transition: background 0.2s, color 0.2s;
}

.panel__link:hover {
  background: var(--herb-leaf);
  color: var(--herb-forest);
}

.panel__map {
  width: 100%;
  height: 240px;
  margin-top: 0.5rem;
  border-radius: 10px;
  overflow: hidden;
  background: #f4f9f0;
}

.panel__meridian-chart {
  width: 100%;
  height: 160px;
  margin: 0.5rem 0;
}

.panel__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.panel__meta {
  font-size: 0.9rem;
  color: var(--herb-text);
}

.panel__empty {
  margin: 0.5rem 0;
  font-size: 0.85rem;
  color: var(--herb-text-muted);
  font-style: italic;
}

.tag {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background: var(--herb-parchment);
  color: var(--herb-text-soft);
  border: 1px solid var(--herb-border);
}

.tag--origin {
  background: rgba(168, 208, 141, 0.35);
  color: var(--herb-forest);
}

.tag--meridian {
  background: rgba(82, 126, 114, 0.15);
  color: var(--herb-sage);
}

.tag--rx {
  background: rgba(201, 176, 122, 0.2);
  color: #8b7355;
}

.nature-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.55rem;
}

.nature-row__label {
  font-size: 0.78rem;
  color: var(--herb-text-muted);
  min-width: 3rem;
}

.nature-badge {
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  background: var(--herb-parchment);
  color: var(--herb-forest);
  border: 1px solid var(--herb-border-soft);
}

.nature-badge--main {
  color: #fff;
  border-color: transparent;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
}

.pair-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.75rem;
}

.pair-card {
  padding: 0.85rem;
  border-radius: 10px;
  background: var(--herb-parchment);
  border: 1px solid var(--herb-border);
}

.pair-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
  font-size: 0.92rem;
  color: var(--herb-forest);
}

.pair-card__score {
  font-size: 0.72rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: rgba(92, 184, 122, 0.2);
  color: var(--herb-sage);
  white-space: nowrap;
}

.pair-card__score--classic {
  background: rgba(201, 176, 122, 0.25);
  color: #8b7355;
}

.pair-card__effect {
  margin: 0 0 0.25rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--herb-gold);
}

.pair-card__desc {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--herb-text-soft);
}

.pair-card__rx {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.45rem;
}

@media (max-width: 800px) {
  .related__grid {
    grid-template-columns: 1fr;
  }

  .panel--compat {
    grid-column: auto;
  }
}
</style>
