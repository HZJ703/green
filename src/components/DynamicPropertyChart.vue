<template>
  <div class="herb-analysis-dashboard">
    <!-- 头部 -->
    <div class="dashboard-header">
      <h1>药性与归经统计</h1>
      <div class="header-info">
      </div>
    </div>

    <!-- 搜索和选择栏 -->
    <div class="filter-bar">
      <!-- 搜索框 - 可以直接搜索药材 -->
      <div class="search-section">
        <input 
          type="text" 
          v-model="searchText" 
          placeholder="🔍 搜索药材名称、药性、归经或功效（如：甘草、温、脾）" 
          @input="onSearchInput"
          @keydown.enter.prevent="onSearchEnter"
          @keydown.escape="clearSearch"
          @focus="onSearchFocus"
          @blur="onSearchBlur"
          class="search-input"
        />
        <div v-if="searchText.trim() && showSearchDropdown" class="search-dropdown">
          <div 
            v-for="herb in searchResults" 
            :key="herb.name" 
            @mousedown.prevent="selectHerb(herb)"
            class="search-item"
          >
            <span class="search-item__name">{{ herb.name }}</span>
            <span class="search-item__meta">{{ herb.property }}性 · {{ formatMeridians(herb) }}</span>
          </div>
          <div v-if="searchResults.length === 0" class="search-empty">未找到匹配药材</div>
        </div>
      </div>
      
      <!-- 已选药材标签 -->
      <div class="select-tags">
        <span v-for="(herb, idx) in selectedHerbs" :key="idx" class="herb-tag">
          {{ herb.name }}
          <button @click="removeHerb(idx)" class="remove-tag">✖</button>
        </span>
      </div>
      
      <div class="select-actions">
        <button v-if="selectedHerbs.length > 0" @click="openCompareModal" class="compare-btn">
          查看对比 ({{ selectedHerbs.length }})
        </button>
        <button @click="clearAll" class="clear-compare-btn">清空</button>
        <span class="hint">输入即筛选下方图表；点击结果可加入对比（最多3种）</span>
      </div>
    </div>

    <!-- 原有内容区域 -->
    <div class="main-content">
      <div class="stats-cards">
        <div class="stat-card"><div class="stat-number">{{ totalHerbCount }}</div><div class="stat-label">药材总数</div></div>
        <div class="stat-card"><div class="stat-number">{{ propertyCount }}</div><div class="stat-label">药性类型</div></div>
        <div class="stat-card"><div class="stat-number">{{ filteredCount }}</div><div class="stat-label">当前筛选</div></div>
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
        <div class="desc-card cool"><h4>❄️ 寒、凉性</h4><p>多具有清热、泻火、解毒等作用。</p></div>
        <div class="desc-card warm"><h4>🔥 温、热性</h4><p>多具有温里、散寒、补火、助阳等作用。</p></div>
        <div class="desc-card neutral"><h4>⚖️ 平性</h4><p>作用平和，用于病证初期或辅助调理。</p></div>
        <div class="desc-card complex"><h4>🔄 复合特性</h4><p>部分药材可能表现出多重性质。</p></div>
      </div>
    </div>

    <!-- 对比模态框 -->
    <div v-if="showCompareModal" class="modal-overlay" @click.self="closeCompareModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>📋 药材对比分析</h3>
          <button @click="closeCompareModal" class="modal-close">✖</button>
        </div>
        
        <!-- 对比表格 -->
        <table class="compare-table" v-if="selectedHerbs.length > 0">
          <thead>
            <tr><th>属性</th><th v-for="herb in selectedHerbs" :key="herb.name">{{ herb.name }}</th></tr>
          </thead>
          <tbody>
            <tr><td class="label-cell">药性</td><td v-for="herb in selectedHerbs" :key="herb.name"><span class="property-badge" :style="{ backgroundColor: getPropertyColor(herb.property) }">{{ herb.property }}性</span></td></tr>
            <tr><td class="label-cell">归经</td><td v-for="herb in selectedHerbs" :key="herb.name" class="value-cell">{{ herb.meridians?.join('、') || '无' }}</td></tr>
            <tr><td class="label-cell">功效分类</td><td v-for="herb in selectedHerbs" :key="herb.name" class="value-cell">{{ herb.category || '其他' }}</td></tr>
            <tr><td class="label-cell">功效</td><td v-for="herb in selectedHerbs" :key="herb.name" class="effect-cell">{{ herb.effect || '暂无' }}</td></tr>
          </tbody>
        </table>

        <!-- 对比图表 - 使用雷达图 + 条形图 -->
      <div class="compare-charts">
        <div class="compare-chart-box">
          <div class="chart-title">📊 归经对比雷达图</div>
          <div id="compareRadarContainer" style="width: 100%; height: 320px;"></div>
        </div>
        <div class="compare-chart-box">
          <div class="chart-title">📈 归经详细对比</div>
          <canvas id="compareBarCanvas" width="500" height="320" style="width: 100%; height: 320px;"></canvas>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)
import { ref, onMounted, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import dataService from '../services/dataService.js'

// 响应式数据
const searchText = ref('')
const searchResults = ref([])
const selectedHerbs = ref([])
const allHerbs = ref([])
const filteredHerbs = ref([])
const chartType = ref('bar')
const showCompareModal = ref(false)

// 图表实例
const pieChartRef = ref(null)
const donutChartRef = ref(null)
const barChartRef = ref(null)
const radarChartRef = ref(null)

let pieChart = null
let donutChart = null
let barChart = null
let radarChart = null
let compareBarChart = null

// 计算属性
const totalHerbCount = computed(() => allHerbs.value.length)
const propertyCount = computed(() => new Set(allHerbs.value.map(h => h.property)).size)
const filteredCount = computed(() => filteredHerbs.value.length)
const pieLegendData = ref([])
const showSearchDropdown = ref(false)

const formatMeridians = (herb) => {
  if (!herb.meridians?.length) return '归经未知'
  return herb.meridians.join('、')
}

const matchesKeyword = (herb, keyword) => {
  const kw = keyword.toLowerCase()
  return (
    herb.name?.toLowerCase().includes(kw) ||
    herb.property?.toLowerCase().includes(kw) ||
    herb.category?.toLowerCase().includes(kw) ||
    herb.effect?.toLowerCase().includes(kw) ||
    (Array.isArray(herb.meridians) && herb.meridians.some(m => m.toLowerCase().includes(kw)))
  )
}

const applySearchFilter = () => {
  const keyword = searchText.value.trim()
  if (!keyword) {
    searchResults.value = []
    filteredHerbs.value = [...allHerbs.value]
    showSearchDropdown.value = false
    updateAllCharts()
    return
  }

  const results = allHerbs.value.filter(h => matchesKeyword(h, keyword))
  searchResults.value = results.slice(0, 12)
  filteredHerbs.value = results
  showSearchDropdown.value = true
  updateAllCharts()
}

// 药性色（寒凉偏绿、温热偏棕黄，与全站主题一致）
const PROPERTY_COLORS = {
  大寒: '#1b5e20',
  寒: '#2e7d32',
  微寒: '#43a047',
  凉: '#66bb6a',
  平: '#9ccc65',
  微温: '#d4c9a8',
  温: '#c9b07a',
  热: '#8b7355',
}

// 归经 / 分类 / 对比用扩展色板
const CHART_PALETTE = [
  '#5cb87a', '#527e72', '#c9a059', '#6b8e4e', '#4a8478',
  '#b89248', '#7ec49a', '#8b7355', '#3d7a62', '#a08050',
  '#66a67a', '#9a7b4f', '#52a068', '#d4c4a0',
]

const COMPARE_HERB_STYLES = [
  { line: '#c9a059', fill: 'rgba(201, 160, 89, 0.32)' },
  { line: '#7ec49a', fill: 'rgba(126, 196, 154, 0.32)' },
  { line: '#8b7355', fill: 'rgba(139, 115, 85, 0.32)' },
]

const getPropertyColor = (property) => PROPERTY_COLORS[property] || '#5cb87a'

const getPaletteColor = (index) => CHART_PALETTE[index % CHART_PALETTE.length]

// 加载数据
const loadData = async () => {
  try {
    allHerbs.value = await dataService.getAllHerbs()
    console.log('✅ 加载完成，共', allHerbs.value.length, '条数据')
    filteredHerbs.value = [...allHerbs.value]
    await nextTick()
    updateAllCharts()
  } catch (error) {
    console.error('数据加载失败:', error)
  }
}

// 搜索药材：同步筛选图表 + 下拉提示
const onSearchInput = () => {
  applySearchFilter()
}

const onSearchEnter = () => {
  if (searchResults.value.length > 0) {
    selectHerb(searchResults.value[0])
  }
}

const clearSearch = () => {
  searchText.value = ''
  applySearchFilter()
}

const onSearchFocus = () => {
  if (searchText.value.trim()) showSearchDropdown.value = true
}

const onSearchBlur = () => {
  window.setTimeout(() => {
    showSearchDropdown.value = false
  }, 180)
}

const selectHerb = (herb) => {
  addHerb(herb)
  showSearchDropdown.value = false
}

// 添加药材到对比列表
const addHerb = (herb) => {
  if (selectedHerbs.value.length >= 3) {
    alert('最多只能对比3种药材')
    return
  }
  if (selectedHerbs.value.some(h => h.name === herb.name)) {
    alert('该药材已添加')
    return
  }
  selectedHerbs.value.push(herb)
}

// 移除药材
const removeHerb = (index) => {
  selectedHerbs.value.splice(index, 1)
}

// 清空
const clearAll = () => {
  selectedHerbs.value = []
  showCompareModal.value = false
  clearSearch()
}

// 打开对比模态框并绘制图表
const openCompareModal = () => {
  showCompareModal.value = true
  setTimeout(() => {
    drawCompareRadarChart()  // 添加这一行
    drawCompareBarChart()
  }, 150)
}

// 关闭
const closeCompareModal = () => {
  showCompareModal.value = false
}

// 绘制对比雷达图 (使用 ECharts)
const drawCompareRadarChart = () => {
  const container = document.getElementById('compareRadarContainer')
  if (!container) return
  
  // 如果已存在实例，先销毁
  if (window.compareRadarChart) {
    window.compareRadarChart.dispose()
  }
  
  // 收集所有归经
  const allMeridians = new Set()
  selectedHerbs.value.forEach(herb => {
    herb.meridians?.forEach(m => allMeridians.add(m))
  })
  const meridianList = Array.from(allMeridians)
  
  // 为每个药材准备数据
  const seriesData = selectedHerbs.value.map((herb, idx) => {
    const dataArray = meridianList.map(m => herb.meridians?.includes(m) ? 1 : 0)
    const style = COMPARE_HERB_STYLES[idx % COMPARE_HERB_STYLES.length]

    return {
      name: herb.name,
      value: dataArray,
      areaStyle: { color: style.fill },
      lineStyle: { color: style.line, width: 2 },
      itemStyle: { color: style.line },
    }
  })
  
  // 初始化 ECharts
  window.compareRadarChart = echarts.init(container)
  window.compareRadarChart.setOption({
    tooltip: { 
      trigger: 'item', 
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      borderColor: '#5cb87a',
      borderWidth: 1,
      textStyle: { color: '#ffffff', fontSize: 14 },
      formatter: (params) => {
        // 只显示有归经的（value === 1）
        if (params.value === 1) {
          return `<strong>${params.seriesName}</strong><br/>${params.name}: ✓ 有归经`
        }
        // value === 0 时不显示任何内容
        return ''
      }
    },
    radar: {
      indicator: meridianList.map(m => ({ name: m, max: 1 })),
      center: ['50%', '50%'],
      radius: '60%',
      name: {
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' }
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(92, 184, 122, 0.14)', 'rgba(201, 160, 89, 0.1)'],
        },
      },
      splitLine: {
        lineStyle: { color: 'rgba(255, 255, 255, 0.3)', width: 1 }
      },
      axisLine: {
        lineStyle: { color: 'rgba(255, 255, 255, 0.4)', width: 1 }
      },
      axisTick: {
        lineStyle: { color: 'rgba(255, 255, 255, 0.3)' }
      }
    },
    series: [{
      type: 'radar',
      data: seriesData.map(item => ({
        name: item.name,
        value: item.value,
        areaStyle: item.areaStyle,
        lineStyle: item.lineStyle,
        itemStyle: item.itemStyle
      })),
      symbol: 'circle',
      symbolSize: 8,
      emphasis: {
        scale: true,
        lineStyle: { width: 3 },
        areaStyle: { opacity: 0.4 }
      }
    }],
    legend: {
      data: selectedHerbs.value.map(h => h.name),
      textStyle: { color: '#ffffff' },
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 20,
      padding: [4, 12]
    }
  })
}

// 绘制对比条形图（优化样式）
const drawCompareBarChart = () => {
  const canvas = document.getElementById('compareBarCanvas')
  if (!canvas) return
  
  // 销毁旧图表
  if (compareBarChart) {
    compareBarChart.destroy()
  }
  
  // 收集所有归经
  const allMeridians = new Set()
  selectedHerbs.value.forEach(herb => {
    herb.meridians?.forEach(m => allMeridians.add(m))
  })
  const meridianList = Array.from(allMeridians)
  
  // 准备数据集
  const datasets = selectedHerbs.value.map((herb, idx) => ({
    label: herb.name,
    data: meridianList.map(m => herb.meridians?.includes(m) ? 1 : 0),
    backgroundColor: COMPARE_HERB_STYLES[idx % COMPARE_HERB_STYLES.length].line,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    barPercentage: 0.6,
    categoryPercentage: 0.7,
  }))
  
  compareBarChart = new Chart(canvas, {
    type: 'bar',
    data: { labels: meridianList, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { 
          position: 'top', 
          labels: { font: { size: 14, weight: 'bold' }, color: '#ffffff' } 
        },
        tooltip: { 
          callbacks: { 
            label: (ctx) => `${ctx.dataset.label}: ${ctx.raw === 1 ? '✓ 归经' : '✗ 无'}` 
          } 
        }
      },
      scales: {
        y: { 
          beginAtZero: true, 
          max: 1, 
          ticks: { stepSize: 1, callback: (v) => v === 1 ? '有' : '无', color: '#ffffff' }, 
          title: { display: true, text: '是否有此归经', color: '#ffffff' } 
        },
        x: { 
          ticks: { rotate: 35, font: { size: 14, weight: 'bold' }, color: '#ffffff' } 
        }
      }
    }
  })
}

// 切换图表
const switchToBar = () => { chartType.value = 'bar'; nextTick(() => { if (barChart) { updateBarChart(); barChart.resize() } }) }
const switchToRadar = () => { chartType.value = 'radar'; nextTick(() => { if (radarChart) { updateRadarChart(); radarChart.resize() } }) }

// 原有饼图
const updatePieChart = () => {
  if (!pieChart) return
  const stats = {}
  filteredHerbs.value.forEach(herb => { stats[herb.property] = (stats[herb.property] || 0) + 1 })
  const data = Object.entries(stats).map(([name, value]) => ({ name: `${name}性`, value, itemStyle: { color: getPropertyColor(name) } }))
  pieLegendData.value = data.map(item => ({ name: item.name, value: item.value, color: item.itemStyle.color }))
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {d}% ({c}种)' },
    series: [{ type: 'pie', radius: '55%', data: data, label: { show: true, formatter: '{b}', position: 'outside', fontSize: 12, fontWeight: 'bold', color: '#ffffff' }, labelLine: { length: 8, length2: 6 } }]
  })
}

// 原有环形图
const updateDonutChart = () => {
  if (!donutChart) return
  const stats = {}
  filteredHerbs.value.forEach(herb => { const cat = herb.category || '其他'; stats[cat] = (stats[cat] || 0) + 1 })
  const data = Object.entries(stats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)
  donutChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {d}% ({c}种)' },
    series: [{ type: 'pie', radius: ['40%', '65%'], data: data.map((item, idx) => ({ name: item.name, value: item.value, itemStyle: { color: getPaletteColor(idx) } })), label: { show: true, formatter: '{b}', position: 'outside', fontSize: 11, color: '#ffffff' }, labelLine: { length: 6, length2: 4 } }]
  })
}

// 原有条形图
const updateBarChart = () => {
  if (!barChart) return
  const stats = {}
  filteredHerbs.value.forEach(herb => { if (herb.meridians) { herb.meridians.forEach(m => { if (m && m.trim()) stats[m] = (stats[m] || 0) + 1 }) } })
  const data = Object.entries(stats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 12)
  barChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c} 种' },
    grid: { left: '12%', right: '5%', top: '10%', bottom: '12%', containLabel: true },
    xAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { rotate: 30, fontSize: 11, fontWeight: 'bold', color: '#ffffff' } },
    yAxis: { type: 'value', name: '药材数量', nameTextStyle: { color: '#ffffff' }, axisLabel: { color: '#ffffff' } },
    series: [{
      type: 'bar',
      data: data.map((d, idx) => ({
        value: d.value,
        itemStyle: {
          color: getPaletteColor(idx),
          borderRadius: [4, 4, 0, 0],
        },
      })),
      label: { show: true, position: 'top', fontSize: 11, fontWeight: 'bold', color: '#ffffff' },
    }],
  })
}

// 原有雷达图
const updateRadarChart = () => {
  if (!radarChart) return
  const stats = {}
  filteredHerbs.value.forEach(herb => { if (herb.meridians) { herb.meridians.forEach(m => { if (m && m.trim()) stats[m] = (stats[m] || 0) + 1 }) } })
  const data = Object.entries(stats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10)
  const maxVal = Math.max(...data.map(d => d.value)) + 5
  radarChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 种' },
    radar: { indicator: data.map(d => ({ name: d.name, max: maxVal })), center: ['50%', '50%'], radius: '60%', name: { textStyle: { fontSize: 11, fontWeight: 'bold', color: '#ffffff' } } },
    series: [{
      type: 'radar',
      data: [{
        value: data.map(d => d.value),
        name: '药材数量',
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(92, 184, 122, 0.45)' },
              { offset: 1, color: 'rgba(201, 160, 89, 0.2)' },
            ],
          },
        },
        lineStyle: { color: '#c9a059', width: 2 },
        itemStyle: { color: '#5cb87a' },
      }],
    }],
  })
}

const updateAllCharts = () => { nextTick(() => { updatePieChart(); updateDonutChart(); if (chartType.value === 'bar') updateBarChart(); else updateRadarChart() }) }

const exportCurrentData = () => {
  const blob = new Blob([JSON.stringify({ time: new Date().toLocaleString(), selectedHerbs: selectedHerbs.value.map(h => ({ name: h.name, property: h.property, meridians: h.meridians, category: h.category })) }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `herbs-comparison-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url)
}

// 初始化
const initCharts = () => {
  if (pieChartRef.value) pieChart = echarts.init(pieChartRef.value)
  if (donutChartRef.value) donutChart = echarts.init(donutChartRef.value)
  if (barChartRef.value) barChart = echarts.init(barChartRef.value)
  if (radarChartRef.value) radarChart = echarts.init(radarChartRef.value)
}

onMounted(async () => { initCharts(); await loadData() })
</script>

<style scoped>
.herb-analysis-dashboard { 
  padding: 24px; 
  background: var(--herb-gradient-hero); 
  min-height: 100vh; 
  color: var(--herb-on-dark);
}
.dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.dashboard-header h1 { margin: 0; font-size: 24px; color: var(--herb-on-dark); }
.export-btn { padding: 8px 20px; background: var(--herb-sage); color: var(--herb-paper); border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }

.filter-bar { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2); position: relative; z-index: 30; }
.search-section { position: relative; margin-bottom: 16px; z-index: 40; }
.search-input { width: 100%; padding: 12px 16px; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; font-size: 14px; color: var(--herb-text); background: rgba(255,255,255,0.92); }
.search-input:focus { border-color: var(--herb-gold); outline: none; box-shadow: 0 0 0 2px rgba(201, 160, 89, 0.25); }
.search-dropdown { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: var(--herb-paper); border: 1px solid var(--herb-border-soft); border-radius: 8px; max-height: 260px; overflow-y: auto; z-index: 200; box-shadow: var(--herb-shadow-lg); }
.search-item { padding: 10px 16px; cursor: pointer; color: var(--herb-text); display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.search-item:hover { background: var(--herb-parchment); }
.search-item__name { font-weight: 600; color: var(--herb-forest); }
.search-item__meta { font-size: 12px; color: var(--herb-text-muted); white-space: nowrap; }
.search-empty { padding: 14px 16px; text-align: center; color: var(--herb-text-muted); font-size: 14px; }

.select-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 16px; }
.herb-tag { display: inline-flex; align-items: center; gap: 6px; background: rgba(232, 245, 233, 0.92); color: var(--herb-forest); padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; border: 1px solid var(--herb-border-soft); }
.remove-tag { background: none; border: none; cursor: pointer; color: var(--herb-text-muted); font-size: 14px; }
.remove-tag:hover { color: var(--herb-sage); }

.select-actions { display: flex; align-items: center; gap: 12px; }
.compare-btn, .clear-compare-btn { padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
.compare-btn { background: var(--herb-sage); color: var(--herb-paper); }
.compare-btn:hover { background: var(--herb-mint); }
.clear-compare-btn { background: rgba(244, 249, 240, 0.92); color: var(--herb-text); }
.hint { font-size: 13px; color: var(--herb-on-dark-soft); }

.stats-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; }
.stat-card { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2); }
.stat-number { font-size: 32px; font-weight: bold; color: #ffffff; }
.stat-label { font-size: 13px; color: rgba(255, 255, 255, 0.9); margin-top: 6px; }

.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
.chart-box { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2); }
.chart-title { font-size: 16px; font-weight: bold; margin-bottom: 16px; text-align: center; color: #ffffff; }
.chart { width: 100%; height: 300px; }
.legend-inline { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; margin-top: 12px; font-size: 13px; font-weight: bold; color: #ffffff; }
.legend-dot { display: inline-flex; align-items: center; gap: 6px; }
.legend-dot .dot { width: 12px; height: 12px; border-radius: 2px; }
.total-note { text-align: center; margin-top: 8px; font-size: 13px; color: rgba(255, 255, 255, 0.7); }

.full-width-section { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; margin-bottom: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2); }
.section-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 20px; }
.section-header h2 { margin: 0; font-size: 18px; color: #ffffff; }
.chart-type-switch { display: flex; gap: 8px; }
.chart-type-switch button { padding: 5px 14px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.2); border-radius: 4px; cursor: pointer; color: #ffffff; font-weight: bold; }
.chart-type-switch button.active { background: var(--herb-gold); border-color: var(--herb-gold); color: var(--herb-forest); }
.chart-container-large { width: 100%; min-height: 400px; }
.chart-large { width: 100%; height: 400px; }

.property-description { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.desc-card { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 8px; padding: 16px; border-left: 3px solid; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.desc-card h4 { margin: 0 0 8px 0; font-size: 15px; font-weight: bold; color: #ffffff; }
.desc-card p { margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.85); line-height: 1.5; }
.desc-card.cool { border-left-color: #66bb6a; }
.desc-card.warm { border-left-color: #c9a059; }
.desc-card.neutral { border-left-color: #9ccc65; }
.desc-card.complex { border-left-color: #527e72; }

/* ===== 对比模态框样式 ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: rgba(67, 171, 130, 0.32);
  backdrop-filter: blur(16px);
  border-radius: 24px;
  padding: 28px;
  max-width: 1300px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.modal-header h3 {
  margin: 0;
  font-size: 22px;
  color: #ffffff;
  font-weight: bold;
}

.modal-close {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 20px;
  cursor: pointer;
  color: #ffffff;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(168, 208, 141, 0.35);
  color: var(--herb-on-dark);
  border-color: rgba(168, 208, 141, 0.55);
}

/* 对比表格样式 */
.compare-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 28px;
  border-radius: 16px;
  overflow: hidden;
}

.compare-table th,
.compare-table td {
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  vertical-align: top;
  text-align: left;
}

.compare-table th {
  background: rgba(61, 122, 98, 0.55);
  font-weight: bold;
  color: #ffffff;
  font-size: 15px;
  backdrop-filter: blur(4px);
}

.label-cell {
  font-weight: bold;
  color: #ffffff;
  width: 100px;
  background: rgba(255, 255, 255, 0.1);
}

.value-cell {
  color: #f0f0f0;
  font-weight: 500;
}

.effect-cell {
  font-size: 13px;
  line-height: 1.5;
  color: #e0e0e0;
  font-weight: 400;
}

/* 对比图表容器 */
.compare-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
}

.compare-chart-box {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.compare-chart-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.35);
}

.compare-chart-box .chart-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 16px;
  text-align: center;
  color: #ffffff !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 对比图例 */
.compare-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  margin-top: 16px;
}

.compare-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: bold;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
}

.compare-legend-item .legend-color {
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

/* 药性标签徽章 */
.property-badge {
  padding: 4px 14px;
  border-radius: 20px;
  color: white;
  font-size: 12px;
  font-weight: bold;
  display: inline-block;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

/* 响应式 */
@media (max-width: 900px) {
  .compare-charts {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .modal-content {
    padding: 20px;
  }
  .compare-table th,
  .compare-table td {
    padding: 10px 12px;
    font-size: 13px;
  }
}

@media (max-width: 800px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
  .property-description {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>