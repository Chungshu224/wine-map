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

const colorMap = {};
let map;
let selectedSubRegion = null;
const colorMap = {}; // { id: { color, label } }

loadMap(currentStyle);
loadMap();

// 3. 建立地圖函式
function loadMap(styleURL) {
  if (map) map.remove(); // 若已有地圖就移除
function loadMap() {
  map = new mapboxgl.Map({
    container: 'map',
    style: styleURL,
    style: 'mapbox://styles/mapbox/satellite-v9',
    center: [0.0, 44.80],
    zoom: 8.5
  });

  map.addControl(new mapboxgl.NavigationControl(), 'top-left');

  map.on('click', e => {
    const features = map.queryRenderedFeatures(e.point);
    const clicked = features.find(f => f.layer.id.endsWith('-fill'));
    if (!clicked && selectedSubRegion) {
      selectedSubRegion = null;
      resetSubRegionStyle();
      const mainBounds = turf.bbox(map.getSource('bordeaux-main')._data);
      map.fitBounds(mainBounds, { padding: 40 });
    }
  });

  map.on('load', async () => {
    const mainData = await fetch(DATA_BASE + mainGeoJSON).then(r => r.json());
    map.addSource('bordeaux-main', { type: 'geojson', data: mainData });

    map.addLayer({
      id: 'main-fill',
      type: 'fill',
      source: 'bordeaux-main',
      paint: { 'fill-color': '#880808', 'fill-opacity': 0.1 }
    });

    const bbox = turf.bbox(mainData);
    map.fitBounds(bbox, { padding: 30 });
    map.fitBounds(turf.bbox(mainData), { padding: 40 });

    await Promise.all(subRegions.map(loadSubRegion));
    initSidebar();
    initSearchBox();
  });
}

async function loadSubRegion(filename) {
  const id = filename.replace('.geojson','');
  const data = await fetch(DATA_BASE + filename).then(r => r.json());
  const regionId = data.features?.[0]?.properties?.region_id || id;
async function loadSubRegion(file) {
  const id = file.replace('.geojson', '');
  const label = id
    .replace(/-AOP_Bordeaux_France$/i, '')
    .replace(/-PDO_Bordeaux_France$/i, '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ');
  const color = generateColor(id);
  colorMap[id] = { color, regionId };
  colorMap[id] = { color, label };

  const data = await fetch(DATA_BASE + file).then(r => r.json());
  map.addSource(id, { type: 'geojson', data });

  map.addLayer({
    id: `${id}-fill`,
    type: 'fill',
    source: id,
    paint: {
      'fill-color': color,
      'fill-opacity': ['case', ['>=', ['zoom'], 9], 0.4, 0]
      'fill-opacity': [
        'interpolate', ['linear'], ['zoom'],
        8, 0.05,
        10, 0.4,
        12, 0.8
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
      .setHTML(`<h3>${props.region_id || 'Unknown Region'}</h3>`)
      .addTo(map);
  map.on('click', `${id}-fill`, () => focusRegion(id));
}

function focusRegion(id) {
  selectedSubRegion = id;
  subRegions.forEach(file => {
    const otherId = file.replace('.geojson', '');
    const opacity = (otherId === id) ? 0.8 : 0;
    map.setPaintProperty(`${otherId}-fill`, 'fill-opacity', opacity);
  });

  map.on('mouseenter', `${id}-fill`, () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', `${id}-fill`, () => map.getCanvas().style.cursor = '');
  const bounds = turf.bbox(map.getSource(id)._data);
  map.fitBounds(bounds, { padding: 40 });

  const center = turf.center(map.getSource(id)._data).geometry.coordinates;
  new mapboxgl.Popup()
    .setLngLat(center)
    .setHTML(`<h3>${colorMap[id].label}</h3>`)
    .addTo(map);
}

function resetSubRegionStyle() {
  subRegions.forEach(file => {
    const id = file.replace('.geojson','');
    map.setPaintProperty(`${id}-fill`, 'fill-opacity', [
      'interpolate', ['linear'], ['zoom'],
      8, 0.05,
      10, 0.4,
      12, 0.8
    ]);
  });
}

function initSidebar() {
  const ul = document.getElementById('region-list');
  ul.innerHTML = `<li data-id="main-fill"><span class="color-block" style="background:#880808"></span> 波爾多總區</li>`;
  subRegions.forEach(filename => {
    const id = filename.replace('.geojson','');
    const info = colorMap[id];
  if (!ul) return;

  ul.innerHTML = `<li data-id="main-fill">
    <span class="color-block" style="background:#880808"></span> 波爾多總區
  </li>`;

  subRegions.forEach(file => {
    const id = file.replace('.geojson','');
    const { color, label } = colorMap[id];
    ul.innerHTML += `<li data-id="${id}-fill">
      <span class="color-block" style="background:${info.color}"></span>
      ${info.regionId}
      <span class="color-block" style="background:${color}"></span>
      ${label}
    </li>`;
  });

  ul.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      const layer = li.dataset.id;
      const src = map.getSource(layer.replace('-fill',''));
      if (!src) return;
      const bounds = turf.bbox(src._data);
      map.fitBounds(bounds, { padding: 40 });

      setTimeout(() => {
        const center = turf.center(src._data).geometry.coordinates;
        new mapboxgl.Popup()
          .setLngLat(center)
          .setHTML(`<h3>${colorMap[layer.replace('-fill','')].regionId}</h3>`)
          .addTo(map);
      }, 500);
      const id = layer.replace('-fill','');
      if (!map.getSource(id)) return;
      focusRegion(id);
    });
  });
}

// 顏色生成：固定但分散
function generateColor(id) {
function initSearchBox() {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '15px';
  container.style.left = '270px';
  container.style.zIndex = '999';
  container.innerHTML = `
    <input id="search-box" type="text"
      placeholder="搜尋產區..."
      style="padding:6px; font-size:13px; width:180px; border-radius:4px; border:1px solid #ccc;">
  `;
  document.body.appendChild(container);

  const input = document.getElementById('search-box');
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const keyword = e.target.value.trim().toLowerCase();
      const match = Object.entries(colorMap).find(([id, obj]) =>
        obj.label.toLowerCase().includes(keyword)
      );
      if (match) {
        const [id] = match;
        focusRegion(id);
      } else {
        alert('找不到符合的產區名稱');
      }
    }
  });
}

function generateColor(str) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${hash % 360}, 60%,
  for (let c of str) hash = c.charCodeAt(0) + ((hash << 5) - hash);Add commentMore actions
  return `hsl(${hash % 360}, 65%, 60%)`;
}
document.getElementById('toggle-sidebar').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
  map.resize(); // 重新調整地圖尺寸
});
