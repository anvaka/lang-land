const hostName = window.location.hostname;
const isDev = hostName !== 'anvaka.github.io';
const server = isDev ? `http://${hostName}:8080/` : 'https://anvaka.github.io/lang-land-data/';
const params = new URLSearchParams(window.location.search);
const version = params.get('v') || 'hsk/v1';

export default {
  serverUrl: server + version + '/',
  // vectorTilesSource: 'http://192.168.86.79:8082/data/cities.json',
  glyphsSource:  'https://anvaka.github.io/map-of-github-data/fonts/{fontstack}/{range}.pbf',
  /**
   * Defines outline of the countries
   */
  bordersSource: `${server}${version}/borders.geojson`,

  /**
   * These are our words on the map.
   */
  pointsSource: `${server}${version}/points.geojson`,

  /**
   * Country names.
   */
  placesSource: `${server}${version}/places.geojson`,

  /**
   * Roads data, used for the roads layer.
   */
  roadsSource: `${server}${version}/roads.geojson`,

  /**
   * Regions boundaries within country (voronoi polygons).
   */
  regionsSource: `${server}${version}/regions.geojson`,

  /**
   * Images under the regions.
   */
  rasterTilesSource: `${server}${version}/tiles/{z}/{x}/{y}.webp`,

  /**
   * Graph file contains all relationships between words.
   */
  graphFileUrl: `${server}${version}/graph.dot`,

  /**
   * Main definition of the words (key = word, value = definition).
   */
  flashcardsUrl: `${server}${version}/flashcards.json`,

  cardsFolder: `${server}${version}/cards/`,

  /**
   * Images folder contains all images used in the flashcards.
   */
  imagesFolder: `${server}${version}/images_optimized/`,
};