# Utils Directory

This directory contains utility scripts for processing and managing the lang-land project data.

## restructure_flashcards.js

A script that processes flashcard data from markdown format into structured JSON.

### Features

- Extracts pinyin, English definitions, character breakdowns, examples, usage notes, and memory aids
- Creates a character reference dictionary to avoid duplication
- Handles malformed or missing data gracefully
- Optimized for performance with large datasets

### Usage

#### As a CLI tool
```bash
# Process flashcards from public/flashcards.json to public/flashcards_structured.json
node utils/restructure_flashcards.js
```

#### As a module
```javascript
import { 
  extractTitleInfo,
  extractCharacterBreakdown,
  extractExamples,
  extractUsageNotes,
  extractMemoryAids,
  updateCharacterReferences,
  processFlashcardsData
} from './utils/restructure_flashcards.js';

// Process flashcard data
const structuredData = processFlashcardsData(rawFlashcards);

// Or use individual extraction functions
const { pinyin, english } = extractTitleInfo(markdownText);
const examples = extractExamples(markdownText);
```

### Expected Input Format

The script expects flashcard data in the following markdown format:

```markdown
# **火柴 (huǒchái)** - Match (for lighting fire)

**Character Breakdown**:
- **火 (huǒ)**: Fire, flame. The radical suggests heat and burning.
- **柴 (chái)**: Firewood, kindling. The wood radical (木) with grass (艹) indicates combustible material.

**Examples**:
- 我需要火柴点蜡烛。(Wǒ xūyào huǒchái diǎn làzhú.) - I need matches to light the candle.
- 火柴盒在桌子上。(Huǒchái hé zài zhuōzi shang.) - The matchbox is on the table.

**Usage Notes**:
- Commonly used in daily life
- Can refer to both the individual match and matches collectively

**Memory Aids**:
- Think of "fire" + "wood" = the tool to make fire from wood
- Picture a match igniting firewood
```

### Output Format

The script outputs a structured JSON object:

```json
{
  "characterReferences": {
    "火": "- **火 (huǒ)**: Fire, flame. The radical suggests heat and burning.",
    "柴": "- **柴 (chái)**: Firewood, kindling. The wood radical (木) with grass (艹) indicates combustible material."
  },
  "flashcards": {
    "火柴": {
      "pinyin": "huǒchái",
      "english": "Match (for lighting fire)",
      "characterBreakdown": [
        "- **火 (huǒ)**: Fire, flame. The radical suggests heat and burning.",
        "- **柴 (chái)**: Firewood, kindling. The wood radical (木) with grass (艹) indicates combustible material."
      ],
      "examples": [
        "- 我需要火柴点蜡烛。(Wǒ xūyào huǒchái diǎn làzhú.) - I need matches to light the candle.",
        "- 火柴盒在桌子上。(Huǒchái hé zài zhuōzi shang.) - The matchbox is on the table."
      ],
      "usageNotes": [
        "- Commonly used in daily life",
        "- Can refer to both the individual match and matches collectively"
      ],
      "memoryAids": [
        "- Think of \"fire\" + \"wood\" = the tool to make fire from wood",
        "- Picture a match igniting firewood"
      ]
    }
  }
}
```

## Testing

Run the comprehensive test suite:

```bash
npm test
# or
npm run test:flashcards
```

The test suite covers:
- All extraction functions with various input formats
- Edge cases and error handling
- Performance with large datasets
- Character reference deduplication
- Data validation and sanitization

### Test Coverage

- ✅ Title information extraction (pinyin, English)
- ✅ Character breakdown parsing
- ✅ Examples extraction
- ✅ Usage notes parsing
- ✅ Memory aids extraction
- ✅ Character reference management
- ✅ Complete data processing pipeline
- ✅ Error handling and edge cases
- ✅ Performance optimization
- ✅ Input validation

## Architecture

The code follows functional programming principles:

- **Pure functions**: All extraction functions are pure and side-effect free
- **Modular design**: Each function has a single responsibility
- **Testable**: Logic is separated from I/O operations
- **Reusable**: Functions can be imported and used independently
- **Performance**: Optimized regex patterns and efficient data structures
