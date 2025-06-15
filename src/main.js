import './style.css';
import maplibregl from 'maplibre-gl'
import { getInitialMapStyle } from './mapStyles';
import { sidebar } from './sidebar';
import { aboutModal } from './aboutModal';
import { wordStats, statsModal } from './wordStats';
import highlightNodeWithNeighbors from './highlightNodeWithNeighbors';
import config from './config.js';


// Track regions and features
let regionFeatureIds = {};
let allRegionFeaturesStore = null; // Store all region features for lookup
let graph;

// Initialize the app with a map container
document.querySelector('#app').innerHTML = `
  <div id="map"></div>
  <div class='control-buttons'>
    <button class="stats-button" aria-label="View learning progress">Stats</button>
    <button class="about-button" aria-label="About HSK Land">About</button>
  </div>
`

// Initialize UI buttons
const aboutButton = document.querySelector('.about-button');
aboutButton.addEventListener('click', () => aboutModal.open());

const statsButton = document.querySelector('.stats-button');
statsButton.addEventListener('click', () => statsModal.open());

// Initialize modals
statsModal.init(openWordFromStatsPanel);

// Initialize the map
const map = new maplibregl.Map({
  container: 'map',
  style: getInitialMapStyle(),
  center: [0, 0],
  zoom: 2.0,
  minZoom: 2.0,
  hash: true,
});
map.touchZoomRotate.disableRotation();

// Load and add all GeoJSON files to the map
map.on('load', () => {
  setupMapInteractions(map);
  setupRegionLoading(map);
});

function setupMapInteractions(map) {
  map.on('mouseenter', 'label-layer', () => { map.getCanvas().style.cursor = 'pointer' })
  map.on('mouseleave', 'label-layer', () => { map.getCanvas().style.cursor = '' })
  
  // Single click handler for all interactive layers to prevent duplicate events
  map.on('click', (e) => {
    // Query all interactive layers at the clicked point
    const features = map.queryRenderedFeatures(e.point, { 
      layers: ['label-layer', 'region-fill-layer'] 
    });
    
    if (features.length > 0) {
      // Process only the topmost feature (index 0)
      handleCircleClick({ features: [features[0]] }, map);
    }
  });
}

async function setupRegionLoading(map) {
  const allRegionFeatures = {
    type: 'FeatureCollection',
    features: []
  };

  // Wait for the current batch to complete before starting the next
  await fetchRegion(config.regionsSource, allRegionFeatures)
  // Since our region ids are string, the maplibre-gl doesn't like them as feature ids.
  // we map them ourselves and remember mapping from word -> id;
  regionFeatureIds = generateFeatureIds(allRegionFeatures);

  // Store the complete region features for later access
  allRegionFeaturesStore = allRegionFeatures;

  // Update the region boundaries source with all regions
  map.getSource('region-boundaries').setData(allRegionFeatures);

  // Reapply discovered states for persisted transparency
  // Use wordStats to determine which regions were previously discovered
  Object.keys(wordStats.getHistory()).forEach(word => {
    if (regionFeatureIds[word] !== undefined) {
      map.setFeatureState({ source: 'region-boundaries', id: regionFeatureIds[word] }, { discovered: true });
    }
  });

  // Need some delay to avoid flickering.
  setTimeout(() => {
    map.setLayoutProperty('clipped-regions-raster-layer', 'visibility', 'visible');
  }, 100);
}

async function fetchRegion(url, featureCollection) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch region ${url}`);
  }

  const data = await response.json();
  if (data && data.features) {
    featureCollection.features = data.features;
  }
}

function openWordFromStatsPanel(label) {
  const feature = findRegionFeatureByLabel(label);
  if (!feature) return;

  handleCircleClick({ features: [feature] }, map);
  const centroidOfPolygon = feature.geometry.coordinates[0].reduce((acc, coord) => {
    acc[0] += coord[0];
    acc[1] += coord[1];
    return acc;
  }, [0, 0]);
  centroidOfPolygon[0] /= feature.geometry.coordinates[0].length;
  centroidOfPolygon[1] /= feature.geometry.coordinates[0].length;
  // Fly to the centroid of the polygon
  flyTo(centroidOfPolygon);
}

function openNewWordFromSidebar(label, coordinates) {
  flyTo(coordinates);

  const feature = findRegionFeatureByLabel(label);
  if (!feature) return;
  // Execute handleCircleClick after the fly animation is complete
  map.once('moveend', () => {
    handleCircleClick({ features: [feature] }, map);
  });
}

function flyTo(coordinates) {
  const currentZoom = map.getZoom();

  map.flyTo({
    center: coordinates,
    zoom: currentZoom,
    speed: 1.,
    curve: 1.5,
    essential: true // This animation is considered essential with respect to prefers-reduced-motion
  });
}

async function handleCircleClick(e, map) {
  if (!e.features || e.features.length === 0) return

  const feature = e.features[0]
  if (!feature.properties || !feature.properties.label) return

  const label = feature.properties.label

  // Record word click for statistics tracking
  wordStats.recordClick(label);
  if (statsModal.isOpen) {
    // If stats modal is open, update the word list immediately
    statsModal.refreshStats();
  }

  if (regionFeatureIds[label] !== undefined) {
    // Mark as discovered and reveal underlying raster
    // wordStats.recordClick already saves to localStorage
    map.setFeatureState(
      { source: 'region-boundaries', id: regionFeatureIds[label] },
      { discovered: true }
    )

    // Find the complete region feature from the stored features collection
    const regionFeature = findRegionFeatureByLabel(label);

    if (regionFeature) {
      // Use the complete region geometry for the highlight outline
      const highlightedRegion = {
        type: 'FeatureCollection',
        features: [regionFeature]
      };
      map.getSource('highlighted-region').setData(highlightedRegion);
    }
  }

  // Get the label from the feature and open the sidebar with it
  sidebar.open(label, openNewWordFromSidebar)

  // Highlight the clicked node and its neighbors
  await highlightNodeWithNeighbors(label, map)
}

function generateFeatureIds(featureCollection) {
  const idMap = {};
  featureCollection.features.forEach((feature, index) => {
    const label = feature.id;
    const id = index;
    idMap[label] = id;
    feature.properties.label = label; // Ensure the label is set in properties
    feature.id = id;
  });

  return idMap;
}

// Helper function to find region feature by label
function findRegionFeatureByLabel(label) {
  if (!allRegionFeaturesStore || !allRegionFeaturesStore.features) return null;

  return allRegionFeaturesStore.features.find(feature => feature.properties.label === label);
}
