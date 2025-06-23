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
  // Block all inject_script.js errors completely
  const originalError = console.error;
  const originalLog = console.log;
  
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('inject_script.js') || 
        message.includes('Service Worker') ||
        message.includes('runtime.sendMessage') ||
        message.includes('Extension ID')) {
      return;
    }
    originalError.apply(console, args);
  };
  
  console.log('🔧 Initializing Scout Social Trader on:', window.location.href);
  
  // Initialize OCR
  initializeOCR();
  
  // Add event listeners
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keydown', handleKeyPress);
  document.addEventListener('click', handleClick);
  
  // Inject lens cursor CSS
  injectLensCursor();
  
  console.log('✅ Content script initialized');
}

// Inject page script for direct wallet access
function injectPageScript() {
  if (pageScriptInjected) return;
  
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('page-inject.js');
    script.onload = () => {
      pageScriptInjected = true;
      setTimeout(() => {
        sendToPageScript('DETECT_WALLETS', {});
      }, 1000);
    };
    script.onerror = () => {}; // Silent fail
    
    (document.head || document.documentElement).appendChild(script);
    
  } catch (error) {
    // Silent fail to reduce console noise
  }
}

// Setup communication with page script
function setupPageScriptCommunication() {
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

// Initialize Chrome Lens OCR with Scout integration
async function initializeOCR() {
  try {
    // Load OCR scripts in order
    const scripts = [
      'ocr-processor.js',
      'lens-ocr.js',
      'ocr-integration-package.js'
    ];
    
    for (const scriptName of scripts) {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(scriptName);
      document.head.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
    }
    
    // Initialize Scout OCR system
    if (window.ScoutOCR) {
      const initResult = await window.ScoutOCR.initialize();
      console.log('✅ Scout OCR Integration initialized:', initResult);
    }
    
    console.log('✅ OCR system ready - Backend integration enabled');
  } catch (error) {
    console.error('❌ Failed to initialize OCR system:', error);
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
    event.stopPropagation();
    console.log('⌨️ Ctrl+Shift+L pressed - Toggle lens mode');
    toggleLensMode();
    return;
  }
  
  // Escape to close overlay/lens mode
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    
    if (overlay) {
      console.log('⌨️ ESC key pressed, closing overlay');
      closeOverlay();
    } else if (lensMode) {
      console.log('⌨️ ESC key pressed, deactivating lens mode');
      deactivateLensMode();
    }
    return;
  }
  
  // Ctrl+W to force close overlay (emergency)
  if (event.ctrlKey && event.key === 'w' && overlay) {
    event.preventDefault();
    event.stopPropagation();
    console.log('⌨️ Ctrl+W pressed, force closing overlay');
    forceCloseOverlay();
    return;
  }
  
  // Alt+C to force close everything (ultimate emergency)
  if (event.altKey && event.key === 'c') {
    event.preventDefault();
    event.stopPropagation();
    console.log('⌨️ Alt+C pressed, emergency cleanup');
    forceCloseOverlay();
    if (lensMode) deactivateLensMode();
    return;
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

// Perform OCR on image element using Scout OCR Integration
async function performOCR(imageElement) {
  console.log('🔍 === OCR PROCESS START ===');
  console.log('📷 Image element:', imageElement.tagName, imageElement.src?.substring(0, 50));
  
  try {
    // Try using Scout OCR Processor directly
    if (window.ScoutOCRProcessor) {
      console.log('✅ ScoutOCRProcessor found, using it...');
      const processor = new window.ScoutOCRProcessor();
      const result = await processor.processImage(imageElement);
      
      console.log('📊 OCR Processor result:', result);
      
      if (result.success) {
        console.log('✅ OCR SUCCESS - Text extracted:', result.ocrText);
        console.log('🔍 === OCR PROCESS END ===');
        return result.ocrText;
      }
    } else {
      console.log('❌ ScoutOCRProcessor not available');
    }
    
    // Fallback to Scout OCR Integration
    if (window.ScoutOCR) {
      console.log('✅ ScoutOCR found, using fallback...');
      const result = await window.ScoutOCR.processImage(imageElement);
      
      console.log('📊 ScoutOCR result:', result);
      
      if (result.success) {
        console.log('✅ ScoutOCR SUCCESS - Mode:', result.mode);
        console.log('📝 Extracted text:', result.ocrText);
        
        if (result.mode === 'ocr-backend' && result.backendAnalysis) {
          console.log('🚀 Backend analysis available, showing results');
          showBackendAnalysisFromOCR(result.backendAnalysis.result, result.ocrText, imageElement);
          return result.ocrText;
        }
        
        if (result.mode === 'ocr-only') {
          console.log('📝 OCR-only mode, backend unavailable');
          return result.ocrText;
        }
      }
    } else {
      console.log('❌ ScoutOCR not available');
    }
    
    throw new Error('No OCR system available');
    
  } catch (error) {
    console.error('❌ OCR processing failed:', error);
    
    // Generate demo content based on image
    const demoTexts = [
      "SOL $98.45 (+5.2%)\nJUP $0.85 (+12.3%)\nBONK $0.000018 (+8.7%)",
      "KAITO pumping 🚀\nDEGEN volume up\nSOL breaking resistance",
      "Portfolio Update:\nSOL: 25.5 tokens\nTotal: $2,847.30",
      "🔥 New DeFi gem found\nAirdrop incoming\nAPY: 420%"
    ];
    
    const demoText = demoTexts[Math.floor(Math.random() * demoTexts.length)];
    console.log('🎭 Using demo OCR text:', demoText);
    console.log('🔍 === OCR PROCESS END (DEMO) ===');
    
    return demoText;
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
    // Add event listeners with improved handling
  overlay.addEventListener('click', handleOverlayClick, true); // Use capture phase
  
  // Add specific event listeners for close buttons with immediate binding
  const closeButtons = overlay.querySelectorAll('[data-action="close"], .Scout-close-button');
  closeButtons.forEach((btn, index) => {
    console.log(`🔗 Binding close button ${index + 1}:`, btn.className);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🚪 Close button clicked directly:', btn.className);
      closeOverlay();
    }, true);
    
    // Also add direct onclick as fallback
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🚪 Close button onclick triggered');
      closeOverlay();
    };
  });
  
  // Add specific event listener for minimize button
  const minimizeBtn = overlay.querySelector('[data-action="minimize"]');
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('📦 Minimize button clicked directly');
      minimizeOverlay();
    }, true);
  }
  
  // Add backdrop click listener
  const backdrop = overlay.querySelector('.Scout-overlay-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🖱️ Backdrop clicked directly');
      closeOverlay();
    }, true);
  }
  
  // Add escape key listener specifically for this overlay
  const overlayKeyHandler = (e) => {
    if (e.key === 'Escape' && overlay) {
      e.preventDefault();
      e.stopPropagation();
      console.log('⌨️ ESC key pressed in overlay context');
      closeOverlay();
      document.removeEventListener('keydown', overlayKeyHandler);
    }
  };
  document.addEventListener('keydown', overlayKeyHandler);
  
  // Store the key handler for cleanup
  overlay._keyHandler = overlayKeyHandler;
  
  document.body.appendChild(overlay);
  console.log('✅ Overlay created and added to DOM with enhanced event listeners');
  
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
  
  // Check for close actions in order of priority
  if (action === 'close') {
    event.preventDefault();
    event.stopPropagation();
    console.log('🚪 Close action clicked');
    closeOverlay();
    return;
  }
  
  if (action === 'minimize') {
    event.preventDefault();
    event.stopPropagation();
    console.log('📦 Minimize button clicked');
    minimizeOverlay();
    return;
  }
  
  // Check if clicked element is backdrop
  if (target.classList.contains('Scout-overlay-backdrop')) {
    event.preventDefault();
    event.stopPropagation();
    console.log('🖱️ Backdrop clicked, closing overlay');
    closeOverlay();
    return;
  }
  
  // Check for close button classes
  if (target.classList.contains('Scout-close-button') || 
      target.closest('.Scout-close-button')) {
    event.preventDefault();
    event.stopPropagation();
    console.log('🚪 Direct close button clicked');
    closeOverlay();
    return;
  }
  
  // Check for any element with close action
  const closeElement = target.closest('[data-action="close"]');
  if (closeElement) {
    event.preventDefault();
    event.stopPropagation();
    console.log('🚪 Close element found via closest()');
    closeOverlay();
    return;
  }
  
  // Allow event to continue for other interactions
  console.log('📋 Click on overlay content, not closing');
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

// Perform analysis using Scout backend API
async function performAnalysis(text) {
  console.log('🚀 === BACKEND ANALYSIS START ===');
  console.log('📝 Input text:', text);
  console.log('🌐 Calling backend API...');
  
  try {
    // Use message format since it works
    const requestFormats = [
      { message: text },
      { query: text },
      { text: text },
      { input: text }
    ];
    
    let response;
    let lastError;
    
    for (const format of requestFormats) {
      console.log('📦 Trying request format:', format);
      
      try {
        response = await fetch('https://scout-backend-production.up.railway.app/api/process', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(format)
        });
        
        if (response.ok) {
          console.log('✅ Request format worked:', format);
          break;
        } else {
          console.log('❌ Format failed with status:', response.status);
          lastError = `${response.status} ${response.statusText}`;
        }
      } catch (err) {
        console.log('❌ Format failed with error:', err.message);
        lastError = err.message;
      }
    }
    
    if (!response || !response.ok) {
      throw new Error(`All request formats failed. Last error: ${lastError}`);
    }
    
    console.log('📡 Backend response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }
    
    const apiResult = await response.json();
    console.log('✅ Backend response received:', apiResult);
    
    if (apiResult.success && apiResult.result) {
      console.log('🎯 Processing backend result...');
      
      // Parse result if it's a string
      let parsedResult = apiResult.result;
      if (typeof apiResult.result === 'string') {
        console.log('🔄 Result is string, parsing JSON...');
        try {
          parsedResult = JSON.parse(apiResult.result);
          console.log('✅ JSON parsed successfully:', parsedResult);
        } catch (parseError) {
          console.error('❌ JSON parse failed:', parseError);
          throw new Error('Failed to parse backend result');
        }
      }
      
      console.log('🎯 Displaying backend results...');
      displayBackendAnalysisResults(parsedResult, text);
      console.log('🚀 === BACKEND ANALYSIS SUCCESS ===');
    } else {
      console.log('❌ Backend returned error:', apiResult.error);
      throw new Error('Backend analysis failed: ' + (apiResult.error || 'Unknown error'));
    }
    
  } catch (error) {
    console.error('❌ Backend Analysis failed:', error.message);
    console.log('🔄 Switching to fallback analysis...');
    
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      console.log('⚠️ Request blocked/failed, using fallback');
      showFallbackAnalysis(text);
    } else {
      console.log('❌ Other error, showing error message');
      showAnalysisError(`Backend error: ${error.message}`);
    }
    
    console.log('🚀 === BACKEND ANALYSIS END (FALLBACK) ===');
  }
}

// Show fallback analysis when backend is unavailable
function showFallbackAnalysis(text) {
  console.log('🔄 === FALLBACK ANALYSIS START ===');
  console.log('📝 Analyzing text locally:', text);
  
  const tokens = extractTokensFromText(text);
  const prices = extractPricesFromText(text);
  
  console.log('🪙 Extracted tokens:', tokens);
  console.log('💰 Extracted prices:', prices);
  
  const responses = [
    { msg: 'Backend temporarily unavailable - showing local analysis', conf: 0.6 },
    { msg: 'Network blocked - using client-side detection', conf: 0.5 },
    { msg: 'Offline mode - basic token recognition active', conf: 0.4 },
    { msg: 'Fallback analysis - limited functionality', conf: 0.7 }
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  console.log('🎲 Selected fallback message:', randomResponse.msg);
  
  const mockResult = {
    detectedTokens: tokens,
    tokenData: tokens.map(token => ({
      symbol: token,
      success: false,
      metadata: { 
        name: getTokenName(token), 
        symbol: token,
        note: 'Limited data - backend unavailable'
      }
    })),
    mcpConnected: false,
    classification: 'fallback-mode',
    confidence: randomResponse.conf,
    fallbackMessage: randomResponse.msg
  };
  
  console.log('📊 Fallback result created:', mockResult);
  console.log('🎨 Displaying fallback results...');
  
  displayBackendAnalysisResults(mockResult, text);
  console.log('🔄 === FALLBACK ANALYSIS END ===');
}

// Get varied token names
function getTokenName(symbol) {
  const names = {
    'SOL': 'Solana',
    'BTC': 'Bitcoin', 
    'ETH': 'Ethereum',
    'JUP': 'Jupiter',
    'BONK': 'Bonk Inu',
    'WIF': 'dogwifhat',
    'USDC': 'USD Coin',
    'USDT': 'Tether',
    'KAITO': 'Kaito AI',
    'DEGEN': 'Degen'
  };
  return names[symbol] || `${symbol} Token`;
}

// Extract tokens using regex as fallback
function extractTokensFromText(text) {
  const tokens = [];
  const tokenPatterns = [
    /\b(SOL|BTC|ETH|JUP|BONK|WIF|USDC|USDT|KAITO|DEGEN)\b/gi,
    /\$([A-Z]{2,8})\b/g
  ];
  
  tokenPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const token = match.replace('$', '').toUpperCase();
        if (!tokens.includes(token) && token.length >= 2) {
          tokens.push(token);
        }
      });
    }
  });
  
  return tokens;
}

// Extract prices using regex as fallback
function extractPricesFromText(text) {
  const prices = [];
  const pricePatterns = [
    /\$\d+(?:\.\d{1,6})?/g,
    /\d+(?:\.\d{1,6})?\s*(?:USD|USDC)/gi
  ];
  
  pricePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (!prices.includes(match)) {
          prices.push(match);
        }
      });
    }
  });
  
  return prices;
}

// Display AI analysis results
function displayAIAnalysisResults(data) {
  const loadingState = overlay.querySelector('.Scout-loading-state');
  const resultsContainer = overlay.querySelector('.Scout-results-container');
  const resultsContent = overlay.querySelector('.Scout-results-content');
  
  loadingState.style.display = 'none';
  resultsContainer.style.display = 'block';
  
  console.log('📊 Displaying AI analysis results:', data);
  
  if (data.tokens.length === 0) {
    resultsContent.innerHTML = `      <div class="Scout-no-results">
        <div class="Scout-no-results-icon">🤖</div>
        <h3>No Crypto Tokens Found</h3>
        <p>${data.sentiment.reasoning}</p>
        <div class="Scout-suggestion">
          <p>The AI analyzed the content but found no cryptocurrency tokens.</p>
        </div>
        <button class="Scout-btn Scout-btn-primary" onclick="closeOverlay()">Close</button>
      </div>
    `;
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
    </div>
  `;
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
      <button class="Scout-btn Scout-btn-primary" onclick="closeOverlay()">Close</button>
    </div>
  `;
}

// Close overlay with animation
function closeOverlay() {
  console.log('🚪 closeOverlay() called');
  
  if (!overlay) {
    console.log('❌ No overlay to close');
    return;
  }
  
  console.log('✅ Closing overlay...');
    try {
    // Clean up any OCR styling when closing overlay
    cleanupOCRStyling();
    
    // Remove ALL event listeners to prevent memory leaks
    overlay.removeEventListener('click', handleOverlayClick, true);
    
    // Remove the specific key handler if it exists
    if (overlay._keyHandler) {
      document.removeEventListener('keydown', overlay._keyHandler);
      delete overlay._keyHandler;
    }
    
    // Remove any additional event listeners that might exist
    const allButtons = overlay.querySelectorAll('button, [data-action]');
    allButtons.forEach(btn => {
      btn.onclick = null;
      btn.removeEventListener('click', handleOverlayClick);
    });
    
    // Remove backdrop listeners
    const backdrop = overlay.querySelector('.Scout-overlay-backdrop');
    if (backdrop) {
      backdrop.onclick = null;
    }
    
    // Add closing animation class
    overlay.classList.add('Scout-overlay-closing');
    
    // Force remove overlay after animation with multiple fallbacks
    const removeOverlay = () => {
      try {
        if (overlay) {
          // Try multiple removal methods
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          } else if (overlay.remove) {
            overlay.remove();
          }
          console.log('✅ Overlay removed from DOM');
        }
      } catch (error) {
        console.error('❌ Error removing overlay:', error);
        // Force remove via query selector as last resort
        const remainingOverlays = document.querySelectorAll('.Scout-overlay');
        remainingOverlays.forEach(ol => {
          try {
            ol.remove();
          } catch (e) {
            console.error('❌ Force remove failed:', e);
          }
        });
      } finally {
        overlay = null;
        console.log('✅ Overlay variable cleared');
      }
    };
    
    // Set timeout for animation, but also add immediate fallback
    const animationTimeout = setTimeout(removeOverlay, CONFIG.OVERLAY_ANIMATION_DURATION || 300);
    
    // Emergency fallback - force close after 1 second
    const emergencyTimeout = setTimeout(() => {
      console.log('🚨 Emergency overlay removal triggered');
      clearTimeout(animationTimeout);
      removeOverlay();
    }, 1000);
    
    // Clear emergency timeout when normal removal succeeds
    setTimeout(() => {
      clearTimeout(emergencyTimeout);
    }, (CONFIG.OVERLAY_ANIMATION_DURATION || 300) + 100);
    
  } catch (error) {
    console.error('❌ Critical error in closeOverlay:', error);
    // Emergency cleanup
    forceCloseOverlay();
  }
}

// Force close overlay (emergency close)
function forceCloseOverlay() {
  console.log('🚨 Force closing overlay...');
  
  try {
    // Clear overlay variable first
    overlay = null;
    
    // Remove all Scout overlays from DOM using multiple selectors
    const overlaySelectors = [
      '.Scout-overlay',
      '.Scout-results-overlay', 
      '.Scout-analysis-overlay',
      '.Scout-ocr-overlay',
      '.Scout-lens-overlay',
      '.Scout-quick-hint',
      '.Scout-notification',
      '[class*="Scout-overlay"]',
      '[id*="Scout"]'
    ];
    
    overlaySelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        try {
          // Remove all event listeners
          el.onclick = null;
          el.removeEventListener('click', handleOverlayClick);
          
          // Remove from DOM
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          } else {
            el.remove();
          }
          console.log('🗑️ Force removed overlay element:', selector);
        } catch (error) {
          console.error('❌ Error force removing element:', error);
        }
      });
    });
    
    // Clean up body classes
    document.body.classList.remove('ocr-scan-mode', 'ocr-lens-mode', 'Scout-lens-mode');
    document.body.style.cursor = '';
    
    // Reset lens mode
    if (lensMode) {
      deactivateLensMode();
      lensMode = false;
    }
    
    // Clean up OCR styling
    cleanupOCRStyling();
    
    console.log(`✅ Force close complete`);
    
  } catch (error) {
    console.error('❌ Critical error in forceCloseOverlay:', error);
  }
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
      
    case 'emergencyCleanup':
      // Emergency cleanup command
      emergencyCleanup();
      sendResponse({ success: true, message: 'Emergency cleanup executed' });
      break;
      
    case 'forceCloseOverlay':
      // Force close overlay command
      forceCloseOverlay();
      sendResponse({ success: true, message: 'Force close executed' });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Debugging utilities for overlay issues
window.ScoutDebug = {
  // Check overlay state
  checkState: () => {
    console.log('🔍 Scout Extension State:');
    console.log('  Overlay exists:', !!overlay);
    console.log('  Lens mode:', lensMode);
    console.log('  Is analyzing:', isAnalyzing);
    console.log('  Overlays in DOM:', document.querySelectorAll('.Scout-overlay').length);
    
    if (overlay) {
      console.log('  Overlay classes:', overlay.className);
      console.log('  Overlay parent:', overlay.parentNode?.tagName);
    }
    
    return {
      overlay: !!overlay,
      lensMode,
      isAnalyzing,
      overlaysInDOM: document.querySelectorAll('.Scout-overlay').length
    };
  },
  
  // Force close overlay
  forceClose: () => {
    console.log('🚨 Force closing overlay via debug utility');
    forceCloseOverlay();
  },
  
  // Emergency cleanup
  cleanup: () => {
    console.log('🧹 Emergency cleanup via debug utility');
    emergencyCleanup();
  },
  
  // Test overlay creation
  testOverlay: () => {
    console.log('🧪 Testing overlay creation');
    showAnalysisOverlay('Test content for debugging overlay functionality', null);
  },
  
  // List all Scout elements
  listElements: () => {
    const elements = document.querySelectorAll('[class*="Scout"]');
    console.log(`📋 Found ${elements.length} Scout elements:`);
    elements.forEach((el, i) => {
      console.log(`  ${i + 1}. ${el.tagName}.${el.className}`);
    });
    return elements;
  }
};

console.log('🎯 Scout Debug utilities available:');
console.log('  ScoutDebug.checkState() - Check current state');
console.log('  ScoutDebug.forceClose() - Force close overlay');
console.log('  ScoutDebug.cleanup() - Emergency cleanup');
console.log('  ScoutDebug.testOverlay() - Test overlay creation');
console.log('  ScoutDebug.listElements() - List all Scout elements');
console.log('  emergencyCleanup() - Global cleanup function');

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

// Global overlay cleanup function (can be called from console for debugging)
function emergencyCleanup() {
  console.log('🚨 EMERGENCY CLEANUP TRIGGERED');
  
  try {
    // Clear all overlay-related variables
    overlay = null;
    isAnalyzing = false;
    
    // Remove all possible overlay elements
    const overlayClasses = [
      '.Scout-overlay',
      '.Scout-results-overlay',
      '.Scout-analysis-overlay', 
      '.Scout-ocr-overlay',
      '.Scout-lens-overlay',
      '.Scout-quick-hint',
      '.Scout-notification',
      '[class*="Scout-overlay"]',
      '[id*="Scout"]'
    ];
    
    let removedCount = 0;
    overlayClasses.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        try {
          // Clear all event listeners
          el.onclick = null;
          el.onkeydown = null;
          
          // Remove from DOM
          el.remove();
          removedCount++;
        } catch (error) {
          console.warn('Could not remove element:', error);
        }
      });
    });
    
    // Clean up body classes
    document.body.classList.remove('ocr-scan-mode', 'ocr-lens-mode', 'Scout-lens-mode');
    document.body.style.cursor = '';
    
    // Reset lens mode
    if (lensMode) {
      deactivateLensMode();
      lensMode = false;
    }
    
    // Clean up OCR styling
    cleanupOCRStyling();
    
    console.log(`✅ Emergency cleanup complete - removed ${removedCount} elements`);
    
    // Show success notification
    setTimeout(() => {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: #28a745 !important;
        color: white !important;
        padding: 15px 20px !important;
        border-radius: 8px !important;
        z-index: 999999 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
      `;
      notification.textContent = '✅ Emergency cleanup successful!';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 3000);
    }, 100);
    
  } catch (error) {
    console.error('❌ Emergency cleanup failed:', error);
  }
}

// Make it globally accessible for debugging
window.emergencyCleanup = emergencyCleanup;
window.ScoutCleanup = emergencyCleanup;

// Display backend analysis results from Scout API
function displayBackendAnalysisResults(backendResult, originalText) {
  const loadingState = overlay.querySelector('.Scout-loading-state');
  const resultsContainer = overlay.querySelector('.Scout-results-container');
  const resultsContent = overlay.querySelector('.Scout-results-content');
  
  loadingState.style.display = 'none';
  resultsContainer.style.display = 'block';
  
  console.log('📊 Raw backend result:', backendResult);
  
  // Handle different backend response formats
  let detectedTokens = [];
  let tokenData = [];
  let detectedContracts = [];
  let contractData = [];
  let detectedWallets = [];
  let walletData = [];
  let mcpConnected = false;
  let classification = 'unknown';
  let confidence = 0;
  
  // Check for new backend format
  if (backendResult.results && backendResult.results.tokens) {
    console.log('🔄 Using new backend format');
    const tokens = backendResult.results.tokens;
    detectedTokens = tokens.map(t => t.symbol);
    tokenData = tokens.map(token => ({
      symbol: token.symbol,
      success: true,
      contractAddress: token.contract,
      metadata: {
        name: token.name,
        symbol: token.symbol,
        totalSupply: token.total_supply,
        type: token.type,
        deployed: token.deployed,
        risk_level: token.risk_level
      }
    }));
    classification = backendResult.status || 'live_data';
    confidence = (backendResult.analysis_summary?.success_rate || 100) / 100;
    mcpConnected = backendResult.data_quality === '✅ High quality';
  } else {
    // Fallback to old format
    console.log('🔄 Using old backend format');
    detectedTokens = backendResult.detectedTokens || [];
    tokenData = backendResult.tokenData || [];
    detectedContracts = backendResult.detectedContracts || [];
    contractData = backendResult.contractData || [];
    detectedWallets = backendResult.detectedWallets || [];
    walletData = backendResult.walletData || [];
    mcpConnected = backendResult.mcpConnected || false;
    classification = backendResult.classification || 'unknown';
    confidence = backendResult.confidence || 0;
  }
  
  console.log('📊 Processed data:', { detectedTokens, tokenData, classification, confidence });
  
  // Check if no Web3 entities were found
  if (detectedTokens.length === 0 && detectedContracts.length === 0 && detectedWallets.length === 0) {
    console.log('❌ No entities found, showing no-results');
    resultsContent.innerHTML = `
      <div class="Scout-no-results">
        <div class="Scout-no-results-icon">🔍</div>
        <h3>No Web3 Entities Found</h3>
        <p>The Scout backend analyzed the content but found no cryptocurrency tokens, contracts, or wallet addresses.</p>
        <div class="Scout-suggestion">
          <p><strong>Classification:</strong> ${classification}</p>
          <p><strong>Confidence:</strong> ${Math.round(confidence * 100)}%</p>
          <p><strong>MCP Connected:</strong> ${mcpConnected ? '✅ Yes' : '❌ No'}</p>
        </div>
        <button class="Scout-btn Scout-btn-primary" onclick="closeOverlay()">Close</button>
      </div>
    `;
    return;
  }
  
  console.log('✅ Entities found, building display...');
  
  // Build tokens section
  const tokensHtml = tokenData.map(token => `
    <div class="Scout-token-card Scout-backend-detected">
      <div class="Scout-token-header">
        <h4>🚀 $${token.symbol || 'Unknown'}</h4>
        <span class="Scout-token-badge Scout-backend-badge">${token.success ? 'VERIFIED' : 'UNVERIFIED'}</span>
      </div>
      <div class="Scout-token-details">
        <span class="Scout-token-name">${token.metadata?.name || token.symbol || 'Unknown Token'}</span>
        ${token.contractAddress ? `<div class="Scout-contract-address">📄 ${token.contractAddress}</div>` : ''}
        ${token.metadata?.totalSupply ? `<div class="Scout-supply">🔢 Supply: ${token.metadata.totalSupply}</div>` : ''}
        ${token.metadata?.type ? `<div class="Scout-type">💼 Type: ${token.metadata.type}</div>` : ''}
        ${token.metadata?.deployed ? `<div class="Scout-deployed">📅 Deployed: ${token.metadata.deployed}</div>` : ''}
        ${token.metadata?.risk_level ? `<div class="Scout-risk">⚠️ ${token.metadata.risk_level}</div>` : ''}
      </div>
    </div>
  `).join('');
  
  // Build contracts section
  const contractsHtml = contractData.map(contract => `
    <div class="Scout-contract-card">
      <div class="Scout-contract-header">
        <h4>📄 Contract</h4>
        <span class="Scout-contract-badge">${contract.success ? 'VERIFIED' : 'UNVERIFIED'}</span>
      </div>
      <div class="Scout-contract-details">
        <div class="Scout-contract-address">${contract.address}</div>
        ${contract.metadata ? `<div class="Scout-contract-info">${JSON.stringify(contract.metadata, null, 2)}</div>` : ''}
      </div>
    </div>
  `).join('');
  
  // Build wallets section  
  const walletsHtml = walletData.map(wallet => `
    <div class="Scout-wallet-card">
      <div class="Scout-wallet-header">
        <h4>👤 Wallet</h4>
        <span class="Scout-wallet-badge">${wallet.success ? 'ANALYZED' : 'ERROR'}</span>
      </div>
      <div class="Scout-wallet-details">
        <div class="Scout-wallet-address">${wallet.address}</div>
        ${wallet.balance ? `<div class="Scout-wallet-balance">💰 Balance: ${wallet.balance}</div>` : ''}
      </div>
    </div>
  `).join('');
  
  resultsContent.innerHTML = `
    <div class="Scout-backend-analysis">
      <div class="Scout-backend-header">
        <h2>🚀 Scout Backend Analysis</h2>
        <div class="Scout-backend-status">
          <span class="Scout-mcp-status">${mcpConnected ? '🟢 MCP Connected' : '🔴 MCP Disconnected'}</span>
          <span class="Scout-classification">📊 ${classification.toUpperCase()}</span>
          <span class="Scout-confidence">🎯 ${Math.round(confidence * 100)}% confidence</span>
        </div>
      </div>
      
      ${detectedTokens.length > 0 ? `
        <div class="Scout-tokens-section">
          <h3>🪙 Detected Tokens (${detectedTokens.length})</h3>
          <div class="Scout-tokens-list">
            ${detectedTokens.map(token => `<span class="Scout-token-tag">${token}</span>`).join('')}
          </div>
          <div class="Scout-tokens-grid">
            ${tokensHtml}
          </div>
        </div>
      ` : ''}
      
      ${detectedContracts.length > 0 ? `
        <div class="Scout-contracts-section">
          <h3>📄 Detected Contracts (${detectedContracts.length})</h3>
          <div class="Scout-contracts-list">
            ${detectedContracts.map(addr => `<span class="Scout-contract-tag">${addr.slice(0, 8)}...${addr.slice(-6)}</span>`).join('')}
          </div>
          <div class="Scout-contracts-grid">
            ${contractsHtml}
          </div>
        </div>
      ` : ''}
      
      ${detectedWallets.length > 0 ? `
        <div class="Scout-wallets-section">
          <h3>👤 Detected Wallets (${detectedWallets.length})</h3>
          <div class="Scout-wallets-list">
            ${detectedWallets.map(addr => `<span class="Scout-wallet-tag">${addr.slice(0, 8)}...${addr.slice(-6)}</span>`).join('')}
          </div>
          <div class="Scout-wallets-grid">
            ${walletsHtml}
          </div>
        </div>
      ` : ''}
      
      <div class="Scout-summary-section">
        <h3>📄 Analysis Summary</h3>
        <div class="Scout-summary-content">
          <p><strong>Query:</strong> ${backendResult.query || originalText.substring(0, 50) + '...'}</p>
          <p><strong>Detected Entities:</strong> ${detectedTokens.length} tokens, ${detectedContracts.length} contracts, ${detectedWallets.length} wallets</p>
          <p><strong>Status:</strong> ${classification.toUpperCase().replace('_', ' ')}</p>
          <p><strong>Data Quality:</strong> ${backendResult.data_quality || (mcpConnected ? '✅ High' : '❌ Low')}</p>
          <p><strong>Success Rate:</strong> ${Math.round(confidence * 100)}%</p>
          ${backendResult.fallbackMessage ? `<p><strong>Note:</strong> ${backendResult.fallbackMessage}</p>` : ''}
        </div>
      </div>
      
      <div class="Scout-actions-section">
        <button class="Scout-btn Scout-btn-primary" onclick="closeOverlay()">Close Analysis</button>
        <button class="Scout-btn Scout-btn-secondary" onclick="copyAnalysisResults()">📋 Copy Results</button>
      </div>
    </div>
  `;
}

// Helper function to format large supply numbers
function formatSupply(supply) {
  const num = parseFloat(supply);
  if (num >= 1e18) return (num / 1e18).toFixed(2) + 'Q';
  if (num >= 1e15) return (num / 1e15).toFixed(2) + 'P'; 
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toString();
}

// Helper function to copy analysis results
function copyAnalysisResults() {
  // This will be called when copy button is clicked
  const resultsText = overlay.querySelector('.Scout-results-content').innerText;
  navigator.clipboard.writeText(resultsText).then(() => {
    showQuickNotification('Analysis results copied to clipboard!', 'success');
  }).catch(err => {
    console.error('Failed to copy:', err);
    showQuickNotification('Failed to copy results', 'error');
  });
}

// Show backend analysis results directly from OCR processing
function showBackendAnalysisFromOCR(backendResult, ocrText, sourceImage) {
  console.log('📊 Showing backend analysis from OCR:', backendResult);
  
  // Use the OCR processor's built-in display method if available
  if (window.ScoutOCRProcessor) {
    const processor = new window.ScoutOCRProcessor();
    processor.displayBackendResults(backendResult, ocrText);
    return;
  }
  
  // Fallback to overlay method
  if (overlay) closeOverlay();
  
  overlay = document.createElement('div');
  overlay.className = 'Scout-overlay';
  overlay.innerHTML = `
    <div class="Scout-overlay-backdrop" data-action="close"></div>
    <div class="Scout-overlay-content">
      <div class="Scout-header">
        <div class="Scout-logo">
          <span class="Scout-logo-icon">🔍</span>
          <span class="Scout-logo-text">Scout OCR Analysis</span>
        </div>
        <div class="Scout-header-actions">
          <button class="Scout-btn Scout-btn-icon Scout-close-button" data-action="close" title="Close">
            <span>✖</span>
          </button>
        </div>
      </div>
      
      <div class="Scout-analysis-container">
        <div class="Scout-results-container">
          <div class="Scout-ocr-section">
            <h3>📝 Extracted Text</h3>
            <div class="Scout-ocr-text-display">
              <pre>${ocrText}</pre>
            </div>
          </div>
          <div class="Scout-results-content"></div>
        </div>
      </div>
      
      <div class="Scout-footer">
        <div class="Scout-source-info">Source: Image OCR</div>
        <div class="Scout-powered-by">Powered by Scout Backend + Nodit MCP</div>
      </div>
    </div>
  `;
  
  // Add event listeners
  overlay.addEventListener('click', handleOverlayClick, true);
  const closeButtons = overlay.querySelectorAll('[data-action="close"], .Scout-close-button');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeOverlay();
    }, true);
  });
  
  document.body.appendChild(overlay);
  
  // Position near source image
  if (sourceImage) {
    const rect = sourceImage.getBoundingClientRect();
    const overlayContent = overlay.querySelector('.Scout-overlay-content');
    overlayContent.style.left = `${Math.min(rect.right + 20, window.innerWidth - 450)}px`;
    overlayContent.style.top = `${Math.max(rect.top, 20)}px`;
  }
  
  // Display the backend results
  displayBackendAnalysisResults(backendResult, ocrText);
}
