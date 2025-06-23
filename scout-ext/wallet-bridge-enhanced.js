// Scout Extension - Enhanced Wallet Bridge Script with AGGRESSIVE Detection
console.log('🔗 Enhanced Wallet Bridge Script Loaded');

class WalletBridge {
    constructor() {
        this.connectedWallet = null;
        this.connectedProvider = null;
        this.phantomSDK = null;
        this.glowClient = null;
        this.forceDetectionAttempts = 0;
        this.availableWallets = [];
        this.detectionIntervals = [];
        this.init();
    }

    async init() {
        console.log('🚀 Initializing enhanced wallet bridge with AGGRESSIVE detection...');
        
        // Start continuous detection
        this.startContinuousDetection();
        
        // Try multiple detection methods
        await this.loadCDNWallets();
        await this.waitForWallets();
        await this.forceWalletDetection();
        this.detectWallets();
    }

    startContinuousDetection() {
        console.log('🔄 Starting continuous wallet detection...');
        
        // Poll every 500ms for wallets
        const interval = setInterval(() => {
            this.detectWallets();
            if (this.availableWallets.length > 0) {
                clearInterval(interval);
            }
        }, 500);
        
        this.detectionIntervals.push(interval);
        
        // Clear after 30 seconds
        setTimeout(() => {
            clearInterval(interval);
        }, 30000);
    }    async loadCDNWallets() {
        console.log('📦 Loading CDN-based wallet solutions with AGGRESSIVE methods...');
        
        try {
            // Method 1: Try to trigger Phantom wallet extension
            await this.triggerPhantomWallet();
            
            // Method 2: Try to trigger Glow wallet extension
            await this.triggerGlowWallet();
            
            // Method 3: Load bundled wallet interfaces
            await this.loadBundledWallets();
            
        } catch (error) {
            console.warn('⚠️ CDN wallet loading failed:', error);
        }
    }

    async triggerPhantomWallet() {
        console.log('👻 AGGRESSIVELY triggering Phantom wallet...');
        
        try {
            // Method 1: Direct injection detection
            if (window.phantom?.solana) {
                this.phantomSDK = {
                    solana: window.phantom.solana,
                    show: () => console.log('🔍 Phantom interface activated'),
                    connect: () => window.phantom.solana.connect(),
                    isPhantom: true
                };
                console.log('✅ Phantom wallet detected via direct injection!');
                return;
            }

            // Method 2: Event-based detection
            window.dispatchEvent(new Event('phantom_requestProvider'));
            
            // Method 3: Try to access phantom through different paths
            const phantomChecks = [
                () => window.phantom,
                () => window.solana?.isPhantom,
                () => document.querySelector('meta[name="phantom-wallet"]'),
                () => window.navigator.phantom,
                () => window.chrome?.extension?.phantom
            ];

            for (const check of phantomChecks) {
                try {
                    const result = check();
                    if (result) {
                        console.log('✅ Phantom detected via alternative method!');
                        this.phantomSDK = { detected: true, provider: result };
                        break;
                    }
                } catch (e) { /* Continue checking */ }
            }

            // Method 4: Forced window manipulation
            this.forcePhantomDetection();
            
        } catch (error) {
            console.warn('⚠️ Phantom wallet triggering failed:', error);
        }
    }

    forcePhantomDetection() {
        console.log('💪 FORCING Phantom wallet detection...');
        
        // Try to access Phantom in multiple ways
        const phantomAccessors = [
            'phantom',
            'Phantom',
            'PHANTOM',
            'phantomWallet',
            'PhantomWallet'
        ];

        phantomAccessors.forEach(accessor => {
            try {
                if (window[accessor]) {
                    console.log(`✅ Found Phantom via window.${accessor}!`);
                    this.phantomSDK = { provider: window[accessor], detected: true };
                }
            } catch (e) { /* Continue */ }
        });

        // Try to trigger Phantom popup
        try {
            if (window.phantom?.solana?.connect) {
                console.log('🎯 Phantom connect method available - ready for connection!');
            }
        } catch (e) { /* Continue */ }
    }

    async triggerGlowWallet() {
        console.log('🌟 AGGRESSIVELY triggering Glow wallet...');
        
        try {
            // Method 1: Direct detection
            if (window.glow) {
                this.glowClient = {
                    connect: () => window.glow.connect(),
                    signTransaction: (tx) => window.glow.signTransaction(tx),
                    isGlow: true,
                    provider: window.glow
                };
                console.log('✅ Glow wallet detected via direct injection!');
                return;
            }

            // Method 2: Event-based detection
            window.dispatchEvent(new Event('glow_requestProvider'));
            
            // Method 3: Alternative access methods
            const glowChecks = [
                () => window.glow,
                () => window.GlowWallet,
                () => window.solana?.isGlow,
                () => document.querySelector('meta[name="glow-wallet"]'),
                () => window.navigator.glow
            ];

            for (const check of glowChecks) {
                try {
                    const result = check();
                    if (result) {
                        console.log('✅ Glow detected via alternative method!');
                        this.glowClient = { detected: true, provider: result };
                        break;
                    }
                } catch (e) { /* Continue checking */ }
            }

            // Method 4: Forced detection
            this.forceGlowDetection();
            
        } catch (error) {
            console.warn('⚠️ Glow wallet triggering failed:', error);
        }
    }

    forceGlowDetection() {
        console.log('💪 FORCING Glow wallet detection...');
        
        const glowAccessors = [
            'glow',
            'Glow',
            'GLOW',
            'glowWallet',
            'GlowWallet'
        ];

        glowAccessors.forEach(accessor => {
            try {
                if (window[accessor]) {
                    console.log(`✅ Found Glow via window.${accessor}!`);
                    this.glowClient = { provider: window[accessor], detected: true };
                }
            } catch (e) { /* Continue */ }
        });
    }

    async loadBundledWallets() {
        console.log('📦 Loading bundled wallet interfaces...');
        
        try {
            // Create enhanced wallet interfaces with fallbacks
            if (!this.phantomSDK && (window.phantom || window.solana?.isPhantom)) {
                this.phantomSDK = {
                    provider: window.phantom || window.solana,
                    connect: async () => {
                        if (window.phantom?.solana?.connect) {
                            return await window.phantom.solana.connect();
                        } else if (window.solana?.connect) {
                            return await window.solana.connect();
                        }
                        throw new Error('Phantom connection method not available');
                    },
                    isPhantom: true
                };
            }

            if (!this.glowClient && window.glow) {
                this.glowClient = {
                    provider: window.glow,
                    connect: async () => {
                        if (window.glow.connect) {
                            return await window.glow.connect();
                        }
                        throw new Error('Glow connection method not available');
                    },
                    isGlow: true
                };
            }

        } catch (error) {
            console.warn('⚠️ Bundled wallet interface creation failed:', error);
        }
    }    async waitForWallets() {
        console.log('⏳ AGGRESSIVELY waiting for wallet providers...');
        
        return new Promise(resolve => {
            let attempts = 0;
            const maxAttempts = 100; // 10 seconds with more aggressive polling
            
            const checkWallets = () => {
                attempts++;
                
                // Trigger detection on every check
                this.triggerAllWalletEvents();
                
                if (this.hasAnyWallet() || attempts >= maxAttempts) {
                    console.log(`⏱️ Wallet detection completed after ${attempts * 100}ms`);
                    console.log(`📊 Found wallets:`, this.getAvailableWalletNames());
                    resolve();
                } else {
                    setTimeout(checkWallets, 100);
                }
            };
            
            checkWallets();
        });
    }

    triggerAllWalletEvents() {
        // Trigger various wallet detection events
        const events = [
            'phantom_requestProvider',
            'glow_requestProvider',
            'solflare_requestProvider',
            'solana_requestProvider',
            'wallet_requestProvider'
        ];

        events.forEach(eventName => {
            try {
                window.dispatchEvent(new Event(eventName));
                window.dispatchEvent(new CustomEvent(eventName, { detail: { source: 'Scout-extension' } }));
            } catch (e) { /* Continue */ }
        });
    }

    getAvailableWalletNames() {
        const wallets = [];
        if (window.phantom?.solana) wallets.push('Phantom');
        if (window.glow) wallets.push('Glow');
        if (window.solflare) wallets.push('Solflare');
        if (window.backpack) wallets.push('Backpack');
        if (window.slope) wallets.push('Slope');
        if (window.sollet) wallets.push('Sollet');
        if (this.phantomSDK) wallets.push('Phantom SDK');
        if (this.glowClient) wallets.push('Glow Client');
        return wallets;
    }    hasAnyWallet() {
        const hasWallet = !!(
            window.phantom?.solana || 
            window.solflare || 
            window.glow || 
            window.solana ||
            window.backpack ||
            window.slope ||
            window.sollet ||
            window.coin98?.sol ||
            window.exodus?.solana ||
            window.torus?.solana ||
            this.phantomSDK ||
            this.glowClient
        );

        if (hasWallet) {
            console.log('✅ Wallet detected!', this.getAvailableWalletNames());
        }

        return hasWallet;
    }

    async forceWalletDetection() {
        console.log('💪 Starting ULTRA-AGGRESSIVE wallet detection...');
        
        this.forceDetectionAttempts++;
        
        // Method 1: Direct window object polling with mutation observers
        await this.pollWindowObjectsAggressively();
        
        // Method 2: Trigger wallet provider injection with multiple methods
        await this.triggerWalletInjection();
        
        // Method 3: Simulate user interaction to trigger wallet providers
        await this.simulateUserInteraction();
        
        // Method 4: Try to access common wallet properties with descriptor manipulation
        await this.accessWalletProperties();
        
        // Method 5: Force wallet popup triggers
        await this.forceWalletPopups();
        
        // Method 6: DOM manipulation to trigger wallet scripts
        await this.triggerWalletScripts();
    }

    async pollWindowObjectsAggressively() {
        console.log('🔍 AGGRESSIVELY polling window objects for wallet providers...');
        
        const walletChecks = [
            // Standard checks
            () => window.phantom?.solana,
            () => window.solflare,
            () => window.glow,
            () => window.solana,
            () => window.phantom,
            () => window.backpack,
            () => window.slope,
            () => window.sollet,
            () => window.coin98?.sol,
            () => window.exodus?.solana,
            () => window.torus?.solana,
            
            // Alternative access patterns
            () => window['phantom'],
            () => window['glow'],
            () => window['solana'],
            () => window.top?.phantom,
            () => window.parent?.phantom,
            () => window.frames?.phantom,
            
            // Property descriptor checks
            () => Object.getOwnPropertyDescriptor(window, 'phantom'),
            () => Object.getOwnPropertyDescriptor(window, 'glow'),
            () => Object.getOwnPropertyDescriptor(window, 'solana')
        ];

        // Check multiple times with delays
        for (let round = 0; round < 5; round++) {
            console.log(`🔄 Polling round ${round + 1}/5...`);
            
            for (const check of walletChecks) {
                try {
                    const result = check();
                    if (result) {
                        console.log('✅ Wallet found during aggressive polling!', result);
                        return true;
                    }
                } catch (e) { /* Continue checking */ }
            }
            
            // Wait before next round
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        return false;
    }

    async forceWalletPopups() {
        console.log('🚀 FORCING wallet popups to appear...');
        
        try {
            // Try to trigger Phantom popup
            if (window.phantom?.solana) {
                console.log('👻 Attempting to force Phantom popup...');
                try {
                    // Don't actually connect, just check if method exists
                    if (typeof window.phantom.solana.connect === 'function') {
                        console.log('✅ Phantom connect method confirmed available!');
                    }
                } catch (e) { /* Continue */ }
            }

            // Try to trigger Glow popup
            if (window.glow) {
                console.log('🌟 Attempting to force Glow popup...');
                try {
                    if (typeof window.glow.connect === 'function') {
                        console.log('✅ Glow connect method confirmed available!');
                    }
                } catch (e) { /* Continue */ }
            }

            // Dispatch wallet request events
            const walletEvents = [
                'wallet-standard:app-ready',
                'phantom_requestProvider',
                'glow_requestProvider',
                'solana:provider-ready',
                'wallet:ready'
            ];

            walletEvents.forEach(eventName => {
                window.dispatchEvent(new CustomEvent(eventName, {
                    detail: { 
                        source: 'Scout-extension',
                        timestamp: Date.now(),
                        force: true 
                    }
                }));
            });

        } catch (error) {
            console.warn('⚠️ Force wallet popup failed:', error);
        }
    }

    async triggerWalletScripts() {
        console.log('📜 Triggering wallet scripts via DOM manipulation...');
        
        try {
            // Check for wallet-related meta tags and scripts
            const walletMetas = document.querySelectorAll('meta[name*="wallet"], meta[name*="phantom"], meta[name*="glow"]');
            console.log('🔍 Found wallet meta tags:', walletMetas.length);

            // Try to trigger wallet script execution
            const scripts = document.querySelectorAll('script[src*="phantom"], script[src*="glow"], script[src*="solana"]');
            console.log('🔍 Found wallet-related scripts:', scripts.length);

            // Create wallet detection script
            const detectionScript = document.createElement('script');
            detectionScript.textContent = `
                console.log('🔍 Scout Extension: Wallet detection script injected');
                
                // Try to access wallets
                if (window.phantom) console.log('👻 Phantom detected by injected script');
                if (window.glow) console.log('🌟 Glow detected by injected script');
                if (window.solana) console.log('🔗 Solana provider detected by injected script');
                
                // Dispatch ready events
                window.dispatchEvent(new CustomEvent('Scout:wallet-check', {
                    detail: {
                        phantom: !!window.phantom,
                        glow: !!window.glow,
                        solana: !!window.solana
                    }
                }));
            `;
            
            document.head.appendChild(detectionScript);            
            // Listen for the custom event
            window.addEventListener('Scout:wallet-check', (event) => {
                console.log('📨 Received wallet check event:', event.detail);
            });

        } catch (error) {
            console.warn('⚠️ Wallet script triggering failed:', error);
        }
    }

    async triggerWalletInjection() {
        console.log('⚡ Triggering wallet provider injection...');
        
        try {
            // Dispatch events that wallets listen for
            const events = [
                'DOMContentLoaded',
                'load',
                'beforeunload',
                'wallet-standard:app-ready'
            ];

            for (const eventType of events) {
                window.dispatchEvent(new Event(eventType));
                document.dispatchEvent(new Event(eventType));
            }

        } catch (error) {
            console.warn('⚠️ Wallet injection trigger failed:', error);
        }
    }

    async simulateUserInteraction() {
        console.log('🎭 AGGRESSIVELY simulating user interaction...');
        
        try {
            // Create and dispatch various user events that might trigger wallet injection
            const events = [
                new MouseEvent('click', { bubbles: true, cancelable: true }),
                new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
                new MouseEvent('mouseup', { bubbles: true, cancelable: true }),
                new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
                new FocusEvent('focus', { bubbles: true }),
                new Event('scroll', { bubbles: true }),
                new Event('resize', { bubbles: true })
            ];
            
            for (const event of events) {
                document.dispatchEvent(event);
                window.dispatchEvent(event);
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Try to focus on the document to trigger wallet injection
            if (document.body) {
                document.body.focus();
                document.body.click();
            }

        } catch (error) {
            console.warn('⚠️ User interaction simulation failed:', error);
        }
    }

    async accessWalletProperties() {
        console.log('🔑 AGGRESSIVELY accessing wallet properties...');
        
        try {
            // Try to access wallet properties through various means
            const propertyNames = [
                'phantom', 'glow', 'solana', 'solflare', 'backpack', 'slope', 'sollet',
                'coin98', 'exodus', 'torus', 'mathWallet', 'safePal', 'bitkeep'
            ];

            for (const propName of propertyNames) {
                try {
                    // Direct access
                    if (window[propName]) {
                        console.log(`✅ Found ${propName} wallet via direct access!`);
                    }

                    // Property descriptor access
                    const descriptor = Object.getOwnPropertyDescriptor(window, propName);
                    if (descriptor) {
                        console.log(`✅ Found ${propName} wallet via property descriptor!`);
                    }

                    // Prototype chain access
                    if (propName in window) {
                        console.log(`✅ Found ${propName} wallet in prototype chain!`);
                    }

                    // Try to trigger getter
                    try {
                        const value = window[propName];
                        if (value !== undefined) {
                            console.log(`✅ ${propName} wallet accessible!`);
                        }
                    } catch (e) { /* Continue */ }

                } catch (e) { /* Continue checking */ }
            }

            // Try to access via Object.keys and Object.getOwnPropertyNames
            const windowKeys = Object.keys(window);
            const windowProps = Object.getOwnPropertyNames(window);
            
            const walletRelatedKeys = [...windowKeys, ...windowProps].filter(key => 
                key.toLowerCase().includes('phantom') || 
                key.toLowerCase().includes('glow') || 
                key.toLowerCase().includes('solana') ||
                key.toLowerCase().includes('wallet')
            );

            if (walletRelatedKeys.length > 0) {
                console.log('🔍 Found wallet-related properties:', walletRelatedKeys);
            }

        } catch (error) {
            console.warn('⚠️ Wallet property access failed:', error);
        }
    }

    detectWallets() {
        console.log('🔍 Starting comprehensive wallet detection...');
        const walletButtons = document.getElementById('walletButtons');
        const availableWallets = [];

        // Phantom Detection (Multiple Methods)
        if (this.detectPhantom()) {
            availableWallets.push({
                name: 'Phantom',
                icon: '👻',
                type: 'extension',
                provider: window.phantom.solana,
                connect: () => this.connectPhantom()
            });
        }

        // Phantom SDK (if available)
        if (this.phantomSDK) {
            availableWallets.push({
                name: 'Phantom SDK',
                icon: '👻',
                type: 'sdk',
                provider: this.phantomSDK,
                connect: () => this.connectPhantomSDK()
            });
        }

        // Glow Detection
        if (this.detectGlow()) {
            availableWallets.push({
                name: 'Glow',
                icon: '🌟',
                type: 'extension',
                provider: window.glow,
                connect: () => this.connectGlow()
            });
        }

        // Glow Client (if available)
        if (this.glowClient) {
            availableWallets.push({
                name: 'Glow Client',
                icon: '🌟',
                type: 'client',
                provider: this.glowClient,
                connect: () => this.connectGlowClient()
            });
        }

        // Solflare Detection
        if (this.detectSolflare()) {
            availableWallets.push({
                name: 'Solflare',
                icon: '🔥',
                type: 'extension',
                provider: window.solflare,
                connect: () => this.connectSolflare()
            });
        }

        // Additional Wallet Detection
        this.detectAdditionalWallets(availableWallets);

        console.log(`🎯 Detected ${availableWallets.length} wallet(s):`, availableWallets.map(w => w.name));

        if (availableWallets.length === 0) {
            this.showNoWalletsFound();
        } else {
            this.displayWalletButtons(availableWallets);
            this.notifyWalletsDetected(availableWallets);
        }
    }

    detectPhantom() {
        const methods = [
            () => window.phantom?.solana?.isPhantom,
            () => window.phantom?.solana && typeof window.phantom.solana.connect === 'function',
            () => window.solana?.isPhantom,
            () => window.phantom && typeof window.phantom.connect === 'function'
        ];

        for (const method of methods) {
            try {
                if (method()) {
                    console.log('✅ Phantom detected');
                    return true;
                }
            } catch (e) { /* ignore */ }
        }
        return false;
    }

    detectGlow() {
        const methods = [
            () => window.glow?.solana,
            () => window.glow && typeof window.glow.connect === 'function',
            () => window.glow?.isGlow
        ];

        for (const method of methods) {
            try {
                if (method()) {
                    console.log('✅ Glow detected');
                    return true;
                }
            } catch (e) { /* ignore */ }
        }
        return false;
    }

    detectSolflare() {
        const methods = [
            () => window.solflare?.isSolflare,
            () => window.solflare && typeof window.solflare.connect === 'function',
            () => window.solflare?.solana
        ];

        for (const method of methods) {
            try {
                if (method()) {
                    console.log('✅ Solflare detected');
                    return true;
                }
            } catch (e) { /* ignore */ }
        }
        return false;
    }

    detectAdditionalWallets(availableWallets) {
        const additionalWallets = [
            {
                name: 'Backpack',
                icon: '🎒',
                detector: () => window.backpack?.solana,
                provider: () => window.backpack.solana
            },
            {
                name: 'Slope',
                icon: '⛷️',
                detector: () => window.slope?.solana,
                provider: () => window.slope.solana
            },
            {
                name: 'Sollet',
                icon: '💳',
                detector: () => window.sollet,
                provider: () => window.sollet
            },
            {
                name: 'Coin98',
                icon: '🪙',
                detector: () => window.coin98?.sol,
                provider: () => window.coin98.sol
            }
        ];

        for (const wallet of additionalWallets) {
            try {
                if (wallet.detector()) {
                    console.log(`✅ ${wallet.name} detected`);
                    availableWallets.push({
                        name: wallet.name,
                        icon: wallet.icon,
                        type: 'extension',
                        provider: wallet.provider(),
                        connect: () => this.connectGenericWallet(wallet.provider(), wallet.name, wallet.icon)
                    });
                }
            } catch (e) {
                console.warn(`⚠️ Error detecting ${wallet.name}:`, e);
            }
        }
    }

    // Connection Methods
    async connectWallet(walletName) {
        const wallet = this.availableWallets.find(w => w.name === walletName);
        if (wallet) {
            await wallet.connect();
        }
    }

    async connectPhantom() {
        try {
            console.log('👻 Connecting to Phantom...');
            this.updateButtonState('Phantom', true);
            const response = await window.phantom.solana.connect();
            await this.handleConnection('Phantom', '👻', window.phantom.solana, response.publicKey);
        } catch (err) {
            console.error('❌ Phantom connection failed:', err);
            this.updateStatus('Phantom connection failed: ' + err.message, 'error');
            this.updateButtonState('Phantom', false);
        }
    }

    async connectSolflare() {
        try {
            console.log('🔥 Connecting to Solflare...');
            this.updateButtonState('Solflare', true);
            const response = await window.solflare.connect();
            await this.handleConnection('Solflare', '🔥', window.solflare, response.publicKey);
        } catch (err) {
            console.error('❌ Solflare connection failed:', err);
            this.updateStatus('Solflare connection failed: ' + err.message, 'error');
            this.updateButtonState('Solflare', false);
        }
    }

    async connectGlow() {
        try {
            console.log('🌟 Connecting to Glow...');
            this.updateButtonState('Glow', true);
            const response = await window.glow.connect();
            await this.handleConnection('Glow', '🌟', window.glow, response.publicKey);
        } catch (err) {
            console.error('❌ Glow connection failed:', err);
            this.updateStatus('Glow connection failed: ' + err.message, 'error');
            this.updateButtonState('Glow', false);
        }
    }

    async connectPhantomSDK() {
        try {
            console.log('🚀 Connecting to Phantom SDK...');
            this.updateButtonState('Phantom SDK', true);
            
            if (!this.phantomSDK) {
                throw new Error('Phantom SDK not initialized');
            }

            this.phantomSDK.show();
            const response = await this.phantomSDK.connect();
            await this.handleConnection('Phantom SDK', '👻', this.phantomSDK, response.publicKey);
            
        } catch (error) {
            console.error('❌ Phantom SDK connection failed:', error);
            this.updateStatus('Phantom SDK connection failed: ' + error.message, 'error');
            this.updateButtonState('Phantom SDK', false);
        }
    }

    async connectGlowClient() {
        try {
            console.log('🌟 Connecting to Glow Client...');
            this.updateButtonState('Glow Client', true);
            
            if (!this.glowClient) {
                throw new Error('Glow Client not initialized');
            }

            const response = await this.glowClient.connect();
            const publicKey = { toString: () => response.address };
            await this.handleConnection('Glow Client', '🌟', this.glowClient, publicKey);
            
        } catch (error) {
            console.error('❌ Glow Client connection failed:', error);
            this.updateStatus('Glow Client connection failed: ' + error.message, 'error');
            this.updateButtonState('Glow Client', false);
        }
    }

    async connectGenericWallet(provider, walletName, walletIcon) {
        try {
            console.log(`🔗 Connecting to ${walletName}...`);
            this.updateButtonState(walletName, true);
            
            if (!provider || typeof provider.connect !== 'function') {
                throw new Error(`${walletName} provider not available`);
            }

            const response = await provider.connect();
            await this.handleConnection(walletName, walletIcon, provider, response.publicKey);
            
        } catch (error) {
            console.error(`❌ ${walletName} connection failed:`, error);
            this.updateStatus(`${walletName} connection failed: ` + error.message, 'error');
            this.updateButtonState(walletName, false);
        }
    }

    async handleConnection(walletName, walletIcon, provider, publicKey) {
        this.connectedWallet = walletName;
        this.connectedProvider = provider;

        // Get balance
        let balance = '0.00';
        try {
            if (window.solanaWeb3) {
                const connection = new window.solanaWeb3.Connection('https://api.mainnet-beta.solana.com');
                const balanceResult = await connection.getBalance(publicKey);
                balance = (balanceResult / 1000000000).toFixed(4);
            }
        } catch (error) {
            console.warn('Could not fetch balance:', error);
        }

        const walletData = {
            walletName,
            walletIcon,
            publicKey: publicKey.toString(),
            balance: balance,
            connected: true,
            connectionTime: new Date().toISOString()
        };

        this.updateStatus(`Successfully connected to ${walletName}!`, 'success');
        this.showWalletInfo(walletData);
        this.notifyParent('WALLET_CONNECTED', { walletData });
    }

    // UI Methods
    showNoWalletsFound() {
        const walletButtons = document.getElementById('walletButtons');
        walletButtons.innerHTML = `
            <div class="no-wallets">
                <h3>❌ No Wallets Detected</h3>
                <p>We tried <strong>${this.forceDetectionAttempts}</strong> forceful detection attempt(s) but couldn't find any Solana wallets.</p>
                <div class="detection-methods">
                    <p><strong>Methods tried:</strong></p>
                    <ul>
                        <li>✅ Extension provider detection</li>
                        <li>✅ Window object polling</li>
                        <li>✅ Provider injection triggers</li>
                        <li>✅ User interaction simulation</li>
                        <li>✅ Property access triggers</li>
                    </ul>
                </div>
                <div class="install-options">
                    <h4>📱 Install a Solana Wallet:</h4>
                    <div class="install-links">
                        <a href="https://phantom.app/" target="_blank" class="install-link">
                            👻 Install Phantom Wallet
                        </a>
                        <a href="https://glow.app/" target="_blank" class="install-link">
                            🌟 Install Glow Wallet
                        </a>
                        <a href="https://solflare.com/" target="_blank" class="install-link">
                            🔥 Install Solflare Wallet
                        </a>
                    </div>
                </div>
            </div>
            <button class="wallet-btn" onclick="walletBridge.retryDetection()" style="margin-top: 20px;">
                🔄 Retry Detection
            </button>
        `;
        
        this.notifyParent('NO_WALLETS_FOUND', { 
            availableWallets: [],
            detectionAttempts: this.forceDetectionAttempts
        });
    }

    displayWalletButtons(availableWallets) {
        const walletButtons = document.getElementById('walletButtons');
        
        walletButtons.innerHTML = `
            <div class="detection-summary">
                <p>✅ Found <strong>${availableWallets.length}</strong> wallet(s) after <strong>${this.forceDetectionAttempts}</strong> detection attempt(s)</p>
            </div>
            ${availableWallets.map(wallet => 
                `<button class="wallet-btn" id="btn-${wallet.name.toLowerCase().replace(/\s+/g, '-')}" 
                         onclick="walletBridge.connectWallet('${wallet.name}')">
                    <span class="wallet-icon">${wallet.icon}</span>
                    <span>Connect ${wallet.name}</span>
                    <span class="wallet-type">(${wallet.type})</span>
                </button>`
            ).join('')}
        `;

        this.availableWallets = availableWallets;
    }

    notifyWalletsDetected(availableWallets) {
        this.notifyParent('WALLETS_DETECTED', { 
            availableWallets: availableWallets.map(w => ({
                name: w.name,
                icon: w.icon,
                type: w.type
            })),
            detectionAttempts: this.forceDetectionAttempts
        });
    }

    updateStatus(message, type) {
        const status = document.getElementById('status');
        if (status) {
            status.textContent = message;
            status.className = `status ${type}`;
            status.style.display = 'block';
        }
    }

    updateButtonState(walletName, connecting) {
        const button = document.getElementById(`btn-${walletName.toLowerCase().replace(/\s+/g, '-')}`);
        if (button) {
            button.disabled = connecting;
            button.className = `wallet-btn ${connecting ? 'connecting' : ''}`;
            if (connecting) {
                button.innerHTML = `
                    <span class="loading-spinner"></span>
                    <span>Connecting...</span>
                `;
            }
        }
    }

    showWalletInfo(walletData) {
        const walletInfo = document.getElementById('walletInfo');
        if (walletInfo) {
            walletInfo.innerHTML = `
                <h4>${walletData.walletIcon} ${walletData.walletName} Connected</h4>
                <p><strong>Balance:</strong> ${walletData.balance} SOL</p>
                <div class="address">
                    <strong>Address:</strong><br>
                    <span class="wallet-address">${walletData.publicKey.slice(0, 8)}...${walletData.publicKey.slice(-8)}</span>
                </div>
                <button class="wallet-btn" onclick="walletBridge.disconnect()" style="margin-top: 10px;">
                    🔌 Disconnect
                </button>
            `;
            walletInfo.style.display = 'block';
        }
    }

    async retryDetection() {
        console.log('🔄 Retrying wallet detection...');
        this.forceDetectionAttempts = 0;
        await this.init();
    }

    disconnect() {
        this.connectedWallet = null;
        this.connectedProvider = null;
        
        const walletInfo = document.getElementById('walletInfo');
        if (walletInfo) {
            walletInfo.style.display = 'none';
        }
        
        this.notifyParent('WALLET_DISCONNECTED', {});
        this.updateStatus('Wallet disconnected', 'success');
    }

    notifyParent(type, data) {
        window.parent.postMessage({
            source: 'wallet-bridge',
            type: type,
            data: data
        }, '*');
    }
}

// Global wallet bridge instance
let walletBridge;

// Load Solana Web3.js first
function initializeWalletBridge() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('solana-web3.js');
    script.onload = () => {
        console.log('✅ Solana Web3.js loaded locally');
        walletBridge = new WalletBridge();
    };
    script.onerror = () => {
        console.warn('❌ Failed to load local Solana Web3.js, initializing without balance fetching');
        walletBridge = new WalletBridge();
    };
    document.head.appendChild(script);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWalletBridge);
} else {
    initializeWalletBridge();
}
