#!/usr/bin/env node

/**
 * This script generates Voronoi districts for points grouped by their parent regions.
 * 
 * Usage:
 *   node createVoronoiDistricts.js <points-geojson> <regions-geojson>
 * 
 * Where:
 *   <points-geojson> - GeoJSON file with points that have label, size, parent attributes
 *   <regions-geojson> - GeoJSON file with polygon regions where each feature has an id attribute
 * 
 * Output:
 *   Creates a single regions.geojson file containing all Voronoi cells for points,
 *   each clipped by their parent region's boundary with id property instead of label.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';

// Get directory name in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function main() {
  if (process.argv.length < 4) {
    console.error('Usage: node createVoronoiDistricts.js <points-geojson> <regions-geojson>');
    process.exit(1);
  }

  const pointsFilePath = process.argv[2];
  const regionsFilePath = process.argv[3];

  try {
    // Read points and regions data
    const pointsData = JSON.parse(fs.readFileSync(pointsFilePath, 'utf8'));
    const regionsData = JSON.parse(fs.readFileSync(regionsFilePath, 'utf8'));

    // Group points by parent
    const pointsByParent = groupPointsByParent(pointsData);
    
    // Create mapping of parent IDs to region polygons
    const regionsById = getRegionsById(regionsData);

    // Collect all Voronoi features
    const allVoronoiFeatures = [];

    // Process each parent group
    for (const [parentId, points] of Object.entries(pointsByParent)) {
      const parentRegion = regionsById[parentId];
      
      if (!parentRegion) {
        console.warn(`No region found for parent ID ${parentId}. Skipping...`);
        continue;
      }

      // Create Voronoi diagram for this parent's points, clipped by parent region
      const voronoiGeoJSON = createVoronoiForRegion(points, parentRegion);
      
      // Add parent ID to each feature and add to the collection
      voronoiGeoJSON.features.forEach(feature => {
        allVoronoiFeatures.push(feature);
      });
      
      console.log(`Processed Voronoi districts for parent ${parentId}`);
    }

    // Write all Voronoi features to a single file
    const outputFilePath = path.join(path.dirname(pointsFilePath), `regions.geojson`);
    fs.writeFileSync(outputFilePath, JSON.stringify({
      type: 'FeatureCollection',
      features: allVoronoiFeatures
    }, null, 2));
    
    console.log(`Created Voronoi districts for all parents at ${outputFilePath}`);
  } catch (error) {
    console.error('Error processing GeoJSON files:', error);
    process.exit(1);
  }
}

/**
 * Groups points by their parent attribute
 */
function groupPointsByParent(pointsData) {
  const pointsByParent = {};
  
  for (const feature of pointsData.features) {
    const properties = feature.properties;
    const coordinates = feature.geometry.coordinates;
    
    if (properties && 'parent' in properties && coordinates) {
      const parentId = properties.parent;
      
      if (!pointsByParent[parentId]) {
        pointsByParent[parentId] = [];
      }
      
      pointsByParent[parentId].push(feature);
    }
  }
  
  return pointsByParent;
}

/**
 * Creates a mapping of region IDs to their polygon features
 * Uses feature.id for identification (top-level feature ID)
 */
function getRegionsById(regionsData) {
  const regionsById = {};
  
  for (const feature of regionsData.features) {
    if (feature.id !== undefined && feature.geometry.type === 'Polygon') {
      regionsById[feature.id] = feature;
    }
  }
  
  return regionsById;
}

/**
 * Converts hex color to HSL components
 */
function hexToHSL(hex) {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Convert hex to RGB
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  let h = 0;
  let s = 0;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return { h, s, l };
}

/**
 * Converts HSL components to hex color
 */
function hslToHex(h, s, l) {
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generates a series of color gradations with the base color in the middle
 */
function generateColorGradation(baseColor, levels) {
  if (!baseColor) {
    throw new Error('Base color is required to generate color gradations');
  }
  
  const hsl = hexToHSL(baseColor);
  const gradations = [];
  
  // Calculate middle index (0-based)
  const middleIndex = Math.floor(levels / 2);
  
  // Generate gradations ensuring the base color is in the middle
  for (let i = 0; i < levels; i++) {
    if (i === middleIndex) {
      // Use the original color in the middle position
      gradations.push(baseColor);
      continue;
    }
    
    // Calculate lightness adjustment - less aggressive range
    const distance = i - middleIndex;
    const lightnessAdjustment = distance * 0.05; 
    
    // Adjust lightness from the base lightness
    const lightness = Math.max(0.25, Math.min(0.75, hsl.l - lightnessAdjustment));
    
    // Make subtle saturation adjustments
    // Lighter colors get slightly less saturated, darker get slightly more
    const saturation = Math.max(0.1, Math.min(0.9, hsl.s + (distance * 0.02)));
    
    gradations.push(hslToHex(hsl.h, saturation, lightness));
  }
  
  return gradations;
}

/**
 * Creates a Voronoi diagram for points within a region, clipped by the region boundary
 */
function createVoronoiForRegion(points, region) {
  // Generate color gradations from the region's fill color
  const baseColor = region.properties?.fill;
  if (!baseColor) {
    throw new Error('Region must have a fill color property to generate color gradations');
  }
  const colorGradations = generateColorGradation(baseColor, 6);
  
  // Extract point coordinates for Voronoi calculation
  const pointsCollection = turf.featureCollection(
    points.map(point => {
      // Create a point with the original properties
      return turf.point(point.geometry.coordinates, {
        ...point.properties,
        pointId: point.properties.label  // Use label as pointId for the cell
      });
    })
  );
  
  // Calculate the bounding box of the region to use as a clipping envelope
  const bbox = turf.bbox(region);
  
  // Generate Voronoi diagram
  const voronoi = turf.voronoi(pointsCollection, {
    bbox: bbox
  });
  
  // Clip each Voronoi cell with the region polygon
  const clippedCells = {
    type: 'FeatureCollection',
    features: []
  };
  
  for (const cell of voronoi.features) {
    try {
      // Clip the cell with the region
      // Use turf.booleanIntersects to check if the geometries intersect
      if (turf.booleanIntersects(cell, region)) {
        // Use turf.intersect with the proper method - pass as a FeatureCollection
        const clipped = turf.intersect(turf.featureCollection([cell, region]));
        
        if (clipped) {
          // Round coordinates to 3 decimal places (xx.xxx)
          const roundedClipped = roundCoordinates(clipped, 3);
          
          // Copy properties from the original point
          const pointId = cell.properties.pointId;
          for (const point of points) {
            if (point.properties.label === pointId) {
              // Set the feature id directly instead of as a property
              roundedClipped.id = point.properties.label;
              
              // Get the color based on the l value (1-6)
              const lValue = parseInt(point.properties.l);
              if (isNaN(lValue) || lValue < 1 || lValue > 6) {
                throw new Error(`Invalid l value for point ${point.properties.label}: ${point.properties.l}`);
              }
              const colorIndex = Math.max(0, Math.min(5, lValue - 1)); // Convert to 0-5 index
              // Copy the rest of the properties without including the label
              const { label, ...restProperties } = point.properties;
              roundedClipped.properties = { 
                 ...restProperties,
                fill: colorGradations[colorIndex] 
              };
              break;
            }
          }
          clippedCells.features.push(roundedClipped);
        }
      }
    } catch (error) {
      console.warn(`Error clipping cell: ${error.message}`);
    }
  }

  return clippedCells;
}

/**
 * Rounds coordinates in a GeoJSON feature to a specified number of decimal places
 */
function roundCoordinates(feature, decimals) {
  const roundedFeature = JSON.parse(JSON.stringify(feature));
  
  function processCoordinates(coords) {
    if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
      // This is a line or ring
      return coords.map(point => [
        parseFloat(point[0].toFixed(decimals)),
        parseFloat(point[1].toFixed(decimals))
      ]);
    } else if (Array.isArray(coords[0])) {
      // This is a polygon or multi-geometry
      return coords.map(processCoordinates);
    } else {
      // This is a point
      return [
        parseFloat(coords[0].toFixed(decimals)),
        parseFloat(coords[1].toFixed(decimals))
      ];
    }
  }
  
  roundedFeature.geometry.coordinates = processCoordinates(roundedFeature.geometry.coordinates);
  return roundedFeature;
}

main();
