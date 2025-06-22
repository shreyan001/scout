// Scout Injected Script - Web3 Wallet Bridge
// Runs in the main world context to access window.ethereum and page variables

console.log('Scout injected script loaded');

// Scout wallet bridge state
let walletState = {
  connected: false,
  address: null,
  chainId: null,
  provider: null
};

// Initialize wallet bridge
function initWalletBridge() {
  if (typeof window.ethereum !== 'undefined') {
    console.log('MetaMask detected');
    walletState.provider = window.ethereum;
    
    // Listen for account changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);
    
    // Check if already connected
    checkExistingConnection();
  } else {
    console.log('MetaMask not detected');
    reportWalletStatus({
      available: false,
      error: 'MetaMask not installed'
    });
  }
}

// Check for existing wallet connection
async function checkExistingConnection() {
  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts'
    });
    
    if (accounts.length > 0) {
      walletState.connected = true;
      walletState.address = accounts[0];
      
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });
      walletState.chainId = chainId;
      
      reportWalletStatus({
        connected: true,
        address: walletState.address,
        chainId: walletState.chainId
      });
    }
  } catch (error) {
    console.error('Error checking wallet connection:', error);
  }
}

// Wallet connection handler
async function connectWallet() {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }
    
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    if (accounts.length > 0) {
      walletState.connected = true;
      walletState.address = accounts[0];
      
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });
      walletState.chainId = chainId;
      
      reportWalletStatus({
        connected: true,
        address: walletState.address,
        chainId: walletState.chainId
      });
      
      return {
        success: true,
        address: walletState.address,
        chainId: walletState.chainId
      };
    }
  } catch (error) {
    console.error('Wallet connection error:', error);
    reportWalletError({
      type: 'CONNECTION_ERROR',
      message: error.message
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Wallet disconnection handler
function disconnectWallet() {
  walletState.connected = false;
  walletState.address = null;
  walletState.chainId = null;
  
  reportWalletStatus({
    connected: false,
    address: null,
    chainId: null
  });
}

// Wallet event handlers
function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    disconnectWallet();
  } else {
    walletState.address = accounts[0];
    reportWalletStatus({
      connected: true,
      address: walletState.address,
      chainId: walletState.chainId
    });
  }
}

function handleChainChanged(chainId) {
  walletState.chainId = chainId;
  reportWalletStatus({
    connected: walletState.connected,
    address: walletState.address,
    chainId: chainId
  });
}

function handleDisconnect() {
  disconnectWallet();
}

// Communication with content script
function reportWalletStatus(status) {
  document.dispatchEvent(new CustomEvent('scoutWalletStatus', {
    detail: {
      ...status,
      timestamp: Date.now()
    }
  }));
}

function reportWalletError(error) {
  document.dispatchEvent(new CustomEvent('scoutWalletError', {
    detail: {
      ...error,
      timestamp: Date.now()
    }
  }));
}
  // Listen for events from content script
document.addEventListener('scoutWalletConnect', async (event) => {
  console.log('Wallet connect request:', event.detail);
  await connectWallet();
});

document.addEventListener('scoutWalletDisconnect', (event) => {
  console.log('Wallet disconnect request:', event.detail);
  disconnectWallet();
});

// Expose Scout API to page
window.scoutAPI = {
  version: '1.0.0',
  
  // Wallet functions
  connectWallet: connectWallet,
  disconnectWallet: disconnectWallet,
  getWalletState: () => ({ ...walletState }),
  
  // Token detection utilities
  detectTokensOnPage: function() {
    const text = document.body.innerText;
    const tokenPattern = /\b[A-Z]{2,10}\b/g;
    const matches = text.match(tokenPattern) || [];
    
    return [...new Set(matches)].filter(token => 
      token.length >= 2 && token.length <= 10
    );
  },
  
  // Address detection utilities
  detectAddressesOnPage: function() {
    const text = document.body.innerText;
    const ethPattern = /0x[a-fA-F0-9]{40}/g;
    const matches = text.match(ethPattern) || [];
    
    return [...new Set(matches)];
  },
  
  // Send data to Scout extension
  sendToScout: function(data) {
    document.dispatchEvent(new CustomEvent('scoutPageData', {
      detail: {
        ...data,
        timestamp: Date.now(),
        url: window.location.href
      }
    }));
  },
  
  // Highlight utility
  highlightText: function(text, className = 'scout-highlight') {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const textNodes = [];
    let node;
    
    while (node = walker.nextNode()) {
      if (node.textContent.toLowerCase().includes(text.toLowerCase())) {
        textNodes.push(node);
      }
    }
    
    textNodes.forEach(textNode => {
      const parent = textNode.parentNode;
      const regex = new RegExp(`(${text})`, 'gi');
      const highlighted = textNode.textContent.replace(regex, 
        `<span class="${className}">$1</span>`
      );
      
      const wrapper = document.createElement('span');
      wrapper.innerHTML = highlighted;
      parent.replaceChild(wrapper, textNode);
    });
  }
};

// Enhanced page monitoring
const scoutObserver = new MutationObserver((mutations) => {
  let hasTokenChanges = false;
  
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      // Check if new content might contain tokens or addresses
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
          const text = node.textContent || '';
          if (text.match(/\b[A-Z]{2,10}\b/) || text.match(/0x[a-fA-F0-9]{40}/)) {
            hasTokenChanges = true;
          }
        }
      });
    }
  });
  
  if (hasTokenChanges) {
    document.dispatchEvent(new CustomEvent('scoutContentChanged', {
      detail: {
        type: 'tokenContent',
        timestamp: Date.now()
      }
    }));
  }
});

// Start observing with enhanced settings
scoutObserver.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});

// Enhanced performance monitoring for Web3 sites
function reportScoutMetrics() {
  const performance = window.performance;
  const timing = performance.timing;
  
  const metrics = {
    loadTime: timing.loadEventEnd - timing.navigationStart,
    domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
    hasWeb3: typeof window.ethereum !== 'undefined',
    hasWeb3Provider: window.ethereum ? true : false,
    walletConnected: walletState.connected,
    tokensDetected: window.scoutAPI.detectTokensOnPage().length,
    addressesDetected: window.scoutAPI.detectAddressesOnPage().length,
    timestamp: Date.now()
  };
  
  document.dispatchEvent(new CustomEvent('scoutMetrics', {
    detail: metrics
  }));
}

// Initialize Scout bridge
initWalletBridge();

// Report metrics after page load
if (document.readyState === 'complete') {
  setTimeout(reportScoutMetrics, 1000);
} else {
  window.addEventListener('load', () => {
    setTimeout(reportScoutMetrics, 1000);
  });
}
