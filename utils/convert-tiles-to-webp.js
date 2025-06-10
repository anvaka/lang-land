// Convert map tiles from PNG to WebP format
// Recursively processes all PNG files in the tile directory structure
// Maintains the same folder hierarchy and resolution but changes format to WebP
// Usage: node convert-tiles-to-webp.js ./public/tiles

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const quality = 85;  // WebP quality (0-100)
const DATA_DIR = path.join('..', 'lang-land-data', 'hsk', 'v1');
let tileDir = path.join(DATA_DIR, 'tiles');  // Default tiles directory
let conversionMode = 'replace';  // 'replace' or 'copy' mode

// Process command line arguments
if (process.argv.length > 2) {
  tileDir = process.argv[2];
}

// Allow specifying copy mode with --copy flag
if (process.argv.includes('--copy')) {
  conversionMode = 'copy';
  console.log('Running in copy mode - original PNG files will be preserved');
} else {
  console.log('Running in replace mode - original PNG files will be deleted after conversion');
}

// Statistics tracking
const stats = {
  processed: 0,
  failed: 0,
  originalSize: 0,
  optimizedSize: 0,
}

function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function convertFileToWebP(filePath) {
  const dir = path.dirname(filePath);
  const fileName = path.basename(filePath, '.png');
  const webpPath = path.join(dir, `${fileName}.webp`);
  
  try {
    // Convert PNG to WebP without resizing (maintains original dimensions)
    const command = `convert "${filePath}" -quality ${quality} "${webpPath}"`;
    execSync(command);
    
    // Calculate size reduction
    const originalSize = fs.statSync(filePath).size;
    const newSize = fs.statSync(webpPath).size;
    
    // Update stats
    stats.processed++;
    stats.originalSize += originalSize;
    stats.optimizedSize += newSize;
    
    // Delete original PNG if in replace mode
    if (conversionMode === 'replace') {
      fs.unlinkSync(filePath);
    }
    
    return true;
  } catch (error) {
    console.error(`Error converting ${filePath}:`, error.message);
    stats.failed++;
    return false;
  }
}

function processDirectory(dirPath) {
  // Read all entries in the current directory
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  // Process files and subdirectories
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively process subdirectories
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
      // Process PNG files
      if (convertFileToWebP(fullPath)) {
        // Log progress every 100 files
        if (stats.processed % 100 === 0) {
          console.log(`Processed ${stats.processed} files...`);
        }
      }
    }
  }
}

function printStats() {
  const successRate = (stats.processed / (stats.processed + stats.failed) * 100).toFixed(1);
  const savings = ((1 - stats.optimizedSize / stats.originalSize) * 100).toFixed(1);
  
  console.log('\nConversion Summary:');
  console.log(`Total files processed: ${stats.processed}`);
  console.log(`Failed conversions: ${stats.failed}`);
  console.log(`Success rate: ${successRate}%`);
  
  if (stats.processed > 0) {
    console.log('\nSize Reduction:');
    console.log(`Original size: ${(stats.originalSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Optimized size: ${(stats.optimizedSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Space saved: ${savings}%`);
  }
}

// Main execution
console.log(`Starting tile conversion from PNG to WebP in ${tileDir}...`);
console.log(`WebP quality setting: ${quality}`);

// Check if tile directory exists
if (!fs.existsSync(tileDir)) {
  console.error(`Error: The specified tile directory "${tileDir}" does not exist.`);
  process.exit(1);
}

// Start conversion
const startTime = new Date();
processDirectory(tileDir);
const endTime = new Date();
const processingTime = (endTime - startTime) / 1000;

// Print final statistics
printStats();
console.log(`\nConversion complete! Processing time: ${processingTime.toFixed(1)} seconds`);
