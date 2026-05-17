<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import * as echarts from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'
import { toForceGraphData, toSankeyData, type HerbData } from '../utils/sankeyDataProcessor'

interface Props {
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: '功效聚类与关联网络',
})

const forceChartRef = ref<HTMLDivElement>()
const sankeyChartRef = ref<HTMLDivElement>()
let forceChartInstance: ECharts | null = null
let sankeyChartInstance: ECharts | null = null

const selectedNode = ref<any>(null)
const loading = ref(true)

// 产地-药性数据
const ORIGIN_NATURE_DATA = [
  { source: '四川', target: '寒', value: 10 },
  { source: '四川', target: '微寒', value: 6 },
  { source: '四川', target: '温', value: 12 },
  { source: '四川', target: '微温', value: 2 },
  { source: '四川', target: '平', value: 2 },
  { source: '广东/广西', target: '寒', value: 6 },
  { source: '广东/广西', target: '温', value: 2 },
  { source: '广东/广西', target: '微温', value: 3 },
  { source: '广东/广西', target: '平', value: 1 },
  { source: '山东/河南', target: '寒', value: 4 },
  { source: '山东/河南', target: '微寒', value: 3 },
  { source: '山东/河南', target: '温', value: 5 },
  { source: '山东/河南', target: '平', value: 2 },
  { source: '内蒙古/甘肃', target: '温', value: 3 },
  { source: '内蒙古/甘肃', target: '平', value: 4 },
  { source: '内蒙古/甘肃', target: '寒', value: 2 },
  { source: '浙江/安徽', target: '微寒', value: 4 },
  { source: '浙江/安徽', target: '温', value: 3 },
  { source: '浙江/安徽', target: '平', value: 2 },
]

// 药性-归经数据
const NATURE_MERIDIAN_DATA = [
  { source: '寒', target: '肺', value: 9 },
  { source: '寒', target: '肝', value: 7 },
  { source: '寒', target: '心', value: 3 },
  { source: '微寒', target: '肺', value: 6 },
  { source: '微寒', target: '肝', value: 5 },
  { source: '微寒', target: '脾', value: 4 },
  { source: '温', target: '脾', value: 11 },
  { source: '温', target: '肾', value: 7 },
  { source: '温', target: '肝', value: 5 },
  { source: '微温', target: '脾', value: 3 },
  { source: '微温', target: '肺', value: 2 },
  { source: '微温', target: '肝', value: 1 },
  { source: '平', target: '脾', value: 4 },
  { source: '平', target: '肺', value: 2 },
  { source: '平', target: '心', value: 2 },
]

// 归经-功效数据
const MERIDIAN_EFFICACY_DATA = [
  { source: '肺', target: '清热泻火', value: 7 },
  { source: '肺', target: '清热解毒', value: 6 },
  { source: '肝', target: '活血祛瘀', value: 9 },
  { source: '肝', target: '清热泻火', value: 6 },
  { source: '脾', target: '补气健脾', value: 9 },
  { source: '脾', target: '温阳散寒', value: 7 },
  { source: '肾', target: '温阳散寒', value: 6 },
  { source: '心', target: '清热解毒', value: 5 },
  { source: '心', target: '活血祛瘀', value: 3 },
]

// 草药数据
const HERB_DATA: HerbData[] = [
  { name: '黄芪', nature: '温', meridian: '脾', efficacy: '补气健脾', origin: '山东/河南' },
  { name: '人参', nature: '温', meridian: '脾', efficacy: '补气健脾', origin: '四川' },
  { name: '白术', nature: '温', meridian: '脾', efficacy: '健脾益气', origin: '四川' },
  { name: '茯苓', nature: '平', meridian: '脾', efficacy: '利水渗湿', origin: '浙江/安徽' },
  { name: '黄连', nature: '寒', meridian: '心', efficacy: '清热解毒', origin: '四川' },
  { name: '黄芩', nature: '寒', meridian: '肺', efficacy: '清热泻火', origin: '四川' },
  { name: '大黄', nature: '寒', meridian: '肝', efficacy: '活血祛瘀', origin: '四川' },
  { name: '桂枝', nature: '温', meridian: '肺', efficacy: '温阳散寒', origin: '广东/广西' },
  { name: '干姜', nature: '温', meridian: '脾', efficacy: '温阳散寒', origin: '内蒙古/甘肃' },
  { name: '甘草', nature: '平', meridian: '脾', efficacy: '补气健脾', origin: '内蒙古/甘肃' },
  { name: '红枣', nature: '温', meridian: '脾', efficacy: '补气健脾', origin: '山东/河南' },
  { name: '当归', nature: '温', meridian: '肝', efficacy: '活血祛瘀', origin: '四川' },
  { name: '麻黄', nature: '温', meridian: '肺', efficacy: '温阳散寒', origin: '山东/河南' },
  { name: '生地', nature: '寒', meridian: '肝', efficacy: '清热泻火', origin: '浙江/安徽' },
  { name: '丹参', nature: '寒', meridian: '心', efficacy: '活血祛瘀', origin: '四川' },
]

function initSankeyChart() {
  if (!sankeyChartRef.value) return

  if (sankeyChartInstance) {
    sankeyChartInstance.dispose()
  }

  sankeyChartInstance = echarts.init(sankeyChartRef.value, 'light')

  const { nodes, links } = toSankeyData(
    ORIGIN_NATURE_DATA,
    NATURE_MERIDIAN_DATA,
    MERIDIAN_EFFICACY_DATA,
  )

  const option: EChartsOption = {
    title: {
      text: '产地 → 药性 → 归经 → 功效',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500 },
      top: 10,
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    series: [
      {
        type: 'sankey',
        data: nodes,
        links,
        layout: 'orthogonal',
        orient: 'horizontal',
        nodeGap: 30,
        focusNodeAdjacency: true,
        lineStyle: {
          color: 'source',
          curveness: 0.5,
          opacity: 0.35,
        },
        label: { fontSize: 11 },
        itemStyle: {
          borderColor: '#999',
          borderWidth: 1.5,
        },
      } as any,
    ],
    grid: {
      containLabel: true,
      top: 60,
      bottom: 30,
      left: 20,
      right: 20,
    },
  }

  sankeyChartInstance.setOption(option)
}

function initForceChart() {
  if (!forceChartRef.value) return

  if (forceChartInstance) {
    forceChartInstance.dispose()
  }

  forceChartInstance = echarts.init(forceChartRef.value, 'light')

  const { nodes, links } = toForceGraphData(HERB_DATA)

  const categories = [
    { name: '产地', itemStyle: { color: '#FF6B6B' } },
    { name: '药性', itemStyle: { color: '#4ECDC4' } },
    { name: '归经', itemStyle: { color: '#45B7D1' } },
    { name: '功效', itemStyle: { color: '#FFA07A' } },
    { name: '草药', itemStyle: { color: '#95DE64' } },
  ]

  const option: EChartsOption = {
    title: {
      text: '草药功能关联网络',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500 },
      top: 10,
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    legend: {
      data: categories.map((category) => category.name),
      left: 'center',
      bottom: 10,
      textStyle: { fontSize: 11 },
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        links,
        categories,
        roam: true,
        draggable: true,
        focusNodeAdjacency: true,
        label: {
          show: true,
          fontSize: 10,
          position: 'right',
        },
        force: {
          repulsion: 100,
          gravity: 0.1,
          edgeLength: 50,
          layoutAnimation: true,
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 15,
          shadowColor: 'rgba(0, 0, 0, 0.2)',
        },
        lineStyle: {
          color: '#aaa',
          opacity: 0.3,
        },
      } as any,
    ],
  }

  forceChartInstance.setOption(option)

  forceChartInstance.off('click')
  forceChartInstance.on('click', (params: any) => {
    if (params.dataType === 'node') {
      const nodeName = params.name
      const nodeData = nodes.find((node) => node.name === nodeName)
      const herbInfo = HERB_DATA.find((herb) => herb.name === nodeName)

      selectedNode.value = {
        name: nodeName,
        categoryName: categories[nodeData?.category || 4]?.name || '',
        data: herbInfo || { name: nodeName },
      }
    }
  })
}

async function initCharts() {
  await nextTick()
  initForceChart()
  initSankeyChart()
}

function handleResize() {
  if (forceChartInstance) forceChartInstance.resize()
  if (sankeyChartInstance) sankeyChartInstance.resize()
}

onMounted(async () => {
  loading.value = false
  await initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  forceChartInstance?.dispose()
  sankeyChartInstance?.dispose()
})
</script>

<template>
  <div class="clustering">
    <div v-if="loading" class="clustering__loading">
      <p>加载中...</p>
    </div>

    <div v-else class="clustering__wrapper">
      <div class="clustering__top">
        <div class="clustering__force-container">
          <div ref="forceChartRef" class="clustering__chart"></div>
        </div>

        <div class="clustering__details-panel">
          <div class="clustering__panel-header">
            <h3>节点详情</h3>
          </div>

          <div v-if="!selectedNode" class="clustering__panel-empty">
            <p>点击节点查看详情</p>
          </div>

          <div v-else class="clustering__panel-content">
            <div class="clustering__panel-item">
              <label>节点名称</label>
              <p>{{ selectedNode.name }}</p>
            </div>
            <div class="clustering__panel-item">
              <label>分类</label>
              <span>{{ selectedNode.categoryName }}</span>
            </div>
            <template v-if="selectedNode.data.nature">
              <div class="clustering__panel-item">
                <label>药性</label>
                <p>{{ selectedNode.data.nature }}</p>
              </div>
            </template>
            <template v-if="selectedNode.data.meridian">
              <div class="clustering__panel-item">
                <label>归经</label>
                <p>{{ selectedNode.data.meridian }}</p>
              </div>
            </template>
            <template v-if="selectedNode.data.efficacy">
              <div class="clustering__panel-item">
                <label>功效</label>
                <p>{{ selectedNode.data.efficacy }}</p>
              </div>
            </template>
            <template v-if="selectedNode.data.origin">
              <div class="clustering__panel-item">
                <label>产地</label>
                <p>{{ selectedNode.data.origin }}</p>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="clustering__sankey-container">
        <div ref="sankeyChartRef" class="clustering__chart"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.clustering {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  color: var(--color-text);
  overflow: hidden;
}

.clustering__loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clustering__wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.clustering__top {
  flex: 0 1 50%;
  display: flex;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
  border-bottom: 1px solid var(--color-border);
}

.clustering__force-container {
  flex: 1;
  min-width: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
  border: 1px solid var(--color-border);
}

.clustering__chart {
  width: 100%;
  height: 100%;
}

.clustering__details-panel {
  width: 280px;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: #fff;
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.clustering__panel-header {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.clustering__panel-header h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.clustering__panel-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  opacity: 0.6;
  font-size: 0.9rem;
}

.clustering__panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.clustering__panel-item {
  margin-bottom: 1rem;
}

.clustering__panel-item label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 0.4rem;
  opacity: 0.8;
}

.clustering__panel-item p,
.clustering__panel-item span {
  margin: 0;
  padding: 0.5rem 0.75rem;
  background: var(--color-background-soft);
  border-radius: 4px;
  font-size: 0.9rem;
}

.clustering__sankey-container {
  flex: 0 1 50%;
  padding: 1rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

@media (max-width: 1200px) {
  .clustering__top {
    flex-direction: column;
  }

  .clustering__details-panel {
    width: 100%;
    max-height: 200px;
  }
}

@media (max-width: 768px) {
  .clustering__top {
    max-height: 50vh;
    flex-direction: column;
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .clustering__details-panel {
    max-height: 150px;
  }

  .clustering__panel-content {
    padding: 0.75rem;
  }

  .clustering__sankey-container {
    padding: 0.75rem;
  }

  .clustering__chart {
    border-radius: 4px;
  }
}
</style>
