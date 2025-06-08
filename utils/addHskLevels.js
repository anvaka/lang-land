/**
 * This utility adds HSK level information to geojson region files.
 * It reads HSK levels from a CSV file and adds 'l' property to geojson features
 * where the feature's label matches a word in the HSK list.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Parse CSV file containing HSK words and levels
 * @param {string} csvPath - Path to the CSV file
 * @returns {Map} Map with words as keys and levels as values
 */
export function parseHskLevels(csvPath) {
  const fileContent = readFileSync(csvPath, 'utf8');
  const lines = fileContent.split('\n');
  
  // Skip header line
  const wordLevelMap = new Map();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const [word, level] = line.split(',');
    if (word && level) {
      wordLevelMap.set(word, parseInt(level, 10));
    }
  }
  
  return wordLevelMap;
}

/**
 * Update a single geojson file with HSK levels
 * @param {string} filePath - Path to the geojson file
 * @param {Map} hskLevels - Map of words to HSK levels
 * @returns {number} Count of features updated
 */
export function updateGeojsonFile(filePath, hskLevels) {
  // Read the geojson file
  const fileContent = readFileSync(filePath, 'utf8');
  const geojson = JSON.parse(fileContent);
  
  let updatedCount = 0;
  
  // Update each feature if its label matches a word in the HSK levels
  if (geojson.features && Array.isArray(geojson.features)) {
    geojson.features.forEach(feature => {
      if (feature.properties && feature.properties.label) {
        const label = feature.properties.label;
        if (hskLevels.has(label)) {
          // Add HSK level as 'l' property
          feature.properties.l = hskLevels.get(label);
          updatedCount++;
        }
      }
    });
  }
  
  // Write the updated geojson back to the file
  if (updatedCount > 0) {
    writeFileSync(filePath, JSON.stringify(geojson), 'utf8');
  }
  
  return updatedCount;
}

/**
 * Process all geojson files in a directory
 * @param {string} regionsDir - Directory containing geojson files
 * @param {Map} hskLevels - Map of words to HSK levels
 */
export function processRegionFiles(regionsDir, hskLevels) {
  const files = readdirSync(regionsDir)
    .filter(filename => filename.endsWith('.geojson'));
  
  let totalUpdated = 0;
  
  for (const filename of files) {
    const filePath = join(regionsDir, filename);
    const updatedCount = updateGeojsonFile(filePath, hskLevels);
    
    if (updatedCount > 0) {
      console.log(`Updated ${updatedCount} features in ${filename}`);
      totalUpdated += updatedCount;
    }
  }
  
  console.log(`Total features updated: ${totalUpdated}`);
}

/**
 * Main function to run the HSK level addition process
 */
function main() {
  try {
    // Get current directory in ES modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    // Input paths
    const hskCsvPath = join(__dirname, '../public/hsk_levels.csv');
    const pointsFile = join(__dirname, '../public/points.geojson');
    
    console.log('Reading HSK levels from CSV...');
    const hskLevels = parseHskLevels(hskCsvPath);
    console.log(`Loaded ${hskLevels.size} HSK words with levels`);
    
    // console.log('Processing region files...');
    // processRegionFiles(regionsDir, hskLevels);
    const updatedCount = updateGeojsonFile(pointsFile, hskLevels);
    
    console.log('HSK level addition completed successfully');
  } catch (error) {
    console.error('Error adding HSK levels:', error);
  }
}

// Execute the main function if this module is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
