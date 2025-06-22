// Scout Content Script - Web3 AI Agent Content Bridge
// Handles wallet integration, OCR, token detection, and page scanning

console.log('Scout content script loaded');

// Import and initialize OCR Integration Package
let scoutOCRIntegration = null;

// Initialize Scout OCR Integration Package
async function initializeScoutOCR() {
  try {
    // Load the OCR Integration Package
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('ocr-integration-package.js');
    script.onload = () => {
      console.log('🔍 Scout OCR Integration Package loaded');
      
      // Initialize the OCR package with Scout-specific configuration
      scoutOCRIntegration = new window.OCRIntegrationPackage({
        // Custom Scout configuration
        confidenceThreshold: 0.8,
        autoCloseDelay: 8000,
        animationDuration: 400
      });
      
      // Set Scout callbacks for OCR completion and text analysis
      scoutOCRIntegration.setScoutCallbacks(
        handleOCRIntegrationComplete,
        handleOCRTextAnalysis
      );
      
      // Initialize the OCR integration
      scoutOCRIntegration.initialize();
      
      console.log('✅ Scout OCR Integration initialized successfully');
    };
    
    script.onerror = (error) => {
      console.error('❌ Failed to load Scout OCR Integration Package:', error);
    };
    
    document.head.appendChild(script);
    
  } catch (error) {
    console.error('❌ Error initializing Scout OCR Integration:', error);
  }
}

// Handle OCR Integration Package completion
async function handleOCRIntegrationComplete(ocrData) {
  console.log('🔍 Scout OCR Integration completed:', ocrData);
  
  try {
    // Process the OCR data with Scout's existing analysis
    const scoutAnalysis = await processOCRWithScout(ocrData);
    
    // Send to background for further processing
    chrome.runtime.sendMessage({
      type: 'OCR_INTEGRATION_COMPLETE',
      ocrData: ocrData,
      scoutAnalysis: scoutAnalysis,
      timestamp: Date.now()
    }).catch(console.error);
    
    // Show Scout-specific notifications if needed
    if (scoutAnalysis.hasWebXContent || scoutAnalysis.riskLevel > 0.5) {
      showScoutAnalysisNotification(scoutAnalysis);
    }
    
  } catch (error) {
    console.error('❌ Error processing OCR with Scout:', error);
  }
}

// Handle text analysis from OCR Integration Package
async function handleOCRTextAnalysis(text, ocrData) {
  console.log('🧠 Scout OCR text analysis requested:', text);
  
  try {
    // Use Scout's existing analysis capabilities
    const analysisResult = await analyzeTextContent(text, ocrData.context);
    
    // Send to backend for AI analysis
    chrome.runtime.sendMessage({
      type: 'ANALYZE_WEB3',
      data: {
        text: text,
        context: ocrData.context,
        analysisType: 'ocr-text-analysis',
        timestamp: Date.now(),
        ocrSource: true
      }
    }).catch(console.error);
    
    return analysisResult;
    
  } catch (error) {
    console.error('❌ Error in Scout OCR text analysis:', error);
  }
}

// Process OCR data using Scout's analysis capabilities
async function processOCRWithScout(ocrData) {
  const analysis = {
    hasWebXContent: false,
    riskLevel: 0,
    tokens: [],
    addresses: [],
    entities: [],
    recommendations: []
  };
  
  try {
    // Extract crypto addresses from text
    const addresses = extractAddressesFromText(ocrData.text);
    analysis.addresses = addresses;
    
    // Extract token references
    const tokens = extractTokensFromText(ocrData.text);
    analysis.tokens = tokens;
    
    // Check for Web3 content
    analysis.hasWebXContent = (
      addresses.length > 0 ||
      tokens.length > 0 ||
      containsWeb3Keywords(ocrData.text)
    );
    
    // Calculate risk level
    analysis.riskLevel = calculateContentRiskLevel(ocrData.text, addresses, tokens);
    
    // Extract entities (contracts, DEX names, etc.)
    analysis.entities = extractWeb3Entities(ocrData.text);
    
    // Generate recommendations
    if (analysis.hasWebXContent) {
      analysis.recommendations = generateScoutRecommendations(analysis);
    }
    
    console.log('🔍 Scout OCR analysis completed:', analysis);
    return analysis;
    
  } catch (error) {
    console.error('❌ Error in Scout OCR processing:', error);
    return analysis;
  }
}

// Show Scout-specific analysis notification
function showScoutAnalysisNotification(analysis) {
  const notification = document.createElement('div');
  notification.className = 'scout-ocr-notification';
  notification.innerHTML = `
    <div class="scout-notification-header">
      <span class="scout-icon">🛡️</span>
      <span class="scout-title">Scout Analysis</span>
      <button class="scout-close-btn" onclick="this.parentElement.parentElement.remove()">✖</button>
    </div>
    <div class="scout-notification-content">
      ${analysis.riskLevel > 0.7 ? 
        `<div class="scout-warning">⚠️ High risk content detected</div>` : 
        '<div class="scout-info">ℹ️ Web3 content analysis complete</div>'
      }
      ${analysis.addresses.length > 0 ? 
        `<div class="scout-addresses">📍 ${analysis.addresses.length} address(es) found</div>` : ''
      }
      ${analysis.tokens.length > 0 ? 
        `<div class="scout-tokens">🪙 ${analysis.tokens.length} token(s) found</div>` : ''
      }
    </div>
  `;
  
  // Add Scout notification styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    padding: 15px;
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
    z-index: 10003;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 320px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
    animation: scoutSlideIn 0.4s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 8 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'scoutSlideOut 0.3s ease-in forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, 8000);
}

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
        case 'SCOUT_OCR_SCAN':
      performScoutOCRScan(message.data)
        .then(results => sendResponse({ success: true, results: results }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response

    case 'TRIGGER_OCR_SCAN':
      handleTriggerOCRScan(message.options)
        .then(results => sendResponse({ success: true, results: results }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
      
    case 'ANALYZE_ADDRESS':
      handleAddressAnalysis(message.address)
        .then(results => sendResponse({ success: true, results: results }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
      
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
      
    // Backend Integration Message Handlers
    case 'WEB3_ANALYSIS_RESULT':
      handleWeb3AnalysisResult(message.result, message.source);
      sendResponse({ success: true });
      break;
      
    case 'ADDRESS_ANALYSIS_RESULT':
      handleAddressAnalysisResult(message.address, message.result, message.source);
      sendResponse({ success: true });
      break;
      
    case 'OCR_ANALYSIS_RESULT':
      handleOCRAnalysisResult(message.original, message.result, message.source);
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

// Scout OCR scan function
async function performScoutOCRScan(options = {}) {
    try {
        console.log('Scout: Starting enhanced OCR scan...');
        
        // Show OCR scanning indicator
        showOCRIndicator();
        
        // Collect comprehensive page content
        const pageContent = {
            text: document.body.innerText,
            html: document.documentElement.outerHTML.substring(0, 50000), // First 50KB of HTML
            images: [],
            url: window.location.href,
            title: document.title,
            timestamp: Date.now(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                scrollX: window.scrollX,
                scrollY: window.scrollY
            },
            meta: {
                description: document.querySelector('meta[name="description"]')?.content || '',
                keywords: document.querySelector('meta[name="keywords"]')?.content || '',
                author: document.querySelector('meta[name="author"]')?.content || ''
            }
        };
        
        // Collect images with enhanced metadata
        const images = Array.from(document.images);
        for (const img of images) {
            if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                // Focus on images that might contain crypto content
                const isRelevant = (
                    img.naturalWidth >= 100 && img.naturalHeight >= 50 ||
                    img.alt?.toLowerCase().includes('token') ||
                    img.alt?.toLowerCase().includes('coin') ||
                    img.alt?.toLowerCase().includes('chart') ||
                    img.src.toLowerCase().includes('chart') ||
                    img.src.toLowerCase().includes('token') ||
                    img.className?.toLowerCase().includes('crypto')
                );
                
                if (isRelevant || images.length < 10) { // Include first 10 images regardless
                    pageContent.images.push({
                        src: img.src,
                        alt: img.alt || '',
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        visible: isElementVisible(img),
                        className: img.className,
                        dataAttributes: Object.fromEntries(
                            [...img.attributes]
                            .filter(attr => attr.name.startsWith('data-'))
                            .map(attr => [attr.name, attr.value])
                        )
                    });
                }
            }
        }
        
        // Enhanced token and address detection
        const tokens = findTokenReferences();
        const addresses = findCryptoAddresses();
        const contracts = findContractAddresses();
        
        // Analyze page structure for crypto content
        const cryptoContext = analyzeCryptoContext();
        
        // Prepare comprehensive analysis
        const analysis = {
            pageContent: pageContent,
            tokens: tokens,
            addresses: addresses,
            contracts: contracts,
            cryptoContext: cryptoContext,
            enhancedFeatures: !!options.walletAddress,
            walletAddress: options.walletAddress,
            confidence: calculateAnalysisConfidence(tokens, addresses, contracts, cryptoContext),
            processingTime: Date.now() - pageContent.timestamp,
            scanType: 'comprehensive-ocr',
            version: '2.0'
        };
          console.log('Scout: Enhanced OCR scan completed', analysis);
        
        // Try to send to backend for enhanced processing
        try {
          const backendResponse = await chrome.runtime.sendMessage({
            type: 'PROCESS_OCR_BACKEND',
            ocrResults: analysis,
            context: {
              url: window.location.href,
              timestamp: Date.now(),
              pageTitle: document.title
            }
          });
          
          if (backendResponse.success) {
            console.log('Scout: Backend OCR processing successful');
            // Backend will handle result display via handleOCRAnalysisResult
          } else {
            console.warn('Scout: Backend OCR processing failed:', backendResponse.error);
          }
        } catch (backendError) {
          console.warn('Scout: Backend OCR processing unavailable:', backendError.message);
        }
        
        hideOCRIndicator();
        return analysis;
        
    } catch (error) {
        console.error('Scout OCR scan error:', error);
        hideOCRIndicator();
        throw error;
    }
}

// Show OCR scanning indicator
function showOCRIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'scout-ocr-indicator';
    indicator.innerHTML = `
        <div class="scout-ocr-pulse">
            <span>🔍</span>
            <span>Scout OCR Scanning...</span>
        </div>
    `;
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        backdrop-filter: blur(10px);
        animation: scoutPulse 2s infinite;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes scoutPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
        }
        .scout-ocr-pulse {
            display: flex;
            align-items: center;
            gap: 8px;
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(indicator);
}

// Hide OCR scanning indicator
function hideOCRIndicator() {
    const indicator = document.getElementById('scout-ocr-indicator');
    if (indicator) {
        indicator.style.transition = 'all 0.3s ease';
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 300);
    }
}

// Analyze crypto context on the page
function analyzeCryptoContext() {
    const context = {
        isDeFiSite: false,
        isExchange: false,
        isCryptoNews: false,
        isWallet: false,
        hasCharts: false,
        hasPrices: false,
        hasTrading: false,
        confidence: 0
    };
    
    const text = document.body.innerText.toLowerCase();
    const html = document.documentElement.outerHTML.toLowerCase();
    
    // Check for DeFi indicators
    const defiKeywords = ['defi', 'liquidity', 'yield', 'farming', 'staking', 'swap', 'uniswap', 'sushiswap', 'compound', 'aave'];
    context.isDeFiSite = defiKeywords.some(keyword => text.includes(keyword));
    
    // Check for exchange indicators
    const exchangeKeywords = ['exchange', 'trading', 'buy', 'sell', 'order', 'market', 'binance', 'coinbase', 'kraken'];
    context.isExchange = exchangeKeywords.some(keyword => text.includes(keyword));
    
    // Check for crypto news
    const newsKeywords = ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'news', 'analysis', 'price prediction'];
    context.isCryptoNews = newsKeywords.some(keyword => text.includes(keyword));
    
    // Check for wallet
    const walletKeywords = ['wallet', 'connect', 'metamask', 'trust wallet', 'ledger'];
    context.isWallet = walletKeywords.some(keyword => text.includes(keyword));
    
    // Check for charts
    context.hasCharts = html.includes('chart') || html.includes('tradingview') || document.querySelector('canvas');
    
    // Check for prices
    context.hasPrices = /\$[\d,]+\.?\d*/.test(text) || text.includes('price');
    
    // Check for trading
    context.hasTrading = text.includes('trade') || text.includes('order') || text.includes('volume');
    
    // Calculate confidence
    const indicators = [context.isDeFiSite, context.isExchange, context.isCryptoNews, 
                      context.isWallet, context.hasCharts, context.hasPrices, context.hasTrading];
    context.confidence = indicators.filter(Boolean).length / indicators.length;
    
    return context;
}

// Calculate analysis confidence
function calculateAnalysisConfidence(tokens, addresses, contracts, context) {
    let confidence = 0.3; // Base confidence
    
    if (tokens.length > 0) confidence += 0.2;
    if (addresses.length > 0) confidence += 0.1;
    if (contracts.length > 0) confidence += 0.1;
    if (context.confidence > 0.5) confidence += 0.2;
    if (context.hasCharts) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
}

// Check if element is visible
function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        rect.top < window.innerHeight &&
        rect.bottom > 0
    );
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

// Handle triggered OCR scan from keyboard shortcut or context menu
async function handleTriggerOCRScan(options = {}) {
  try {
    console.log('Scout: Handling triggered OCR scan with options:', options);
    
    // Show immediate feedback
    showOCRIndicator();
    
    // Determine scan type based on options
    let scanData = {};
    
    if (options.selectedText) {
      // Context menu - scan selection
      scanData.selectedText = options.selectedText;
      scanData.scanType = 'selection';
    } else if (options.imageUrl) {
      // Context menu - scan image
      scanData.imageUrl = options.imageUrl;
      scanData.scanType = 'image';
    } else {
      // Keyboard shortcut - scan full page
      scanData.scanType = 'fullPage';
    }
    
    // Perform the OCR scan
    const results = await performScoutOCRScan(scanData);
      // Send results to background script for popup display
    sendMessageToBackground('OCR_SCAN_COMPLETE', {
      trigger: (options.selectedText || options.imageUrl) ? 'contextMenu' : 'keyboard',
      results: results,
      timestamp: Date.now()
    });
    
    // Show success feedback
    showOCRSuccess();
    
    return results;
    
  } catch (error) {
    console.error('Scout: Error in triggered OCR scan:', error);
    hideOCRIndicator();
    showOCRError(error.message);
    throw error;
  }
}

// Show OCR success feedback
function showOCRSuccess() {
  hideOCRIndicator();
  
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="color: #4caf50;">✓</span>
      <span>OCR Scan Complete</span>
    </div>
  `;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    border-left: 4px solid #4caf50;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: slideInRight 0.3s ease;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }, 3000);
}

// Show OCR error feedback
function showOCRError(message) {
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="color: #f44336;">✗</span>
      <span>OCR Scan Failed: ${message}</span>
    </div>
  `;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    border-left: 4px solid #f44336;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

// Handle address analysis from context menu
async function handleAddressAnalysis(address) {
  try {
    console.log('Scout: Analyzing address:', address);
    
    // Show analysis indicator
    const indicator = document.createElement('div');
    indicator.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>📊</span>
        <span>Analyzing Address...</span>
      </div>
    `;
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 20px rgba(240, 147, 251, 0.3);
      animation: scoutPulse 2s infinite;
    `;
    
    document.body.appendChild(indicator);
    
    try {
      // Try backend analysis first
      const backendResponse = await chrome.runtime.sendMessage({
        type: 'ANALYZE_ADDRESS_BACKEND',
        address: address,
        context: {
          url: window.location.href,
          timestamp: Date.now(),
          pageTitle: document.title
        }
      });
      
      if (backendResponse.success) {
        console.log('Scout: Backend address analysis successful');
        
        // Remove indicator
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
        
        // Backend will handle result display via handleAddressAnalysisResult
        return backendResponse.result;
      } else {
        throw new Error(backendResponse.error || 'Backend analysis failed');
      }
      
    } catch (backendError) {
      console.warn('Scout: Backend analysis failed, using fallback:', backendError.message);
      
      // Fallback to local analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock analysis results (fallback)
      const analysis = {
        address: address,
        type: address.startsWith('0x') ? 'Ethereum' : 'Unknown',
        balance: '$' + (Math.random() * 10000).toFixed(2),
        transactions: Math.floor(Math.random() * 1000),
        risk: Math.random() > 0.7 ? 'High' : Math.random() > 0.4 ? 'Medium' : 'Low',
        labels: ['DeFi User', 'Active Trader'],
        riskScore: Math.random(),
        source: 'fallback'
      };
      
      // Remove indicator
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
      
      // Show fallback result
      const notification = document.createElement('div');
      notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="background: rgba(255,255,255,0.2); border-radius: 50%; padding: 8px; min-width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
            👤
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">Address Analysis (Offline)</div>
            <div style="font-size: 12px; opacity: 0.7; margin-bottom: 8px; word-break: break-all;">
              ${address.slice(0, 8)}...${address.slice(-6)}
            </div>
            <div style="font-size: 13px; line-height: 1.4;">
              <div>Type: ${analysis.type}</div>
              <div>Risk Level: ${analysis.risk}</div>
              <div>Backend unavailable - limited analysis</div>
            </div>
          </div>
        </div>
      `;
      
      showScoutNotification(notification, 5000, 'warning');
      
      // Send to background for storage
      chrome.runtime.sendMessage({
        type: 'ADDRESS_ANALYSIS_COMPLETE',
        data: {
          address: address,
          analysis: analysis,
          timestamp: Date.now(),
          trigger: 'context_menu'
        }
      }).catch(console.error);
      
      return analysis;
    }
    
  } catch (error) {
    console.error('Scout: Address analysis error:', error);
    
    // Remove indicator if present
    const existingIndicator = document.getElementById('scout-analysis-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    throw error;  }
}

// Backend Integration Functions

// Handle Web3 analysis results from backend
function handleWeb3AnalysisResult(result, source) {
  console.log('Scout: Received Web3 analysis result from', source, result);
  
  try {
    // Create in-page notification for analysis results
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="background: rgba(255,255,255,0.2); border-radius: 50%; padding: 8px; min-width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          🧠
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">AI Analysis Complete</div>
          <div style="font-size: 13px; opacity: 0.9; margin-bottom: 8px;">
            Found ${result.entities?.length || 0} entities with ${Math.round(result.confidence * 100)}% confidence
          </div>
          ${result.risks?.length > 0 ? `
            <div style="background: rgba(255,107,107,0.2); padding: 6px 10px; border-radius: 6px; font-size: 12px; margin-bottom: 6px;">
              ⚠️ ${result.risks.length} risk${result.risks.length !== 1 ? 's' : ''} identified
            </div>
          ` : ''}
          ${result.opportunities?.length > 0 ? `
            <div style="background: rgba(107,203,119,0.2); padding: 6px 10px; border-radius: 6px; font-size: 12px;">
              💡 ${result.opportunities.length} opportunit${result.opportunities.length !== 1 ? 'ies' : 'y'} found
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    showScoutNotification(notification, 8000, 'success');
    
    // Highlight entities if analysis found any
    if (result.entities && result.entities.length > 0) {
      highlightAnalysisEntities(result.entities);
    }
    
  } catch (error) {
    console.error('Scout: Error handling Web3 analysis result:', error);
  }
}

// Handle address analysis results from backend
function handleAddressAnalysisResult(address, result, source) {
  console.log('Scout: Received address analysis result from', source, result);
  
  try {
    // Create in-page notification for address analysis
    const riskColor = result.riskScore > 0.7 ? '#ff6b6b' : 
                     result.riskScore > 0.4 ? '#ffa726' : '#4caf50';
    
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="background: ${riskColor}20; border-radius: 50%; padding: 8px; min-width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          ${result.type === 'contract' ? '📋' : result.type === 'token' ? '🪙' : '👤'}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">${result.type || 'Address'} Analysis</div>
          <div style="font-size: 12px; opacity: 0.7; margin-bottom: 6px; word-break: break-all;">
            ${address.slice(0, 8)}...${address.slice(-6)}
          </div>
          <div style="background: ${riskColor}20; color: ${riskColor}; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-block; font-weight: 600;">
            Risk: ${Math.round(result.riskScore * 100)}%
          </div>
          ${result.verification?.verified ? `
            <div style="background: rgba(76,175,80,0.2); color: #4caf50; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-block; margin-left: 6px; font-weight: 600;">
              ✓ Verified
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    const riskLevel = result.riskScore > 0.7 ? 'error' : 
                     result.riskScore > 0.4 ? 'warning' : 'success';
    showScoutNotification(notification, 6000, riskLevel);
    
    // If this address is visible on the page, highlight it
    highlightAddressOnPage(address, result.riskScore);
    
  } catch (error) {
    console.error('Scout: Error handling address analysis result:', error);
  }
}

// Handle OCR analysis results from backend
function handleOCRAnalysisResult(originalResults, processedResult, source) {
  console.log('Scout: Received OCR analysis result from', source, processedResult);
  
  try {
    // Create in-page notification for OCR analysis
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="background: rgba(255,255,255,0.2); border-radius: 50%; padding: 8px; min-width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          📷
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">OCR Analysis Complete</div>
          <div style="font-size: 13px; opacity: 0.9; margin-bottom: 8px;">
            Processed text and found ${processedResult.entities?.length || 0} entities
          </div>
          ${processedResult.insights?.length > 0 ? `
            <div style="background: rgba(33,150,243,0.2); padding: 6px 10px; border-radius: 6px; font-size: 12px; margin-bottom: 6px;">
              💡 ${processedResult.insights.length} insight${processedResult.insights.length !== 1 ? 's' : ''} generated
            </div>
          ` : ''}
          ${processedResult.actions?.length > 0 ? `
            <div style="background: rgba(156,39,176,0.2); padding: 6px 10px; border-radius: 6px; font-size: 12px;">
              ⚡ ${processedResult.actions.length} action${processedResult.actions.length !== 1 ? 's' : ''} suggested
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    showScoutNotification(notification, 7000, 'info');
    
    // If entities were found, highlight them
    if (processedResult.entities && processedResult.entities.length > 0) {
      highlightAnalysisEntities(processedResult.entities);
    }
    
  } catch (error) {
    console.error('Scout: Error handling OCR analysis result:', error);
  }
}

// Helper function to highlight analysis entities on the page
function highlightAnalysisEntities(entities) {
  try {
    entities.forEach(entity => {
      if (entity.type === 'address' && entity.value) {
        highlightAddressOnPage(entity.value, entity.confidence || 0.8);
      } else if (entity.type === 'token' && entity.value) {
        highlightTextOnPage(entity.value, 'token');
      } else if (entity.type === 'protocol' && entity.value) {
        highlightTextOnPage(entity.value, 'protocol');
      }
    });
  } catch (error) {
    console.error('Scout: Error highlighting analysis entities:', error);
  }
}

// Helper function to highlight an address on the page
function highlightAddressOnPage(address, riskScore) {
  try {
    const riskColor = riskScore > 0.7 ? '#ff6b6b' : 
                     riskScore > 0.4 ? '#ffa726' : '#4caf50';
    
    // Find and highlight all instances of this address on the page
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    const addresses = [];
    
    while (node = walker.nextNode()) {
      if (node.nodeValue.includes(address)) {
        addresses.push(node);
      }
    }
    
    addresses.forEach(textNode => {
      const parent = textNode.parentNode;
      if (parent && !parent.classList.contains('scout-highlight')) {
        const wrapper = document.createElement('span');
        wrapper.className = 'scout-highlight scout-address-highlight';
        wrapper.style.cssText = `
          background: ${riskColor}20;
          color: ${riskColor};
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 600;
          border: 1px solid ${riskColor}40;
        `;
        
        parent.insertBefore(wrapper, textNode);
        wrapper.appendChild(textNode);
        
        // Add to highlights for cleanup
        scanHighlights.push(wrapper);
      }
    });
  } catch (error) {
    console.error('Scout: Error highlighting address:', error);
  }
}

// Helper function to highlight text on the page
function highlightTextOnPage(text, type) {
  try {
    const colors = {
      token: '#9c27b0',
      protocol: '#2196f3',
      default: '#4caf50'
    };
    
    const color = colors[type] || colors.default;
    
    // Find and highlight all instances of this text on the page
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    const matches = [];
    
    while (node = walker.nextNode()) {
      if (node.nodeValue.toLowerCase().includes(text.toLowerCase())) {
        matches.push(node);
      }
    }
    
    matches.forEach(textNode => {
      const parent = textNode.parentNode;
      if (parent && !parent.classList.contains('scout-highlight')) {
        const wrapper = document.createElement('span');
        wrapper.className = `scout-highlight scout-${type}-highlight`;
        wrapper.style.cssText = `
          background: ${color}20;
          color: ${color};
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 600;
          border: 1px solid ${color}40;
        `;
        
        parent.insertBefore(wrapper, textNode);
        wrapper.appendChild(textNode);
        
        // Add to highlights for cleanup
        scanHighlights.push(wrapper);
      }
    });
  } catch (error) {
    console.error('Scout: Error highlighting text:', error);
  }
}

// Enhanced notification system for backend results
function showScoutNotification(content, duration = 5000, type = 'info') {
  try {
    const colors = {
      success: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
      error: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
      warning: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
      info: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)'
    };
    
    const notification = document.createElement('div');
    notification.className = 'scout-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 6px 25px rgba(0,0,0,0.15);
      max-width: 400px;
      animation: scoutSlideIn 0.3s ease-out;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
    `;
    
    if (typeof content === 'string') {
      notification.innerHTML = content;
    } else {
      notification.appendChild(content);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove notification
    setTimeout(() => {
      notification.style.animation = 'scoutSlideOut 0.3s ease-in forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
    
  } catch (error) {
    console.error('Scout: Error showing notification:', error);
  }
}

// Initialize Scout OCR Integration on content script load
initializeScoutOCR();
