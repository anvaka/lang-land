// Image optimization script
// Converts PNG files to WebP and optimizes them while maintaining quality
// Usage: node optimize-images.js

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Configuration
const sourcePath = './public/images';
const outputPath = './public/images_optimized';
const targetWidth = 512; // Target width for the resized images (height will scale proportionally)
const quality = 85;     // WebP quality (0-100), 85 offers good balance of quality and size

function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`Created directory: ${directory}`);
  }
}

function optimizeImages() {
  // Ensure the output directory exists
  ensureDirectoryExists(outputPath);
  
  // Get all PNG files in the source directory
  const files = fs.readdirSync(sourcePath)
    .filter(file => file.toLowerCase().endsWith('.png'));
  
  console.log(`Found ${files.length} PNG files to optimize`);
  
  // Process each file
  files.forEach((file, index) => {
    const sourcePath = `./public/images/${file}`;
    const fileName = path.basename(file, '.png');
    const outputFile = path.join(outputPath, `${fileName}.webp`);
    
    try {
      // Convert the PNG to WebP format with resize
      const command = `convert "${sourcePath}" -resize ${targetWidth}x -quality ${quality} "${outputFile}"`;
      execSync(command);
      
      // Get file sizes to calculate savings
      const originalSize = fs.statSync(`./public/images/${file}`).size;
      const newSize = fs.statSync(outputFile).size;
      const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
      
      console.log(`[${index + 1}/${files.length}] ${file} → ${path.basename(outputFile)} (${savings}% saved)`);
    } catch (error) {
      console.error(`Error optimizing ${file}:`, error.message);
    }
  });
}

function calculateStats() {
  let originalSize = 0;
  let optimizedSize = 0;
  
  // Calculate total original size
  fs.readdirSync('./public/images')
    .filter(file => file.toLowerCase().endsWith('.png'))
    .forEach(file => {
      originalSize += fs.statSync(`./public/images/${file}`).size;
    });
  
  // Calculate total optimized size
  fs.readdirSync(outputPath)
    .filter(file => file.toLowerCase().endsWith('.webp'))
    .forEach(file => {
      optimizedSize += fs.statSync(path.join(outputPath, file)).size;
    });
  
  // Calculate savings
  const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
  console.log(`\nTotal size reduction: ${(originalSize / (1024 * 1024)).toFixed(2)}MB → ${(optimizedSize / (1024 * 1024)).toFixed(2)}MB (${savings}% saved)`);
}

// Main execution
console.log('Starting image optimization...');
optimizeImages();
calculateStats();
console.log('\nOptimization complete! Optimized images are in the public/images_optimized directory.');
console.log('To use these images, update the sidebar.js file to reference the new WebP images.');
