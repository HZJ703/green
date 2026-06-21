<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import * as d3 from 'd3'
import { RouterLink } from 'vue-router'
import { herbData, calculateCompatibility, calculateScore, natureColors, type Herb } from '../data/herbData'
import { herbPairs } from '../data/herbPairs'
import '../assets/CompatibilityView.css'

const chordChart = ref<SVGSVGElement | null>(null)
const bubbleChart = ref<SVGSVGElement | null>(null)
const currentThreshold = ref(15)
const natureFilter = ref('')
const searchQuery = ref('')
const selectedHerb = ref<Herb | null>(null)
const isBubbleView = ref(false)
const herbInfoHtml = ref('<p class="hint">点击弦图查看详情</p>')
const tooltipVisible = ref(false)
const tooltipContent = ref('')
const tooltipLeft = ref(0)
const tooltipTop = ref(0)

let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
let chordGroup: d3.Selection<SVGGElement, unknown, null, undefined>
let bubbleSvg: d3.Selection<SVGSVGElement, unknown, null, undefined>
let width = 900, height = 750
let matrix: number[][] = calculateCompatibility(herbData, currentThreshold.value)
let scale = 1
let translateX = 0
let translateY = 0

function updateDimensions() {
  const container = document.getElementById('chart-container')
  if (container) {
    width = container.clientWidth - 20
    height = container.clientHeight - 20
  }
}

function getFilteredHerbs() {
  return herbData.filter(herb => {
    const matchesSearch = !searchQuery.value || herb.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesNature = !natureFilter.value || herb.nature === natureFilter.value
    return matchesSearch && matchesNature
  })
}

function findHerbPair(herb1: string, herb2: string) {
  return herbPairs.find(pair =>
    (pair.herbs[0] === herb1 && pair.herbs[1] === herb2) ||
    (pair.herbs[0] === herb2 && pair.herbs[1] === herb1)
  )
}

function renderChord() {
  isBubbleView.value = false
  chordGroup.selectAll('*').remove()
  d3.select('#chord-chart').classed('hidden', false)
  d3.select('#bubble-chart').classed('active', false)

  const filteredHerbs = getFilteredHerbs()
  if (filteredHerbs.length === 0) {
    chordGroup.append('text').attr('text-anchor', 'middle').attr('font-size', '18px').attr('fill', '#3d7a62').text('未找到药材')
    return
  }

  const filteredMatrix: number[][] = []
  filteredHerbs.forEach((herb1, idx1) => {
    const row: number[] = []
    filteredHerbs.forEach((herb2, idx2) => {
      const pair = findHerbPair(herb1.name, herb2.name)
      if (pair) {
        const originalIdx1 = herbData.indexOf(herb1)
        const originalIdx2 = herbData.indexOf(herb2)
        const score = matrix[originalIdx1][originalIdx2]
        row.push(score >= currentThreshold.value ? score : 0)
      } else {
        row.push(0)
      }
    })
    filteredMatrix.push(row)
  })

  const hasValidData = filteredMatrix.some(row => row.some(val => val > 0))
  if (!hasValidData) {
    chordGroup.append('text').attr('text-anchor', 'middle').attr('font-size', '18px').attr('fill', '#3d7a62').text('暂无配伍数据')
    return
  }

  const chordLayout = d3.chord().padAngle(0.05).sortSubgroups(d3.descending)
  const chords = chordLayout(filteredMatrix)
  const outerRadius = Math.max(50, Math.min(width, height) * 0.4)
  const innerRadius = Math.max(20, outerRadius - 24)
  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius)
  const ribbon = d3.ribbon().radius(innerRadius)

  const connectedHerbs = new Set<number>()
  chords.forEach(d => {
    if (d.source.value > 0) {
      connectedHerbs.add(d.source.index)
      connectedHerbs.add(d.target.index)
    }
  })

  chordGroup.append('g').attr('class', 'chord-group').selectAll('path').data(chords).join('path')
    .attr('class', 'chord-path').attr('d', ribbon)
    .attr('fill', d => {
      const sourceColor = natureColors[filteredHerbs[d.source.index].nature]
      const targetColor = natureColors[filteredHerbs[d.target.index].nature]
      return d3.interpolateRgb(sourceColor, targetColor)(0.5)
    })
    .on('mouseover', function(event, d) {
      const source = filteredHerbs[d.source.index]
      const target = filteredHerbs[d.target.index]
      const score = filteredMatrix[d.source.index][d.target.index]
      const pair = findHerbPair(source.name, target.name)
      let content = `<strong>${source.name}</strong> ↔ <strong>${target.name}</strong><br/>`
      content += `<span style="color: #5cb87a">配伍指数: ${score.toFixed(1)}</span>`
      if (pair) content += `<br/><span style="color: #2d5a2d">${pair.effect}</span>`
      showTooltip(event.pageX, event.pageY, content)
      d3.select(this).transition().duration(200).attr('fill-opacity', 0.9)
    })
    .on('mousemove', function(event) { showTooltip(event.pageX, event.pageY, null) })
    .on('mouseout', function() { hideTooltip(); d3.select(this).transition().duration(200).attr('fill-opacity', 0.65) })
    .on('click', function(event, d) {
      const source = filteredHerbs[d.source.index]
      const target = filteredHerbs[d.target.index]
      const pair = findHerbPair(source.name, target.name)
      if (pair) showPairInfo(source, target, pair)
    })

  const groups = chordGroup.append('g').attr('class', 'arc-group').selectAll('g').data(chords.groups).join('g').attr('class', 'arc')

  groups.append('path').attr('d', arc)
    .attr('fill', d => natureColors[filteredHerbs[d.index].nature])
    .attr('stroke', d => d3.rgb(natureColors[filteredHerbs[d.index].nature]).darker(0.3))
    .attr('stroke-width', 2)
    .attr('opacity', d => connectedHerbs.has(d.index) ? 1 : 0.4)
    .attr('cursor', d => connectedHerbs.has(d.index) ? 'pointer' : 'default')
    .on('mouseover', function(event, d) {
      const herb = filteredHerbs[d.index]
      let content = `<strong>${herb.name}</strong><br/>${herb.nature} | ${herb.effect}`
      if (!connectedHerbs.has(d.index)) content += `<br/><span style="color: #b84a4a">无配伍关系</span>`
      showTooltip(event.pageX, event.pageY, content)
      d3.select(this).transition().duration(200).attr('opacity', 1)
    })
    .on('mousemove', function(event) { showTooltip(event.pageX, event.pageY, null) })
    .on('mouseout', function(event, d) { hideTooltip(); d3.select(this).transition().duration(200).attr('opacity', connectedHerbs.has(d.index) ? 1 : 0.4) })
    .on('click', function(event, d) { if (connectedHerbs.has(d.index)) selectHerb(filteredHerbs[d.index]) })

  groups.append('text')
    .attr('transform', d => {
      const angle = (d.startAngle + d.endAngle) / 2
      const x = Math.cos(angle) * (outerRadius + 14)
      const y = Math.sin(angle) * (outerRadius + 14)
      return `translate(${x}, ${y})`
    })
    .attr('text-anchor', 'middle').attr('dy', '0.35em').attr('font-size', '12px').attr('font-weight', '600')
    .attr('font-family', 'Microsoft YaHei, sans-serif').attr('fill', '#064e3b')
    .attr('opacity', d => connectedHerbs.has(d.index) ? 1 : 0.4)
    .text(d => filteredHerbs[d.index].name)
}

function renderBubbleChart(herbName: string) {
  isBubbleView.value = true
  bubbleSvg.selectAll('*').remove()
  d3.select('#chord-chart').classed('hidden', true)
  d3.select('#bubble-chart').classed('active', true)

  const herb = herbData.find(h => h.name === herbName)
  if (!herb) {
    bubbleSvg.append('text').attr('x', width / 2).attr('y', height / 2).attr('text-anchor', 'middle').attr('font-size', '16px').attr('fill', '#3d7a62').text('未找到药材')
    return
  }

  const herbIdx = herbData.indexOf(herb)
  const relatedHerbs: { herb: Herb; score: number }[] = []

  for (let i = 0; i < herbData.length; i++) {
    if (i !== herbIdx) {
      const pair = findHerbPair(herb.name, herbData[i].name)
      if (pair) {
        const score = matrix[herbIdx][i]
        if (score > 0) relatedHerbs.push({ herb: herbData[i], score: score })
      }
    }
  }

  relatedHerbs.sort((a, b) => b.score - a.score)

  if (relatedHerbs.length === 0) {
    bubbleSvg.append('text').attr('x', width / 2).attr('y', height / 2).attr('text-anchor', 'middle').attr('font-size', '16px').attr('fill', '#3d7a62').text(`${herb.name} 暂无配伍数据`)
    return
  }

  const margin = { top: 60, right: 30, bottom: 30, left: 30 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  let bubbleScale = 1, bubbleTranslateX = 0, bubbleTranslateY = 0

  const g = bubbleSvg.append('g').attr('transform', `translate(${margin.left + bubbleTranslateX}, ${margin.top + bubbleTranslateY}) scale(${bubbleScale})`)

  bubbleSvg.on('wheel', function(event) {
    event.preventDefault()
    const delta = event.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.5, Math.min(2.5, bubbleScale * delta))
    const rect = this.getBoundingClientRect()
    const x = event.clientX - rect.left - margin.left
    const y = event.clientY - rect.top - margin.top
    bubbleTranslateX = x - (x - bubbleTranslateX) * (newScale / bubbleScale)
    bubbleTranslateY = y - (y - bubbleTranslateY) * (newScale / bubbleScale)
    bubbleScale = newScale
    g.attr('transform', `translate(${margin.left + bubbleTranslateX}, ${margin.top + bubbleTranslateY}) scale(${bubbleScale})`)
  })

  bubbleSvg.append('text').attr('class', 'bubble-title').attr('x', width / 2).attr('y', 35).text(`${herb.name} 的配伍关系`)

  const centerNode = { name: herb.name, herb: herb, score: 100, isCenter: true }
  const nodes = [centerNode, ...relatedHerbs.map(r => ({ name: r.herb.name, herb: r.herb, score: r.score, isCenter: false }))]
  const maxScore = Math.max(...relatedHerbs.map(r => r.score), 1)
  const radiusScale = d3.scaleSqrt().domain([0, maxScore]).range([20, 50])
  const centerRadius = radiusScale(maxScore) * 1.5

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(nodes.slice(1).map((d, i) => ({ source: 0, target: i + 1 }))).distance(150).strength(0.5))
    .force('charge', d3.forceManyBody().strength(-100))
    .force('center', d3.forceCenter(chartWidth / 2, chartHeight / 2))
    .force('collision', d3.forceCollide().radius(d => d.isCenter ? centerRadius : radiusScale(d.score) + 10))

  const links = g.append('g').selectAll('line').data(nodes.slice(1)).join('line').attr('class', 'bubble-link')

  const nodes_g = g.append('g').selectAll('g').data(nodes).join('g').attr('class', 'bubble-node')
    .call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended))

  nodes_g.append('circle')
    .attr('r', d => d.isCenter ? centerRadius : radiusScale(d.score))
    .attr('fill', d => d.isCenter ? natureColors[herb.nature] : natureColors[d.herb.nature])
    .attr('stroke', '#ffffff').attr('stroke-width', 3).attr('opacity', d => d.isCenter ? 1 : 0.85)
    .on('mouseover', function(event, d) {
      if (d.isCenter) {
        showTooltip(event.pageX, event.pageY, `<strong>${d.name}</strong><br/>${d.herb.nature} | ${d.herb.effect}`)
      } else {
        const pair = findHerbPair(herb.name, d.name)
        let content = `<strong>${d.name}</strong><br/><span style="color: #3d7a62">配伍指数: ${d.score.toFixed(1)}</span>`
        if (pair) content += `<br/><span style="color: #2d5a2d">${pair.effect}</span>`
        showTooltip(event.pageX, event.pageY, content)
      }
      d3.select(this).attr('stroke-width', 4)
    })
    .on('mousemove', function(event) { showTooltip(event.pageX, event.pageY, null) })
    .on('mouseout', function() { hideTooltip(); d3.select(this).attr('stroke-width', 3) })
    .on('click', function(event, d) { if (!d.isCenter) { const pair = findHerbPair(herb.name, d.name); if (pair) showPairInfo(herb, d.herb, pair) } })

  nodes_g.append('text').attr('class', 'bubble-label').attr('text-anchor', 'middle').attr('dy', '0.35em').text(d => d.name)

  simulation.on('tick', () => {
    links.attr('x1', nodes[0].x).attr('y1', nodes[0].y).attr('x2', d => d.x).attr('y2', d => d.y)
    nodes_g.attr('transform', d => {
      d.x = Math.max(radiusScale(d.score), Math.min(chartWidth - radiusScale(d.score), d.x))
      d.y = Math.max(radiusScale(d.score), Math.min(chartHeight - radiusScale(d.score), d.y))
      return `translate(${d.x}, ${d.y})`
    })
  })

  function dragstarted(event: d3.D3DragEvent<unknown, unknown, unknown>, d: { fx?: number; fy?: number }) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    d.fx = d.x; d.fy = d.y
  }
  function dragged(event: d3.D3DragEvent<unknown, unknown, unknown>, d: { fx?: number; fy?: number }) {
    d.fx = event.x; d.fy = event.y
  }
  function dragended(event: d3.D3DragEvent<unknown, unknown, unknown>, d: { fx?: number; fy?: number }) {
    if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null
  }

  updateBubbleStats(herb, relatedHerbs)
}

function updateBubbleStats(herb: Herb, relatedHerbs: { herb: Herb; score: number }[]) {
  herbInfoHtml.value = `
    <div class="herb-name">${herb.name}</div>
    <div class="info-row"><span class="info-label">药性：</span><span class="herb-property">${herb.nature}</span><span class="herb-property">${herb.taste}</span></div>
    <div class="info-row"><span class="info-label">归经：</span>${herb.meridian.map(m => `<span class="herb-channel">${m}</span>`).join('')}</div>
    <div class="info-row"><span class="info-label">功效：</span><span class="info-value">${herb.effect}</span></div>
    <div class="info-row"><span class="info-label">分类：</span><span class="info-value">${herb.category}</span></div>
    <div class="info-row"><span class="info-label">配伍药材：</span><span class="info-value">${relatedHerbs.length}味</span></div>
  `
}

function selectHerb(herb: Herb) {
  selectedHerb.value = herb
  updateInfoPanel(herb)
}

function showPairInfo(herb1: Herb, herb2: Herb, pair: typeof herbPairs[0]) {
  const score = calculateScore(herb1, herb2)
  const prescriptionsHtml = pair.prescriptions && pair.prescriptions.length > 0
    ? `<div class="related-herbs"><h4>常见药方</h4><div class="prescriptions-list">${pair.prescriptions.map(p => `<span class="prescription-tag">${p}</span>`).join('')}</div></div>`
    : ''

  herbInfoHtml.value = `
    <div class="back-button-container"><button class="back-btn" data-herb="${herb1.name}">← 返回 ${herb1.name} 的配伍列表</button></div>
    <div class="herb-name">${herb1.name} + ${herb2.name}</div>
    <div class="info-row"><span class="info-label">配伍指数：</span><span class="info-value">${score.toFixed(1)}</span></div>
    <div class="info-row"><span class="info-label">配伍功效：</span><span class="herb-property">${pair.effect}</span></div>
    <div class="info-row"><span class="info-label">${herb1.name}药性：</span><span class="herb-property">${herb1.nature}</span><span class="herb-property">${herb1.taste}</span></div>
    <div class="info-row"><span class="info-label">${herb2.name}药性：</span><span class="herb-property">${herb2.nature}</span><span class="herb-property">${herb2.taste}</span></div>
    <div class="related-herbs"><h4>配伍说明</h4><p class="pair-desc">${pair.description}</p></div>
    ${prescriptionsHtml}
  `

  nextTick(() => {
    const backBtn = document.querySelector('.back-btn')
    if (backBtn) backBtn.addEventListener('click', function() {
      const herbName = this.getAttribute('data-herb')
      if (herbName) {
        const h = herbData.find(h => h.name === herbName)
        if (h) { selectedHerb.value = h; updateInfoPanel(h) }
      }
    })
  })
}

function updateInfoPanel(herb: Herb) {
  const relatedPairs = herbPairs.filter(pair => pair.herbs.includes(herb.name))

  const relatedItems = relatedPairs
    .map(pair => {
      const otherHerbName = pair.herbs[0] === herb.name ? pair.herbs[1] : pair.herbs[0]
      const otherHerb = herbData.find(h => h.name === otherHerbName)
      if (!otherHerb) return null
      const score = calculateScore(herb, otherHerb)
      if (score < currentThreshold.value) return null
      return { herb: otherHerb, score: score, pair: pair }
    })
    .filter((item): item is { herb: Herb; score: number; pair: typeof herbPairs[0] } => item !== null)
    .sort((a, b) => b.score - a.score)

  const groupedPairs: { [key: string]: { otherHerb: Herb; score: number; effects: { effect: string; description: string }[] } } = {}
  relatedItems.forEach(item => {
    const key = `${herb.name}+${item.herb.name}`
    if (!groupedPairs[key]) groupedPairs[key] = { otherHerb: item.herb, score: item.score, effects: [] }
    groupedPairs[key].effects.push({ effect: item.pair.effect, description: item.pair.description })
  })

  const groupedList = Object.values(groupedPairs).sort((a, b) => b.score - a.score)

  herbInfoHtml.value = `
    <div class="herb-name">${herb.name}</div>
    <div class="info-row"><span class="info-label">药性：</span><span class="herb-property">${herb.nature}</span><span class="herb-property">${herb.taste}</span></div>
    <div class="info-row"><span class="info-label">归经：</span>${herb.meridian.map(m => `<span class="herb-channel">${m}</span>`).join('')}</div>
    <div class="info-row"><span class="info-label">功效：</span><span class="info-value">${herb.effect}</span></div>
    <div class="info-row"><span class="info-label">分类：</span><span class="info-value">${herb.category}</span></div>
    ${groupedList.length > 0 ? `
      <div class="related-herbs"><h4>配伍药对（${groupedList.length}）</h4>
      ${groupedList.map(group => `
        <div class="herb-pair-item" data-herb="${group.otherHerb.name}">
          <div class="pair-header"><span class="pair-herbs">${herb.name} + ${group.otherHerb.name}</span><span class="pair-score">${group.score.toFixed(0)}</span></div>
          <div class="pair-effects-list">${group.effects.map(eff => `<div class="pair-effect-item"><div class="pair-effect">${eff.effect}</div><div class="pair-desc">${eff.description}</div></div>`).join('')}</div>
        </div>
      `).join('')}</div>
    ` : '<div class="related-herbs"><h4>配伍药对</h4><p class="hint">暂无配伍药对信息</p></div>'}
  `

  nextTick(() => {
    document.querySelectorAll('.herb-pair-item').forEach(item => {
      item.addEventListener('click', function() {
        const herbName = this.getAttribute('data-herb')
        const relatedHerb = herbData.find(h => h.name === herbName)
        if (relatedHerb) {
          const pairData = herbPairs.find(p => p.herbs.includes(herb.name) && p.herbs.includes(herbName!))
          if (pairData) showPairInfo(herb, relatedHerb, pairData)
        }
      })
    })
  })
}

function showTooltip(x: number, y: number, content: string | null) {
  if (content !== null) tooltipContent.value = content
  tooltipLeft.value = x + 10; tooltipTop.value = y - 10; tooltipVisible.value = true
}

function hideTooltip() { tooltipVisible.value = false }

function handleThresholdChange() {
  matrix = calculateCompatibility(herbData, currentThreshold.value)
  if (!isBubbleView.value) renderChord()
  else if (selectedHerb.value) renderBubbleChart(selectedHerb.value.name)
}

function handleSearch() {
  if (searchQuery.value) {
    const herb = herbData.find(h => h.name === searchQuery.value)
    if (herb) { selectedHerb.value = herb; renderBubbleChart(searchQuery.value) }
    else renderChord()
  } else renderChord()
}

function handleNatureFilter() {
  document.querySelectorAll('.legend-item').forEach(el => {
    const nature = el.getAttribute('data-nature')
    el.style.opacity = (natureFilter.value === nature || !natureFilter.value) ? '1' : '0.5'
  })
  searchQuery.value = ''; renderChord()
}

function handleLegendClick(nature: string) {
  natureFilter.value = natureFilter.value === nature ? '' : nature
  handleNatureFilter()
}

function resetView() {
  selectedHerb.value = null; searchQuery.value = ''; natureFilter.value = ''
  herbInfoHtml.value = '<p class="hint">点击弦图查看详情</p>'
  scale = 1; translateX = 0; translateY = 0; updateChordTransform(); renderChord()
}

function updateChordTransform() {
  if (chordGroup) chordGroup.attr('transform', `translate(${width / 2 + translateX}, ${height / 2 + translateY}) scale(${scale})`)
}

function handleWheel(e: WheelEvent) {
  if (isBubbleView.value) return
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(0.5, Math.min(2.5, scale + delta))
  const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
  const x = e.clientX - rect.left - width / 2 - translateX
  const y = e.clientY - rect.top - height / 2 - translateY
  translateX = x - (x * newScale) / scale + translateX
  translateY = y - (y * newScale) / scale + translateY
  scale = newScale; updateChordTransform()
}

onMounted(() => {
  updateDimensions()
  svg = d3.select(chordChart.value).attr('width', width).attr('height', height).on('wheel', handleWheel)
  chordGroup = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`)
  bubbleSvg = d3.select(bubbleChart.value).attr('width', width).attr('height', height)
  renderChord()

  document.addEventListener('keydown', e => { if (e.key === 'Escape') resetView() })
  window.addEventListener('resize', () => {
    updateDimensions()
    svg.attr('width', width).attr('height', height)
    bubbleSvg.attr('width', width).attr('height', height)
    if (!isBubbleView.value) { chordGroup.attr('transform', `translate(${width / 2 + translateX}, ${height / 2 + translateY}) scale(${scale})`); renderChord() }
  })
})
</script>

<template>
  <div class="compatibility-page">
    <header>
      <div class="header-left">
        <RouterLink class="back-link" to="/">← 返回首页</RouterLink>
        <h1 class="header-title">配伍关系</h1>
      </div>
      <div class="controls">
        <div class="search-box">
          <input type="text" v-model="searchQuery" placeholder="搜索药材名称..." @keyup.enter="handleSearch" />
          <button @click="handleSearch">搜索</button>
        </div>
        <select v-model="natureFilter" @change="handleNatureFilter">
          <option value="">全部药性</option>
          <option value="寒">寒性</option>
          <option value="微寒">微寒</option>
          <option value="凉">凉性</option>
          <option value="平">平性</option>
          <option value="温">温性</option>
          <option value="微温">微温</option>
          <option value="热">热性</option>
        </select>
        <label id="threshold-label">
          关联强度阈值：
          <input type="range" min="0" max="30" v-model.number="currentThreshold" @input="handleThresholdChange" />
          <span>{{ currentThreshold }}%</span>
        </label>
        <button @click="resetView">重置视图</button>
      </div>
    </header>
    <main>
      <div id="chart-container">
        <svg id="chord-chart" ref="chordChart"></svg>
        <svg id="bubble-chart" ref="bubbleChart" class="hidden"></svg>
      </div>
      <aside id="info-panel">
        <h3>中药详情</h3>
        <div id="herb-info" v-html="herbInfoHtml"></div>
        <div id="legend">
          <h4>药性分类</h4>
          <div class="legend-items">
            <div
              class="legend-item"
              v-for="(color, nature) in natureColors"
              :key="nature"
              :data-nature="nature"
              @click="handleLegendClick(nature)"
              :style="{ opacity: (natureFilter === nature || !natureFilter) ? 1 : 0.5 }"
            >
              <div class="legend-color" :style="{ background: color }"></div>
              <span>{{ nature }}</span>
            </div>
          </div>
        </div>
      </aside>
    </main>
    <div class="tooltip" :class="{ visible: tooltipVisible }" v-html="tooltipContent" :style="{ left: tooltipLeft + 'px', top: tooltipTop + 'px' }"></div>
  </div>
</template>