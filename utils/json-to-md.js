#!/usr/bin/env node

/**
 * JSON to Markdown Files Converter
 * 
 * Takes a JSON file and outputs each key-value pair as a separate markdown file.
 * Each key becomes a file name (with .md extension) and the value becomes the content.
 * 
 * Usage: node json-to-md.js <input-json-file> <output-directory>
 */

import fs from 'fs';
import path from 'path';

// Validate command line arguments
const validateArgs = () => {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Error: Missing required arguments');
    console.error('Usage: node json-to-md.js <input-json-file> <output-directory>');
    process.exit(1);
  }
  
  const [inputFile, outputDir] = args;
  
  // Check if input file exists and is a JSON file
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file "${inputFile}" does not exist`);
    process.exit(1);
  }
  
  if (!inputFile.toLowerCase().endsWith('.json')) {
    console.warn('Warning: Input file does not have .json extension');
  }
  
  return { inputFile, outputDir };
};

// Ensure output directory exists
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`Created directory: ${directory}`);
  }
};

// Convert JSON to markdown files
const convertJsonToMarkdown = (inputFile, outputDir) => {
  console.log(`Converting ${inputFile} to markdown files in ${outputDir}`);
  
  try {
    // Read and parse the JSON file
    const jsonContent = fs.readFileSync(inputFile, 'utf8');
    const data = JSON.parse(jsonContent);
    
    // Create output directory if it doesn't exist
    ensureDirectoryExists(outputDir);
    
    // Track statistics
    let fileCount = 0;
    let errorCount = 0;
    
    // Process each key-value pair
    for (const [key, value] of Object.entries(data)) {
      // Create a safe filename
      const safeKey = key.replace(/[/\\?%*:|"<>]/g, '-');
      const fileName = `${safeKey}.md`;
      const filePath = path.join(outputDir, fileName);
      
      try {
        // Write the content to the file
        fs.writeFileSync(filePath, String(value));
        fileCount++;
      } catch (err) {
        console.error(`Error writing file ${fileName}: ${err.message}`);
        errorCount++;
      }
    }
    
    // Print statistics
    console.log(`\nConversion complete!`);
    console.log(`Files created: ${fileCount}`);
    
    if (errorCount > 0) {
      console.log(`Errors encountered: ${errorCount}`);
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
const { inputFile, outputDir } = validateArgs();
convertJsonToMarkdown(inputFile, outputDir);
