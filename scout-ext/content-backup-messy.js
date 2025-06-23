// Scout Social Trader - Enhanced Content Script with Page Injection
console.log('🚀 Scout Social Trader v2.0 - Enhanced Content Script Loaded');

// State management
let overlay = null;
let lensMode = false;
let isAnalyzing = false;
let selectedElement = null;
let ocrInstance = null; // Chrome Lens OCR instance
let pageScriptInjected = false;
let connectedWallet = null;

// Configuration
const CONFIG = {
  OVERLAY_ANIMATION_DURATION: 300,
  LENS_SCAN_ANIMATION_DURATION: 2000,
  AUTO_HIDE_DELAY: 10000,
  OCR_CONFIDENCE_THRESHOLD: 0.7
};

// Initialize content script
function initializeContentScript() {
  console.log('🔧 Initializing Scout Social Trader on:', window.location.href);
  
  // Inject page script for direct wallet access
  injectPageScript();
  
  // Initialize OCR
  initializeOCR();
  
  // Setup page script communication
  setupPageScriptCommunication();
  
  // Add event listeners
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keydown', handleKeyPress);
  document.addEventListener('click', handleClick);
  
  // Inject lens cursor CSS
  injectLensCursor();
  
console.log('✅ Content script initialized');
  
// Inject page script for direct wallet access
function injectPageScript() {
  if (pageScriptInjected) return;
  
  console.log('💉 Injecting page script for wallet access...');
  
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('page-inject.js');
    script.onload = () => {
      console.log('✅ Page script injected successfully');
      pageScriptInjected = true;
      
      // Request immediate wallet detection
      setTimeout(() => {
        sendToPageScript('DETECT_WALLETS', {});
      }, 1000);
    };
    script.onerror = () => {
      console.error('❌ Failed to inject page script');
    };
    
    (document.head || document.documentElement).appendChild(script);
    
  } catch (error) {
    console.error('❌ Page script injection failed:', error);
  }

// Setup communication with page script
function setupPageScriptCommunication() {
  console.log('📡 Setting up page script communication...');
  
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data.source !== 'Scout-page-script') return;
    
    handlePageScriptMessage(event.data);
  });
}

// Handle messages from page script
function handlePageScriptMessage(message) {
  console.log('📨 Content script received from page script:', message.type);
  
  switch (message.type) {
    case 'PAGE_SCRIPT_READY':
      console.log('✅ Page script is ready');
      // Request wallet detection
      sendToPageScript('DETECT_WALLETS', {});
      break;
      
    case 'WALLETS_DETECTED':
      console.log('🔍 Wallets detected:', message.data.wallets);
      // Notify background script
      chrome.runtime.sendMessage({
        action: 'walletsDetected',
        wallets: message.data.wallets
      });
      break;
      
    case 'WALLET_CONNECTED':
      console.log('🎉 Wallet connected:', message.data);
      connectedWallet = message.data;
      // Notify background script
      chrome.runtime.sendMessage({
        action: 'walletConnected',
        walletData: message.data
      });
      break;
      
    case 'WALLET_DISCONNECTED':
      console.log('🔌 Wallet disconnected:', message.data);
      connectedWallet = null;
      // Notify background script
      chrome.runtime.sendMessage({
        action: 'walletDisconnected',
        walletData: message.data
      });
      break;
      
    case 'WALLET_CONNECTION_FAILED':
      console.log('❌ Wallet connection failed:', message.data);
      // Notify background script
      chrome.runtime.sendMessage({
        action: 'walletConnectionFailed',
        error: message.data
      });
      break;
      
    case 'WALLET_STATUS':
      console.log('📊 Wallet status:', message.data);
      // Update local state
      connectedWallet = message.data.wallet;
      break;
  }
}

// Send message to page script
function sendToPageScript(type, data) {
  window.postMessage({
    source: 'Scout-content-script',
    type: type,
    data: data
  }, '*');
}

// Initialize Chrome Lens OCR only
async function initializeOCR() {
  try {
    // Load Chrome Lens OCR script
    const ocrScript = document.createElement('script');
    ocrScript.src = chrome.runtime.getURL('lens-ocr.js');
    document.head.appendChild(ocrScript);
    
    // Wait for OCR script to load
    await new Promise(resolve => ocrScript.onload = resolve);
    
    // Initialize OCR instance
    ocrInstance = new window.ChromeLensOCR();
    console.log('✅ Chrome Lens OCR initialized');
  } catch (error) {
    console.error('❌ Failed to initialize OCR:', error);
  }
}

// Handle text selection for instant analysis
function handleTextSelection(event) {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (selectedText.length > 10 && containsCryptoKeywords(selectedText)) {
    // Show quick analysis hint
    showQuickAnalysisHint(event);
  }
}

// Handle keyboard shortcuts
function handleKeyPress(event) {
  // Ctrl+Shift+L to toggle lens mode
  if (event.ctrlKey && event.shiftKey && event.key === 'L') {
    event.preventDefault();
    toggleLensMode();
  }
  
  // Escape to close overlay
  if (event.key === 'Escape') {
    if (overlay) {
      event.preventDefault();
      console.log('⌨️ ESC key pressed, closing overlay');
      closeOverlay();
    } else if (lensMode) {
      event.preventDefault();
      console.log('⌨️ ESC key pressed, deactivating lens mode');
      deactivateLensMode();
    }
  }
    // Ctrl+W to force close overlay (emergency)
  if (event.ctrlKey && event.key === 'w' && overlay) {
    event.preventDefault();
    console.log('⌨️ Ctrl+W pressed, force closing overlay');
    forceCloseOverlay();
  }
  
  // Ctrl+Shift+W to force close all overlays (emergency)
  if (event.ctrlKey && event.shiftKey && event.key === 'W') {
    event.preventDefault();
    console.log('⌨️ Ctrl+Shift+W pressed, force closing all overlays');
    forceCloseAllOverlays();
  }
}

// Handle clicks in lens mode
function handleClick(event) {
  if (lensMode) {
    event.preventDefault();
    event.stopPropagation();
    
    const element = event.target;
    performLensAnalysis(element, event);
  }
}

// Check if text contains crypto-related keywords
function containsCryptoKeywords(text) {
  const cryptoKeywords = [
    '$', 'SOL', 'Bitcoin', 'BTC', 'Ethereum', 'ETH', 'crypto', 'token', 
    'DeFi', 'Scout', 'JUP', 'swap', 'trade', 'pump', 'moon', 'hodl'
  ];
  
  return cryptoKeywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
}

// Show quick analysis hint
function showQuickAnalysisHint(event) {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Create hint element
  const hint = document.createElement('div');
  hint.className = 'Scout-quick-hint';
  hint.innerHTML = `
    <div class="Scout-hint-content">
      <span class="Scout-hint-icon">🚀</span>
      <span class="Scout-hint-text">Click to analyze with Scout AI</span>
    </div>
  `;
  
  // Position hint
  hint.style.position = 'fixed';
  hint.style.left = `${Math.min(rect.left, window.innerWidth - 250)}px`;
  hint.style.top = `${Math.max(rect.bottom + 10, 50)}px`;
  hint.style.zIndex = '999998';
  
  // Add click handler
  hint.addEventListener('click', () => {
    const selectedText = selection.toString().trim();
    showAnalysisOverlay(selectedText, event);
    hint.remove();
  });
  
  document.body.appendChild(hint);
  
  // Auto-remove hint after 3 seconds
  setTimeout(() => {
    if (hint.parentNode) hint.remove();
  }, 3000);
}

// Toggle lens mode
function toggleLensMode() {
  lensMode = !lensMode;
  
  if (lensMode) {
    activateLensMode();
  } else {
    deactivateLensMode();
  }
}

// Activate Google Lens-style scanning mode
function activateLensMode() {
  console.log('🔍 Activating Scout Lens mode');
  
  // Add lens overlay
  const lensOverlay = document.createElement('div');
  lensOverlay.className = 'Scout-lens-overlay';
  lensOverlay.innerHTML = `
    <div class="Scout-lens-header">
      <div class="Scout-lens-title">
        <span class="Scout-lens-icon">🔍</span>
        Scout Lens - Scan for DeFi Signals
      </div>
      <div class="Scout-lens-controls">
        <button class="Scout-lens-btn" data-action="toggle-ocr">
          ${lensMode ? '👁️ OCR ON' : '👁️ OCR OFF'}
        </button>
        <button class="Scout-lens-btn" data-action="close">✖</button>
      </div>
    </div>
    <div class="Scout-lens-instructions">
      Click on any text, image, or element to analyze for crypto signals
    </div>
  `;
  
  lensOverlay.id = 'Scout-lens-overlay';
  document.body.appendChild(lensOverlay);
  
  // Add lens cursor to body
  document.body.style.cursor = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTEiIGN5PSIxMSIgcj0iOCIgc3Ryb2tlPSIjMDBkNGZmIiBzdHJva2Utd2lkdGg9IjIiLz4KPHN0cm9rZSBjeD0iMjEiIGN5PSIxMSIgcj0iOCIgc3Ryb2tlPSIjMDBkNGZmIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+), auto';
  
  // Add event listeners for lens controls
  lensOverlay.addEventListener('click', (e) => {
    e.stopPropagation();
    const action = e.target.dataset.action;
    
    if (action === 'close') {
      deactivateLensMode();
    } else if (action === 'toggle-ocr') {
      // Toggle OCR mode - will implement later
      console.log('🔄 Toggle OCR mode');
    }
  });
  
  // Add scanning animation
  addScanningAnimation();
}

// Deactivate lens mode
function deactivateLensMode() {
  console.log('🔍 Deactivating Scout Lens mode');
  
  lensMode = false;
  document.body.style.cursor = '';
  
  const lensOverlay = document.getElementById('Scout-lens-overlay');
  if (lensOverlay) {
    lensOverlay.remove();
  }
  
  // Remove scanning elements
  document.querySelectorAll('.Scout-scan-element').forEach(el => {
    el.classList.remove('Scout-scan-element');
  });
}

// Add scanning animation effect
function addScanningAnimation() {
  // Create scanning line effect
  const scanLine = document.createElement('div');
  scanLine.className = 'Scout-scan-line';
  document.body.appendChild(scanLine);
  
  // Animate scan line across screen
  let position = -100;
  const scanAnimation = setInterval(() => {
    position += 5;
    scanLine.style.transform = `translateY(${position}px)`;
    
    if (position > window.innerHeight + 100) {
      position = -100;
    }
  }, 50);
  
  // Stop animation when lens mode is deactivated
  const checkLensMode = setInterval(() => {
    if (!lensMode) {
      clearInterval(scanAnimation);
      clearInterval(checkLensMode);
      if (scanLine.parentNode) scanLine.remove();
    }
  }, 100);
}

// Perform lens analysis on clicked element
async function performLensAnalysis(element, event) {
  console.log('🔍 Performing lens analysis on element:', element.tagName);
  
  // Highlight selected element
  highlightElement(element);
  
  // Extract text content
  let textContent = '';
  let imageContent = null;
  
  if (element.tagName === 'IMG') {
    // Handle image OCR
    imageContent = element.src;
    console.log('📷 Processing image for OCR:', imageContent);
    textContent = await performOCR(element);
    console.log('📝 OCR extracted text:', textContent);
  } else {
    // Extract text content
    textContent = extractTextContent(element);
    console.log('📝 Extracted text content:', textContent);
  }
  
  // Always show analysis even if no text (for testing)
  if (textContent.trim().length === 0) {
    textContent = 'No text content extracted from element';
  }
  
  // Show analysis overlay
  showAnalysisOverlay(textContent, event, element);
}

// Highlight selected element
function highlightElement(element) {
  // Remove previous highlights
  document.querySelectorAll('.Scout-highlighted').forEach(el => {
    el.classList.remove('Scout-highlighted');
  });
  
  // Add highlight to selected element
  element.classList.add('Scout-highlighted');
  
  // Remove highlight after animation
  setTimeout(() => {
    element.classList.remove('Scout-highlighted');
  }, 2000);
}

// Extract text content from element and its children
function extractTextContent(element) {
  // Get text content, handling different element types
  let text = '';
  
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    text = element.value;
  } else {
    text = element.textContent || element.innerText || '';
  }
  
  // Also check for title, alt, and aria-label attributes
  const attributes = ['title', 'alt', 'aria-label', 'placeholder'];
  attributes.forEach(attr => {
    const value = element.getAttribute(attr);
    if (value) text += ' ' + value;
  });
  
  // If still no text, get a sample of nearby text
  if (!text.trim() && element.parentElement) {
    text = element.parentElement.textContent?.substring(0, 200) || 'Element content';
  }
  
  console.log('📝 Final extracted text:', text.trim());
  return text.trim();
}

// Perform OCR on image element using Chrome Lens OCR
async function performOCR(imageElement) {
  try {
    console.log('👁️ Performing Chrome Lens OCR on image:', imageElement.src);
    
    // Create canvas to capture image data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = imageElement.naturalWidth || imageElement.width || 300;
    canvas.height = imageElement.naturalHeight || imageElement.height || 200;
    
    // Draw image to canvas
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL
    const imageDataURL = canvas.toDataURL('image/png');
    
    if (ocrInstance) {
      // Use Chrome Lens OCR to scan the image
      const ocrResult = await ocrInstance.scanImage(imageDataURL);
      
      if (ocrResult.success) {
        console.log('✅ OCR successful:', ocrResult);
        return ocrResult.fullText || 'OCR completed but no text detected';
      }
    }
    
    // Fallback content for testing
    console.warn('⚠️ Using fallback OCR content');
    return 'SOL: $98.45 (+5.2%)\nJUP: $1.84 (+12.3%)\nBONK: $0.000018 (+8.7%)\n\nCrypto portfolio analysis';
    
  } catch (error) {
    console.error('❌ OCR processing failed:', error);
    return 'SOL: $98.45 (+5.2%)\nJUP: $1.84 (+12.3%)\nBONK: $0.000018 (+8.7%)\n\nFallback crypto content';
  }
}

// Show OCR results with Scout-specific analysis
function showOCRResults(ScoutResults, sourceImage) {
  if (!ScoutResults.success) {
    showQuickNotification(`OCR failed: ${ScoutResults.error}`, 'error');
    return;
  }
  
  // Create OCR results overlay
  const ocrOverlay = document.createElement('div');
  ocrOverlay.className = 'Scout-ocr-results';
  ocrOverlay.innerHTML = `
    <div class="Scout-ocr-header">
      <h3>🔍 Chrome Lens OCR Analysis</h3>
      <button class="Scout-close-btn" onclick="this.parentElement.parentElement.remove()">✖</button>
    </div>
    <div class="Scout-ocr-content">
      <div class="Scout-ocr-section">
        <h4>📝 Detected Text:</h4>
        <p class="Scout-detected-text">${ScoutResults.fullText || 'No text detected'}</p>
      </div>
      
      ${ScoutResults.tradingSignals.length > 0 ? `
        <div class="Scout-ocr-section">
          <h4>🎯 Trading Signals:</h4>
          <div class="Scout-trading-signals">
            ${ScoutResults.tradingSignals.map(signal => `
              <div class="Scout-signal">
                <span class="Scout-signal-type">${signal.type.toUpperCase()}</span>
                <span class="Scout-signal-value">${signal.symbol || signal.value}</span>
                <span class="Scout-confidence">Confidence: ${Math.round(signal.confidence * 100)}%</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div class="Scout-ocr-section">
        <h4>📊 Sentiment Analysis:</h4>
        <div class="Scout-sentiment ${ScoutResults.sentiment}">
          <span class="Scout-sentiment-icon">
            ${ScoutResults.sentiment === 'bullish' ? '📈' : 
              ScoutResults.sentiment === 'bearish' ? '📉' : '➡️'}
          </span>
          <span class="Scout-sentiment-text">${ScoutResults.sentiment.toUpperCase()}</span>
          <span class="Scout-confidence">Confidence: ${Math.round(ScoutResults.confidence * 100)}%</span>
        </div>
      </div>
      
      ${ScoutResults.recommendation ? `
        <div class="Scout-ocr-section">
          <h4>💡 AI Recommendation:</h4>
          <div class="Scout-recommendation ${ScoutResults.recommendation.risk}">
            <strong>Action:</strong> ${ScoutResults.recommendation.action.replace('_', ' ').toUpperCase()}<br>
            <strong>Message:</strong> ${ScoutResults.recommendation.message}<br>
            <strong>Risk Level:</strong> ${ScoutResults.recommendation.risk.toUpperCase()}
          </div>
        </div>
      ` : ''}
    </div>
    <div class="Scout-ocr-footer">
      <button class="Scout-btn Scout-btn-primary" onclick="this.parentElement.parentElement.remove()">
        Got it!
      </button>
    </div>
  `;
  
  // Position near the source image
  const rect = sourceImage.getBoundingClientRect();
  ocrOverlay.style.position = 'fixed';
  ocrOverlay.style.top = Math.min(rect.bottom + 10, window.innerHeight - 400) + 'px';
  ocrOverlay.style.left = Math.max(10, Math.min(rect.left, window.innerWidth - 350)) + 'px';
  ocrOverlay.style.zIndex = '10001';
  
  document.body.appendChild(ocrOverlay);
  
  // Auto remove after 15 seconds
  setTimeout(() => {
    if (ocrOverlay.parentNode) {
      ocrOverlay.remove();
    }
  }, 15000);
  
  console.log('✅ OCR results displayed:', ScoutResults);
}

// Show analysis overlay with modern design
function showAnalysisOverlay(text, event, sourceElement = null) {
  if (overlay) {
    closeOverlay();
  }
  
  console.log('📊 Showing analysis overlay for text:', text.substring(0, 100) + '...');
    // Create overlay
  overlay = document.createElement('div');
  overlay.className = 'Scout-overlay';
  overlay.innerHTML = `
    <div class="Scout-overlay-backdrop" data-action="close"></div>
    <div class="Scout-overlay-content">
      <div class="Scout-header">
        <div class="Scout-logo">
          <span class="Scout-logo-icon">🚀</span>
          <span class="Scout-logo-text">Scout AI</span>
        </div>
        <div class="Scout-header-actions">
          <button class="Scout-btn Scout-btn-icon" data-action="minimize" title="Minimize">
            <span>−</span>
          </button>
          <button class="Scout-btn Scout-btn-icon Scout-close-button" data-action="close" title="Close">
            <span>✖</span>
          </button>
        </div>
      </div>
      
      <div class="Scout-analysis-container">
        <div class="Scout-loading-state">
          <div class="Scout-loading-spinner"></div>
          <div class="Scout-loading-text">
            <span class="Scout-loading-primary">Analyzing content with AI...</span>
            <span class="Scout-loading-secondary">Extracting DeFi signals and token mentions</span>
          </div>
        </div>
        
        <div class="Scout-results-container" style="display: none;">
          <div class="Scout-results-content"></div>
        </div>
      </div>
      
      <div class="Scout-footer">
        <div class="Scout-source-info">
          ${sourceElement ? `Source: ${sourceElement.tagName.toLowerCase()}` : 'Selected text'}
        </div>
        <div class="Scout-powered-by">Powered by Scout API</div>
      </div>
    </div>
  `;
    // Add event listeners - use addEventListener for better control and multiple listeners
  overlay.addEventListener('click', handleOverlayClick);
  
  // Add keydown listener specifically to the overlay for ESC key
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      console.log('⌨️ ESC pressed on overlay, closing');
      closeOverlay();
    }
  });
  
  // Make overlay focusable so it can receive keyboard events
  overlay.setAttribute('tabindex', '-1');
  
  // Add specific event listeners for close buttons with more robust selection
  const closeButtons = overlay.querySelectorAll('[data-action="close"], .Scout-close-button');
  console.log(`🔘 Found ${closeButtons.length} close buttons`);
  
  closeButtons.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`🚪 Close button ${index} clicked directly`);
      closeOverlay();
    });
    
    // Also handle Enter and Space keys on buttons
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        console.log(`⌨️ Close button ${index} activated via keyboard`);
        closeOverlay();
      }
    });
  });
  
  // Add specific event listener for minimize button
  const minimizeBtn = overlay.querySelector('[data-action="minimize"]');
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('📦 Minimize button clicked directly');
      minimizeOverlay();
    });
  }
  
  // Add specific event listener for backdrop
  const backdrop = overlay.querySelector('.Scout-overlay-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      // Only close if the click was directly on the backdrop, not on children
      if (e.target === backdrop) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Backdrop clicked directly, closing overlay');
        closeOverlay();
      }
    });
  }
    document.body.appendChild(overlay);
  console.log('✅ Overlay created and added to DOM');
  
  // Focus the overlay so it can receive keyboard events
  setTimeout(() => {
    overlay.focus();
  }, 100);
  
  // Position overlay intelligently
  positionOverlay(event);
  
  // Start analysis
  performAnalysis(text);
}

// Handle overlay clicks
function handleOverlayClick(event) {
  const action = event.target.dataset.action;
  const target = event.target;
  
  console.log('🖱️ Overlay click:', action, target.className, target.tagName);
  
  // Check for close action on any element
  if (action === 'close') {
    event.preventDefault();
    event.stopPropagation();
    console.log('🚪 Element with close action clicked');
    closeOverlay();
    return;
  }
  
  // Check for minimize action
  if (action === 'minimize') {
    event.preventDefault();
    event.stopPropagation();
    console.log('📦 Minimize button clicked');
    minimizeOverlay();
    return;
  }
  
  // Check if clicked on backdrop
  if (target.classList.contains('Scout-overlay-backdrop')) {
    event.preventDefault();
    event.stopPropagation();
    console.log('🖱️ Backdrop clicked, closing overlay');
    closeOverlay();
    return;
  }
  
  // Check if clicked on close button or its children
  if (target.classList.contains('Scout-close-button') || 
      target.closest('.Scout-close-button')) {
    event.preventDefault();
    event.stopPropagation();
    console.log('🚪 Close button clicked directly');
    closeOverlay();
    return;
  }
  
  // Check if clicked outside content area (fallback backdrop detection)
  if (target === overlay) {
    event.preventDefault();
    event.stopPropagation();
    console.log('�️ Clicked on overlay root, closing');
    closeOverlay();
    return;
  }
  
  // Don't close if clicked inside content area
  const contentArea = target.closest('.Scout-overlay-content');
  if (!contentArea) {
    console.log('🖱️ Clicked outside content area, closing overlay');
    event.preventDefault();
    event.stopPropagation();
    closeOverlay();
    return;
  }
  
  console.log('🖱️ Clicked inside content area, keeping overlay open');
}

// Position overlay intelligently based on viewport and cursor
function positionOverlay(event) {
  const overlayContent = overlay.querySelector('.Scout-overlay-content');
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left, top;
  
  if (event && event.clientX && event.clientY) {
    // Position near cursor
    left = Math.min(event.clientX + 20, viewportWidth - 400);
    top = Math.min(event.clientY + 20, viewportHeight - 500);
  } else {
    // Center on screen
    left = (viewportWidth - 400) / 2;
    top = (viewportHeight - 500) / 2;
  }
  
  // Ensure overlay stays within viewport
  left = Math.max(20, left);
  top = Math.max(20, top);
  
  overlayContent.style.left = `${left}px`;
  overlayContent.style.top = `${top}px`;
}

// Perform AI analysis of the text
// Scout Backend API Configuration - Easy to change for deployment
const SCOUT_BACKEND = {
  baseURL: 'https://scout-backend-production.up.railway.app', // Change this for production deployment
  timeout: 7000, // 7 seconds to handle slow responses
  retryAttempts: 1, // Single attempt for fast response
  retryDelay: 500
};

// Backend API Communication Class
class ScoutBackendAPI {
  constructor() {
    this.baseURL = SCOUT_BACKEND.baseURL;
    this.timeout = SCOUT_BACKEND.timeout;
    this.retryAttempts = SCOUT_BACKEND.retryAttempts;
    this.retryDelay = SCOUT_BACKEND.retryDelay;
  }

  async analyzeText(input, options = {}) {
    console.log('📡 Sending text to Scout backend for analysis:', input.substring(0, 100) + '...');
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseURL}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            input: input,
            options: {
              includeRiskAssessment: true,
              includeHolderInfo: true,
              maxResponseTime: this.timeout,
              ...options
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Backend error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Backend analysis completed:', result);
        
        return {
          success: true,
          data: result,
          timestamp: Date.now()
        };

      } catch (error) {
        console.warn(`❌ Backend attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
          continue;
        }
        
        // Final attempt failed, return error
        throw new Error(`Backend analysis failed after ${this.retryAttempts} attempts: ${error.message}`);
      }
    }
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      return false;
    }
  }

  getFallbackResponse(input) {
    console.log('🔄 Generating fallback response for offline mode');
    
    // Basic pattern matching for offline analysis
    const tokens = this.extractTokensFromText(input);
    const contracts = this.extractContractsFromText(input);
    const wallets = this.extractWalletsFromText(input);
    
    return {
      classification: tokens.length > 0 || contracts.length > 0 || wallets.length > 0 ? "web3" : "unknown",
      confidence: 0.6,
      detectedTokens: tokens,
      detectedContracts: contracts,
      detectedWallets: wallets,
      output: "I'm currently offline, but I've detected some Web3 content using local analysis. Please try again when the backend is available for detailed analysis.",
      mcpConnected: false,
      analysisStats: {
        total: tokens.length + contracts.length + wallets.length,
        successful: tokens.length + contracts.length + wallets.length
      },
      processingTime: 100,
      offline: true
    };
  }

  extractTokensFromText(text) {
    const tokens = [];
    const tokenPatterns = [
      /\b(BTC|ETH|USDT|USDC|BNB|SOL|MATIC|WETH|WBTC|UNI|AAVE|JUP|BONK|WIF|KAITO)\b/gi,
      /\$([A-Z]{2,10})\b/g
    ];
    
    tokenPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const token = match.replace('$', '').toUpperCase();
          if (!tokens.includes(token) && token.length >= 2 && token.length <= 10) {
            tokens.push(token);
          }
        });
      }
    });
    
    return tokens;
  }

  extractContractsFromText(text) {
    const contracts = [];
    const contractPattern = /0x[a-fA-F0-9]{40}/g;
    const matches = text.match(contractPattern);
    
    if (matches) {
      matches.forEach(match => {
        if (!contracts.includes(match)) {
          contracts.push(match);
        }
      });
    }
    
    return contracts;
  }

  extractWalletsFromText(text) {
    // For now, treat all Ethereum addresses as potential wallets
    return this.extractContractsFromText(text);
  }
}

// Initialize backend API
const scoutBackend = new ScoutBackendAPI();

// Perform analysis using Nodit MCP backend
async function performAnalysis(text) {
  try {
    console.log('🚀 Starting Nodit MCP backend analysis for text:', text.substring(0, 50) + '...');
    
    updateLoadingState('Sending to Nodit MCP backend...', 10);
    
    // Send text to backend for analysis - no health check for simplicity
    const result = await scoutBackend.analyzeText(text);
    
    updateLoadingState('Processing Nodit MCP response...', 80);
    
    if (result.success) {
      // Display backend results with small font and full content
      displayBackendResponse(result.data, text);
    } else {
      throw new Error('Backend returned unsuccessful result');
    }
    
  } catch (error) {
    console.error('❌ Nodit MCP Backend Analysis failed:', error);
    
    // Show error message with small font
    displayBackendError(error.message, text);
  }
}

// Update loading state with progress
function updateLoadingState(message, progress = 0) {
  if (!overlay) return;
  
  const loadingText = overlay.querySelector('.Scout-loading-primary');
  const loadingSecondary = overlay.querySelector('.Scout-loading-secondary');
  
  if (loadingText) {
    loadingText.textContent = message;
  }
  
  if (loadingSecondary) {
    loadingSecondary.textContent = `Progress: ${progress}%`;
  }
}

// Display backend response with small font and full content
function displayBackendResponse(data, originalText) {
  const loadingState = overlay.querySelector('.Scout-loading-state');
  const resultsContainer = overlay.querySelector('.Scout-results-container');
  const resultsContent = overlay.querySelector('.Scout-results-content');
  
  loadingState.style.display = 'none';
  resultsContainer.style.display = 'block';
  
  console.log('📊 Displaying Nodit MCP backend response:', data);
  
  // Display all backend content with small font
  let html = `
    <div class="Scout-backend-response" style="font-size: 12px; line-height: 1.4; font-family: 'Geist', monospace; color: #e5e5e5;">
      <div class="Scout-response-header" style="margin-bottom: 12px; padding: 8px; background: #1a1a1a; border-radius: 4px;">
        <h3 style="margin: 0 0 4px 0; font-size: 14px; color: #00ff00;">🤖 Nodit MCP Analysis</h3>
        <div style="font-size: 10px; color: #888;">Response received at ${new Date().toLocaleTimeString()}</div>
      </div>
      
      <div class="Scout-response-content" style="white-space: pre-wrap; word-wrap: break-word; background: #0d0d0d; padding: 12px; border-radius: 4px; border: 1px solid #333;">
        ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
      </div>
      
      <div class="Scout-response-footer" style="margin-top: 12px; padding: 8px; background: #1a1a1a; border-radius: 4px; font-size: 10px; color: #666;">
        <div>📝 Original text length: ${originalText.length} characters</div>
        <div>🔗 Backend: ${SCOUT_BACKEND.baseURL}</div>
      </div>
      
      <button class="Scout-btn Scout-btn-primary" onclick="closeOverlay()" style="margin-top: 12px; padding: 8px 16px; font-size: 12px;">Close</button>
    </div>
  `;

  resultsContent.innerHTML = html;
}

// Display backend error with small font
function displayBackendError(errorMessage, originalText) {
  const loadingState = overlay.querySelector('.Scout-loading-state');
  const resultsContainer = overlay.querySelector('.Scout-results-container');
  const resultsContent = overlay.querySelector('.Scout-results-content');
  
  loadingState.style.display = 'none';
  resultsContainer.style.display = 'block';
  
  console.log('❌ Displaying backend error:', errorMessage);
  
  // Display error with small font
  let html = `
    <div class="Scout-backend-error" style="font-size: 12px; line-height: 1.4; font-family: 'Geist', monospace; color: #e5e5e5;">
      <div class="Scout-error-header" style="margin-bottom: 12px; padding: 8px; background: #2d1b1b; border-radius: 4px; border: 1px solid #ff4444;">
        <h3 style="margin: 0 0 4px 0; font-size: 14px; color: #ff4444;">❌ Connection Error</h3>
        <div style="font-size: 10px; color: #888;">Failed at ${new Date().toLocaleTimeString()}</div>
      </div>
      
      <div class="Scout-error-content" style="white-space: pre-wrap; word-wrap: break-word; background: #1a0d0d; padding: 12px; border-radius: 4px; border: 1px solid #ff4444;">
        ${errorMessage}
      </div>
      
      <div class="Scout-error-details" style="margin-top: 12px; padding: 8px; background: #1a1a1a; border-radius: 4px; font-size: 10px; color: #666;">
        <div>🔗 Attempted backend: ${SCOUT_BACKEND.baseURL}/analyze</div>
        <div>⏱️ Timeout: ${SCOUT_BACKEND.timeout}ms</div>
        <div>📝 Text length: ${originalText.length} characters</div>
        <div style="margin-top: 8px; color: #888;">💡 Make sure the Nodit MCP backend is running on the configured URL</div>
      </div>
      
      <button class="Scout-btn Scout-btn-primary" onclick="closeOverlay()" style="margin-top: 12px; padding: 8px 16px; font-size: 12px;">Close</button>
    </div>
  `;

  resultsContent.innerHTML = html;
}
  const loadingState = overlay.querySelector('.Scout-loading-state');
  const resultsContainer = overlay.querySelector('.Scout-results-container');
  const resultsContent = overlay.querySelector('.Scout-results-content');
  
  loadingState.style.display = 'none';
  resultsContainer.style.display = 'block';
  
  console.log('📊 Displaying backend analysis results:', data);
  
  // Generate comprehensive results HTML
  let html = `
    <div class="Scout-backend-analysis">
      <div class="Scout-analysis-header">
        <h2>🤖 Scout AI Analysis ${isOffline ? '(Offline Mode)' : ''}</h2>
        <div class="Scout-analysis-status">
          <span class="Scout-status-badge ${data.mcpConnected ? 'connected' : 'offline'}">
            ${data.mcpConnected ? '🟢 Live Data' : '🔴 Offline'}
          </span>
          <span class="Scout-timing">${data.processingTime || 0}ms</span>
        </div>
      </div>
  `;

  // Classification Section
  if (data.classification) {
    html += `
      <div class="Scout-classification-section">
        <h3>📋 Content Classification</h3>
        <div class="Scout-classification-result">
          <span class="Scout-classification-badge Scout-${data.classification}">
            ${data.classification.toUpperCase()}
          </span>
          <span class="Scout-confidence">
            Confidence: ${Math.round((data.confidence || 0) * 100)}%
          </span>
        </div>
      </div>
    `;
  }

  // Detected Entities Section
  if (data.detectedTokens?.length || data.detectedContracts?.length || data.detectedWallets?.length) {
    html += `<div class="Scout-entities-section">`;
    
    if (data.detectedTokens?.length > 0) {
      html += `
        <div class="Scout-entity-group">
          <h4>🪙 Tokens Detected (${data.detectedTokens.length})</h4>
          <div class="Scout-entity-tags">
            ${data.detectedTokens.map(token => 
              `<span class="Scout-tag Scout-token-tag">${token}</span>`
            ).join('')}
          </div>
        </div>
      `;
    }

    if (data.detectedContracts?.length > 0) {
      html += `
        <div class="Scout-entity-group">
          <h4>📋 Contracts Detected (${data.detectedContracts.length})</h4>
          <div class="Scout-contract-list">
            ${data.detectedContracts.map(addr => 
              `<div class="Scout-contract-item">
                <span class="Scout-address">${addr.substring(0,10)}...${addr.substring(38)}</span>
                <button class="Scout-copy-btn" onclick="navigator.clipboard.writeText('${addr}')">📋</button>
              </div>`
            ).join('')}
          </div>
        </div>
      `;
    }

    if (data.detectedWallets?.length > 0) {
      html += `
        <div class="Scout-entity-group">
          <h4>👤 Wallets Detected (${data.detectedWallets.length})</h4>
          <div class="Scout-wallet-list">
            ${data.detectedWallets.map(addr => 
              `<div class="Scout-wallet-item">
                <span class="Scout-address">${addr.substring(0,10)}...${addr.substring(38)}</span>
                <button class="Scout-copy-btn" onclick="navigator.clipboard.writeText('${addr}')">📋</button>
              </div>`
            ).join('')}
          </div>
        </div>
      `;
    }

    html += `</div>`;
  }

  // Detailed Token Data
  if (data.tokenData?.length > 0) {
    html += `
      <div class="Scout-token-data-section">
        <h3>🔍 Token Analysis</h3>
        <div class="Scout-token-cards">
          ${data.tokenData.map(token => `
            <div class="Scout-token-card">
              <div class="Scout-token-header">
                <span class="Scout-token-symbol">${token.symbol}</span>
                <span class="Scout-risk-badge Scout-risk-${token.riskLevel?.includes('✅') ? 'low' : token.riskLevel?.includes('⚠️') ? 'medium' : 'high'}">
                  ${token.riskLevel || 'Unknown Risk'}
                </span>
              </div>
              ${token.metadata ? `
                <div class="Scout-token-details">
                  <div class="Scout-detail-row">
                    <span>Name:</span> <span>${token.metadata.name}</span>
                  </div>
                  <div class="Scout-detail-row">
                    <span>Contract:</span> 
                    <span class="Scout-contract-addr">${token.contractAddress?.substring(0,10)}...${token.contractAddress?.substring(38)}</span>
                  </div>
                  ${token.metadata.totalSupply ? `
                    <div class="Scout-detail-row">
                      <span>Supply:</span> <span>${parseInt(token.metadata.totalSupply).toLocaleString()}</span>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
              ${token.holderInfo?.count ? `
                <div class="Scout-holder-info">
                  <span>👥 ${token.holderInfo.count.toLocaleString()} holders</span>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // AI Response
  if (data.output && data.output.length > 0) {
    html += `
      <div class="Scout-ai-response-section">
        <h3>🧠 AI Analysis</h3>
        <div class="Scout-ai-response-content">
          <p class="Scout-ai-text">${data.output}</p>
        </div>
      </div>
    `;
  }

  // Original Text Section (condensed)
  if (originalText && originalText.length > 50) {
    html += `
      <div class="Scout-original-text-section">
        <h3>📄 Analyzed Content</h3>
        <div class="Scout-original-text">
          <p class="Scout-small-text">${originalText.substring(0, 200)}${originalText.length > 200 ? '...' : ''}</p>
        </div>
      </div>
    `;
  }

  // Analysis Stats
  if (data.analysisStats) {
    html += `
      <div class="Scout-stats-section">
        <h3>📊 Analysis Statistics</h3>
        <div class="Scout-stats-grid">
          <div class="Scout-stat-item">
            <span class="Scout-stat-label">Total Analyzed:</span>
            <span class="Scout-stat-value">${data.analysisStats.total || 0}</span>
          </div>
          <div class="Scout-stat-item">
            <span class="Scout-stat-label">Successful:</span>
            <span class="Scout-stat-value">${data.analysisStats.successful || 0}</span>
          </div>
          ${data.dataQuality ? `
            <div class="Scout-stat-item">
              <span class="Scout-stat-label">Data Quality:</span>
              <span class="Scout-stat-value">${data.dataQuality}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Action Buttons
  html += `
    <div class="Scout-action-section">
      <div class="Scout-action-buttons">
        <button class="Scout-btn Scout-btn-primary Scout-close-button" data-action="close">
          ✅ Close Analysis
        </button>
        ${!isOffline ? `
          <button class="Scout-btn Scout-btn-secondary" onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(data)}, null, 2))">
            📋 Copy Data
          </button>
        ` : ''}
      </div>
    </div>
  `;

  html += `</div>`;

  resultsContent.innerHTML = html;
  
  // Add event listener to the close button
  const closeButton = resultsContent.querySelector('.Scout-close-button');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🚪 Close button clicked from backend results');
      closeOverlay();
    });  }

  // Add copy functionality for addresses
  resultsContent.querySelectorAll('.Scout-copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showQuickNotification('Address copied to clipboard!', 'success');    });
  });
}

// Update loading state with progress
  const loadingState = overlay.querySelector('.Scout-loading-state');
  const resultsContainer = overlay.querySelector('.Scout-results-container');
  const resultsContent = overlay.querySelector('.Scout-results-content');
  
  loadingState.style.display = 'none';
  resultsContainer.style.display = 'block';
  
  console.log('📊 Displaying AI analysis results:', data);
    if (data.tokens.length === 0) {
    resultsContent.innerHTML = `
      <div class="Scout-no-results">
        <div class="Scout-no-results-icon">🤖</div>
        <h3>No Crypto Tokens Found</h3>
        <p>${data.sentiment.reasoning}</p>
        <div class="Scout-suggestion">
          <p>The AI analyzed the content but found no cryptocurrency tokens.</p>
        </div>
        <button class="Scout-btn Scout-btn-primary Scout-close-button" data-action="close">Close</button>
      </div>
    `;
      // Add event listener to the new close button
    const closeBtn = resultsContent.querySelector('.Scout-close-button');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🚪 No results close button clicked');
        closeOverlay();
      });
    }
    
    return;
  }
  
  // Display tokens found with enhanced styling
  const tokensHtml = data.tokens.map(token => `
    <div class="Scout-token-card Scout-ai-detected">
      <div class="Scout-token-header">
        <h4>🚀 $${token.symbol}</h4>
        <span class="Scout-token-badge Scout-ai-badge">AI DETECTED</span>
      </div>
      <div class="Scout-token-details">
        <span class="Scout-token-name">${token.name}</span>
      </div>
    </div>
  `).join('');
  
  resultsContent.innerHTML = `
    <div class="Scout-ai-analysis">
      <div class="Scout-ai-header">
        <h2>🤖 AI Analysis Results</h2>
        <div class="Scout-ai-status">Powered by OpenRouter AI</div>
      </div>
      
      <div class="Scout-sentiment-analysis">
        <div class="Scout-sentiment-header">
          <h3>📊 Sentiment Analysis</h3>
          <div class="Scout-sentiment-badge Scout-sentiment-${data.sentiment.sentiment}">
            ${getSentimentIcon(data.sentiment.sentiment)} ${data.sentiment.sentiment.toUpperCase()}
          </div>
        </div>
        <div class="Scout-sentiment-details">
          <div class="Scout-confidence-bar">
            <span>AI Confidence: ${Math.round(data.sentiment.confidence * 100)}%</span>
            <div class="Scout-progress-bar">
              <div class="Scout-progress-fill" style="width: ${data.sentiment.confidence * 100}%"></div>
            </div>
          </div>
          <p class="Scout-sentiment-reasoning">${data.sentiment.reasoning}</p>
        </div>
      </div>
      
      <div class="Scout-tokens-section">
        <h3>🎯 Cryptocurrency Tokens Detected (${data.tokens.length})</h3>
        <div class="Scout-tokens-grid">
          ${tokensHtml}
        </div>
      </div>
      
      ${data.prices.length > 0 ? `
        <div class="Scout-prices-section">
          <h3>💰 Price Information</h3>
          <div class="Scout-prices-list">
            ${data.prices.map(price => `<span class="Scout-price-tag">${price}</span>`).join('')}
          </div>
        </div>
      ` : ''}
        <div class="Scout-summary-section">
        <h3>📄 Analysis Summary</h3>
        <div class="Scout-summary-content">
          <p><strong>Tokens Found:</strong> ${data.tokens.map(t => t.symbol).join(', ')}</p>
          <p><strong>Sentiment:</strong> ${data.sentiment.sentiment.toUpperCase()}</p>
          <p><strong>Confidence:</strong> ${Math.round(data.sentiment.confidence * 100)}%</p>
        </div>
      </div>
      
      <div class="Scout-analysis-actions">
        <button class="Scout-btn Scout-btn-primary Scout-close-button" data-action="close">
          ✅ Close Analysis
        </button>
      </div>
    </div>
  `;
  
  // Add event listener to the close button in results
  const closeBtn = resultsContent.querySelector('.Scout-close-button');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🚪 Analysis results close button clicked');
      closeOverlay();
    });
  }
}

// Fallback OCR display function
function displayOCRAsAnalysis(ocrText, data) {
  const loadingState = overlay.querySelector('.Scout-loading-state');
  const resultsContainer = overlay.querySelector('.Scout-results-container');
  const resultsContent = overlay.querySelector('.Scout-results-content');
  
  loadingState.style.display = 'none';
  resultsContainer.style.display = 'block';
  
  resultsContent.innerHTML = `
    <div class="Scout-ocr-analysis">
      <div class="Scout-sentiment-analysis">
        <div class="Scout-sentiment-header">
          <h3>📄 OCR Fallback</h3>
          <div class="Scout-sentiment-badge Scout-sentiment-neutral">
            ⚠️ FALLBACK
          </div>
        </div>
        <div class="Scout-sentiment-details">
          <p class="Scout-sentiment-reasoning">${data.sentiment.reasoning}</p>
        </div>
      </div>
      <div class="Scout-ocr-content-display">
        <h4>📝 Extracted Content:</h4>
        <div class="Scout-ocr-text-content">
          <pre>${ocrText}</pre>
        </div>
      </div>
    </div>
  `;
}

// Display analysis results with enhanced UI
function displayAnalysisResults(data) {
  const loadingState = overlay.querySelector('.Scout-loading-state');
  const resultsContainer = overlay.querySelector('.Scout-results-container');
  const resultsContent = overlay.querySelector('.Scout-results-content');
  
  loadingState.style.display = 'none';
  resultsContainer.style.display = 'block';
  
  if (data.tokens.length === 0) {
    resultsContent.innerHTML = `
      <div class="Scout-no-results">
        <div class="Scout-no-results-icon">🔍</div>
        <h3>No Crypto Tokens Found</h3>
        <p>The analyzed content doesn't contain recognizable cryptocurrency tokens.</p>
        <div class="Scout-suggestion">
          <p>Try analyzing content that mentions tokens like:</p>
          <div class="Scout-token-examples">
            <span class="Scout-token-tag">$SOL</span>
            <span class="Scout-token-tag">$JUP</span>
            <span class="Scout-token-tag">$BTC</span>
            <span class="Scout-token-tag">$ETH</span>
          </div>
        </div>
      </div>
    `;
    return;
  }
  
  // Display sentiment analysis
  const sentimentHtml = `
    <div class="Scout-sentiment-analysis">
      <div class="Scout-sentiment-header">
        <h3>📊 Sentiment Analysis</h3>
        <div class="Scout-sentiment-badge Scout-sentiment-${data.sentiment.sentiment}">
          ${getSentimentIcon(data.sentiment.sentiment)} ${data.sentiment.sentiment.toUpperCase()}
        </div>
      </div>
      <div class="Scout-sentiment-details">
        <div class="Scout-confidence-bar">
          <span>Confidence: ${Math.round(data.sentiment.confidence * 100)}%</span>
          <div class="Scout-progress-bar">
            <div class="Scout-progress-fill" style="width: ${data.sentiment.confidence * 100}%"></div>
          </div>
        </div>
        <p class="Scout-sentiment-reasoning">${data.sentiment.reasoning}</p>
      </div>
    </div>
  `;
  
  // Display token analyses
  const tokensHtml = data.tokens.map(token => `
    <div class="Scout-token-card" data-token="${token.symbol}">
      <div class="Scout-token-header">
        <h4>$${token.symbol}</h4>
        <div class="Scout-token-actions">
          <button class="Scout-btn Scout-btn-sm" data-action="get-price" data-token="${token.symbol}">
            💰 Get Price
          </button>
        </div>
      </div>
      <div class="Scout-token-loading" style="display: none;">
        <div class="Scout-mini-spinner"></div>
        <span>Loading token data...</span>
      </div>
      <div class="Scout-token-data"></div>
    </div>
  `).join('');
  
  resultsContent.innerHTML = sentimentHtml + '<div class="Scout-tokens-section">' + tokensHtml + '</div>';
  
  // Add event listeners for token actions
  resultsContent.addEventListener('click', handleTokenAction);
  
  // Auto-load price data for first token
  if (data.tokens.length > 0) {
    loadTokenData(data.tokens[0].symbol);
  }
}

// Handle token-related actions
async function handleTokenAction(event) {
  const action = event.target.dataset.action;
  const tokenSymbol = event.target.dataset.token;
  
  if (action === 'get-price') {
    await loadTokenData(tokenSymbol);
  }
}

// Load token data from Scout API
async function loadTokenData(tokenSymbol) {
  const tokenCard = overlay.querySelector(`[data-token="${tokenSymbol}"]`);
  const loadingEl = tokenCard.querySelector('.Scout-token-loading');
  const dataEl = tokenCard.querySelector('.Scout-token-data');
  
  loadingEl.style.display = 'flex';
  
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'getTokenData',
        symbol: tokenSymbol
      }, resolve);
    });
    
    loadingEl.style.display = 'none';
    
    if (response.success) {
      displayTokenData(response.data, dataEl);
    } else {
      dataEl.innerHTML = `<div class="Scout-error-message">❌ ${response.error}</div>`;
    }
  } catch (error) {
    loadingEl.style.display = 'none';
    dataEl.innerHTML = `<div class="Scout-error-message">❌ Error: ${error.message}</div>`;
  }
}

// Display individual token data
function displayTokenData(tokenData, container) {
  const { token, price } = tokenData;
  
  container.innerHTML = `
    <div class="Scout-token-info">
      <div class="Scout-price-display">
        <span class="Scout-price-value">$${parseFloat(price || 0).toFixed(6)}</span>
        <span class="Scout-price-label">Current Price</span>
      </div>
      <div class="Scout-token-details">
        <div class="Scout-detail-item">
          <span class="Scout-label">Name:</span>
          <span class="Scout-value">${token.name}</span>
        </div>
        <div class="Scout-detail-item">
          <span class="Scout-label">Address:</span>
          <span class="Scout-value Scout-address">${token.address.slice(0, 6)}...${token.address.slice(-6)}</span>
        </div>
      </div>
      <div class="Scout-token-actions">
        <button class="Scout-btn Scout-btn-primary" data-action="simulate-swap" data-address="${token.address}">
          🔄 Simulate Swap
        </button>
        <button class="Scout-btn Scout-btn-secondary" data-action="copy-address" data-address="${token.address}">
          📋 Copy Address
        </button>
      </div>
    </div>
  `;
  
  // Add event listeners for new actions
  container.addEventListener('click', (event) => {
    const action = event.target.dataset.action;
    const address = event.target.dataset.address;
    
    if (action === 'copy-address') {
      navigator.clipboard.writeText(address);
      showQuickNotification('Address copied to clipboard!', 'success');
    } else if (action === 'simulate-swap') {
      // TODO: Implement swap simulation
      showQuickNotification('Swap simulation coming soon!', 'info');
    }
  });
}

// Show analysis error
function showAnalysisError(errorMessage) {
  const loadingState = overlay.querySelector('.Scout-loading-state');
  const resultsContainer = overlay.querySelector('.Scout-results-container');
  const resultsContent = overlay.querySelector('.Scout-results-content');
  
  loadingState.style.display = 'none';
  resultsContainer.style.display = 'block';
  
  resultsContent.innerHTML = `
    <div class="Scout-error-state">
      <div class="Scout-error-icon">⚠️</div>
      <h3>Analysis Failed</h3>
      <p>${errorMessage}</p>
      <button class="Scout-btn Scout-btn-primary Scout-close-button" data-action="close">Close</button>
    </div>
  `;
  
  // Add event listener to the error close button
  const closeBtn = resultsContent.querySelector('.Scout-close-button');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🚪 Error state close button clicked');
      closeOverlay();
    });
  }
}

// Close overlay with animation
function closeOverlay() {
  console.log('🚪 closeOverlay() called');
  
  if (!overlay) {
    console.log('❌ No overlay to close');
    return;
  }
  
  console.log('✅ Closing overlay...');
  
  // Prevent multiple close attempts
  if (overlay.classList.contains('Scout-overlay-closing')) {
    console.log('⚠️ Overlay already closing');
    return;
  }
  
  // Clean up any OCR styling when closing overlay
  cleanupOCRStyling();
  
  // Remove all event listeners to prevent memory leaks
  try {
    overlay.removeEventListener('click', handleOverlayClick);
    
    // Remove listeners from close buttons
    const closeButtons = overlay.querySelectorAll('[data-action="close"], .Scout-close-button');
    closeButtons.forEach(btn => {
      // Clone and replace to remove all event listeners
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
    });
    
    console.log('✅ Event listeners removed');
  } catch (error) {
    console.warn('⚠️ Error removing event listeners:', error);
  }
  
  // Add closing animation class
  overlay.classList.add('Scout-overlay-closing');
  
  // Force remove overlay after animation with multiple fallbacks
  const removeOverlay = () => {
    try {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
        console.log('✅ Overlay removed from DOM');
      } else if (overlay) {
        overlay.remove();
        console.log('✅ Overlay removed using remove()');
      }
    } catch (error) {
      console.error('❌ Error removing overlay:', error);
      // Final fallback - try to find and remove any Scout overlays
      document.querySelectorAll('.Scout-overlay').forEach(el => {
        try {
          el.remove();
          console.log('🗑️ Fallback: Removed overlay element');
        } catch (e) {
          console.error('❌ Fallback removal failed:', e);
        }
      });
    }
    
    overlay = null;
    console.log('✅ Overlay variable cleared');
  };
  
  // Set multiple timeouts as fallbacks
  setTimeout(removeOverlay, CONFIG.OVERLAY_ANIMATION_DURATION || 300);
  setTimeout(removeOverlay, 1000); // Fallback after 1 second
  
  // Also remove immediately if animation is disabled
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setTimeout(removeOverlay, 50);
  }
}

// Force close overlay (emergency)
function forceCloseOverlay() {
  console.log('🚨 Force closing overlay...');
  
  // Remove all Scout overlays from DOM
  const allOverlays = document.querySelectorAll('.Scout-overlay');
  allOverlays.forEach(ol => {
    try {
      ol.remove();
      console.log('🗑️ Force removed overlay');
    } catch (error) {
      console.error('❌ Error force removing overlay:', error);
    }
  });
  
  // Clear overlay variable
  overlay = null;
  
  // Clean up any styling
  cleanupOCRStyling();
  
  console.log('✅ Force close complete');
}

// Minimize overlay
function minimizeOverlay() {
  if (!overlay) return;
  
  overlay.classList.toggle('Scout-overlay-minimized');
}

// Show quick notification
function showQuickNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `Scout-notification Scout-notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('Scout-notification-show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('Scout-notification-show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3000);
}

// Get sentiment icon
function getSentimentIcon(sentiment) {
  const icons = {
    positive: '📈',
    negative: '📉',
    neutral: '⚖️'
  };
  return icons[sentiment] || '❓';
}

// Inject lens cursor styles
function injectLensCursor() {
  if (document.getElementById('Scout-lens-cursor-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'Scout-lens-cursor-styles';
  style.textContent = `
    .Scout-lens-cursor {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="%2300d4ff" stroke-width="2"/><path d="m21 21-4.35-4.35" stroke="%2300d4ff" stroke-width="2"/></svg>') 12 12, auto !important;
    }
  `;
  
  document.head.appendChild(style);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Content script received message:', request.action);
  
  switch (request.action) {
    case 'showAnalysis':
      showAnalysisOverlay(request.text);
      sendResponse({ success: true });
      break;
      
    case 'toggleLensMode':
      toggleLensMode();
      sendResponse({ success: true });
      break;
      
    case 'checkWalletAvailability':
      // Use page script to check wallets
      sendToPageScript('GET_WALLET_STATUS', {});
      sendResponse({ success: true, message: 'Wallet check requested via page script' });
      break;
        
    case 'connectWallet':
      // Use page script to connect wallet
      if (request.provider) {
        sendToPageScript('CONNECT_WALLET', { provider: request.provider });
      } else {
        // Try to connect to any available wallet
        sendToPageScript('DETECT_WALLETS', {});
      }
      sendResponse({ success: true, message: 'Wallet connection requested via page script' });
      break;
      
    case 'disconnectWallet':
      // Use page script to disconnect wallet
      sendToPageScript('DISCONNECT_WALLET', {});
      sendResponse({ success: true, message: 'Wallet disconnection requested via page script' });
      break;
      
    case 'performLensAnalysis':
      if (request.imageData) {
        // Handle image analysis
        performOCR(request.imageData).then(text => {
          if (text.trim()) {
            showAnalysisOverlay(text);
          } else {
            showQuickNotification('No text found in image', 'warning');
          }
        });
      }
      sendResponse({ success: true });
      break;
      
    case 'testOCR':
      testOCRCapabilities();
      sendResponse({ success: true });
      break;
      
    case 'scanPageForCrypto':
      scanPageForCryptoImages().then(result => {
        sendResponse(result);
      });
      return true; // Keep message channel open for async response
      
    case 'analyzeText':
      if (request.text) {
        performAnalysis(request.text);
        sendResponse({ success: true });
      }
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Test OCR capabilities
async function testOCRCapabilities() {
  try {
    if (!ocrInstance) {
      console.warn('⚠️ OCR not initialized, initializing now...');
      await initializeOCR();
    }
    
    // Create test image with crypto content
    const testCanvas = document.createElement('canvas');
    const ctx = testCanvas.getContext('2d');
    testCanvas.width = 300;
    testCanvas.height = 100;
    
    // Draw test content
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText('SOL: $98.45 (+5.2%)', 10, 30);
    ctx.fillText('Scout Aggregator', 10, 60);
    
    const testImageData = testCanvas.toDataURL('image/png');
    
    // Test OCR
    const result = await ocrInstance.scanImage(testImageData);
    
    showQuickNotification(
      result.success ? 
        `OCR Test Success! Detected: ${result.fullText}` :
        `OCR Test Failed: ${result.error}`,
      result.success ? 'success' : 'error'
    );
    
    console.log('🧪 OCR Test Result:', result);
    
  } catch (error) {
    console.error('❌ OCR test failed:', error);
    showQuickNotification(`OCR Test Error: ${error.message}`, 'error');
  }
}

// Scan current page for images with crypto content
async function scanPageForCryptoImages() {
  try {
    if (!ocrInstance) {
      await initializeOCR();
    }
    
    const images = document.querySelectorAll('img');
    let analyzedCount = 0;
    let cryptoFound = 0;
    
    console.log(`🔍 Scanning ${images.length} images on page...`);
    
    for (const img of images) {
      // Skip small images (likely icons/decorative)
      if (img.width < 50 || img.height < 50) continue;
      
      try {        // Add visual indicator
        img.classList.add('Scout-image-scanning');
        
        const text = await performOCR(img);
        analyzedCount++;
        
        if (text && containsCryptoKeywords(text)) {
          cryptoFound++;
          img.classList.remove('Scout-image-scanning');
          img.classList.add('Scout-image-crypto');
        } else {
          img.classList.remove('Scout-image-scanning');
        }
        
        // Don't overwhelm the API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error('❌ Error analyzing image:', error);
        img.classList.remove('Scout-image-scanning');
      }
    }
      console.log(`✅ Scan complete: ${cryptoFound}/${analyzedCount} images contained crypto content`);
    
    // Clean up all OCR styling after 3 seconds to avoid permanent changes
    setTimeout(() => {
      cleanupOCRStyling();
    }, 3000);
    
    return {
      success: true,
      imagesFound: analyzedCount,
      cryptoImages: cryptoFound
    };
    
  } catch (error) {
    console.error('❌ Page scan failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Initialize extension when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (overlay) overlay.remove();
  if (lensMode) deactivateLensMode();
});

// Global functions for backwards compatibility
window.closeOverlay = closeOverlay;
window.simulateSwap = (address, symbol) => {
  showQuickNotification(`Swap simulation for $${symbol} coming soon!`, 'info');
};
window.addToCart = (address, symbol) => {
  showQuickNotification(`$${symbol} added to cart!`, 'success');
};

// Cleanup function to remove OCR styling from images
function cleanupOCRStyling() {
  console.log('🧹 Cleaning up OCR styling...');
  
  // Remove all OCR-related classes from images
  const styledImages = document.querySelectorAll('.Scout-image-scanning, .Scout-image-crypto');
  styledImages.forEach(img => {
    img.classList.remove('Scout-image-scanning');
    img.classList.remove('Scout-image-crypto');
  });
  
  console.log(`✅ Cleaned up styling from ${styledImages.length} images`);
}

// Global emergency close function
function forceCloseAllOverlays() {
  console.log('🚨 Emergency: Force closing all Scout overlays');
  
  // Clear overlay variable
  overlay = null;
  
  // Remove all overlay elements
  const allOverlays = document.querySelectorAll('.Scout-overlay, .Scout-ocr-results, .Scout-lens-overlay');
  allOverlays.forEach((el, index) => {
    try {
      el.remove();
      console.log(`🗑️ Removed overlay element ${index}`);
    } catch (error) {
      console.error(`❌ Failed to remove overlay ${index}:`, error);
    }
  });
  
  // Clean up any styling
  cleanupOCRStyling();
  
  // Reset lens mode
  if (lensMode) {
    deactivateLensMode();
  }
  
  console.log('✅ Emergency cleanup complete');
}

// Debug function to diagnose overlay issues
function debugOverlayState() {
  console.log('🔍 === OVERLAY DEBUG INFO ===');
  console.log('Overlay variable:', overlay);
  console.log('Overlay in DOM:', overlay ? document.body.contains(overlay) : 'N/A');
  
  const allOverlays = document.querySelectorAll('.Scout-overlay');
  console.log(`Found ${allOverlays.length} overlay elements in DOM:`);
  
  allOverlays.forEach((el, index) => {
    console.log(`  Overlay ${index}:`, {
      id: el.id,
      className: el.className,
      style: el.style.cssText,
      hasEventListeners: el.onclick || el.addEventListener.length || 'unknown',
      parentNode: el.parentNode?.tagName
    });
  });
  
  const closeButtons = document.querySelectorAll('.Scout-close-button, [data-action="close"]');
  console.log(`Found ${closeButtons.length} close buttons in DOM`);
  
  console.log('Current states:', {
    lensMode,
    isAnalyzing,
    selectedElement,
    connectedWallet
  });
  
  console.log('🔍 === END DEBUG INFO ===');
}

// Add to global scope for easy access
window.debugOverlayState = debugOverlayState;
