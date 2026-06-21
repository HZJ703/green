<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import * as echarts from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'
import { toForceGraphData, toSankeyData, type HerbData } from '../utils/sankeyDataProcessor'

interface Props {
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: '功效聚类与关联网络',
})

const emit = defineEmits<{
  (e: 'node-clicked', name: string): void
}>()

const forceChartRef = ref<HTMLDivElement>()
const sankeyChartRef = ref<HTMLDivElement>()
let forceChartInstance: ECharts | null = null
let sankeyChartInstance: ECharts | null = null

// 力导向图节点 / 连线 / 分类缓存——给搜索 API、详情面板复用
let forceNodesCache: any[] = []
let forceLinksCache: any[] = []
let forceCategoriesCache: Array<{ name: string; itemStyle: { color: string } }> = []

// 搜索高亮状态：当前正在被搜索高亮的节点名 + 搜索前的 selectedNode 快照
let searchHighlightedName: string | null = null
let preSearchSelectedNode: {
  name: string
  categoryName: string
  data: any
  relatedNodes: string[]
} | null = null

const selectedNode = ref<{
  name: string
  categoryName: string
  data: any
  relatedNodes: string[]
} | null>(null)
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
  // —— 增量补充：新增的产地分组与「热 / 凉」药性边 ——
  { source: '河北/陕西', target: '寒', value: 6 },
  { source: '河北/陕西', target: '微寒', value: 4 },
  { source: '河北/陕西', target: '微温', value: 2 },
  { source: '吉林/辽宁', target: '温', value: 2 },
  { source: '宁夏/青海', target: '平', value: 2 },
  { source: '山东/河南', target: '凉', value: 2 },
  { source: '浙江/安徽', target: '凉', value: 2 },
  { source: '广东/广西', target: '热', value: 2 },
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
  // —— 增量补充：新增 温→肺 / 热→脾 / 凉→脾 / 凉→肺 / 微寒→心 / 平→肝 边 ——
  { source: '温', target: '肺', value: 2 },
  { source: '热', target: '脾', value: 2 },
  { source: '凉', target: '脾', value: 2 },
  { source: '凉', target: '肺', value: 2 },
  { source: '微寒', target: '心', value: 4 },
  { source: '平', target: '肝', value: 4 },
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
  // —— 增量补充：新增 功效关键词（补血滋阴 / 滋阴润燥 / 平肝明目 / 清热生津 / 止咳化痰 / 理气止痛 / 利水渗湿 / 安神助眠 / 祛风除湿）边 ——
  { source: '脾', target: '活血祛瘀', value: 2 },
  { source: '肺', target: '补血滋阴', value: 2 },
  { source: '肺', target: '滋阴润燥', value: 4 },
  { source: '肺', target: '平肝明目', value: 4 },
  { source: '肺', target: '温阳散寒', value: 2 },
  { source: '脾', target: '清热生津', value: 2 },
  { source: '肺', target: '止咳化痰', value: 4 },
  { source: '脾', target: '利水渗湿', value: 2 },
  { source: '肝', target: '理气止痛', value: 2 },
  { source: '肝', target: '补血滋阴', value: 2 },
  { source: '肝', target: '滋阴润燥', value: 2 },
  { source: '脾', target: '理气止痛', value: 4 },
  { source: '肝', target: '清热解毒', value: 2 },
  { source: '脾', target: '止咳化痰', value: 2 },
  { source: '脾', target: '祛风除湿', value: 2 },
  { source: '肝', target: '温阳散寒', value: 2 },
  { source: '心', target: '安神助眠', value: 2 },
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
  // —— 以下为补充的中药材数据 ——
  { name: '莪术', nature: '温', meridian: '脾', efficacy: '活血祛瘀', origin: '广东/广西' },
  { name: '阿胶', nature: '平', meridian: '肺', efficacy: '补血滋阴', origin: '山东/河南' },
  { name: '沙参', nature: '微寒', meridian: '肺', efficacy: '滋阴润燥', origin: '四川' },
  { name: '菊花', nature: '微寒', meridian: '肺', efficacy: '平肝明目', origin: '浙江/安徽' },
  { name: '金银花', nature: '寒', meridian: '肺', efficacy: '清热解毒', origin: '山东/河南' },
  { name: '生姜', nature: '温', meridian: '肺', efficacy: '温阳散寒', origin: '四川' },
  { name: '肉桂', nature: '热', meridian: '脾', efficacy: '温阳散寒', origin: '广东/广西' },
  { name: '葛根', nature: '凉', meridian: '脾', efficacy: '清热生津', origin: '山东/河南' },
  { name: '杏仁', nature: '微温', meridian: '肺', efficacy: '止咳化痰', origin: '河北/陕西' },
  { name: '薏苡仁', nature: '微寒', meridian: '脾', efficacy: '利水渗湿', origin: '浙江/安徽' },
  { name: '连翘', nature: '微寒', meridian: '心', efficacy: '清热解毒', origin: '河北/陕西' },
  { name: '桔梗', nature: '平', meridian: '肺', efficacy: '止咳化痰', origin: '浙江/安徽' },
  { name: '柴胡', nature: '微寒', meridian: '肝', efficacy: '理气止痛', origin: '河北/陕西' },
  { name: '白芍', nature: '微寒', meridian: '肝', efficacy: '补血滋阴', origin: '浙江/安徽' },
  { name: '枸杞子', nature: '平', meridian: '肝', efficacy: '滋阴润燥', origin: '宁夏/青海' },
  { name: '延胡索', nature: '温', meridian: '脾', efficacy: '理气止痛', origin: '浙江/安徽' },
  { name: '川芎', nature: '温', meridian: '肝', efficacy: '活血祛瘀', origin: '四川' },
  { name: '红花', nature: '温', meridian: '肝', efficacy: '活血祛瘀', origin: '四川' },
  { name: '麦冬', nature: '微寒', meridian: '肺', efficacy: '滋阴润燥', origin: '四川' },
  { name: '薄荷', nature: '凉', meridian: '肺', efficacy: '平肝明目', origin: '浙江/安徽' },
  { name: '板蓝根', nature: '寒', meridian: '心', efficacy: '清热解毒', origin: '河北/陕西' },
  { name: '蒲公英', nature: '寒', meridian: '肝', efficacy: '清热解毒', origin: '河北/陕西' },
  { name: '知母', nature: '寒', meridian: '肺', efficacy: '清热泻火', origin: '河北/陕西' },
  { name: '半夏', nature: '温', meridian: '脾', efficacy: '止咳化痰', origin: '四川' },
  { name: '陈皮', nature: '温', meridian: '脾', efficacy: '理气止痛', origin: '广东/广西' },
  { name: '苍术', nature: '温', meridian: '脾', efficacy: '祛风除湿', origin: '浙江/安徽' },
  { name: '鹿茸', nature: '温', meridian: '肝', efficacy: '温阳散寒', origin: '吉林/辽宁' },
  { name: '百合', nature: '微寒', meridian: '心', efficacy: '安神助眠', origin: '浙江/安徽' },
  { name: '牛膝', nature: '平', meridian: '肝', efficacy: '活血祛瘀', origin: '山东/河南' },
  { name: '花椒', nature: '温', meridian: '脾', efficacy: '温阳散寒', origin: '四川' },
]

const CATEGORY_DISPLAY_NAME: Record<string, string> = {
  草药: '中药材',
  归经: '归经（脏腑）',
  产地: '药材基原',
  功效: '功效关键词',
  药性: '药性',
}

// 草木国风扩展色板：绿 · 橄榄 · 青绿 · 棕黄 · 药笺金（相邻色相近、层级内可区分）
const HERBAL_COLOR_PALETTE = [
  '#2e7d32', '#43a047', '#66bb6a', '#81c784', '#a5d6a7',
  '#527e72', '#4a8478', '#5a8f7b', '#6aa494', '#468a82',
  '#6b8e4e', '#8fbc6b', '#9ccc65', '#7cb342',
  '#c9a059', '#b89248', '#a08050', '#8b7355', '#9a7b4f', '#d4c4a0',
]

// 桑基图节点配色：绿系 + 棕黄系，同层内色相/明度拉开
const SANKEY_NODE_COLOR_MAP: Record<string, string> = {
  // 产地
  四川: '#4a9d66',
  '广东/广西': '#c9a059',
  '山东/河南': '#8b7355',
  '内蒙古/甘肃': '#6b8e4e',
  '浙江/安徽': '#5a8f7b',
  '河北/陕西': '#a08050',
  '吉林/辽宁': '#527e72',
  '宁夏/青海': '#b89248',
  // 药性（寒凉偏绿、温热偏棕黄）
  寒: '#2e6b52',
  微寒: '#52a068',
  凉: '#7ec49a',
  平: '#9ccc65',
  微温: '#d4c4a0',
  温: '#c9a059',
  热: '#a07040',
  // 归经
  肺: '#5cb87a',
  肝: '#6b8e4e',
  心: '#c9a059',
  脾: '#8b7355',
  肾: '#2f6645',
  // 功效
  清热泻火: '#468a82',
  清热解毒: '#5fa494',
  活血祛瘀: '#9a7b4f',
  补气健脾: '#6fb07f',
  健脾益气: '#7cb342',
  温阳散寒: '#b89248',
  补血滋阴: '#7ec49a',
  滋阴润燥: '#527e72',
  平肝明目: '#4e8f6a',
  清热生津: '#66a67a',
  止咳化痰: '#a08050',
  理气止痛: '#3d7a62',
  利水渗湿: '#6aa494',
  安神助眠: '#d4c4a0',
  祛风除湿: '#4a8478',
}

function resolveHerbalColor(name: string): string {
  if (SANKEY_NODE_COLOR_MAP[name]) return SANKEY_NODE_COLOR_MAP[name]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return HERBAL_COLOR_PALETTE[hash % HERBAL_COLOR_PALETTE.length]
}

const SANKEY_LEGEND = [
  { name: '产地', color: '#5cb87a' },
  { name: '药性', color: '#c9a059' },
  { name: '归经', color: '#527e72' },
  { name: '功效', color: '#8b7355' },
]

// 力导向图分类基色（图例 + 节点填充统一使用：节点按所属分类着该分类主题色）
const FORCE_CATEGORY_COLORS = {
  产地: '#5cb87a',
  药性: '#c9a059',
  归经: '#527e72',
  功效: '#8b7355',
  草药: '#a8d8b9',
} as const

// 桑基图节点的分类归属（按层级自动归类，用于跨图联动校验）
const SANKEY_CATEGORY_OF: Record<string, string> = (() => {
  const m: Record<string, string> = {}
  ORIGIN_NATURE_DATA.forEach((d) => {
    m[d.source] = '产地'
    m[d.target] = '药性'
  })
  NATURE_MERIDIAN_DATA.forEach((d) => {
    m[d.source] = '药性'
    m[d.target] = '归经'
  })
  MERIDIAN_EFFICACY_DATA.forEach((d) => {
    m[d.source] = '归经'
    m[d.target] = '功效'
  })
  return m
})()

// 两张图共有的可联动分类（药性 / 归经 / 功效 / 产地）；草药仅力导向图独有，不参与联动
const CROSS_HIGHLIGHT_CATEGORIES = new Set(['产地', '药性', '归经', '功效'])

// 力导向图节点名 → 分类名 的实时映射（initForceChart 时填充，bindCrossHighlight 时校验）
let forceCategoryByName: Record<string, string> = {}

// === 智能建议·本地静态数据集 ===
// 键：「分类|节点名」；值：围绕配伍方向 / 相似药材 / 常见应用场景 三维生成的本地预生成建议
// 零网络请求、零外部依赖、可离线运行；与节点分类规则完全对齐，未命中节点回落到兜底文案
const SMART_SUGGESTION_MAP: Record<string, string> = {
  // —— 中药材 ——
  '草药|黄芪':
    '黄芪配伍党参、白术补气升阳，相似药材有人参、太子参，常用于气虚乏力、脾胃虚弱的日常调理。',
  '草药|人参':
    '人参配伍黄芪、白术大补元气，相似药材有党参、西洋参，常用于体虚欲脱、脾肺气虚的辨证调理。',
  '草药|白术':
    '白术配伍茯苓、党参健脾燥湿，相似药材有苍术、山药，常用于脾虚食少、湿盛泄泻的日常调理。',
  '草药|茯苓':
    '茯苓可配伍白术、山药健脾祛湿，相似药材有薏苡仁、猪苓，常用于水肿尿少、脾虚食少的日常调理。',
  '草药|黄连':
    '黄连配伍黄芩、栀子清热燥湿，相似药材有黄柏、苦参，常用于湿热痞满、心火亢盛的辨证调理。',
  '草药|黄芩':
    '黄芩配伍黄连、栀子清热泻火，相似药材有龙胆草、知母，常用于肺热咳嗽、湿热黄疸的辨证调理。',
  '草药|大黄':
    '大黄配伍芒硝、枳实泻下攻积，相似药材有番泻叶、芦荟，常用于实热便秘、瘀血经闭的辨证调理。',
  '草药|桂枝':
    '桂枝配伍白芍、生姜调和营卫，相似药材有麻黄、紫苏，常用于风寒感冒、关节痹痛的辨证调理。',
  '草药|干姜':
    '干姜配伍附子、白术温中散寒，相似药材有肉桂、吴茱萸，常用于脘腹冷痛、寒饮咳喘的辨证调理。',
  '草药|甘草':
    '甘草配伍诸药调和药性，相似药材有大枣、饴糖，常用于药性调和、脾胃虚弱、咳嗽痰多的日常调理。',
  '草药|红枣':
    '红枣配伍黄芪、当归补益气血，相似药材有桂圆、龙眼肉，常用于气血两虚、心神不宁的日常调理。',
  '草药|当归':
    '当归配伍川芎、白芍养血活血，相似药材有熟地、阿胶，常用于血虚萎黄、月经不调的辨证调理。',
  '草药|麻黄':
    '麻黄配伍桂枝、杏仁发汗平喘，相似药材有紫苏、生姜，常用于风寒感冒、咳喘水肿的辨证调理。',
  '草药|生地':
    '生地配伍玄参、麦冬清热凉血，相似药材有玄参、丹皮，常用于热病伤阴、阴虚发热的辨证调理。',
  '草药|丹参':
    '丹参配伍川芎、红花活血祛瘀，相似药材有当归、赤芍，常用于胸痹心痛、月经不调的辨证调理。',
  '草药|莪术':
    '莪术配伍三棱、青皮破血行气，相似药材有三棱、郁金，常用于癥瘕积聚、食积胀痛的辨证调理。',
  '草药|阿胶':
    '阿胶配伍熟地、当归补血滋阴，相似药材有龟板胶、鹿角胶，常用于血虚萎黄、虚劳咳血的日常调理。',
  '草药|沙参':
    '沙参配伍麦冬、玉竹养阴润肺，相似药材有玉竹、百合，常用于肺燥干咳、阴虚劳嗽的日常调理。',
  '草药|菊花':
    '菊花配伍桑叶、决明子平肝明目，相似药材有桑叶、薄荷，常用于风热感冒、目赤眩晕的日常调理。',
  '草药|金银花':
    '金银花配伍连翘、薄荷疏散风热，相似药材有蒲公英、板蓝根，常用于温病发热、痈肿疮毒的辨证调理。',
  '草药|生姜':
    '生姜配伍紫苏、葱白解表散寒，相似药材有干姜、紫苏叶，常用于风寒感冒、胃寒呕吐的日常调理。',
  '草药|肉桂':
    '肉桂配伍附子、干姜温阳散寒，相似药材有桂枝、吴茱萸，常用于阳虚怕冷、腰膝冷痛的辨证调理。',
  '草药|葛根':
    '葛根配伍升麻、柴胡解肌透疹，相似药材有升麻、桑叶，常用于外感发热、口渴泄泻的日常调理。',
  '草药|杏仁':
    '杏仁配伍桔梗、紫苏止咳平喘，相似药材有桔梗、紫苏子，常用于咳嗽气喘、肠燥便秘的辨证调理。',
  '草药|薏苡仁':
    '薏苡仁配伍茯苓、白术利水健脾，相似药材有茯苓、赤小豆，常用于水肿脚气、湿痹拘挛的日常调理。',
  '草药|连翘':
    '连翘配伍金银花、薄荷清热解毒，相似药材有金银花、板蓝根，常用于温病初起、痈肿疮毒的辨证调理。',
  '草药|桔梗':
    '桔梗配伍甘草、杏仁宣肺利咽，相似药材有杏仁、紫苏子，常用于咳嗽痰多、咽痛音哑的辨证调理。',
  '草药|柴胡':
    '柴胡配伍黄芩、白芍疏肝解郁，相似药材有香附、郁金，常用于寒热往来、胸胁胀痛的辨证调理。',
  '草药|白芍':
    '白芍配伍当归、川芎养血柔肝，相似药材有当归、熟地，常用于月经不调、胁痛腹痛的辨证调理。',
  '草药|枸杞子':
    '枸杞子配伍菊花、地黄滋补肝肾，相似药材有女贞子、桑椹，常用于腰膝酸软、目暗不明的日常调理。',
  '草药|延胡索':
    '延胡索配伍川楝子、香附行气止痛，相似药材有香附、川芎，常用于胸胁脘腹疼痛、经闭痛经的辨证调理。',
  '草药|川芎':
    '川芎配伍当归、白芍活血行气，相似药材有丹参、红花，常用于头痛眩晕、月经不调的辨证调理。',
  '草药|红花':
    '红花配伍桃仁、当归活血通经，相似药材有桃仁、丹参，常用于经闭痛经、瘀血腹痛的辨证调理。',
  '草药|麦冬':
    '麦冬配伍沙参、玉竹养阴润肺，相似药材有沙参、玉竹，常用于肺燥干咳、津伤口渴的日常调理。',
  '草药|薄荷':
    '薄荷配伍菊花、桑叶疏散风热，相似药材有桑叶、菊花，常用于风热感冒、头痛目赤的日常调理。',
  '草药|板蓝根':
    '板蓝根配伍金银花、连翘清热解毒，相似药材有大青叶、贯众，常用于温毒发斑、咽喉肿痛的辨证调理。',
  '草药|蒲公英':
    '蒲公英配伍金银花、紫花地丁清热解毒，相似药材有金银花、连翘，常用于痈肿疔疮、湿热黄疸的辨证调理。',
  '草药|知母':
    '知母配伍石膏、黄柏清热泻火，相似药材有黄柏、石膏，常用于高热烦渴、骨蒸潮热的辨证调理。',
  '草药|半夏':
    '半夏配伍生姜、陈皮燥湿化痰，相似药材有南星、白芥子，常用于痰多咳嗽、呕吐反胃的辨证调理。',
  '草药|陈皮':
    '陈皮配伍半夏、茯苓理气化痰，相似药材有青皮、枳壳，常用于脘腹胀满、咳嗽痰多的日常调理。',
  '草药|苍术':
    '苍术配伍厚朴、陈皮燥湿运脾，相似药材有白术、厚朴，常用于湿阻中焦、风湿痹痛的辨证调理。',
  '草药|鹿茸':
    '鹿茸配伍人参、肉苁蓉补肾壮阳，相似药材有淫羊藿、巴戟天，常用于阳虚畏寒、精血不足的辨证调理。',
  '草药|百合':
    '百合配伍麦冬、酸枣仁养阴安神，相似药材有麦冬、酸枣仁，常用于阴虚燥咳、失眠多梦的日常调理。',
  '草药|牛膝':
    '牛膝配伍杜仲、桑寄生补益肝肾，相似药材有杜仲、续断，常用于腰膝酸痛、筋骨无力的辨证调理。',
  '草药|花椒':
    '花椒配伍干姜、附子温中散寒，相似药材有吴茱萸、干姜，常用于脘腹冷痛、寒湿吐泻的日常调理。',

  // —— 归经（脏腑） ——
  '归经|肺':
    '归肺经药材多治咳喘、解表，可配伍宣肺化痰类药物，相似归经为大肠经，常用于呼吸系统的日常调护。',
  '归经|肝':
    '归肝经药材多用于疏肝、明目、活血，可配伍柔肝养血类药物，常用于情志不畅、目疾瘀血的辨证调护。',
  '归经|心':
    '归心经药材多用于安神、清心、活血，可配伍养心安神类药物，常用于心烦失眠、心悸怔忡的日常调护。',
  '归经|脾':
    '归脾经药材多用于补气、健脾、化湿，可配伍益气养胃类药物，常用于食少便溏、倦怠乏力的日常调护。',
  '归经|肾':
    '归肾经药材多用于温阳、滋阴、固精，可配伍补肝肾类药物，常用于腰膝酸软、阳虚畏寒的辨证调护。',

  // —— 功效关键词 ——
  '功效|清热泻火':
    '清热泻火类常配伍知母、石膏增强清泻，相似类为清热解毒，常用于高热烦渴、肺胃实火的辨证调护。',
  '功效|清热解毒':
    '清热解毒类常配伍金银花、连翘协同抗毒，相似类为清热泻火，常用于痈肿疮毒、咽喉肿痛的辨证调护。',
  '功效|活血祛瘀':
    '活血祛瘀类常配伍当归、川芎活血通经，相似类为理气止痛，常用于瘀血经闭、跌打损伤的辨证调护。',
  '功效|补气健脾':
    '补气健脾类常配伍黄芪、白术益气，相似类为补血滋阴，常用于气虚乏力、食少便溏的日常调护。',
  '功效|温阳散寒':
    '温阳散寒类常配伍附子、干姜温阳助火，相似类为补气健脾，常用于阳虚畏寒、脘腹冷痛的辨证调护。',
  '功效|补血滋阴':
    '补血滋阴类常配伍当归、熟地补益阴血，相似类为滋阴润燥，常用于血虚萎黄、阴虚发热的日常调护。',
  '功效|滋阴润燥':
    '滋阴润燥类常配伍沙参、麦冬养阴生津，相似类为补血滋阴，常用于肺燥干咳、咽干口渴的日常调护。',
  '功效|平肝明目':
    '平肝明目类常配伍菊花、桑叶清肝明目，相似类为清热泻火，常用于头痛眩晕、目赤昏花的日常调护。',
  '功效|清热生津':
    '清热生津类常配伍葛根、芦根生津止渴，相似类为滋阴润燥，常用于热病津伤、消渴口干的辨证调护。',
  '功效|止咳化痰':
    '止咳化痰类常配伍半夏、陈皮燥湿化痰，相似类为理气止痛，常用于咳嗽痰多、胸闷喘息的日常调护。',
  '功效|理气止痛':
    '理气止痛类常配伍香附、延胡索行气止痛，相似类为活血祛瘀，常用于胸胁脘腹胀痛的辨证调护。',
  '功效|利水渗湿':
    '利水渗湿类常配伍茯苓、薏苡仁渗湿健脾，相似类为补气健脾，常用于水肿尿少、湿盛泄泻的日常调护。',
  '功效|安神助眠':
    '安神助眠类常配伍酸枣仁、百合养心安神，相似类为补血滋阴，常用于心烦失眠、虚烦惊悸的日常调护。',
  '功效|祛风除湿':
    '祛风除湿类常配伍苍术、独活祛风除湿，相似类为温阳散寒，常用于风湿痹痛、肢体麻木的辨证调护。',
  '功效|健脾益气':
    '健脾益气类常配伍白术、黄芪健脾补气，相似类为补气健脾，常用于脾虚食少、倦怠乏力的日常调护。',

  // —— 药材基原（产地） ——
  '产地|四川':
    '四川为多种道地药材产区，盛产黄连、川芎、附子等，气候湿润、土壤肥沃，所产药材以辛温活血类见长。',
  '产地|广东/广西':
    '两广为南药主产区，盛产肉桂、陈皮、砂仁等，气候湿热，芳香化湿类丰富，多与温里理气类配伍。',
  '产地|山东/河南':
    '中原产区盛产金银花、阿胶、丹参、红枣等，气候温和、平原沃土，所产药材以补益与清热类为主。',
  '产地|内蒙古/甘肃':
    '西北高原产区盛产甘草、麻黄、黄芪等，气候干燥寒凉，所产药材以补气、解表、利水类见长。',
  '产地|浙江/安徽':
    '浙皖为浙八味与皖南道地药材产地，盛产白术、白芍、菊花，所产药材以养阴、健脾、平肝类多见。',
  '产地|河北/陕西':
    '北方产区盛产连翘、柴胡、知母、板蓝根等，温带四季分明，所产药材以清热、疏肝、解毒类为主。',
  '产地|吉林/辽宁':
    '东北产区盛产人参、鹿茸、五味子等，长白山生态独特，所产药材以大补元气、补益肝肾类见长。',
  '产地|宁夏/青海':
    '西北高原盛产枸杞子、冬虫夏草等，光照充足、温差大，所产药材以滋补肝肾、益精明目类著称。',
}

// 通用兜底：未命中专属文案时展示，确保智能建议模块始终有内容
const SMART_SUGGESTION_FALLBACK =
  '可结合该节点的归经、药性与功效查看常见配伍方向、相似药材及典型应用场景，进一步构建经验聚类参考。'

const smartSuggestion = computed(() => {
  if (!selectedNode.value) {
    return '点击左侧节点查看推荐建议，例如配伍方向、相似药材或常见应用场景。'
  }
  const key = `${selectedNode.value.categoryName}|${selectedNode.value.name}`
  return SMART_SUGGESTION_MAP[key] || SMART_SUGGESTION_FALLBACK
})

function initSankeyChart() {
  if (!sankeyChartRef.value) return

  if (sankeyChartInstance) {
    sankeyChartInstance.dispose()
  }

  sankeyChartInstance = echarts.init(sankeyChartRef.value, 'light')

  // 四层级总高度归一化：每个层级所有节点的 value 总和均统一为 UNIFIED，等比缩放、保留层内比例
  const { nodes: rawNodes, links: rawLinks } = toSankeyData(
    ORIGIN_NATURE_DATA,
    NATURE_MERIDIAN_DATA,
    MERIDIAN_EFFICACY_DATA,
  )

  const nodeLayerArr = rawNodes.map((n) => SANKEY_CATEGORY_OF[n.name] || '')
  const rawIn = new Array(rawNodes.length).fill(0)
  const rawOut = new Array(rawNodes.length).fill(0)
  rawLinks.forEach((l) => {
    rawOut[l.source as number] += l.value
    rawIn[l.target as number] += l.value
  })
  // 边界层用单侧流量、内部层用 max(in,out)，与 ECharts 默认 sankey 节点尺寸计算一致
  const rawWeight = rawNodes.map((_, i) => {
    const layer = nodeLayerArr[i]
    if (layer === '产地') return rawOut[i]
    if (layer === '功效') return rawIn[i]
    return Math.max(rawIn[i], rawOut[i])
  })
  const layerTotals: Record<string, number> = { 产地: 0, 药性: 0, 归经: 0, 功效: 0 }
  rawNodes.forEach((_, i) => {
    const layer = nodeLayerArr[i]
    if (layer in layerTotals) layerTotals[layer] += rawWeight[i]
  })
  const UNIFIED = 100
  const balancedNodes = rawNodes.map((n, i) => {
    const lt = layerTotals[nodeLayerArr[i]] || 0
    const value = lt > 0 ? (rawWeight[i] / lt) * UNIFIED : 0
    return {
      name: n.name,
      value,
      __raw: rawWeight[i],
      itemStyle: {
        color: resolveHerbalColor(n.name),
        borderColor: 'transparent',
        borderWidth: 0,
      },
    }
  })
  // 流带按源节点缩放因子等比放缩：保证每个源节点的出流之和恰好等于归一化后的节点 value
  const balancedLinks = rawLinks.map((l) => {
    const srcIdx = l.source as number
    const srcRawOut = rawOut[srcIdx]
    const scale = srcRawOut > 0 ? balancedNodes[srcIdx].value / srcRawOut : 0
    return {
      source: l.source,
      target: l.target,
      value: l.value * scale,
      __raw: l.value,
    }
  })

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    title: {
      text: '功效聚类与关联网络·桑基图',
      left: 'center',
      top: 14,
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#ffffff',
        letterSpacing: 2,
      },
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: 'rgba(20, 50, 42, 0.92)',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        const raw = (params.data as any)?.__raw
        if (params.dataType === 'edge') {
          const label = (params.name || '').replace(' > ', ' → ')
          return raw === undefined
            ? label
            : `${label}<br/>关联强度：<b>${raw}</b>`
        }
        return raw === undefined
          ? params.name
          : `<b>${params.name}</b><br/>关联强度：<b>${raw}</b>`
      },
    },
    series: [
      {
        type: 'sankey',
        data: balancedNodes,
        links: balancedLinks,
        layout: 'orthogonal',
        orient: 'horizontal',
        top: 56,
        bottom: 24,
        left: 24,
        right: 110,
        nodeGap: 8,
        nodeWidth: 14,
        nodeAlign: 'justify',
        focusNodeAdjacency: true,
        lineStyle: {
          color: 'source',
          curveness: 0.5,
          opacity: 0.52,
        },
        label: {
          fontSize: 12,
          color: '#ffffff',
          textBorderColor: 'transparent',
          textShadowColor: 'rgba(0, 0, 0, 0.25)',
          textShadowBlur: 2,
        },
        emphasis: {
          focus: 'adjacency',
          itemStyle: {
            borderColor: 'rgba(255, 250, 230, 0.95)',
            borderWidth: 2,
            shadowBlur: 14,
            shadowColor: 'rgba(255, 240, 200, 0.45)',
          },
          lineStyle: { opacity: 0.88 },
        },
      } as any,
    ],
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

  // 按关联频次计算节点大小（视觉层覆盖，不改变 utils 返回的关联关系）
  const linkCountMap = new Map<string, number>()
  links.forEach((link) => {
    const s = String(link.source)
    const t = String(link.target)
    linkCountMap.set(s, (linkCountMap.get(s) || 0) + 1)
    linkCountMap.set(t, (linkCountMap.get(t) || 0) + 1)
  })
  const counts = Array.from(linkCountMap.values())
  const maxCount = counts.length ? Math.max(...counts) : 1
  const minCount = counts.length ? Math.min(...counts) : 1
  const span = Math.max(maxCount - minCount, 1)

  const categories = [
    { name: '产地', itemStyle: { color: FORCE_CATEGORY_COLORS.产地 } },
    { name: '药性', itemStyle: { color: FORCE_CATEGORY_COLORS.药性 } },
    { name: '归经', itemStyle: { color: FORCE_CATEGORY_COLORS.归经 } },
    { name: '功效', itemStyle: { color: FORCE_CATEGORY_COLORS.功效 } },
    { name: '草药', itemStyle: { color: FORCE_CATEGORY_COLORS.草药 } },
  ]

  // 节点填充色 = 其所属分类的主题色：中药材节点使用「中药材」分类专属国风朱砂红，
  // 其余维度节点（产地 / 药性 / 归经 / 功效）保持各自分类主题色，整体与现有分类配色方案一致
  const nodeFillByCategory: Record<number, string> = {
    0: FORCE_CATEGORY_COLORS.产地,
    1: FORCE_CATEGORY_COLORS.药性,
    2: FORCE_CATEGORY_COLORS.归经,
    3: FORCE_CATEGORY_COLORS.功效,
    4: FORCE_CATEGORY_COLORS.草药, // 中药材节点 → 「中药材」分类专属色（国风朱砂红）
  }
  nodes.forEach((node: any) => {
    const c = linkCountMap.get(node.id) || 1
    const ratio = (c - minCount) / span
    node.symbolSize = 20 + ratio * 30
    const categoryColor =
      typeof node.category === 'number' ? nodeFillByCategory[node.category] : undefined
    node.itemStyle = { color: categoryColor || FORCE_CATEGORY_COLORS.草药 }
  })

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(30, 77, 58, 0.92)',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 12 },
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
        symbol: 'circle',
        label: {
          show: true,
          fontSize: 11,
          position: 'bottom',
          distance: 6,
          color: '#3d4f44',
        },
        force: {
          // 全局两两斥力——节点充分铺开，避免重叠与标签遮挡
          repulsion: 220,
          // 弱化全局向心力，让布局松散均匀
          gravity: 0.06,
          // 关联引力 + 权重适配：边权重越大长度越短（节点越靠近）；统一权重时退化为均匀边长
          edgeLength: [70, 160],
          // 摩擦阻尼促使布局快速收敛并平稳静止，避免持续抖动
          friction: 0.55,
          layoutAnimation: true,
        },
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 1.5,
          shadowBlur: 10,
          shadowColor: 'rgba(60, 90, 70, 0.15)',
        },
        lineStyle: {
          color: '#A8C9A4',
          opacity: 0.45,
          width: 1,
          curveness: 0.1,
        },
        emphasis: {
          focus: 'adjacency',
          scale: 1.18,
          itemStyle: {
            borderColor: '#fff4d6',
            borderWidth: 3.5,
            shadowBlur: 18,
            shadowColor: 'rgba(255, 220, 150, 0.55)',
          },
          label: { fontWeight: 700 },
          lineStyle: { width: 2.4, opacity: 0.85, color: '#c9a675' },
        },
      } as any,
    ],
  }

  forceChartInstance.setOption(option)

  // 写入跨图联动所需的「节点名 → 分类名」映射
  forceCategoryByName = {}
  nodes.forEach((n: any) => {
    if (typeof n.category === 'number' && categories[n.category]) {
      forceCategoryByName[n.name] = categories[n.category].name
    }
  })

  // 缓存到模块作用域：供搜索 API（searchMatches / applySearch）与详情面板复用，避免重复构建
  forceNodesCache = nodes
  forceLinksCache = links
  forceCategoriesCache = categories

  forceChartInstance.off('click')
  forceChartInstance.on('click', (params: any) => {
    if (params.dataType === 'node') {
      // 手动点击：清除上一次搜索遗留的高亮 + 快照，切换为本次点击的选择
      if (searchHighlightedName) {
        clearSearchHighlightOnly()
      }
      preSearchSelectedNode = null
      applyNodeSelection(params.name)
      emit('node-clicked', params.name)
    }
  })
}

// 抽取的"节点选择"逻辑——点击 / 搜索共用同一份详情构建规则
function applyNodeSelection(name: string) {
  const nodeData = forceNodesCache.find((node) => node.name === name)
  const herbInfo = HERB_DATA.find((herb) => herb.name === name)

  const related = new Set<string>()
  forceLinksCache.forEach((link) => {
    if (link.source === name) related.add(String(link.target))
    else if (link.target === name) related.add(String(link.source))
  })

  selectedNode.value = {
    name,
    categoryName: forceCategoriesCache[nodeData?.category ?? 4]?.name || '',
    data: herbInfo || { name },
    relatedNodes: Array.from(related),
  }
}

// 双向联动：以「分类 + 节点名」为唯一匹配键，仅对两图都存在且同类同名的节点互发 highlight / downplay
function bindCrossHighlight() {
  if (!forceChartInstance || !sankeyChartInstance) return

  const matches = (name: string): string | null => {
    const fc = forceCategoryByName[name]
    const sc = SANKEY_CATEGORY_OF[name]
    if (!fc || !sc) return null
    if (fc !== sc) return null
    if (!CROSS_HIGHLIGHT_CATEGORIES.has(fc)) return null
    return fc
  }

  forceChartInstance.on('mouseover', (params: any) => {
    if (params.dataType !== 'node') return
    if (!matches(params.name)) return
    sankeyChartInstance?.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      name: params.name,
    })
  })

  forceChartInstance.on('mouseout', (params: any) => {
    if (params.dataType !== 'node') return
    if (!matches(params.name)) return
    sankeyChartInstance?.dispatchAction({
      type: 'downplay',
      seriesIndex: 0,
      name: params.name,
    })
  })

  sankeyChartInstance.on('mouseover', (params: any) => {
    if (params.dataType !== 'node') return
    if (!matches(params.name)) return
    forceChartInstance?.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      name: params.name,
    })
  })

  sankeyChartInstance.on('mouseout', (params: any) => {
    if (params.dataType !== 'node') return
    if (!matches(params.name)) return
    forceChartInstance?.dispatchAction({
      type: 'downplay',
      seriesIndex: 0,
      name: params.name,
    })
  })
}

async function initCharts() {
  await nextTick()
  initForceChart()
  initSankeyChart()
  bindCrossHighlight()
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

// === 搜索联动 API（顶部导航栏搜索框通过 defineExpose 调用） ===

// 仅下放两图共有的可搜索分类——中药材（草药）、归经、功效关键词
function buildSearchableNodes(): Array<{ name: string; category: string }> {
  const items: Array<{ name: string; category: string }> = []
  const seen = new Set<string>()
  HERB_DATA.forEach((h) => {
    if (h.name && !seen.has('草药|' + h.name)) {
      items.push({ name: h.name, category: '草药' })
      seen.add('草药|' + h.name)
    }
  })
  const meridians = new Set<string>()
  HERB_DATA.forEach((h) => {
    if (h.meridian) meridians.add(h.meridian)
  })
  MERIDIAN_EFFICACY_DATA.forEach((d) => meridians.add(d.source))
  NATURE_MERIDIAN_DATA.forEach((d) => meridians.add(d.target))
  meridians.forEach((m) => {
    if (!seen.has('归经|' + m)) {
      items.push({ name: m, category: '归经' })
      seen.add('归经|' + m)
    }
  })
  const efficacies = new Set<string>()
  HERB_DATA.forEach((h) => {
    if (h.efficacy) efficacies.add(h.efficacy)
  })
  MERIDIAN_EFFICACY_DATA.forEach((d) => efficacies.add(d.target))
  efficacies.forEach((e) => {
    if (!seen.has('功效|' + e)) {
      items.push({ name: e, category: '功效' })
      seen.add('功效|' + e)
    }
  })
  return items
}

function searchMatches(
  keyword: string,
): Array<{ name: string; category: string; exact: boolean }> {
  const kw = keyword.trim()
  if (!kw) return []
  const items = buildSearchableNodes()
  const result: Array<{ name: string; category: string; exact: boolean }> = []
  items.forEach((it) => {
    if (it.name === kw) result.push({ ...it, exact: true })
    else if (it.name.includes(kw)) result.push({ ...it, exact: false })
  })
  // 精准匹配优先；同类内保持稳定顺序
  result.sort((a, b) => Number(b.exact) - Number(a.exact))
  return result
}

function clearSearchHighlightOnly() {
  if (!searchHighlightedName) return
  forceChartInstance?.dispatchAction({
    type: 'downplay',
    seriesIndex: 0,
    name: searchHighlightedName,
  })
  if (SANKEY_CATEGORY_OF[searchHighlightedName]) {
    sankeyChartInstance?.dispatchAction({
      type: 'downplay',
      seriesIndex: 0,
      name: searchHighlightedName,
    })
  }
  searchHighlightedName = null
}

// 将力导向图中目标节点平移到画布中心（利用 ECharts 内部布局坐标 + graphRoam pan）
function centerForceNode(name: string) {
  if (!forceChartInstance) return
  try {
    const idx = forceNodesCache.findIndex((n: any) => n.name === name)
    if (idx < 0) return
    const model = (forceChartInstance as any).getModel?.()
    const series = model?.getSeriesByIndex?.(0)
    const data = series?.getData?.()
    if (!data) return
    const layout = data.getItemLayout(idx)
    if (!layout || layout.x === undefined || layout.y === undefined) return
    const pixel = forceChartInstance.convertToPixel({ seriesIndex: 0 }, [
      layout.x,
      layout.y,
    ])
    if (!pixel) return
    const dom = forceChartInstance.getDom() as HTMLElement
    const cw = dom.clientWidth
    const ch = dom.clientHeight
    const dx = cw / 2 - pixel[0]
    const dy = ch / 2 - pixel[1]
    forceChartInstance.dispatchAction({ type: 'graphRoam', dx, dy })
  } catch {
    // 居中失败时高亮仍生效——降级即可，不抛错
  }
}

function applySearch(name: string) {
  // 保留搜索前的 selectedNode 快照，便于「清空搜索框」时还原
  if (preSearchSelectedNode === null) {
    preSearchSelectedNode = selectedNode.value ? { ...selectedNode.value } : null
  }
  // 切换关键词时先卸下上一次的搜索高亮
  if (searchHighlightedName && searchHighlightedName !== name) {
    clearSearchHighlightOnly()
  }

  // 1. 详情面板（复用点击逻辑，保证两种触发路径展示一致）
  applyNodeSelection(name)

  // 2. 力导向图：复用 emphasis 配置，dispatchAction 高亮 + 居中
  forceChartInstance?.dispatchAction({ type: 'highlight', seriesIndex: 0, name })
  centerForceNode(name)

  // 3. 桑基图：仅当节点在桑基图中存在对应项（产地/药性/归经/功效）才高亮
  if (SANKEY_CATEGORY_OF[name]) {
    sankeyChartInstance?.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      name,
    })
  }

  searchHighlightedName = name
}

function clearSearch() {
  clearSearchHighlightOnly()
  // 详情面板还原为搜索前状态
  if (preSearchSelectedNode !== null) {
    selectedNode.value = preSearchSelectedNode
  } else {
    selectedNode.value = null
  }
  preSearchSelectedNode = null
}

defineExpose({ searchMatches, applySearch, clearSearch })
</script>

<template>
  <div class="clustering">
    <div v-if="loading" class="clustering__loading">
      <p>加载中...</p>
    </div>

    <div v-else class="clustering__wrapper">
      <div class="clustering__top">
        <div class="clustering__force-container">
          <div class="clustering__hint">滚轮缩放 · 拖拽节点移动 · 点击查看详情</div>
          <div ref="forceChartRef" class="clustering__chart"></div>
          <div class="clustering__legend">
            <div class="clustering__legend-row">
              <span class="clustering__legend-dot" style="background:#a8d8b9"></span>
              <span class="clustering__legend-label">中药材</span>
            </div>
            <div class="clustering__legend-row">
              <span class="clustering__legend-dot" style="background:#527e72"></span>
              <span class="clustering__legend-label">归经（脏腑）</span>
            </div>
            <div class="clustering__legend-row">
              <span class="clustering__legend-dot" style="background:#5cb87a"></span>
              <span class="clustering__legend-label">药材基原</span>
            </div>
            <div class="clustering__legend-row">
              <span class="clustering__legend-dot" style="background:#8b7355"></span>
              <span class="clustering__legend-label">功效关键词</span>
            </div>
            <div class="clustering__legend-row">
              <span class="clustering__legend-dot" style="background:#b89248"></span>
              <span class="clustering__legend-label">药性</span>
            </div>
            <div class="clustering__legend-note">* 节点按名称分配绿/棕黄相近色，大小与关联频次成正比</div>
          </div>
        </div>

        <div class="clustering__details-panel">
          <div v-if="!selectedNode" class="clustering__panel-empty">
            <div class="clustering__panel-empty-icon">⊕</div>
            <p>点击左侧节点查看详情</p>
          </div>

          <div v-else class="clustering__panel-content">
            <div class="clustering__panel-tag">
              {{ CATEGORY_DISPLAY_NAME[selectedNode.categoryName] || selectedNode.categoryName }}
            </div>
            <h2 class="clustering__panel-name">{{ selectedNode.name }}</h2>

            <div v-if="selectedNode.data.nature" class="clustering__panel-section">
              <div class="clustering__panel-section-title">药性 / 性味</div>
              <div class="clustering__panel-soft-box">{{ selectedNode.data.nature }}</div>
            </div>

            <div v-if="selectedNode.data.efficacy" class="clustering__panel-section">
              <div class="clustering__panel-section-title">主要功效</div>
              <p class="clustering__panel-paragraph">{{ selectedNode.data.efficacy }}</p>
            </div>

            <div v-if="selectedNode.data.meridian" class="clustering__panel-section">
              <div class="clustering__panel-section-title">归经</div>
              <div class="clustering__panel-soft-box">{{ selectedNode.data.meridian }}</div>
            </div>

            <div v-if="selectedNode.data.origin" class="clustering__panel-section">
              <div class="clustering__panel-section-title">产地</div>
              <div class="clustering__panel-soft-box">{{ selectedNode.data.origin }}</div>
            </div>

            <div
              v-if="selectedNode.relatedNodes && selectedNode.relatedNodes.length"
              class="clustering__panel-section"
            >
              <div class="clustering__panel-section-title">关联节点</div>
              <div class="clustering__panel-pills">
                <span
                  v-for="rel in selectedNode.relatedNodes"
                  :key="rel"
                  class="clustering__panel-pill"
                  >{{ rel }}</span
                >
              </div>
            </div>
          </div>

          <div class="clustering__panel-suggest">
            <div class="clustering__panel-suggest-icon">i</div>
            <div class="clustering__panel-suggest-body">
              <div class="clustering__panel-suggest-title">智能建议</div>
              <div class="clustering__panel-suggest-text">{{ smartSuggestion }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="clustering__sankey-container">
        <div class="clustering__sankey-wrapper">
          <div ref="sankeyChartRef" class="clustering__sankey-chart"></div>
          <div class="clustering__sankey-legend">
            <div
              v-for="item in SANKEY_LEGEND"
              :key="item.name"
              class="clustering__sankey-legend-item"
            >
              <span
                class="clustering__sankey-legend-dot"
                :style="{ background: item.color }"
              ></span>
              <span class="clustering__sankey-legend-label">{{ item.name }}</span>
            </div>
          </div>
        </div>
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
  background: var(--herb-cream);
  color: var(--herb-text);
  overflow: hidden;
}

.clustering__loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--herb-text-soft);
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
}

.clustering__force-container {
  position: relative;
  flex: 1;
  min-width: 0;
  border-radius: 14px;
  overflow: hidden;
  background: var(--herb-paper);
  border: 1px solid var(--herb-border);
  box-shadow: var(--herb-shadow);
}

.clustering__chart {
  width: 100%;
  height: 100%;
}

.clustering__hint {
  position: absolute;
  top: 12px;
  left: 14px;
  z-index: 2;
  font-size: 0.78rem;
  color: var(--herb-sage);
  background: rgba(255, 255, 255, 0.75);
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  letter-spacing: 0.02em;
  pointer-events: none;
}

.clustering__legend {
  position: absolute;
  bottom: 14px;
  left: 14px;
  z-index: 2;
  background: var(--herb-paper);
  border: 1px solid var(--herb-border);
  border-radius: 10px;
  padding: 0.6rem 0.85rem;
  box-shadow: var(--herb-shadow);
  font-size: 0.78rem;
  color: var(--herb-text);
  min-width: 132px;
}

.clustering__legend-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.18rem 0;
}

.clustering__legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9);
}

.clustering__legend-label {
  line-height: 1.2;
}

.clustering__legend-note {
  margin-top: 0.4rem;
  padding-top: 0.4rem;
  border-top: 1px dashed rgba(60, 90, 70, 0.15);
  font-size: 0.7rem;
  color: var(--herb-text-muted);
  letter-spacing: 0.02em;
}

.clustering__details-panel {
  width: 300px;
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  background: var(--herb-paper);
  border: 1px solid var(--herb-border);
  overflow: hidden;
  box-shadow: var(--herb-shadow);
}

.clustering__panel-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  color: var(--herb-text-muted);
  font-size: 0.9rem;
  padding: 1.5rem;
  text-align: center;
}

.clustering__panel-empty-icon {
  font-size: 2rem;
  color: var(--herb-leaf);
  line-height: 1;
}

.clustering__panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.1rem 1.1rem 0.6rem;
}

.clustering__panel-tag {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  background: linear-gradient(135deg, #5cb87a 0%, #3d7a62 100%);
  color: var(--herb-paper);
  font-size: 0.78rem;
  font-weight: 500;
  border-radius: 999px;
  letter-spacing: 0.04em;
  box-shadow: 0 2px 6px rgba(46, 125, 50, 0.25);
}

.clustering__panel-name {
  margin: 0.6rem 0 1rem;
  font-size: 1.55rem;
  font-weight: 700;
  color: var(--herb-forest);
  letter-spacing: 0.04em;
}

.clustering__panel-section {
  margin-bottom: 0.9rem;
}

.clustering__panel-section-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--herb-sage);
  margin-bottom: 0.4rem;
  letter-spacing: 0.05em;
}

.clustering__panel-soft-box {
  padding: 0.5rem 0.75rem;
  background: var(--herb-parchment);
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--herb-text);
}

.clustering__panel-paragraph {
  margin: 0;
  padding: 0.4rem 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--herb-text);
}

.clustering__panel-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.clustering__panel-pill {
  padding: 0.22rem 0.6rem;
  background: var(--herb-parchment);
  border: 1px solid var(--herb-border);
  border-radius: 999px;
  font-size: 0.78rem;
  color: var(--herb-text-soft);
}

.clustering__panel-suggest {
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  padding: 0.85rem 1rem;
  background: #faf3e0;
  border-top: 1px solid rgba(201, 166, 117, 0.25);
  flex-shrink: 0;
}

.clustering__panel-suggest-icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #c9a675;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  font-style: italic;
  font-family: Georgia, serif;
  margin-top: 1px;
}

.clustering__panel-suggest-body {
  flex: 1;
  min-width: 0;
}

.clustering__panel-suggest-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: #8a6f3e;
  margin-bottom: 0.2rem;
  letter-spacing: 0.04em;
}

.clustering__panel-suggest-text {
  font-size: 0.8rem;
  line-height: 1.55;
  color: #6b5a3a;
}

.clustering__sankey-container {
  flex: 0 1 50%;
  padding: 0 1rem 1rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.clustering__sankey-container .clustering__chart {
  background: #fdfcf5;
  border: 1px solid rgba(60, 90, 70, 0.08);
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(60, 90, 70, 0.08);
}

.clustering__sankey-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #1f4a3d;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(31, 74, 61, 0.22);
}

.clustering__sankey-chart {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.clustering__sankey-legend {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.6rem;
  padding: 0.55rem 1rem 0.85rem;
  flex-shrink: 0;
  background: transparent;
}

.clustering__sankey-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.clustering__sankey-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.clustering__sankey-legend-label {
  font-size: 0.82rem;
  color: #ffffff;
  letter-spacing: 0.05em;
}

@media (max-width: 1200px) {
  .clustering__top {
    flex-direction: column;
  }

  .clustering__details-panel {
    width: 100%;
    max-height: 220px;
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
    max-height: 180px;
  }

  .clustering__panel-content {
    padding: 0.9rem 0.9rem 0.4rem;
  }

  .clustering__sankey-container {
    padding: 0 0.75rem 0.75rem;
  }
}
</style>
