// Scout - Web3 AI Agent Background Script (Service Worker)
console.log('Scout extension started');

// Scout Backend API Configuration
const SCOUT_BACKEND_CONFIG = {
  baseUrl: 'http://localhost:3001',
  apiVersion: 'v1',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
};

// ScoutBackendAPI Class for backend communication
class ScoutBackendAPI {
  constructor(config = SCOUT_BACKEND_CONFIG) {
    this.baseUrl = config.baseUrl;
    this.apiVersion = config.apiVersion;
    this.timeout = config.timeout;
    this.retryAttempts = config.retryAttempts;
    this.retryDelay = config.retryDelay;
    this.isHealthy = false;
    this.lastHealthCheck = null;
  }

  // Health check
  async checkHealth() {
    try {
      const response = await this.makeRequest('/health', {
        method: 'GET',
        timeout: 5000
      });
      
      this.isHealthy = response.status === 'ok';
      this.lastHealthCheck = Date.now();
      
      console.log('Scout Backend Health Check:', this.isHealthy ? 'HEALTHY' : 'UNHEALTHY');
      return this.isHealthy;
      
    } catch (error) {
      console.error('Scout Backend Health Check Failed:', error);
      this.isHealthy = false;
      this.lastHealthCheck = Date.now();
      return false;
    }
  }

  // Analyze Web3 content using LangGraph
  async analyzeWeb3(data) {
    try {
      const response = await this.makeRequest('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({
          type: 'web3_analysis',
          data: {
            content: data.content,
            url: data.url,
            timestamp: Date.now(),
            userQuery: data.userQuery || null,
            context: data.context || {}
          }
        })
      });      return {
        success: true,
        analysis: response.analysis,
        entities: response.entities || [],
        risks: response.risks || [],
        opportunities: response.opportunities || [],
        confidence: response.confidence || 0.8,
        processingTime: response.processingTime
      };

    } catch (error) {
      console.error('Scout Backend Analysis Error:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  // Analyze address/token
  async analyzeAddress(address, context = {}) {
    try {
      const response = await this.makeRequest('/api/address', {
        method: 'POST',
        body: JSON.stringify({
          address: address,
          context: context,
          timestamp: Date.now()
        })
      });

      return {
        success: true,
        address: response.address,
        type: response.type, // 'wallet', 'contract', 'token', 'unknown'
        analysis: response.analysis,
        riskScore: response.riskScore || 0,
        verification: response.verification || {},
        metadata: response.metadata || {}
      };

    } catch (error) {
      console.error('Scout Backend Address Analysis Error:', error);
      throw new Error(`Address analysis failed: ${error.message}`);
    }
  }

  // Process OCR results
  async processOCR(ocrResults, context = {}) {
    try {
      const response = await this.makeRequest('/api/ocr', {
        method: 'POST',
        body: JSON.stringify({
          ocrResults: ocrResults,
          context: context,
          timestamp: Date.now()
        })
      });

      return {
        success: true,
        processedText: response.processedText,
        entities: response.entities || [],
        insights: response.insights || [],
        actions: response.suggestedActions || []
      };

    } catch (error) {
      console.error('Scout Backend OCR Processing Error:', error);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  // Make HTTP request with retry logic and error handling
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Scout-Extension/1.0.0'
      },
      timeout: this.timeout
    };

    const requestOptions = { ...defaultOptions, ...options };

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`Scout Backend Request (Attempt ${attempt}/${this.retryAttempts}):`, url);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Scout Backend Response:', data);
        return data;

      } catch (error) {
        console.error(`Scout Backend Request Failed (Attempt ${attempt}):`, error);

        if (attempt === this.retryAttempts) {
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  // Get backend status
  getStatus() {
    return {
      isHealthy: this.isHealthy,
      lastHealthCheck: this.lastHealthCheck,
      baseUrl: this.baseUrl,
      connected: this.isHealthy && (Date.now() - (this.lastHealthCheck || 0)) < 60000
    };
  }
}

// Initialize Scout Backend API
const scoutBackend = new ScoutBackendAPI();

// Perform initial health check
scoutBackend.checkHealth().catch(error => {
  console.warn('Scout Backend initial health check failed:', error);
});

// Periodic health checks (every 2 minutes)
setInterval(() => {
  scoutBackend.checkHealth().catch(error => {
    console.warn('Scout Backend periodic health check failed:', error);
  });
}, 120000);

// Scout wallet connection state
let scoutWalletState = {
  connected: false,
  account: null,
  chainId: null,
  balance: null,
  provider: null,
  networkName: 'Unknown'
};

// Network mappings
const NETWORKS = {
  '0x1': 'Ethereum Mainnet',
  '0x89': 'Polygon',
  '0xa': 'Optimism',
  '0xa4b1': 'Arbitrum One',
  '0x38': 'BSC',
  '0xa86a': 'Avalanche',
  '0x2105': 'Base'
};

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Scout extension installed:', details);
  
  // Set default Scout settings
  chrome.storage.sync.set({
    scoutEnabled: true,
    walletConnected: false,
    userProfile: {
      type: 'trader', // trader, developer, researcher
      riskTolerance: 'medium',
      notifications: true
    },
    scanSettings: {
      autoScan: true,
      ocrEnabled: true,
      alertsEnabled: true
    }
  });
  // Create Scout context menus
  chrome.contextMenus.create({
    id: 'scoutOCRScan',
    title: '🔍 Scout: OCR Scan Page',
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'scoutScanSelection',
    title: '🔍 Scout: Scan Selection',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'scoutScanImage',
    title: '📷 Scout: OCR Scan Image',  
    contexts: ['image']
  });

  chrome.contextMenus.create({
    id: 'scoutAnalyze',
    title: '📊 Scout: Analyze Address',
    contexts: ['selection']
  });
});

// Handle keyboard commands
chrome.commands.onCommand.addListener((command, tab) => {
  console.log('Scout: Command received:', command);
  
  if (command === 'trigger_ocr_scan') {
    triggerOCRScan(tab.id);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Scout: Context menu clicked:', info.menuItemId);
  
  switch (info.menuItemId) {
    case 'scoutOCRScan':
      triggerOCRScan(tab.id);
      break;
      
    case 'scoutScanSelection':
      triggerOCRScan(tab.id, { selectedText: info.selectionText });
      break;
      
    case 'scoutScanImage':
      triggerOCRScan(tab.id, { imageUrl: info.srcUrl });
      break;
      
    case 'scoutAnalyze':
      triggerAddressAnalysis(tab.id, info.selectionText);
      break;
  }
});

// Trigger OCR scan from background
async function triggerOCRScan(tabId, options = {}) {
  try {
    console.log('Scout: Triggering OCR scan for tab:', tabId);
    
    // Send message to content script to perform OCR scan
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'TRIGGER_OCR_SCAN',
      options: options
    });
    
    if (response && response.success) {
      console.log('Scout: OCR scan triggered successfully');
      
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon16.svg',
        title: 'Scout OCR Scan',
        message: 'OCR scan started. Check the popup for results.'
      });
    } else {
      throw new Error(response?.error || 'Failed to trigger OCR scan');
    }
    
  } catch (error) {
    console.error('Scout: Error triggering OCR scan:', error);
    
    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon16.svg',
      title: 'Scout OCR Scan Failed',
      message: 'Failed to start OCR scan: ' + error.message
    });
  }
}

// Trigger address analysis
async function triggerAddressAnalysis(tabId, selectedText) {
  try {
    console.log('Scout: Triggering address analysis for:', selectedText);
      // Send message to content script to analyze address
    await chrome.tabs.sendMessage(tabId, {
      type: 'ANALYZE_ADDRESS',
      address: selectedText.trim()
    });
    
  } catch (error) {
    console.error('Scout: Error triggering address analysis:', error);
  }
}

// Web3 Wallet Connection Functions
async function connectWallet(tabId) {
  try {
    console.log('Scout: Attempting wallet connection...');
    
    // Execute wallet connection script in the active tab
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: async () => {
        // Check if wallet is available
        if (typeof window.ethereum === 'undefined') {
          throw new Error('No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.');
        }
        
        try {
          // Request account access
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
          });
          
          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found. Please unlock your wallet.');
          }
          
          // Get chain ID
          const chainId = await window.ethereum.request({
            method: 'eth_chainId'
          });
          
          // Get balance
          const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          });
          
          return {
            success: true,
            account: accounts[0],
            chainId: chainId,
            balance: balance,
            provider: window.ethereum.isMetaMask ? 'MetaMask' : 'Web3 Wallet'
          };
          
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    });
    
    if (results && results[0] && results[0].result) {
      const result = results[0].result;
      
      if (result.success) {
        // Update Scout wallet state
        scoutWalletState = {
          connected: true,
          account: result.account,
          chainId: result.chainId,
          balance: result.balance,
          provider: result.provider,
          networkName: NETWORKS[result.chainId] || 'Unknown Network'
        };
        
        // Store wallet state
        await chrome.storage.local.set({ 
          scoutWalletState: scoutWalletState,
          walletConnected: true 
        });
        
        // Show success notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Scout - Wallet Connected',
          message: `Connected to ${scoutWalletState.provider} on ${scoutWalletState.networkName}`
        });
        
        console.log('Scout: Wallet connected successfully', scoutWalletState);
        return scoutWalletState;
        
      } else {
        throw new Error(result.error);
      }
    } else {
      throw new Error('Failed to execute wallet connection script');
    }
    
  } catch (error) {
    console.error('Scout: Wallet connection error:', error);
    
    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Scout - Connection Failed',
      message: error.message
    });
    
    throw error;
  }
}

async function disconnectWallet() {
  try {
    // Reset wallet state
    scoutWalletState = {
      connected: false,
      account: null,
      chainId: null,
      balance: null,
      provider: null,
      networkName: 'Unknown'
    };
    
    // Clear stored state
    await chrome.storage.local.remove(['scoutWalletState']);
    await chrome.storage.sync.set({ walletConnected: false });
    
    console.log('Scout: Wallet disconnected');
    return true;
    
  } catch (error) {
    console.error('Scout: Disconnect error:', error);
    throw error;
  }
}

async function getWalletBalance(address, chainId) {
  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: async (addr, chain) => {
        if (window.ethereum) {
          try {
            const balance = await window.ethereum.request({
              method: 'eth_getBalance',
              params: [addr, 'latest']
            });
            return { success: true, balance: balance };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
        return { success: false, error: 'No wallet found' };
      },
      args: [address, chainId]
    });
    
    if (results && results[0] && results[0].result.success) {
      return results[0].result.balance;
    }
    throw new Error('Failed to get balance');
    
  } catch (error) {
    console.error('Scout: Error getting balance:', error);
    throw error;
  }
}

// Open wallet connection popup window
async function openWalletPopup(tabId) {
  try {
    console.log('Scout: Opening wallet connection popup');
    
    // Get the current tab to position the popup appropriately
    let currentTab;
    if (tabId) {
      currentTab = await chrome.tabs.get(tabId);
    } else {
      [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    }
    
    if (!currentTab) {
      throw new Error('No active tab found');
    }
    
    // Get the wallet-connect.html URL from the extension
    const walletConnectUrl = chrome.runtime.getURL('wallet-connect.html');
    
    // Create popup window with appropriate size and position
    const popup = await chrome.windows.create({
      url: walletConnectUrl,
      type: 'popup',
      width: 450,
      height: 600,
      left: Math.round((screen.width - 450) / 2),
      top: Math.round((screen.height - 600) / 2),
      focused: true
    });
    
    console.log('Scout: Wallet popup created:', popup.id);
    
    // Store popup window ID for later reference
    await chrome.storage.local.set({
      walletPopupWindowId: popup.id
    });
    
    return {
      windowId: popup.id,
      url: walletConnectUrl
    };
    
  } catch (error) {
    console.error('Scout: Error opening wallet popup:', error);
    throw error;
  }
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Scout message received:', message);
  
  switch (message.type) {
    case 'OPEN_WALLET_POPUP':
      openWalletPopup(sender.tab?.id)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'GET_WALLET_STATE':
      sendResponse(scoutWalletState);
      break;
      
    case 'CONNECT_WALLET':
      connectWallet(sender.tab?.id)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
      
    case 'DISCONNECT_WALLET':
      disconnectWallet()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'TOKEN_LOOKUP':
      handleTokenLookup(message.walletAddress)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'SCAN_RESULTS':
      handleScanResults(message.data, sender.tab?.id)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'EXECUTE_WALLET_REQUEST':
      executeWalletRequest(message.method, message.params, sender.tab?.id)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    // New content script message handlers
    case 'WALLET_STATUS_UPDATE':
      handleWalletStatusUpdate(message.data, sender.tab?.id);
      sendResponse({ success: true });
      break;
      
    case 'WALLET_ERROR':
      handleWalletError(message.data, sender.tab?.id);
      sendResponse({ success: true });
      break;
      
    case 'SCOUT_CONTENT_LOADED':
      handleContentLoaded(message.data, sender.tab?.id);
      sendResponse({ success: true });
      break;
      
    case 'CONTENT_CHANGED':
      handleContentChanged(message.data, sender.tab?.id);
      sendResponse({ success: true });
      break;
      
    case 'PAGE_METRICS':
      handlePageMetrics(message.data, sender.tab?.id);
      sendResponse({ success: true });
      break;
      
    case 'PAGE_DATA':
      handlePageData(message.data, sender.tab?.id);
      sendResponse({ success: true });
      break;
    case 'SCROLL_UPDATE':
      handleScrollUpdate(message.data, sender.tab?.id);
      sendResponse({ success: true });
      break;
      
    case 'OCR_ANALYSIS':
      handleOCRAnalysis(message.data, sender.tab?.id)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'OCR_SCAN_COMPLETE':
      handleOCRScanComplete(message.data, sender.tab?.id);
      sendResponse({ success: true });
      break;
      
    // Wallet popup messages (from in-page popup)
    case 'WALLET_CONNECTED':
      handleWalletConnectedFromInPage(message.data, sender.tab?.id);
      sendResponse({ success: true });
      break;
      
    case 'WALLET_ERROR':
      handleWalletErrorFromInPage(message.data, sender.tab?.id);
      sendResponse({ success: true });
      break;
        case 'WALLET_POPUP_CLOSED':
      handleWalletPopupClosedFromInPage(message.data, sender.tab?.id);
      sendResponse({ success: true });
      break;
        case 'OCR_SCAN_COMPLETE':
      handleOCRScanComplete(message.data, sender.tab?.id);
      sendResponse({ success: true });
      break;
        case 'ADDRESS_ANALYSIS_COMPLETE':
      handleAddressAnalysisComplete(message.data, sender.tab?.id);
      sendResponse({ success: true });
      break;
      
    // Backend API Integration Message Handlers
    case 'CHECK_BACKEND_HEALTH':
      scoutBackend.checkHealth()
        .then(isHealthy => sendResponse({ success: true, isHealthy, status: scoutBackend.getStatus() }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'ANALYZE_WEB3':
      handleAnalyzeWeb3(message.data, sender.tab?.id)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'ANALYZE_ADDRESS_BACKEND':
      handleAnalyzeAddressBackend(message.address, message.context, sender.tab?.id)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'PROCESS_OCR_BACKEND':
      handleProcessOCRBackend(message.ocrResults, message.context, sender.tab?.id)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'GET_BACKEND_STATUS':
      sendResponse({ success: true, status: scoutBackend.getStatus() });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// New content script message handlers
async function handleWalletStatusUpdate(data, tabId) {
  console.log('Scout: Wallet status update:', data);
  
  // Update wallet state based on injected script feedback
  if (data.connected && data.address) {
    scoutWalletState.connected = true;
    scoutWalletState.account = data.address;
    scoutWalletState.chainId = data.chainId;
    scoutWalletState.networkName = NETWORKS[data.chainId] || 'Unknown Network';
    
    // Store updated wallet state
    await chrome.storage.local.set({ 
      scoutWalletState: scoutWalletState,
      walletConnected: true 
    });
    
    // Trigger portfolio update
    setTimeout(() => handlePortfolioUpdate(), 1000);
    
  } else if (!data.connected) {
    // Wallet disconnected
    await disconnectWallet();
  }
}

function handleWalletError(data, tabId) {
  console.error('Scout: Wallet error from content script:', data);
  
  // Show error notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Scout - Wallet Error',
    message: data.message || 'Wallet connection error'
  });
}

function handleContentLoaded(data, tabId) {
  console.log('Scout: Content script loaded on tab:', tabId, data);
  
  // Store page info
  chrome.storage.local.set({
    [`pageInfo_${tabId}`]: {
      ...data.pageInfo,
      timestamp: data.timestamp
    }
  });
  
  // Check if this is a Web3 site
  if (data.pageInfo.hasMetaMask) {
    console.log('Scout: Web3 site detected');
    
    // Auto-scan if enabled
    chrome.storage.sync.get(['scanSettings'], (result) => {
      if (result.scanSettings?.autoScan) {
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            type: 'SCAN_PAGE',
            data: { scanType: 'tokens', includeImages: true }
          });
        }, 2000);
      }
    });
  }
}

function handleContentChanged(data, tabId) {
  console.log('Scout: Content changed on tab:', tabId, data);
  
  // If token content changed, trigger a scan
  if (data.type === 'tokenContent') {
    chrome.storage.sync.get(['scanSettings'], (result) => {
      if (result.scanSettings?.autoScan) {
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            type: 'SCAN_PAGE',
            data: { scanType: 'tokens' }
          });
        }, 1000);
      }
    });
  }
}

function handlePageMetrics(data, tabId) {
  console.log('Scout: Page metrics:', data);
  
  // Store metrics for analytics
  chrome.storage.local.set({
    [`metrics_${tabId}_${Date.now()}`]: data
  });
  
  // Show notification for Web3 sites with tokens
  if (data.hasWeb3 && data.tokensDetected > 0) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Scout - Tokens Detected',
      message: `Found ${data.tokensDetected} tokens and ${data.addressesDetected} addresses`
    });
  }
}

function handlePageData(data, tabId) {
  console.log('Scout: Page data received:', data);
  
  // Process any custom data sent from pages
  // This could be used for dApp integrations
}

function handleScrollUpdate(data, tabId) {
  // Track scroll position for lazy loading OCR
  const scrollPercentage = (data.scrollY / (data.documentHeight - data.viewportHeight)) * 100;
  
  // Trigger OCR scan on new content areas
  if (scrollPercentage > 0 && scrollPercentage % 25 < 5) { // Every 25% scroll
    chrome.storage.sync.get(['scanSettings'], (result) => {
      if (result.scanSettings?.ocrEnabled) {
        chrome.tabs.sendMessage(tabId, {
          type: 'SCAN_OCR',
          data: { region: 'viewport' }
        });
      }
    });
  }
}

// Token scanning functionality
async function handleTokenScan(data, tabId) {
  try {
    console.log('Scout: Processing token scan request:', data);
    
    // This would integrate with OCR and AI analysis
    // For now, return mock data
    return {
      tokens: [
        {
          symbol: 'ETH',
          address: '0x0000000000000000000000000000000000000000',
          price: '$3,200',
          change24h: '+2.5%'
        }
      ],
      confidence: 0.85,
      source: 'OCR + AI Analysis'
    };
    
  } catch (error) {
    console.error('Scout: Token scan error:', error);
    throw error;
  }
}

// Address analysis functionality
async function handleAddressAnalysis(data, tabId) {
  try {
    console.log('Scout: Processing address analysis:', data);
    
    // This would integrate with Nodit MCP for real analysis
    // For now, return mock data
    return {
      address: data.address || data.text,
      type: 'EOA', // or 'Contract'
      balance: '1.234 ETH',
      transactions: 156,
      riskScore: 'Low',
      tags: ['Active Trader', 'DeFi User']
    };
    
  } catch (error) {
    console.error('Scout: Address analysis error:', error);
    throw error;
  }
}

// OCR analysis functionality
async function handleOCRAnalysis(data, tabId) {
  try {
    console.log('Scout: Processing OCR analysis request:', data);
    
    // Store OCR request for processing
    chrome.storage.local.set({
      [`ocrRequest_${tabId}_${Date.now()}`]: {
        ...data,
        status: 'processing',
        timestamp: Date.now()
      }
    });
    
    // Enhanced OCR analysis could integrate with:
    // 1. Chrome Lens OCR for text extraction
    // 2. Token recognition and price fetching
    // 3. Address validation and risk assessment
    // 4. Wallet integration for enhanced features
    
    return {
      success: true,
      processingId: `ocr_${tabId}_${Date.now()}`,
      message: 'OCR analysis started'
    };
    
  } catch (error) {
    console.error('Scout: OCR analysis error:', error);
    throw error;
  }
}

// Load wallet state on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('Scout extension started');
  await loadStoredWalletState();
});

// Load stored wallet state
async function loadStoredWalletState() {
  try {
    const stored = await chrome.storage.local.get('walletState');
    if (stored.walletState && stored.walletState.connected) {
      scoutWalletState = stored.walletState;
      console.log('Scout wallet state restored:', scoutWalletState);
    }
  } catch (error) {
    console.error('Error loading wallet state:', error);
  }
}

// Handle tab updates for auto-scanning
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Scout: Tab updated:', tab.url);
    
    try {
      // Check if auto-scan is enabled
      const settings = await chrome.storage.sync.get('scanSettings');
      if (settings.scanSettings?.autoScan && scoutWalletState.connected) {
        // Auto-scan for Web3 content after a delay
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, { 
            type: 'SCOUT_AUTO_SCAN',
            url: tab.url 
          }).catch(() => {
            // Ignore errors if content script not ready
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Error in tab update handler:', error);
    }
  }
});

// Handle alarms for periodic tasks
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('Scout alarm triggered:', alarm.name);
  
  switch (alarm.name) {
    case 'priceCheck':
      handlePriceCheck();
      break;
    case 'portfolioUpdate':
      handlePortfolioUpdate();
      break;
    case 'riskAssessment':
      handleRiskAssessment();
      break;
  }
});

// Set up periodic alarms
chrome.alarms.create('portfolioUpdate', { periodInMinutes: 15 });
chrome.alarms.create('priceCheck', { periodInMinutes: 5 });
chrome.alarms.create('riskAssessment', { periodInMinutes: 30 });

// Periodic task handlers
async function handlePriceCheck() {
  if (!scoutWalletState.connected) return;
  
  try {
    console.log('Scout: Performing periodic price check');
    // TODO: Implement price checking with Nodit MCP
  } catch (error) {
    console.error('Price check error:', error);
  }
}

async function handlePortfolioUpdate() {
  if (!scoutWalletState.connected) return;
  
  try {
    console.log('Scout: Updating portfolio data');
    // TODO: Implement portfolio update with Nodit MCP
  } catch (error) {
    console.error('Portfolio update error:', error);
  }
}

async function handleRiskAssessment() {
  if (!scoutWalletState.connected) return;
  
  try {
    console.log('Scout: Performing risk assessment');
    // TODO: Implement risk assessment
  } catch (error) {
    console.error('Risk assessment error:', error);
  }
}

// Network change detection
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId === 0) { // Main frame only
    try {
      // Check if wallet network changed
      if (scoutWalletState.connected) {
        setTimeout(async () => {
          try {
            const currentChainId = await executeWalletRequest('eth_chainId', [], details.tabId);
            if (currentChainId !== scoutWalletState.chainId) {
              scoutWalletState.chainId = currentChainId;
              scoutWalletState.networkName = NETWORKS[currentChainId] || 'Unknown Network';
              await chrome.storage.local.set({ walletState: scoutWalletState });
              
              // Notify about network change
              chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Scout: Network Changed',
                message: `Switched to ${scoutWalletState.networkName}`
              });
            }
          } catch (error) {
            // Ignore network check errors
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error in navigation handler:', error);
    }
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Scout service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Scout unhandled promise rejection:', event.reason);
});

// Initialize extension on startup
loadStoredWalletState();

// In-page wallet popup message handlers
async function handleWalletConnectedFromInPage(data, tabId) {
  console.log('Scout: Wallet connected from in-page popup:', data);
  
  // Update wallet state
  scoutWalletState = {
    connected: true,
    account: data.account,
    chainId: data.chainId,
    balance: null, // Will be fetched later
    provider: data.provider || 'MetaMask',
    networkName: NETWORKS[data.chainId] || 'Unknown Network'
  };
  
  // Store wallet state
  await chrome.storage.local.set({ 
    scoutWalletState: scoutWalletState,
    walletConnected: true 
  });
  
  // Show success notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon16.svg',
    title: 'Scout - Wallet Connected',
    message: `Connected to ${scoutWalletState.networkName}`
  });
  
  console.log('Scout: In-page wallet connection completed successfully');
}

function handleWalletErrorFromInPage(data, tabId) {
  console.error('Scout: Wallet error from in-page popup:', data);
  
  // Show error notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon16.svg',
    title: 'Scout - Wallet Error',
    message: data.error || 'Wallet connection failed'
  });
}

function handleWalletPopupClosedFromInPage(data, tabId) {
  console.log('Scout: In-page wallet popup closed:', data);
  
  if (data.userClosed) {
    console.log('Wallet popup closed by user');
  }
}

function handleWalletErrorFromPopup(data) {
  console.error('Scout: Wallet error from popup:', data);
    // Show error notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon16.svg',
    title: 'Scout - Wallet Error',
    message: data.error || 'Wallet connection failed'
  });
}

async function handleWalletPopupClosed() {
  console.log('Scout: Wallet popup closed');
  
  // Clean up stored popup window ID
  await chrome.storage.local.remove(['walletPopupWindowId']);
}

// Handle OCR scan completion from content script
function handleOCRScanComplete(data, tabId) {
  console.log('Scout: OCR scan completed on tab:', tabId, data);
  
  // Store OCR results for popup access
  chrome.storage.local.set({
    [`ocrResults_${tabId}`]: {
      ...data,
      timestamp: Date.now(),
      tabId: tabId
    }
  });
  
  // Show notification based on trigger type  
  const title = data.trigger === 'keyboard' ? 
    'Scout OCR Scan (Keyboard)' : 
    'Scout OCR Scan (Context Menu)';
    
  const message = data.results?.tokens?.length > 0 ?
    `Found ${data.results.tokens.length} tokens and ${data.results.addresses?.length || 0} addresses` :
    'OCR scan completed. Check popup for details.';
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon16.svg',
    title: title,
    message: message
  });
  
  // If popup is open, send results directly
  chrome.runtime.sendMessage({
    type: 'NEW_OCR_RESULTS',
    data: data
  }).catch(() => {
    // Popup not open, results stored for later access
    console.log('Scout: OCR results stored for popup access');
  });
}

// Handle address analysis completion from content script
function handleAddressAnalysisComplete(data, tabId) {
  console.log('Scout: Address analysis completed on tab:', tabId, data);
  
  // Store analysis results for popup access
  chrome.storage.local.set({
    [`addressAnalysis_${tabId}`]: {
      ...data,
      timestamp: Date.now(),
      tabId: tabId
    }
  });
  
  // Show notification
  const message = `Address: ${data.address.substring(0, 8)}...${data.address.substring(-4)}
Risk: ${data.analysis.risk} • Type: ${data.analysis.type}`;
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon16.svg',
    title: 'Scout Address Analysis Complete',
    message: message
  });
  
  // If popup is open, send results directly
  chrome.runtime.sendMessage({
    type: 'NEW_ADDRESS_ANALYSIS',
    data: data
  }).catch(() => {
    // Popup not open, results stored for later access
    console.log('Scout: Address analysis results stored for popup access');
  });
}

// Backend API Message Handler Functions

// Handle Web3 analysis request
async function handleAnalyzeWeb3(data, tabId) {
  try {
    console.log('Scout: Handling Web3 analysis request:', data);
    
    // Check backend health first
    const isHealthy = await scoutBackend.checkHealth();
    if (!isHealthy) {
      throw new Error('Scout backend is not available. Please ensure the backend server is running.');
    }
    
    // Perform analysis using backend
    const analysisResult = await scoutBackend.analyzeWeb3(data);
    
    // Store results for popup access
    await chrome.storage.local.set({
      [`analysis_${tabId}_${Date.now()}`]: {
        type: 'web3_analysis',
        result: analysisResult,
        timestamp: Date.now(),
        tabId: tabId,
        url: data.url
      }
    });
    
    // Send results to content script for in-page display
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: 'WEB3_ANALYSIS_RESULT',
        result: analysisResult,
        source: 'backend'
      }).catch(error => {
        console.log('Scout: Could not send analysis to content script:', error.message);
      });
    }
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon16.svg',
      title: 'Scout Web3 Analysis Complete',
      message: `Analysis complete. Found ${analysisResult.entities?.length || 0} entities with ${Math.round(analysisResult.confidence * 100)}% confidence.`
    });
    
    return analysisResult;
    
  } catch (error) {
    console.error('Scout: Web3 analysis handler error:', error);
    
    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon16.svg',
      title: 'Scout Analysis Failed',
      message: `Analysis failed: ${error.message}`
    });
    
    throw error;
  }
}

// Handle address analysis with backend
async function handleAnalyzeAddressBackend(address, context = {}, tabId) {
  try {
    console.log('Scout: Handling backend address analysis:', address);
    
    // Check backend health first
    const isHealthy = await scoutBackend.checkHealth();
    if (!isHealthy) {
      throw new Error('Scout backend is not available. Please ensure the backend server is running.');
    }
    
    // Perform address analysis using backend
    const analysisResult = await scoutBackend.analyzeAddress(address, context);
    
    // Store results for popup access
    await chrome.storage.local.set({
      [`address_analysis_${tabId}_${Date.now()}`]: {
        type: 'address_analysis',
        address: address,
        result: analysisResult,
        timestamp: Date.now(),
        tabId: tabId
      }
    });
    
    // Send results to content script for in-page display
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: 'ADDRESS_ANALYSIS_RESULT',
        address: address,
        result: analysisResult,
        source: 'backend'
      }).catch(error => {
        console.log('Scout: Could not send address analysis to content script:', error.message);
      });
    }
    
    // Show notification with risk assessment
    const riskLevel = analysisResult.riskScore > 0.7 ? 'HIGH' : 
                     analysisResult.riskScore > 0.4 ? 'MEDIUM' : 'LOW';
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon16.svg',
      title: `Scout Address Analysis - ${riskLevel} Risk`,
      message: `${analysisResult.type || 'Address'} analyzed. Risk Score: ${Math.round(analysisResult.riskScore * 100)}%`
    });
    
    return analysisResult;
    
  } catch (error) {
    console.error('Scout: Address analysis handler error:', error);
    
    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon16.svg',
      title: 'Scout Address Analysis Failed',
      message: `Analysis failed: ${error.message}`
    });
    
    throw error;
  }
}

// Handle OCR processing with backend
async function handleProcessOCRBackend(ocrResults, context = {}, tabId) {
  try {
    console.log('Scout: Handling backend OCR processing:', ocrResults);
    
    // Check backend health first
    const isHealthy = await scoutBackend.checkHealth();
    if (!isHealthy) {
      throw new Error('Scout backend is not available. Please ensure the backend server is running.');
    }
    
    // Process OCR results using backend
    const processedResult = await scoutBackend.processOCR(ocrResults, context);
    
    // Store results for popup access
    await chrome.storage.local.set({
      [`ocr_analysis_${tabId}_${Date.now()}`]: {
        type: 'ocr_analysis',
        original: ocrResults,
        result: processedResult,
        timestamp: Date.now(),
        tabId: tabId
      }
    });
    
    // Send results to content script for in-page display
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: 'OCR_ANALYSIS_RESULT',
        original: ocrResults,
        result: processedResult,
        source: 'backend'
      }).catch(error => {
        console.log('Scout: Could not send OCR analysis to content script:', error.message);
      });
    }
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon16.svg',
      title: 'Scout OCR Analysis Complete',
      message: `OCR processed. Found ${processedResult.entities?.length || 0} entities and ${processedResult.insights?.length || 0} insights.`
    });
    
    return processedResult;
    
  } catch (error) {
    console.error('Scout: OCR processing handler error:', error);
    
    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon16.svg',
      title: 'Scout OCR Processing Failed',
      message: `Processing failed: ${error.message}`
    });
    
    throw error;
  }
}
