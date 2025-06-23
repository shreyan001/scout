// Scout Extension - Page Script Connection Manager
console.log('🔗 Scout Page Script Connection Manager Loaded');

class ExtensionWalletManager {
    constructor() {
        this.isConnected = false;
        this.walletData = null;
        this.availableWallets = [];
        this.currentTab = null;
        this.initializeConnection();
    }

    initializeConnection() {
        console.log('🚀 Initializing page script wallet connection...');
        
        // Get current tab
        this.getCurrentTab();
        
        // Setup communication with background script
        this.setupBackgroundCommunication();
        
        // Request wallet detection
        this.requestWalletDetection();
        
        // Set timeout for fallback
        setTimeout(() => {
            this.checkLoadingStatus();
        }, 10000); // 10 seconds timeout
    }

    getCurrentTab() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                this.currentTab = tabs[0];
                console.log('📱 Current tab:', this.currentTab.url);
            }
        });
    }

    setupBackgroundCommunication() {
        console.log('📡 Setting up background script communication...');
        
        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('📨 Connection page received message:', message.type || message.action);
            
            if (message.action) {
                this.handleBackgroundMessage(message);
                sendResponse({ success: true });
            }
        });
    }

    requestWalletDetection() {
        console.log('🔍 Requesting wallet detection via background script...');
        
        this.showStatusMessage('🔍 Detecting wallets using page injection...', 'info');
        
        // Request wallet detection through background script
        chrome.runtime.sendMessage({
            action: 'requestWalletDetection'
        }, (response) => {
            console.log('📨 Wallet detection request response:', response);
        });
    }

    handleBackgroundMessage(message) {
        console.log('📨 Handling background message:', message.action);
        
        switch (message.action) {
            case 'walletsDetected':
                this.handleWalletsDetected(message.wallets);
                break;
                
            case 'walletConnected':
                this.handleWalletConnected(message.walletData);
                break;
                
            case 'walletDisconnected':
                this.handleWalletDisconnected();
                break;
                
            case 'walletConnectionFailed':
                this.handleWalletConnectionFailed(message.error);
                break;
                
            default:
                console.log('Unknown background message:', message.action);
        }
    }

    handleWalletsDetected(wallets) {
        console.log('✅ Wallets detected via page script:', wallets);
        this.availableWallets = wallets;
        
        if (wallets.length > 0) {
            this.showWalletSelection(wallets);
            this.showStatusMessage(
                `🎉 Found ${wallets.length} wallet(s): ${wallets.map(w => w.name).join(', ')}`, 
                'success'
            );
        } else {
            this.showNoWalletsFound();
        }
    }

    showWalletSelection(wallets) {
        const loadingContainer = document.getElementById('loadingContainer');
        const fallbackContent = document.getElementById('fallbackContent');
        
        if (loadingContainer) loadingContainer.style.display = 'none';
        if (fallbackContent) fallbackContent.style.display = 'none';
        
        // Create wallet selection UI
        const walletSelection = document.createElement('div');
        walletSelection.id = 'walletSelection';
        walletSelection.className = 'wallet-selection';
        walletSelection.innerHTML = `
            <div class="wallet-selection-header">
                <h2>🚀 Select Your Wallet</h2>
                <p>Choose a wallet to connect with Scout Social Trader</p>
            </div>
            <div class="wallet-list">
                ${wallets.map(wallet => `
                    <button class="wallet-button" data-provider="${wallet.provider}">
                        <div class="wallet-icon">${wallet.icon}</div>
                        <div class="wallet-info">
                            <div class="wallet-name">${wallet.name}</div>
                            <div class="wallet-status">${wallet.isConnected ? 'Connected' : 'Available'}</div>
                        </div>
                        <div class="wallet-arrow">→</div>
                    </button>
                `).join('')}
            </div>
            <div class="wallet-selection-footer">
                <p>✨ Using aggressive detection via page injection</p>
            </div>
        `;
        
        // Add to main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(walletSelection);
        }
        
        // Add event listeners
        walletSelection.addEventListener('click', (event) => {
            const button = event.target.closest('.wallet-button');
            if (button) {
                const provider = button.dataset.provider;
                this.connectToWallet(provider);
            }
        });
    }

    showNoWalletsFound() {
        const loadingContainer = document.getElementById('loadingContainer');
        const fallbackContent = document.getElementById('fallbackContent');
        
        if (loadingContainer) loadingContainer.style.display = 'none';
        if (fallbackContent) {
            fallbackContent.style.display = 'block';
            fallbackContent.innerHTML = `
                <h2>❌ No Wallets Found</h2>
                <p>The page injection method couldn't detect any Solana wallets.</p>
                <div class="wallet-install-suggestions">
                    <h3>📦 Install a Solana Wallet:</h3>
                    <div class="wallet-suggestions">
                        <a href="https://phantom.app" target="_blank" class="wallet-suggestion">
                            <span class="wallet-icon">👻</span>
                            <span class="wallet-name">Phantom</span>
                        </a>
                        <a href="https://glow.app" target="_blank" class="wallet-suggestion">
                            <span class="wallet-icon">🌟</span>
                            <span class="wallet-name">Glow</span>
                        </a>
                        <a href="https://solflare.com" target="_blank" class="wallet-suggestion">
                            <span class="wallet-icon">🔥</span>
                            <span class="wallet-name">Solflare</span>
                        </a>
                    </div>
                </div>
                <button class="refresh-btn" onclick="retryConnection()">🔄 Try Again</button>
            `;
        }
        
        this.showStatusMessage('❌ No Solana wallets detected. Please install Phantom, Glow, or Solflare.', 'error');
    }

    connectToWallet(provider) {
        console.log(`🔗 Requesting connection to ${provider} via page script...`);
        
        this.showStatusMessage(`🔗 Connecting to ${provider}...`, 'info');
        
        // Request wallet connection through background script
        chrome.runtime.sendMessage({
            action: 'connectWallet',
            provider: provider
        }, (response) => {
            console.log('📨 Wallet connection request response:', response);
        });
    }

    async handleWalletConnected(walletData) {
        console.log('🎉 Wallet connected via page script:', walletData);
        
        this.isConnected = true;
        this.walletData = walletData;

        // Store wallet data in extension storage
        try {
            const storageData = {
                isWalletConnected: true,
                walletName: walletData.walletName,
                walletIcon: walletData.walletIcon,
                walletAddress: walletData.publicKey,
                walletBalance: walletData.balance,
                connectionTime: walletData.connectionTime || new Date().toISOString()
            };

            await chrome.storage.local.set(storageData);
            console.log('💾 Wallet data stored:', storageData);

            this.showStatusMessage(
                `🎉 ${walletData.walletName} connected! Balance: ${walletData.balance} SOL`, 
                'success'
            );
            
            // Auto-close after successful connection
            setTimeout(() => {
                this.closeConnectionPage();
            }, 3000);

        } catch (error) {
            console.error('❌ Failed to store wallet data:', error);
            this.showStatusMessage('Failed to save wallet connection data.', 'error');
        }
    }

    async handleWalletDisconnected() {
        console.log('🔌 Wallet disconnected via page script');
        
        this.isConnected = false;
        this.walletData = null;

        // Clear wallet data from extension storage
        try {
            await chrome.storage.local.remove([
                'isWalletConnected',
                'walletName',
                'walletIcon', 
                'walletAddress',
                'walletBalance',
                'connectionTime'
            ]);

            console.log('🗑️ Wallet data cleared from storage');
            this.showStatusMessage('Wallet disconnected successfully.', 'success');

        } catch (error) {
            console.error('❌ Failed to clear wallet data:', error);
            this.showStatusMessage('Failed to clear wallet data.', 'error');
        }
    }

    handleWalletConnectionFailed(error) {
        console.error('❌ Wallet connection failed via page script:', error);
        this.showStatusMessage(`❌ Connection failed: ${error.error}`, 'error');
    }

    checkLoadingStatus() {
        const loadingContainer = document.getElementById('loadingContainer');
        const walletSelection = document.getElementById('walletSelection');
        
        if (loadingContainer && loadingContainer.style.display !== 'none' && !walletSelection) {
            console.warn('⚠️ Loading timeout reached, showing fallback');
            this.showFallback();
        }
    }

    showFallback() {
        const loadingContainer = document.getElementById('loadingContainer');
        const fallbackContent = document.getElementById('fallbackContent');
        
        if (loadingContainer) loadingContainer.style.display = 'none';
        if (fallbackContent) {
            fallbackContent.style.display = 'block';
            fallbackContent.innerHTML = `
                <h2>⚠️ Connection Timeout</h2>
                <p>The page injection method is taking longer than expected.</p>
                <p>This could be due to:</p>
                <ul>
                    <li>No wallet extensions installed</li>
                    <li>Page script injection blocked</li>
                    <li>Wallet extensions not responding</li>
                </ul>
                <button class="refresh-btn" onclick="retryConnection()">🔄 Try Again</button>
            `;
        }
        
        this.showStatusMessage('⚠️ Page injection timeout. Please refresh and try again.', 'error');
    }

    showStatusMessage(message, type = 'info') {
        console.log(`📢 Status (${type}):`, message);
        
        // Remove existing status messages
        const existingStatus = document.querySelector('.status-message');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Create new status message
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message ${type}`;
        statusDiv.textContent = message;
        
        // Insert after header
        const header = document.querySelector('.header');
        if (header && header.parentNode) {
            header.parentNode.insertBefore(statusDiv, header.nextSibling);
        } else {
            // Fallback: append to body
            document.body.appendChild(statusDiv);
        }

        // Auto-remove after 5 seconds (except for success messages which stay longer)
        const autoRemoveDelay = type === 'success' ? 8000 : 5000;
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, autoRemoveDelay);
    }

    closeConnectionPage() {
        console.log('🚪 Closing connection page');
        
        // Try different methods to close the page
        try {
            // Method 1: Close via Chrome tabs API
            if (chrome.tabs) {
                chrome.tabs.getCurrent((tab) => {
                    if (tab) {
                        chrome.tabs.remove(tab.id);
                    } else {
                        // Method 2: Standard window.close()
                        window.close();
                    }
                });
            } else {
                // Method 3: Fallback to window.close()
                window.close();
            }
        } catch (error) {
            console.error('❌ Failed to close page:', error);
            // Method 4: Navigate back to extension popup
            try {
                window.location.href = chrome.runtime.getURL('popup.html');
            } catch (navError) {
                console.error('❌ Failed to navigate to popup:', navError);
            }
        }
    }

    // Method for manual retry
    retryConnection() {
        console.log('🔄 Retrying wallet connection...');
        location.reload();
    }
}

// Global functions accessible from HTML
function closeConnectionPage() {
    if (window.walletManager) {
        window.walletManager.closeConnectionPage();
    } else {
        console.warn('⚠️ Wallet manager not initialized');
        window.close();
    }
}

function retryConnection() {
    if (window.walletManager) {
        window.walletManager.retryConnection();
    } else {
        console.warn('⚠️ Wallet manager not initialized');
        location.reload();
    }
}

// Initialize wallet manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM loaded, initializing page script wallet manager...');
    window.walletManager = new ExtensionWalletManager();
});

// Fallback initialization for immediate script execution
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.walletManager) {
            window.walletManager = new ExtensionWalletManager();
        }
    });
} else {
    // DOM already loaded
    if (!window.walletManager) {
        window.walletManager = new ExtensionWalletManager();
    }
}

console.log('✅ Scout Page Script Connection Manager Ready');
