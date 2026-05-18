class DataService {
  constructor() {
    this.herbsData = []
    this.loaded = false
  }

  async loadData() {
    if (this.loaded) return this.herbsData

    try {
      const response = await fetch('/data/herbal-data.json')
      if (!response.ok) throw new Error('数据加载失败')
      const rawData = await response.json()
      this.herbsData = rawData.map((item, index) => this.normalizeHerb(item, index))
      this.loaded = true
      console.log(`已加载 ${this.herbsData.length} 条药材数据`)
      return this.herbsData
    } catch (error) {
      console.error('数据加载失败:', error)
      this.herbsData = this.getMockData()
      this.loaded = true
      return this.herbsData
    }
  }

  normalizeHerb(item, index) {
    const property = item.property || item.nature || '平'
    const category = item.category || '其他'

    return {
      id: item.id || String(index + 1),
      name: item.name || `药材${index + 1}`,
      property,
      nature: property,
      meridians: this.normalizeMeridians(item.meridians || item.meridian, category),
      keywords: item.keywords || [item.efficacy, item.category].filter(Boolean),
      category,
      effect: item.effect || item.efficacy || '',
      efficacy: item.efficacy || item.effect || '',
      origin: item.origin || '',
    }
  }

  normalizeMeridians(value, category) {
    if (Array.isArray(value)) return value
    if (typeof value === 'string' && value.trim()) {
      return value.split(/[、,，；;\s]+/).filter(Boolean)
    }

    const categoryMeridianMap = {
      补气药: ['脾', '肺'],
      补血药: ['肝', '心'],
      清热药: ['肺', '胃', '心'],
      温阳药: ['脾', '肾'],
      解表药: ['肺'],
      调和药: ['脾', '胃'],
    }

    return categoryMeridianMap[category] || ['脾']
  }

  async getAllHerbs() {
    return await this.loadData()
  }

  async searchHerbs(keyword) {
    const data = await this.loadData()
    if (!keyword || keyword.trim() === '') return data

    const lowerKeyword = keyword.toLowerCase().trim()
    return data.filter(
      (herb) =>
        herb.name?.toLowerCase().includes(lowerKeyword) ||
        herb.property?.toLowerCase().includes(lowerKeyword) ||
        herb.keywords?.some((keywordItem) => keywordItem.toLowerCase().includes(lowerKeyword)) ||
        herb.effect?.toLowerCase().includes(lowerKeyword),
    )
  }

  async filterByProperty(property) {
    const data = await this.loadData()
    if (property === '全部') return data
    return data.filter((herb) => herb.property === property)
  }

  async filterByMeridian(meridian) {
    const data = await this.loadData()
    if (meridian === '全部') return data
    return data.filter((herb) => herb.meridians?.includes(meridian))
  }

  async filterHerbs(filters) {
    let data = await this.loadData()

    if (filters.property && filters.property !== '全部') {
      data = data.filter((herb) => herb.property === filters.property)
    }

    if (filters.meridian && filters.meridian !== '全部') {
      data = data.filter((herb) => herb.meridians?.includes(filters.meridian))
    }

    if (filters.keyword && filters.keyword.trim()) {
      const keyword = filters.keyword.toLowerCase().trim()
      data = data.filter(
        (herb) =>
          herb.name?.toLowerCase().includes(keyword) ||
          herb.property?.toLowerCase().includes(keyword) ||
          herb.effect?.toLowerCase().includes(keyword),
      )
    }

    return data
  }

  async getPropertyStats() {
    const data = await this.loadData()
    const stats = {}

    data.forEach((herb) => {
      const prop = herb.property
      stats[prop] = (stats[prop] || 0) + 1
    })

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

    return Object.entries(stats)
      .map(([name, value]) => ({
        name: `${name}性`,
        value,
        color: colorMap[name] || '#67C23A',
      }))
      .sort((a, b) => b.value - a.value)
  }

  async getMeridianStats() {
    const data = await this.loadData()
    const stats = {}

    data.forEach((herb) => {
      if (herb.meridians) {
        herb.meridians.forEach((meridian) => {
          if (meridian && meridian.trim()) {
            stats[meridian] = (stats[meridian] || 0) + 1
          }
        })
      }
    })

    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }

  async getCategoryStats() {
    const data = await this.loadData()
    const stats = {}

    data.forEach((herb) => {
      const category = herb.category || '其他'
      stats[category] = (stats[category] || 0) + 1
    })

    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }

  getMockData() {
    return [
      {
        id: '1',
        name: '甘草',
        property: '平',
        meridians: ['脾', '胃', '肺'],
        keywords: ['补气', '解毒'],
        category: '补气药',
        effect: '补脾益气，清热解毒',
      },
      {
        id: '2',
        name: '黄芪',
        property: '温',
        meridians: ['脾', '肺'],
        keywords: ['补气', '固表'],
        category: '补气药',
        effect: '补气升阳，固表止汗',
      },
      {
        id: '3',
        name: '金银花',
        property: '寒',
        meridians: ['肺', '胃'],
        keywords: ['清热', '解毒'],
        category: '清热药',
        effect: '清热解毒，疏散风热',
      },
    ]
  }
}

export default new DataService()
