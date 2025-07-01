// 1. Mapbox Token & 資料設定
mapboxgl.accessToken = 'pk.eyJ1IjoiY2h1bmdzaHVsZWUiLCJhIjoiY21ja3B0NHBzMDBxMzJpc2Q3b2Zzam9qYSJ9.9gYjm_VnBH7MYA-e9zKkCw';
const DATA_BASE = 'https://chungshu224.github.io/wine-map/wine-map/main/data/';
const mainGeoJSON = 'bordeaux_main.geojson';
const subRegions = [
  'Pauillac-AOP_Bordeaux_France.geojson',
  'Barsac-AOP_Bordeaux_France.geojson',
  'saint_emilion.geojson'
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
