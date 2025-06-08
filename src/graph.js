import ngraphFromDot from 'ngraph.fromdot';
import config from './config.js';

// Cache for the graph to avoid multiple downloads
let graphCache = null;

/**
 * Fetches and parses the graph data
 * @returns {Promise<Object>} The parsed graph
 */
export async function getGraph() {
  if (graphCache) {
    return graphCache;
  }
  
  try {
    const response = await fetch(config.graphFileUrl);
    const dotContent = await response.text();
    graphCache = ngraphFromDot(dotContent);
    return graphCache;
  } catch (e) {
    console.error('Failed to load graph data:', e);
    throw e;
  }
}

/**
 * Gets a node and its neighbors from the graph
 * @param {Object} graph - The graph object
 * @param {string} nodeId - ID of the node to get neighbors for
 * @returns {Object} Object containing the node and its neighbors
 */
export function getNodeWithNeighbors(graph, nodeId) {
  const node = graph.getNode(nodeId);
  if (!node) return null;
  
  const neighbors = [];
  const edges = [];
  
  graph.forEachLinkedNode(nodeId, (linkedNode, link) => {
    neighbors.push(linkedNode);
    edges.push({
      from: link.fromId,
      to: link.toId,
      data: link.data
    });
  });
  
  return { node, neighbors, edges };
}