class ExtensionWalletConnector {
    constructor() {
        this.connectedWallet = null;
        this.connectedProvider = null;
        this.init();
    }

    async init() {
        this.detectWallets();
        this.updateStatus('Ready to connect', 'status');
    }

    detectWallets() {
        const walletButtons = document.getElementById('walletButtons');
        const availableWallets = [];

        setTimeout(() => {
            // Detect Phantom
            if (window.phantom?.solana?.isPhantom) {
                availableWallets.push({
                    name: 'Phantom',
                    provider: window.phantom.solana,
                    connect: () => this.connectPhantom()
                });
            }

            // Detect Solflare
            if (window.solflare?.isSolflare) {
                availableWallets.push({
                    name: 'Solflare',
                    provider: window.solflare,
                    connect: () => this.connectSolflare()
                });
            }

            // Detect Sollet
            if (window.sollet) {
                availableWallets.push({
                    name: 'Sollet',
                    provider: window.sollet,
                    connect: () => this.connectSollet()
                });
            }

            if (availableWallets.length === 0) {
                walletButtons.innerHTML = `
                    <div class="status error">
                        No Solana wallets detected.
                        Please install Phantom, Solflare, or Sollet and refresh this page.
                    </div>
                    <button class="wallet-btn" onclick="location.reload()">Refresh</button>
                `;
                return;
            }

            walletButtons.innerHTML = availableWallets.map(wallet => 
                `<button class="wallet-btn" onclick="walletConnector.connectWallet('${wallet.name}')">
                    Connect ${wallet.name}
                </button>`
            ).join('');

            this.availableWallets = availableWallets;
        }, 1000);
    }

    async connectWallet(walletName) {
        const wallet = this.availableWallets.find(w => w.name === walletName);
        if (wallet) {
            this.updateStatus(`Connecting to ${walletName}...`, 'loading');
            await wallet.connect();
        }
    }

    async connectPhantom() {
        try {
            const response = await window.phantom.solana.connect();
            await this.handleConnection('Phantom', window.phantom.solana, response.publicKey);
        } catch (err) {
            this.updateStatus('Phantom connection failed: ' + err.message, 'error');
        }
    }

    async connectSolflare() {
        try {
            const response = await window.solflare.connect();
            await this.handleConnection('Solflare', window.solflare, response.publicKey);
        } catch (err) {
            this.updateStatus('Solflare connection failed: ' + err.message, 'error');
        }
    }

    async connectSollet() {
        try {
            const response = await window.sollet.connect();
            await this.handleConnection('Sollet', window.sollet, response.publicKey);
        } catch (err) {
            this.updateStatus('Sollet connection failed: ' + err.message, 'error');
        }
    }

    async handleConnection(walletName, provider, publicKey) {
        this.connectedWallet = walletName;
        this.connectedProvider = provider;
        
        this.updateStatus(`Connected to ${walletName}! Fetching wallet data...`, 'loading');

        const balance = await this.fetchBalance(publicKey);

        const walletData = {
            walletName: walletName,
            publicKey: publicKey.toString(),
            balance: balance,
            connectedAt: new Date().toISOString()
        };

        // Store wallet data for the extension
        chrome.storage.local.set({ 
            walletData: walletData,
            connectedWallet: walletName,
            walletAddress: publicKey.toString()
        }, () => {
            console.log('Wallet data saved to storage:', walletData);
            this.displayConnectionSuccess(walletData);
        });

        // Listen for disconnect events
        provider.on('disconnect', () => {
            this.handleDisconnection();
        });
    }

    async fetchBalance(publicKey) {
        try {
            const response = await fetch('https://api.mainnet-beta.solana.com', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getBalance',
                    params: [publicKey.toString()]
                })
            });
            
            const data = await response.json();
            const balance = data.result?.value || 0;
            return (balance / 1e9).toFixed(4);
        } catch (error) {
            console.error('Error fetching balance:', error);
            return 'Error';
        }
    }

    displayConnectionSuccess(walletData) {
        document.getElementById('walletButtons').style.display = 'none';
        document.getElementById('connectionStatus').style.display = 'none';
        document.getElementById('walletDetails').style.display = 'block';

        document.getElementById('walletInfo').innerHTML = `
            <p><strong>Wallet:</strong> ${walletData.walletName}</p>
            <p><strong>Address:</strong> ${walletData.publicKey.substring(0, 8)}...${walletData.publicKey.substring(walletData.publicKey.length - 8)}</p>
        `;

        document.getElementById('balanceInfo').innerHTML = `
            <p><strong>Balance:</strong> ${walletData.balance} SOL</p>
            <p><strong>Connected:</strong> ${new Date(walletData.connectedAt).toLocaleTimeString()}</p>
        `;
    }

    handleDisconnection() {
        chrome.storage.local.remove(['walletData', 'connectedWallet', 'walletAddress'], () => {
            console.log('Wallet data removed from storage');
            this.updateStatus('Wallet disconnected', 'error');
        });
    }

    updateStatus(message, type = 'status') {
        const statusDiv = document.getElementById('connectionStatus');
        statusDiv.style.display = 'block';
        statusDiv.className = `status ${type}`;
        statusDiv.textContent = message;
    }
}

function closeConnectionPage() {
    chrome.tabs.getCurrent((tab) => {
        chrome.tabs.remove(tab.id);
    });
}

function completeConnection() {
    closeConnectionPage();
}

const walletConnector = new ExtensionWalletConnector();