import { getGraph, getNodeWithNeighbors } from './graph';

export default async function highlightNodeWithNeighbors(nodeId, map) {
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