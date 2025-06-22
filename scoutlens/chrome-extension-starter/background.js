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
  if (info.menuItemId === 'extensionAction') {
    // Execute content script
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        console.log('Context menu action executed');
        // Add your custom logic here
      }
    });
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in service worker:', message);
  
  switch (message.type) {
    case 'GET_TAB_INFO':
      // Get current tab information
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          sendResponse({
            success: true,
            tabInfo: {
              url: tabs[0].url,
              title: tabs[0].title,
              id: tabs[0].id
            }
          });
        }
      });
      return true; // Keep message channel open for async response
      
    case 'EXECUTE_CONTENT_SCRIPT':
      // Execute script on current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: message.function
          }, (results) => {
            sendResponse({ success: true, results });
          });
        }
      });
      return true;
      
    case 'SAVE_DATA':
      // Save data to storage
      chrome.storage.sync.set(message.data, () => {
        sendResponse({ success: true });
      });
      return true;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
    // You can add logic here to react to page changes
  }
});

// Handle alarms (for periodic tasks)
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('Alarm triggered:', alarm.name);
  // Handle periodic tasks here
});

// Set up periodic alarm (example: every 5 minutes)
chrome.alarms.create('periodicTask', { periodInMinutes: 5 });

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
