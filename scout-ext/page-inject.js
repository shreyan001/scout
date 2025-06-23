// Scout Extension - Page Injection Script
// This script runs in the page context where wallets are directly accessible
console.log('🚀 Scout Page Injection Script Loaded');

(function() {
    'use strict';

    class PageWalletDetector {
        constructor() {
            this.detectedWallets = [];
            this.connectedWallet = null;
            this.isScanning = false;
            this.init();
        }

        init() {
            console.log('🔍 Initializing page wallet detector...');
            
            // Start aggressive wallet detection
            this.startAggressiveDetection();
            
            // Listen for messages from content script
            window.addEventListener('message', (event) => {
                if (event.source !== window) return;
                if (event.data.source !== 'Scout-content-script') return;
                
                this.handleContentScriptMessage(event.data);
            });
            
            // Notify content script that page script is ready
            this.sendToContentScript('PAGE_SCRIPT_READY', {});
        }

        startAggressiveDetection() {
            console.log('💪 Starting aggressive wallet detection in page context...');
            
            // Immediate detection
            this.detectWallets();
            
            // Polling detection (every 1 second for 30 seconds)
            let attempts = 0;
            const maxAttempts = 30;
            
            const detectionInterval = setInterval(() => {
                attempts++;
                this.detectWallets();
                
                if (attempts >= maxAttempts || this.detectedWallets.length > 0) {
                    clearInterval(detectionInterval);
                    console.log(`🏁 Detection completed after ${attempts} attempts`);
                }
            }, 1000);

            // Force wallet injection events
            this.forceWalletInjection();
            
            // DOM ready detection
            if (document.readyState !== 'loading') {
                setTimeout(() => this.detectWallets(), 100);
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => this.detectWallets(), 100);
                });
            }
        }

        detectWallets() {
            const previousCount = this.detectedWallets.length;
            this.detectedWallets = [];

            // Phantom Wallet Detection
            if (window.phantom?.solana) {
                console.log('👻 Phantom wallet detected!');
                this.detectedWallets.push({
                    name: 'Phantom',
                    icon: '👻',
                    provider: 'phantom',
                    connect: () => window.phantom.solana.connect(),
                    disconnect: () => window.phantom.solana.disconnect(),
                    signTransaction: (tx) => window.phantom.solana.signTransaction(tx),
                    publicKey: window.phantom.solana.publicKey
                });
            }

            // Glow Wallet Detection  
            if (window.glow) {
                console.log('🌟 Glow wallet detected!');
                this.detectedWallets.push({
                    name: 'Glow',
                    icon: '🌟', 
                    provider: 'glow',
                    connect: () => window.glow.connect(),
                    disconnect: () => window.glow.disconnect(),
                    signTransaction: (tx) => window.glow.signTransaction(tx),
                    publicKey: window.glow.publicKey
                });
            }

            // Solflare Wallet Detection
            if (window.solflare?.isSolflare) {
                console.log('🔥 Solflare wallet detected!');
                this.detectedWallets.push({
                    name: 'Solflare',
                    icon: '🔥',
                    provider: 'solflare', 
                    connect: () => window.solflare.connect(),
                    disconnect: () => window.solflare.disconnect(),
                    signTransaction: (tx) => window.solflare.signTransaction(tx),
                    publicKey: window.solflare.publicKey
                });
            }

            // Backpack Wallet Detection
            if (window.backpack?.isBackpack) {
                console.log('🎒 Backpack wallet detected!');
                this.detectedWallets.push({
                    name: 'Backpack',
                    icon: '🎒',
                    provider: 'backpack',
                    connect: () => window.backpack.connect(),
                    disconnect: () => window.backpack.disconnect(),
                    signTransaction: (tx) => window.backpack.signTransaction(tx),
                    publicKey: window.backpack.publicKey
                });
            }

            // Slope Wallet Detection
            if (window.Slope) {
                console.log('⛷️ Slope wallet detected!');
                this.detectedWallets.push({
                    name: 'Slope',
                    icon: '⛷️',
                    provider: 'slope',
                    connect: () => window.Slope.connect(),
                    disconnect: () => window.Slope.disconnect(),
                    signTransaction: (tx) => window.Slope.signTransaction(tx),
                    publicKey: window.Slope.publicKey
                });
            }

            // Generic Solana Wallet Detection
            if (window.solana && !this.detectedWallets.find(w => w.provider === 'phantom')) {
                console.log('🔗 Generic Solana wallet detected!');
                this.detectedWallets.push({
                    name: 'Solana Wallet',
                    icon: '🔗',
                    provider: 'solana',
                    connect: () => window.solana.connect(),
                    disconnect: () => window.solana.disconnect && window.solana.disconnect(),
                    signTransaction: (tx) => window.solana.signTransaction(tx),
                    publicKey: window.solana.publicKey
                });
            }

            // Notify if new wallets detected
            if (this.detectedWallets.length > previousCount) {
                console.log(`✅ Found ${this.detectedWallets.length} wallets:`, 
                    this.detectedWallets.map(w => w.name).join(', '));
                
                this.sendToContentScript('WALLETS_DETECTED', {
                    wallets: this.detectedWallets.map(w => ({
                        name: w.name,
                        icon: w.icon,
                        provider: w.provider,
                        isConnected: !!w.publicKey
                    }))
                });
            }
        }

        forceWalletInjection() {
            console.log('🚀 Forcing wallet injection events...');
            
            // Dispatch various wallet events
            const walletEvents = [
                'phantom_requestProvider',
                'glow_requestProvider', 
                'solflare_requestProvider',
                'backpack_requestProvider',
                'slope_requestProvider',
                'solana_requestProvider',
                'wallet-standard:app-ready',
                'wallet:ready'
            ];

            walletEvents.forEach(eventName => {
                try {
                    window.dispatchEvent(new CustomEvent(eventName, {
                        detail: { source: 'Scout-extension', force: true }
                    }));
                    window.dispatchEvent(new Event(eventName));
                } catch (e) {
                    console.warn(`Failed to dispatch ${eventName}:`, e);
                }
            });

            // Try to trigger window object access
            const accessors = ['phantom', 'glow', 'solflare', 'backpack', 'slope', 'solana'];
            accessors.forEach(accessor => {
                try {
                    if (window[accessor]) {
                        console.log(`🎯 Direct access confirmed: window.${accessor}`);
                    }
                } catch (e) {
                    // Access attempt might trigger wallet injection
                }
            });
        }

        async connectWallet(provider) {
            console.log(`🔗 Attempting to connect to ${provider} wallet...`);
            
            try {
                const wallet = this.detectedWallets.find(w => w.provider === provider);
                if (!wallet) {
                    throw new Error(`${provider} wallet not found`);
                }

                // Attempt connection
                const response = await wallet.connect();
                
                if (response.publicKey) {
                    this.connectedWallet = {
                        ...wallet,
                        publicKey: response.publicKey,
                        address: response.publicKey.toString()
                    };

                    console.log(`✅ Successfully connected to ${wallet.name}:`, this.connectedWallet.address);

                    // Get balance if possible
                    let balance = 0;
                    if (window.solanaWeb3 && window.solanaWeb3.Connection) {
                        try {
                            const connection = new window.solanaWeb3.Connection('https://api.mainnet-beta.solana.com');
                            const balanceLamports = await connection.getBalance(response.publicKey);
                            balance = balanceLamports / window.solanaWeb3.LAMPORTS_PER_SOL;
                        } catch (balanceError) {
                            console.warn('Failed to fetch balance:', balanceError);
                        }
                    }

                    this.sendToContentScript('WALLET_CONNECTED', {
                        walletName: wallet.name,
                        walletIcon: wallet.icon,
                        publicKey: this.connectedWallet.address,
                        balance: balance.toFixed(4),
                        provider: provider,
                        connectionTime: new Date().toISOString()
                    });

                    return {
                        success: true,
                        data: this.connectedWallet
                    };
                } else {
                    throw new Error('Connection successful but no public key received');
                }

            } catch (error) {
                console.error(`❌ Failed to connect to ${provider}:`, error);
                
                this.sendToContentScript('WALLET_CONNECTION_FAILED', {
                    provider: provider,
                    error: error.message
                });

                return {
                    success: false,
                    error: error.message
                };
            }
        }

        async disconnectWallet() {
            console.log('🔌 Disconnecting wallet...');
            
            if (!this.connectedWallet) {
                return { success: false, error: 'No wallet connected' };
            }

            try {
                if (this.connectedWallet.disconnect) {
                    await this.connectedWallet.disconnect();
                }

                const walletName = this.connectedWallet.name;
                this.connectedWallet = null;

                this.sendToContentScript('WALLET_DISCONNECTED', {
                    walletName: walletName
                });

                console.log(`✅ Successfully disconnected from ${walletName}`);
                return { success: true };

            } catch (error) {
                console.error('❌ Failed to disconnect wallet:', error);
                return { success: false, error: error.message };
            }
        }

        handleContentScriptMessage(message) {
            console.log('📨 Page script received message:', message.type);
            
            switch (message.type) {
                case 'DETECT_WALLETS':
                    this.detectWallets();
                    break;
                    
                case 'CONNECT_WALLET':
                    this.connectWallet(message.data.provider);
                    break;
                    
                case 'DISCONNECT_WALLET':
                    this.disconnectWallet();
                    break;
                    
                case 'GET_WALLET_STATUS':
                    this.sendToContentScript('WALLET_STATUS', {
                        connected: !!this.connectedWallet,
                        wallet: this.connectedWallet,
                        availableWallets: this.detectedWallets.map(w => ({
                            name: w.name,
                            icon: w.icon,
                            provider: w.provider,
                            isConnected: !!w.publicKey
                        }))
                    });
                    break;
                    
                default:
                    console.log('Unknown message type:', message.type);
            }
        }

        sendToContentScript(type, data) {
            window.postMessage({
                source: 'Scout-page-script',
                type: type,
                data: data
            }, '*');
        }
    }

    // Initialize the page wallet detector
    window.ScoutPageWalletDetector = new PageWalletDetector();
    
    console.log('✅ Scout Page Injection Script Ready');
})();
