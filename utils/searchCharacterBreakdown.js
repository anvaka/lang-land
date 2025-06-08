#!/usr/bin/env node

/**
 * This script searches for a pattern in the "Character Breakdown" sections of flashcards.json
 * and warns if the same pattern is also present in the "Memory Aids" sections.
 * 
 * Usage: node searchCharacterBreakdown.js <search-pattern> [--replace "new description"] [--file path/to/flashcards.json]
 * Example: node searchCharacterBreakdown.js "heart"
 * Example with replace: node searchCharacterBreakdown.js "乱" --replace "**乱** (luàn): \"Disorder.\": **舌** (tongue) + **乚** (twist) → stirring trouble, spreading chaos."
 * Example with custom file: node searchCharacterBreakdown.js "heart" --file ./data/my_flashcards.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define default paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultFlashcardsPath = path.join(__dirname, '..', 'public', 'flashcards.json');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node searchCharacterBreakdown.js <search-pattern> [--replace "new description"] [--file path/to/flashcards.json]');
  process.exit(1);
}

// Extract search pattern and options
const searchPattern = args[0].toLowerCase();
let replacementText = null;
let flashcardsPath = defaultFlashcardsPath;

// Process command line options
const replaceIndex = args.indexOf('--replace');
if (replaceIndex !== -1 && replaceIndex + 1 < args.length) {
  replacementText = args[replaceIndex + 1];
}

const fileIndex = args.indexOf('--file');
if (fileIndex !== -1 && fileIndex + 1 < args.length) {
  // If path is relative, resolve it relative to current working directory
  const providedPath = args[fileIndex + 1];
  flashcardsPath = path.isAbsolute(providedPath) 
    ? providedPath 
    : path.resolve(process.cwd(), providedPath);
}

// Function to extract sections and search for pattern
function searchCharacterBreakdowns(flashcardsData, pattern) {
  const results = [];
  
  // Loop through each entry in the flashcards data
  for (const [character, content] of Object.entries(flashcardsData)) {
    // Define regex to extract the Character Breakdown section
    // Looks for content between "**Character Breakdown**:" and the next section ("**Examples**:")
    const breakdownRegex = /\*\*Character Breakdown\*\*:([^]*?)(?=\*\*Examples\*\*:)/;
    const match = content.match(breakdownRegex);
    
    // Define regex to extract the Memory Aids section
    const memoryAidsRegex = /\*\*Memory Aids\*\*:([^]*?)(?=\*\*|$)/;
    const memoryAidsMatch = content.match(memoryAidsRegex);
    
    if (match && match[1]) {
      const breakdownContent = match[1].trim();
      
      // Search for the pattern in the breakdown content
      if (breakdownContent.toLowerCase().includes(pattern)) {
        // Check if pattern is also in Memory Aids section
        let inMemoryAids = false;
        let memoryAidsContent = '';
        
        if (memoryAidsMatch && memoryAidsMatch[1]) {
          memoryAidsContent = memoryAidsMatch[1].trim();
          inMemoryAids = memoryAidsContent.toLowerCase().includes(pattern);
        }
        
        results.push({
          character,
          content,
          match: breakdownContent,
          matchIndex: match.index,
          matchLength: match[0].length,
          inMemoryAids,
          memoryAidsContent
        });
      }
    }
  }
  
  return results;
}

// Function to replace character breakdown for a specific character
function replaceCharacterDescription(content, pattern, replacement) {
  // Create a pattern that matches lines describing the character but only in Character Breakdown section
  const patternEscaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars
  
  // Extract the Character Breakdown section first
  const breakdownSectionRegex = /\*\*Character Breakdown\*\*:([^]*?)(?=\*\*Examples\*\*:)/;
  
  return content.replace(breakdownSectionRegex, (section, breakdownContent) => {
    // Now replace only the character description lines within this section
    const charLineRegex = new RegExp(`(-\\s+(?:\\*\\*)?${patternEscaped}(?:\\*\\*)?\\s*\\([^)]+\\)(?:\\*\\*)?:[^\\n]*(?:\\n\\s+[^-\\*][^\\n]*)*?)`, 'g');
    
    const updatedSection = breakdownContent.replace(charLineRegex, (match) => {
      return `  - ${replacement}`;
    });
    
    return '**Character Breakdown**:' + updatedSection;
  });
}

// Main execution
try {
  // Read and parse the flashcards.json file
  const flashcardsData = JSON.parse(fs.readFileSync(flashcardsPath, 'utf8'));
  
  // Search for the pattern in Character Breakdown sections
  const results = searchCharacterBreakdowns(flashcardsData, searchPattern);
  
  // Handle the replacement if requested
  if (replacementText) {
    if (results.length === 0) {
      console.error(`No matches found for "${searchPattern}" to replace.`);
      process.exit(1);
    }
    
    // Show what will be replaced
    console.log(`Found ${results.length} matches for "${searchPattern}" in Character Breakdown sections.`);
    console.log(`You are about to replace all occurrences of "${searchPattern}" with:`);
    console.log(`\n${replacementText}\n`);
    console.log(`---------------------------------------------------`);
    
    // Display the matches that will be replaced
    results.forEach(result => {
      console.log(`Character: ${result.character}`);
      
      // Extract just the part that will be changed using the same regex as in replaceCharacterDescription
      const patternEscaped = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const charLineRegex = new RegExp(`(-\\s+(?:\\*\\*)?${patternEscaped}(?:\\*\\*)?\\s*\\([^)]+\\)(?:\\*\\*)?:[^\\n]*(?:\\n\\s+[^-\\*][^\\n]*)*?)`, 'g');
      
      const matches = [];
      let match;
      while ((match = charLineRegex.exec(result.match)) !== null) {
        matches.push(match[0]);
      }
      
      if (matches.length > 0) {
        console.log('Will replace:');
        matches.forEach(m => console.log(`${m.split('\n').map(line => '  ' + line).join('\n')}`));
      }
      
      console.log(`---------------------------------------------------`);
    });
    
    // Prompt for confirmation
    console.log('Proceed with replacement? (y/N)');
    
    // Read a single character from stdin
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', (data) => {
      process.stdin.setRawMode(false);
      const answer = data.toString().toLowerCase();
      
      if (answer === 'y' || answer === 'yes\n' || answer === 'y\n') {
        // Make the replacements
        let updatedFlashcardsData = {...flashcardsData};
        let replacementCount = 0;
    
    for (const result of results) {
      // Replace the specific character description in the breakdown section
      const updatedContent = replaceCharacterDescription(
        updatedFlashcardsData[result.character], 
        searchPattern, 
        replacementText
      );
      
      if (updatedContent !== updatedFlashcardsData[result.character]) {
        updatedFlashcardsData[result.character] = updatedContent;
        replacementCount++;
      }
    }
    
        // Save the updated data back to the file
        fs.writeFileSync(flashcardsPath, JSON.stringify(updatedFlashcardsData, null, 2), 'utf8');
        
        console.log(`Replaced ${replacementCount} occurrences of "${searchPattern}" in the flashcards file.`);
      } else {
        console.log('Replacement cancelled.');
      }
      
      process.exit(0);
    });
  } else {
    // Output the search results without making replacements
    if (results.length === 0) {
      console.log(`No matches found for "${searchPattern}" in Character Breakdown sections.`);
    } else {
      console.log(`Found ${results.length} match(es) for "${searchPattern}" in Character Breakdown sections:`);
      console.log('---------------------------------------------------');
      
      results.forEach(result => {
        console.log(`Character: ${result.character}`);
        console.log('Character Breakdown:');
        console.log(result.match.split('\n').map(line => '  ' + line).join('\n'));
        
        // Add warning if pattern is also found in Memory Aids section
        if (result.inMemoryAids) {
          console.log('\n⚠️  WARNING: Pattern also found in Memory Aids section:');
          console.log(result.memoryAidsContent.split('\n').map(line => '  ' + line).join('\n'));
        }
        
        console.log('---------------------------------------------------');
      });
    }
  }
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
