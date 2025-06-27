// js/main.js

// 步驟 1: 設定 Mapbox Access Token
// 請務必將 'YOUR_MAPBOX_ACCESS_TOKEN' 替換為您自己的 Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1IjoiY2h1bmdzaHVsZWUiLCJhIjoiY21jZG55ZXQ5MDJwbDJrcTNwM2hndXkwbyJ9.SdP0nM5g3XrCOisigvissw'; 

// 步驟 2: 初始化 Mapbox 地圖
const map = new mapboxgl.Map({
    container: 'map', // 地圖容器的 div ID (對應 index.html 中的 <div id="map">)
    style: 'mapbox://styles/mapbox/light-v10', // 您可以選擇其他 Mapbox 樣式，例如 'mapbox://styles/mapbox/streets-v11'
    center: [0.00, 44.80], // 波爾多大致的經緯度 [經度, 緯度]
    zoom: 8.5 // 初始縮放級別，讓波爾多能清晰顯示
});

// 步驟 3: 當地圖完全載入後，添加 GeoJSON 數據和圖層
map.on('load', () => {
    // 載入 GeoJSON 數據
    fetch('./data/Bordeaux.geojson') // 確保路徑正確指向您儲存的 GeoJSON 檔案
        .then(response => response.json())
        .then(data => {
            // 將 GeoJSON 數據添加到 Mapbox 的數據源中
            map.addSource('bordeaux-wine-region', {
                'type': 'geojson',
                'data': data
            });

            // 添加一個填充圖層來顯示波爾多產區的邊界
            map.addLayer({
                'id': 'bordeaux-fill', // 圖層的唯一 ID
                'type': 'fill', // 填充多邊形
                'source': 'bordeaux-wine-region', // 指定數據源
                'paint': {
                    'fill-color': '#880808', // 深紅色填充，代表葡萄酒
                    'fill-opacity': 0.7, // 半透明
                    'fill-outline-color': '#FFFFFF' // 白色邊框
                }
            });

            // 添加一個線條圖層來突出顯示邊界 (可選，讓邊界更明顯)
            map.addLayer({
                'id': 'bordeaux-border',
                'type': 'line',
                'source': 'bordeaux-wine-region',
                'paint': {
                    'line-color': '#FFFFFF', // 白色線條
                    'line-width': 2 // 線條粗細
                }
            });

            console.log('波爾多 GeoJSON 數據和圖層已成功載入！');

            // 調整地圖視角以適應 GeoJSON 的範圍 (可選，但推薦)
            if (data.features && data.features.length > 0) {
                const bbox = turf.bbox(data); // 需要引入 Turf.js 或手動計算 bbox
                map.fitBounds(bbox, {
                    padding: 20 // 邊界填充
                });
            } else {
                 console.warn('GeoJSON 數據中沒有找到 features，無法自動調整視圖。');
            }

        })
        .catch(error => {
            console.error('載入或解析波爾多 GeoJSON 檔案時發生錯誤:', error);
        });
});

// 未來，我們將在這裡添加點擊事件、資訊面板顯示等互動邏輯
