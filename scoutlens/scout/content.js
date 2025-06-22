// Scout Content Script - Web3 AI Agent Content Bridge
// Handles wallet integration, OCR, token detection, and page scanning

console.log('Scout content script loaded');

// Scout-specific state
let isScoutActive = false;
let scanHighlights = [];

// Initialize Scout content script
function initContentScript() {
  // Inject the injected script for wallet bridge
  injectScriptBridge();
  
  // Add Scout indicator
  const indicator = document.createElement('div');
  indicator.id = 'scout-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.1);
  `;
  indicator.innerHTML = '🔍 Scout Active';
  document.body.appendChild(indicator);

  // Auto-hide indicator after 3 seconds
  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 300);
  }, 3000);

  // Initialize token detection
  setupTokenDetection();
  
  // Setup scroll tracking for lazy scanning
  setupScrollTracking();
}

// Inject script bridge for wallet access
function injectScriptBridge() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

// Send message to background script
function sendMessageToBackground(type, data) {
  chrome.runtime.sendMessage({
    type: type,
    data: data,
    timestamp: Date.now(),
    url: window.location.href
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
    } else {
      console.log('Message response:', response);
    }
  });
}

// Listen for messages from background script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Scout message received:', message);
    switch (message.type) {
    case 'SHOW_WALLET_POPUP':
      showInPageWalletPopup();
      sendResponse({ success: true });
      break;
      
    case 'HIDE_WALLET_POPUP':
      hideInPageWalletPopup();
      sendResponse({ success: true });
      break;
      
    case 'CONNECT_WALLET':
      handleWalletConnection(message.data);
      sendResponse({ success: true });
      break;
      
    case 'DISCONNECT_WALLET':
      handleWalletDisconnection();
      sendResponse({ success: true });
      break;
      
    case 'SCAN_PAGE':
      performPageScan(message.data)
        .then(results => sendResponse({ success: true, data: results }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;
      
    case 'SCAN_OCR':
      performOCRScan(message.data)
        .then(results => sendResponse({ success: true, data: results }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;
      
    case 'HIGHLIGHT_TOKENS':
      highlightTokens(message.data);
      sendResponse({ success: true });
      break;
      
    case 'GET_PAGE_INFO':
      const pageInfo = getPageInfo();
      sendResponse({ success: true, data: pageInfo });
      break;
      
    case 'CLEAR_HIGHLIGHTS':
      clearHighlights();
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  return true; // Keep message channel open for async responses
});

// Wallet connection handling
async function handleWalletConnection(data) {
  // Send message to injected script to connect wallet
  document.dispatchEvent(new CustomEvent('scoutWalletConnect', {
    detail: { ...data, timestamp: Date.now() }
  }));
}

function handleWalletDisconnection() {
  document.dispatchEvent(new CustomEvent('scoutWalletDisconnect', {
    detail: { timestamp: Date.now() }
  }));
}

// Page scanning functionality
async function performPageScan(options = {}) {
  const { scanType = 'tokens', includeImages = true } = options;
  
  try {
    const results = {
      tokens: [],
      addresses: [],
      contracts: [],
      images: [],
      metadata: getPageInfo()
    };
    
    // Scan for crypto addresses and tokens
    if (scanType === 'tokens' || scanType === 'all') {
      results.tokens = findTokenReferences();
      results.addresses = findCryptoAddresses();
      results.contracts = findContractAddresses();
    }
    
    // Scan images if requested
    if (includeImages && (scanType === 'images' || scanType === 'all')) {
      results.images = await scanImagesForTokens();
    }
    
    // Send results to background for processing
    sendMessageToBackground('SCAN_RESULTS', results);
    
    return results;
  } catch (error) {
    console.error('Page scan error:', error);
    throw error;
  }
}

// OCR scanning functionality
async function performOCRScan(options = {}) {
  const { targetImages = [], region = null } = options;
  
  try {
    const images = targetImages.length > 0 ? 
      targetImages.map(selector => document.querySelector(selector)).filter(Boolean) :
      Array.from(document.images);
    
    const ocrResults = [];
    
    for (const img of images) {
      if (img.complete && img.naturalWidth > 0) {
        const result = await performImageOCR(img);
        if (result.text) {
          ocrResults.push({
            image: img.src,
            text: result.text,
            tokens: extractTokensFromText(result.text),
            addresses: extractAddressesFromText(result.text),
            confidence: result.confidence
          });
        }
      }
    }
    
    return ocrResults;
  } catch (error) {
    console.error('OCR scan error:', error);
    throw error;
  }
}

// Token detection functions
function findTokenReferences() {
  const text = document.body.innerText;
  const tokens = [];
  
  // Common token patterns
  const tokenPatterns = [
    /\b[A-Z]{2,10}\b/g, // Token symbols (2-10 uppercase letters)
    /\$[A-Z]{2,10}\b/g, // Token symbols with $
    /\b(BTC|ETH|USDT|USDC|BNB|ADA|SOL|DOT|MATIC|LINK|UNI|AAVE|CRV|SNX|COMP|YFI|MKR|BAT|ZRX|ENJ|MANA|SAND|AXS|GALA|CHZ|FLOW|ICP|ATOM|AVAX|LUNA|FTM|ALGO|XTZ|EGLD|NEAR|FIL|VET|THETA|EOS|TRX|XLM|DOGE|SHIB|APE|LRC|IMX|GMT|GST|LUNC|USTC)\b/gi
  ];
  
  tokenPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (!tokens.includes(match.toUpperCase())) {
          tokens.push(match.toUpperCase());
        }
      });
    }
  });
  
  return tokens;
}

function findCryptoAddresses() {
  const text = document.body.innerText;
  const addresses = [];
  
  // Address patterns
  const addressPatterns = [
    /0x[a-fA-F0-9]{40}/g, // Ethereum addresses
    /[13][a-km-zA-HJ-NP-Z1-9]{25,34}/g, // Bitcoin addresses
    /bc1[a-z0-9]{39,59}/g, // Bitcoin Bech32 addresses
    /[A-Z0-9]{32,44}/g // Generic crypto addresses
  ];
  
  addressPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (!addresses.includes(match)) {
          addresses.push(match);
        }
      });
    }
  });
  
  return addresses;
}

function findContractAddresses() {
  // Look for contract addresses in links and data attributes
  const contracts = [];
  const links = document.querySelectorAll('a[href*="0x"], [data-address*="0x"]');
  
  links.forEach(link => {
    const href = link.href || link.dataset.address;
    const match = href.match(/0x[a-fA-F0-9]{40}/);
    if (match && !contracts.includes(match[0])) {
      contracts.push(match[0]);
    }
  });
  
  return contracts;
}

// Image scanning functions
async function scanImagesForTokens() {
  const images = Array.from(document.images);
  const tokenImages = [];
  
  for (const img of images) {
    if (img.complete && img.naturalWidth > 0) {
      // Check if image might contain token information
      const src = img.src.toLowerCase();
      const alt = (img.alt || '').toLowerCase();
      
      // Look for token-related keywords
      const tokenKeywords = ['token', 'coin', 'crypto', 'chart', 'price', 'trading'];
      const hasTokenKeyword = tokenKeywords.some(keyword => 
        src.includes(keyword) || alt.includes(keyword)
      );
      
      if (hasTokenKeyword || img.width > 100 || img.height > 100) {
        tokenImages.push({
          src: img.src,
          alt: img.alt,
          width: img.naturalWidth,
          height: img.naturalHeight,
          element: img
        });
      }
    }
  }
  
  return tokenImages;
}

async function performImageOCR(img) {
  // Mock OCR implementation - in a real extension, you'd use Tesseract.js
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        text: `Mock OCR result for ${img.src}`,
        confidence: 0.8
      });
    }, 1000);
  });
}

function extractTokensFromText(text) {
  const tokens = [];
  const tokenPattern = /\b[A-Z]{2,10}\b/g;
  const matches = text.match(tokenPattern);
  
  if (matches) {
    matches.forEach(match => {
      if (!tokens.includes(match)) {
        tokens.push(match);
      }
    });
  }
  
  return tokens;
}

function extractAddressesFromText(text) {
  const addresses = [];
  const addressPattern = /0x[a-fA-F0-9]{40}/g;
  const matches = text.match(addressPattern);
  
  if (matches) {
    matches.forEach(match => {
      if (!addresses.includes(match)) {
        addresses.push(match);
      }
    });
  }
  
  return addresses;
}

// Token highlighting functions
function highlightTokens(tokens) {
  clearHighlights();
  
  tokens.forEach(token => {
    highlightTextInPage(token, 'scout-token-highlight');
  });
}

function highlightTextInPage(searchText, className) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const textNodes = [];
  let node;
  
  while (node = walker.nextNode()) {
    if (node.textContent.toLowerCase().includes(searchText.toLowerCase())) {
      textNodes.push(node);
    }
  }
  
  textNodes.forEach(textNode => {
    const parent = textNode.parentNode;
    const regex = new RegExp(`(${searchText})`, 'gi');
    const highlighted = textNode.textContent.replace(regex, 
      `<span class="${className}">$1</span>`
    );
    
    const wrapper = document.createElement('span');
    wrapper.innerHTML = highlighted;
    parent.replaceChild(wrapper, textNode);
    
    scanHighlights.push(wrapper);
  });
}

function clearHighlights() {
  scanHighlights.forEach(highlight => {
    const parent = highlight.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    }
  });
  scanHighlights = [];
}

// Utility functions
function getPageInfo() {
  return {
    title: document.title,
    url: window.location.href,
    domain: window.location.hostname,
    wordCount: document.body.innerText.split(/\s+/).length,
    images: document.images.length,
    links: document.links.length,
    hasMetaMask: typeof window.ethereum !== 'undefined',
    timestamp: Date.now()
  };
}

function setupTokenDetection() {
  // Add CSS for token highlights
  const style = document.createElement('style');
  style.textContent = `
    .scout-token-highlight {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      padding: 2px 4px !important;
      border-radius: 3px !important;
      font-weight: bold !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
    }
    
    .scout-address-highlight {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
      color: white !important;
      padding: 2px 4px !important;
      border-radius: 3px !important;
      font-family: monospace !important;
      font-size: 0.9em !important;
    }
  `;
  document.head.appendChild(style);
}

function setupScrollTracking() {
  let scrollTimeout;
  
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      // Send scroll position for lazy scanning
      sendMessageToBackground('SCROLL_UPDATE', {
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight
      });
    }, 250);
  });
}

// Listen for messages from injected script
document.addEventListener('scoutWalletStatus', (event) => {
  sendMessageToBackground('WALLET_STATUS_UPDATE', event.detail);
});

document.addEventListener('scoutWalletError', (event) => {
  sendMessageToBackground('WALLET_ERROR', event.detail);
});

document.addEventListener('scoutContentChanged', (event) => {
  sendMessageToBackground('CONTENT_CHANGED', event.detail);
});

document.addEventListener('scoutMetrics', (event) => {
  sendMessageToBackground('PAGE_METRICS', event.detail);
});

document.addEventListener('scoutPageData', (event) => {
  sendMessageToBackground('PAGE_DATA', event.detail);
});

// Send message to background script
function sendMessageToBackground(type, data) {
  chrome.runtime.sendMessage({
    type: type,
    data: data,
    timestamp: Date.now(),
    url: window.location.href
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
    } else {
      console.log('Message response:', response);
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript);
} else {
  initContentScript();
}

// Send initial load message
sendMessageToBackground('SCOUT_CONTENT_LOADED', {
  pageInfo: getPageInfo(),
  timestamp: Date.now()
});

// In-page wallet popup functions
function showInPageWalletPopup() {
  console.log('Scout: Showing in-page wallet popup');
  
  // Remove existing popup if any
  hideInPageWalletPopup();
  
  // Inject CSS for the popup
  injectWalletPopupCSS();
  
  // Create popup overlay
  const overlay = document.createElement('div');
  overlay.id = 'scout-wallet-overlay';
  overlay.className = 'scout-wallet-overlay';
  
  // Create popup content
  overlay.innerHTML = `
    <div class="scout-wallet-popup">
      <button class="scout-close-btn" onclick="scoutCloseWalletPopup()">×</button>
      
      <div class="scout-popup-header">
        <div class="scout-logo">🔍</div>
        <h2 class="scout-popup-title">Connect Your Wallet</h2>
        <p class="scout-popup-subtitle">Choose your preferred wallet and network</p>
      </div>
      
      <div class="scout-wallet-section">
        <div class="scout-wallet-status" id="scout-wallet-status">
          <div class="scout-status-icon" id="scout-status-icon">🔗</div>
          <div class="scout-status-text" id="scout-status-text">Ready to Connect</div>
          <div class="scout-status-detail" id="scout-status-detail">Select a wallet option below</div>
        </div>
        
        <div class="scout-chain-selector">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; opacity: 0.9;">Select Network:</h4>
          <div class="scout-chain-grid">
            <button class="scout-chain-btn active" data-chain="0x1">
              <div>🔷 Ethereum</div>
              <div style="font-size: 10px; opacity: 0.8;">Mainnet</div>
            </button>
            <button class="scout-chain-btn" data-chain="0x89">
              <div>🟣 Polygon</div>
              <div style="font-size: 10px; opacity: 0.8;">MATIC</div>
            </button>
            <button class="scout-chain-btn" data-chain="0xa">
              <div>🔴 Optimism</div>
              <div style="font-size: 10px; opacity: 0.8;">OP</div>
            </button>
            <button class="scout-chain-btn" data-chain="0xa4b1">
              <div>🔵 Arbitrum</div>
              <div style="font-size: 10px; opacity: 0.8;">ARB</div>
            </button>
            <button class="scout-chain-btn" data-chain="0x38">
              <div>🟡 BSC</div>
              <div style="font-size: 10px; opacity: 0.8;">BNB</div>
            </button>
            <button class="scout-chain-btn" data-chain="0xa86a">
              <div>🔺 Avalanche</div>
              <div style="font-size: 10px; opacity: 0.8;">AVAX</div>
            </button>
          </div>
        </div>
        
        <div class="scout-wallet-options">
          <button class="scout-wallet-btn" onclick="scoutConnectMetaMask()">
            🦊 Connect MetaMask
          </button>
          <button class="scout-wallet-btn secondary" onclick="scoutConnectWalletConnect()">
            🔗 WalletConnect
          </button>
          <button class="scout-wallet-btn secondary" onclick="scoutConnectCoinbase()">
            🔵 Coinbase Wallet
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add to page
  document.body.appendChild(overlay);
  
  // Add event listeners for chain selection
  setupChainSelection();
  
  // Add click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      hideInPageWalletPopup();
    }
  });
}

function hideInPageWalletPopup() {
  const overlay = document.getElementById('scout-wallet-overlay');
  if (overlay) {
    overlay.remove();
  }
}

function injectWalletPopupCSS() {
  // Check if CSS is already injected
  if (document.getElementById('scout-wallet-popup-css')) {
    return;
  }
  
  // Get CSS from extension
  fetch(chrome.runtime.getURL('scout-wallet-popup.css'))
    .then(response => response.text())
    .then(css => {
      const style = document.createElement('style');
      style.id = 'scout-wallet-popup-css';
      style.textContent = css;
      document.head.appendChild(style);
    })
    .catch(error => {
      console.error('Failed to load wallet popup CSS:', error);
      // Fallback: inject basic styles
      const style = document.createElement('style');
      style.id = 'scout-wallet-popup-css';
      style.textContent = `
        .scout-wallet-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: rgba(0, 0, 0, 0.8) !important;
          z-index: 999999 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        .scout-wallet-popup {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          border-radius: 20px !important;
          padding: 32px !important;
          max-width: 420px !important;
          width: 90% !important;
          color: white !important;
          position: relative !important;
        }
      `;
      document.head.appendChild(style);
    });
}

function setupChainSelection() {
  const chainBtns = document.querySelectorAll('.scout-chain-btn');
  chainBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      chainBtns.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');
      
      // Store selected chain
      window.scoutSelectedChain = btn.dataset.chain;
    });
  });
  
  // Set default chain
  window.scoutSelectedChain = '0x1'; // Ethereum mainnet
}

// Global functions for wallet popup (accessible from onclick)
window.scoutCloseWalletPopup = function() {
  hideInPageWalletPopup();
  
  // Notify extension that popup was closed
  sendMessageToBackground('WALLET_POPUP_CLOSED', {
    userClosed: true
  });
};

window.scoutConnectMetaMask = async function() {
  console.log('Scout: Connecting to MetaMask');
  
  const statusIcon = document.getElementById('scout-status-icon');
  const statusText = document.getElementById('scout-status-text');
  const statusDetail = document.getElementById('scout-status-detail');
  const walletStatus = document.getElementById('scout-wallet-status');
  
  try {
    // Update UI to show connecting state
    statusIcon.textContent = '🔄';
    statusText.textContent = 'Connecting...';
    statusDetail.textContent = 'Please approve the connection in MetaMask';
    
    // Check if MetaMask is available
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask extension.');
    }
    
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    if (accounts.length === 0) {
      throw new Error('No accounts found. Please unlock MetaMask.');
    }
    
    const account = accounts[0];
    
    // Get current chain ID
    const chainId = await window.ethereum.request({
      method: 'eth_chainId'
    });
    
    // Switch to selected chain if different
    const selectedChain = window.scoutSelectedChain || '0x1';
    if (chainId !== selectedChain) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: selectedChain }],
        });
      } catch (switchError) {
        console.warn('Could not switch chain:', switchError);
        // Continue with current chain
      }
    }
    
    // Show success
    statusIcon.textContent = '✅';
    statusText.textContent = 'Connected Successfully!';
    statusDetail.textContent = `${account.substring(0, 6)}...${account.substring(38)}`;
    walletStatus.classList.add('scout-success');
    
    // Send success to extension
    sendMessageToBackground('WALLET_CONNECTED', {
      account: account,
      chainId: chainId,
      provider: 'MetaMask',
      selectedChain: selectedChain
    });
    
    // Close popup after delay
    setTimeout(() => {
      hideInPageWalletPopup();
    }, 2000);
    
  } catch (error) {
    console.error('MetaMask connection error:', error);
    
    // Show error
    statusIcon.textContent = '❌';
    statusText.textContent = 'Connection Failed';
    statusDetail.textContent = error.message;
    walletStatus.classList.add('scout-error');
    
    // Send error to extension
    sendMessageToBackground('WALLET_ERROR', {
      error: error.message,
      provider: 'MetaMask'
    });
  }
};

window.scoutConnectWalletConnect = function() {
  alert('WalletConnect integration coming soon!');
};

window.scoutConnectCoinbase = function() {
  alert('Coinbase Wallet integration coming soon!');
};
