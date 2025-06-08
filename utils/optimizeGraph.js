import toDot from 'ngraph.todot';
import fromDot from 'ngraph.fromdot';
import fs from 'fs';

const points = JSON.parse(fs.readFileSync('../public/points.geojson', 'utf8'));
const dotContent = fs.readFileSync('../public/graph.dot', 'utf8');
const graph = fromDot(dotContent);

points.features.forEach((point) => {
  const id = point.properties.label;
  if (graph.hasNode(id)) {
    const node = graph.getNode(id);
    node.data = {
      c: node.data.count,
      l: point.geometry.coordinates.join(','),
    }
  } else {
    throw new Error(`Node with id ${id} not found in graph`);
  }
});

graph.forEachLink((link) => {
  const sourceNode = graph.getNode(link.fromId);
  const targetNode = graph.getNode(link.toId);
  link.data = {
    w: Math.round(link.data.weight)
  };
});

console.log(`Graph has ${graph.getNodesCount()} nodes and ${graph.getLinksCount()} links.`);
const dotOutput = toDot(graph);
fs.writeFileSync('../public/graph_opt.dot', dotOutput, 'utf8');
console.log('Optimized graph saved to graph_opt.dot');