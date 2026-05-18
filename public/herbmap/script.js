// 全局变量
const API_BASE = 'http://localhost:8080/api';
let useBackend = false;
let myChart = null;
let shortToFullMap = {};
let herbsMaster = {};
let provinceList = [];
let daoHerbProvince = {};
let herbProvinceMap = new Map();
let provinceHerbMap = new Map();
let originalHerbProvinceMap = null;
let originalProvinceHerbMap = null;
let originalHerbsMaster = null;
let herbSearchIndex = [];
let currentHighlightProvinces = [];

// 模拟数据 (81味)
const fullHerbsList = [
    {name:"莪术", origin:"广东、广西、四川、云南", category:"活血药", efficacy:"行气破血，消积止痛", property:"温；辛；苦"},
    {name:"阿胶", origin:"山东、河南、河北、江苏、浙江", category:"补血药", efficacy:"补血滋阴，润燥，止血", property:"平；甘"},
    {name:"沙参", origin:"东北、华北、西北及四川、云南", category:"补阴药", efficacy:"养阴清肺，益胃生津", property:"微寒；甘"},
    {name:"菊花", origin:"安徽、浙江、河南、四川", category:"解表药", efficacy:"散风清热，平肝明目，清热解毒", property:"微寒；辛；甘；苦"},
    {name:"金银花", origin:"山东、河南、河北、陕西、湖北、湖南", category:"清热药", efficacy:"清热解毒，疏散风热", property:"寒；甘"},
    {name:"生姜", origin:"四川、贵州、云南、山东、河南", category:"解表药", efficacy:"解表散寒，温中止呕，温肺止咳", property:"温；辛"},
    {name:"肉桂", origin:"广西、广东、云南", category:"温里药", efficacy:"补火助阳，散寒止痛，温经通脉", property:"热；辛；甘"},
    {name:"甘草", origin:"内蒙古、甘肃、新疆、宁夏", category:"补气药", efficacy:"补脾益气，清热解毒，祛痰止咳，缓急止痛，调和诸药", property:"平；甘", daoOrigin:"内蒙古"},
    {name:"黄芪", origin:"内蒙古、山西、甘肃、河北", category:"补气药", efficacy:"补气升阳，固表止汗，利水消肿", property:"温；甘", daoOrigin:"山西"},
    {name:"白术", origin:"浙江、安徽、湖南、江西", category:"补气药", efficacy:"健脾益气，燥湿利水，止汗", property:"温；甘；苦", daoOrigin:"浙江"},
    {name:"黄芩", origin:"河北、山西、内蒙古、陕西、甘肃", category:"清热药", efficacy:"清热燥湿，泻火解毒，止血", property:"寒；苦"},
    {name:"黄连", origin:"四川、云南、湖北", category:"清热药", efficacy:"清热燥湿，泻火解毒", property:"寒；苦"},
    {name:"葛根", origin:"河南、湖南、浙江、四川", category:"解表药", efficacy:"解肌退热，生津止渴，升阳止泻", property:"凉；辛；甘"},
    {name:"杏仁", origin:"河北、山西、内蒙古、辽宁", category:"止咳平喘药", efficacy:"降气止咳平喘，润肠通便", property:"苦；微温"},
    {name:"丹参", origin:"河南、四川、山东、陕西", category:"活血药", efficacy:"活血祛瘀，通经止痛，清心除烦", property:"微寒；苦"},
    {name:"薏苡仁", origin:"福建、江苏、河北、辽宁", category:"利水渗湿药", efficacy:"利水渗湿，健脾止泻，除痹", property:"微寒；甘"},
    {name:"连翘", origin:"山西、陕西、河南、河北", category:"清热药", efficacy:"清热解毒，消肿散结", property:"微寒；苦"},
    {name:"升麻", origin:"黑龙江、吉林、辽宁、河北", category:"解表药", efficacy:"发表透疹，清热解毒，升举阳气", property:"微寒；辛"},
    {name:"桔梗", origin:"安徽、山东、江苏、四川", category:"止咳化痰药", efficacy:"宣肺，利咽，祛痰，排脓", property:"平；辛；苦"},
    {name:"蝉蜕", origin:"山东、河南、河北、江苏", category:"解表药", efficacy:"疏散风热，利咽开音，透疹", property:"寒；甘"},
    {name:"女贞子", origin:"浙江、江苏、安徽、江西", category:"补阴药", efficacy:"滋补肝肾，明目乌发", property:"凉；甘；苦"},
    {name:"柴胡", origin:"河北、河南、陕西、甘肃", category:"解表药", efficacy:"疏散退热，疏肝解郁，升举阳气", property:"微寒；辛；苦"},
    {name:"黄柏", origin:"四川、辽宁、吉林、黑龙江", category:"清热药", efficacy:"清热燥湿，泻火除蒸", property:"寒；苦"},
    {name:"白芍", origin:"浙江、安徽、四川、山东", category:"补血药", efficacy:"养血调经，敛阴止汗，柔肝止痛", property:"微寒；酸；苦"},
    {name:"人参", origin:"吉林、辽宁、黑龙江", category:"补气药", efficacy:"大补元气，复脉固脱，补脾益肺", property:"微温；甘；微苦", daoOrigin:"吉林"},
    {name:"牛膝", origin:"河南、四川", category:"活血药", efficacy:"逐瘀通经，补肝肾，强筋骨", property:"平；甘；酸；苦"},
    {name:"枸杞子", origin:"宁夏、甘肃、青海", category:"补阴药", efficacy:"滋补肝肾，益精明目", property:"平；甘", daoOrigin:"宁夏"},
    {name:"延胡索", origin:"浙江、江苏、安徽", category:"活血药", efficacy:"活血，行气，止痛", property:"温；辛；苦"},
    {name:"萹蓄", origin:"河南、四川、浙江、山东", category:"利水渗湿药", efficacy:"利尿通淋，杀虫，止痒", property:"微寒；苦"},
    {name:"茯苓", origin:"云南、安徽、湖北、河南、四川", category:"利水渗湿药", efficacy:"利水渗湿，健脾，宁心", property:"平；甘；淡", daoOrigin:"云南"},
    {name:"大枣", origin:"河南、山东、河北", category:"补气药", efficacy:"补中益气，养血安神", property:"温；甘"},
    {name:"桑叶", origin:"浙江、江苏、四川、安徽", category:"解表药", efficacy:"疏散风热，清肺润燥，清肝明目", property:"寒；甘；苦"},
    {name:"鹿茸", origin:"吉林、辽宁、黑龙江", category:"补阳药", efficacy:"壮肾阳，益精血，强筋骨", property:"温；甘；咸"},
    {name:"丁香", origin:"广东、海南、云南", category:"温里药", efficacy:"温中降逆，补肾助阳", property:"温；辛"},
    {name:"麻黄", origin:"内蒙古、新疆、甘肃、宁夏", category:"解表药", efficacy:"发汗散寒，宣肺平喘，利水消肿", property:"温；辛；微苦"},
    {name:"花椒", origin:"四川、陕西、甘肃、河南", category:"温里药", efficacy:"温中止痛，杀虫止痒", property:"温；辛"},
    {name:"泽泻", origin:"福建、四川、江西", category:"利水渗湿药", efficacy:"利小便，清湿热", property:"寒；甘；淡"},
    {name:"桃仁", origin:"河南、河北、山东、陕西", category:"活血药", efficacy:"活血祛瘀，润肠通便，止咳平喘", property:"平；甘；苦"},
    {name:"板蓝根", origin:"河北、河南、安徽、江苏", category:"清热药", efficacy:"清热解毒，凉血利咽", property:"寒；苦"},
    {name:"石膏", origin:"湖北、安徽、山东、内蒙古", category:"清热药", efficacy:"清热泻火，除烦止渴", property:"大寒；辛；甘"},
    {name:"厚朴", origin:"四川、湖北、湖南、浙江", category:"理气药", efficacy:"燥湿消痰，下气除满", property:"温；辛；苦"},
    {name:"麦冬", origin:"四川、浙江、湖北、河南", category:"补阴药", efficacy:"养阴生津，润肺清心", property:"微寒；甘"},
    {name:"车前子", origin:"江西、河南、河北、辽宁", category:"利水渗湿药", efficacy:"利水渗湿，泄热，明目", property:"甘；寒"},
    {name:"佩兰", origin:"江苏、浙江、河北、山东", category:"化湿药", efficacy:"芳香化湿，醒脾开胃", property:"平；辛"},
    {name:"菟丝子", origin:"辽宁、吉林、河北、河南", category:"补阳药", efficacy:"补益肝肾，固精缩尿", property:"平；甘"},
    {name:"猪苓", origin:"陕西、山西、河南、甘肃", category:"利水渗湿药", efficacy:"利水渗湿", property:"平；甘；淡"},
    {name:"栀子", origin:"江西、湖南、湖北、浙江、福建", category:"清热药", efficacy:"泻火除烦，清热利湿，凉血解毒", property:"寒；苦"},
    {name:"薄荷", origin:"江苏、浙江、安徽、江西", category:"解表药", efficacy:"疏散风热，清利头目，利咽", property:"凉；辛"},
    {name:"川芎", origin:"四川、云南、贵州、湖北", category:"活血药", efficacy:"活血行气，祛风止痛", property:"温；辛", daoOrigin:"四川"},
    {name:"吴茱萸", origin:"贵州、湖南、四川、陕西", category:"温里药", efficacy:"散寒止痛，降逆止呕，助阳止泻", property:"热；辛；苦"},
    {name:"苍术", origin:"江苏、河北、山西", category:"化湿药", efficacy:"燥湿健脾，祛风散寒", property:"温；辛；苦"},
    {name:"补骨脂", origin:"四川、河南、陕西、安徽", category:"补阳药", efficacy:"温肾助阳，纳气，止泻", property:"温；辛；苦"},
    {name:"续断", origin:"四川、湖北、湖南、云南", category:"补肝肾药", efficacy:"补肝肾，强筋骨，续折伤", property:"微温；辛；甘；苦"},
    {name:"桂枝", origin:"广西、广东、云南", category:"解表药", efficacy:"发汗解肌，温通经脉，助阳化气", property:"温；辛；甘"},
    {name:"干姜", origin:"四川、贵州、云南、山东", category:"温里药", efficacy:"温中散寒，回阳通脉", property:"热；辛"},
    {name:"蒲公英", origin:"河北、河南、山东、江苏", category:"清热药", efficacy:"清热解毒，消肿散结", property:"寒；苦；甘"},
    {name:"百合", origin:"湖南、甘肃、江苏", category:"补阴药", efficacy:"养阴润肺，清心安神", property:"微寒；甘"},
    {name:"半夏", origin:"四川、湖北、河南、安徽", category:"止咳化痰药", efficacy:"燥湿化痰，降逆止呕", property:"温；辛；有毒"},
    {name:"木香", origin:"云南、四川、西藏", category:"理气药", efficacy:"行气止痛，健脾消食", property:"温；辛；苦"},
    {name:"藿香", origin:"广东、海南、云南", category:"化湿药", efficacy:"芳香化湿，和中止呕", property:"微温；辛"},
    {name:"瞿麦", origin:"河北、河南、山东、江苏", category:"利水渗湿药", efficacy:"利尿通淋，活血通经", property:"寒；苦"},
    {name:"砂仁", origin:"广东、云南、海南", category:"化湿药", efficacy:"化湿开胃，温脾止泻", property:"温；辛"},
    {name:"金钱草", origin:"四川、江苏、安徽、浙江", category:"利水渗湿药", efficacy:"利湿退黄，利尿通淋", property:"凉；甘；咸"},
    {name:"三棱", origin:"江苏、河南、山东、安徽", category:"活血药", efficacy:"破血行气，消积止痛", property:"温；辛；苦"},
    {name:"玉竹", origin:"河北、江苏、安徽、浙江", category:"补阴药", efficacy:"养阴润燥，生津止渴", property:"微寒；甘"},
    {name:"鸡血藤", origin:"广西、云南、福建、广东", category:"活血药", efficacy:"活血补血，调经止痛", property:"温；甘"},
    {name:"泽兰", origin:"江苏、浙江、安徽、山东", category:"活血药", efficacy:"活血调经，祛瘀消痈", property:"微温；苦；辛"},
    {name:"海金沙", origin:"广东、浙江、江苏、安徽", category:"利水渗湿药", efficacy:"清利湿热，通淋止痛", property:"寒；甘"},
    {name:"郁金", origin:"浙江、四川、广西", category:"活血药", efficacy:"活血止痛，行气解郁", property:"寒；辛；苦"},
    {name:"香附", origin:"山东、浙江、河南、河北", category:"理气药", efficacy:"疏肝解郁，理气宽中", property:"平；辛；微苦；甘"},
    {name:"杜仲", origin:"四川、贵州、湖北、陕西", category:"补阳药", efficacy:"补肝肾，强筋骨，安胎", property:"温；甘"},
    {name:"滑石", origin:"山东、辽宁、广西、江西", category:"利水渗湿药", efficacy:"利水渗湿，清热解暑", property:"寒；甘；淡"},
    {name:"知母", origin:"河北、山西、内蒙古、陕西", category:"清热药", efficacy:"清热泻火，滋阴润燥", property:"寒；苦；甘"},
    {name:"陈皮", origin:"广东、福建、浙江、四川", category:"理气药", efficacy:"理气健脾，燥湿化痰", property:"温；辛；苦", daoOrigin:"广东"},
    {name:"木通", origin:"江苏、浙江、安徽、江西", category:"利水渗湿药", efficacy:"利尿通淋，清心除烦", property:"寒；苦"},
    {name:"红花", origin:"河南、新疆、四川", category:"活血药", efficacy:"活血通经，散瘀止痛", property:"温；辛"}
];

// 辅助函数
function safeAddProvinceHerb(prov, herb) {
    if (!prov || !herb) return;
    if (!provinceHerbMap.has(prov)) provinceHerbMap.set(prov, new Set());
    provinceHerbMap.get(prov).add(herb);
}
function parseOriginToProvs(originStr) {
    if (!originStr) return [];
    const provinceAlias = {
        '东北': ['辽宁','吉林','黑龙江'],
        '华北': ['河北','山西','内蒙古'],
        '西北': ['陕西','甘肃','宁夏','青海','新疆']
    };
    let parts = originStr.split(/[、,，\s]+/).filter(p => p.trim());
    let provs = [];
    for (let p of parts) {
        if (provinceAlias[p]) provs.push(...provinceAlias[p]);
        else if (provinceList.includes(p)) provs.push(p);
    }
    return [...new Set(provs)];
}

// 加载数据
async function initData() {
    try {
        const res = await fetch(`${API_BASE}/herbs`, { method: 'GET', mode: 'cors' });
        if (res.ok) {
            useBackend = true;
            console.log('已连接到后端API');
            await loadDataFromBackend();
        } else throw new Error('backend response not ok');
    } catch(e) {
        console.warn('后端未启动，使用内置模拟数据');
        useBackend = false;
        loadMockData();
    }
    originalHerbProvinceMap = new Map(herbProvinceMap);
    originalProvinceHerbMap = new Map(provinceHerbMap);
    originalHerbsMaster = JSON.parse(JSON.stringify(herbsMaster));
    afterDataReady();
}

async function loadDataFromBackend() {
    try {
        const herbsRes = await fetch(`${API_BASE}/herbs`);
        const herbNames = await herbsRes.json();
        for (let name of herbNames) {
            const detailRes = await fetch(`${API_BASE}/herb/${encodeURIComponent(name)}`);
            const detail = await detailRes.json();
            herbsMaster[name] = detail;
        }
        const provRes = await fetch(`${API_BASE}/provinces`);
        provinceList = await provRes.json();
        const heatRes = await fetch(`${API_BASE}/heatmap`);
        const heatData = await heatRes.json();
        for (let item of heatData) {
            const prov = item.name;
            provinceHerbMap.set(prov, new Set());
            const provDetailRes = await fetch(`${API_BASE}/province/${encodeURIComponent(prov)}`);
            const provDetail = await provDetailRes.json();
            const herbs = provDetail.herbs || [];
            for (let h of herbs) {
                provinceHerbMap.get(prov).add(h);
                if (!herbProvinceMap.has(h)) herbProvinceMap.set(h, new Set());
                herbProvinceMap.get(h).add(prov);
            }
        }
        for (let [name, detail] of Object.entries(herbsMaster)) {
            if (detail.daoOrigin) {
                for (let prov of provinceList) {
                    if (detail.daoOrigin.includes(prov)) {
                        daoHerbProvince[name] = prov;
                        break;
                    }
                }
            }
        }
    } catch(err) {
        console.error('后端数据加载失败，降级到模拟数据', err);
        loadMockData();
    }
}

function loadMockData() {
    provinceList = ["北京","天津","上海","重庆","河北","山西","辽宁","吉林","黑龙江","江苏","浙江","安徽","福建","江西","山东","河南","湖北","湖南","广东","广西","海南","四川","贵州","云南","西藏","陕西","甘肃","青海","宁夏","新疆","内蒙古","台湾","香港","澳门"];
    for (let herb of fullHerbsList) {
        herbsMaster[herb.name] = {
            pinyin: herb.name.toLowerCase(),
            short: herb.name[0],
            category: herb.category,
            property: herb.property,
            efficacy: herb.efficacy,
            efficacyTags: herb.efficacy.split(/[；，,]/).map(t => t.trim()),
            dosage: "煎服",
            taboos: "遵医嘱",
            mainOrigin: herb.origin,
            daoOrigin: herb.daoOrigin || "",
            harvest: "四季",
            img: "https://picsum.photos/id/100/200"
        };
        if (herb.daoOrigin) daoHerbProvince[herb.name] = herb.daoOrigin;
        let provs = parseOriginToProvs(herb.origin);
        herbProvinceMap.set(herb.name, new Set(provs));
        provs.forEach(p => safeAddProvinceHerb(p, herb.name));
    }
}

function afterDataReady() {
    buildSearchIndex();
    initMap();
    initComparePanel();
    bindUIEvents();
    updateStatsAndMapByCategory('all');
}

function buildSearchIndex() {
    herbSearchIndex = [];
    for (let [name, info] of Object.entries(herbsMaster)) {
        let fullPinyin = info.pinyin || name.toLowerCase();
        let firstLetters = info.short || fullPinyin.split('').filter(c=>/[a-z]/i.test(c)).map(c=>c[0]).join('');
        herbSearchIndex.push({ name, fullPinyin, firstLetters, efficacyTags: info.efficacyTags || [] });
    }
}

// 地图相关
const provinceCoords = {
    "北京":[116.40,39.90],"天津":[117.20,39.13],"上海":[121.48,31.22],"重庆":[106.55,29.56],
    "河北":[114.48,38.03],"山西":[112.56,37.87],"内蒙古":[111.65,40.82],"辽宁":[123.38,41.80],
    "吉林":[125.35,43.88],"黑龙江":[126.63,45.75],"江苏":[118.78,32.04],"浙江":[120.15,30.28],
    "安徽":[117.27,31.86],"福建":[119.30,26.08],"江西":[115.89,28.68],"山东":[117.00,36.65],
    "河南":[113.66,34.76],"湖北":[114.30,30.60],"湖南":[112.94,28.23],"广东":[113.23,23.16],
    "广西":[108.32,22.84],"海南":[110.35,20.02],"四川":[104.06,30.67],"贵州":[106.71,26.57],
    "云南":[102.73,25.04],"西藏":[91.11,29.97],"陕西":[108.95,34.27],"甘肃":[103.73,36.03],
    "青海":[101.74,36.56],"宁夏":[106.27,38.47],"新疆":[87.68,43.77],"台湾":[121.52,25.03],
    "香港":[114.17,22.27],"澳门":[113.54,22.19]
};

function loadMapGeoJSON() {
    return fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
        .then(r => r.json())
        .catch(() => fetch('https://cdn.jsdelivr.net/npm/echarts-map@1.0.0/map/json/china.json').then(r => r.json()))
        .catch(() => { throw new Error('地图数据加载失败'); });
}

function buildNameMap(geoJson) {
    let map = {};
    let names = geoJson.features.map(f => f.properties.name);
    provinceList.forEach(short => {
        let full = names.find(n => n === short || (n.startsWith(short) && /[省市自治區]/.test(n.slice(short.length))));
        if (full) map[short] = full;
    });
    if (!map['广西']) map['广西'] = '广西壮族自治区';
    if (!map['内蒙古']) map['内蒙古'] = '内蒙古自治区';
    if (!map['新疆']) map['新疆'] = '新疆维吾尔自治区';
    if (!map['宁夏']) map['宁夏'] = '宁夏回族自治区';
    if (!map['西藏']) map['西藏'] = '西藏自治区';
    return map;
}

function renderMap() {
    if (!shortToFullMap || !myChart) return;
    let heatData = [];
    for (let prov of provinceList) {
        let val = provinceHerbMap.get(prov)?.size || 0;
        heatData.push({ name: shortToFullMap[prov] || prov, value: val });
    }
    let regions = [];
    for (let [herb, prov] of Object.entries(daoHerbProvince)) {
        if (shortToFullMap[prov]) {
            regions.push({ name: shortToFullMap[prov], itemStyle: { borderColor: '#d4af37', borderWidth: 2, areaColor: '#fff2cc' } });
        }
    }
    for (let h of currentHighlightProvinces) {
        if (shortToFullMap[h.province]) {
            regions.push({
                name: shortToFullMap[h.province],
                itemStyle: { borderColor: h.borderColor, borderWidth: 3, areaColor: h.fillColor, shadowBlur: 8 }
            });
        }
    }
    let scatterData = [];
    for (let [herb, provSet] of herbProvinceMap.entries()) {
        for (let prov of provSet) {
            let coord = provinceCoords[prov];
            if (coord) scatterData.push({ name: herb, province: prov, value: coord, herbName: herb });
        }
    }
    let maxVal = Math.max(...heatData.map(d => d.value), 1);
    let option = {
        tooltip: { trigger: 'item', formatter: params => {
            if (params.componentSubType === 'scatter') return `<strong>${params.data.herbName}</strong><br/>${herbsMaster[params.data.herbName]?.efficacy || '传统功效'}`;
            return `${params.name}<br/>🌿药材种类: ${params.value||0}`;
        }},
        visualMap: { min: 0, max: maxVal, calculable: true, inRange: {color:['#e6f3e0','#a8d08d','#6ab04c','#2e7d32']}, left:'left', bottom:20, seriesIndex:0 },
        series: [{
            name: '药材丰度', type: 'map', map: 'china', roam: true, selectedMode: false,
            itemStyle: { borderColor: '#b8cfae', borderWidth: 0.8, areaColor: '#f1f8ec' },
            emphasis: { label: { show: true }, itemStyle: { areaColor: '#ffdd99' } },
            data: heatData,
            regions: regions
        },{
            type: 'scatter', coordinateSystem: 'geo', data: scatterData, symbolSize: 6,
            itemStyle: { color: '#c2493c', borderColor: '#fff', borderWidth: 1 },
            emphasis: { scale: 1.2 }, zlevel: 2, animation: true
        }]
    };
    myChart.setOption(option, true);
}

let mapReady = false;
function initMap() {
    const mapEl = document.getElementById('chinaMap');
    if (!mapEl) return;
    loadMapGeoJSON().then(geoJson => {
        shortToFullMap = buildNameMap(geoJson);
        echarts.registerMap('china', geoJson);
        myChart = echarts.init(mapEl);
        renderMap();
        myChart.on('click', params => {
            if (params.componentSubType === 'map') {
                let full = params.name;
                let short = Object.keys(shortToFullMap).find(k => shortToFullMap[k] === full);
                if (short && provinceHerbMap.has(short)) showProvinceHerbList(short);
            } else if (params.componentSubType === 'scatter') {
                openHerbDetail(params.data.herbName);
            }
        });
        window.addEventListener('resize', () => myChart.resize());
        mapReady = true;
        const herb1 = document.getElementById('compareHerb1')?.value;
        const herb2 = document.getElementById('compareHerb2')?.value;
        if (herb1 && herb2 && herb1 !== herb2) highlightCompareProvinces(herb1, herb2);
    }).catch(err => {
        console.error(err);
        mapEl.innerHTML = '<div style="padding:40px;text-align:center">地图加载失败，请刷新页面重试</div>';
    });
}

function updateStatsAndMapByCategory(category) {
    if (category === 'all') {
        herbProvinceMap.clear();
        provinceHerbMap.clear();
        for (let [k,v] of originalHerbProvinceMap.entries()) herbProvinceMap.set(k, new Set(v));
        for (let [k,v] of originalProvinceHerbMap.entries()) provinceHerbMap.set(k, new Set(v));
    } else {
        let herbsInCat = Object.keys(originalHerbsMaster).filter(name => originalHerbsMaster[name].category === category);
        let newHerbProvinceMap = new Map();
        let newProvinceHerbMap = new Map();
        for (let herb of herbsInCat) {
            let provs = originalHerbProvinceMap.get(herb);
            if (provs) {
                newHerbProvinceMap.set(herb, new Set(provs));
                for (let prov of provs) {
                    if (!newProvinceHerbMap.has(prov)) newProvinceHerbMap.set(prov, new Set());
                    newProvinceHerbMap.get(prov).add(herb);
                }
            }
        }
        herbProvinceMap = newHerbProvinceMap;
        provinceHerbMap = newProvinceHerbMap;
    }
    let totalHerbs = herbProvinceMap.size;
    let totalProvinces = provinceHerbMap.size;
    let totalRecords = 0;
    for (let s of herbProvinceMap.values()) totalRecords += s.size;
    document.getElementById('statsPanel').innerHTML = `
        <div class="stats-card"><strong>${totalHerbs}</strong> 味药材</div>
        <div class="stats-card"><strong>${totalProvinces}</strong> 个产区省</div>
        <div class="stats-card"><strong>${totalRecords}</strong> 产地记录</div>
    `;
    buildSearchIndex();
    if (myChart && shortToFullMap) renderMap();
}

// 省份弹窗、药材详情
function showProvinceHerbList(prov) {
    let herbs = Array.from(provinceHerbMap.get(prov) || []);
    document.getElementById('provinceTitle').innerHTML = prov;
    let html = herbs.map(h => `<div class="herb-item" onclick="openHerbDetail('${h}')"><span>${h}</span></div>`).join('');
    document.getElementById('provinceHerbList').innerHTML = html;
    document.getElementById('provinceModal').classList.add('active');
    document.getElementById('provinceSearch').oninput = (e) => {
        let kw = e.target.value.toLowerCase();
        let filtered = herbs.filter(h => h.includes(kw));
        document.getElementById('provinceHerbList').innerHTML = filtered.map(h => `<div class="herb-item" onclick="openHerbDetail('${h}')">${h}</div>`).join('');
    };
}

function openHerbDetail(herbName) {
    closeProvinceModal();
    let d = herbsMaster[herbName];
    if (!d) return;
    let html = `
        <div class="herb-detail-top">
            <img src="${d.img || 'https://picsum.photos/id/100/200'}" class="herb-img" alt="${herbName}" onerror="this.src='https://picsum.photos/id/100/200'">
            <div class="herb-info">
                <div class="herb-name-large">${herbName}</div>
                <div class="herb-pinyin">${d.pinyin || ''}</div>
                <div><span class="badge">${d.category || '其他'}</span></div>
            </div>
        </div>
        <div class="detail-grid">
            <div class="detail-card"><h4><i class="fas fa-balance-scale"></i> 性味归经</h4><p>${d.property || '暂无信息'}</p></div>
            <div class="detail-card"><h4><i class="fas fa-stethoscope"></i> 功效</h4><p>${d.efficacy || '传统功效请遵医嘱'}</p></div>
            <div class="detail-card"><h4><i class="fas fa-pills"></i> 用法用量</h4><p>${d.dosage || '煎服'}</p></div>
            <div class="detail-card"><h4><i class="fas fa-calendar-alt"></i> 采收时间</h4><p>${d.harvest || '四季'}</p></div>
            <div class="detail-card"><h4><i class="fas fa-map-marker-alt"></i> 主产区</h4><p>${d.mainOrigin || '多省分布'}</p></div>
            <div class="detail-card"><h4><i class="fas fa-trophy"></i> 道地产区</h4><p>${d.daoOrigin || '未指定'}</p></div>
            <div class="detail-card full-width"><h4><i class="fas fa-exclamation-triangle"></i> 用药禁忌</h4><p>${d.taboos || '遵医嘱'}</p></div>
        </div>
    `;
    document.getElementById('herbModalBody').innerHTML = html;
    document.getElementById('herbModal').classList.add('active');
    let currentCategory = document.querySelector('.filter-btn.active')?.dataset.cat || 'all';
    let herbList = Object.keys(herbsMaster).filter(h => currentCategory==='all' || herbsMaster[h]?.category === currentCategory);
    let idx = herbList.indexOf(herbName);
    document.getElementById('prevHerbBtn').onclick = () => { if (idx>0) openHerbDetail(herbList[idx-1]); };
    document.getElementById('nextHerbBtn').onclick = () => { if (idx<herbList.length-1) openHerbDetail(herbList[idx+1]); };
    document.getElementById('collectHerbBtn').onclick = () => { let fav=JSON.parse(localStorage.getItem('favHerbs')||'[]'); if(!fav.includes(herbName)) fav.push(herbName); localStorage.setItem('favHerbs',JSON.stringify(fav)); alert('已收藏'); };
    document.getElementById('shareHerbBtn').onclick = () => { navigator.clipboard.writeText(`本草分享：${herbName} - ${d.efficacy}`); alert('链接已复制'); };
}

function closeHerbModal() { document.getElementById('herbModal').classList.remove('active'); }
function closeProvinceModal() { document.getElementById('provinceModal').classList.remove('active'); }
function closeTipModal() { document.getElementById('tipModal').classList.remove('active'); }
window.closeHerbModal = closeHerbModal;
window.closeProvinceModal = closeProvinceModal;
window.closeTipModal = closeTipModal;

// 对比面板
function initComparePanel() {
    const select1 = document.getElementById('compareHerb1');
    const select2 = document.getElementById('compareHerb2');
    if (!select1 || !select2) return;
    const herbNames = Object.keys(herbsMaster).sort();
    select1.innerHTML = '';
    select2.innerHTML = '';
    herbNames.forEach(name => {
        select1.options.add(new Option(name, name));
        select2.options.add(new Option(name, name));
    });
    select1.value = "甘草";
    select2.value = "黄芪";
    const update = () => {
        const herb1 = select1.value;
        const herb2 = select2.value;
        const resultEl = document.getElementById('compareResult');
        if (!herb1 || !herb2 || herb1 === herb2) {
            resultEl.innerHTML = '<div class="compare-detail-item">请选择两味不同的药材</div>';
            currentHighlightProvinces = [];
            if (myChart && shortToFullMap) renderMap();
            return;
        }
        const h1 = herbsMaster[herb1];
        const h2 = herbsMaster[herb2];
        resultEl.innerHTML = `
            <div class="compare-detail-item"><strong>${herb1}</strong> vs <strong>${herb2}</strong></div>
            <div class="compare-detail-item"><strong>类别：</strong>${h1.category} vs ${h2.category}</div>
            <div class="compare-detail-item"><strong>性味：</strong>${h1.property} vs ${h2.property}</div>
            <div class="compare-detail-item"><strong>功效：</strong>${h1.efficacy} vs ${h2.efficacy}</div>
            <div class="compare-detail-item"><strong>禁忌：</strong>${h1.taboos} vs ${h2.taboos}</div>
            <div class="compare-detail-item"><strong>道地产区：</strong>${h1.daoOrigin || '无'} vs ${h2.daoOrigin || '无'}</div>
        `;
        highlightCompareProvinces(herb1, herb2);
    };
    select1.onchange = update;
    select2.onchange = update;
    document.getElementById('toggleComparePanel').onclick = () => {
        const content = document.getElementById('compareContent');
        const icon = document.getElementById('toggleComparePanel');
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.className = 'fas fa-minus-circle';
        } else {
            content.style.display = 'none';
            icon.className = 'fas fa-plus-circle';
        }
    };
    update();
}

function highlightCompareProvinces(herb1, herb2) {
    const provs1 = Array.from(herbProvinceMap.get(herb1) || []);
    const provs2 = Array.from(herbProvinceMap.get(herb2) || []);
    const newHighlights = [];
    provs1.forEach(p => {
        newHighlights.push({ province: p, borderColor: '#ff6666', fillColor: '#ffeeee' });
    });
    provs2.forEach(p => {
        const existing = newHighlights.find(h => h.province === p);
        if (existing) {
            existing.borderColor = '#aa66ff';
            existing.fillColor = '#eeddff';
        } else {
            newHighlights.push({ province: p, borderColor: '#66cc66', fillColor: '#eeffee' });
        }
    });
    currentHighlightProvinces = newHighlights;
    if (myChart && shortToFullMap) renderMap();
}

// UI 事件绑定
function bindUIEvents() {
    const searchInput = document.getElementById('globalSearch');
    const searchClear = document.getElementById('searchClear');
    const searchDropdown = document.getElementById('searchDropdown');
    
    let debounceTimer;
    function updateSearchDropdown(val) {
        clearTimeout(debounceTimer);
        if (!val.trim()) {
            searchDropdown.classList.remove('show');
            searchClear.style.display = 'none';
            return;
        }
        searchClear.style.display = 'block';
        debounceTimer = setTimeout(() => {
            const result = searchHerbsAndProvinces(val);
            renderSearchDropdown(result);
            searchDropdown.classList.add('show');
        }, 300);
    }
    
    function renderSearchDropdown(result) {
        if (!searchDropdown) return;
        const fragment = document.createDocumentFragment();
        searchDropdown.innerHTML = '';
        if (result.herbs.length) {
            const herbSection = document.createElement('div');
            herbSection.className = 'dropdown-section';
            herbSection.innerHTML = '<div class="dropdown-section-title">🌿 药材</div>';
            result.herbs.forEach(item => {
                const el = document.createElement('div');
                el.className = 'dropdown-item';
                el.setAttribute('data-type', 'herb');
                el.setAttribute('data-name', item.name);
                el.innerHTML = highlightText(item.name, result.keyword) + `<span style="font-size:0.7rem;">${item.desc}</span>`;
                herbSection.appendChild(el);
            });
            fragment.appendChild(herbSection);
        }
        if (result.provinces.length) {
            const provSection = document.createElement('div');
            provSection.className = 'dropdown-section';
            provSection.innerHTML = '<div class="dropdown-section-title">🗺️ 省份</div>';
            result.provinces.forEach(item => {
                const el = document.createElement('div');
                el.className = 'dropdown-item';
                el.setAttribute('data-type', 'province');
                el.setAttribute('data-name', item.name);
                el.innerHTML = highlightText(item.name, result.keyword);
                provSection.appendChild(el);
            });
            fragment.appendChild(provSection);
        }
        if (!result.herbs.length && !result.provinces.length) {
            const noResult = document.createElement('div');
            noResult.className = 'no-result';
            noResult.textContent = '未找到匹配结果';
            fragment.appendChild(noResult);
        }
        searchDropdown.appendChild(fragment);
        document.querySelectorAll('.dropdown-item').forEach(el => {
            el.onclick = (e) => {
                e.stopPropagation();
                const type = el.dataset.type;
                const name = el.dataset.name;
                searchInput.value = name;
                searchDropdown.classList.remove('show');
                searchClear.style.display = 'none';
                if (type === 'herb') openHerbDetail(name);
                else if (type === 'province') showProvinceHerbList(name);
            };
        });
    }
    
    function searchHerbsAndProvinces(keyword) {
        const low = keyword.toLowerCase().trim();
        if (!low) return { herbs: [], provinces: [], keyword: '' };
        const herbScores = new Map();
        for (let item of herbSearchIndex) {
            let score = 0, matchDesc = "";
            if (item.name === low) { score = 100; matchDesc = "精确名称"; }
            else if (item.name.includes(low)) { score = 90; matchDesc = "名称包含"; }
            else if (item.firstLetters === low) { score = 80; matchDesc = "拼音首字母精确"; }
            else if (item.firstLetters && item.firstLetters.startsWith(low)) { score = 70; matchDesc = "拼音首字母前缀"; }
            else if (item.fullPinyin.includes(low)) { score = 60; matchDesc = "拼音包含"; }
            else {
                let matchedTag = item.efficacyTags.find(tag => tag.includes(low));
                if (matchedTag) { score = 40; matchDesc = `功效:${matchedTag}`; }
            }
            if (score > 0 && !herbScores.has(item.name)) herbScores.set(item.name, { score, matchDesc });
        }
        let herbs = Array.from(herbScores.entries()).sort((a,b)=>b[1].score - a[1].score).map(([name, data]) => ({ name, desc: data.matchDesc }));
        let provinces = provinceList.filter(p => p.includes(low)).map(p => ({ name: p, desc: "省份" }));
        return { herbs, provinces, keyword: low };
    }
    
    function highlightText(html, keyword) {
        if (!keyword) return html;
        const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return html.replace(regex, '<mark>$1</mark>');
    }
    
    searchInput.addEventListener('input', (e) => updateSearchDropdown(e.target.value));
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchDropdown.classList.remove('show');
        searchClear.style.display = 'none';
    });
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.classList.remove('show');
        }
    });
    
    document.getElementById('locateMeBtn').onclick = () => {
        if (navigator.geolocation) navigator.geolocation.getCurrentPosition(p => {
            myChart.setOption({ geo: { center: [p.coords.longitude, p.coords.latitude], zoom: 6 } });
        });
    };
    document.getElementById('focusSichuanBtn').onclick = () => {
        myChart.setOption({ geo: { center: [104.06,30.67], zoom: 5.5 } });
    };
    document.getElementById('tipToolBtn').onclick = () => {
        document.getElementById('tipModal').classList.add('active');
        document.getElementById('tipInput').oninput = () => {
            let name = document.getElementById('tipInput').value;
            let d = herbsMaster[name];
            document.getElementById('tipResult').innerHTML = d ? `<div><strong>禁忌</strong>: ${d.taboos}<br><strong>用量</strong>: ${d.dosage}</div>` : '未收录该药材';
        };
    };
    let night = false;
    document.getElementById('nightModeBtn').onclick = () => {
        night = !night;
        document.body.classList.toggle('night', night);
    };
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateStatsAndMapByCategory(btn.dataset.cat);
        };
    });
}

// 启动应用
initData();
