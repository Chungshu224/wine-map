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

// 存放每個區塊的顏色
const colorMap = {};

// 2. 建立地圖
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-v9',
  center: [0.0, 44.80],
  zoom: 8.5
});
map.addControl(new mapboxgl.NavigationControl(), 'top-left');

// 3. 側邊欄收合按鈕
document.getElementById('toggle-sidebar').addEventListener('click', () => {
  const sb = document.getElementById('sidebar');
  sb.classList.toggle('collapsed');
  map.resize();  // 收合後重設 map 尺寸
});

// 4. 地圖載入後：主區 + 子區 + 側邊欄
map.on('load', async () => {
  // 主產區
  const mainData = await fetch(DATA_BASE + mainGeoJSON).then(r => r.json());
  map.addSource('bordeaux-main', { type: 'geojson', data: mainData });
  map.addLayer({
    id: 'main-fill',
    type: 'fill',
    source: 'bordeaux-main',
    paint: { 'fill-color': '#880808', 'fill-opacity': 0.1 }
  });
  map.fitBounds(turf.bbox(mainData), { padding: 20 });

  // 動態載入所有子產區
  await Promise.all(subRegions.map(addSubRegion));

  // 建立側邊欄列表
  initSidebar();
});

// 5. 載入並繪製單一子產區
async function addSubRegion(filename) {
  const id = filename.replace('.geojson', '');
  const data = await fetch(DATA_BASE + filename).then(r => r.json());

  // 隨機但固定的顏色
  const color = randomColor(id);
  colorMap[id] = color;

  map.addSource(id, { type: 'geojson', data });
  map.addLayer({
    id: `${id}-fill`,
    type: 'fill',
    source: id,
    paint: {
      'fill-color': color,
      'fill-opacity': ['case', ['>=', ['zoom'], 9], 0.4, 0]
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
    const p = e.features[0].properties;
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`<h3>${p.name}</h3><p>${p.description}</p>`)
      .addTo(map);
  });

  // 滑鼠手勢
  map.on('mouseenter', `${id}-fill`, () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', `${id}-fill`, () => {
    map.getCanvas().style.cursor = '';
  });
}

// 6. 側邊欄：列表＋點擊飛航
function initSidebar() {
  const ul = document.getElementById('region-list');
  ul.innerHTML  = `<li data-id="main-fill">
                     <span class="color-block" style="background:#880808"></span>
                     波爾多總區
                   </li>`;

  subRegions.forEach(file => {
    const id = file.replace('.geojson','');
    const lbl = id.replace(/-/g,' ');
    ul.innerHTML += `<li data-id="${id}-fill">
                       <span class="color-block" style="background:${colorMap[id]}"></span>
                       ${lbl}
                     </li>`;
  });

  ul.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      const layer = li.dataset.id;
      const src   = map.getSource(layer.replace('-fill',''));
      if (!src) return;
      const center = turf.centerOfMass(src._data).geometry.coordinates;
      map.flyTo({ center, zoom: layer==='main-fill'?8.5:11 });
    });
  });
}

// 7. 產生固定顏色
function randomColor(str) {
  let h=0;
  for (let c of str) h = c.charCodeAt(0) + ((h<<5)-h);
  return `hsl(${h%360},60%,50%)`;
}

