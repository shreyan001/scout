// Popup JavaScript - Handles popup UI interactions
console.log('Popup script loaded');

// DOM elements
const elements = {
    status: document.getElementById('status'),
    currentTab: document.getElementById('currentTab'),
    analyzePageBtn: document.getElementById('analyzePageBtn'),
    highlightLinksBtn: document.getElementById('highlightLinksBtn'),
    scrollToTopBtn: document.getElementById('scrollToTopBtn'),
    cssInput: document.getElementById('cssInput'),
    injectCssBtn: document.getElementById('injectCssBtn'),
    selectorInput: document.getElementById('selectorInput'),
    highlightElementBtn: document.getElementById('highlightElementBtn'),
    enabledToggle: document.getElementById('enabledToggle'),
    notificationsToggle: document.getElementById('notificationsToggle'),
    optionsBtn: document.getElementById('optionsBtn'),
    helpLink: document.getElementById('helpLink'),
    feedbackLink: document.getElementById('feedbackLink'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

// Initialize popup
async function initializePopup() {
    try {
        // Load saved settings
        await loadSettings();
        
        // Get current tab info
        await updateTabInfo();
        
        // Set up event listeners
        setupEventListeners();
        
        // Update status
        elements.status.textContent = 'Ready';
        elements.status.style.color = '#34a853';
        
    } catch (error) {
        console.error('Error initializing popup:', error);
        elements.status.textContent = 'Error';
        elements.status.style.color = '#ea4335';
    }
}

// Load settings from storage
async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['extensionEnabled', 'userPreferences'], (result) => {
            if (result.extensionEnabled !== undefined) {
                elements.enabledToggle.checked = result.extensionEnabled;
            }
            
            if (result.userPreferences?.notifications !== undefined) {
                elements.notificationsToggle.checked = result.userPreferences.notifications;
            }
            
            resolve();
        });
    });
}

// Update current tab information
async function updateTabInfo() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                const tab = tabs[0];
                const domain = new URL(tab.url).hostname;
                elements.currentTab.textContent = domain;
                elements.currentTab.title = tab.title;
            }
            resolve();
        });
    });
}

// Set up event listeners
function setupEventListeners() {
    // Action buttons
    elements.analyzePageBtn.addEventListener('click', analyzePage);
    elements.highlightLinksBtn.addEventListener('click', highlightLinks);
    elements.scrollToTopBtn.addEventListener('click', scrollToTop);
    
    // Tool buttons
    elements.injectCssBtn.addEventListener('click', injectCSS);
    elements.highlightElementBtn.addEventListener('click', highlightElement);
    
    // Settings toggles
    elements.enabledToggle.addEventListener('change', toggleExtension);
    elements.notificationsToggle.addEventListener('change', toggleNotifications);
    
    // Footer links
    elements.optionsBtn.addEventListener('click', openOptions);
    elements.helpLink.addEventListener('click', openHelp);
    elements.feedbackLink.addEventListener('click', openFeedback);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

// Action functions
async function analyzePage() {
    showLoading(true);
    
    try {
        const response = await sendMessageToContentScript('GET_PAGE_INFO');
        
        if (response.success) {
            const info = response.pageInfo;
            const analysis = `
📄 Title: ${info.title}
🌐 Domain: ${info.domain}
📝 Words: ${info.wordCount}
🖼️ Images: ${info.images}
🔗 Links: ${info.links}
            `.trim();
            
            showToast('Page Analysis', analysis);
        } else {
            showToast('Error', 'Failed to analyze page');
        }
    } catch (error) {
        console.error('Error analyzing page:', error);
        showToast('Error', 'Failed to analyze page');
    }
    
    showLoading(false);
}

async function highlightLinks() {
    showLoading(true);
    
    try {
        const response = await sendMessageToContentScript('HIGHLIGHT_ELEMENT', { selector: 'a' });
        
        if (response.success) {
            showToast('Success', 'Links highlighted!');
        } else {
            showToast('Error', 'Failed to highlight links');
        }
    } catch (error) {
        console.error('Error highlighting links:', error);
        showToast('Error', 'Failed to highlight links');
    }
    
    showLoading(false);
}

async function scrollToTop() {
    try {
        const response = await sendMessageToContentScript('SCROLL_TO_TOP');
        
        if (response.success) {
            showToast('Success', 'Scrolled to top!');
        }
    } catch (error) {
        console.error('Error scrolling to top:', error);
        showToast('Error', 'Failed to scroll to top');
    }
}

async function injectCSS() {
    const css = elements.cssInput.value.trim();
    
    if (!css) {
        showToast('Warning', 'Please enter CSS code');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await sendMessageToContentScript('INJECT_CSS', { css });
        
        if (response.success) {
            showToast('Success', 'CSS injected!');
            elements.cssInput.value = '';
        } else {
            showToast('Error', 'Failed to inject CSS');
        }
    } catch (error) {
        console.error('Error injecting CSS:', error);
        showToast('Error', 'Failed to inject CSS');
    }
    
    showLoading(false);
}

async function highlightElement() {
    const selector = elements.selectorInput.value.trim();
    
    if (!selector) {
        showToast('Warning', 'Please enter a CSS selector');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await sendMessageToContentScript('HIGHLIGHT_ELEMENT', { selector });
        
        if (response.success) {
            showToast('Success', `Elements highlighted: ${selector}`);
            elements.selectorInput.value = '';
        } else {
            showToast('Error', 'Failed to highlight elements');
        }
    } catch (error) {
        console.error('Error highlighting elements:', error);
        showToast('Error', 'Failed to highlight elements');
    }
    
    showLoading(false);
}

// Settings functions
function toggleExtension() {
    const enabled = elements.enabledToggle.checked;
    
    chrome.storage.sync.set({ extensionEnabled: enabled }, () => {
        showToast('Settings', `Extension ${enabled ? 'enabled' : 'disabled'}`);
        
        // Update status
        elements.status.textContent = enabled ? 'Ready' : 'Disabled';
        elements.status.style.color = enabled ? '#34a853' : '#ea4335';
    });
}

function toggleNotifications() {
    const notifications = elements.notificationsToggle.checked;
    
    chrome.storage.sync.get(['userPreferences'], (result) => {
        const preferences = result.userPreferences || {};
        preferences.notifications = notifications;
        
        chrome.storage.sync.set({ userPreferences: preferences }, () => {
            showToast('Settings', `Notifications ${notifications ? 'enabled' : 'disabled'}`);
        });
    });
}

// Navigation functions
function openOptions() {
    chrome.runtime.openOptionsPage();
    window.close();
}

function openHelp() {
    chrome.tabs.create({ url: 'https://developer.chrome.com/docs/extensions/' });
    window.close();
}

function openFeedback() {
    chrome.tabs.create({ url: 'mailto:your-email@example.com?subject=Extension%20Feedback' });
    window.close();
}

// Utility functions
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

function sendMessageToBackground(type, data = {}) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type, ...data }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError);
                resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
                resolve(response || { success: false });
            }
        });
    });
}

function showLoading(show) {
    if (show) {
        elements.loadingOverlay.classList.remove('hidden');
    } else {
        elements.loadingOverlay.classList.add('hidden');
    }
}

function showToast(title, message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <div class="toast-header">
            <strong>${title}</strong>
            <button class="toast-close">&times;</button>
        </div>
        <div class="toast-body">${message}</div>
    `;
    
    // Add toast styles
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1001;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }, 3000);
    
    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}

function handleKeyboard(event) {
    // Ctrl/Cmd + Enter to analyze page
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        analyzePage();
    }
    
    // Escape to close popup
    if (event.key === 'Escape') {
        window.close();
    }
}

// Add toast animation styles
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .toast-notification {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
    }
    
    .toast-header {
        padding: 12px 16px 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .toast-body {
        padding: 8px 16px 12px;
        white-space: pre-line;
        color: #666;
    }
    
    .toast-close {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #999;
        padding: 0;
        line-height: 1;
    }
    
    .toast-close:hover {
        color: #666;
    }
`;
document.head.appendChild(toastStyles);

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePopup);
} else {
    initializePopup();
}
