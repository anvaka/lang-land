import { marked } from 'marked';
import config from './config.js';

class Sidebar {
  constructor() {
    this.isOpen = false;
    this.currentContent = null;
    this.flashcards = null;
    this.element = null;
    this.contentElement = null;
    this.fontSizeControl = null;
    this.isLoading = false;
    this.baseFontSize = 16; // Default font size in pixels
    this.currentFontSize = this.baseFontSize;
    
    // Load flashcards in the background
    this.loadFlashcards();
    
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
    
    return this;
  }
  
  async loadFlashcards() {
    if (this.flashcards || this.isLoading) return;
    
    this.isLoading = true;
    try {
      const response = await fetch(config.flashcardsUrl);
      if (!response.ok) {
        throw new Error(`Failed to load flashcards: ${response.statusText}`);
      }
      this.flashcards = await response.json();
    } catch (error) {
      console.error('Error loading flashcards:', error);
      this.flashcards = {};
    } finally {
      this.isLoading = false;
    }
  }
  
  open(label) {
    if (!this.element) this.initialize();
    
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
    // Show loading state
    this.contentElement.innerHTML = '<div class="loading">Loading content...</div>';
    
    // Ensure flashcards are loaded
    if (!this.flashcards && !this.isLoading) {
      await this.loadFlashcards();
    }
    
    // Wait until flashcards are loaded
    if (this.isLoading) {
      const checkInterval = setInterval(() => {
        if (!this.isLoading) {
          clearInterval(checkInterval);
          this.renderContent(label);
        }
      }, 100);
    } else {
      this.renderContent(label);
    }
  }
  
  renderContent(label) {
    // Find content for the label
    let content = 'No information available for this item.';
    
    if (this.flashcards && label && this.flashcards[label]) {
      content = this.flashcards[label];
    }
    
    // Build HTML with optional image and markdown content
    let html = '';
    
    // Add image if label is provided (will only display if the image exists)
    if (label) {
      // Use optimized WebP images directly
      html += `<img src="${config.imagesFolder}/${label}.webp" alt="${label}" class="sidebar-image" onerror="this.style.display='none'">`;
    }
    
    // Render markdown content
    html += marked.parse(content);
    
    // Add feedback link
    html += this.createFeedbackLink(label, content);
    
    this.contentElement.innerHTML = html;
  }

  createFeedbackLink(label, content) {
    if (!label) return ''; // Don't show feedback link if no label is provided
    
    const encodedLabel = encodeURIComponent(label);
    const encodedContent = encodeURIComponent(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
    const issueTitle = encodeURIComponent(`Content improvement for: ${label}`);
    const issueBody = encodeURIComponent(`I found an issue with the "${label}" flashcard content.\n\nCurrent content:\n\`\`\`\n${content.substring(0, 1000) + (content.length > 1000 ? '...' : '')}\n\`\`\`\n\nSuggested improvement:\n[Please describe the issue or suggestion here]`);
    
    const githubIssueUrl = `https://github.com/anvaka/hsk-land/issues/new?title=${issueTitle}&body=${issueBody}`;
    
    return `
      <hr class="feedback-separator">
      <div class="feedback-link">
        <small>Found an error? <a href="${githubIssueUrl}" target="_blank" rel="noopener noreferrer">Please improve this card</a></small>
      </div>
    `;
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
}

// Create and export a singleton instance
export const sidebar = new Sidebar();