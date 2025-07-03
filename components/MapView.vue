<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import mapboxgl from 'mapbox-gl';
import AOCPolygon from './AOCPolygon.vue';

const mapContainer = ref(null);
let map;

mapboxgl.accessToken = 'pk.eyJ1IjoiY2h1bmdzaHVsZWUiLCJhIjoiY21ja3B0NHBzMDBxMzJpc2Q3b2Zzam9qYSJ9.9gYjm_VnBH7MYA-e9zKkCw';

onMounted(() => {
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/light-v10',
    center: [ -0.57918, 44.837789 ],
    zoom: 9
  });

  map.on('load', () => {
    AOCPolygon(map); // 呼叫載入 AOC 的函式
  });
});
</script>

<style>
.map-container {
  width: 100%;
  height: 100vh;
}
</style>
