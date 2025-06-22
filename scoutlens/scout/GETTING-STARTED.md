# 🚀 Chrome Extension Starter - Quick Setup Guide

## Installation & Setup

### 1. Load Extension in Chrome

1. **Open Chrome Extensions Page**
   - Type `chrome://extensions/` in your address bar, or
   - Go to Chrome Menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to and select the `chrome-extension-starter` folder
   - Click "Select Folder"

4. **Verify Installation**
   - The extension should appear in your extensions list
   - You should see the extension icon in your Chrome toolbar

### 2. Test the Extension

#### Popup Interface
- Click the extension icon in the toolbar
- Try the various buttons:
  - "Analyze Page" - Get page statistics
  - "Highlight Links" - Highlight all links on the page
  - "Scroll to Top" - Scroll to the top of the page
  - Use the CSS injection tool
  - Test the element selector tool

#### Context Menu
- Right-click on any webpage
- Look for "Run Extension Action" in the context menu
- Click it to execute the extension action

#### Options Page
- Click "Options" in the popup, or
- Go to `chrome://extensions/` and click "Details" → "Extension options"
- Configure various settings and preferences

### 3. Development Workflow

#### Making Changes
1. **Edit the code** in your preferred editor
2. **Reload the extension**:
   - Go to `chrome://extensions/`
   - Click the reload button (🔄) on your extension
   - Or use Ctrl+R on the extensions page

#### File Structure Overview
```
chrome-extension-starter/
├── 📄 manifest.json       # Extension configuration
├── ⚙️ background.js       # Service worker (background tasks)
├── 📝 content.js          # Content script (runs on web pages)
├── 🎨 content.css         # Styles for content script
├── 🖼️ popup.html          # Popup interface
├── 🔧 popup.js            # Popup functionality
├── 💅 popup.css           # Popup styles
├── ⚙️ options.html        # Settings page
├── 🔧 options.js          # Settings functionality
├── 💅 options.css         # Settings styles
├── 🔌 injected.js         # Page context script
└── 📁 icons/              # Extension icons
```

### 4. Common Development Tasks

#### Adding New Features

**Background Tasks:**
```javascript
// In background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'YOUR_NEW_ACTION') {
    // Your code here
    sendResponse({ success: true });
  }
});
```

**Page Interaction:**
```javascript
// In content.js
function yourNewFunction() {
  // Interact with the webpage
  const elements = document.querySelectorAll('.your-selector');
  // Your code here
}
```

**Popup Controls:**
```javascript
// In popup.js
document.getElementById('yourButton').addEventListener('click', async () => {
  const response = await sendMessageToContentScript('YOUR_ACTION');
  console.log(response);
});
```

#### Debugging

**Background Script:**
- Open `chrome://extensions/`
- Click "Details" on your extension
- Click "Inspect views: service worker"
- Use the DevTools console

**Content Script:**
- Open any webpage
- Press F12 to open DevTools
- Check the Console tab for content script logs
- Use "Sources" tab to set breakpoints

**Popup:**
- Right-click on the extension icon
- Select "Inspect popup"
- Use DevTools normally

### 5. Publishing Preparation

#### Before Publishing
1. **Update manifest.json**:
   - Set proper name, description, version
   - Add appropriate permissions
   - Update author information

2. **Add Icons**:
   - Create PNG icons: 16x16, 32x32, 48x48, 128x128
   - Update manifest.json icon references

3. **Test Thoroughly**:
   - Test on different websites
   - Test all features
   - Check for console errors

#### Create Distribution Package
```bash
# If you have Node.js installed:
npm run zip

# This creates a ZIP file ready for Chrome Web Store
```

### 6. Chrome Web Store Upload

1. **Create Developer Account**:
   - Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Pay one-time $5 registration fee

2. **Upload Extension**:
   - Click "Add new item"
   - Upload your ZIP file
   - Fill in store listing details
   - Add screenshots and description

3. **Publish**:
   - Submit for review
   - Usually takes 1-3 days for approval

### 7. Troubleshooting

#### Extension Won't Load
- ✅ Check manifest.json syntax with a JSON validator
- ✅ Ensure all referenced files exist
- ✅ Check browser console for specific errors

#### Content Script Not Working
- ✅ Verify `host_permissions` in manifest.json
- ✅ Check if website blocks content scripts (CSP)
- ✅ Look for JavaScript errors in page console

#### Storage Issues
- ✅ Check storage permissions in manifest
- ✅ Verify you're not exceeding storage quotas
- ✅ Use chrome.storage.local for large data

#### Permission Issues
- ✅ Add required permissions to manifest.json
- ✅ Reload extension after permission changes
- ✅ Check Chrome's permission warnings

### 8. Advanced Features

#### Message Passing Patterns
```javascript
// Popup → Background
chrome.runtime.sendMessage({ type: 'ACTION' });

// Background → Content Script
chrome.tabs.sendMessage(tabId, { type: 'ACTION' });

// Content Script → Background
chrome.runtime.sendMessage({ type: 'ACTION' });
```

#### Storage Best Practices
```javascript
// Save settings
chrome.storage.sync.set({ key: 'value' });

// Load settings
chrome.storage.sync.get(['key'], (result) => {
  console.log(result.key);
});

// Listen for changes
chrome.storage.onChanged.addListener((changes) => {
  console.log('Storage changed:', changes);
});
```

### 9. Resources & Documentation

- 📚 [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- 🔄 [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/migrating/)
- 💡 [Chrome Extension Samples](https://github.com/GoogleChrome/chrome-extensions-samples)
- 🎯 [Chrome Web Store Policies](https://developer.chrome.com/docs/webstore/program-policies/)

### 10. Tips for Success

1. **Start Simple**: Begin with basic functionality, then add features
2. **Test Early**: Test on different websites and scenarios
3. **Handle Errors**: Always include error handling in your code
4. **Follow Guidelines**: Adhere to Chrome Web Store policies
5. **User Experience**: Make your extension intuitive and helpful
6. **Performance**: Keep your extension lightweight and fast

---

**Need Help?** 
- Check the browser console for errors
- Review the Chrome Extension documentation
- Test with minimal code first
- Use the validation script: `npm run validate`

**Happy Extension Building! 🎉**
