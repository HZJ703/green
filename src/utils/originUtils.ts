export const PROVINCE_LIST = [
  '北京', '天津', '上海', '重庆', '河北', '山西', '辽宁', '吉林', '黑龙江',
  '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南',
  '广东', '广西', '海南', '四川', '贵州', '云南', '西藏', '陕西', '甘肃',
  '青海', '宁夏', '新疆', '内蒙古', '台湾', '香港', '澳门',
]

const PROVINCE_ALIAS: Record<string, string[]> = {
  东北: ['辽宁', '吉林', '黑龙江'],
  华北: ['河北', '山西', '内蒙古'],
  西北: ['陕西', '甘肃', '宁夏', '青海', '新疆'],
}

export function parseOriginToProvinces(originStr: string): string[] {
  if (!originStr) return []
  const parts = originStr.split(/[、,，；;\s]+/).filter(p => p.trim())
  const provs: string[] = []
  for (const p of parts) {
    const trimmed = p.replace(/等地?$/, '').trim()
    if (!trimmed) continue
    if (PROVINCE_ALIAS[trimmed]) provs.push(...PROVINCE_ALIAS[trimmed])
    else if (PROVINCE_LIST.includes(trimmed)) provs.push(trimmed)
    else {
      const matched = PROVINCE_LIST.find(prov => trimmed.includes(prov) || prov.includes(trimmed))
      if (matched) provs.push(matched)
    }
  }
  return [...new Set(provs)]
}

export async function loadChinaGeoJSON() {
  const sources = [
    `${import.meta.env.BASE_URL}geo/china.json`,
    'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
  ]

  for (const url of sources) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      if (data?.features?.length) return data
    } catch {
      // try next source
    }
  }

  throw new Error('无法加载中国地图数据')
}

export function buildProvinceNameMap(geoJson: { features: Array<{ properties: { name: string } }> }): Record<string, string> {
  const map: Record<string, string> = {}
  const names = geoJson.features.map(f => f.properties.name)
  PROVINCE_LIST.forEach(short => {
    const full = names.find(n => n === short || (n.startsWith(short) && /[省市自治區]/.test(n.slice(short.length))))
    if (full) map[short] = full
  })
  if (!map['广西']) map['广西'] = '广西壮族自治区'
  if (!map['内蒙古']) map['内蒙古'] = '内蒙古自治区'
  if (!map['新疆']) map['新疆'] = '新疆维吾尔自治区'
  if (!map['宁夏']) map['宁夏'] = '宁夏回族自治区'
  if (!map['西藏']) map['西藏'] = '西藏自治区'
  return map
}
