/**
 * This script creates a combined image containing clipped regions from individual images.
 * It takes images from public/images_optimized folder, finds their corresponding region polygons
 * from public/regions folder, clips them to the region's shape, and places them on a single large image.
 * 
 * Features:
 * - Converts WebP images to PNG format for compatibility
 * - Clips images to region boundaries
 * - Uses region fill colors for areas without images
 * - Draws region boundaries 
 * - Creates a high-resolution map suitable for tile generation
 */

import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import { glob } from 'glob';
import sharp from 'sharp';

// Constants
const PADDING = 100; // Padding around the edges of the final image
const SCALE_FACTOR = 120; // Scale from map coordinates to pixels (higher value = more detail)
const DATA_DIR = path.join('..', 'lang-land-data', 'hsk', 'v1');
const WEBP_IMAGES_DIR = path.join(DATA_DIR, 'images_optimized'); // Directory with WebP images
const OUTPUT_FILENAME = 'clipped_regions_map.png';
const DRAW_BORDERS = false; // Whether to draw region borders
const BORDER_COLOR = 'rgba(255, 255, 255, 0.5)'; 
const BORDER_WIDTH = 1.5;
const BACKGROUND_COLOR = 'transparent'; // '#030E2E'; // Dark blue background similar to the map
const COLOR_MAP = { // Color mapping from the mapStyles.js file
  '#516ebc': '#013185',
  '#00529c': '#1373A9',
  '#153477': '#05447C',
  '#37009c': '#013161',
  '#00789c': '#022D6D',
  '#37549c': '#00154D',
  '#9c4b00': '#00154D'
};
const TMP_DIR = path.join('public', 'tmp_converted_images'); // Temporary directory for converted images
const BATCH_SIZE = 100; // Number of images to process before reporting progress

// Cache to optimize image processing
const imageCache = new Map();

// Ensure temporary directory exists
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// Main function
async function createClippedMap() {
  try {
    console.log('Starting clipped map creation...');
    
    // 1. Determine the map bounds from borders.geojson
    const mapBounds = await getMapBounds();
    console.log('Map bounds:', mapBounds);
    
    // 2. Create a canvas with appropriate dimensions
    const canvasWidth = Math.ceil((mapBounds.maxX - mapBounds.minX) * SCALE_FACTOR) + PADDING * 2;
    const canvasHeight = Math.ceil((mapBounds.maxY - mapBounds.minY) * SCALE_FACTOR) + PADDING * 2;
    console.log(`Creating canvas of size ${canvasWidth}x${canvasHeight}`);
    
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    
    // Fill with the background color
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    let processedImages = 0;
    let missingImages = 0;
    let colorFilled = 0;
    let convertedImages = 0;
    
    // Count total regions for progress reporting
    const regionFile = path.join(DATA_DIR, 'regions.geojson');;
    const regionData = JSON.parse(fs.readFileSync(regionFile, 'utf8'));
    const totalRegions = regionData.features.length;
    console.log(`Total regions to process: ${totalRegions}`);
    
    console.log(`Processing ${path.basename(regionFile)}...`);
    
    // Process regions in batches for parallel processing
    const regionBatches = [];
    for (let i = 0; i < regionData.features.length; i += BATCH_SIZE) {
      regionBatches.push(regionData.features.slice(i, i + BATCH_SIZE));
    }
    
    let currentRegion = 0;
    for (const batch of regionBatches) {
      // Process batch in parallel
      await Promise.all(batch.map(async (feature) => {
        currentRegion++;
        if (currentRegion % 100 === 0) {
          const progress = Math.round((currentRegion / totalRegions) * 100);
          console.log(`Progress: ${progress}% (${currentRegion}/${totalRegions})`);
        }
        
        const chineseWord = feature.id;
        const webpImagePath = path.join(WEBP_IMAGES_DIR, `${chineseWord}.webp`);
        const pngImagePath = path.join(TMP_DIR, `${chineseWord}.png`);
        
        // Transform polygon coordinates to canvas space
        const polygon = transformPolygonToCanvas(
          feature.geometry.coordinates[0], 
          mapBounds,
          SCALE_FACTOR,
          PADDING
        );
        
        // Check if image exists
        if (fs.existsSync(webpImagePath)) {
          try {
            // Check if we've already processed this image
            let image;
            if (imageCache.has(chineseWord)) {
              image = imageCache.get(chineseWord);
            } else {
              // Convert WebP to PNG and then load it
              await convertWebpToPng(webpImagePath, pngImagePath);
              convertedImages++;
              
              image = await loadImage(pngImagePath);
              imageCache.set(chineseWord, image); // Cache the loaded image
            }
            
            await clipAndDrawImage(ctx, image, polygon);
            processedImages++;
          } catch (err) {
            console.error(`Error processing image ${chineseWord}:`, err);
            // Fallback to color fill if image loading fails
            fillPolygonWithColor(ctx, polygon, getRegionColor(feature.properties.fill));
            colorFilled++;
          }
        } else {
          // Use color fill for regions without images
          // fillPolygonWithColor(ctx, polygon, getRegionColor(feature.properties.fill));
          colorFilled++;
          missingImages++;
        }
        
        // Draw region border if enabled
        if (DRAW_BORDERS) {
          drawPolygonBorder(ctx, polygon, BORDER_COLOR, BORDER_WIDTH);
        }
      }));
    }
    
    console.log(`Processed ${processedImages} images, converted ${convertedImages} WebP files, filled ${colorFilled} regions with color (${missingImages} missing images)`);
    
    // Save the final canvas to a file with high quality settings
    const outputPath = path.join('public', OUTPUT_FILENAME);
    console.log(`Saving output to ${outputPath}...`);
    const buffer = canvas.toBuffer('image/png', { 
      compressionLevel: 0, // 0 = no compression (highest quality)
      filters: canvas.PNG_ALL_FILTERS
    });
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`Finished! Image saved to ${outputPath}`);
    
    // Clean up converted images
    console.log('Cleaning up temporary files...');
    cleanupTempFiles();
    
  } catch (err) {
    console.error('Error creating clipped map:', err);
  }
}

/**
 * Convert a WebP image to PNG format using Sharp
 * Preserves original image quality
 */
async function convertWebpToPng(webpPath, pngPath) {
  return new Promise(async (resolve, reject) => {
    try {
      // Only convert if the PNG doesn't already exist
      if (!fs.existsSync(pngPath)) {
        await sharp(webpPath)
          .png({ quality: 100 }) // Use maximum quality
          .withMetadata() // Preserve metadata
          .toFile(pngPath);
      }
      resolve();
    } catch (err) {
      reject(`Error converting ${webpPath} to PNG: ${err.message}`);
    }
  });
}

/**
 * Clean up the temporary converted images
 */
function cleanupTempFiles() {
  if (fs.existsSync(TMP_DIR)) {
    // We're only deleting PNG files we created to avoid any accidents
    const pngFiles = fs.readdirSync(TMP_DIR).filter(file => file.endsWith('.png'));
    pngFiles.forEach(file => {
      fs.unlinkSync(path.join(TMP_DIR, file));
    });
    
    // Remove the directory if it's empty
    const remaining = fs.readdirSync(TMP_DIR);
    if (remaining.length === 0) {
      fs.rmdirSync(TMP_DIR);
    }
  }
}

/**
 * Get the bounds of the map from borders.geojson
 */
async function getMapBounds() {
  const bordersPath = path.join(DATA_DIR, 'borders.geojson');
  const data = JSON.parse(fs.readFileSync(bordersPath, 'utf8'));
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  data.features.forEach(feature => {
    feature.geometry.coordinates[0].forEach(coord => {
      minX = Math.min(minX, coord[0]);
      maxX = Math.max(maxX, coord[0]);
      minY = Math.min(minY, coord[1]);
      maxY = Math.max(maxY, coord[1]);
    });
  });
  
  return { minX, minY, maxX, maxY };
}

/**
 * Transform polygon coordinates from map space to canvas space
 * We need to flip the Y-axis because in geographic coordinates latitude increases upward,
 * but in canvas Y coordinate increases downward
 */
function transformPolygonToCanvas(polygonCoords, mapBounds, scaleFactor, padding) {
  const height = (mapBounds.maxY - mapBounds.minY) * scaleFactor;
  return polygonCoords.map(coord => [
    (coord[0] - mapBounds.minX) * scaleFactor + padding,
    height - ((coord[1] - mapBounds.minY) * scaleFactor) + padding
  ]);
}

/**
 * Map region colors from fill property to our color map
 */
function getRegionColor(fillColor) {
  return COLOR_MAP[fillColor] || COLOR_MAP['#153477']; // Default color if not found
}

/**
 * Fill a polygon with a solid color
 */
function fillPolygonWithColor(ctx, polygon, fillColor) {
  ctx.save();
  ctx.fillStyle = fillColor;
  
  ctx.beginPath();
  polygon.forEach((point, i) => {
    if (i === 0) {
      ctx.moveTo(point[0], point[1]);
    } else {
      ctx.lineTo(point[0], point[1]);
    }
  });
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

/**
 * Draw a border around a polygon
 */
function drawPolygonBorder(ctx, polygon, strokeColor, lineWidth) {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  
  ctx.beginPath();
  polygon.forEach((point, i) => {
    if (i === 0) {
      ctx.moveTo(point[0], point[1]);
    } else {
      ctx.lineTo(point[0], point[1]);
    }
  });
  ctx.closePath();
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Clip an image to a polygon shape and draw it on the canvas
 */
async function clipAndDrawImage(ctx, image, polygon) {
  // Calculate the bounding box of the polygon
  const bounds = getBoundingBox(polygon);
  
  // Save the canvas state
  ctx.save();
  
  // Create a clipping path from the polygon
  ctx.beginPath();
  polygon.forEach((point, i) => {
    if (i === 0) {
      ctx.moveTo(point[0], point[1]);
    } else {
      ctx.lineTo(point[0], point[1]);
    }
  });
  ctx.closePath();
  ctx.clip();
  
  // Draw the image scaled to fit the polygon's bounding box
  const aspectRatio = image.width / image.height;
  const boundWidth = bounds.maxX - bounds.minX;
  const boundHeight = bounds.maxY - bounds.minY;
  
  // Use the larger dimension of the polygon to better preserve image quality
  // This ensures we don't downscale the image too much
  const maxRegionDimension = Math.max(boundWidth, boundHeight);
  const minImageDimension = Math.min(image.width, image.height);
  
  // Calculate a scale that preserves quality
  // If the original image is 512px and the region is smaller, don't downscale below original
  const qualityScale = Math.min(1.0, maxRegionDimension / minImageDimension);
  
  // Decide whether to scale based on width or height to maintain aspect ratio
  let drawWidth, drawHeight;
  if (boundWidth / boundHeight > aspectRatio) {
    // Scale based on height, but ensure we preserve quality
    drawHeight = boundHeight;
    drawWidth = boundHeight * aspectRatio;
    
    // Ensure minimum size to preserve quality
    if (drawHeight < image.height * qualityScale) {
      const scale = image.height * qualityScale / drawHeight;
      drawHeight *= scale;
      drawWidth *= scale;
    }
  } else {
    // Scale based on width, but ensure we preserve quality
    drawWidth = boundWidth;
    drawHeight = boundWidth / aspectRatio;
    
    // Ensure minimum size to preserve quality
    if (drawWidth < image.width * qualityScale) {
      const scale = image.width * qualityScale / drawWidth;
      drawWidth *= scale;
      drawHeight *= scale;
    }
  }
  
  // Center the image in the bounding box
  const x = bounds.minX + (boundWidth - drawWidth) / 2;
  const y = bounds.minY + (boundHeight - drawHeight) / 2;
  
  // Set high-quality image rendering options
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw the image
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
  
  // Restore canvas state
  ctx.restore();
}

/**
 * Calculate the bounding box of a polygon
 */
function getBoundingBox(polygon) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  polygon.forEach(point => {
    minX = Math.min(minX, point[0]);
    maxX = Math.max(maxX, point[0]);
    minY = Math.min(minY, point[1]);
    maxY = Math.max(maxY, point[1]);
  });
  
  return { minX, minY, maxX, maxY };
}

// Execute the main function
createClippedMap().catch(err => console.error('Failed to create clipped map:', err));
