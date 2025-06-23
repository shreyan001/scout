// Scout Social Trader - Enhanced Background Script with Proper Scout API v6
console.log('🚀 Scout Social Trader v2.0 - Enhanced Background Script Loaded');

// Scout API v6 Configuration
const Scout_CONFIG = {
  QUOTE_API: 'https://quote-api.jup.ag/v6/quote',
  SWAP_API: 'https://quote-api.jup.ag/v6/swap',
  PRICE_API: 'https://price.jup.ag/v6/price',
  TOKENS_API: 'https://tokens.jup.ag/tokens',
  STRICT_LIST: 'https://tokens.jup.ag/strict',
  ALL_TOKENS: 'https://tokens.jup.ag/all'
};

// Token cache for faster lookups
let tokenCache = new Map();
let isInitialized = false;

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('🔧 Installing Scout Social Trader...');
  
  // Create context menu for any page
  chrome.contextMenus.create({
    id: "analyzeWithScoutAI",
    title: "🚀 Analyze with Scout AI",
    contexts: ["selection", "page", "image"]
  });
  
  chrome.contextMenus.create({
    id: "scanWithLens",
    title: "🔍 Scan with Scout Lens (OCR)",
    contexts: ["image", "page"]
  });
  
  chrome.contextMenus.create({
    id: "openScoutDashboard", 
    title: "📊 Open Scout Dashboard",
    contexts: ["page"]
  });
  
  chrome.contextMenus.create({
    id: "connectWallet",
    title: "🔗 Connect Solana Wallet",
    contexts: ["page"]
  });
  
  // Initialize token cache
  await initializeTokenCache();
  
  console.log('✅ Scout Social Trader installed successfully!');
});

// Initialize token cache from Scout API
async function initializeTokenCache() {
  try {
    console.log('📡 Fetching Scout token list...');
    
    const response = await fetch(Scout_CONFIG.ALL_TOKENS);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const tokens = await response.json();
    console.log(`📋 Loaded ${tokens.length} tokens from Scout`);
    
    // Build cache for fast lookups
    tokens.forEach(token => {
      if (token.symbol && token.address) {
        tokenCache.set(token.symbol.toUpperCase(), token);
        tokenCache.set(token.address, token);
      }
    });
    
    isInitialized = true;
    console.log('✅ Token cache initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize token cache:', error);
    // Fallback with common tokens
    initializeFallbackTokens();
  }
}

// Fallback token list if API fails
function initializeFallbackTokens() {
  const fallbackTokens = [
    { symbol: 'SOL', address: 'So11111111111111111111111111111111111111112', name: 'Solana', decimals: 9 },
    { symbol: 'JUP', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', name: 'Scout', decimals: 6 },
    { symbol: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', name: 'Bonk', decimals: 5 },
    { symbol: 'WIF', address: '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ', name: 'dogwifhat', decimals: 6 }
  ];
  
  fallbackTokens.forEach(token => {
    tokenCache.set(token.symbol.toUpperCase(), token);
    tokenCache.set(token.address, token);
  });
  
  isInitialized = true;
  console.log('⚠️ Using fallback token list');
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('🖱️ Context menu clicked:', info.menuItemId);
  
  try {
    switch (info.menuItemId) {
      case "analyzeWithScoutAI":
        if (info.selectionText) {
          await analyzeSelectedText(info.selectionText, tab);
        } else {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Scout Social Trader',
            message: 'Please select text to analyze'
          });
        }
        break;
        
      case "scanWithLens":
        // Activate lens mode on the page
        chrome.tabs.sendMessage(tab.id, {
          action: 'toggleLensMode'
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Failed to activate lens mode:', chrome.runtime.lastError);
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon48.png',
              title: 'Scout Lens',
              message: 'Please refresh the page and try again'
            });
          }
        });
        break;
        
      case "openScoutDashboard":
        chrome.tabs.create({ 
          url: chrome.runtime.getURL('dashboard.html') 
        });
        break;
        
      case "connectWallet":
        chrome.tabs.create({
          url: chrome.runtime.getURL('connection.html'),
          active: true
        });
        break;
    }
  } catch (error) {
    console.error('❌ Context menu error:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Scout Social Trader',
      message: 'An error occurred. Please try again.'
    });
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('📨 Background received message:', request.action);
  
  try {
    switch (request.action) {
      case 'analyzeText':
        const analysis = await analyzeTextContent(request.text);
        sendResponse(analysis);
        break;
        
      case 'getTokenData':
        const tokenData = await getTokenDataFromScout(request.symbol);
        sendResponse(tokenData);
        break;
        
      case 'performOCR':
        const ocrResult = await performOCRAnalysis(request.imageData);
        sendResponse(ocrResult);
        break;
        
      case 'healthCheck':
        const health = await checkScoutAPIHealth();
        sendResponse(health);
        break;
        
      case 'getQuote':
        const quote = await getScoutQuote(request.inputMint, request.outputMint, request.amount);
        sendResponse(quote);
        break;      case 'openWalletConnection':
        chrome.tabs.create({
          url: chrome.runtime.getURL('connection.html'),
          active: true
        });
        sendResponse({ success: true });
        break;
        
      case 'requestWalletDetection':
        handleWalletDetectionRequest(sender.tab);
        sendResponse({ success: true });
        break;
        
      case 'walletsDetected':
        relayToConnectionPage(request);
        sendResponse({ success: true });
        break;
        
      case 'walletConnected':
        relayToConnectionPage(request);
        relayToPopup(request);
        sendResponse({ success: true });
        break;
        
      case 'walletDisconnected':
        relayToConnectionPage(request);
        relayToPopup(request);
        sendResponse({ success: true });
        break;
        
      case 'walletConnectionFailed':
        relayToConnectionPage(request);
        sendResponse({ success: true });
        break;
        
      case 'getWalletData':
        chrome.storage.local.get([
          'isWalletConnected',
          'walletName',
          'walletIcon', 
          'walletAddress',
          'walletBalance',
          'connectionTime'
        ], (result) => {
          if (result.isWalletConnected && result.walletAddress) {
            sendResponse({ 
              success: true, 
              data: {
                isConnected: result.isWalletConnected,
                walletName: result.walletName,
                walletIcon: result.walletIcon,
                address: result.walletAddress,
                balance: result.walletBalance,
                connectionTime: result.connectionTime
              }
            });
          } else {
            sendResponse({ success: true, data: null });
          }
        });
        return true;
        
      case 'disconnectWallet':
        chrome.storage.local.remove([
          'isWalletConnected',
          'walletName',
          'walletIcon',
          'walletAddress', 
          'walletBalance',
          'connectionTime'
        ], () => {
          console.log('🔌 Wallet disconnected and storage cleared');
          sendResponse({ success: true });
        });
        return true;
        
      case 'WALLET_CONNECTED':
        // Handle wallet connection event from connection page
        console.log('🔗 Wallet connected event received:', request.walletData);
        // Data is already stored by connection.js, just acknowledge
        sendResponse({ success: true });
        break;
        
      case 'WALLET_DISCONNECTED':
        // Handle wallet disconnection event from connection page
        console.log('🔌 Wallet disconnected event received');
        sendResponse({ success: true });
        break;
        
      case 'requestWalletDetection':
        handleWalletDetectionRequest(sender.tab);
        sendResponse({ success: true });
        break;
        
      case 'connectWallet':
        handleWalletConnectionRequest(request.provider, sender.tab);
        sendResponse({ success: true });
        break;
        
      case 'walletsDetected':
        // Relay to connection page
        relayToConnectionPage(request);
        sendResponse({ success: true });
        break;
        
      case 'walletConnected':
        // Relay to connection page and popup
        relayToConnectionPage(request);
        relayToPopup(request);
        sendResponse({ success: true });
        break;
        
      case 'walletDisconnected':
        // Relay to connection page and popup
        relayToConnectionPage(request);
        relayToPopup(request);
        sendResponse({ success: true });
        break;
        
      case 'walletConnectionFailed':
        // Relay to connection page
        relayToConnectionPage(request);
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('❌ Message handler error:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true; // Keep message channel open for async responses
});

// Analyze text content using AI and extract tokens
async function analyzeTextContent(text) {
  try {
    console.log('🧠 Analyzing text content...');
    
    // Extract potential tokens from text
    const tokens = extractTokensFromText(text);
    console.log(`🪙 Found ${tokens.length} potential tokens:`, tokens);
    
    // Perform sentiment analysis
    const sentiment = analyzeSentiment(text);
    console.log('📊 Sentiment analysis:', sentiment);
    
    // Store analysis in history
    await storeAnalysis(tokens, sentiment, text);
    
    return {
      success: true,
      data: {
        tokens: tokens,
        sentiment: sentiment,
        originalText: text.substring(0, 200) + (text.length > 200 ? '...' : '')
      }
    };
    
  } catch (error) {
    console.error('❌ Text analysis failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Enhanced token extraction with better pattern matching
function extractTokensFromText(text) {
  const tokens = [];
  
  // Pattern for $TOKEN format
  const dollarTokenPattern = /\$([A-Z]{2,10})\b/gi;
  let match;
  
  while ((match = dollarTokenPattern.exec(text)) !== null) {
    const symbol = match[1].toUpperCase();
    if (!tokens.some(t => t.symbol === symbol)) {
      tokens.push({
        symbol: symbol,
        mention: match[0],
        position: match.index
      });
    }
  }
  
  // Pattern for common token names without $
  const commonTokens = ['SOL', 'SOLANA', 'JUP', 'Scout', 'BONK', 'WIF', 'DOGWIFHAT', 'BITCOIN', 'BTC', 'ETHEREUM', 'ETH'];
  const tokenNamePattern = new RegExp(`\\b(${commonTokens.join('|')})\\b`, 'gi');
  
  while ((match = tokenNamePattern.exec(text)) !== null) {
    const symbol = normalizeTokenSymbol(match[1]);
    if (!tokens.some(t => t.symbol === symbol)) {
      tokens.push({
        symbol: symbol,
        mention: match[0],
        position: match.index
      });
    }
  }
  
  return tokens;
}

// Normalize token symbols to standard format
function normalizeTokenSymbol(token) {
  const tokenMap = {
    'SOLANA': 'SOL',
    'Scout': 'JUP',
    'DOGWIFHAT': 'WIF',
    'BITCOIN': 'BTC',
    'ETHEREUM': 'ETH'
  };
  
  return tokenMap[token.toUpperCase()] || token.toUpperCase();
}

// Enhanced sentiment analysis with more sophisticated logic
function analyzeSentiment(text) {
  const positiveWords = [
    'moon', 'pump', 'bullish', 'buy', 'long', 'hodl', 'gem', 'rocket', '🚀', '📈', 
    'green', 'profit', 'gain', 'up', 'rise', 'surge', 'breakout', 'rally', 'boom',
    'golden', 'opportunity', 'potential', 'strong', 'solid', 'amazing', 'huge'
  ];
  
  const negativeWords = [
    'dump', 'crash', 'bearish', 'sell', 'short', 'rekt', 'rug', 'scam', '📉', '💀',
    'red', 'loss', 'down', 'fall', 'drop', 'decline', 'weak', 'dead', 'avoid',
    'warning', 'danger', 'risky', 'bubble', 'overvalued', 'exit', 'panic'
  ];
  
  const neutralWords = [
    'hold', 'wait', 'watch', 'monitor', 'sideways', 'consolidate', 'range',
    'uncertain', 'mixed', 'unclear', 'depends', 'maybe', 'possibly'
  ];
  
  const lowerText = text.toLowerCase();
  
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  
  // Count sentiment words
  positiveWords.forEach(word => {
    const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
    positiveScore += matches;
  });
  
  negativeWords.forEach(word => {
    const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
    negativeScore += matches;
  });
  
  neutralWords.forEach(word => {
    const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
    neutralScore += matches;
  });
  
  // Calculate overall sentiment
  const totalScore = positiveScore + negativeScore + neutralScore;
  
  if (totalScore === 0) {
    return {
      sentiment: 'neutral',
      confidence: 0.5,
      reasoning: 'No clear sentiment indicators found in the text.'
    };
  }
  
  const positiveRatio = positiveScore / totalScore;
  const negativeRatio = negativeScore / totalScore;
  
  let sentiment, confidence, reasoning;
  
  if (positiveScore > negativeScore && positiveRatio > 0.4) {
    sentiment = 'positive';
    confidence = Math.min(0.9, 0.6 + positiveRatio * 0.4);
    reasoning = `Strong bullish indicators detected (${positiveScore} positive signals).`;
  } else if (negativeScore > positiveScore && negativeRatio > 0.4) {
    sentiment = 'negative';
    confidence = Math.min(0.9, 0.6 + negativeRatio * 0.4);
    reasoning = `Bearish signals detected (${negativeScore} negative indicators).`;
  } else {
    sentiment = 'neutral';
    confidence = 0.6;
    reasoning = 'Mixed or neutral sentiment indicators.';
  }
  
  return {
    sentiment,
    confidence,
    reasoning,
    scores: { positive: positiveScore, negative: negativeScore, neutral: neutralScore }
  };
}

// Get token data from Scout API v6
async function getTokenDataFromScout(symbol) {
  try {
    console.log(`💰 Fetching data for token: ${symbol}`);
    
    // Find token in cache
    const token = tokenCache.get(symbol.toUpperCase());
    if (!token) {
      return {
        success: false,
        error: `Token ${symbol} not found in Scout token list`
      };
    }
    
    // Get price from Scout Price API v6
    const priceResponse = await fetch(`${Scout_CONFIG.PRICE_API}?ids=${token.address}`);
    if (!priceResponse.ok) {
      throw new Error(`Price API error: ${priceResponse.status}`);
    }
    
    const priceData = await priceResponse.json();
    const price = priceData.data?.[token.address]?.price || 0;
    
    console.log(`📊 Price for ${symbol}: $${price}`);
    
    return {
      success: true,
      data: {
        token,
        price: parseFloat(price),
        priceData: priceData.data?.[token.address]
      }
    };
    
  } catch (error) {
    console.error(`❌ Failed to fetch token data for ${symbol}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Perform OCR analysis
async function performOCRAnalysis(imageData) {
  try {
    console.log('👁️ Performing OCR analysis...');
    
    // For now, return mock data
    // In production, integrate with a real OCR service
    const mockTexts = [
      "SOL is breaking out! 🚀",
      "Scout swap volume increasing",
      "$BONK community is strong",
      "New DeFi protocol on Solana",
      "Check this altcoin gem"
    ];
    
    const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
    
    return {
      success: true,
      text: randomText,
      confidence: 0.75 + Math.random() * 0.2
    };
    
  } catch (error) {
    console.error('❌ OCR analysis failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Check Scout API health
async function checkScoutAPIHealth() {
  try {
    const healthResponse = await fetch(Scout_CONFIG.TOKENS_API, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    
    return {
      success: healthResponse.ok,
      status: healthResponse.status,
      message: healthResponse.ok ? 'Scout API is healthy' : 'Scout API is down'
    };
    
  } catch (error) {
    return {
      success: false,
      status: 0,
      message: 'Scout API health check failed'
    };
  }
}

// Get Scout quote for token swap
async function getScoutQuote(inputMint, outputMint, amount) {
  try {
    const url = new URL(Scout_CONFIG.QUOTE_API);
    url.searchParams.set('inputMint', inputMint);
    url.searchParams.set('outputMint', outputMint);
    url.searchParams.set('amount', amount);
    url.searchParams.set('slippageBps', '50'); // 0.5% slippage
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Quote API error: ${response.status}`);
    }
    
    const quoteData = await response.json();
    
    return {
      success: true,
      data: quoteData
    };
    
  } catch (error) {
    console.error('❌ Scout quote failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Store analysis in local storage
async function storeAnalysis(tokens, sentiment, originalText) {
  try {
    const result = await chrome.storage.local.get(['analysisHistory']);
    const history = result.analysisHistory || [];
    
    const analysis = {
      timestamp: Date.now(),
      tokens: tokens,
      sentiment: sentiment,
      textPreview: originalText.substring(0, 100),
      url: ''
    };
    
    history.push(analysis);
    
    // Keep only last 50 analyses
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    await chrome.storage.local.set({ analysisHistory: history });
    
  } catch (error) {
    console.error('❌ Failed to store analysis:', error);
  }
}

// Analyze selected text and show results
async function analyzeSelectedText(text, tab) {
  try {
    const analysis = await analyzeTextContent(text);
    
    if (analysis.success) {
      // Send results to content script
      chrome.tabs.sendMessage(tab.id, {
        action: 'showAnalysis',
        text: text,
        analysis: analysis.data
      });
    } else {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Analysis Failed',
        message: analysis.error
      });
    }
      } catch (error) {
    console.error('❌ Analysis error:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Scout Social Trader',
      message: 'Analysis failed. Please try again.'
    });
  }
}

// Handle text analysis
async function handleTextAnalysis(info, tab) {
  const selectedText = info.selectionText || '';
  
  if (!selectedText.trim()) {
    showNotification('No Text Selected', 'Please highlight some text containing token mentions.');
    return;
  }
  
  // Store analysis data
  await chrome.storage.local.set({
    currentAnalysis: {
      text: selectedText,
      url: tab.url,
      timestamp: Date.now(),
      type: 'text'
    }
  });
  
  // Send message to content script
  chrome.tabs.sendMessage(tab.id, {
    action: "showAnalysis",
    data: {
      text: selectedText,
      type: 'text'
    }
  }).catch(error => {
    console.log('Content script not ready, injecting...');
    injectContentScript(tab.id);
  });
}

// Handle OCR lens scanning
async function handleLensOCR(info, tab) {
  console.log('🔍 Starting OCR scan...');
  
  await chrome.storage.local.set({
    currentAnalysis: {
      type: 'ocr',
      url: tab.url,
      timestamp: Date.now()
    }
  });
  
  // Send message to activate lens mode
  chrome.tabs.sendMessage(tab.id, {
    action: "activateLensMode"
  }).catch(error => {
    console.log('Content script not ready, injecting...');
    injectContentScript(tab.id);
  });
}

// Inject content script if not present
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content.css']
    });
    
    console.log('📝 Content script injected successfully');
  } catch (error) {
    console.error('❌ Failed to inject content script:', error);
  }
}

// Page script communication helpers
async function handleWalletDetectionRequest(tab) {
  console.log('🔍 Handling wallet detection request for tab:', tab.id);
  
  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'checkWalletAvailability'
    });
    console.log('✅ Wallet detection request sent to content script');
  } catch (error) {
    console.error('❌ Failed to request wallet detection:', error);
  }
}

async function relayToConnectionPage(message) {
  console.log('📡 Relaying message to connection page:', message.action);
  
  try {
    const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL('connection.html') });
    
    if (tabs.length > 0) {
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, message);
      }
      console.log(`✅ Message relayed to ${tabs.length} connection page(s)`);
    }
  } catch (error) {
    console.error('❌ Failed to relay message to connection page:', error);
  }
}

async function relayToPopup(message) {
  console.log('📡 Relaying message to popup:', message.action);
  
  try {
    chrome.runtime.sendMessage(message);
  } catch (error) {
    console.warn('⚠️ Could not relay to popup (likely closed):', error.message);
  }
}