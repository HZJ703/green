<template>
  <div class="herb-analysis-dashboard">
    <div class="dashboard-header">
      <h1>药性与归经统计</h1>
      <div class="header-info">
        <button class="export-btn" @click="exportCurrentData">导出报告</button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="search-box">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索药材名、药性..."
          @input="handleSearch"
        />
      </div>
      <div class="filter-tabs">
        <button
          v-for="prop in quickFilters"
          :key="prop.value"
          :class="{ active: selectedProperty === prop.value }"
          @click="selectQuickFilter(prop.value)"
        >
          {{ prop.label }}
        </button>
        <button :class="{ active: selectedProperty === '全部' }" @click="selectQuickFilter('全部')">
          全部
        </button>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-box">
        <div class="chart-title">五性分布占比</div>
        <div ref="pieChartRef" class="chart"></div>
        <div class="legend-inline">
          <span v-for="item in pieLegendData" :key="item.name" class="legend-dot">
            <span class="dot" :style="{ background: item.color }"></span>
            {{ item.name }}：{{ item.value }}
          </span>
        </div>
      </div>
      <div class="chart-box">
        <div class="chart-title">药性分类品种数占比</div>
        <div ref="donutChartRef" class="chart"></div>
        <div class="total-note">总计：{{ totalHerbCount }} 种</div>
      </div>
    </div>

    <div class="full-width-section">
      <div class="section-header">
        <h2>十二经脉归经统计</h2>
        <div class="chart-type-switch">
          <button :class="{ active: chartType === 'bar' }" @click="switchToBar">条形图</button>
          <button :class="{ active: chartType === 'radar' }" @click="switchToRadar">雷达图</button>
        </div>
      </div>
      <div class="chart-container-large">
        <div v-show="chartType === 'bar'" ref="barChartRef" class="chart-large"></div>
        <div v-show="chartType === 'radar'" ref="radarChartRef" class="chart-large"></div>
      </div>
    </div>

    <div class="property-description">
      <div class="desc-card cool">
        <h4>寒、凉性</h4>
        <p>多具有清热、泻火、解毒等作用。用于阳证、热证，如发热、心烦、口渴等。</p>
      </div>
      <div class="desc-card warm">
        <h4>温、热性</h4>
        <p>多具有温里、散寒、补火、助阳等作用。用于阴证、寒证，如畏寒、四肢厥冷等。</p>
      </div>
      <div class="desc-card neutral">
        <h4>平性</h4>
        <p>寒热之性不显著，作用较平和。多用于病证初期或作为辅助调理之品。</p>
      </div>
      <div class="desc-card complex">
        <h4>复合特性</h4>
        <p>部分药材在不同配伍条件下可能表现出多重性质，需要结合具体方剂综合判断。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import * as echarts from 'echarts'
import dataService from '../services/dataService.js'

const searchKeyword = ref('')
const selectedProperty = ref('全部')
const chartType = ref('bar')
const allHerbs = ref([])
const filteredHerbs = ref([])

const pieChartRef = ref(null)
const donutChartRef = ref(null)
const barChartRef = ref(null)
const radarChartRef = ref(null)

let pieChart = null
let donutChart = null
let barChart = null
let radarChart = null

const quickFilters = [
  { label: '寒性', value: '寒' },
  { label: '凉性', value: '凉' },
  { label: '平性', value: '平' },
  { label: '温性', value: '温' },
  { label: '热性', value: '热' },
]

const totalHerbCount = computed(() => allHerbs.value.length)
const pieLegendData = ref([])

const colorMap = {
  寒: '#67C23A',
  微寒: '#85CE61',
  凉: '#95D475',
  平: '#B3E19D',
  温: '#D1F0C5',
  微温: '#E8F5E9',
  热: '#F0F9EB',
  大寒: '#529B2E',
}

const loadData = async () => {
  try {
    allHerbs.value = await dataService.getAllHerbs()
    await applyFilters()
  } catch (error) {
    console.error('数据加载失败:', error)
  }
}

const applyFilters = async () => {
  const filters = {
    property: selectedProperty.value,
    keyword: searchKeyword.value,
  }
  filteredHerbs.value = await dataService.filterHerbs(filters)
  await nextTick()
  updateAllCharts()
}

const handleSearch = () => applyFilters()

const selectQuickFilter = (value) => {
  selectedProperty.value = value
  applyFilters()
}

const switchToBar = () => {
  chartType.value = 'bar'
  nextTick(() => {
    if (barChart) {
      updateBarChart()
      barChart.resize()
    }
  })
}

const switchToRadar = () => {
  chartType.value = 'radar'
  nextTick(() => {
    if (radarChart) {
      updateRadarChart()
      radarChart.resize()
    }
  })
}

const updatePieChart = async () => {
  if (!pieChart) return

  const stats = {}
  filteredHerbs.value.forEach((herb) => {
    const prop = herb.property
    stats[prop] = (stats[prop] || 0) + 1
  })

  const data = Object.entries(stats).map(([name, value]) => ({
    name: `${name}性`,
    value,
    itemStyle: { color: colorMap[name] || '#67C23A' },
  }))

  pieLegendData.value = data.map((item) => ({
    name: item.name,
    value: item.value,
    color: item.itemStyle.color,
  }))

  pieChart.setOption(
    {
      tooltip: { trigger: 'item', formatter: '{b}: {d}% ({c}种)' },
      series: [
        {
          type: 'pie',
          radius: '55%',
          data,
          label: { show: true, formatter: '{b}', position: 'outside', fontSize: 12 },
          labelLine: { length: 8, length2: 6 },
        },
      ],
    },
    true,
  )
}

const updateDonutChart = async () => {
  if (!donutChart) return

  const stats = {}
  filteredHerbs.value.forEach((herb) => {
    const cat = herb.category || '其他'
    stats[cat] = (stats[cat] || 0) + 1
  })

  const data = Object.entries(stats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  donutChart.setOption(
    {
      tooltip: { trigger: 'item', formatter: '{b}: {d}% ({c}种)' },
      series: [
        {
          type: 'pie',
          radius: ['40%', '65%'],
          data: data.map((item, idx) => ({
            name: item.name,
            value: item.value,
            itemStyle: { color: `hsl(${120 + idx * 25}, 60%, 55%)` },
          })),
          label: { show: true, formatter: '{b}', position: 'outside', fontSize: 11 },
          labelLine: { length: 6, length2: 4 },
        },
      ],
    },
    true,
  )
}

const getMeridianData = () => {
  const stats = {}
  filteredHerbs.value.forEach((herb) => {
    if (herb.meridians) {
      herb.meridians.forEach((meridian) => {
        if (meridian && meridian.trim()) stats[meridian] = (stats[meridian] || 0) + 1
      })
    }
  })

  return Object.entries(stats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12)
}

const updateBarChart = async () => {
  if (!barChart) return

  const data = getMeridianData()

  barChart.setOption(
    {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c} 种' },
      grid: { left: '8%', right: '5%', top: '10%', bottom: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.name),
        axisLabel: { rotate: 30, fontSize: 11, interval: 0 },
      },
      yAxis: { type: 'value', name: '药材数量' },
      series: [
        {
          type: 'bar',
          data: data.map((item) => item.value),
          itemStyle: { color: '#67C23A' },
          label: { show: true, position: 'top', fontSize: 11 },
        },
      ],
    },
    true,
  )
}

const updateRadarChart = async () => {
  if (!radarChart) return

  const data = getMeridianData().slice(0, 10)
  const maxVal = Math.max(...data.map((item) => item.value), 1) + 5

  radarChart.setOption(
    {
      tooltip: { trigger: 'item', formatter: '{b}: {c} 种' },
      radar: {
        indicator: data.map((item) => ({ name: item.name, max: maxVal })),
        center: ['50%', '50%'],
        radius: '60%',
        name: { textStyle: { fontSize: 11 } },
      },
      series: [
        {
          type: 'radar',
          data: [{ value: data.map((item) => item.value), name: '药材数量' }],
          areaStyle: { color: 'rgba(103, 194, 58, 0.2)' },
          lineStyle: { color: '#67C23A', width: 1.5 },
          itemStyle: { color: '#529B2E' },
        },
      ],
    },
    true,
  )
}

const updateAllCharts = () => {
  updatePieChart()
  updateDonutChart()
  if (chartType.value === 'bar') updateBarChart()
  else updateRadarChart()
}

const exportCurrentData = () => {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          time: new Date().toLocaleString(),
          count: filteredHerbs.value.length,
          data: filteredHerbs.value.map((herb) => ({
            name: herb.name,
            property: herb.property,
            meridians: herb.meridians,
          })),
        },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `herbs-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
}

const handleResize = () => {
  pieChart?.resize()
  donutChart?.resize()
  barChart?.resize()
  radarChart?.resize()
}

const initCharts = () => {
  if (pieChartRef.value) pieChart = echarts.init(pieChartRef.value)
  if (donutChartRef.value) donutChart = echarts.init(donutChartRef.value)
  if (barChartRef.value) barChart = echarts.init(barChartRef.value)
  if (radarChartRef.value) radarChart = echarts.init(radarChartRef.value)
  window.addEventListener('resize', handleResize)
}

onMounted(async () => {
  initCharts()
  await loadData()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  pieChart?.dispose()
  donutChart?.dispose()
  barChart?.dispose()
  radarChart?.dispose()
})
</script>

<style scoped>
.herb-analysis-dashboard {
  min-height: 100vh;
  padding: 24px;
  background: #f5f7fa;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.dashboard-header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 24px;
}

.header-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.export-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: #67c23a;
  color: white;
  cursor: pointer;
  font-size: 13px;
}

.export-btn:hover {
  background: #529b2e;
}

.filter-bar {
  margin-bottom: 24px;
  padding: 16px 20px;
  border-radius: 8px;
  background: white;
}

.search-box input {
  width: 100%;
  margin-bottom: 16px;
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
  font-size: 14px;
}

.search-box input:focus {
  border-color: #67c23a;
}

.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-tabs button {
  padding: 6px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 13px;
}

.filter-tabs button.active {
  border-color: #67c23a;
  background: #67c23a;
  color: white;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.chart-box,
.full-width-section,
.desc-card {
  background: white;
}

.chart-box {
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-title {
  margin-bottom: 16px;
  color: #333;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}

.chart {
  width: 100%;
  height: 300px;
}

.legend-inline {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
  font-size: 12px;
}

.legend-dot {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.legend-dot .dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.total-note {
  margin-top: 8px;
  color: #666;
  font-size: 13px;
  text-align: center;
}

.full-width-section {
  margin-bottom: 32px;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
}

.chart-type-switch {
  display: flex;
  gap: 8px;
}

.chart-type-switch button {
  padding: 5px 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 13px;
}

.chart-type-switch button.active {
  border-color: #67c23a;
  background: #67c23a;
  color: white;
}

.chart-container-large {
  width: 100%;
  min-height: 400px;
}

.chart-large {
  width: 100%;
  height: 400px;
}

.property-description {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.desc-card {
  padding: 16px;
  border-left: 3px solid;
  border-radius: 8px;
}

.desc-card h4 {
  margin: 0 0 8px;
  font-size: 15px;
}

.desc-card p {
  margin: 0;
  color: #666;
  font-size: 12px;
  line-height: 1.5;
}

.desc-card.cool {
  border-left-color: #67c23a;
}

.desc-card.warm {
  border-left-color: #e6a23c;
}

.desc-card.neutral {
  border-left-color: #909399;
}

.desc-card.complex {
  border-left-color: #9b59b6;
}

@media (max-width: 800px) {
  .charts-row {
    grid-template-columns: 1fr;
  }

  .property-description {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .property-description {
    grid-template-columns: 1fr;
  }
}
</style>
