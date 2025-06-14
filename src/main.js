import './style.css'
import maplibregl from 'maplibre-gl'
import { getColorTheme, getInitialMapStyle } from './mapStyles';
import { sidebar } from './sidebar';
import { aboutModal } from './aboutModal';
import { getGraph, getNodeWithNeighbors } from './graph';
import { regionsService } from './regionsService';
import config from './config.js';

// Track discovered regions to persist transparency
const discoveredRegions = new Set();
let regionFeatureIds = {};
let allRegionFeaturesStore = null; // Store all region features for lookup
let graph;
// Initialize the app with a map container
document.querySelector('#app').innerHTML = `<div id="map"></div><button class="about-button" aria-label="About HSK Land">i</button>`
const currentColorTheme = getColorTheme();

// Initialize the about button
const aboutButton = document.querySelector('.about-button');
aboutButton.addEventListener('click', () => aboutModal.open());

// Initialize the map
const map = new maplibregl.Map({
  container: 'map',
  style: getInitialMapStyle(currentColorTheme),
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

async function setupRegionLoading(map) {
  try {
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
    discoveredRegions.forEach(id => {
      map.setFeatureState({ source: 'region-boundaries', id: regionFeatureIds[id] }, { discovered: true });
    });

    // Need some delay to avoid flickering.
    setTimeout(() => {
      map.setLayoutProperty('clipped-regions-raster-layer', 'visibility', 'visible');
    }, 100);
  } catch (error) {
    console.error('Failed to load region boundaries:', error);
  }
}

// Extracts the region fetching logic for better readability
async function fetchRegion(url, featureCollection) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch region ${url}`);
    }

    const data = await response.json();
    if (data && data.features) {
      featureCollection.features = data.features;
    }
  } catch (err) {
    console.warn(`Could not load region ${url}:`, err);
    // Continue with other regions even if one fails
  }
}

function setupMapInteractions(map) {
  // Add pointer cursor for interactive layers
  map.on('mouseenter', 'label-layer', () => { map.getCanvas().style.cursor = 'pointer' })
  map.on('mouseleave', 'label-layer', () => { map.getCanvas().style.cursor = '' })

  map.on('click', 'region-fill-layer', (e) => {
    handleCircleClick(e, map)
  });

  map.on('click', 'label-layer', (e) => {
    handleCircleClick(e, map)
  });

  async function handleCircleClick(e, map) {
    if (!e.features || e.features.length === 0) return

    const feature = e.features[0]
    if (!feature.properties || !feature.properties.label) return

    const label = feature.properties.label
    if (regionFeatureIds[label] !== undefined) {
      // Mark as discovered and reveal underlying raster
      discoveredRegions.add(label);
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

  function openNewWordFromSidebar(label, coordinates) {
    // Preserve current zoom level instead of hardcoding to 6
    const currentZoom = map.getZoom();
    
    map.flyTo({
      center: coordinates,
      zoom: currentZoom,
      speed: 1.,
      curve: 1.5,
      essential: true // This animation is considered essential with respect to prefers-reduced-motion
    });
    
    // Execute handleCircleClick after the fly animation is complete
    map.once('moveend', async () => {
      // Find the feature for this label
      const feature = findFeatureByLabel(label);
      if (feature) {
        // Create an event object similar to what the map click would provide
        const simulatedEvent = {
          features: [feature]
        };
        await handleCircleClick(simulatedEvent, map);
      }
    });
  }

  // Helper function to find a feature by its label
  function findFeatureByLabel(label) {
    if (allRegionFeaturesStore && allRegionFeaturesStore.features) {
      const regionFeature = allRegionFeaturesStore.features.find(
        feature => feature.properties.label === label
      );
      
      if (regionFeature) {
        return {
          ...regionFeature,
          properties: { ...regionFeature.properties },
          id: regionFeatureIds[label]
        };
      }
    }
    return null;
  }

  async function highlightNodeWithNeighbors(nodeId, map) {
    try {
      const graph = await getGraph();
      const nodeData = getNodeWithNeighbors(graph, nodeId);

      if (!nodeData) return;

      const { node, neighbors, edges } = nodeData;

      // Create features for highlighting
      const highlightedNodes = {
        type: 'FeatureCollection',
        features: []
      };

      const highlightedEdges = {
        type: 'FeatureCollection',
        features: []
      };

      const primaryCoordinates = node.data.l.split(',').map(Number);

      // Add the primary node
      highlightedNodes.features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: primaryCoordinates
        },
        properties: {
          color: '#bf2072',
          size: node.data.c / 2 || 1
        }
      });

      // Add neighbor nodes
      neighbors.forEach(neighbor => {
        // Get coordinates directly from neighbor data
        if (neighbor.data && neighbor.data.l) {
          // Convert coordinates string to array of numbers
          const coordinates = neighbor.data.l.split(',').map(Number);

          highlightedNodes.features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: coordinates
            },
            properties: {
              color: '#e56aaa',
              size: neighbor.data.c ? neighbor.data.c / 5 : 0.8 // Size based on count if available
            }
          });

          // Add edge between primary node and this neighbor
          highlightedEdges.features.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                primaryCoordinates,
                coordinates
              ]
            }
          });
        }
      });

      // Update the sources
      map.getSource('highlighted-nodes').setData(highlightedNodes);
      map.getSource('highlighted-edges').setData(highlightedEdges);
    } catch (error) {
      console.error('Failed to highlight node:', error);
    }
  }
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