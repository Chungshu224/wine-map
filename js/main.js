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
// 2. 建立地圖
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-v9',
  center: [0.0, 44.80],
  zoom: 8.5
});
map.addControl(new mapboxgl.NavigationControl(), 'top-left');

// 3. 載入主區域並 fitBounds
map.on('load', async () => {
  const mainData = await fetch(DATA_BASE + mainGeoJSON).then(r => r.json());
  map.addSource('bordeaux-main', { type: 'geojson', data: mainData });

  map.addLayer({
    id: 'main-fill',
    type: 'fill',
    source: 'bordeaux-main',
    paint: { 'fill-color': '#880808', 'fill-opacity': 0.1 }
  });

  // 自動調整到主區域範圍
  const bbox = turf.bbox(mainData);
  map.fitBounds(bbox, { padding: 20 });

  // 同步載入子產區
  await Promise.all(subRegions.map(addSubRegion));

  // 初始化側邊欄
  initSidebar();
});

// 4. 動態載入並新增子產區圖層
async function addSubRegion(filename) {
  const id = filename.replace('.geojson', '');
  const data = await fetch(DATA_BASE + filename).then(r => r.json());

  map.addSource(id, { type: 'geojson', data });

  map.addLayer({
    id: `${id}-fill`,
    type: 'fill',
    source: id,
    paint: {
      'fill-color': randomColor(id),
      'fill-opacity': [
        'case',
        ['>=', ['zoom'], 9],
        0.4,
        0
      ]
    }
  });

  map.addLayer({
    id: `${id}-border`,
    type: 'line',
    source: id,
    paint: { 'line-color': '#fff', 'line-width': 1 }
  });

  // 點擊顯示 Popup
  map.on('click', `${id}-fill`, e => {
    const props = e.features[0].properties;
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`<h3>${props.name}</h3><p>${props.description}</p>`)
      .addTo(map);
  });

  // 滑鼠樣式
  map.on('mouseenter', `${id}-fill`, () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', `${id}-fill`, () => {
    map.getCanvas().style.cursor = '';
  });
}

// 5. 生成側邊欄列表並綁定焦點功能
function initSidebar() {
  const listEl = document.getElementById('region-list');

  // 主產區
  listEl.innerHTML += `<li data-id="main-fill">波爾多總區</li>`;

  // 子產區
  subRegions.forEach(f => {
    const id = f.replace('.geojson', '');
    const label = id.replace(/-/g, ' ');
    listEl.innerHTML += `<li data-id="${id}-fill">${label}</li>`;
  });

  listEl.querySelectorAll('li').forEach(item => {
    item.addEventListener('click', () => {
      const layer = item.dataset.id;
      const source = map.getSource(layer.replace('-fill', ''));
      if (!source) return;

      // 讀取 GeoJSON 計算中心
      const data = source._data;
      const center = turf.centerOfMass(data).geometry.coordinates;
      map.flyTo({ center, zoom: layer === 'main-fill' ? 8.5 : 11 });
    });
  });
}

// 6. 依圖層 ID 產生顏色
function randomColor(str) {
  let hash = 0;
  for (let c of str) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return `hsl(${hash % 360}, 60%, 50%)`;
}

