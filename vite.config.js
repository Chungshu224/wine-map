import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/wine-map/', // 這裡就是你的 repo 名稱，前後要有斜線
  plugins: [vue()]
});
