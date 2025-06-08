/**
 * This script restructures the flashcards.json file from a simple key-value format
 * to a structured JSON with arrays for character breakdowns and other components.
 * 
 * The script extracts pinyin, English meaning, character breakdowns, examples,
 * usage notes, and memory aids from the markdown-formatted text.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Extract the pinyin and English definition from the title line
 * @param {string} text - The full text content of a flashcard
 * @returns {Object} Object with pinyin and english properties
 */
function extractTitleInfo(text) {
  // Match pattern like: # **火柴 (huǒchái)** - Match (for lighting fire)
  // or: # **亲爱** (qīn'ài) - Dear; beloved  
  // or: # **爱 (ài) - Love**
  // or: # **征求 (zhēng qiú)** – to seek; to solicit; to ask for
  // or: # **却(què) - but; yet; however**
  // or: # **写(xiě)** - to write
  // Support both regular dash (-) and em dash (–)
  const dashPattern = '[-–]';
  
  let titleMatch = text.match(new RegExp(`# \\*\\*([^\\*]+) \\(([^\\)]+)\\)\\*\\* ${dashPattern} (.+)$`, 'm'));
  
  if (!titleMatch) {
    // Try alternative format with pinyin outside asterisks
    titleMatch = text.match(new RegExp(`# \\*\\*([^\\*]+)\\*\\* \\(([^\\)]+)\\) ${dashPattern} (.+)$`, 'm'));
  }
  
  if (!titleMatch) {
    // Try format with character, pinyin, and english all inside asterisks
    titleMatch = text.match(new RegExp(`# \\*\\*([^\\(]+) \\(([^\\)]+)\\) ${dashPattern} ([^\\*]+)\\*\\*$`, 'm'));
  }
  
  if (!titleMatch) {
    // Try format with no space between character and pinyin, all inside asterisks
    titleMatch = text.match(new RegExp(`# \\*\\*([^\\(]+)\\(([^\\)]+)\\) ${dashPattern} ([^\\*]+)\\*\\*$`, 'm'));
  }
  
  if (!titleMatch) {
    // Try format with no space between character and pinyin, pinyin outside asterisks
    titleMatch = text.match(new RegExp(`# \\*\\*([^\\(]+)\\(([^\\)]+)\\)\\*\\* ${dashPattern} (.+)$`, 'm'));
  }
  
  if (!titleMatch) {
    return { pinyin: '', english: '' };
  }
  
  return {
    pinyin: titleMatch[2],
    english: titleMatch[3].trim()
  };
}

/**
 * Extract character breakdown elements as an array
 * @param {string} text - The full text content of a flashcard
 * @returns {Array} Array of character breakdown descriptions
 */
function extractCharacterBreakdown(text) {
  // Find the character breakdown section
  const breakdownMatch = text.match(/\*\*Character Breakdown:?\*\*:?[\s\S]*?(?=\n\*\*Examples)/);
  
  if (!breakdownMatch) {
    return [];
  }
  
  const lines = breakdownMatch[0].split('\n').map(line => line.trimEnd());
  const result = [];
  let buffer = [];
  
  for (const line of lines) {
    if (line.match(/^\*\*Character Breakdown/)) {
      // Skip the header line
      continue;
    }
    if (line.trim() === '') {
      // Skip empty lines
      continue;
    }
    // check line indent:
    const indent = line.match(/^\s*/)[0].length;
    if (indent === 0) {
      if (buffer.length > 0) {
        // If we have a buffer, push it as a single entry
        result.push(buffer.join('\n'));
        buffer = [];
      }
      // Start a new entry
      buffer.push(line);
    } else {
      // Indented line, add to the current buffer
      buffer.push(line);
    }
  }
  // Main item (not indented)
  result.push(buffer.join('\n'));

  return result;
}

/**
 * Extract examples as an array
 * @param {string} text - The full text content of a flashcard
 * @returns {Array} Array of example sentences
 */
function extractExamples(text) {
  const examplesMatch = text.match(/\*\*Examples:?\*\*:?[\s\S]*?(?=\n\n\*\*(?:Usage Notes|Memory Aids)|\n\n$)/);
  
  if (!examplesMatch) {
    return [];
  }
  
  return examplesMatch[0]
    .split('\n')
    .filter(line => line.trim().startsWith('- '))
    .map(line => line.trim());
}

/**
 * Extract usage notes as an array
 * @param {string} text - The full text content of a flashcard
 * @returns {Array} Array of usage notes
 */
function extractUsageNotes(text) {
  // More flexible regex that handles both double and single newlines before Memory Aids
  const usageMatch = text.match(/\*\*Usage Notes:?\*\*:?[\s\S]*?(?=\n+\*\*Memory Aids|\n\n$)/);
  
  if (!usageMatch) {
    return [];
  }
  const usageNotes = usageMatch[0].split('\n');
  // find first new line or whitespace after "Usage Notes":

  const result = usageNotes.filter(line => (line.trim() !== '' && !line.includes('Usage Notes')))
    .map(line => line.trim())
    .filter(line => line !== ''); // Remove any empty lines
  
  // check for case when "Usage Notes" had a note on the same line:
  const firstLine = usageNotes[0].trim();
  let usageNotesEndPosition = firstLine.indexOf('Usage Notes');
  if (usageNotesEndPosition !== -1) {
    // If "Usage Notes" is on the same line, we need to remove it
    usageNotesEndPosition += 'Usage Notes'.length;
    const firstWhiteSpacePosition = firstLine.indexOf(' ', usageNotesEndPosition);
    if (firstWhiteSpacePosition !== -1) {
      const firstNote = firstLine.substring(firstWhiteSpacePosition).trim();
      if (firstNote) {
        // If there is a note after "Usage Notes", add it to the result
        result.unshift(firstNote);
      }
    }
  }
  
  return result;
}

/**
 * Extract memory aids as an array
 * @param {string} text - The full text content of a flashcard
 * @returns {Array} Array of memory aids
 */
function extractMemoryAids(text) {
  const memoryMatch = text.match(/\*\*Memory Aids:?\*\*:?[\s\S]*?$/);
  
  if (!memoryMatch) {
    return [];
  }
  
  const memoryAids = memoryMatch[0].split('\n');
  
  const result = memoryAids.filter(line => (line.trim() !== '' && !line.includes('Memory Aids')))
    .map(line => line.trim())
    .filter(line => line !== ''); // Remove any empty lines
  
  // Check for case when "Memory Aids" had a note on the same line:
  const firstLine = memoryAids[0].trim();
  let memoryAidsEndPosition = firstLine.indexOf('Memory Aids');
  if (memoryAidsEndPosition !== -1) {
    // If "Memory Aids" is on the same line, we need to remove it
    memoryAidsEndPosition += 'Memory Aids'.length;
    const firstWhiteSpacePosition = firstLine.indexOf(' ', memoryAidsEndPosition);
    if (firstWhiteSpacePosition !== -1) {
      const firstNote = firstLine.substring(firstWhiteSpacePosition).trim();
      if (firstNote) {
        // If there is a note after "Memory Aids", add it to the result
        result.unshift(firstNote);
      }
    }
  }
  
  return result;
}

/**
 * Extract individual characters and update the character reference dictionary
 * @param {string} word - The Chinese word/phrase
 * @param {Array} characterBreakdown - Array of character breakdown descriptions
 * @param {Object} references - Reference dictionary to update
 */
function updateCharacterReferences(word, characterBreakdown, references = {}) {
  // This stores unique character descriptions to avoid duplication
  characterBreakdown.forEach(description => {
    const charMatch = description.match(/\*\*([^ ]+) \(([^)]+)\)\*\*/);
    if (charMatch) {
      const char = charMatch[1];
      // Only add to references if not already there
      if (!references[char]) {
        references[char] = description;
      }
    }
  });
  return references;
}

/**
 * Process flashcards data and convert to structured format
 * @param {Object} flashcardsData - The raw flashcards data object
 * @returns {Object} Structured flashcards data
 */
function processFlashcardsData(flashcardsData) {
  const characterReferences = {};
  const structuredFlashcards = {};
  
  // Process each flashcard
  Object.entries(flashcardsData).forEach(([word, content]) => {
    // Skip if content is null, undefined, or not a string
    if (!content || typeof content !== 'string') {
      return;
    }
    
    const { pinyin, english } = extractTitleInfo(content);
    const characterBreakdown = extractCharacterBreakdown(content);
    const examples = extractExamples(content);
    const usageNotes = extractUsageNotes(content);
    const memoryAids = extractMemoryAids(content);
    
    // Update our reference dictionary
    updateCharacterReferences(word, characterBreakdown, characterReferences);
    
    // Create the structured entry
    structuredFlashcards[word] = {
      pinyin,
      english,
      characterBreakdown,
      examples,
      usageNotes,
      memoryAids
    };
  });
  
  // We still build characterReferences for future use but don't include in output
  return structuredFlashcards;
}

/**
 * Process the flashcards file and convert to the new structure
 */
function processFlashcards() {
  try {
    // Get current directory in ES modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    // Input and output file paths
    const inputPath = join(__dirname, '../public/flashcards.json');
    const outputPath = join(__dirname, '../public/flashcards_structured.json');
    
    // Read the original flashcards file
    const rawData = readFileSync(inputPath, 'utf8');
    const flashcards = JSON.parse(rawData);
    
    const output = processFlashcardsData(flashcards);
    
    // Write the output file
    writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`Successfully restructured flashcards and saved to ${outputPath}`);
    
  } catch (error) {
    console.error('Error processing flashcards:', error);
  }
}

// Export functions for testing
export {
  extractTitleInfo,
  extractCharacterBreakdown,
  extractExamples,
  extractUsageNotes,
  extractMemoryAids,
  updateCharacterReferences,
  processFlashcardsData
};

// Wrap the function and export it as the main functionality
function main() {
  processFlashcards();
}

// Execute the processing function only if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
