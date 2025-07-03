<template>
  <div class="sidebar" v-if="aoc">
    <header>
      <h2>{{ aoc.name }}</h2>
      <button @click="closeSidebar">✕</button>
    </header>
    <section>
      <p><strong>主要葡萄：</strong> {{ aoc.main_grape }}</p>
      <p><strong>代表風格：</strong> {{ aoc.style }}</p>
      <p><strong>風味筆記：</strong> {{ aoc.flavor_notes }}</p>
      <p><strong>知名酒莊：</strong></p>
      <ul>
        <li v-for="chateau in aoc.notable_chateaux" :key="chateau">{{ chateau }}</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
defineProps({
  aoc: Object
});
const emit = defineEmits(['close']);
function closeSidebar() {
  emit('close');
}
</script>

<style scoped>
.sidebar {
  position: absolute;
  top: 0;
  left: 0;
  width: 300px;
  height: 100%;
  background-color: #f8f4f0;
  padding: 20px;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  overflow-y: auto;
  z-index: 10;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}
</style>
