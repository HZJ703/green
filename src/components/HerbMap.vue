<template>
  <div class="herb-map-app">
    <!-- 头部 -->
    <div class="app-header">
      <div class="top-bar">
        <div class="logo-area">
          <i class="fas fa-leaf logo-icon"></i>
          <span class="title">本草集 · 药材地图</span>
        </div>
        <div class="search-wrapper">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input
              id="globalSearch"
              v-model="searchKeyword"
              placeholder="搜索药材 (支持拼音、功效) 或省份"
              @input="onSearchInput"
              @focus="onSearchFocus"
            />
            <button id="searchClear" class="search-clear" @click="clearSearch">
              <i class="fas fa-times-circle"></i>
            </button>
          </div>
          <div
            id="searchDropdown"
            class="search-dropdown"
            :class="{ show: showDropdown }"
            v-click-outside="closeDropdown"
          >
            <template v-for="section in dropdownSections" :key="section.title">
              <div class="dropdown-section">
                <div class="dropdown-section-title">{{ section.title }}</div>
                <div
                  v-for="item in section.items"
                  :key="item.name"
                  class="dropdown-item"
                  @click="onSelectDropdownItem(item)"
                >
                  <span v-html="highlightText(item.name, searchKeyword)"></span>
                  <span v-if="item.desc" class="item-desc">{{ item.desc }}</span>
                </div>
              </div>
            </template>
            <div v-if="dropdownSections.length === 0" class="no-result">未找到匹配结果</div>
          </div>
        </div>
        <div>
          <button class="tool-btn" @click="toggleNightMode">
            <i class="fas" :class="isNightMode ? 'fa-sun' : 'fa-moon'"></i>
            {{ isNightMode ? '日间' : '夜间' }}
          </button>
        </div>
      </div>
      <div class="filters" id="categoryFilters">
        <button
          v-for="cat in categories"
          :key="cat.value"
          class="filter-btn"
          :class="{ active: currentCategory === cat.value }"
          @click="setCategory(cat.value)"
        >
          {{ cat.label }}
        </button>
      </div>
      <div class="stats-row" id="statsPanel">
        <div class="stats-card"><strong>{{ totalHerbs }}</strong> 味药材</div>
        <div class="stats-card"><strong>{{ totalProvinces }}</strong> 个产区省</div>
        <div class="stats-card"><strong>{{ totalRecords }}</strong> 产地记录</div>
        <div v-if="selectedSearchHerb" class="stats-card stats-card--highlight">
          <strong>{{ selectedSearchHerb }}</strong> 产地已高亮
        </div>
      </div>
    </div>

    <!-- 地图容器 -->
    <div class="map-container">
      <div id="chinaMap" ref="mapRef" style="width:100%;height:100%;"></div>
      <div class="map-copyright">审图号：GS(2019)3333号</div>
      <div class="toolbar">
        <button class="tool-btn" @click="locateMe"><i class="fas fa-location-dot"></i> 我的省份</button>
        <button class="tool-btn" @click="focusSichuan"><i class="fas fa-map-pin"></i> 四川产区</button>
        <button class="tool-btn" @click="openTipModal"><i class="fas fa-prescription-bottle"></i> 禁忌速查</button>
      </div>

      <!-- 对比面板（已移到左上角） -->
      <div class="compare-panel-float" id="comparePanel">
        <div class="compare-title">
          <span><i class="fas fa-chart-simple"></i> 药材对比</span>
          <i
            class="fas"
            :class="compareCollapsed ? 'fa-plus-circle' : 'fa-minus-circle'"
            @click="toggleComparePanel"
          ></i>
        </div>
        <div v-show="!compareCollapsed" id="compareContent">
          <select v-model="compareHerb1" class="compare-select">
            <option v-for="name in allHerbNames" :key="name" :value="name">{{ name }}</option>
          </select>
          <select v-model="compareHerb2" class="compare-select">
            <option v-for="name in allHerbNames" :key="name" :value="name">{{ name }}</option>
          </select>
          <div id="compareResult" class="compare-detail">
            <div v-if="compareHerb1 && compareHerb2 && compareHerb1 !== compareHerb2">
              <div class="compare-detail-item">
                <strong>{{ compareHerb1 }}</strong> vs <strong>{{ compareHerb2 }}</strong>
              </div>
              <div class="compare-detail-item">
                <strong>类别：</strong>{{ herbsMaster[compareHerb1]?.category }} vs {{ herbsMaster[compareHerb2]?.category }}
              </div>
              <div class="compare-detail-item">
                <strong>性味：</strong>{{ herbsMaster[compareHerb1]?.property }} vs {{ herbsMaster[compareHerb2]?.property }}
              </div>
              <div class="compare-detail-item">
                <strong>功效：</strong>{{ herbsMaster[compareHerb1]?.efficacy }} vs {{ herbsMaster[compareHerb2]?.efficacy }}
              </div>
              <div class="compare-detail-item">
                <strong>禁忌：</strong>{{ herbsMaster[compareHerb1]?.taboos }} vs {{ herbsMaster[compareHerb2]?.taboos }}
              </div>
              <div class="compare-detail-item">
                <strong>道地产区：</strong>{{ herbsMaster[compareHerb1]?.daoOrigin || '无' }} vs {{ herbsMaster[compareHerb2]?.daoOrigin || '无' }}
              </div>
            </div>
            <div v-else class="compare-detail-item">请选择两味不同的药材</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 省份药材模态框 -->
    <div class="modal-mask" :class="{ active: provinceModalVisible }" @click.self="closeProvinceModal">
      <div class="modal-container">
        <div class="modal-header">
          <h2>{{ currentProvince }}</h2>
          <button class="close-modal" @click="closeProvinceModal">&times;</button>
        </div>
        <div class="modal-body">
          <input type="text" v-model="provinceSearchKeyword" placeholder="搜索该省药材" class="province-search" />
          <div class="herb-list">
            <div
              v-for="herb in filteredProvinceHerbs"
              :key="herb"
              class="herb-item"
              @click="selectHerbFromProvince(herb)"
            >
              {{ herb }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 禁忌速查模态框 -->
    <div class="modal-mask" :class="{ active: tipModalVisible }" @click.self="closeTipModal">
      <div class="modal-container">
        <div class="modal-header">
          <h2>用药禁忌速查</h2>
          <button class="close-modal" @click="closeTipModal">&times;</button>
        </div>
        <div class="modal-body">
          <input type="text" v-model="tipKeyword" placeholder="输入药材名" class="tip-input" @input="searchTip" />
          <div id="tipResult" v-if="tipHerb">
            <div><strong>禁忌</strong>: {{ tipHerb.taboos }}</div>
            <div><strong>用量</strong>: {{ tipHerb.dosage }}</div>
          </div>
          <div v-else-if="tipKeyword">未收录该药材</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'
import herbsData from '../data/herbs.json'
import { loadChinaGeoJSON } from '../utils/originUtils'

// ---------- 类型定义 ----------
interface HerbJson {
  '中药名称': string
  '药性': string
  '归经': string
  '功效关键词': string
  '具体功效': string
  '功效分类': string
  '药材基原': string
  '科属分类': string
  '产地': string
  '生态环境': string
}

const route = useRoute()

// ---------- 响应式数据 ----------
const mapRef = ref<HTMLElement>()
let myChart: echarts.ECharts | null = null
let shortToFullMap: Record<string, string> = {}

const herbsMaster = ref<Record<string, any>>({})
const herbProvinceMap = ref<Map<string, Set<string>>>(new Map())
const provinceHerbMap = ref<Map<string, Set<string>>>(new Map())
const daoHerbProvince = ref<Record<string, string>>({})
const provinceList = ref<string[]>([])

let originalHerbProvinceMap: Map<string, Set<string>> | null = null
let originalProvinceHerbMap: Map<string, Set<string>> | null = null
let originalHerbsMaster: any = null

// UI 状态
const currentCategory = ref('all')
const isNightMode = ref(false)
const searchKeyword = ref('')
const showDropdown = ref(false)
const dropdownSections = ref<Array<{ title: string; items: Array<{ name: string; desc?: string; type?: string }> }>>([])
const compareHerb1 = ref('')
const compareHerb2 = ref('')
const compareCollapsed = ref(false)
const provinceModalVisible = ref(false)
const currentProvince = ref('')
const provinceSearchKeyword = ref('')
const tipModalVisible = ref(false)
const tipKeyword = ref('')
const tipHerb = ref<any>(null)
const selectedSearchHerb = ref<string | null>(null)

// ---------- 计算属性 ----------
const categories = computed(() => {
  const catSet = new Set<string>()
  for (const herb of Object.values(herbsMaster.value)) {
    if (herb.category) catSet.add(herb.category)
  }
  return [{ label: '全部', value: 'all' }, ...Array.from(catSet).sort().map(c => ({ label: c, value: c }))]
})

const allHerbNames = computed(() => Object.keys(herbsMaster.value).sort())
const totalHerbs = computed(() => herbProvinceMap.value.size)
const totalProvinces = computed(() => provinceHerbMap.value.size)
const totalRecords = computed(() => {
  let sum = 0
  for (const s of herbProvinceMap.value.values()) sum += s.size
  return sum
})
const filteredProvinceHerbs = computed(() => {
  const herbs = Array.from(provinceHerbMap.value.get(currentProvince.value) || [])
  if (!provinceSearchKeyword.value) return herbs
  return herbs.filter(h => h.includes(provinceSearchKeyword.value))
})

// ---------- 数据加载 ----------
function loadDataFromJson() {
  const newHerbsMaster: Record<string, any> = {}
  const newHerbProvinceMap = new Map<string, Set<string>>()
  const newProvinceHerbMap = new Map<string, Set<string>>()
  const newDaoHerbProvince: Record<string, string> = {}

  provinceList.value = [
    "北京", "天津", "上海", "重庆", "河北", "山西", "辽宁", "吉林", "黑龙江",
    "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南",
    "广东", "广西", "海南", "四川", "贵州", "云南", "西藏", "陕西", "甘肃",
    "青海", "宁夏", "新疆", "内蒙古", "台湾", "香港", "澳门"
  ]

  for (const item of herbsData as HerbJson[]) {
    const name = item['中药名称']
    const category = item['功效分类']?.split(/[；;]/)[0]?.trim() || '其他'
    newHerbsMaster[name] = {
      pinyin: name.toLowerCase(),
      short: name[0],
      category: category,
      property: item['药性'] || '',
      efficacy: item['具体功效'] || '',
      efficacyTags: (item['具体功效'] || '').split(/[；，,、]/).map(t => t.trim()).filter(Boolean),
      dosage: '煎服',
      taboos: '遵医嘱',
      mainOrigin: item['产地'] || '',
      daoOrigin: '',
      harvest: '四季',
    }

    const provs = parseOriginToProvs(item['产地'] || '')
    newHerbProvinceMap.set(name, new Set(provs))
    provs.forEach(p => {
      if (!newProvinceHerbMap.has(p)) newProvinceHerbMap.set(p, new Set())
      newProvinceHerbMap.get(p)!.add(name)
    })
  }

  herbsMaster.value = newHerbsMaster
  herbProvinceMap.value = newHerbProvinceMap
  provinceHerbMap.value = newProvinceHerbMap
  daoHerbProvince.value = newDaoHerbProvince
}

function parseOriginToProvs(originStr: string): string[] {
  if (!originStr) return []
  const provinceAlias: Record<string, string[]> = {
    '东北': ['辽宁', '吉林', '黑龙江'],
    '华北': ['河北', '山西', '内蒙古'],
    '西北': ['陕西', '甘肃', '宁夏', '青海', '新疆']
  }
  const parts = originStr.split(/[、,，\s]+/).filter(p => p.trim())
  const provs: string[] = []
  for (const p of parts) {
    if (provinceAlias[p]) provs.push(...provinceAlias[p])
    else if (provinceList.value.includes(p)) provs.push(p)
  }
  return [...new Set(provs)]
}

function backupData() {
  originalHerbProvinceMap = new Map(herbProvinceMap.value)
  originalProvinceHerbMap = new Map(provinceHerbMap.value)
  originalHerbsMaster = JSON.parse(JSON.stringify(herbsMaster.value))
}

function updateStatsAndMapByCategory(category: string) {
  selectedSearchHerb.value = null
  searchKeyword.value = ''
  currentHighlightProvinces = []
  if (category === 'all') {
    if (originalHerbProvinceMap && originalProvinceHerbMap && originalHerbsMaster) {
      herbProvinceMap.value = new Map(originalHerbProvinceMap)
      provinceHerbMap.value = new Map(originalProvinceHerbMap)
      herbsMaster.value = JSON.parse(JSON.stringify(originalHerbsMaster))
    }
  } else {
    const herbsInCat = Object.keys(originalHerbsMaster!).filter(name => originalHerbsMaster![name].category === category)
    const newHerbProvinceMap = new Map<string, Set<string>>()
    const newProvinceHerbMap = new Map<string, Set<string>>()
    for (const herb of herbsInCat) {
      const provs = originalHerbProvinceMap!.get(herb)
      if (provs) {
        newHerbProvinceMap.set(herb, new Set(provs))
        for (const prov of provs) {
          if (!newProvinceHerbMap.has(prov)) newProvinceHerbMap.set(prov, new Set())
          newProvinceHerbMap.get(prov)!.add(herb)
        }
      }
    }
    herbProvinceMap.value = newHerbProvinceMap
    provinceHerbMap.value = newProvinceHerbMap
  }
  if (myChart && shortToFullMap) renderMap()
}

// ---------- 地图相关 ----------
const provinceCoords: Record<string, [number, number]> = {
  "北京": [116.40, 39.90], "天津": [117.20, 39.13], "上海": [121.48, 31.22], "重庆": [106.55, 29.56],
  "河北": [114.48, 38.03], "山西": [112.56, 37.87], "内蒙古": [111.65, 40.82], "辽宁": [123.38, 41.80],
  "吉林": [125.35, 43.88], "黑龙江": [126.63, 45.75], "江苏": [118.78, 32.04], "浙江": [120.15, 30.28],
  "安徽": [117.27, 31.86], "福建": [119.30, 26.08], "江西": [115.89, 28.68], "山东": [117.00, 36.65],
  "河南": [113.66, 34.76], "湖北": [114.30, 30.60], "湖南": [112.94, 28.23], "广东": [113.23, 23.16],
  "广西": [108.32, 22.84], "海南": [110.35, 20.02], "四川": [104.06, 30.67], "贵州": [106.71, 26.57],
  "云南": [102.73, 25.04], "西藏": [91.11, 29.97], "陕西": [108.95, 34.27], "甘肃": [103.73, 36.03],
  "青海": [101.74, 36.56], "宁夏": [106.27, 38.47], "新疆": [87.68, 43.77], "台湾": [121.52, 25.03],
  "香港": [114.17, 22.27], "澳门": [113.54, 22.19]
}

async function initMap() {
  if (!mapRef.value) return
  try {
    const geoJson = await loadChinaGeoJSON()
    shortToFullMap = buildNameMap(geoJson)
    echarts.registerMap('china', geoJson)
    await nextTick()
    if (!mapRef.value) return
    myChart = echarts.init(mapRef.value)
    renderMap()
    requestAnimationFrame(() => myChart?.resize())
    myChart.on('click', (params: any) => {
      if (params.componentSubType === 'map') {
        const full = params.name
        const short = Object.keys(shortToFullMap).find(k => shortToFullMap[k] === full)
        if (short && provinceHerbMap.value.has(short)) showProvinceHerbList(short)
      } else if (params.componentSubType === 'scatter') {
        highlightHerbOrigin(params.data.herbName)
      }
    })
    window.addEventListener('resize', () => myChart?.resize())
  } catch (err) {
    console.error('地图加载失败:', err)
  }
}

function buildNameMap(geoJson: any): Record<string, string> {
  const map: Record<string, string> = {}
  const names = geoJson.features.map((f: any) => f.properties.name)
  provinceList.value.forEach(short => {
    let full = names.find((n: string) => n === short || (n.startsWith(short) && /[省市自治區]/.test(n.slice(short.length))))
    if (full) map[short] = full
  })
  if (!map['广西']) map['广西'] = '广西壮族自治区'
  if (!map['内蒙古']) map['内蒙古'] = '内蒙古自治区'
  if (!map['新疆']) map['新疆'] = '新疆维吾尔自治区'
  if (!map['宁夏']) map['宁夏'] = '宁夏回族自治区'
  if (!map['西藏']) map['西藏'] = '西藏自治区'
  return map
}

let currentHighlightProvinces: Array<{ province: string; borderColor: string; fillColor: string }> = []

function renderMap() {
  if (!myChart || !shortToFullMap) return
  const isSingleHerbMode = selectedSearchHerb.value !== null
  const originProvs = isSingleHerbMode
    ? herbProvinceMap.value.get(selectedSearchHerb.value!) || new Set<string>()
    : null
  const heatData = []
  for (const prov of provinceList.value) {
    const val = isSingleHerbMode
      ? (originProvs!.has(prov) ? 1 : 0)
      : (provinceHerbMap.value.get(prov)?.size || 0)
    heatData.push({ name: shortToFullMap[prov] || prov, value: val })
  }
  const regions = []
  for (const [herb, prov] of Object.entries(daoHerbProvince.value)) {
    if (shortToFullMap[prov]) {
      regions.push({ name: shortToFullMap[prov], itemStyle: { borderColor: '#c9b07a', borderWidth: 2, areaColor: '#e8dcc4' } })
    }
  }
  for (const h of currentHighlightProvinces) {
    if (shortToFullMap[h.province]) {
      regions.push({
        name: shortToFullMap[h.province],
        itemStyle: { borderColor: h.borderColor, borderWidth: 3, areaColor: h.fillColor, shadowBlur: 8 }
      })
    }
  }
  const scatterData = []
  for (const [herb, provSet] of herbProvinceMap.value.entries()) {
    if (isSingleHerbMode && herb !== selectedSearchHerb.value) continue
    for (const prov of provSet) {
      const coord = provinceCoords[prov]
      if (coord) scatterData.push({ name: herb, province: prov, value: coord, herbName: herb })
    }
  }
  const maxVal = isSingleHerbMode ? 1 : Math.max(...heatData.map(d => d.value), 1)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.componentSubType === 'scatter') return `<strong>${params.data.herbName}</strong><br/>${herbsMaster.value[params.data.herbName]?.efficacy || '传统功效'}`
        if (isSingleHerbMode) {
          if (params.value) {
            const origin = herbsMaster.value[selectedSearchHerb.value!]?.mainOrigin || '暂无'
            return `<strong>${selectedSearchHerb.value}</strong><br/>产地: ${origin}`
          }
          return `${params.name}<br/>非该药材产区`
        }
        return `${params.name}<br/>🌿药材种类: ${params.value || 0}`
      }
    },
    visualMap: {
      min: 0, max: maxVal, calculable: true,
      inRange: { color: ['#e6f3e0', '#a8d08d', '#6ab04c', '#2e7d32'] },
      left: 'left', bottom: 20, seriesIndex: 0
    },
    series: [
      {
        name: '药材丰度', type: 'map', map: 'china', roam: true, selectedMode: false,
        itemStyle: { borderColor: '#b8cfae', borderWidth: 0.8, areaColor: '#f1f8ec' },
        emphasis: { label: { show: true }, itemStyle: { areaColor: '#c9e6a8' } },
        data: heatData,
        regions
      },
      {
        type: 'scatter', coordinateSystem: 'geo', data: scatterData, symbolSize: 6,
        itemStyle: { color: '#4a9d66', borderColor: '#fff', borderWidth: 1 },
        emphasis: { scale: 1.2 }, zlevel: 2, animation: true
      }
    ]
  }
  myChart.setOption(option, true)
}

function highlightCompareProvinces(herb1: string, herb2: string) {
  const provs1 = Array.from(herbProvinceMap.value.get(herb1) || [])
  const provs2 = Array.from(herbProvinceMap.value.get(herb2) || [])
  const newHighlights: Array<{ province: string; borderColor: string; fillColor: string }> = []
  provs1.forEach(p => {
    newHighlights.push({ province: p, borderColor: '#3d7a62', fillColor: '#c5e6c8' })
  })
  provs2.forEach(p => {
    const existing = newHighlights.find(h => h.province === p)
    if (existing) {
      existing.borderColor = '#2e7d32'
      existing.fillColor = '#a8d08d'
    } else {
      newHighlights.push({ province: p, borderColor: '#a8d08d', fillColor: '#e8f2e4' })
    }
  })
  currentHighlightProvinces = newHighlights
  if (myChart && shortToFullMap) renderMap()
}

// ---------- 搜索 ----------
const herbSearchIndex = computed(() => {
  const idx = []
  for (const [name, info] of Object.entries(herbsMaster.value)) {
    const fullPinyin = info.pinyin || name.toLowerCase()
    const firstLetters = info.short || fullPinyin.split('').filter(c => /[a-z]/i.test(c)).map(c => c[0]).join('')
    idx.push({ name, fullPinyin, firstLetters, efficacyTags: info.efficacyTags || [] })
  }
  return idx
})

function searchHerbsAndProvinces(keyword: string) {
  const low = keyword.toLowerCase().trim()
  if (!low) return { herbs: [], provinces: [] }
  const herbScores = new Map()
  for (const item of herbSearchIndex.value) {
    let score = 0, matchDesc = ''
    if (item.name === low) { score = 100; matchDesc = '精确名称' }
    else if (item.name.includes(low)) { score = 90; matchDesc = '名称包含' }
    else if (item.firstLetters === low) { score = 80; matchDesc = '拼音首字母精确' }
    else if (item.firstLetters && item.firstLetters.startsWith(low)) { score = 70; matchDesc = '拼音首字母前缀' }
    else if (item.fullPinyin.includes(low)) { score = 60; matchDesc = '拼音包含' }
    else {
      const matchedTag = item.efficacyTags.find((tag: string) => tag.includes(low))
      if (matchedTag) { score = 40; matchDesc = `功效:${matchedTag}` }
    }
    if (score > 0 && !herbScores.has(item.name)) herbScores.set(item.name, { score, matchDesc })
  }
  const herbs = Array.from(herbScores.entries()).sort((a, b) => b[1].score - a[1].score).map(([name, data]) => ({ name, desc: data.matchDesc, type: 'herb' }))
  const provinces = provinceList.value.filter(p => p.includes(low)).map(p => ({ name: p, desc: '省份', type: 'province' }))
  return { herbs, provinces }
}

function onSearchInput() {
  const kw = searchKeyword.value
  if (!kw.trim()) { showDropdown.value = false; return }
  const { herbs, provinces } = searchHerbsAndProvinces(kw)
  const sections = []
  if (herbs.length) sections.push({ title: '🌿 药材', items: herbs })
  if (provinces.length) sections.push({ title: '🗺️ 省份', items: provinces })
  dropdownSections.value = sections
  showDropdown.value = true
}
function onSearchFocus() {
  if (searchKeyword.value.trim()) onSearchInput()
}
function clearSearch() {
  searchKeyword.value = ''
  showDropdown.value = false
  selectedSearchHerb.value = null
  currentHighlightProvinces = []
  if (myChart && shortToFullMap) renderMap()
}
function closeDropdown() { showDropdown.value = false }
function onSelectDropdownItem(item: any) {
  searchKeyword.value = item.name
  showDropdown.value = false
  if (item.type === 'herb') highlightHerbOrigin(item.name)
  else if (item.type === 'province') showProvinceHerbList(item.name)
}
function highlightText(text: string, keyword: string) {
  if (!keyword) return text
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// ---------- 交互函数 ----------
function setCategory(cat: string) {
  currentCategory.value = cat
  updateStatsAndMapByCategory(cat)
}
function toggleNightMode() {
  isNightMode.value = !isNightMode.value
  document.body.classList.toggle('night', isNightMode.value)
}
function locateMe() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      myChart?.setOption({ geo: { center: [pos.coords.longitude, pos.coords.latitude], zoom: 6 } })
    })
  }
}
function focusSichuan() {
  myChart?.setOption({ geo: { center: [104.06, 30.67], zoom: 5.5 } })
}
function toggleComparePanel() {
  compareCollapsed.value = !compareCollapsed.value
}

function highlightHerbOrigin(herbName: string) {
  if (!herbsMaster.value[herbName]) return
  selectedSearchHerb.value = herbName
  searchKeyword.value = herbName
  compareHerb1.value = ''
  compareHerb2.value = ''
  const provs = Array.from(herbProvinceMap.value.get(herbName) || [])
  currentHighlightProvinces = provs.map(p => ({
    province: p,
    borderColor: '#2e7d32',
    fillColor: '#a8d08d',
  }))
  if (myChart && shortToFullMap) renderMap()
}

function selectHerbFromProvince(herbName: string) {
  closeProvinceModal()
  highlightHerbOrigin(herbName)
}

function showProvinceHerbList(prov: string) {
  currentProvince.value = prov
  provinceSearchKeyword.value = ''
  provinceModalVisible.value = true
}
function closeProvinceModal() { provinceModalVisible.value = false }
function openTipModal() { tipKeyword.value = ''; tipHerb.value = null; tipModalVisible.value = true }
function closeTipModal() { tipModalVisible.value = false }
function searchTip() { tipHerb.value = herbsMaster.value[tipKeyword.value] || null }

// ---------- 生命周期 ----------
loadDataFromJson()
backupData()

onMounted(async () => {
  const names = allHerbNames.value
  if (names.length >= 2) {
    compareHerb1.value = names[0]
    compareHerb2.value = names[1]
  }
  await initMap()
  const herbFromQuery = route.query.herb
  if (typeof herbFromQuery === 'string' && herbFromQuery.trim()) {
    highlightHerbOrigin(herbFromQuery.trim())
  } else if (compareHerb1.value && compareHerb2.value && compareHerb1.value !== compareHerb2.value) {
    highlightCompareProvinces(compareHerb1.value, compareHerb2.value)
  }
})

// 监听对比变化
watch([compareHerb1, compareHerb2], ([h1, h2]) => {
  if (h1 && h2 && h1 !== h2) {
    selectedSearchHerb.value = null
    searchKeyword.value = ''
    highlightCompareProvinces(h1, h2)
  } else {
    currentHighlightProvinces = []
    if (myChart && shortToFullMap) renderMap()
  }
})

// ---------- 指令 ----------
const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: any) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}
</script>

<style>
/* ===== 全局样式（紧凑头部 + 深色主题） ===== */
* { margin: 0; padding: 0; box-sizing: border-box; }

.herb-map-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #0a1f1a;
  color: #e8f5e9;
  transition: background 0.2s;
}
body.night .herb-map-app {
  background: #05120e;
}

.app-header {
  background: linear-gradient(135deg, #1a3d32 0%, #2a5a4a 100%);
  padding: 4px 12px 6px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  z-index: 10;
  flex-shrink: 0;
}
body.night .app-header {
  background: #0e2a1e;
}

.top-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.logo-area { display: flex; align-items: center; gap: 4px; }
.logo-icon { font-size: 18px; color: #b8d9c4; }
.title {
  font-family: "思源宋体", "KaiTi", serif;
  font-size: 16px;
  font-weight: 500;
  color: #e8f5e9;
}

.search-wrapper {
  position: relative;
  width: 260px;
}
.search-box {
  display: flex;
  background: rgba(255,255,255,0.15);
  border-radius: 40px;
  padding: 2px 12px;
  align-items: center;
  backdrop-filter: blur(4px);
}
.search-box input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 12px;
  background: transparent;
  color: #e8f5e9;
}
.search-box input::placeholder { color: #a0c0b0; }
.search-box i { color: #b8d9c4; font-size: 12px; margin-right: 4px; }
.search-clear {
  background: none;
  border: none;
  color: #a0c0b0;
  cursor: pointer;
  font-size: 12px;
  padding: 0 2px;
  display: none;
}
.search-clear:hover { color: #e8f5e9; }

.search-dropdown {
  position: absolute;
  top: 34px;
  left: 0;
  right: 0;
  background: #1a3d32;
  border-radius: 16px;
  max-height: 260px;
  overflow-y: auto;
  z-index: 100;
  display: none;
  box-shadow: 0 6px 16px rgba(0,0,0,0.5);
}
.search-dropdown.show { display: block; }
body.night .search-dropdown { background: #0e2a1e; }
.dropdown-section { margin: 4px 0; }
.dropdown-section-title {
  font-size: 0.65rem;
  padding: 4px 12px;
  background: #2a5a4a;
  color: #b8d9c4;
  border-radius: 16px;
  margin: 0 8px;
}
.dropdown-item {
  padding: 6px 16px;
  cursor: pointer;
  border-bottom: 1px solid #2a5a4a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #e8f5e9;
}
.dropdown-item:hover { background: #2a5a4a; }
.dropdown-item mark { background: var(--herb-gold); color: var(--herb-forest); border-radius: 4px; padding: 0 2px; }
.no-result { padding: 16px; text-align: center; color: #a0c0b0; }

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.filter-btn {
  background: rgba(255,255,240,0.15);
  border: none;
  border-radius: 30px;
  padding: 2px 10px;
  color: #d0e8d8;
  cursor: pointer;
  font-size: 0.7rem;
  transition: 0.1s;
}
.filter-btn.active {
  background: var(--herb-gold);
  color: var(--herb-forest);
  font-weight: bold;
}
.filter-btn:hover { background: rgba(255,255,240,0.3); }

.stats-row {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  justify-content: center;
}
.stats-card {
  background: rgba(255,255,245,0.12);
  border-radius: 30px;
  padding: 1px 12px;
  color: #d0e8d8;
  font-size: 0.7rem;
}
.stats-card strong { color: #e8f5e9; }
.stats-card--highlight {
  background: rgba(168, 208, 141, 0.35);
  color: #e8f5e9;
}

.herb-map-app .map-container {
  flex: 1;
  padding: 4px 8px 8px 8px;
  position: relative;
  overflow: hidden;
}
#chinaMap {
  width: 100%;
  height: 100%;
  background: #f9faf8;
  border-radius: 16px;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
}
body.night #chinaMap { background: #1a2a1a; }

.map-copyright {
  position: absolute;
  bottom: 12px;
  right: 20px;
  background: rgba(0,0,0,0.6);
  color: #ccc;
  padding: 1px 8px;
  border-radius: 16px;
  font-size: 8px;
  z-index: 15;
}

.toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 20;
}
.tool-btn {
  background: rgba(255,255,255,0.85);
  border: none;
  border-radius: 30px;
  padding: 4px 10px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  font-size: 0.65rem;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #1a3d32;
}
body.night .tool-btn { background: #2a5a4a; color: #e8f5e9; }
.tool-btn:hover { background: #2c5f2d; color: white; }

/* ===== 对比面板（左上角） ===== */
.compare-panel-float {
  position: absolute;
  top: 20px;        /* 改为顶部定位 */
  left: 20px;
  background: rgba(26, 61, 50, 0.92);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  padding: 10px 14px;
  width: 250px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  z-index: 25;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
body.night .compare-panel-float {
  background: rgba(10, 30, 22, 0.92);
  border-color: #2a5a4a;
}
.compare-title {
  font-weight: bold;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #b8d9c4;
}
.compare-title i { cursor: pointer; color: #b8d9c4; }
.compare-select {
  width: 100%;
  margin-bottom: 4px;
  padding: 4px 6px;
  border-radius: 16px;
  border: 1px solid #2a5a4a;
  background: #1a3d32;
  color: #e8f5e9;
  font-size: 0.75rem;
}
.compare-detail {
  font-size: 0.7rem;
  line-height: 1.3;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed #2a5a4a;
  color: #c0d8c8;
}
.compare-detail-item strong { color: var(--herb-gold); }
body.night .compare-detail-item strong { color: var(--herb-gold); }

/* 模态框通用 */
.modal-mask {
  position: fixed;
  top:0; left:0; width:100%; height:100%;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  visibility: hidden;
  opacity: 0;
  transition: 0.2s;
}
.modal-mask.active { visibility: visible; opacity: 1; }
.modal-container {
  background: #1a3d32;
  border-radius: 32px;
  max-width: 720px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 25px 40px rgba(0,0,0,0.5);
  animation: fadeUp 0.2s ease;
  color: #e8f5e9;
}
@keyframes fadeUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #2a5a4a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: #1a3d32;
  z-index: 1;
}
.modal-header h2 { color: #b8d9c4; }
.close-modal {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #a0c0b0;
  transition: 0.1s;
}
.close-modal:hover { color: #e8f5e9; }
.modal-body { padding: 20px 24px; }

.herb-list {
  max-height: 280px;
  overflow-y: auto;
  margin: 12px 0;
  border: 1px solid #2a5a4a;
  border-radius: 20px;
  padding: 8px 12px;
  background: #1a3d32;
}
.herb-item {
  padding: 10px 8px;
  border-bottom: 1px dashed #2a5a4a;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px;
  transition: 0.1s;
  color: #c0d8c8;
}
.herb-item:hover { background: #2a5a4a; padding-left: 12px; }
.badge {
  background: var(--herb-gold);
  color: var(--herb-forest);
  border-radius: 30px;
  padding: 2px 8px;
  font-size: 0.7rem;
}
.province-search, .tip-input {
  width: 100%;
  padding: 8px;
  margin-bottom: 12px;
  border-radius: 30px;
  border: 1px solid #2a5a4a;
  background: #1a3d32;
  color: #e8f5e9;
}
.province-search::placeholder { color: #a0c0b0; }

@media (max-width: 700px) {
  .title { font-size: 14px; }
  .filter-btn { padding: 1px 8px; font-size: 0.6rem; }
  .search-wrapper { width: 100%; }
  .top-bar { flex-direction: column; align-items: stretch; }
  .toolbar { top: auto; bottom: 16px; right: 8px; flex-direction: row; flex-wrap: wrap; justify-content: center; gap: 4px; }
  .tool-btn { padding: 3px 8px; font-size: 0.6rem; }
  .compare-panel-float { width: calc(100% - 16px); left: 8px; top: 8px; } /* 移动端也保持在左上角 */
  .modal-container { width: calc(100% - 16px); border-radius: 16px; }
}
</style>