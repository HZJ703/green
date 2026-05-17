export interface HerbData {
  name: string
  nature?: string
  meridian?: string
  efficacy?: string
  origin?: string
}

export interface SankeyNode {
  name: string
}

export interface SankeyLink {
  source: string | number
  target: string | number
  value: number
}

export interface ForceNode {
  name: string
  id: string
  symbolSize?: number
  category?: number
}

export interface ForceLink {
  source: string
  target: string
}

// 桑基图数据转换
export function toSankeyData(
  originNatureData: Array<{ source: string; target: string; value: number }>,
  natureMeridianData: Array<{ source: string; target: string; value: number }>,
  meridianEfficacyData: Array<{ source: string; target: string; value: number }>,
): { nodes: SankeyNode[]; links: SankeyLink[] } {
  const nodes: SankeyNode[] = []
  const nodeSet = new Set<string>()
  const nodeMap = new Map<string, number>()

  const allData = [...originNatureData, ...natureMeridianData, ...meridianEfficacyData]

  allData.forEach((item) => {
    if (!nodeSet.has(item.source)) {
      nodeMap.set(item.source, nodes.length)
      nodes.push({ name: item.source })
      nodeSet.add(item.source)
    }
    if (!nodeSet.has(item.target)) {
      nodeMap.set(item.target, nodes.length)
      nodes.push({ name: item.target })
      nodeSet.add(item.target)
    }
  })

  const links: SankeyLink[] = []
  allData.forEach((item) => {
    const sourceIdx = nodeMap.get(item.source)
    const targetIdx = nodeMap.get(item.target)
    if (sourceIdx !== undefined && targetIdx !== undefined) {
      links.push({
        source: sourceIdx,
        target: targetIdx,
        value: item.value,
      })
    }
  })

  return { nodes, links }
}

// 力导向图数据转换
export function toForceGraphData(herbs: HerbData[]): { nodes: ForceNode[]; links: ForceLink[] } {
  const nodes: ForceNode[] = []
  const nodeMap = new Map<string, number>()
  const links: ForceLink[] = []
  const linkSet = new Set<string>()

  const categoryMap: { [key: string]: number } = {
    origin: 0,
    nature: 1,
    meridian: 2,
    efficacy: 3,
    herb: 4,
  }

  herbs.forEach((herb) => {
    if (herb.name && !nodeMap.has(herb.name)) {
      nodeMap.set(herb.name, nodes.length)
      nodes.push({
        name: herb.name,
        id: herb.name,
        category: categoryMap.herb,
        symbolSize: 30,
      })
    }

    if (herb.origin && !nodeMap.has(herb.origin)) {
      nodeMap.set(herb.origin, nodes.length)
      nodes.push({
        name: herb.origin,
        id: herb.origin,
        category: categoryMap.origin,
        symbolSize: 25,
      })
    }
    if (herb.nature && !nodeMap.has(herb.nature)) {
      nodeMap.set(herb.nature, nodes.length)
      nodes.push({
        name: herb.nature,
        id: herb.nature,
        category: categoryMap.nature,
        symbolSize: 25,
      })
    }
    if (herb.meridian && !nodeMap.has(herb.meridian)) {
      nodeMap.set(herb.meridian, nodes.length)
      nodes.push({
        name: herb.meridian,
        id: herb.meridian,
        category: categoryMap.meridian,
        symbolSize: 25,
      })
    }
    if (herb.efficacy && !nodeMap.has(herb.efficacy)) {
      nodeMap.set(herb.efficacy, nodes.length)
      nodes.push({
        name: herb.efficacy,
        id: herb.efficacy,
        category: categoryMap.efficacy,
        symbolSize: 25,
      })
    }

    const herbName = herb.name
    if (herbName && herb.origin) {
      const key = [herbName, herb.origin].sort().join('|')
      if (!linkSet.has(key)) {
        links.push({ source: herbName, target: herb.origin })
        linkSet.add(key)
      }
    }
    if (herbName && herb.nature) {
      const key = [herbName, herb.nature].sort().join('|')
      if (!linkSet.has(key)) {
        links.push({ source: herbName, target: herb.nature })
        linkSet.add(key)
      }
    }
    if (herbName && herb.meridian) {
      const key = [herbName, herb.meridian].sort().join('|')
      if (!linkSet.has(key)) {
        links.push({ source: herbName, target: herb.meridian })
        linkSet.add(key)
      }
    }
    if (herbName && herb.efficacy) {
      const key = [herbName, herb.efficacy].sort().join('|')
      if (!linkSet.has(key)) {
        links.push({ source: herbName, target: herb.efficacy })
        linkSet.add(key)
      }
    }
  })

  return { nodes, links }
}
