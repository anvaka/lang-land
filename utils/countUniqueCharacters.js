import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const flashcardsPath = path.join(__dirname, '../public/flashcards.json');
const flashcards = JSON.parse(fs.readFileSync(flashcardsPath, 'utf8'));
const keys = new Map();
Object.keys(flashcards).forEach(key => {
  for(const ch of key) {
    if (keys.has(ch)) {
      keys.set(ch, keys.get(ch) + 1);
    } else {
      keys.set(ch, 1);
    }
  }
});

// print in descending of frequency
const sortedKeys = Array.from(keys.entries()).sort((a, b) => b[1] - a[1]);
sortedKeys.forEach(([key, count]) => {
  console.log(`${key}: ${count}`);
});

console.log(`Total unique characters: ${keys.size}`);