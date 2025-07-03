<template>
  <div></div> <!-- 地圖圖層不直接渲染 DOM，由 Mapbox 控管 -->
</template>

<script setup>
import { onMounted, watch } from 'vue';
import mapboxgl from 'mapbox-gl';
import { props } from './aocLayerProps';

defineProps(props);

watch(() => geojson, (newData) => {
  if (map && map.getSource(layerId)) {
    map.getSource(layerId).setData(newData);
  }
});

onMounted(() => {
  if (!map || !geojson) return;

  // 加入資料來源
  map.addSource(layerId, {
    type: 'geojson',
    data: geojson
  });

  // 加入填色圖層
  map.addLayer({
    id: layerId,
    type: 'fill',
    source: layerId,
    paint: {
      'fill-color': color,
      'fill-opacity': 0.5,
      'fill-outline-color': outlineColor
    }
  });

  // Hover 效果
  map.on('mouseenter', layerId, () => {
    map.getCanvas().style.cursor = 'pointer';
    map.setPaintProperty(layerId, 'fill-opacity', 0.7);
  });

  map.on('mouseleave', layerId, () => {
    map.getCanvas().style.cursor = '';
    map.setPaintProperty(layerId, 'fill-opacity', 0.5);
  });

  // 點擊事件
  map.on('click', layerId, (e) => {
    const props = e.features[0].properties;
    const coords = e.lngLat;

    new mapboxgl.Popup()
      .setLngLat(coords)
      .setHTML(`
        <h3>${props.name}</h3>
        <p><strong>主要葡萄：</strong> ${props.main_grape}</p>
        <p><strong>代表風格：</strong> ${props.style}</p>
        <p><strong>知名酒莊：</strong><br>${
