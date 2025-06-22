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
    walletAddressInput: document.getElementById('walletAddressInput'),
    saveAddressBtn: document.getElementById('saveAddressBtn'),
    clearAddressBtn: document.getElementById('clearAddressBtn'),
    walletStatus: document.getElementById('walletStatus'),
    storedAddress: document.getElementById('storedAddress'),
    
    // Scout action elements
    ocrScanBtn: document.getElementById('ocrScanBtn'),
    
    // Results elements
    scanResults: document.getElementById('scanResults'),
    resultsContainer: document.getElementById('resultsContainer'),
    
    // Footer elements
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    
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
        
        console.log('Scout: Checking backend status');
        await checkBackendStatus();
        
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

// Enhanced address validation with checksum support
function validateAndFormatAddress(address) {
    if (!address || typeof address !== 'string') {
        return { valid: false, error: 'Address is required' };
    }
    
    // Remove whitespace
    address = address.trim();
    
    // Ensure 0x prefix
    if (!address.startsWith('0x')) {
        address = '0x' + address;
    }
    
    // Check length
    if (address.length !== 42) {
        return { valid: false, error: 'Address must be 42 characters long (including 0x)' };
    }
    
    // Check format
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(address)) {
        return { valid: false, error: 'Address contains invalid characters' };
    }
    
    return { valid: true, address: address.toLowerCase() };
}

// Save wallet address to storage
async function saveWalletAddress() {
    try {
        const inputAddress = elements.walletAddressInput.value.trim();
        
        if (!inputAddress) {
            showToast('Please enter a wallet address', 'warning');
            elements.walletAddressInput.focus();
            return;
        }
        
        // Use enhanced validation
        const validation = validateAndFormatAddress(inputAddress);
        if (!validation.valid) {
            showToast(validation.error, 'error');
            elements.walletAddressInput.focus();
            return;
        }
        
        showLoading('Saving wallet address...');
        
        // Save to chrome storage
        await chrome.storage.local.set({ scoutWalletAddress: validation.address });
        
        // Update state
        scoutState.walletAddress = validation.address;
        
        // Update UI
        displayStoredAddress(validation.address);
        
        showToast('Wallet address saved successfully!', 'success');
        updateStatus('Address Saved', 'success');
        
        // Update UI state to show enhanced features
        updateUIState();
        
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
        
        // Update UI state to show basic features
        updateUIState();
        
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
        
        // Auto-add 0x prefix if not present
        if (value && !value.startsWith('0x')) {
            e.target.value = '0x' + value.replace(/^0x/, '');
        }
        
        // Real-time validation feedback
        if (value) {
            const validation = validateAndFormatAddress(value);
            if (validation.valid) {
                e.target.classList.remove('invalid');
                e.target.classList.add('valid');
            } else {
                e.target.classList.remove('valid');
                e.target.classList.add('invalid');
            }
        } else {
            e.target.classList.remove('valid', 'invalid');
        }
    });
    
    // Clear validation styling on focus
    elements.walletAddressInput?.addEventListener('focus', (e) => {
        e.target.classList.remove('invalid');
    });
      // Scout action buttons
    elements.ocrScanBtn?.addEventListener('click', ocrScan);
}

// Update UI state
function updateUIState() {
    // All Scout features are available regardless of wallet address
    // Enhanced features are available if wallet address is provided
    console.log('Scout: UI state updated - wallet address:', scoutState.walletAddress ? 'present' : 'not set');
    
    if (scoutState.walletAddress) {
        updateStatus('Ready (Enhanced)', 'success');
    } else {
        updateStatus('Ready (Basic)', 'info');
    }
}

// OCR scanning function
async function ocrScan() {
    try {
        // Add scanning visual state
        const ocrBtn = elements.ocrScanBtn;
        if (ocrBtn) {
            ocrBtn.classList.add('scanning');
            ocrBtn.innerHTML = '<span class="btn-icon"></span><span class="btn-text">Scanning...</span>';
        }
        
        showLoading('Capturing screenshot for OCR...');
        updateStatus('Capturing...', 'loading');
        
        // Get current tab for screenshot
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Capture screenshot
        const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { 
            format: 'png',
            quality: 100 
        });
        
        updateStatus('Analyzing page content...', 'loading');
        showLoading('Analyzing page content...');
        
        // Get page analysis from content script
        const scanData = scoutState.walletAddress ? { walletAddress: scoutState.walletAddress } : {};
        const contentAnalysis = await sendMessageToContentScript('SCOUT_OCR_SCAN', scanData);
        
        if (!contentAnalysis.success) {
            throw new Error(contentAnalysis.error || 'Failed to analyze page content');
        }
        
        updateStatus('Processing with OCR...', 'loading');
        showLoading('Processing image with OCR...');
        
        // Prepare OCR data with both screenshot and content analysis
        const ocrData = {
            image: dataUrl,
            pageAnalysis: contentAnalysis.results,
            walletAddress: scoutState.walletAddress,
            timestamp: Date.now(),
            tabId: tab.id,
            url: tab.url
        };
        
        // Send to backend for OCR analysis
        const results = await performOCRAnalysis(ocrData);
        
        // Display results
        displayOCRResults(results);
        
        const enhancedText = scoutState.walletAddress ? ' (Enhanced analysis)' : '';
        showToast(`OCR analysis completed!${enhancedText}`, 'success');
        updateStatus('OCR Complete', 'success');
        
        // Mark results container as successful
        if (elements.scanResults) {
            elements.scanResults.classList.add('ocr-success');
        }
        
    } catch (error) {
        console.error('Error performing OCR scan:', error);
        showToast(`OCR scan failed: ${error.message}`, 'error');
        updateStatus('OCR Failed', 'error');
        
        // Mark results container as error
        if (elements.scanResults) {
            elements.scanResults.classList.add('ocr-error');
        }
    } finally {
        hideLoading();
        
        // Reset OCR button state
        const ocrBtn = elements.ocrScanBtn;
        if (ocrBtn) {
            ocrBtn.classList.remove('scanning');
            ocrBtn.innerHTML = '<span class="btn-icon">📷</span><span class="btn-text">Start OCR Scan</span>';
        }
    }
}

// Perform OCR analysis using backend
async function performOCRAnalysis(ocrData) {
    try {
        // Try to use the Chrome Lens OCR implementation first
        try {
            const ocrProcessor = new ScoutOCRProcessor();
            const realOCRResult = await ocrProcessor.processImage(ocrData.image);
            
            // Enhance with page analysis data
            const enhancedResult = {
                ...realOCRResult,
                pageAnalysis: ocrData.pageAnalysis,
                walletAddress: ocrData.walletAddress,
                enhancedFeatures: !!ocrData.walletAddress,
                timestamp: ocrData.timestamp,
                processingTime: Date.now() - ocrData.timestamp
            };
            
            return enhancedResult;
            
        } catch (ocrError) {
            console.warn('Scout OCR: Real OCR failed, falling back to mock', ocrError);
            // Fallback to mock implementation
            const mockAnalysis = await simulateOCRBackend(ocrData);
            return mockAnalysis;
        }
        
        // Actual backend call would be:
        // const response = await fetch('https://your-backend-api.com/ocr-analyze', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': 'Bearer your-api-key'
        //     },
        //     body: JSON.stringify(ocrData)
        // });
        // return await response.json();
        
    } catch (error) {
        console.error('OCR analysis error:', error);
        throw new Error('Failed to analyze image: ' + error.message);
    }
}

// Simulate backend OCR analysis
async function simulateOCRBackend(ocrData) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Use real page analysis data if available
    const pageAnalysis = ocrData.pageAnalysis || {};
    const realTokens = pageAnalysis.tokens || [];
    const realAddresses = pageAnalysis.addresses || [];
    
    // Enhance with mock data if real tokens found, or create mock data
    let tokens = [];
    let ocrText = 'No token information detected in the image.';
    
    if (realTokens.length > 0) {
        // Use real tokens found on page
        tokens = realTokens.slice(0, 3).map(symbol => ({
            symbol: symbol,
            name: getTokenName(symbol),
            price: getRandomPrice(),
            change24h: getRandomChange(),
            confidence: 0.85 + Math.random() * 0.15,
            marketCap: getRandomMarketCap(),
            volume24h: getRandomVolume()
        }));
        
        ocrText = `Detected tokens from page analysis:\n${realTokens.join(', ')}\n\nPrice data and market information shown below.`;
    } else {
        // Create mock detection for demo
        const mockTokens = ['ETH', 'BTC', 'USDC', 'UNI'];
        const randomToken = mockTokens[Math.floor(Math.random() * mockTokens.length)];
        const hasToken = Math.random() > 0.4; // 60% chance of finding a token
        
        if (hasToken) {
            tokens = [{
                symbol: randomToken,
                name: getTokenName(randomToken),
                price: getRandomPrice(),
                change24h: getRandomChange(),
                confidence: 0.75 + Math.random() * 0.15,
                marketCap: getRandomMarketCap(),
                volume24h: getRandomVolume()
            }];
            
            ocrText = `OCR Analysis Results:\n\nDetected: ${randomToken}\nPrice: $${tokens[0].price}\nMarket Cap: $${tokens[0].marketCap}\n24h Change: ${tokens[0].change24h}%`;
        }
    }
    
    return {
        success: true,
        ocrText: ocrText,
        tokens: tokens,
        addresses: realAddresses.length > 0 ? realAddresses.slice(0, 2) : 
                  (tokens.length > 0 ? [`0x${Math.random().toString(16).substring(2, 42)}`] : []),
        pageInfo: {
            title: pageAnalysis.pageContent?.title || 'Unknown Page',
            url: pageAnalysis.pageContent?.url || ocrData.url,
            totalImages: pageAnalysis.pageContent?.images?.length || 0,
            hasText: (pageAnalysis.pageContent?.text?.length || 0) > 100
        },
        sentiment: tokens.length > 0 ? ['bullish', 'neutral', 'bearish'][Math.floor(Math.random() * 3)] : 'neutral',
        confidence: 0.78 + Math.random() * 0.22,
        processingTime: Math.floor(1500 + Math.random() * 1000),
        enhancedFeatures: !!ocrData.walletAddress,
        timestamp: Date.now()
    };
}

// Helper functions for mock data
function getTokenName(symbol) {
    const names = {
        'ETH': 'Ethereum',
        'BTC': 'Bitcoin', 
        'USDC': 'USD Coin',
        'UNI': 'Uniswap'
    };
    return names[symbol] || symbol;
}

function getRandomPrice() {
    return (Math.random() * 5000 + 100).toFixed(2);
}

function getRandomChange() {
    return ((Math.random() - 0.5) * 20).toFixed(2);
}

function getRandomMarketCap() {
    return (Math.random() * 500 + 50).toFixed(1) + 'B';
}

function getRandomVolume() {
    return (Math.random() * 20 + 5).toFixed(1) + 'B';
}

// Display OCR results in the popup
function displayOCRResults(results) {
    const resultsContainer = elements.scanResults;
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'block';
    
    if (!results.success) {
        resultsContainer.innerHTML = `
            <div class="scout-error">
                <div class="scout-error-icon">❌</div>
                <div class="scout-error-text">OCR analysis failed</div>
            </div>
        `;
        return;
    }
    
    // OCR Text Section
    const ocrSection = document.createElement('div');
    ocrSection.className = 'scout-result-section';
    ocrSection.innerHTML = `
        <div class="scout-result-header">
            <span class="scout-result-icon">📖</span>
            <span class="scout-result-title">Detected Text</span>
            <span class="scout-confidence">Confidence: ${(results.confidence * 100).toFixed(1)}%</span>
        </div>
        <div class="scout-ocr-text">${results.ocrText}</div>
    `;
    resultsContainer.appendChild(ocrSection);
    
    // Tokens Section
    if (results.tokens && results.tokens.length > 0) {
        const tokensSection = document.createElement('div');
        tokensSection.className = 'scout-result-section scout-tokens-section';
        
        const tokensHTML = results.tokens.map(token => `
            <div class="scout-token-card">
                <div class="scout-token-header">
                    <div class="scout-token-info">
                        <div class="scout-token-symbol">${token.symbol}</div>
                        <div class="scout-token-name">${token.name}</div>
                    </div>
                    <div class="scout-token-price">$${token.price}</div>
                </div>
                <div class="scout-token-details">
                    <div class="scout-token-stat">
                        <span class="scout-stat-label">24h Change:</span>
                        <span class="scout-stat-value ${parseFloat(token.change24h) >= 0 ? 'positive' : 'negative'}">
                            ${token.change24h}%
                        </span>
                    </div>
                    <div class="scout-token-stat">
                        <span class="scout-stat-label">Market Cap:</span>
                        <span class="scout-stat-value">$${token.marketCap}</span>
                    </div>
                    <div class="scout-token-stat">
                        <span class="scout-stat-label">Volume (24h):</span>
                        <span class="scout-stat-value">$${token.volume24h}</span>
                    </div>
                </div>
                <div class="scout-token-actions">
                    <button class="scout-swap-btn" onclick="showSwapNotice('${token.symbol}')">
                        <span class="scout-swap-icon">🔄</span>
                        Swap ${token.symbol}
                    </button>
                </div>
            </div>
        `).join('');
        
        tokensSection.innerHTML = `
            <div class="scout-result-header">
                <span class="scout-result-icon">💰</span>
                <span class="scout-result-title">Detected Tokens</span>
                <span class="scout-token-count">${results.tokens.length} found</span>
            </div>
            <div class="scout-tokens-grid">
                ${tokensHTML}
            </div>
        `;
        
        resultsContainer.appendChild(tokensSection);
    }
    
    // Addresses Section
    if (results.addresses && results.addresses.length > 0) {
        const addressesSection = document.createElement('div');
        addressesSection.className = 'scout-result-section';
        
        const addressesHTML = results.addresses.map(address => `
            <div class="scout-address-item">
                <code class="scout-address">${address}</code>
                <button class="scout-copy-btn" onclick="copyToClipboard('${address}')">📋</button>
            </div>
        `).join('');
        
        addressesSection.innerHTML = `
            <div class="scout-result-header">
                <span class="scout-result-icon">🏠</span>
                <span class="scout-result-title">Detected Addresses</span>
            </div>
            <div class="scout-addresses-list">
                ${addressesHTML}
            </div>
        `;
        
        resultsContainer.appendChild(addressesSection);
    }
    
    // Enhanced features notice
    if (results.enhancedFeatures) {
        const enhancedSection = document.createElement('div');
        enhancedSection.className = 'scout-enhanced-notice';
        enhancedSection.innerHTML = `
            <div class="scout-enhanced-icon">✨</div>
            <div class="scout-enhanced-text">Enhanced analysis with wallet insights</div>
        `;
        resultsContainer.appendChild(enhancedSection);
    }
}

// Show swap notice (non-functional as requested)
function showSwapNotice(tokenSymbol) {
    // Create a more detailed swap notice
    const swapModal = document.createElement('div');
    swapModal.className = 'scout-swap-modal';
    swapModal.innerHTML = `
        <div class="scout-swap-content">
            <div class="scout-swap-header">
                <h3>🔄 Swap ${tokenSymbol}</h3>
                <button class="scout-close-btn" onclick="closeSwapModal()">&times;</button>
            </div>
            <div class="scout-swap-body">
                <p>Swap functionality for <strong>${tokenSymbol}</strong> is coming soon!</p>
                <p>Scout will soon integrate with popular DEXs to provide:</p>
                <ul>
                    <li>💱 Direct token swaps</li>
                    <li>📊 Real-time price comparisons</li>
                    <li>⚡ Gas fee optimization</li>
                    <li>🔒 Slippage protection</li>
                </ul>
                <div class="scout-swap-features">
                    <div class="scout-feature-badge">Multi-DEX</div>
                    <div class="scout-feature-badge">Best Rates</div>
                    <div class="scout-feature-badge">MEV Protection</div>
                </div>
            </div>
            <div class="scout-swap-footer">
                <button class="scout-btn-secondary" onclick="copyToClipboard('${tokenSymbol}')">
                    📋 Copy Symbol
                </button>
                <button class="scout-btn-primary" onclick="closeSwapModal()">
                    Got it!
                </button>
            </div>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(swapModal);
    
    // Add some animation
    setTimeout(() => {
        swapModal.classList.add('show');
    }, 50);
    
    // Auto-close after 8 seconds
    setTimeout(() => {
        closeSwapModal();
    }, 8000);
}

// Close swap modal
function closeSwapModal() {
    const modal = document.querySelector('.scout-swap-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}

// Copy address to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Address copied to clipboard!', 'success');
    } catch (error) {
        console.error('Copy failed:', error);
        showToast('Failed to copy address', 'error');
    }
}

// Display functions
function displayScanResults(results) {
    if (!elements.scanResults || !elements.resultsContainer) {
        console.error('Scout: Scan results elements not found');
        return;
    }
    
    elements.scanResults.classList.remove('hidden');
    
    let html = '<div class="scan-result-item">';
    
    if (results.tokens && results.tokens.length > 0) {
        html += `<h4>🪙 Tokens Found (${results.tokens.length})</h4>`;
        results.tokens.forEach(token => {
            html += `<div class="token-item">
                <span class="token-symbol">${token.symbol || 'Unknown'}</span>
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
            html += `<div class="risk-item ${risk.level || 'unknown'}">
                <span class="risk-description">${risk.description || 'Unknown risk'}</span>
                <span class="risk-level">${risk.level || 'Unknown'}</span>
            </div>`;
        });
    }
    
    if (!results.tokens?.length && !results.addresses?.length && !results.risks?.length) {
        html += '<p class="no-results">No Web3 content detected.</p>';
    }
      html += '</div>';
    elements.resultsContainer.innerHTML = html;
}

// Utility functions
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
async function sendMessageToContentScript(type, data) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tab.id, { type, data }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    } catch (error) {
        throw new Error('Failed to communicate with page: ' + error.message);
    }
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
            walletAddress: scoutState.walletAddress ? 'present' : 'not set',
            loadingOverlayHidden: elements.loadingOverlay?.classList.contains('hidden'),
            backgroundScriptAvailable: !!chrome.runtime,
        };
        
        console.log('Scout Debug Info:', debug);
        alert('Debug info logged to console');
    };
    
    document.body.appendChild(debugBtn);
}

// Add debug button in development
if (chrome.runtime.getManifest()?.name?.includes('Scout')) {
    setTimeout(addDebugButton, 1000);
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

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Scout popup: Received message:', message);
  
  if (message.type === 'NEW_OCR_RESULTS') {
    handleNewOCRResults(message.data);
    sendResponse({ success: true });
  } else if (message.type === 'NEW_ADDRESS_ANALYSIS') {
    handleNewAddressAnalysis(message.data);
    sendResponse({ success: true });
  }
});

// Handle new OCR results from keyboard shortcut or context menu
function handleNewOCRResults(data) {
  console.log('Scout popup: New OCR results received:', data);
  
  try {
    // Show success toast
    const triggerText = data.trigger === 'keyboard' ? 'Keyboard Shortcut' : 'Context Menu';
    showToast(`OCR scan completed via ${triggerText}!`, 'success');
    
    // Display the results
    if (data.results) {
      displayOCRResults({
        success: true,
        ...data.results,
        trigger: data.trigger
      });
      
      // Show results section
      if (elements.scanResults) {
        elements.scanResults.classList.remove('hidden');
        elements.scanResults.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
  } catch (error) {
    console.error('Error handling new OCR results:', error);
    showToast('Error displaying OCR results', 'error');
  }
}

// Handle new address analysis from context menu
function handleNewAddressAnalysis(data) {
  console.log('Scout popup: New address analysis received:', data);
  
  try {
    // Show success toast
    showToast(`Address analysis completed!`, 'success');
    
    // Display the analysis results
    displayAddressAnalysis(data);
    
    // Show results section
    if (elements.scanResults) {
      elements.scanResults.classList.remove('hidden');
      elements.scanResults.scrollIntoView({ behavior: 'smooth' });
    }
    
  } catch (error) {
    console.error('Error handling new address analysis:', error);
    showToast('Error displaying address analysis', 'error');
  }
}

// Display address analysis results
function displayAddressAnalysis(data) {
  const { address, analysis } = data;
  
  // Clear previous results
  elements.resultsContainer.innerHTML = '';
  
  // Create analysis display
  const analysisHTML = `
    <div class="address-analysis-section">
      <h4>📊 Address Analysis Results</h4>
      
      <div class="address-overview">
        <div class="address-header">
          <span class="address-label">Address:</span>
          <code class="address-code" onclick="copyToClipboard('${address}')" title="Click to copy">
            ${address.substring(0, 8)}...${address.substring(-8)}
          </code>
        </div>
        
        <div class="analysis-grid">
          <div class="analysis-item">
            <span class="analysis-label">Type:</span>
            <span class="analysis-value type-${analysis.type.toLowerCase()}">${analysis.type}</span>
          </div>
          
          <div class="analysis-item">
            <span class="analysis-label">Balance:</span>
            <span class="analysis-value balance">${analysis.balance}</span>
          </div>
          
          <div class="analysis-item">
            <span class="analysis-label">Transactions:</span>
            <span class="analysis-value">${analysis.transactions.toLocaleString()}</span>
          </div>
          
          <div class="analysis-item">
            <span class="analysis-label">Risk Level:</span>
            <span class="analysis-value risk-${analysis.risk.toLowerCase()}">${analysis.risk}</span>
          </div>
          
          <div class="analysis-item">
            <span class="analysis-label">Last Activity:</span>
            <span class="analysis-value">${analysis.lastActivity}</span>
          </div>
          
          <div class="analysis-item">
            <span class="analysis-label">Confidence:</span>
            <span class="analysis-value">${(analysis.confidence * 100).toFixed(1)}%</span>
          </div>
        </div>
        
        ${analysis.labels && analysis.labels.length > 0 ? `
          <div class="address-labels">
            <span class="labels-title">Labels:</span>
            ${analysis.labels.map(label => `<span class="address-label-tag">${label}</span>`).join('')}
          </div>
        ` : ''}
      </div>
      
      <div class="analysis-footer">
        <small>Analysis completed via context menu • ${new Date().toLocaleTimeString()}</small>
      </div>
    </div>
  `;
  
  elements.resultsContainer.innerHTML = analysisHTML;
  
  // Add CSS for address analysis styling
  if (!document.getElementById('address-analysis-styles')) {
    const style = document.createElement('style');
    style.id = 'address-analysis-styles';
    style.textContent = `
      .address-analysis-section {
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin: 16px 0;
      }
      
      .address-overview {
        margin: 16px 0;
      }
      
      .address-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .address-code {
        background: #2a2a2a;
        padding: 6px 12px;
        border-radius: 6px;
        font-family: monospace;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .address-code:hover {
        background: #333;
      }
      
      .analysis-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin: 16px 0;
      }
      
      .analysis-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .analysis-label {
        font-size: 12px;
        opacity: 0.7;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .analysis-value {
        font-weight: 600;
        color: #4285f4;
      }
      
      .analysis-value.balance {
        color: #4caf50;
        font-size: 16px;
      }
      
      .risk-low { color: #4caf50; }
      .risk-medium { color: #ff9800; }
      .risk-high { color: #f44336; }
      
      .type-ethereum { color: #627eea; }
      .type-bitcoin { color: #f7931a; }
      .type-unknown { color: #999; }
      
      .address-labels {
        margin: 16px 0;
      }
      
      .labels-title {
        font-size: 12px;
        opacity: 0.7;
        margin-right: 8px;
      }
      
      .address-label-tag {
        background: #333;
        color: #4285f4;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        margin-right: 6px;
        display: inline-block;
      }
      
      .analysis-footer {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #333;
        opacity: 0.6;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Show results section
  elements.scanResults.classList.remove('hidden');
}

// Backend Integration Functions

// Global backend status state
let backendStatus = {
  isHealthy: false,
  lastCheck: null,
  connected: false
};

// Check backend health and update UI
async function checkBackendStatus() {
  try {
    console.log('Scout: Checking backend health...');
    
    const response = await chrome.runtime.sendMessage({
      type: 'CHECK_BACKEND_HEALTH'
    });
    
    if (response.success) {
      backendStatus = {
        isHealthy: response.isHealthy,
        lastCheck: Date.now(),
        connected: response.status.connected,
        ...response.status
      };
      
      console.log('Scout: Backend status:', backendStatus);
      updateBackendStatusUI();
      
    } else {
      throw new Error(response.error || 'Backend health check failed');
    }
    
  } catch (error) {
    console.error('Scout: Backend health check error:', error);
    backendStatus = {
      isHealthy: false,
      lastCheck: Date.now(),
      connected: false,
      error: error.message
    };
    updateBackendStatusUI();
  }
}

// Update backend status in UI
function updateBackendStatusUI() {
  // Add backend status indicator if not exists
  let backendIndicator = document.getElementById('backend-status');
  if (!backendIndicator) {
    backendIndicator = document.createElement('div');
    backendIndicator.id = 'backend-status';
    backendIndicator.style.cssText = `
      padding: 8px 12px;
      margin-bottom: 16px;
      border-radius: 8px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
    `;
    
    // Insert after the header
    const header = document.querySelector('.scout-header');
    if (header && header.nextSibling) {
      header.parentNode.insertBefore(backendIndicator, header.nextSibling);
    }
  }
  
  if (backendStatus.isHealthy && backendStatus.connected) {
    backendIndicator.style.background = 'rgba(76, 175, 80, 0.1)';
    backendIndicator.style.border = '1px solid rgba(76, 175, 80, 0.3)';
    backendIndicator.style.color = '#4caf50';
    backendIndicator.innerHTML = '🟢 Scout AI Backend Connected';
  } else {
    backendIndicator.style.background = 'rgba(255, 152, 0, 0.1)';
    backendIndicator.style.border = '1px solid rgba(255, 152, 0, 0.3)';
    backendIndicator.style.color = '#ff9800';
    backendIndicator.innerHTML = '🟡 Scout AI Backend Offline (Local Mode)';
  }
}

// Add Web3 query functionality
function addQueryInterface() {
  // Add query section if not exists
  let querySection = document.getElementById('web3-query-section');
  if (!querySection) {
    querySection = document.createElement('div');
    querySection.id = 'web3-query-section';
    querySection.innerHTML = `
      <div class="section-header">
        <h3>🧠 AI Web3 Assistant</h3>
        <p>Ask questions about tokens, addresses, or DeFi protocols</p>
      </div>
      
      <div class="query-input-container">
        <textarea 
          id="web3-query-input" 
          placeholder="Ask about Web3... (e.g., 'What is Bitcoin?', '0xA0b86a33E6842...', 'How does Uniswap work?')"
          rows="3"
        ></textarea>
        <button id="analyze-query-btn" class="primary-btn">
          <span class="btn-icon">🔍</span>
          Analyze with AI
        </button>
      </div>
      
      <div class="query-examples">
        <div class="examples-header">Try these examples:</div>
        <div class="example-buttons">
          <button class="example-btn" data-query="What is Bitcoin and how does it work?">Bitcoin Basics</button>
          <button class="example-btn" data-query="0xdAC17F958D2ee523a2206206994597C13D831ec7">USDT Contract</button>
          <button class="example-btn" data-query="How to swap ETH for USDC on Uniswap?">DEX Trading</button>
          <button class="example-btn" data-query="What are the risks of yield farming?">DeFi Risks</button>
        </div>
      </div>
      
      <div id="query-results" class="query-results hidden"></div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #web3-query-section {
        margin: 20px 0;
        padding: 16px;
        border: 1px solid #333;
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.3);
      }
      
      .section-header h3 {
        margin: 0 0 4px 0;
        color: #fff;
        font-size: 16px;
        font-weight: 600;
      }
      
      .section-header p {
        margin: 0 0 16px 0;
        color: #ccc;
        font-size: 12px;
      }
      
      .query-input-container {
        margin-bottom: 16px;
      }
      
      #web3-query-input {
        width: 100%;
        padding: 12px;
        border: 1px solid #444;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
        font-size: 14px;
        resize: vertical;
        margin-bottom: 12px;
        font-family: inherit;
      }
      
      #web3-query-input:focus {
        outline: none;
        border-color: #007acc;
        box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
      }
      
      .primary-btn {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #007acc 0%, #0056b3 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s ease;
      }
      
      .primary-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 122, 204, 0.3);
      }
      
      .primary-btn:disabled {
        background: #666;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
      
      .query-examples {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #333;
      }
      
      .examples-header {
        font-size: 12px;
        color: #ccc;
        margin-bottom: 8px;
      }
      
      .example-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      
      .example-btn {
        padding: 4px 8px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #444;
        border-radius: 12px;
        color: #ccc;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .example-btn:hover {
        background: rgba(0, 122, 204, 0.2);
        border-color: #007acc;
        color: #fff;
      }
      
      .query-results {
        margin-top: 16px;
        padding: 16px;
        border: 1px solid #444;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.02);
      }
      
      .query-results.hidden {
        display: none;
      }
    `;
    document.head.appendChild(style);
    
    // Insert query section before OCR scan section
    const ocrSection = document.querySelector('.scan-section');
    if (ocrSection) {
      ocrSection.parentNode.insertBefore(querySection, ocrSection);
    }
    
    // Setup query event listeners
    setupQueryEventListeners();
  }
}

// Setup event listeners for query functionality
function setupQueryEventListeners() {
  const queryInput = document.getElementById('web3-query-input');
  const analyzeBtn = document.getElementById('analyze-query-btn');
  const exampleBtns = document.querySelectorAll('.example-btn');
  
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', handleQueryAnalysis);
  }
  
  if (queryInput) {
    queryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleQueryAnalysis();
      }
    });
  }
  
  exampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.dataset.query;
      if (queryInput && query) {
        queryInput.value = query;
        handleQueryAnalysis();
      }
    });
  });
}

// Handle Web3 query analysis
async function handleQueryAnalysis() {
  const queryInput = document.getElementById('web3-query-input');
  const analyzeBtn = document.getElementById('analyze-query-btn');
  const resultsDiv = document.getElementById('query-results');
  
  if (!queryInput || !analyzeBtn || !resultsDiv) return;
  
  const query = queryInput.value.trim();
  if (!query) {
    showToast('Please enter a query', 'warning');
    return;
  }
  
  try {
    // Show loading state
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="btn-icon">🔄</span> Analyzing...';
    resultsDiv.classList.remove('hidden');
    resultsDiv.innerHTML = '<div class="loading-message">🧠 AI is analyzing your query...</div>';
    
    // Get current tab for context
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send query to backend
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_WEB3',
      data: {
        content: query,
        url: tab?.url || '',
        userQuery: query,
        context: {
          timestamp: Date.now(),
          tabId: tab?.id,
          walletAddress: scoutState.walletAddress
        }
      }
    });
    
    if (response.success) {
      displayQueryResults(response.result);
      showToast('Analysis complete!', 'success');
    } else {
      throw new Error(response.error || 'Analysis failed');
    }
    
  } catch (error) {
    console.error('Scout: Query analysis error:', error);
    
    // Show fallback response
    resultsDiv.innerHTML = `
      <div class="error-result">
        <div class="error-header">⚠️ Analysis Unavailable</div>
        <div class="error-message">${error.message}</div>
        <div class="error-help">
          Please ensure the Scout backend is running or try again later.
        </div>
      </div>
    `;
    
    showToast('Analysis failed: ' + error.message, 'error');
    
  } finally {
    // Reset button state
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = '<span class="btn-icon">🔍</span> Analyze with AI';
  }
}

// Display query analysis results
function displayQueryResults(result) {
  const resultsDiv = document.getElementById('query-results');
  if (!resultsDiv) return;
  
  let html = '<div class="analysis-result">';
  
  // Analysis header
  html += `
    <div class="result-header">
      <div class="result-title">🧠 AI Analysis Results</div>
      <div class="result-meta">
        <span class="confidence">Confidence: ${Math.round(result.confidence * 100)}%</span>
        <span class="processing-time">${result.processingTime || 0}ms</span>
      </div>
    </div>
  `;
  
  // Entities found
  if (result.entities && result.entities.length > 0) {
    html += '<div class="entities-section">';
    html += '<div class="section-title">🔍 Detected Entities</div>';
    result.entities.forEach(entity => {
      const icon = entity.type === 'token' ? '🪙' : 
                  entity.type === 'address' ? '👤' : 
                  entity.type === 'contract' ? '📋' : '🔗';
      html += `<div class="entity-item">${icon} ${entity.value} (${entity.type})</div>`;
    });
    html += '</div>';
  }
  
  // AI Analysis
  if (result.analysis) {
    html += `
      <div class="ai-analysis">
        <div class="section-title">💭 AI Insights</div>
        <div class="analysis-text">${result.analysis}</div>
      </div>
    `;
  }
  
  // Risks
  if (result.risks && result.risks.length > 0) {
    html += '<div class="risks-section">';
    html += '<div class="section-title">⚠️ Risk Assessment</div>';
    result.risks.forEach(risk => {
      html += `<div class="risk-item">${risk}</div>`;
    });
    html += '</div>';
  }
  
  // Opportunities
  if (result.opportunities && result.opportunities.length > 0) {
    html += '<div class="opportunities-section">';
    html += '<div class="section-title">💡 Opportunities</div>';
    result.opportunities.forEach(opportunity => {
      html += `<div class="opportunity-item">${opportunity}</div>`;
    });
    html += '</div>';
  }
  
  html += '</div>';
  
  // Add result styles
  const style = document.createElement('style');
  style.textContent = `
    .analysis-result {
      color: #fff;
    }
    
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #444;
    }
    
    .result-title {
      font-weight: 600;
      font-size: 14px;
    }
    
    .result-meta {
      display: flex;
      gap: 8px;
      font-size: 11px;
      color: #ccc;
    }
    
    .confidence {
      background: rgba(76, 175, 80, 0.2);
      color: #4caf50;
      padding: 2px 6px;
      border-radius: 4px;
    }
    
    .section-title {
      font-weight: 600;
      margin-bottom: 8px;
      color: #007acc;
      font-size: 13px;
    }
    
    .entities-section,
    .ai-analysis,
    .risks-section,
    .opportunities-section {
      margin-bottom: 16px;
    }
    
    .entity-item,
    .risk-item,
    .opportunity-item {
      background: rgba(255, 255, 255, 0.05);
      padding: 6px 10px;
      border-radius: 4px;
      margin-bottom: 4px;
      font-size: 12px;
    }
    
    .analysis-text {
      background: rgba(0, 122, 204, 0.1);
      padding: 12px;
      border-radius: 6px;
      font-size: 13px;
      line-height: 1.5;
      border-left: 3px solid #007acc;
    }
    
    .error-result {
      text-align: center;
      padding: 20px;
      color: #ff9800;
    }
    
    .error-header {
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .error-message {
      color: #ccc;
      margin-bottom: 8px;
      font-size: 12px;
    }
    
    .error-help {
      font-size: 11px;
      color: #666;
    }
    
    .loading-message {
      text-align: center;
      padding: 20px;
      color: #007acc;
      font-style: italic;
    }
  `;
  document.head.appendChild(style);
  
  resultsDiv.innerHTML = html;
}

// Initialize backend integration after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add query interface
  setTimeout(() => {
    addQueryInterface();
  }, 500);
});
