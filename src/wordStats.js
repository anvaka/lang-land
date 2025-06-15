import './wordStats.css';
/**
 * Handles tracking and analysis of word click statistics
 * Uses localStorage for persistent client-side storage
 */

const STORAGE_KEY = 'hsk-land-word-stats';

/**
 * WordStats module to track and analyze user interactions with words
 */
export const wordStats = {
  /**
   * Retrieves the complete click history from localStorage
   * @returns {Object} Map of words to timestamp arrays
   */
  getHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to parse word stats:', error);
      return {};
    }
  },

  /**
   * Persists click history to localStorage
   * @param {Object} history - The history object to save
   */
  saveHistory(history) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save word stats:', error);
      // Could offer to clear some data if storage is full
    }
  },

  /**
   * Records a word click with current timestamp
   * @param {string} word - The word that was clicked
   */
  recordClick(word) {
    if (!word) return;
    
    const history = this.getHistory();
    const timestamp = Date.now();
    
    history[word] = history[word] || [];
    history[word].push(timestamp);
    
    this.saveHistory(history);
  },

  /**
   * Gets the timestamp of the last click for a specific word
   * @param {string} word - The word to check
   * @returns {number|null} Timestamp of last click or null if never clicked
   */
  getLastClickTime(word) {
    if (!word) return null;
    
    const history = this.getHistory();
    if (!history[word] || history[word].length === 0) return null;
    
    return history[word][history[word].length - 1];
  },

  /**
   * Gets the number of clicks for a specific word
   * @param {string} word - The word to check
   * @returns {number} Click count
   */
  getClickCount(word) {
    if (!word) return 0;
    
    const history = this.getHistory();
    return history[word]?.length || 0;
  },

  /**
   * Gets words sorted by click frequency
   * @returns {Array} Array of {word, count} objects
   */
  getMostClicked() {
    const history = this.getHistory();
    
    return Object.entries(history)
      .map(([word, timestamps]) => ({ 
        word, 
        count: timestamps.length,
        lastClicked: timestamps[timestamps.length - 1]
      }))
      .sort((a, b) => b.count - a.count || b.lastClicked - a.lastClicked)
  },

  /**
   * Gets the total number of unique words clicked
   * @returns {number} Word count
   */
  getUniqueWordCount() {
    return Object.keys(this.getHistory()).length;
  },

  /**
   * Gets the total number of clicks across all words
   * @returns {number} Click count
   */
  getTotalClickCount() {
    const history = this.getHistory();
    return Object.values(history)
      .reduce((total, timestamps) => total + timestamps.length, 0);
  },

  /**
   * Gets clicks within a recent time period
   * @param {number} days - Number of days to look back
   * @returns {Array} Array of recent click objects with word and timestamp
   */
  getRecentClicks(days = 7) {
    const history = this.getHistory();
    const cutoffTime = Math.floor(Date.now() / 1000) - (days * 86400); // 86400 = seconds in a day
    
    return Object.entries(history)
      .flatMap(([word, timestamps]) => 
        timestamps
          .filter(timestamp => timestamp >= cutoffTime)
          .map(timestamp => ({ word, timestamp }))
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  /**
   * Clears all tracking data
   */
  clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }
};

/**
 * UI component for displaying word statistics as a right sidebar
 */
export const statsModal = {
  element: null,
  isOpen: false,
  wordClickCallback: null,
  sortState: {
    column: 'count', // Default sort by click count
    direction: 'asc' // Default direction (ascending)
  },

  /**
   * Initialize the stats sidebar
   */
  init(callback) {
    this.wordClickCallback = callback;
    this.createSidebar();
    this.attachEventHandlers();
    document.querySelector('#app').appendChild(this.element);
  },

  /**
   * Create the sidebar DOM element
   */
  createSidebar() {
    this.element = document.createElement('div');
    this.element.className = 'stats-sidebar';
    this.element.innerHTML = `
      <div class="stats-sidebar-content">
        <button class="stats close-btn" aria-label="Close statistics">&times;</button>
        <div class="stats-content">
          <h3>Word Learning Progress</h3>
          <div class="stats-summary">
            <div class="stat-item">
              <span class="stat-number" id="unique-words">0</span>
              <span class="stat-label">Words Discovered</span>
            </div>
            <div class="stat-item">
              <span class="stat-number" id="total-clicks">0</span>
              <span class="stat-label">Total Views</span>
            </div>
          </div>
          <div class="stats-section">
            <h4>Most Reviewed Words</h4>
            <div class="most-clicked-list" id="most-clicked-list">
              <p class="no-data">No words viewed yet. Start exploring!</p>
            </div>
          </div>
          <div class="stats-actions">
            <button class="clear-stats-btn" id="clear-stats">Reset Progress</button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Attach event handlers to modal elements
   */
  attachEventHandlers() {
    const closeBtn = this.element.querySelector('.close-btn');
    const clearBtn = this.element.querySelector('#clear-stats');
    
    closeBtn.addEventListener('click', () => this.close());
    clearBtn.addEventListener('click', () => this.promptClear());
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Handle clicks on words to navigate to them on the map
    this.element.addEventListener('click', (e) => {
      // Handle column header sorting
      const sortHeader = e.target.closest('.sortable');
      if (sortHeader) {
        const sortColumn = sortHeader.dataset.sort;
        this.handleSort(sortColumn);
        return;
      }
      
      // Handle word item clicks
      const wordItem = e.target.closest('.word-stat-item');
      if (wordItem) {
        const wordName = wordItem.querySelector('.word-name').textContent;
        if (wordName && this.wordClickCallback) {
          e.preventDefault();
          this.wordClickCallback(wordName);
        }
      }
    });
  },
  
  /**
   * Handle sorting when a column header is clicked
   * @param {string} column - The column name to sort by
   */
  handleSort(column) {
    // If clicking the same column, toggle direction
    if (this.sortState.column === column) {
      this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
      // If clicking a different column, set it as active with default direction
      this.sortState.column = column;
      // Use sensible default directions based on column type
      this.sortState.direction = column === 'word' ? 'asc' : 'desc';
    }
    
    // Refresh the display with new sort
    this.refreshStats();
  },

  /**
   * Open the stats sidebar and update statistics
   */
  open() {
    this.refreshStats();
    this.element.classList.add('open');
    this.isOpen = true;
  },

  /**
   * Close the stats sidebar
   */
  close() {
    this.element.classList.remove('open');
    this.isOpen = false;
  },

  /**
   * Sort data based on current sort state
   * @param {Array} data - Array of word stats objects to sort
   * @returns {Array} Sorted array
   */
  sortData(data) {
    const { column, direction } = this.sortState;
    const multiplier = direction === 'asc' ? 1 : -1;
    
    return data.sort((a, b) => {
      if (column === 'word') {
        return multiplier * a.word.localeCompare(b.word);
      } else if (column === 'count') {
        return multiplier * (a.count - b.count);
      } else if (column === 'lastClicked') {
        return multiplier * (a.lastClicked - b.lastClicked);
      }
      return 0;
    });
  },

  /**
   * Update statistics display with fresh data
   */
  refreshStats() {
    const uniqueWords = wordStats.getUniqueWordCount();
    const totalClicks = wordStats.getTotalClickCount();
    let mostClicked = wordStats.getMostClicked();
    
    document.getElementById('unique-words').textContent = uniqueWords;
    document.getElementById('total-clicks').textContent = totalClicks;
    
    const listContainer = document.getElementById('most-clicked-list');
    
    if (mostClicked.length === 0) {
      listContainer.innerHTML = '<p class="no-data">No words viewed yet. Start exploring!</p>';
    } else {
      // Sort the data according to current sort state
      mostClicked = this.sortData(mostClicked);
      
      // Create sorting indicators for headers
      const getSortIndicator = (col) => {
        if (this.sortState.column !== col) return '';
        return this.sortState.direction === 'asc' ? ' ↑' : ' ↓';
      };
      
      listContainer.innerHTML = `
        <div style="overflow-y: auto; width: 100%;max-height: 400px;">
          <table class="word-stats-table">
            <thead>
              <tr>
                <th class="word-column sortable" data-sort="word" title="Click to sort alphabetically">Word${getSortIndicator('word')}</th>
                <th class="count-column sortable" data-sort="count" title="Click to sort by view count">Views${getSortIndicator('count')}</th>
                <th class="time-column sortable" data-sort="lastClicked" title="Click to sort by last viewed time">Last Viewed${getSortIndicator('lastClicked')}</th>
              </tr>
            </thead>
            <tbody>
              ${mostClicked.map(({ word, count, lastClicked }) => {
                const formattedDate = this.formatTimestamp(lastClicked);
                return `
                  <tr class="word-stat-item" data-word="${word}">
                    <td class="word-name">${word}</td>
                    <td class="word-count">${count}</td>
                    <td class="word-last-viewed">${formattedDate}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  },

  /**
   * Confirm and clear statistics data
   */
  promptClear() {
    if (confirm('Reset all word learning progress? This cannot be undone.')) {
      wordStats.clearAll();
      this.refreshStats();
    }
  },

  /**
   * Format Unix timestamp into relative time or date
   * @param {number} timestamp - Unix timestamp in seconds
   * @returns {string} Human-readable time string
   */
  formatTimestamp(timestamp) {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const seconds = (now - timestamp) / 1000; // Convert to seconds
    
    // Show relative time for recent items
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    if (seconds < 172800) return 'Yesterday';
    
    // Show date for older items
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }
};
