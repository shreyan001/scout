// Scout Social Trader - Simple Popup Script v2.0
console.log('🚀 Scout Social Trader v2.0 - Popup loaded');

// Global state
let walletConnected = false;
let walletAddress = null;
let walletProvider = null;

document.addEventListener('DOMContentLoaded', function() {
    initializePopup();
    setupEventListeners();
    checkWalletConnection();
});

function initializePopup() {
    console.log('Initializing popup...');
    
    // Load saved wallet state from new storage keys
    chrome.storage.local.get([
        'isWalletConnected', 
        'walletName', 
        'walletIcon',
        'walletAddress', 
        'walletBalance', 
        'connectionTime'
    ], (result) => {
        if (result.isWalletConnected && result.walletName && result.walletAddress) {
            console.log('Found saved wallet connection:', {
                name: result.walletName,
                address: result.walletAddress,
                balance: result.walletBalance,
                connected: result.connectionTime
            });
            
            updateWalletDisplay(
                true, 
                result.walletName, 
                result.walletAddress, 
                result.walletIcon,
                result.walletBalance
            );
        } else {
            console.log('No saved wallet connection found');
            updateWalletDisplay(false);
        }
    });
    
    updateStatus('Ready');
    
    // Show aggressive detection message
    const statusMessage = document.createElement('div');
    statusMessage.className = 'aggressive-detection-notice';
    statusMessage.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 12px; border-radius: 8px; margin: 10px 0; 
                    font-size: 12px; text-align: center; font-weight: 500;">
            🔥 <strong>Aggressive Detection Enabled</strong><br>
            Will forcefully detect Phantom, Glow & other wallets
        </div>
    `;
    
    const welcomeSection = document.getElementById('welcomeSection');
    if (welcomeSection) {
        welcomeSection.appendChild(statusMessage);
    }
}

function setupEventListeners() {
    // Connect wallet button
    const connectBtn = document.getElementById('connect-wallet-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', handleConnectWallet);
    }
    
    // Disconnect wallet button
    const disconnectBtn = document.getElementById('disconnect-wallet-btn');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', handleDisconnectWallet);
    }
      // Refresh balance button
    const refreshBtn = document.getElementById('refresh-balance-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefreshBalance);
    }
    
    // Test OCR button
    const testOCRBtn = document.getElementById('testOCR');
    if (testOCRBtn) {
        testOCRBtn.addEventListener('click', handleTestOCR);
    }
    
    // Scan current page button
    const scanPageBtn = document.getElementById('scanCurrentPage');
    if (scanPageBtn) {
        scanPageBtn.addEventListener('click', handleScanCurrentPage);
    }
}

async function handleConnectWallet() {
    console.log('🔥 Opening AGGRESSIVE wallet connection page...');
    updateStatus('🚀 Starting aggressive wallet detection...');
    
    // Show loading state
    const connectBtn = document.getElementById('connect-wallet-btn');
    if (connectBtn) {
        connectBtn.disabled = true;
        connectBtn.innerHTML = '<span class="btn-icon">🔄</span>Detecting Wallets...';
    }
    
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'openWalletConnection'
        });
        
        if (response && response.success) {
            updateStatus('✅ Connection page opened - Aggressive detection active!');
            
            // Show helpful message
            setTimeout(() => {
                showNotification(
                    '🔥 Aggressive Detection Active!', 
                    'Forcefully scanning for Phantom, Glow & other wallets...', 
                    'info'
                );
            }, 500);
            
            window.close();
        } else {
            updateStatus('❌ Failed to open connection page');
        }
    } catch (error) {
        console.error('Error opening connection page:', error);
        updateStatus('❌ Connection error');
        showError('Unable to open wallet connection page.');
    } finally {
        // Reset button
        if (connectBtn) {
            connectBtn.disabled = false;
            connectBtn.innerHTML = '<span class="btn-icon">🔗</span>Connect Wallet';
        }
    }
}

async function handleDisconnectWallet() {
    console.log('Disconnecting wallet...');
    updateStatus('Disconnecting wallet...');
    
    try {
        // Clear wallet data from storage with new keys
        await chrome.storage.local.remove([
            'isWalletConnected',
            'walletName',
            'walletIcon',
            'walletAddress',
            'walletBalance',
            'connectionTime'
        ]);
        
        // Send disconnect message to background script
        const response = await chrome.runtime.sendMessage({
            action: 'disconnectWallet'
        });
        
        // Update UI regardless of response (local cleanup)
        updateWalletDisplay(false);
        updateStatus('Wallet disconnected');
        
        console.log('Wallet disconnected successfully');
        
    } catch (error) {
        console.error('Error disconnecting wallet:', error);
        updateStatus('Error disconnecting wallet');
        // Still update UI to show disconnected state
        updateWalletDisplay(false);
    }
}

async function handleRefreshBalance() {
    if (!walletAddress) {
        console.warn('No wallet address to refresh balance for');
        return;
    }
    
    console.log('Refreshing wallet balance...');
    updateStatus('Refreshing balance...');
    
    await fetchWalletBalance(walletAddress);
}

async function fetchWalletBalance(address) {
    try {
        console.log('Fetching balance for address:', address);
        
        // Use Solana public RPC to get balance
        const response = await fetch('https://api.mainnet-beta.solana.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getBalance',
                params: [address]
            })
        });
        
        const data = await response.json();
        
        if (data.result) {
            // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
            const balanceSOL = data.result.value / 1e9;
            console.log('Balance fetched:', balanceSOL, 'SOL');
            
            updateBalanceDisplay(balanceSOL);
            updateStatus('Balance updated');
        } else {
            console.error('Failed to fetch balance:', data.error);
            updateStatus('Balance fetch failed');
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
        updateStatus('Balance fetch error');
    }
}

function updateWalletDisplay(connected, provider = null, address = null, icon = null, balance = null) {
    const walletStatus = document.getElementById('wallet-status');
    const walletConnected = document.getElementById('wallet-connected');
    const addressElement = document.getElementById('wallet-address');
    const providerElement = document.getElementById('wallet-provider');
    const balanceElement = document.getElementById('sol-balance');
    
    if (connected && provider && address) {
        // Show connected state
        if (walletStatus) walletStatus.style.display = 'none';
        if (walletConnected) walletConnected.style.display = 'block';
        
        // Update provider display with icon
        if (providerElement) {
            providerElement.textContent = `${icon || '🔗'} ${provider}`;
        }
        
        // Update address display
        if (addressElement) {
            const shortAddress = `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
            addressElement.textContent = shortAddress;
            addressElement.title = address;
        }
        
        // Update balance display
        if (balanceElement && balance !== null && balance !== undefined) {
            balanceElement.textContent = parseFloat(balance).toFixed(4);
        }
        
        // Store global state
        walletConnected = true;
        walletAddress = address;
        walletProvider = provider;
        
        console.log('Wallet display updated to connected state:', {
            provider,
            address: address.substring(0, 10) + '...',
            balance
        });
    } else {
        // Show disconnected state
        if (walletStatus) walletStatus.style.display = 'block';
        if (walletConnected) walletConnected.style.display = 'none';
        
        // Clear displays
        if (providerElement) providerElement.textContent = '';
        if (addressElement) addressElement.textContent = '';
        if (balanceElement) balanceElement.textContent = '0.0000';
        
        // Clear global state
        walletConnected = false;
        walletAddress = null;
        walletProvider = null;
        
        console.log('Wallet display updated to disconnected state');
    }
}

function updateBalanceDisplay(balance) {
    const balanceElement = document.getElementById('sol-balance');
    if (balanceElement) {
        balanceElement.textContent = balance.toFixed(4);
    }
}

function updateStatus(status) {
    const statusElement = document.getElementById('extension-status');
    if (statusElement) {
        statusElement.textContent = status;
        
        // Update last activity
        const lastActivityElement = document.getElementById('last-activity');
        if (lastActivityElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            lastActivityElement.textContent = timeString;
        }
    }
}

function showError(message) {
    console.error('Error:', message);
    // You could implement a toast notification system here
    // For now, we'll just log and update status
    updateStatus(`Error: ${message}`);
}

function showNotification(title, message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${title} - ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#2ed573' : '#5352ed'};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 300px;
        font-size: 14px;
        font-weight: 500;
        border-left: 4px solid rgba(255,255,255,0.3);
    `;
    
    notification.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
        <div style="font-size: 13px; opacity: 0.9;">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

async function checkWalletConnection() {
    console.log('Checking existing wallet connection...');
    
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'getWalletData'
        });
        
        if (response && response.success && response.data) {
            const walletData = response.data;
            console.log('Found existing wallet connection:', walletData.walletName);
            updateWalletDisplay(true, walletData.walletName, walletData.publicKey);
            updateBalanceDisplay(parseFloat(walletData.balance));
        } else {
            console.log('No existing wallet connection found');
        }
    } catch (error) {
        console.error('Error checking wallet connection:', error);
    }
}

async function handleTestOCR() {
    console.log('Testing OCR functionality...');
    updateStatus('Testing OCR...');
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'testOCR'
        });
        
        if (response && response.success) {
            updateStatus('OCR test completed');
        } else {
            updateStatus('OCR test failed');
        }
    } catch (error) {
        console.error('Error testing OCR:', error);
        updateStatus('OCR test error');
    }
}

async function handleScanCurrentPage() {
    console.log('Scanning current page...');
    updateStatus('Scanning page...');
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'scanPage'
        });
        
        if (response && response.success) {
            updateStatus(`Scan complete: ${response.imagesFound} images analyzed`);
        } else {
            updateStatus('Page scan failed');
        }
    } catch (error) {
        console.error('Error scanning page:', error);
        updateStatus('Page scan error');
    }
}

// Export functions for debugging (optional)
if (typeof window !== 'undefined') {
    window.ScoutPopup = {
        connectWallet: handleConnectWallet,
        disconnectWallet: handleDisconnectWallet,
        refreshBalance: handleRefreshBalance,
        getWalletInfo: () => ({ connected: walletConnected, address: walletAddress, provider: walletProvider })
    };
}
