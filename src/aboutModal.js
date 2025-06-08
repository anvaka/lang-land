/**
 * About modal implementation - shows project information in a modal dialog
 */

class AboutModal {
  constructor() {
    this.modal = null;
    this.isOpen = false;
  }

  initialize() {
    // Create modal container if it doesn't exist
    if (this.modal) return this;
    
    // Create modal elements
    this.modal = document.createElement('div');
    this.modal.className = 'about-modal';
    this.modal.setAttribute('aria-hidden', 'true');
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-labelledby', 'about-title');
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'about-modal-content';
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'about-close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close about dialog');
    closeBtn.addEventListener('click', () => this.close());
    
    // Create title
    const title = document.createElement('h2');
    title.id = 'about-title';
    title.textContent = 'About HSK Land';
    
    // Create content
    const content = document.createElement('div');
    content.className = 'about-content';
    content.innerHTML = this.getAboutContent();
    
    // Assemble modal
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(title);
    modalContent.appendChild(content);
    this.modal.appendChild(modalContent);
    
    // Add click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });
    
    // Add escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
    
    // Add to DOM
    document.querySelector('#app').appendChild(this.modal);
    
    return this;
  }
  
  getAboutContent() {
    return `
      <p>Hi! I'm <a href="https://x.com/anvaka" target="_blank" rel="noopener noreferrer">Andrei</a>, and I built HSK Land to help myself learn Mandarin Chinese. I thought it might be helpful for other learners too.</p>
      
      <p>This map shows around 5,000 Chinese words from the HSK vocabulary list. I arranged the words so similar ones appear closer together - it's like a landscape of meaning that helps me see connections between words.</p>
      
      <h3>How it works</h3>
      <p>I used vector embeddings to position words based on their meanings. Click on any word and you'll see its definition, usage examples, and character breakdown. You'll also notice related words highlight on the map, which helps me discover new connections.</p>
      
      <h3>About the data</h3>
      <p>I initially generated the word meanings and character breakdowns using AI, and I'm gradually verifying them as I learn. I'm still a novice Chinese student myself, so there are probably mistakes!</p>
      
      <p>If you spot an error, I'd really appreciate your help - just use the feedback link on any word's page to suggest improvements.</p>
      
      <div class="about-footer">
        <p>
          <a href="https://github.com/anvaka/hsk-land" target="_blank" rel="noopener noreferrer">Code on GitHub</a>
          • 
          <a href="http://paypal.com/paypalme/anvakos/5" target="_blank" rel="noopener noreferrer">Buy me a coffee</a> if you find this useful
        </p>
      </div>
    `;
  }
  
  open() {
    if (!this.modal) this.initialize();
    
    this.isOpen = true;
    this.modal.classList.add('open');
    this.modal.setAttribute('aria-hidden', 'false');
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    return this;
  }
  
  close() {
    if (!this.modal) return this;
    
    this.isOpen = false;
    this.modal.classList.remove('open');
    this.modal.setAttribute('aria-hidden', 'true');
    
    // Restore background scrolling
    document.body.style.overflow = '';
    
    return this;
  }
  
  toggle() {
    return this.isOpen ? this.close() : this.open();
  }
}

// Create and export singleton instance
const aboutModal = new AboutModal();
export { aboutModal };
