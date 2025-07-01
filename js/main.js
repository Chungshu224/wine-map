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
let map;

loadMap(currentStyle);

// 3. 建立地圖函式
function loadMap(styleURL) {
  if (map) map.remove(); // 若已有地圖就移除
  map = new mapboxgl.Map({
    container: 'map',
    style: styleURL,
    center: [0.0, 44.80],
    zoom: 8.5
  });
  map.addControl(new mapboxgl.NavigationControl(), 'top-left');

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

    await Promise.all(subRegions.map(loadSubRegion));
    initSidebar();
  });
}

async function loadSubRegion(filename) {
  const id = filename.replace('.geojson','');
  const data = await fetch(DATA_BASE + filename).then(r => r.json());
  const regionId = data.features?.[0]?.properties?.region_id || id;
  const color = generateColor(id);
  colorMap[id] = { color, regionId };

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

  map.on('click', `${id}-fill`, e => {
    const props = e.features[0].properties;
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`<h3>${props.region_id || 'Unknown Region'}</h3>`)
      .addTo(map);
  });

  map.on('mouseenter', `${id}-fill`, () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', `${id}-fill`, () => map.getCanvas().style.cursor = '');
}

function initSidebar() {
  const ul = document.getElementById('region-list');
  ul.innerHTML = `<li data-id="main-fill"><span class="color-block" style="background:#880808"></span> 波爾多總區</li>`;
  subRegions.forEach(filename => {
    const id = filename.replace('.geojson','');
    const info = colorMap[id];
    ul.innerHTML += `<li data-id="${id}-fill">
      <span class="color-block" style="background:${info.color}"></span>
      ${info.regionId}
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
    });
  });
}

// 顏色生成：固定但分散
function generateColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${hash % 360}, 60%,
