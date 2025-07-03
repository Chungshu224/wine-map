export const props = {
  map: Object,
  geojson: Object,
  layerId: {
    type: String,
    default: 'aoc-layer'
  },
  color: {
    type: String,
    default: '#8B0000'
  },
  outlineColor: {
    type: String,
    default: '#FFFFFF'
  }
};
