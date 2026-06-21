export interface Herb {
  name: string
  nature: string
  taste: string
  meridian: string[]
  effect: string
  category: string
}

export interface HerbPair {
  herbs: [string, string]
  effect: string
  description: string
  prescriptions?: string[]
}

export const herbData: Herb[] = [
  {name: "莪术", nature: "温", taste: "辛；苦", meridian: ["脾", "肝"], effect: "活血祛瘀", category: "活血药"},
  {name: "阿胶", nature: "平", taste: "甘", meridian: ["肺", "肝", "肾"], effect: "补血滋阴", category: "补血药"},
  {name: "沙参", nature: "微寒", taste: "甘", meridian: ["肺", "胃"], effect: "滋阴润燥", category: "滋阴药"},
  {name: "菊花", nature: "微寒", taste: "辛；甘；苦", meridian: ["肺", "肝"], effect: "平肝明目", category: "清热药"},
  {name: "金银花", nature: "寒", taste: "甘", meridian: ["肺", "胃", "心"], effect: "清热解毒", category: "清热药"},
  {name: "生姜", nature: "温", taste: "辛", meridian: ["肺", "脾", "胃"], effect: "温阳散寒", category: "温里药"},
  {name: "肉桂", nature: "热", taste: "辛；甘", meridian: ["脾", "肝", "心", "肾"], effect: "温阳散寒", category: "温里药"},
  {name: "甘草", nature: "平", taste: "甘", meridian: ["肺", "脾", "胃", "心"], effect: "补气健脾", category: "补气药"},
  {name: "黄芪", nature: "温", taste: "甘", meridian: ["肺", "脾"], effect: "补气健脾", category: "补气药"},
  {name: "白术", nature: "温", taste: "甘；苦", meridian: ["脾", "胃"], effect: "补气健脾", category: "补气药"},
  {name: "黄芩", nature: "寒", taste: "苦", meridian: ["肺", "大肠", "胃", "小肠", "胆"], effect: "清热泻火", category: "清热药"},
  {name: "黄连", nature: "寒", taste: "苦", meridian: ["大肠", "胃", "小肠", "肝", "心"], effect: "清热泻火", category: "清热药"},
  {name: "葛根", nature: "凉", taste: "辛；甘", meridian: ["脾", "胃"], effect: "清热生津", category: "解表药"},
  {name: "杏仁", nature: "苦", taste: "微温", meridian: ["肺", "大肠"], effect: "止咳化痰", category: "止咳平喘药"},
  {name: "丹参", nature: "微寒", taste: "苦", meridian: ["肝", "心"], effect: "活血祛瘀", category: "活血药"},
  {name: "薏苡仁", nature: "微寒", taste: "甘；平", meridian: ["肺", "脾", "胃"], effect: "利水渗湿", category: "利水药"},
  {name: "连翘", nature: "微寒", taste: "苦", meridian: ["心", "胆"], effect: "清热解毒", category: "清热药"},
  {name: "升麻", nature: "微寒", taste: "辛", meridian: ["肺", "脾", "大肠", "胃"], effect: "清热解毒", category: "解表药"},
  {name: "桔梗", nature: "平", taste: "辛；苦", meridian: ["肺"], effect: "止咳化痰", category: "止咳化痰药"},
  {name: "蝉蜕", nature: "寒", taste: "甘", meridian: ["肺", "肝"], effect: "平肝明目", category: "解表药"},
  {name: "女贞子", nature: "凉", taste: "甘；苦", meridian: ["肝", "肾"], effect: "滋阴润燥", category: "补阴药"},
  {name: "柴胡", nature: "微寒", taste: "辛；苦", meridian: ["肝", "胆", "肺"], effect: "理气止痛", category: "解表药"},
  {name: "黄柏", nature: "寒", taste: "苦", meridian: ["膀胱", "大肠", "肾"], effect: "清热泻火", category: "清热药"},
  {name: "白芍", nature: "微寒", taste: "酸；苦", meridian: ["肝", "脾"], effect: "补血滋阴", category: "补血药"},
  {name: "人参", nature: "微温", taste: "甘；微苦", meridian: ["肺", "脾", "心"], effect: "补气健脾", category: "补气药"},
  {name: "牛膝", nature: "平", taste: "甘；酸；苦", meridian: ["肝", "肾"], effect: "活血祛瘀", category: "活血药"},
  {name: "枸杞子", nature: "平", taste: "甘", meridian: ["肝", "肾"], effect: "滋阴润燥", category: "补阴药"},
  {name: "延胡索", nature: "温", taste: "辛；苦", meridian: ["脾", "肝", "心"], effect: "理气止痛", category: "活血药"},
  {name: "萹蓄", nature: "微寒", taste: "苦", meridian: ["膀胱"], effect: "利水渗湿", category: "利水药"},
  {name: "茯苓", nature: "平", taste: "甘；淡", meridian: ["脾", "心", "肾"], effect: "利水渗湿", category: "利水药"},
  {name: "大枣", nature: "温", taste: "甘", meridian: ["脾", "胃"], effect: "补气健脾", category: "补气药"},
  {name: "桑叶", nature: "寒", taste: "甘；苦", meridian: ["肺", "肝"], effect: "平肝明目", category: "解表药"},
  {name: "鹿茸", nature: "温", taste: "甘；咸", meridian: ["肝", "肾"], effect: "温阳散寒", category: "补阳药"},
  {name: "丁香", nature: "温", taste: "辛", meridian: ["脾", "胃", "肾"], effect: "温阳散寒", category: "温里药"},
  {name: "麻黄", nature: "温", taste: "辛；微苦", meridian: ["肺", "膀胱"], effect: "温阳散寒", category: "解表药"},
  {name: "花椒", nature: "温", taste: "辛", meridian: ["脾", "胃", "肾"], effect: "温阳散寒", category: "温里药"},
  {name: "泽泻", nature: "寒", taste: "甘；淡", meridian: ["肾", "膀胱"], effect: "利水渗湿", category: "利水药"},
  {name: "桃仁", nature: "平", taste: "甘；苦", meridian: ["大肠", "肝", "心"], effect: "活血祛瘀", category: "活血药"},
  {name: "板蓝根", nature: "寒", taste: "苦", meridian: ["胃", "心"], effect: "清热解毒", category: "清热药"},
  {name: "石膏", nature: "大寒", taste: "辛；甘", meridian: ["肺", "胃"], effect: "清热泻火", category: "清热药"},
  {name: "厚朴", nature: "温", taste: "辛；苦", meridian: ["肺", "脾", "大肠", "胃"], effect: "理气止痛", category: "燥湿药"},
  {name: "麦冬", nature: "微寒", taste: "甘", meridian: ["肺", "胃", "心"], effect: "滋阴润燥", category: "滋阴药"},
  {name: "车前子", nature: "甘", taste: "寒", meridian: ["肝", "肾", "肺", "小肠"], effect: "利水渗湿", category: "利水药"},
  {name: "佩兰", nature: "平", taste: "辛", meridian: ["脾", "胃", "肺"], effect: "理气止痛", category: "化湿药"},
  {name: "菟丝子", nature: "平", taste: "甘", meridian: ["肝", "肾", "脾"], effect: "温阳散寒", category: "补阳药"},
  {name: "猪苓", nature: "平", taste: "甘；淡", meridian: ["肾", "膀胱"], effect: "利水渗湿", category: "利水药"},
  {name: "栀子", nature: "寒", taste: "苦", meridian: ["肺", "胃", "肝", "心"], effect: "清热泻火", category: "清热药"},
  {name: "薄荷", nature: "凉", taste: "辛", meridian: ["肺", "肝"], effect: "平肝明目", category: "解表药"},
  {name: "川芎", nature: "温", taste: "辛", meridian: ["肝", "心包", "胆"], effect: "活血祛瘀", category: "活血药"},
  {name: "吴茱萸", nature: "热", taste: "辛；苦", meridian: ["肝", "脾", "胃"], effect: "温阳散寒", category: "温里药"},
  {name: "苍术", nature: "温", taste: "辛；苦", meridian: ["脾", "胃", "肝"], effect: "祛风除湿", category: "燥湿药"},
  {name: "补骨脂", nature: "温", taste: "辛；苦", meridian: ["脾", "肾"], effect: "温阳散寒", category: "补阳药"},
  {name: "续断", nature: "微温", taste: "辛；甘；苦", meridian: ["肝", "肾"], effect: "温阳散寒", category: "补肝肾药"},
  {name: "桂枝", nature: "温", taste: "辛；甘", meridian: ["肺", "膀胱", "心"], effect: "温阳散寒", category: "解表药"},
  {name: "干姜", nature: "热", taste: "辛", meridian: ["肺", "脾", "胃", "心", "肾"], effect: "温阳散寒", category: "温里药"},
  {name: "蒲公英", nature: "寒", taste: "苦；甘", meridian: ["肝", "胃"], effect: "清热解毒", category: "清热药"},
  {name: "百合", nature: "微寒", taste: "甘", meridian: ["心", "肺"], effect: "安神助眠", category: "滋阴药"},
  {name: "半夏", nature: "温", taste: "辛", meridian: ["脾", "胃", "肺"], effect: "止咳化痰", category: "化痰药"},
  {name: "木香", nature: "温", taste: "辛；苦", meridian: ["脾", "胃", "大肠", "三焦", "胆"], effect: "理气止痛", category: "行气药"},
  {name: "藿香", nature: "微温", taste: "辛", meridian: ["脾", "胃", "肺"], effect: "理气止痛", category: "化湿药"},
  {name: "瞿麦", nature: "寒", taste: "苦", meridian: ["心", "小肠"], effect: "利水渗湿", category: "利水药"},
  {name: "砂仁", nature: "温", taste: "辛", meridian: ["脾", "胃", "肾"], effect: "理气止痛", category: "化湿药"},
  {name: "金钱草", nature: "凉", taste: "甘；咸", meridian: ["肝", "胆", "肾", "膀胱"], effect: "利水渗湿", category: "利水药"},
  {name: "三棱", nature: "温", taste: "辛；苦", meridian: ["肝", "脾"], effect: "活血祛瘀", category: "活血药"},
  {name: "玉竹", nature: "微寒", taste: "甘", meridian: ["肺", "胃"], effect: "滋阴润燥", category: "滋阴药"},
  {name: "鸡血藤", nature: "温", taste: "甘", meridian: ["肝", "肾"], effect: "活血祛瘀", category: "活血药"},
  {name: "泽兰", nature: "微温", taste: "苦；辛", meridian: ["肝", "脾"], effect: "活血祛瘀", category: "活血药"},
  {name: "海金沙", nature: "寒", taste: "甘", meridian: ["膀胱", "小肠"], effect: "利水渗湿", category: "利水药"},
  {name: "郁金", nature: "寒", taste: "辛；苦", meridian: ["肝", "心", "肺"], effect: "理气止痛", category: "活血药"},
  {name: "香附", nature: "平", taste: "辛；微苦；甘", meridian: ["肝", "脾", "三焦"], effect: "理气止痛", category: "疏肝药"},
  {name: "杜仲", nature: "温", taste: "甘", meridian: ["肝", "肾"], effect: "温阳散寒", category: "补肝肾药"},
  {name: "滑石", nature: "寒", taste: "甘；淡", meridian: ["膀胱", "肺", "胃"], effect: "利水渗湿", category: "利水药"},
  {name: "知母", nature: "寒", taste: "苦；甘", meridian: ["肺", "胃", "肾"], effect: "清热泻火", category: "清热药"},
  {name: "陈皮", nature: "温", taste: "辛；苦", meridian: ["脾", "肺"], effect: "理气止痛", category: "行气药"},
  {name: "木通", nature: "寒", taste: "苦", meridian: ["心", "小肠", "膀胱"], effect: "利水渗湿", category: "利水药"},
  {name: "红花", nature: "温", taste: "辛", meridian: ["肝", "心"], effect: "活血祛瘀", category: "活血药"}
]

export function calculateCompatibility(herbs: Herb[], threshold: number = 30): number[][] {
  const matrix: number[][] = []
  const n = herbs.length

  for (let i = 0; i < n; i++) {
    matrix[i] = []
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0
      } else {
        const score = calculateScore(herbs[i], herbs[j])
        matrix[i][j] = score
      }
    }
  }

  return matrix
}

export function calculateScore(herb1: Herb, herb2: Herb): number {
  let score = 0
  let factors = 0

  const natureMap: Record<string, number> = {
    "大寒": -2, "寒": -1, "微寒": -0.5, "凉": -0.5,
    "平": 0,
    "温": 1, "微温": 0.5, "热": 2
  }

  if (natureMap[herb1.nature] !== undefined && natureMap[herb2.nature] !== undefined) {
    const diff = Math.abs(natureMap[herb1.nature] - natureMap[herb2.nature])
    if (diff <= 0.5) score += 30
    else if (diff <= 1) score += 20
    else if (diff <= 1.5) score += 10
    factors++
  }

  const sharedMeridians = herb1.meridian.filter(m => herb2.meridian.includes(m))
  if (sharedMeridians.length > 0) {
    score += sharedMeridians.length * 15
  }
  factors++

  if (herb1.category === herb2.category) {
    score += 25
  }
  factors++

  if (herb1.effect === herb2.effect) {
    score += 20
  }
  factors++

  const normalizedScore = factors > 0 ? (score / factors) : 0
  return Math.min(100, normalizedScore)
}

export function getRelatedHerbs(herb: Herb, allHerbs: Herb[], threshold: number = 30) {
  return allHerbs
    .filter(h => h.name !== herb.name)
    .map(h => ({
      herb: h,
      score: calculateScore(herb, h)
    }))
    .filter(item => item.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

export const natureColors: Record<string, string> = {
  "大寒": "#1b5e20",
  "寒": "#2e7d32",
  "微寒": "#43a047",
  "凉": "#66bb6a",
  "平": "#9ccc65",
  "温": "#c9b07a",
  "微温": "#d4c9a8",
  "热": "#8b7355",
  "苦": "#4a6b5a",
  "甘": "#a8d08d"
}