export default function turnChineseWordsIntoLinks(content, graph) {
  // Use a regex to find Chinese words in the content
  const chineseWordRegex = /[\u4e00-\u9fa5]+/g;
  
  // Process each Chinese phrase to find the longest possible matches
  return content.replace(chineseWordRegex, (phrase) => {
    // Start with the whole phrase and then try progressively smaller chunks
    const linkedPhrase = processChinesePhrase(phrase, graph);
    return linkedPhrase;
  });
}

/**
 * Breaks down a Chinese phrase into optimal subparts for linking
 * Prefers longer matches when possible
 */
function processChinesePhrase(phrase, graph) {
  // Base case: single character or empty string
  if (phrase.length <= 1) {
    return linkIfExists(phrase, graph);
  }

  // Check if the whole phrase exists in the graph
  if (graph.getNode(phrase)) {
    return linkIfExists(phrase, graph);
  }
  
  // Try to find the longest match from the beginning
  for (let length = phrase.length - 1; length > 0; length--) {
    const firstPart = phrase.substring(0, length);
    if (graph.getNode(firstPart)) {
      // Found a match for the first part
      const restOfPhrase = processChinesePhrase(phrase.substring(length), graph);
      return linkIfExists(firstPart, graph) + restOfPhrase;
    }
  }
  
  // No longer match found, link the first character and process the rest
  return linkIfExists(phrase[0], graph) + processChinesePhrase(phrase.substring(1), graph);
}

/**
 * Creates HTML link for word if it exists in graph, otherwise returns the original word
 */
function linkIfExists(word, graph) {
  if (!word) return '';
  const node = graph.getNode(word);
  if (node) {
    return `<a href="https://github.com/anvaka/lang-land-data/blob/main/hsk/v1/cards/${word}.md" class="word-link" data-word="${word}">${word}</a>`;
  }
  return word;
}