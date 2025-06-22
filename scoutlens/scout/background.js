// Scout - Web3 AI Agent Background Script (Service Worker)
console.log('Scout extension started');

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
    id: 'scoutScan',
    title: '🔍 Scout: Scan for Tokens',
    contexts: ['page', 'selection', 'image']
  });

  chrome.contextMenus.create({
    id: 'scoutAnalyze',
    title: '📊 Scout: Analyze Address',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'scoutScan') {
    // Execute Scout scan on the current page
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        // Trigger Scout scan from page context
        window.postMessage({ 
          type: 'SCOUT_CONTEXT_SCAN',
          selectedText: window.getSelection().toString()
        }, '*');
      }
    });
  }
});

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
