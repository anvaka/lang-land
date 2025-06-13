#!/usr/bin/env node

/**
 * GeoJSON to CSV Converter
 * 
 * Takes a GeoJSON file with point features and a directory of markdown files.
 * Creates a CSV file with columns: level, label, and details.
 * The "level" comes from the "l" property of each feature.
 * The "label" comes from the "label" property of each feature.
 * The "details" comes from the content of a markdown file named "${label}.md".
 * 
 * Usage: node geojson-to-csv.js <input-geojson-file> <markdown-directory> <output-csv-file>
 */

import fs from 'fs';
import path from 'path';

// Validate command line arguments
const validateArgs = () => {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Error: Missing required arguments');
    console.error('Usage: node geojson-to-csv.js <input-geojson-file> <markdown-directory> <output-csv-file>');
    process.exit(1);
  }
  
  const [inputFile, markdownDir, outputFile] = args;
  
  // Check if input file exists and is a GeoJSON file
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file "${inputFile}" does not exist`);
    process.exit(1);
  }
  
  if (!inputFile.toLowerCase().endsWith('.geojson') && !inputFile.toLowerCase().endsWith('.json')) {
    console.warn('Warning: Input file does not have .geojson or .json extension');
  }
  
  // Check if markdown directory exists
  if (!fs.existsSync(markdownDir)) {
    console.error(`Error: Markdown directory "${markdownDir}" does not exist`);
    process.exit(1);
  }
  
  if (!fs.statSync(markdownDir).isDirectory()) {
    console.error(`Error: "${markdownDir}" is not a directory`);
    process.exit(1);
  }
  
  return { inputFile, markdownDir, outputFile };
};

// Properly escape CSV field
const escapeCsvField = (field) => {
  if (field === null || field === undefined) {
    return '';
  }
  
  // Convert to string and handle CSV escaping
  const stringField = String(field);
  
  // If field contains quotes, commas, or newlines, wrap in quotes and double any quotes within
  if (stringField.includes('"') || stringField.includes(',') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  
  return stringField;
};

// Get markdown content for a label
const getMarkdownContent = (label, markdownDir) => {
  const fileName = `${label}.md`;
  const filePath = path.join(markdownDir, fileName);
  
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    } else {
      console.warn(`Warning: No markdown file found for label "${label}"`);
      return '';
    }
  } catch (err) {
    console.error(`Error reading markdown file for "${label}": ${err.message}`);
    return '';
  }
};

// Convert GeoJSON to CSV
const convertGeoJsonToCsv = (inputFile, markdownDir, outputFile) => {
  console.log(`Converting ${inputFile} to CSV using markdown files from ${markdownDir}`);
  
  try {
    // Read and parse the GeoJSON file
    const geoJsonContent = fs.readFileSync(inputFile, 'utf8');
    const geoJson = JSON.parse(geoJsonContent);
    
    // Prepare CSV header
    let csvContent = 'level,label,details\n';
    
    // Track statistics
    let processedCount = 0;
    let errorCount = 0;
    
    // Process each feature
    const features = geoJson.features || (Array.isArray(geoJson) ? geoJson : []);
    
    for (const feature of features) {
      try {
        if (feature.properties) {
          const { l, label } = feature.properties;
          
          if (l !== undefined && label) {
            // Get markdown content
            const details = getMarkdownContent(label, markdownDir);
            
            // Add to CSV
            csvContent += `${escapeCsvField(l)},${escapeCsvField(label)},${escapeCsvField(details)}\n`;
            processedCount++;
          } else {
            console.warn(`Warning: Feature missing required properties (l: ${l}, label: ${label})`);
            errorCount++;
          }
        } else {
          console.warn('Warning: Feature missing properties object');
          errorCount++;
        }
      } catch (err) {
        console.error(`Error processing feature: ${err.message}`);
        errorCount++;
      }
    }
    
    // Write the CSV file
    fs.writeFileSync(outputFile, csvContent);
    
    // Print statistics
    console.log(`\nConversion complete!`);
    console.log(`Features processed: ${processedCount}`);
    console.log(`CSV file created: ${outputFile}`);
    
    if (errorCount > 0) {
      console.log(`Errors/warnings encountered: ${errorCount}`);
    }
    
  } catch (err) {
    if (err.name === 'SyntaxError') {
      console.error(`Error: Invalid JSON in ${inputFile}`);
    } else {
      console.error(`Error processing ${inputFile}: ${err.message}`);
    }
    process.exit(1);
  }
};

// Main execution
const { inputFile, markdownDir, outputFile } = validateArgs();
convertGeoJsonToCsv(inputFile, markdownDir, outputFile);
