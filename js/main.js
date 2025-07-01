// 1. Mapbox Token & 資料設定
mapboxgl.accessToken = 'pk.eyJ1IjoiY2h1bmdzaHVsZWUiLCJhIjoiY21ja3B0NHBzMDBxMzJpc2Q3b2Zzam9qYSJ9.9gYjm_VnBH7MYA-e9zKkCw';
const DATA_BASE = 'https://raw.githubusercontent.com/Chungshu224/wine-map/main/data/';
const mainGeoJSON = 'bordeaux_main.geojson';

// 將所有子產區 GeoJSON 加入此陣列
const subRegions = [
  'Barsac-AOP_Bordeaux_France.geojson',
  'Blaye-AOP_Bordeaux_France.geojson',
  'Bordeaux-AOP_Bordeaux_France.geojson',
  'Bordeaux-Superior-AOP_Bordeaux_France.geojson',
  'Canon-Fronsac-AOP_Bordeaux_France.geojson',
  'Cerons-AOP_Bordeaux_France.geojson',
  'Cotes-de-Blaye-AOP_Bordeaux_France.geojson',
  'Cotes-de-Bordeaux-PDO_Bordeaux_France.geojson',
  'Cotes-de-Bordeaux-St-Macaire-PDO_Bordeaux_France.geojson',
  'Cotes-de-Bourg-AOP_Bordeaux_France.geojson',
  'Cremant-de-Bordeaux-AOP_Bordeaux_France.geojson',
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

// 用來快取所有 geojson 資料
const geojsonCache = {};

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
  // 檢查 turf 是否已引入
  if (typeof turf === 'undefined') {
    alert('Turf.js 尚未載入，請於 HTML 引入 https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js');
    return;
  }

  const mainData = await fetch(DATA_BASE + mainGeoJSON).then(r => r.json());
  // 快取主區域 geojson
  geojsonCache['bordeaux-main'] = mainData;

  map.addSource('bordeaux-main', { type: 'geojson', data: mainData });

  map.addLayer({
    id: 'main-fill',
    type: 'fill',
    source: 'bordeaux-main',
    paint: { 'fill-color': '#880808', 'fill-opacity': 0.1 }
  });

  const bbox = turf.bbox(mainData);
  map.fitBounds(bbox, { padding: 20 });

  // 依 subRegions 動態載入所有子產區
  await Promise.all(subRegions.map(addSubRegion));

  // 初始化側邊欄導航
  initSidebar();
});

// 4. 動態載入並新增子產區圖層
async function addSubRegion(filename) {
  try {
    const id = filename.replace('.geojson', '');
    const data = await fetch(DATA_BASE + filename).then(r => r.json());
    geojsonCache[id] = data;

    map.addSource(id, { type: 'geojson', data });

    map.addLayer({
      id: `${id}-fill`,
      type: 'fill',
      source: id,
      paint: {
        'fill-color': randomColor(id),
        'fill-opacity': [
          'case',
          ['>=', ['zoom'], 9], 0.4, 0
        ]
      }
    });

    map.addLayer({
      id: `${id}-border`,
      type: 'line',
      source: id,
      paint: { 'line-color': '#fff', 'line-width': 1 }
    });

    map.on('click', `${id}-fill`, e => {
      const props = e.features[0].properties;
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<h3>${props?.name || ''}</h3><p>${props?.description || ''}</p>`)
        .addTo(map);
    });

    map.on('mouseenter', `${id}-fill`, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', `${id}-fill`, () => {
      map.getCanvas().style.cursor = '';
    });
  } catch (err) {
    // 若 geojson 檔案載入失敗
    console.error(`載入 ${filename} 失敗`, err);
  }
}

// 5. 生成側邊欄列表並綁定焦點功能
function initSidebar() {
  const listEl = document.getElementById('region-list');
  if (!listEl) {
    console.warn('找不到 region-list 元素');
    return;
  }

  listEl.innerHTML = ''; // 清空舊內容
  listEl.innerHTML += `<li data-id="main-fill">波爾多總區</li>`;
  subRegions.forEach(f => {
    const id = f.replace('.geojson', '');
    const label = id.replace(/-/g, ' ');
    listEl.innerHTML += `<li data-id="${id}-fill">${label}</li>`;
  });

  listEl.querySelectorAll('li').forEach(item => {
    item.addEventListener('click', () => {
      const layer = item.dataset.id;
      const id = layer.replace('-fill', '');
      const data = id === 'main' ? geojsonCache['bordeaux-main'] : geojsonCache[id];
      if (!data) return;

      // 取得中心點
      let center;
      try {
        center = turf.centerOfMass(data).geometry.coordinates;
      } catch (e) {
        // centerOfMass 失敗 fallback 用 bbox centroid
        const bbox = turf.bbox(data);
        center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
      }
      map.flyTo({ center, zoom: layer === 'main-fill' ? 8.5 : 11 });
    });
  });
}

// 6. 依圖層 ID 產生顏色（同一名稱永遠同色）
function randomColor(str) {
  let hash = 0;
  for (let c of str) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return `hsl(${(hash % 360 + 360) % 360}, 60%, 50%)`;
}
