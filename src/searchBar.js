import './searchBar.css';

class SearchBar {
  constructor() {
    this.element = null;
    this.searchCallback = null;
    this.inputElement = null;
    this.searchButton = null;
    this.eventListeners = {};
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
    this.inputElement.placeholder = 'Search for a word...';
    this.inputElement.setAttribute('aria-label', 'Search for a word');
    
    // Add input event listener to toggle button icon
    this.inputElement.addEventListener('input', this.toggleButtonIcon.bind(this));
    
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
    
    // Assemble the components
    form.appendChild(label);
    form.appendChild(this.inputElement);
    form.appendChild(this.searchButton);
    this.element.appendChild(form);
    
    return this;
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
