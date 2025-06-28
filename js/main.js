// js/main.js

// 步驟 1: 設定 Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1IjoiY2h1bmdzaHVsZWUiLCJhIjoiY21jZG55ZXQ5MDJwbDJrcTNwM2hndXkwbyJ9.SdP0nM5g3XrCOisigvissw'; 

// --- Google Sheets API 設定 ---
const GOOGLE_SHEET_ID = '1rZj28eOKn2bkzvEsYXCOofxp1DZAkHWt2Yu9xEMTyKg'; // 請替換為您的 Google Sheet ID
const GOOGLE_API_KEY = 'AIzaSyCn4cdaBpY2Fz4SXUMtpMhAN84YvOQACcQ'; // 請替換為您剛剛建立的 Google API 金鑰
const GOOGLE_SHEET_RANGE = 'Sheet1!A:J'; // 根據您的工作表名稱和資料範圍調整 (A:J 表示 A欄到J欄)

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
