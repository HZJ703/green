// src/services/dataService.js

// 直接导入本地数据
import { herbData } from '../data/herbData.ts'

class DataService {
    constructor() {
        this.herbsData = [];
        this.loaded = false;
    }

    // 加载数据 - 直接使用本地的 herbData
    async loadData() {
        if (this.loaded && this.herbsData.length > 0) return this.herbsData;

        try {
            // 直接使用 TSherbData.ts 中的数据
            this.herbsData = herbData.map(herb => ({
                id: herb.name,
                name: herb.name,
                property: herb.nature,      // nature 对应药性
                meridians: herb.meridian,   // meridian 对应归经
                keywords: [],
                effect: herb.effect,
                category: herb.category,
                taste: herb.taste
            }));
            this.loaded = true;
            console.log('✅ 已加载本地数据：', this.herbsData.length, '条药材');
            return this.herbsData;
        } catch (error) {
            console.error('数据加载失败:', error);
            return [];
        }
    }

    // 获取所有药材
    async getAllHerbs() {
        return await this.loadData();
    }

    // 搜索药材
    async searchHerbs(keyword) {
        const data = await this.loadData();
        if (!keyword || keyword.trim() === '') return [];
        
        const lowerKeyword = keyword.toLowerCase().trim();
        const results = data.filter(herb => {
            return (
                herb.name?.toLowerCase().includes(lowerKeyword) ||
                herb.property?.toLowerCase().includes(lowerKeyword) ||
                herb.meridians?.some(m => m.toLowerCase().includes(lowerKeyword)) ||
                herb.category?.toLowerCase().includes(lowerKeyword) ||
                herb.effect?.toLowerCase().includes(lowerKeyword)
            );
        });
        
        console.log(`🔍 搜索 "${keyword}" 找到 ${results.length} 条结果`);
        return results;
    }

    // 按药性筛选
    async filterByProperty(property) {
        const data = await this.loadData();
        if (property === '全部') return data;
        return data.filter(herb => herb.property === property);
    }

    // 按归经筛选
    async filterByMeridian(meridian) {
        const data = await this.loadData();
        if (meridian === '全部') return data;
        return data.filter(herb => herb.meridians?.includes(meridian));
    }

    // 多条件筛选
    async filterHerbs(filters) {
        let data = await this.loadData();

        if (filters.property && filters.property !== '全部') {
            data = data.filter(herb => herb.property === filters.property);
        }

        if (filters.meridian && filters.meridian !== '全部') {
            data = data.filter(herb => herb.meridians?.includes(filters.meridian));
        }

        if (filters.keyword && filters.keyword.trim()) {
            const kw = filters.keyword.toLowerCase().trim();
            data = data.filter(herb =>
                herb.name?.toLowerCase().includes(kw) ||
                herb.property?.toLowerCase().includes(kw) ||
                herb.effect?.toLowerCase().includes(kw)
            );
        }

        return data;
    }

    // 统计药性分布
    async getPropertyStats() {
        const data = await this.loadData();
        const stats = {};
        data.forEach(herb => {
            const prop = herb.property;
            stats[prop] = (stats[prop] || 0) + 1;
        });

        const colorMap = {
            '寒': '#67C23A',
            '微寒': '#85CE61',
            '凉': '#95D475',
            '平': '#B3E19D',
            '温': '#D1F0C5',
            '微温': '#E8F5E9',
            '热': '#F0F9EB',
            '大寒': '#529B2E'
        };

        return Object.entries(stats)
            .map(([name, value]) => ({
                name: `${name}性`,
                value,
                color: colorMap[name] || '#67C23A'
            }))
            .sort((a, b) => b.value - a.value);
    }

    // 统计归经分布
    async getMeridianStats() {
        const data = await this.loadData();
        const stats = {};
        data.forEach(herb => {
            if (herb.meridians) {
                herb.meridians.forEach(meridian => {
                    if (meridian && meridian.trim()) {
                        stats[meridian] = (stats[meridian] || 0) + 1;
                    }
                });
            }
        });
        return Object.entries(stats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }

    // 统计功效分类
    async getCategoryStats() {
        const data = await this.loadData();
        const stats = {};
        data.forEach(herb => {
            const category = herb.category || '其他';
            stats[category] = (stats[category] || 0) + 1;
        });
        return Object.entries(stats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }
}

export default new DataService();