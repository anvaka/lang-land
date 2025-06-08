/**
 * This script compresses structured flashcards back into a markdown format.
 * It's essentially the reverse operation of restructure_flashcards.js.
 * 
 * Takes structured JSON flashcards and converts them to a compressed format
 * where values are formatted markdown strings.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Convert a structured flashcard entry into a markdown string
 * @param {string} word - The Chinese word/character
 * @param {Object} data - The structured data for this flashcard
 * @returns {string} Formatted markdown string
 */
function convertToMarkdown(word, data) {
  const { pinyin, english, characterBreakdown, examples, usageNotes, memoryAids } = data;
  
  // Build markdown sections
  const title = `# **${word} (${pinyin}) - ${english}**\n\n`;
  
  const breakdownSection = characterBreakdown?.length > 0 
    ? `**Character Breakdown**:  \n${characterBreakdown.join('  \n')}\n\n` 
    : '';
  
  const examplesSection = examples?.length > 0
    ? `**Examples**:  \n${examples.join('  \n')}\n\n`
    : '';
  
  const usageSection = usageNotes?.length > 0
    ? `**Usage Notes**:  \n${usageNotes.join('  \n')}\n\n`
    : '';
  
  const memorySection = memoryAids?.length > 0
    ? `**Memory Aids**:  \n${memoryAids.join('  \n')}`
    : '';
  
  // Combine all sections
  return title + breakdownSection + examplesSection + usageSection + memorySection;
}

/**
 * Process structured flashcards data and compress to markdown format
 * @param {Object} structuredData - The structured flashcards data
 * @returns {Object} Compressed flashcards with markdown values
 */
function compressFlashcardsData(structuredData) {
  const compressedFlashcards = {};
  
  Object.entries(structuredData).forEach(([word, data]) => {
    compressedFlashcards[word] = convertToMarkdown(word, data);
  });
  
  return compressedFlashcards;
}

/**
 * Process the structured flashcards file and convert to compressed format
 * @param {string} inputPath - Path to the structured flashcards JSON file
 * @param {string} outputPath - Path where the compressed JSON will be saved
 */
function compressFlashcards(inputPath, outputPath) {
  try {
    // Read the structured flashcards file
    const rawData = readFileSync(inputPath, 'utf8');
    const structuredFlashcards = JSON.parse(rawData);
    
    const compressed = compressFlashcardsData(structuredFlashcards);
    
    // Write the output file
    writeFileSync(outputPath, JSON.stringify(compressed, null, 2), 'utf8');
    console.log(`Successfully compressed flashcards and saved to ${outputPath}`);
    
  } catch (error) {
    console.error('Error compressing flashcards:', error);
  }
}

// Export functions for testing
export {
  convertToMarkdown,
  compressFlashcardsData
};

// Process command line arguments and run the main function
function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.log('Usage: node compress_structured.js <inputFile> <outputFile>');
    process.exit(1);
  }
  
  // Use absolute paths if provided, otherwise resolve relative to current directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  const inputPath = args[0].startsWith('/') ? args[0] : join(__dirname, '..', args[0]);
  const outputPath = args[1].startsWith('/') ? args[1] : join(__dirname, '..', args[1]);
  
  compressFlashcards(inputPath, outputPath);
}

// Execute the processing function only if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
