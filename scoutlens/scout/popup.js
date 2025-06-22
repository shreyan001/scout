// Scout Popup JavaScript - Web3 AI Agent (Manual Wallet Address Version)
console.log('Scout popup script loaded - timestamp:', new Date().toISOString());

// Debug: Check if all DOM elements are available
document.addEventListener('DOMContentLoaded', () => {
    console.log('Scout: DOM fully loaded');
    initializeScout();
});

// DOM elements
const elements = {
    // Wallet address elements
    walletSection: document.getElementById('walletSection'),
    walletAddressInput: document.getElementById('walletAddressInput'),
    saveAddressBtn: document.getElementById('saveAddressBtn'),
    clearAddressBtn: document.getElementById('clearAddressBtn'),
    walletStatus: document.getElementById('walletStatus'),
    storedAddress: document.getElementById('storedAddress'),
    
    // Scout action elements
    scanPageBtn: document.getElementById('scanPageBtn'),
    ocrScanBtn: document.getElementById('ocrScanBtn'),
    tokenLookupBtn: document.getElementById('tokenLookupBtn'),
    
    // Tool elements
    highlightTokensBtn: document.getElementById('highlightTokensBtn'),
    extractAddressesBtn: document.getElementById('extractAddressesBtn'),
    riskAnalysisBtn: document.getElementById('riskAnalysisBtn'),
    priceAlertsBtn: document.getElementById('priceAlertsBtn'),
    
    // Results elements
    scanResults: document.getElementById('scanResults'),
    resultsContainer: document.getElementById('resultsContainer'),
    tokenAnalysis: document.getElementById('tokenAnalysis'),
    tokenData: document.getElementById('tokenData'),
    
    // Footer elements
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    settingsBtn: document.getElementById('settingsBtn'),
    helpBtn: document.getElementById('helpBtn'),
    
    // Utility elements
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText'),
    toastContainer: document.getElementById('toastContainer')
};

// Scout state
let scoutState = {
    walletAddress: null,
    scanResults: null,
    isScanning: false
};

// Initialize Scout popup
async function initializeScout() {
    console.log('Scout: Starting initialization');
    
    try {
        showLoading('Initializing Scout...');
        
        // Add small delay to ensure DOM is fully ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Scout: Setting up event listeners');
        setupEventListeners();
        
        console.log('Scout: Loading stored wallet address');
        await loadStoredWalletAddress();
        
        console.log('Scout: Updating UI state');
        updateUIState();
        
        console.log('Scout: Initialization complete');
        updateStatus('Ready', 'success');
        
    } catch (error) {
        console.error('Error initializing Scout:', error);
        updateStatus('Initialization Error', 'error');
        showToast('Failed to initialize Scout: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Load stored wallet address from chrome.storage.local
async function loadStoredWalletAddress() {
    try {
        const result = await chrome.storage.local.get(['scoutWalletAddress']);
        if (result.scoutWalletAddress) {
            scoutState.walletAddress = result.scoutWalletAddress;
            displayStoredAddress(result.scoutWalletAddress);
            console.log('Scout: Loaded stored wallet address:', result.scoutWalletAddress);
        }
    } catch (error) {
        console.error('Error loading stored wallet address:', error);
    }
}

// Display stored wallet address in UI
function displayStoredAddress(address) {
    if (address && isValidEthereumAddress(address)) {
        elements.walletStatus.classList.remove('hidden');
        elements.clearAddressBtn.classList.remove('hidden');
        
        // Format address for display
        const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
        elements.storedAddress.textContent = shortAddress;
        elements.storedAddress.title = address;
        
        // Clear the input field since address is stored
        elements.walletAddressInput.value = '';
        elements.walletAddressInput.placeholder = 'Address saved! Enter new address to update';
    } else {
        elements.walletStatus.classList.add('hidden');
        elements.clearAddressBtn.classList.add('hidden');
        elements.walletAddressInput.placeholder = '0x1234...abcd (optional)';
    }
}

// Validate Ethereum address format
function isValidEthereumAddress(address) {
    if (!address || typeof address !== 'string') {
        return false;
    }
    
    // Basic validation: starts with 0x and is 42 characters long
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
}

// Save wallet address to storage
async function saveWalletAddress() {
    try {
        const inputAddress = elements.walletAddressInput.value.trim();
        
        if (!inputAddress) {
            showToast('Please enter a wallet address', 'warning');
            return;
        }
        
        if (!isValidEthereumAddress(inputAddress)) {
            showToast('Please enter a valid Ethereum address (0x...)', 'error');
            return;
        }
        
        showLoading('Saving wallet address...');
        
        // Save to chrome storage
        await chrome.storage.local.set({ scoutWalletAddress: inputAddress });
        
        // Update state
        scoutState.walletAddress = inputAddress;
        
        // Update UI
        displayStoredAddress(inputAddress);
        
        showToast('Wallet address saved successfully!', 'success');
        updateStatus('Address Saved', 'success');
        
    } catch (error) {
        console.error('Error saving wallet address:', error);
        showToast('Failed to save wallet address: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Clear stored wallet address
async function clearWalletAddress() {
    try {
        showLoading('Clearing wallet address...');
        
        // Remove from chrome storage
        await chrome.storage.local.remove(['scoutWalletAddress']);
        
        // Update state
        scoutState.walletAddress = null;
        
        // Update UI
        displayStoredAddress(null);
        
        showToast('Wallet address cleared', 'info');
        updateStatus('Address Cleared', 'info');
        
    } catch (error) {
        console.error('Error clearing wallet address:', error);
        showToast('Failed to clear wallet address: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Wallet address management
    elements.saveAddressBtn?.addEventListener('click', saveWalletAddress);
    elements.clearAddressBtn?.addEventListener('click', clearWalletAddress);
    
    // Enter key on input field
    elements.walletAddressInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveWalletAddress();
        }
    });
    
    // Input validation on typing
    elements.walletAddressInput?.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value && !value.startsWith('0x')) {
            e.target.value = '0x' + value.replace(/^0x/, '');
        }
    });
    
    // Scout action buttons
    elements.scanPageBtn?.addEventListener('click', scanPage);
    elements.ocrScanBtn?.addEventListener('click', ocrScan);
    elements.tokenLookupBtn?.addEventListener('click', tokenLookup);
    
    // Tool buttons
    elements.highlightTokensBtn?.addEventListener('click', highlightTokens);
    elements.extractAddressesBtn?.addEventListener('click', extractAddresses);
    elements.riskAnalysisBtn?.addEventListener('click', riskAnalysis);
    elements.priceAlertsBtn?.addEventListener('click', priceAlerts);
    
    // Footer buttons
    elements.settingsBtn?.addEventListener('click', showSettings);
    elements.helpBtn?.addEventListener('click', showHelp);
}

// Update UI state
function updateUIState() {
    // No need to disable buttons since wallet address is optional
    console.log('Scout: UI state updated');
}
        const response = await chrome.tabs.sendMessage(tab.id, {
            type: 'SHOW_WALLET_POPUP'
        });
        
        if (response && response.success) {
            updateStatus('Wallet popup shown', 'info');
            showToast('Complete wallet connection on the page', 'info');
        } else {
            throw new Error('Failed to show wallet popup');
        }
        
    } catch (error) {
        console.error('Error showing wallet popup:', error);
        updateStatus('Connection Failed', 'error');
        showToast('Failed to show wallet popup: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Disconnect wallet
async function disconnectWallet() {
    try {
        await chrome.storage.local.remove('walletState');
        showWalletDisconnected();
        showToast('Wallet disconnected', 'info');
        updateStatus('Disconnected', 'warning');
    } catch (error) {
        console.error('Error disconnecting wallet:', error);
        showToast('Failed to disconnect', 'error');
    }
}

// Scout scanning functions
async function scanPage() {
    if (!scoutState.walletConnected) {
        showToast('Please connect your wallet first', 'warning');
        return;
    }
    
    try {
        showLoading('Scanning page for Web3 content...');
        scoutState.isScanning = true;
        
        // Send message to content script to scan page
        const response = await sendMessageToContentScript('SCOUT_SCAN_PAGE');
        
        if (response.success) {
            displayScanResults(response.results);
            showToast('Page scan completed!', 'success');
        } else {
            throw new Error(response.error || 'Scan failed');
        }
    } catch (error) {
        console.error('Error scanning page:', error);
        showToast(`Scan failed: ${error.message}`, 'error');
    } finally {
        hideLoading();
        scoutState.isScanning = false;
    }
}

async function ocrScan() {
    if (!scoutState.walletConnected) {
        showToast('Please connect your wallet first', 'warning');
        return;
    }
    
    try {
        showLoading('Performing OCR scan...');
        
        // Send message to content script to perform OCR
        const response = await sendMessageToContentScript('SCOUT_OCR_SCAN');
        
        if (response.success) {
            displayScanResults(response.results);
            showToast('OCR scan completed!', 'success');
        } else {
            throw new Error(response.error || 'OCR scan failed');
        }
    } catch (error) {
        console.error('Error performing OCR scan:', error);
        showToast(`OCR scan failed: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

async function tokenLookup() {
    if (!scoutState.walletConnected) {
        showToast('Please connect your wallet first', 'warning');
        return;
    }
    
    try {
        showLoading('Looking up tokens...');
        
        // Send message to background script for token lookup
        const response = await chrome.runtime.sendMessage({
            type: 'TOKEN_LOOKUP',
            walletAddress: scoutState.walletAddress
        });
        
        if (response.success) {
            displayTokenAnalysis(response.data);
            showToast('Token lookup completed!', 'success');
        } else {
            throw new Error(response.error || 'Token lookup failed');
        }
    } catch (error) {
        console.error('Error performing token lookup:', error);
        showToast(`Token lookup failed: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Quick tool functions
async function highlightTokens() {
    try {
        const response = await sendMessageToContentScript('HIGHLIGHT_TOKENS');
        if (response.success) {
            showToast('Tokens highlighted!', 'success');
        }
    } catch (error) {
        showToast('Failed to highlight tokens', 'error');
    }
}

async function extractAddresses() {
    try {
        const response = await sendMessageToContentScript('EXTRACT_ADDRESSES');
        if (response.success) {
            displayScanResults({ addresses: response.addresses });
            showToast(`Found ${response.addresses.length} addresses`, 'success');
        }
    } catch (error) {
        showToast('Failed to extract addresses', 'error');
    }
}

async function riskAnalysis() {
    try {
        showLoading('Analyzing risks...');
        const response = await sendMessageToContentScript('RISK_ANALYSIS');
        if (response.success) {
            displayScanResults({ risks: response.risks });
            showToast('Risk analysis completed!', 'success');
        }
    } catch (error) {
        showToast('Risk analysis failed', 'error');
    } finally {
        hideLoading();
    }
}

async function priceAlerts() {
    showToast('Price alerts feature coming soon!', 'info');
}

// Display functions
function displayScanResults(results) {
    elements.scanResults.classList.remove('hidden');
    
    let html = '<div class="scan-result-item">';
    
    if (results.tokens && results.tokens.length > 0) {
        html += `<h4>🪙 Tokens Found (${results.tokens.length})</h4>`;
        results.tokens.forEach(token => {
            html += `<div class="token-item">
                <span class="token-symbol">${token.symbol}</span>
                <span class="token-address">${token.address ? token.address.slice(0, 8) + '...' : 'N/A'}</span>
            </div>`;
        });
    }
    
    if (results.addresses && results.addresses.length > 0) {
        html += `<h4>📋 Addresses Found (${results.addresses.length})</h4>`;
        results.addresses.forEach(address => {
            html += `<div class="address-item">
                <span class="address-value">${address.slice(0, 10)}...${address.slice(-6)}</span>
            </div>`;
        });
    }
    
    if (results.risks && results.risks.length > 0) {
        html += `<h4>⚠️ Risk Factors (${results.risks.length})</h4>`;
        results.risks.forEach(risk => {
            html += `<div class="risk-item ${risk.level}">
                <span class="risk-description">${risk.description}</span>
                <span class="risk-level">${risk.level}</span>
            </div>`;
        });
    }
    
    html += '</div>';
    elements.resultsContainer.innerHTML = html;
}

function displayTokenAnalysis(data) {
    elements.tokenAnalysis.classList.remove('hidden');
    
    let html = '<div class="token-analysis-content">';
    
    if (data.balance) {
        html += `<div class="balance-info">
            <h4>💰 Portfolio Balance</h4>
            <p class="balance-value">${data.balance} ETH</p>
        </div>`;
    }
    
    if (data.tokens) {
        html += `<div class="token-holdings">
            <h4>🪙 Token Holdings</h4>`;
        data.tokens.forEach(token => {
            html += `<div class="holding-item">
                <span class="token-name">${token.name}</span>
                <span class="token-amount">${token.amount}</span>
            </div>`;
        });
        html += '</div>';
    }
    
    html += '</div>';
    elements.tokenData.innerHTML = html;
}

// Setup event listeners
function setupEventListeners() {
    // Wallet connection
    if (elements.connectWalletBtn) {
        elements.connectWalletBtn.addEventListener('click', connectWallet);
    }
    if (elements.disconnectBtn) {
        elements.disconnectBtn.addEventListener('click', disconnectWallet);
    }
    
    // Scout actions
    if (elements.scanPageBtn) {
        elements.scanPageBtn.addEventListener('click', scanPage);
    }
    if (elements.ocrScanBtn) {
        elements.ocrScanBtn.addEventListener('click', ocrScan);
    }
    if (elements.tokenLookupBtn) {
        elements.tokenLookupBtn.addEventListener('click', tokenLookup);
    }
    
    // Quick tools
    if (elements.highlightTokensBtn) {
        elements.highlightTokensBtn.addEventListener('click', highlightTokens);
    }
    if (elements.extractAddressesBtn) {
        elements.extractAddressesBtn.addEventListener('click', extractAddresses);
    }
    if (elements.riskAnalysisBtn) {
        elements.riskAnalysisBtn.addEventListener('click', riskAnalysis);
    }
    if (elements.priceAlertsBtn) {
        elements.priceAlertsBtn.addEventListener('click', priceAlerts);
    }
    
    // Footer actions
    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }
    if (elements.helpBtn) {
        elements.helpBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://github.com/your-username/scout' });
        });
    }
}

// Handle messages from wallet popup window
window.addEventListener('message', (event) => {
    if (event.data && event.data.source === 'scout-wallet-popup') {
        console.log('Scout: Received message from wallet popup:', event.data);
        
        switch (event.data.type) {
            case 'WALLET_CONNECTED':
                handleWalletConnected(event.data.data);
                break;
            case 'WALLET_ERROR':
                handleWalletError(event.data.data);
                break;
            case 'WALLET_POPUP_CLOSED':
                updateStatus('Wallet popup closed', 'warning');
                break;
        }
    }
});

// Handle successful wallet connection
function handleWalletConnected(data) {
    console.log('Scout: Wallet connected successfully:', data);
    
    scoutState.walletConnected = true;
    scoutState.walletAddress = data.account;
    scoutState.currentNetwork = data.chainId;
    
    showWalletConnected(data);
    updateStatus('Wallet Connected', 'success');
    showToast('Wallet connected successfully!', 'success');
    
    // Enable buttons
    updateUIState();
    
    // Store wallet state
    chrome.storage.local.set({
        walletState: {
            connected: true,
            account: data.account,
            chainId: data.chainId
        }
    });
}

// Handle wallet connection error
function handleWalletError(data) {
    console.error('Scout: Wallet connection error:', data);
    
    updateStatus('Connection Failed', 'error');
    showToast('Wallet connection failed: ' + data.error, 'error');
}

// Add debug button to help troubleshoot (remove in production)
function addDebugButton() {
    const debugBtn = document.createElement('button');
    debugBtn.textContent = '🐛 Debug Info';
    debugBtn.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        z-index: 9999;
        padding: 4px 8px;
        font-size: 10px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    `;
    
    debugBtn.onclick = () => {
        const debug = {
            timestamp: new Date().toISOString(),
            readyState: document.readyState,
            elementsFound: Object.keys(elements).map(key => ({
                [key]: !!elements[key]
            })),
            scoutState: scoutState,
            loadingOverlayHidden: elements.loadingOverlay?.classList.contains('hidden'),
            backgroundScriptAvailable: !!chrome.runtime,
        };
        
        console.log('Scout Debug Info:', debug);
        alert('Debug info logged to console');
    };
    
    document.body.appendChild(debugBtn);
}

// Add debug button in development
if (chrome.runtime.getManifest().name.includes('Scout')) {
    setTimeout(addDebugButton, 1000);
}

// Utility functions
function updateUIState() {
    if (scoutState.walletConnected) {
        enableScoutActions(true);
        updateStatus('Connected', 'success');
    } else {
        enableScoutActions(false);
        updateStatus('Not connected', 'warning');
    }
}

function updateStatus(text, type = 'info') {
    if (elements.statusText) {
        elements.statusText.textContent = text;
    }
    
    if (elements.statusIndicator) {
        elements.statusIndicator.className = `status-indicator ${type}`;
        
        // Update indicator color based on type
        const colors = {
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#6b7280'
        };
        elements.statusIndicator.style.color = colors[type] || colors.info;
    }
}

function showLoading(text = 'Loading...') {
    console.log('Scout: Showing loading:', text);
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.remove('hidden');
    }
    if (elements.loadingText) {
        elements.loadingText.textContent = text;
    }
}

function hideLoading() {
    console.log('Scout: Hiding loading');
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.add('hidden');
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    if (elements.toastContainer) {
        elements.toastContainer.appendChild(toast);
    }
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Communication with content script
function sendMessageToContentScript(type, data = {}) {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { type, ...data }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error sending message:', chrome.runtime.lastError);
                        resolve({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        resolve(response || { success: false });
                    }
                });
            } else {
                resolve({ success: false, error: 'No active tab' });
            }
        });
    });
}

// Initialize Scout when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeScout);
} else {
    initializeScout();
}

// Safety mechanism - force hide loading after 10 seconds
setTimeout(() => {
    console.log('Scout: Safety timeout - forcing loading to hide');
    hideLoading();
    if (elements.statusText && elements.statusText.textContent === '') {
        updateStatus('Ready (Timeout)', 'warning');
    }
}, 10000);

// Fallback initialization if background script fails
function initializeFallback() {
    console.log('Scout: Running fallback initialization');
    
    // Hide loading immediately
    hideLoading();
    
    // Show wallet as disconnected
    showWalletDisconnected();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update UI state
    updateUIState();
    
    // Update status
    updateStatus('Ready (Offline Mode)', 'warning');
    
    // Show a toast explaining the situation
    showToast('Background script not responding. Some features may be limited.', 'warning');
}
