import { marked } from 'marked';
import config from './config.js';

import { getGraph } from './graph.js';
import turnChineseWordsIntoLinks from './lib/turnChineseWordsIntoLinks.js';

let graph = null;
let rerenderWhenGraphReady = null;

// preemptively load the graph
getGraph().then(g => {
  graph = g;
  // If we had a pending render, do it now
  if (rerenderWhenGraphReady) {
    rerenderWhenGraphReady();
    rerenderWhenGraphReady = null; // Clear the pending render
  }
});

class Sidebar {
  constructor() {
    this.isOpen = false;
    this.flashcards = {}; // Cache of loaded flashcards
    this.element = null;
    this.contentElement = null;
    this.fontSizeControl = null;
    this.isLoading = false;
    this.baseFontSize = 16; // Default font size in pixels
    this.currentFontSize = this.baseFontSize;
    
    // Global escape key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }
  
  initialize() {
    // Create sidebar element
    this.element = document.createElement('div');
    this.element.className = 'sidebar';
    this.element.setAttribute('aria-hidden', 'true');
    
    // Create close button (no header)
    const closeBtn = document.createElement('button');
    closeBtn.className = 'sidebar-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close sidebar');
    closeBtn.addEventListener('click', () => this.close());
    
    // Create content container
    this.contentElement = document.createElement('div');
    this.contentElement.className = 'sidebar-content';
    
    // Create font size control
    this.createFontSizeControl();
    
    // Add elements to sidebar
    this.element.appendChild(closeBtn);
    this.element.appendChild(this.contentElement);
    this.element.appendChild(this.fontSizeControl);
    
    // Add to DOM
    document.querySelector('#app').appendChild(this.element);
    
    // Initialize with welcome content so it's never empty
    this.renderWelcomeContent();
    
    // Handle clicks on word links inside the sidebar
    this.element.addEventListener('click', (e) => {
      if (e.target.tagName !== 'A' || !e.target.hasAttribute('data-word')) {
        return;
      }
      const word = e.target.getAttribute('data-word');
      if (this.openNewWordCallback) {
        const coordinates = graph.getNode(word)?.data?.l?.split(',').map(Number);
        this.openNewWordCallback(word, coordinates);
        this.open(word, this.openNewWordCallback)
        e.preventDefault();
      }
    });
    return this;
  }
  
  async loadFlashcard(label) {
    if (!label) return '';
    
    // Return from cache if already loaded
    if (this.flashcards[label]) return this.flashcards[label];
    
    // Avoid concurrent requests for the same label
    if (this._pendingRequests && this._pendingRequests[label]) {
      return this._pendingRequests[label];
    }
    
    // Create pending requests tracker if it doesn't exist
    if (!this._pendingRequests) this._pendingRequests = {};
    
    // Create a promise for this request
    const requestPromise = new Promise(async (resolve) => {
      try {
        // Fetch with cache-first strategy
        const response = await fetch(`${config.cardsFolder}${label}.md`, {
          cache: 'force-cache' // Prefer cached version if available
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load flashcard for ${label}: ${response.statusText}`);
        }
        
        // Store the markdown content directly
        const content = await response.text();
        this.flashcards[label] = content;
        resolve(content);
      } catch (error) {
        console.error(`Error loading flashcard for ${label}:`, error);
        // Return empty string if not found
        this.flashcards[label] = '';
        resolve('');
      } finally {
        // Remove from pending requests
        delete this._pendingRequests[label];
      }
    });
    
    // Store the promise so we can return it for concurrent requests
    this._pendingRequests[label] = requestPromise;
    return requestPromise;
  }
  
  open(label, openNewWordCallback = null) {
    if (this.lastLabel === label && this.isOpen) {
      // If already open for this label, do nothing
      return this;
    }

    this.lastLabel = label;
    if (!this.element) this.initialize();
    this.openNewWordCallback = openNewWordCallback;
    
    // Reset scroll to top when opening
    if (this.contentElement) this.contentElement.scrollTop = 0;
    
    // Get content based on label
    this.showContentForLabel(label);
    
    // Open sidebar
    this.isOpen = true;
    this.element.classList.add('open');
    this.element.setAttribute('aria-hidden', 'false');
    
    return this;
  }
  
  close() {
    if (!this.element) return this;
    
    this.isOpen = false;
    this.element.classList.remove('open');
    this.element.setAttribute('aria-hidden', 'true');
    
    return this;
  }
  
  toggle(label) {
    return this.isOpen ? this.close() : this.open(label);
  }
  
  async showContentForLabel(label) {
    // Show welcome content when no specific label is provided
    if (!label) {
      this.renderWelcomeContent();
      return;
    }
    
    // Show loading bar
    this.contentElement.innerHTML = `
      <div class="simple-loading">
        <div class="loading-bar"></div>
      </div>
    `;
    
    try {
      // Fetch the specific flashcard content
      const content = await this.loadFlashcard(label);
      
      // Only render content with feedback link if we have valid content
      this.renderContent(label, content);
    } catch (error) {
      console.error('Error showing content for label:', error);
      
      // Show error in content area
      this.contentElement.innerHTML = `
        <div class="load-error">
          Failed to load content.
        </div>
      `;
    }
  }
  
  renderContent(label, content = null) {
    // If content not provided, try to get from cache (fallback)
    if (content === null) {
      content = (label && this.flashcards[label]) 
        ? this.flashcards[label] 
        : 'No information available for this item.';
    }
    
    // Build HTML with optional image and markdown content
    let html = '';
    
    // Add image if label is provided (will only display if the image exists)
    if (label) {
      // Use optimized WebP images directly
      html += `<img src="${config.imagesFolder}/${label}.webp" alt="${label}" class="sidebar-image" onerror="this.style.display='none'">`;
    }
    
    if (graph) {
      content = turnChineseWordsIntoLinks(content, graph)
    } else {
      rerenderWhenGraphReady = this.renderContent.bind(this, label, content);
      // Render without links first if graph is not ready
    }
    // Render markdown content
    html += marked.parse(content);
    
    // Add feedback link only if there's valid content (not during loading)
    if (content && content !== 'No information available for this item.' && label) {
      html += createFeedbackLink(label, content);
    }
    
    // Direct replacement without transitions to eliminate flickering
    const container = document.createElement('div');
    container.innerHTML = html;
    container.className = 'content-container';
    
    // Replace content directly
    this.contentElement.innerHTML = '';
    this.contentElement.appendChild(container);
  }

  createFontSizeControl() {
    this.fontSizeControl = document.createElement('div');
    this.fontSizeControl.className = 'font-size-control';
    
    // Label
    const label = document.createElement('span');
    label.className = 'font-size-label';
    label.textContent = 'Font Size';
    
    // Slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'font-size-slider';
    slider.min = '12';
    slider.max = '24';
    slider.value = this.baseFontSize;
    slider.step = '1';
    
    slider.addEventListener('input', (e) => {
      this.setFontSize(parseInt(e.target.value));
    });
    
    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.className = 'font-size-reset';
    resetBtn.textContent = 'Reset';
    resetBtn.addEventListener('click', () => {
      this.resetFontSize();
      slider.value = this.baseFontSize;
    });
    
    this.fontSizeControl.appendChild(label);
    this.fontSizeControl.appendChild(slider);
    this.fontSizeControl.appendChild(resetBtn);
  }

  setFontSize(size) {
    this.currentFontSize = size;
    if (this.contentElement) {
      this.contentElement.style.fontSize = `${size}px`;
    }
  }

  resetFontSize() {
    this.setFontSize(this.baseFontSize);
  }
  
  renderWelcomeContent() {
    // Provide helpful initial content
    const welcomeHtml = `
      <div class="welcome-content">
        <h2>Welcome to Language Land</h2>
        <p>Click on any word on the map to see its definition.</p>
        <p>This sidebar will show you:</p>
        <ul>
          <li>Word definitions</li>
          <li>Example sentences</li>
          <li>Visual aids when available</li>
        </ul>
        <p>Use the font size controls at the bottom to adjust text size.</p>
      </div>
    `;
    
    // Direct content replacement for maximum performance
    this.contentElement.innerHTML = welcomeHtml;
  }
}

// Create and export a singleton instance
export const sidebar = new Sidebar();

function createFeedbackLink(label, content) {
  if (!label) return ''; // Don't show feedback link if no label is provided
  
  const githubCardPage = `https://github.com/anvaka/lang-land-data/blob/main/hsk/v1/cards/${label}.md`;
  
  return `
    <hr class="feedback-separator">
    <div class="feedback-link">
      <small>Found an error? <a href="${githubCardPage}" target="_blank" rel="noopener noreferrer">Please improve this card</a></small>
    </div>
  `;
}
