import './searchBar.css';
import { getGraph } from './graph.js';

class SearchBar {
  constructor() {
    this.element = null;
    this.searchCallback = null;
    this.inputElement = null;
    this.searchButton = null;
    this.eventListeners = {};
    this.dropdownElement = null;
    this.suggestions = [];
    this.selectedIndex = -1;
    this.allNodes = [];
  }

  /**
   * Initialize the search bar component
   * @param {Function} searchCallback - Function to call when search is submitted
   * @returns {SearchBar} - The instance for chaining
   */
  initialize(searchCallback) {
    if (this.element) return this;
    
    this.searchCallback = searchCallback;
    
    // Create the container element
    this.element = document.createElement('div');
    this.element.className = 'search-container';
    
    // Create the form
    const form = document.createElement('form');
    form.className = 'search-form';
    form.setAttribute('role', 'search');
    form.addEventListener('submit', this.handleSubmit.bind(this));
    
    // Create label (for accessibility)
    const label = document.createElement('label');
    label.htmlFor = 'search-input';
    label.className = 'visually-hidden';
    label.textContent = 'Search for a word';
    
    // Create input field
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'search';
    this.inputElement.id = 'search-input';
    this.inputElement.className = 'search-input';
    this.inputElement.placeholder = 'Search for Hanzi (汉字)...';
    this.inputElement.setAttribute('aria-label', 'Search for a chinese character');
    this.inputElement.setAttribute('autocomplete', 'off');
    
    // Add input event listener to toggle button icon and show autocomplete
    this.inputElement.addEventListener('input', (e) => {
      this.toggleButtonIcon();
      this.updateAutocomplete(e.target.value);
    });
    
    // Add keydown event for keyboard navigation of dropdown
    this.inputElement.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Define SVG icons
    const searchIcon = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>';
    const clearIcon = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>';
    
    // Create search/clear button
    this.searchButton = document.createElement('button');
    this.searchButton.type = 'submit';
    this.searchButton.className = 'search-button';
    this.searchButton.setAttribute('aria-label', 'Submit search');
    this.searchButton.innerHTML = searchIcon;
    
    // Store icons for later use
    this.searchButton.dataset.searchIcon = searchIcon;
    this.searchButton.dataset.clearIcon = clearIcon;
    
    // Add click handler for when button is in clear mode
    this.searchButton.addEventListener('click', this.handleButtonClick.bind(this));
    
    // Create dropdown container for autocomplete
    this.dropdownElement = document.createElement('div');
    this.dropdownElement.className = 'search-dropdown';
    this.dropdownElement.style.display = 'none';
    this.dropdownElement.setAttribute('role', 'listbox');
    
    // Add click event listener to document to close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target)) {
        this.hideDropdown();
      }
    });
    
    // Assemble the components
    form.appendChild(label);
    form.appendChild(this.inputElement);
    form.appendChild(this.searchButton);
    this.element.appendChild(form);
    this.element.appendChild(this.dropdownElement);
    
    // Load nodes from graph for autocomplete
    this.loadNodesFromGraph();
    
    return this;
  }
  
  /**
   * Load all nodes from the graph for autocomplete suggestions
   */
  async loadNodesFromGraph() {
    try {
      const graph = await getGraph();
      this.allNodes = [];
      graph.forEachNode(node => {
        if (typeof node.id === 'string' && node.id[0] !== '_') {
          // Underscore prefixed nodes are service nodes, skip them
          this.allNodes.push(node.id);
        }
      });
    } catch (error) {
      console.error('Failed to load nodes from graph:', error);
    }
  }
  
  /**
   * Update the autocomplete dropdown based on input value
   * @param {string} inputValue - Current input value
   */
  updateAutocomplete(inputValue) {
    const query = inputValue.trim().toLowerCase();
    
    if (!query) {
      this.hideDropdown();
      return;
    }
    
    // Filter nodes based on input value with prioritization
    const exactMatches = [];
    const startsWithMatches = [];
    const containsMatches = [];
    const maxSuggestions = 10;
    
    // First pass - collect different match types with priority
    for (const node of this.allNodes) {
      const nodeLower = node.toLowerCase();
      
      if (nodeLower === query) {
        exactMatches.push(node);
      } else if (nodeLower.startsWith(query)) {
        startsWithMatches.push(node);
        if (exactMatches.length + startsWithMatches.length >= maxSuggestions) break;
      } else if (nodeLower.includes(query)) {
        containsMatches.push(node);
        if (exactMatches.length + startsWithMatches.length + containsMatches.length >= maxSuggestions) break;
      }
    }
    
    // Combine matches in priority order
    this.suggestions = [
      ...exactMatches,
      ...startsWithMatches,
      ...containsMatches
    ].slice(0, maxSuggestions);
    
    if (this.suggestions.length === 0) {
      this.hideDropdown();
      return;
    }
    
    // Render suggestions
    this.renderSuggestions();
    this.showDropdown();
    
    // Reset selection
    this.selectedIndex = -1;
  }
  
  /**
   * Render suggestions in the dropdown
   */
  renderSuggestions() {
    this.dropdownElement.innerHTML = '';
    
    this.suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.textContent = suggestion;
      item.setAttribute('role', 'option');
      item.dataset.index = index;
      
      // Add event listeners
      item.addEventListener('click', () => {
        this.setValue(suggestion);
        this.hideDropdown();
        this.focus();
        this.searchCallback(suggestion);
      });
      
      item.addEventListener('mouseenter', () => {
        this.selectItem(index);
      });
      
      this.dropdownElement.appendChild(item);
    });
  }
  
  /**
   * Show the dropdown
   */
  showDropdown() {
    this.dropdownElement.style.display = 'block';
  }
  
  /**
   * Hide the dropdown
   */
  hideDropdown() {
    this.dropdownElement.style.display = 'none';
    this.selectedIndex = -1;
  }
  
  /**
   * Select an item in the dropdown
   * @param {number} index - Index of the item to select
   */
  selectItem(index) {
    // Remove selected class from all items
    const items = this.dropdownElement.querySelectorAll('.dropdown-item');
    items.forEach(item => item.classList.remove('selected'));
    
    // Add selected class to the target item
    if (index >= 0 && index < items.length) {
      items[index].classList.add('selected');
      this.selectedIndex = index;
      
      // Ensure the selected item is visible in the scrollable dropdown
      this.scrollItemIntoView(items[index]);
    }
  }
  
  /**
   * Ensure selected item is visible in the scrollable dropdown
   * @param {HTMLElement} item - The item to scroll into view
   */
  scrollItemIntoView(item) {
    if (!item) return;
    
    const dropdownRect = this.dropdownElement.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    
    // Check if item is outside the visible area
    if (itemRect.top < dropdownRect.top) {
      // Item is above the visible area
      this.dropdownElement.scrollTop += itemRect.top - dropdownRect.top;
    } else if (itemRect.bottom > dropdownRect.bottom) {
      // Item is below the visible area
      this.dropdownElement.scrollTop += itemRect.bottom - dropdownRect.bottom;
    }
  }
  
  /**
   * Handle keyboard navigation in the dropdown
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyDown(e) {
    // Only process if dropdown is visible
    if (this.dropdownElement.style.display === 'none') {
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectItem(Math.min(this.selectedIndex + 1, this.suggestions.length - 1));
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this.selectItem(Math.max(this.selectedIndex - 1, 0));
        break;
        
      case 'Enter':
        if (this.selectedIndex >= 0) {
          e.preventDefault();
          let selectedItem = this.suggestions[this.selectedIndex];
          this.setValue(selectedItem);
          this.hideDropdown();
          this.searchCallback(selectedItem);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        this.hideDropdown();
        break;
        
      case 'Tab':
        this.hideDropdown();
        break;
    }
  }
  
  /**
   * Toggle between search and clear icons based on input content
   */
  toggleButtonIcon() {
    if (!this.searchButton) return;
    
    const hasInput = this.inputElement.value.trim().length > 0;
    
    // Toggle button appearance and function
    if (hasInput) {
      this.searchButton.innerHTML = this.searchButton.dataset.clearIcon;
      this.searchButton.setAttribute('aria-label', 'Clear search');
      this.searchButton.setAttribute('type', 'button');
    } else {
      this.searchButton.innerHTML = this.searchButton.dataset.searchIcon;
      this.searchButton.setAttribute('aria-label', 'Submit search');
      this.searchButton.setAttribute('type', 'submit');
    }
  }
  
  /**
   * Handle button click (for clear functionality)
   * @param {Event} e - Click event
   */
  handleButtonClick(e) {
    // If there's input and button is in clear mode
    if (this.inputElement.value && this.searchButton.getAttribute('type') === 'button') {
      e.preventDefault();
      this.clear();
      this.focus();
      this.toggleButtonIcon();
    }
    // Otherwise, it's a submit button and form submission will be handled
  }
  
  /**
   * Handle form submission
   * @param {Event} e - Submit event
   */
  handleSubmit(e) {
    e.preventDefault();
    const searchTerm = this.inputElement.value.trim();
    
    if (searchTerm && this.searchCallback) {
      this.hideDropdown();
      this.searchCallback(searchTerm);
    }
  }
  
  /**
   * Clear the search input
   */
  clear() {
    if (this.inputElement) {
      this.inputElement.value = '';
      // Emit clear event to notify subscribers
      this.emit('clear');
    }
    
    this.hideDropdown();
  }
  
  /**
   * Set focus to the search input
   */
  focus() {
    if (this.inputElement) {
      this.inputElement.focus();
    }
  }

  /**
   * Set the value of the search input
   * @param {string} value - The value to set
   */
  setValue(value) {
    if (this.inputElement) {
      this.inputElement.value = value || '';
      this.toggleButtonIcon();
    }
    return this;
  }
  
  /**
   * Register an event listener
   * @param {string} event - The event name
   * @param {Function} callback - The callback function
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
    return this;
  }
  
  /**
   * Remove an event listener
   * @param {string} event - The event name
   * @param {Function} callback - The callback function to remove
   */
  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(
        cb => cb !== callback
      );
    }
    return this;
  }
  
  /**
   * Emit an event to all listeners
   * @param {string} event - The event name
   * @param {...any} args - Arguments to pass to listeners
   */
  emit(event, ...args) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(...args));
    }
    return this;
  }
  
  /**
   * Add the search bar to the DOM
   * @param {HTMLElement} container - Container element to append to
   */
  addToDOM(container) {
    if (!this.element) {
      throw new Error('Search bar not initialized. Call initialize() first.');
    }
    
    container.appendChild(this.element);
  }
}

// Export a singleton instance
export const searchBar = new SearchBar();
