// js/main.js

// 步驟 1: 設定 Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1IjoiY2h1bmdzaHVsZWUiLCJhIjoiY21jZG55ZXQ5MDJwbDJrcTNwM2hndXkwbyJ9.SdP0nM5g3XrCOisigvissw'; 

// --- Google Sheets API 設定 ---
const GOOGLE_SHEET_ID = '1rZj28eOKn2bkzvEsYXCOofxp1DZAkHWt2Yu9xEMTyKg'; // 請替換為您的 Google Sheet ID
const GOOGLE_API_KEY = 'AIzaSyCn4cdaBpY2Fz4SXUMtpMhAN84YvOQACcQ'; // 請替換為您剛剛建立的 Google API 金鑰
const GOOGLE_SHEET_RANGE = 'Sheet1!A:J'; // 根據您的工作表名稱和資料範圍調整 (A:J 表示 A欄到J欄)

// 定義所有子產區 GeoJSON 檔案的路徑和對應的 ID
// 您可以在這裡添加或刪除子產區
const subRegionsConfig = [
    { id: 'Pauillac-AOP_Bordeaux_France', path: './data/Pauillac-AOP_Bordeaux_France.geojson', name: 'Pauillac' },
    { id: 'Barsac-AOP_Bordeaux_France', path: './data/Barsac-AOP_Bordeaux_France.geojson', name: 'Barsac' },
    { id: 'saint_emilion', path: './data/saint_emilion.geojson', name: 'Saint-Émilion' },
    // 根據您準備的 GeoJSON 檔案添加更多子產區
    // { id: 'some_other_subregion', path: './data/some_other_subregion.geojson', name: '另一個子產區' },
];

// 用於儲存從 Google Sheet 載入的葡萄酒產區資料
let wineRegionData = {};

// 函數：從 Google Sheet 載入資料
async function loadWineRegionData() {
    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${GOOGLE_SHEET_RANGE}?key=${GOOGLE_API_KEY}`);
        const data = await response.json();

        // 將陣列數據轉換為以 region_id 為鍵的物件，方便查詢
        if (data.values && data.values.length > 1) { // 確保有標題行和至少一行數據
            const headers = data.values[0]; // 第一行為標題
            const rows = data.values.slice(1); // 從第二行開始是數據

            rows.forEach(row => {
                const region = {};
                headers.forEach((header, index) => {
                    region[header] = row[index];
                });
                if (region.region_id) {
                    wineRegionData[region.region_id] = region;
                }
            });
            console.log('Google Sheet 數據載入成功:', wineRegionData);
        } else {
            console.warn('Google Sheet 中沒有找到有效數據。');
        }
    } catch (error) {
        console.error('載入 Google Sheet 數據時發生錯誤:', error);
    }
}


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
    fetch('./data/bordeaux_main.geojson')
        .then(response => response.json())
        .then(data => {
            map.addSource('bordeaux_main.geojson', {
                'type': 'geojson',
                'data': data
            });
            map.addLayer({
                'id': 'bordeaux-fill',
                'type': 'fill',
                'source': 'bordeaux-main-region',
                'paint': {
                    'fill-color': '#880808',
                    'fill-opacity': 0.1,
                    'fill-outline-color': '#FFFFFF'
                }
            });
            map.addLayer({
                'id': 'bordeaux-border',
                'type': 'line',
                'source': 'bordeaux-main-region',
                'paint': {
                    'line-color': '#FFFFFF',
                    'line-width': 0.5
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
 // --- 點擊事件：處理波爾多總體產區或子產區的點擊 ---
    // 先定義一個函數來顯示彈出視窗內容，避免重複程式碼
    const showRegionPopup = (e, regionId) => {
        if (regionId && wineRegionData[regionId]) {
            const info = wineRegionData[regionId];
            let popupContent = `<h3>${info.name}</h3>`;
            popupContent += `<p>${info.description}</p>`;
            if (info.area_sq_km) {
                popupContent += `<p><strong>葡萄園面積:</strong> ${info.area_sq_km} 公頃</p>`;
            }
            if (info.grape_varieties) {
                popupContent += `<p><strong>主要葡萄品種:</strong> ${info.grape_varieties}</p>`;
            }
            if (info.classification) {
                popupContent += `<p><strong>分類:</strong> ${info.classification}</p>`;
            }
            if (info.notes) {
                popupContent += `<p><strong>備註:</strong> ${info.notes}</p>`;
            }

            if (info.image_url) {
                popupContent += `<img src="${info.image_url}" alt="${info.name}" style="width:100%; max-height:200px; object-fit:cover; margin-top: 10px;">`;
            }
            if (info.video_url) {
                popupContent += `<div style="margin-top: 10px; position: relative; width: 100%; padding-bottom: 56.25%; height: 0;"><iframe src="${info.video_url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>`;
            }

            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(popupContent)
                .addTo(map);
        } else {
            console.warn(`未找到 ID 為 ${regionId} 的產區數據。`);
        }
    };


    // 點擊波爾多總體產區
    map.on('click', 'bordeaux-main-fill', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['bordeaux-main-fill']
        });
        if (features.length) {
            const regionId = features[0].properties.region_id;
            // 只有當子產區被隱藏時才顯示總體產區的 popup，避免重疊
            if (map.getZoom() < 9) { // 這裡的 9 應與 bordeaux-sub-fill 的 'case' 條件一致
                showRegionPopup(e, regionId);
            }
        }
    });

    // 點擊波爾多子產區
    map.on('click', 'bordeaux-sub-fill', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['bordeaux-sub-fill']
        });
        if (features.length) {
            const regionId = features[0].properties.region_id;
            showRegionPopup(e, regionId); // 子產區總會顯示 popup
        }
    });


    // 更改鼠標樣式，指示可點擊
    map.on('mouseenter', 'bordeaux-main-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'bordeaux-main-fill', () => {
        map.getCanvas().style.cursor = '';
    });

    map.on('mouseenter', 'bordeaux-sub-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'bordeaux-sub-fill', () => {
        map.getCanvas().style.cursor = '';
    });
});
