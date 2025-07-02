// 1. Mapbox Token & 資料設定
mapboxgl.accessToken = 'pk.eyJ1IjoiY2h1bmdzaHVsZWUiLCJhIjoiY21ja3B0NHBzMDBxMzJpc2Q3b2Zzam9qYSJ9.9gYjm_VnBH7MYA-e9zKkCw';
let currentStyle = 'mapbox://styles/mapbox/satellite-v9';
const styleMap = {
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  terrain: 'mapbox://styles/mapbox/outdoors-v12'
};
const DATA_BASE = 'https://raw.githubusercontent.com/Chungshu224/wine-map/main/data/';
const mainGeoJSON = 'bordeaux_main.geojson';

// 將所有子產區 GeoJSON 加入此陣列
const subRegions = [
  'Barsac-AOP_Bordeaux_France.geojson',
  'Blaye-AOP_Bordeaux_France.geojson',
  'Bordeaux-AOP_Bordeaux_France.geojson',
  'Canon-Fronsac-AOP_Bordeaux_France.geojson',
  'Cerons-AOP_Bordeaux_France.geojson',
  'Cotes-de-Blaye-AOP_Bordeaux_France.geojson',
  'Cotes-de-Bordeaux-St-Macaire-PDO_Bordeaux_France.geojson',
  'Cotes-de-Bourg-AOP_Bordeaux_France.geojson',
  'Entre-Deux-Mers-AOP_Bordeaux_France.geojson',
  'Fronsac-AOP_Bordeaux_France.geojson',
  'Graves-AOP_Bordeaux_France.geojson',
  'Graves-Superieures-AOP_Bordeaux_France.geojson',
  'Graves-of-Vayres-AOP_Bordeaux_France.geojson',
  'Haut-Medoc-AOP_Bordeaux_France.geojson',
  'Lalande-de-Pomerol-AOP_Bordeaux_France.geojson',
  'Listrac-Medoc-AOP_Bordeaux_France.geojson',
  'Loupiac-AOP_Bordeaux_France.geojson',
  'Lussac-St-Emilion-AOP_Bordeaux_France.geojson',
  'Margaux-AOP_Bordeaux_France.geojson',
  'Medoc-AOP_Bordeaux_France.geojson',
  'Moulis-en-Medoc-AOP_Bordeaux_France.geojson',
  'Pauillac-AOP_Bordeaux_France.geojson',
  'Pessac-Leognan-AOP_Bordeaux_France.geojson',
  'Pomerol-AOP_Bordeaux_France.geojson',
  'Puisseguin-St-Emilion-AOP_Bordeaux_France.geojson',
  'Sauternes-PDO_Bordeaux_France.geojson',
  'St-Croix-du-Mont-AOP_Bordeaux_France.geojson',
  'St-Emilion-AOP_Bordeaux_France.geojson',
  'St-Emilion-Grand-Cru-AOP_Bordeaux_France.geojson',
  'St-Estephe-AOP_Bordeaux_France.geojson',
  'St-Foy-Bordeaux-AOP_Bordeaux_France.geojson',
  'St-Georges-St-Emilion-AOP_Bordeaux_France.geojson',
  'St-Julien-AOP_Bordeaux_France.geojson'
];
let map;
let selectedRegion = null;
const colorMap = {};
const regionDataList = [];

// 初始化地圖
initMap();

async function initMap() {
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-v9',
    center: [0, 44.8],
    zoom: 8.5
  });

  map.addControl(new mapboxgl.NavigationControl(), 'top-left');

  map.on('click', e => {
    const features = map.queryRenderedFeatures(e.point);
    const inRegion = features.find(f => f.layer.id.endsWith('-fill'));
    if (!inRegion && selectedRegion) {
      selectedRegion = null;
      resetRegionStyle();
      const bounds = turf.bbox(map.getSource('bordeaux-main')._data);
      map.fitBounds(bounds, { padding: 40 });
    }
  });

  map.on('load', async () => {
    // 主區域載入
    const mainData = await fetch(DATA_BASE + mainGeoJSON).then(r => r.json());
    map.addSource('bordeaux-main', { type: 'geojson', data: mainData });
    map.addLayer({
      id: 'main-fill',
      type: 'fill',
      source: 'bordeaux-main',
      paint: { 'fill-color': '#880808', 'fill-opacity': 0.1 }
    });
    map.fitBounds(turf.bbox(mainData), { padding: 40 });

    // 預載所有子區域
    for (const file of subRegions) {
      const id = file.replace('.geojson', '');
      const label = formatLabel(id);
      const geojson = await fetch(DATA_BASE + file).then(r => r.json());
      const area = turf.area(geojson);
      const color = generateColor(id);

      regionDataList.push({ id, label, geojson, area, color });
      colorMap[id] = { label, color };
    }

    // 面積大→小排列（大的在底層）
    regionDataList.sort((a, b) => b.area - a.area);

    for (const r of regionDataList) {
      map.addSource(r.id, { type: 'geojson', data: r.geojson });

      map.addLayer({
        id: `${r.id}-fill`,
        type: 'fill',
        source: r.id,
        paint: {
          'fill-color': r.color,
          'fill-opacity': [
            'interpolate', ['linear'], ['zoom'],
            8, 0.05,
            10, 0.4,
            12, 0.8
          ]
        }
      });

      map.addLayer({
        id: `${r.id}-border`,
        type: 'line',
        source: r.id,
        paint: { 'line-color': '#fff', 'line-width': 1 }
      });

      map.on('click', `${r.id}-fill`, () => focusRegion(r.id));
    }

    initSidebar();
    initSearch();
  });
}

// 點擊產區：高亮並聚焦
function focusRegion(id) {
  selectedRegion = id;

  regionDataList.forEach(r => {
    const op = r.id === id ? 0.8 : 0;
    map.setPaintProperty(`${r.id}-fill`, 'fill-opacity', op);
  });

  const src = map.getSource(id);
  const bounds = turf.bbox(src._data);
  const center = turf.center(src._data).geometry.coordinates;

  map.fitBounds(bounds, { padding: 40 });
  new mapboxgl.Popup()
    .setLngLat(center)
    .setHTML(`<h3>${colorMap[id].label}</h3>`)
    .addTo(map);
}

// 清除選取，恢復所有透明度
function resetRegionStyle() {
  regionDataList.forEach(r => {
    map.setPaintProperty(`${r.id}-fill`, 'fill-opacity', [
      'interpolate', ['linear'], ['zoom'],
      8, 0.05,
      10, 0.4,
      12, 0.8
    ]);
  });
}

// 側邊欄功能
function initSidebar() {
  const ul = document.getElementById('region-list');
  if (!ul) return;

  ul.innerHTML = `<li data-id="main-fill">
    <span class="color-block" style="background:#880808"></span> 波爾多總區
  </li>`;

  regionDataList.forEach(r => {
    ul.innerHTML += `<li data-id="${r.id}-fill">
      <span class="color-block" style="background:${r.color}"></span> ${r.label}
    </li>`;
  });

  ul.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      const id = li.dataset.id.replace('-fill', '');
      if (id === 'main') {
        selectedRegion = null;
        resetRegionStyle();
        const bounds = turf.bbox(map.getSource('bordeaux-main')._data);
        map.fitBounds(bounds, { padding: 40 });
      } else {
        focusRegion(id);
      }
    });
  });
}

// 搜尋產區
function initSearch() {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.top = '15px';
  wrapper.style.left = '270px';
  wrapper.style.zIndex = '1000';
  wrapper.innerHTML = `
    <input id="search-box" type="text"
      placeholder="搜尋產區..."
      style="padding:6px; font-size:13px; width:180px; border-radius:4px; border:1px solid #ccc;">
  `;
  document.body.appendChild(wrapper);

  const box = document.getElementById('search-box');
  box.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const keyword = e.target.value.trim().toLowerCase();
      const match = regionDataList.find(r =>
        r.label.toLowerCase().includes(keyword)
      );
      if (match) {
        focusRegion(match.id);
      } else {
        alert('找不到相符的產區');
      }
    }
  });
}

// 工具函式
function formatLabel(str) {
  return str
    .replace(/-AOP_Bordeaux_France$/i, '')
    .replace(/-PDO_Bordeaux_France$/i, '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ');
}

function generateColor(str) {
  let hash = 0;
  for (let c of str) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return `hsl(${hash % 360}, 65%, 60%)`;
}


