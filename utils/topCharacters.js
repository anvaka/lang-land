#!/usr/bin/env node
/**
 * This script extracts the top N most frequent Chinese characters from a structured 
 * flashcard JSON file and outputs their character breakdowns.
 * 
 * Usage: node topCharacters.js <input-file> <num-characters>
 * 
 * Example: node topCharacters.js ../public/flashcards_structured.json 10
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Count character frequencies in all words from flashcard data
 * @param {Object} flashcardsData - Structured flashcards data
 * @returns {Map} Map of characters to their frequency counts
 */
function countCharacterFrequency(flashcardsData) {
  const charCount = new Map();
  
  // Iterate through each flashcard key (Chinese word)
  Object.keys(flashcardsData).forEach(word => {
    // Count each character in the word
    for (const char of word) {
      // Skip non-Chinese characters (like spaces, punctuation)
      if (/[\u4e00-\u9fff]/.test(char)) {
        charCount.set(char, (charCount.get(char) || 0) + 1);
      }
    }
  });
  
  return charCount;
}

/**
 * Extract all character breakdowns by searching through all flashcards
 * @param {Object} flashcardsData - Structured flashcards data
 * @param {string} targetChar - The character to find breakdowns for
 * @returns {Array} Array of breakdown descriptions for the character
 */
function findCharacterBreakdowns(flashcardsData, targetChar) {
  const results = [];
  
  // Check all flashcards for matching character breakdowns
  for (const word of Object.values(flashcardsData)) {
    if (!word.characterBreakdown) continue;
    
    // Look through each breakdown entry
    for (const breakdown of word.characterBreakdown) {
      // Check if the target character appears in the first 10 symbols
      // This is more flexible than the previous strict regex match
      const firstTenChars = breakdown.substring(0, 10);
      if (firstTenChars.includes(targetChar)) {
        // Only add unique breakdowns to avoid duplicates
        if (!results.includes(breakdown)) {
          results.push(breakdown);
        }
      }
    }
  }
  
  return results;
}

/**
 * Find the top N most frequent characters and their breakdowns
 * @param {Object} flashcardsData - Structured flashcards data
 * @param {number} n - Number of top characters to find
 * @returns {Object} Object with top characters and their breakdowns
 */
function findTopCharacters(flashcardsData, n) {
  // Count frequency of each character
  const charCount = countCharacterFrequency(flashcardsData);
  
  // Sort characters by frequency (descending)
  const sortedChars = [...charCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
  
  // Create result object with character frequencies and all breakdowns found
  const result = {};
  
  sortedChars.forEach(([char, count]) => {
    const breakdowns = findCharacterBreakdowns(flashcardsData, char);
    result[char] = {
      frequency: count,
      breakdowns: breakdowns.length > 0 ? breakdowns : []
    };
  });
  
  return result;
}

/**
 * Process the input file and extract top characters
 * @param {string} inputFile - Path to the input JSON file 
 * @param {number} numChars - Number of top characters to extract
 * @returns {Object} Object containing top characters and their info
 */
function processInputFile(inputFile, numChars) {
  try {
    // Read and parse the input file
    const data = JSON.parse(readFileSync(inputFile, 'utf8'));
    
    // Find top characters
    const topChars = findTopCharacters(data, numChars);
    
    return topChars;
  } catch (error) {
    console.error('Error processing input file:', error);
    process.exit(1);
  }
}

/**
 * Main function to run the script
 */
function main() {
  // Check if required arguments are provided
  if (process.argv.length < 4) {
    console.log('Usage: node topCharacters.js <input-file> <num-characters>');
    console.log('Example: node topCharacters.js ../public/flashcards_structured.json 10');
    process.exit(1);
  }
  
  // Parse command line arguments
  const inputFile = process.argv[2];
  const numChars = parseInt(process.argv[3], 10);
  
  if (isNaN(numChars) || numChars <= 0) {
    console.error('Error: Number of characters must be a positive integer');
    process.exit(1);
  }
  
  // Process the input file
  const result = processInputFile(inputFile, numChars);
  
  // Output the results
  console.log(`Top ${numChars} most frequent characters:`);
  Object.entries(result).forEach(([char, info]) => {
    console.log(`\n${char} (frequency: ${info.frequency})`);
    if (info.breakdowns.length > 0) {
      info.breakdowns.forEach(breakdown => {
        console.log(breakdown);
      });
    } else {
      console.log('No character breakdown found');
    }
  });
  
  // Generate output file name
  const outputFile = `top${numChars}_characters.json`;
  
  // Write results to file
  writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
  console.log(`\nResults saved to ${outputFile}`);
}

// Execute only if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
