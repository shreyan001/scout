// Options Page JavaScript - Handles settings and preferences
console.log('Options page loaded');

// DOM elements
const elements = {
    // General settings
    extensionEnabled: document.getElementById('extensionEnabled'),
    autoAnalyze: document.getElementById('autoAnalyze'),
    showIndicator: document.getElementById('showIndicator'),
    
    // Notifications
    enableNotifications: document.getElementById('enableNotifications'),
    soundNotifications: document.getElementById('soundNotifications'),
    
    // Appearance
    themeSelect: document.getElementById('themeSelect'),
    popupSizeSelect: document.getElementById('popupSizeSelect'),
    
    // Advanced
    debugMode: document.getElementById('debugMode'),
    apiTimeout: document.getElementById('apiTimeout'),
    customCSS: document.getElementById('customCSS'),
    
    // Data management
    dataRetention: document.getElementById('dataRetention'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    importDataBtn: document.getElementById('importDataBtn'),
    importFile: document.getElementById('importFile'),
    clearDataBtn: document.getElementById('clearDataBtn'),
    resetSettingsBtn: document.getElementById('resetSettingsBtn'),
    
    // Footer actions
    saveBtn: document.getElementById('saveBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    
    // Footer links
    docsLink: document.getElementById('docsLink'),
    supportLink: document.getElementById('supportLink'),
    githubLink: document.getElementById('githubLink'),
    
    // Toast and modal
    statusToast: document.getElementById('statusToast'),
    confirmModal: document.getElementById('confirmModal'),
    confirmTitle: document.getElementById('confirmTitle'),
    confirmMessage: document.getElementById('confirmMessage'),
    confirmYes: document.getElementById('confirmYes'),
    confirmNo: document.getElementById('confirmNo')
};

// Default settings
const defaultSettings = {
    extensionEnabled: true,
    autoAnalyze: true,
    showIndicator: true,
    enableNotifications: true,
    soundNotifications: false,
    theme: 'light',
    popupSize: 'medium',
    debugMode: false,
    apiTimeout: 5000,
    customCSS: '',
    dataRetention: 30
};

// Current settings
let currentSettings = { ...defaultSettings };
let originalSettings = { ...defaultSettings };

// Initialize options page
async function initializeOptions() {
    try {
        await loadSettings();
        setupEventListeners();
        updateUI();
        console.log('Options page initialized');
    } catch (error) {
        console.error('Error initializing options:', error);
        showToast('Error loading settings', 'error');
    }
}

// Load settings from storage
async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(null, (result) => {
            // Merge with defaults
            currentSettings = { ...defaultSettings, ...result };
            originalSettings = { ...currentSettings };
            
            console.log('Settings loaded:', currentSettings);
            resolve();
        });
    });
}

// Update UI with current settings
function updateUI() {
    // General settings
    elements.extensionEnabled.checked = currentSettings.extensionEnabled;
    elements.autoAnalyze.checked = currentSettings.autoAnalyze;
    elements.showIndicator.checked = currentSettings.showIndicator;
    
    // Notifications
    elements.enableNotifications.checked = currentSettings.enableNotifications;
    elements.soundNotifications.checked = currentSettings.soundNotifications;
    
    // Appearance
    elements.themeSelect.value = currentSettings.theme;
    elements.popupSizeSelect.value = currentSettings.popupSize;
    
    // Advanced
    elements.debugMode.checked = currentSettings.debugMode;
    elements.apiTimeout.value = currentSettings.apiTimeout;
    elements.customCSS.value = currentSettings.customCSS || '';
    
    // Data management
    elements.dataRetention.value = currentSettings.dataRetention;
}

// Setup event listeners
function setupEventListeners() {
    // Setting change listeners
    elements.extensionEnabled.addEventListener('change', handleSettingChange);
    elements.autoAnalyze.addEventListener('change', handleSettingChange);
    elements.showIndicator.addEventListener('change', handleSettingChange);
    elements.enableNotifications.addEventListener('change', handleSettingChange);
    elements.soundNotifications.addEventListener('change', handleSettingChange);
    elements.themeSelect.addEventListener('change', handleSettingChange);
    elements.popupSizeSelect.addEventListener('change', handleSettingChange);
    elements.debugMode.addEventListener('change', handleSettingChange);
    elements.apiTimeout.addEventListener('input', handleSettingChange);
    elements.customCSS.addEventListener('input', handleSettingChange);
    elements.dataRetention.addEventListener('change', handleSettingChange);
    
    // Action buttons
    elements.exportDataBtn.addEventListener('click', exportData);
    elements.importDataBtn.addEventListener('click', () => elements.importFile.click());
    elements.importFile.addEventListener('change', importData);
    elements.clearDataBtn.addEventListener('click', () => showConfirmDialog('Clear All Data', 'This will permanently delete all extension data. This action cannot be undone.', clearAllData));
    elements.resetSettingsBtn.addEventListener('click', () => showConfirmDialog('Reset Settings', 'This will reset all settings to their default values.', resetSettings));
    
    // Footer buttons
    elements.saveBtn.addEventListener('click', saveSettings);
    elements.cancelBtn.addEventListener('click', cancelChanges);
    
    // Footer links
    elements.docsLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://developer.chrome.com/docs/extensions/' });
    });
    
    elements.supportLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'mailto:support@example.com?subject=Chrome%20Extension%20Support' });
    });
    
    elements.githubLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/your-username/chrome-extension-starter' });
    });
    
    // Modal buttons
    elements.confirmNo.addEventListener('click', hideConfirmDialog);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    
    // Prevent accidental navigation
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges()) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

// Handle setting changes
function handleSettingChange(event) {
    const element = event.target;
    const key = element.id;
    
    let value;
    if (element.type === 'checkbox') {
        value = element.checked;
    } else if (element.type === 'number') {
        value = parseInt(element.value);
    } else {
        value = element.value;
    }
    
    currentSettings[key] = value;
    updateSaveButtonState();
    
    console.log('Setting changed:', key, value);
}

// Update save button state
function updateSaveButtonState() {
    const hasChanges = hasUnsavedChanges();
    elements.saveBtn.disabled = !hasChanges;
    elements.saveBtn.textContent = hasChanges ? '💾 Save Changes' : '💾 Saved';
}

// Check if there are unsaved changes
function hasUnsavedChanges() {
    return JSON.stringify(currentSettings) !== JSON.stringify(originalSettings);
}

// Save settings
async function saveSettings() {
    try {
        await new Promise((resolve, reject) => {
            chrome.storage.sync.set(currentSettings, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
        
        originalSettings = { ...currentSettings };
        updateSaveButtonState();
        showToast('Settings saved successfully!', 'success');
        
        // Apply theme immediately
        applyTheme(currentSettings.theme);
        
        console.log('Settings saved:', currentSettings);
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Failed to save settings', 'error');
    }
}

// Cancel changes
function cancelChanges() {
    currentSettings = { ...originalSettings };
    updateUI();
    updateSaveButtonState();
    showToast('Changes discarded', 'info');
}

// Export data
async function exportData() {
    try {
        const allData = await new Promise((resolve) => {
            chrome.storage.sync.get(null, resolve);
        });
        
        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chrome-extension-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showToast('Failed to export data', 'error');
    }
}

// Import data
async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        await new Promise((resolve, reject) => {
            chrome.storage.sync.set(data, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
        
        await loadSettings();
        updateUI();
        updateSaveButtonState();
        
        showToast('Data imported successfully!', 'success');
    } catch (error) {
        console.error('Error importing data:', error);
        showToast('Failed to import data', 'error');
    }
    
    // Clear file input
    event.target.value = '';
}

// Clear all data
async function clearAllData() {
    try {
        await new Promise((resolve, reject) => {
            chrome.storage.sync.clear(() => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
        
        currentSettings = { ...defaultSettings };
        originalSettings = { ...defaultSettings };
        updateUI();
        updateSaveButtonState();
        
        showToast('All data cleared', 'success');
        hideConfirmDialog();
    } catch (error) {
        console.error('Error clearing data:', error);
        showToast('Failed to clear data', 'error');
    }
}

// Reset settings
async function resetSettings() {
    currentSettings = { ...defaultSettings };
    updateUI();
    updateSaveButtonState();
    showToast('Settings reset to defaults', 'info');
    hideConfirmDialog();
}

// Apply theme
function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');
    
    if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'light';
    }
    
    body.classList.add(`theme-${theme}`);
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = elements.statusToast;
    const messageEl = toast.querySelector('.toast-message');
    const iconEl = toast.querySelector('.toast-icon');
    
    messageEl.textContent = message;
    
    // Set icon based on type
    switch (type) {
        case 'success':
            iconEl.textContent = '✅';
            break;
        case 'error':
            iconEl.textContent = '❌';
            break;
        case 'warning':
            iconEl.textContent = '⚠️';
            break;
        default:
            iconEl.textContent = 'ℹ️';
    }
    
    toast.classList.remove('hidden');
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// Show confirmation dialog
function showConfirmDialog(title, message, callback) {
    elements.confirmTitle.textContent = title;
    elements.confirmMessage.textContent = message;
    elements.confirmModal.classList.remove('hidden');
    
    // Remove previous listeners
    const newYesBtn = elements.confirmYes.cloneNode(true);
    elements.confirmYes.parentNode.replaceChild(newYesBtn, elements.confirmYes);
    elements.confirmYes = newYesBtn;
    
    // Add new listener
    elements.confirmYes.addEventListener('click', () => {
        callback();
        hideConfirmDialog();
    });
}

// Hide confirmation dialog
function hideConfirmDialog() {
    elements.confirmModal.classList.add('hidden');
}

// Handle keyboard shortcuts
function handleKeyboard(event) {
    // Ctrl/Cmd + S to save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (!elements.saveBtn.disabled) {
            saveSettings();
        }
    }
    
    // Escape to cancel or close modal
    if (event.key === 'Escape') {
        if (!elements.confirmModal.classList.contains('hidden')) {
            hideConfirmDialog();
        } else if (hasUnsavedChanges()) {
            cancelChanges();
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOptions);
} else {
    initializeOptions();
}

// Listen for storage changes from other parts of the extension
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        console.log('Storage changed:', changes);
        // Optionally reload settings if changed externally
        // loadSettings().then(updateUI);
    }
});
