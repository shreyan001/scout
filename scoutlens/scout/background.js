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
    // Execute Scout token scanning
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        // Trigger Scout scanning functionality
        window.postMessage({ type: 'SCOUT_SCAN_REQUEST' }, '*');
      }
    });
  }
  
  if (info.menuItemId === 'scoutAnalyze') {
    const selectedText = info.selectionText;
    if (selectedText) {
      // Analyze the selected text for crypto addresses/tokens
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: (text) => {
          window.postMessage({ 
            type: 'SCOUT_ANALYZE_REQUEST', 
            data: { text: text }
          }, '*');
        },
        args: [selectedText]
      });
    }
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

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Scout: Message received in service worker:', message);
  
  switch (message.type) {
    case 'SCOUT_CONNECT_WALLET':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          connectWallet(tabs[0].id)
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        }
      });
      return true; // Keep message channel open for async response
      
    case 'SCOUT_DISCONNECT_WALLET':
      disconnectWallet()
        .then(result => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'SCOUT_GET_WALLET_STATE':
      sendResponse({ success: true, walletState: scoutWalletState });
      break;
      
    case 'SCOUT_REFRESH_BALANCE':
      if (scoutWalletState.connected && scoutWalletState.account) {
        getWalletBalance(scoutWalletState.account, scoutWalletState.chainId)
          .then(balance => {
            scoutWalletState.balance = balance;
            chrome.storage.local.set({ scoutWalletState });
            sendResponse({ success: true, balance });
          })
          .catch(error => sendResponse({ success: false, error: error.message }));
      } else {
        sendResponse({ success: false, error: 'Wallet not connected' });
      }
      return true;
      
    case 'SCOUT_TOKEN_SCAN':
      // Handle token scanning requests
      handleTokenScan(message.data, sender.tab.id)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'SCOUT_ADDRESS_ANALYSIS':
      // Handle address analysis requests
      handleAddressAnalysis(message.data, sender.tab.id)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

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
  try {
    const stored = await chrome.storage.local.get('scoutWalletState');
    if (stored.scoutWalletState) {
      scoutWalletState = stored.scoutWalletState;
      console.log('Scout: Loaded wallet state from storage');
    }
  } catch (error) {
    console.error('Scout: Error loading wallet state:', error);
  }
});

// Handle tab updates for wallet state refresh
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && scoutWalletState.connected) {
    // Optionally refresh wallet state when navigating to new pages
    console.log('Scout: Tab updated, wallet connected');
  }
});

// Handle alarms for periodic tasks
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('Scout: Alarm triggered:', alarm.name);
  
  if (alarm.name === 'refreshWalletData' && scoutWalletState.connected) {
    // Refresh wallet data periodically
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && scoutWalletState.account) {
        getWalletBalance(scoutWalletState.account, scoutWalletState.chainId)
          .catch(error => console.error('Scout: Auto-refresh error:', error));
      }
    });
  }
});

// Set up periodic wallet data refresh
chrome.alarms.create('refreshWalletData', { periodInMinutes: 5 });

// Error handling
self.addEventListener('error', (event) => {
  console.error('Scout service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Scout unhandled promise rejection:', event.reason);
});
