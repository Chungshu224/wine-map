// js/main.js

// 步驟 1: 設定 Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1IjoiY2h1bmdzaHVsZWUiLCJhIjoiY21jZG55ZXQ5MDJwbDJrcTNwM2hndXkwbyJ9.SdP0nM5g3XrCOisigvissw'; 

// 步驟 2: 初始化 Mapbox 地圖
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-v9',
    center: [0.00, 44.80],
    zoom: 8.5
});

map.addControl(new mapboxgl.NavigationControl(), 'top-left');
// map.addControl(new mapboxgl.GeolocateControl({...}), 'top-right');

// 步驟 3: 當地圖完全載入後，添加 GeoJSON 數據和圖層
map.on('load', () => {
    fetch('./data/Bordeaux.geojson')
        .then(response => response.json())
        .then(data => {
            map.addSource('bordeaux-wine-region', {
                'type': 'geojson',
                'data': data
            });
            map.addLayer({
                'id': 'bordeaux-fill',
                'type': 'fill',
                'source': 'bordeaux-wine-region',
                'paint': {
                    'fill-color': '#880808',
                    'fill-opacity': 0.7,
                    'fill-outline-color': '#FFFFFF'
                }
            });
            map.addLayer({
                'id': 'bordeaux-border',
                'type': 'line',
                'source': 'bordeaux-wine-region',
                'paint': {
                    'line-color': '#FFFFFF',
                    'line-width': 2
                }
            });
            console.log('波爾多 GeoJSON 數據和圖層已成功載入！');
            if (data.features && data.features.length > 0) {
                const bbox = turf.bbox(data);
                map.fitBounds(bbox, { padding: 20 });
            } else {
                console.warn('GeoJSON 數據中沒有找到 features，無法自動調整視圖。');
            }
        })
        .catch(error => {
            console.error('載入或解析波爾多 GeoJSON 檔案時發生錯誤:', error);
        });
});
