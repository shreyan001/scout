// Scout Extension - Enhanced Wallet Connection Script
console.log('🔗 Scout Wallet Connection Script Loaded');

class ExtensionWalletManager {
    constructor() {
        this.isConnected = false;
        this.walletData = null;
        this.initializeConnection();
    }

    initializeConnection() {
        console.log('🚀 Initializing wallet connection interface...');
        
        // Try to load the wallet bridge
        this.loadWalletBridge();
        
        // Listen for messages from the iframe
        window.addEventListener('message', (event) => {
            this.handleWalletMessage(event);
        });

        // Set timeout for fallback
        setTimeout(() => {
            this.checkLoadingStatus();
        }, 10000); // 10 seconds timeout
    }

    loadWalletBridge() {
        const iframe = document.getElementById('walletFrame');
        const loadingContainer = document.getElementById('loadingContainer');
        
        if (!iframe) {
            console.error('❌ Wallet iframe not found');
            this.showFallback();
            return;
        }
        
        // Load the wallet bridge from extension resources
        const extensionBridgeUrl = chrome.runtime.getURL('wallet-bridge.html');
        console.log('📍 Loading wallet bridge from:', extensionBridgeUrl);
        
        iframe.onload = () => {
            console.log('✅ Wallet bridge loaded successfully');
            if (loadingContainer) {
                loadingContainer.style.display = 'none';
            }
            iframe.style.display = 'block';
            this.showStatusMessage('Wallet detection interface loaded successfully!', 'success');
        };

        iframe.onerror = () => {
            console.error('❌ Failed to load wallet bridge');
            this.showFallback();
        };

        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
            iframe.src = extensionBridgeUrl;
        }, 100);
    }

    checkLoadingStatus() {
        const iframe = document.getElementById('walletFrame');
        const loadingContainer = document.getElementById('loadingContainer');
        
        if (loadingContainer && loadingContainer.style.display !== 'none') {
            console.warn('⚠️ Loading timeout reached, showing fallback');
            this.showFallback();
        }
    }

    showFallback() {
        const loadingContainer = document.getElementById('loadingContainer');
        const iframe = document.getElementById('walletFrame');
        const fallbackContent = document.getElementById('fallbackContent');
        
        if (loadingContainer) loadingContainer.style.display = 'none';
        if (iframe) iframe.style.display = 'none';
        if (fallbackContent) fallbackContent.style.display = 'block';
        
        this.showStatusMessage('Unable to load wallet interface. Please refresh the page.', 'error');
    }

    handleWalletMessage(event) {
        // Only handle messages from our wallet bridge
        if (event.data.source !== 'wallet-bridge') return;

        console.log('📨 Received message from wallet bridge:', event.data.type);

        switch (event.data.type) {
            case 'WALLETS_DETECTED':
                console.log('✅ Wallets detected:', event.data.data.availableWallets);
                this.showStatusMessage(
                    `Found ${event.data.data.availableWallets.length} wallet(s): ${event.data.data.availableWallets.map(w => w.name).join(', ')}`, 
                    'success'
                );
                break;

            case 'NO_WALLETS_FOUND':
                console.log('⚠️ No wallets found');
                this.showStatusMessage('No Solana wallets detected. Please install Phantom, Solflare, or Glow wallet extension.', 'error');
                break;

            case 'WALLET_CONNECTED':
                console.log('🎉 Wallet connected:', event.data.data.walletData);
                this.handleWalletConnected(event.data.data.walletData);
                break;

            case 'WALLET_DISCONNECTED':
                console.log('🔌 Wallet disconnected');
                this.handleWalletDisconnected();
                break;

            default:
                console.log('📩 Unknown message type:', event.data.type);
        }
    }

    async handleWalletConnected(walletData) {
        console.log('🔗 Processing wallet connection:', walletData);
        
        this.isConnected = true;
        this.walletData = walletData;

        // Store wallet data in extension storage with the keys expected by popup.js
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

            this.showStatusMessage(`🎉 ${walletData.walletName} connected successfully! Balance: ${walletData.balance} SOL`, 'success');
            
            // Notify background script
            chrome.runtime.sendMessage({
                type: 'WALLET_CONNECTED',
                walletData: walletData
            });

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
        console.log('🔌 Processing wallet disconnection');
        
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
            
            // Notify background script
            chrome.runtime.sendMessage({
                type: 'WALLET_DISCONNECTED'
            });

        } catch (error) {
            console.error('❌ Failed to clear wallet data:', error);
            this.showStatusMessage('Failed to clear wallet data.', 'error');
        }
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
    console.log('🌟 DOM loaded, initializing wallet manager...');
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

console.log('✅ Scout Wallet Connection Script Ready');
