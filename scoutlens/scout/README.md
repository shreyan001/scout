# Chrome Extension Starter Template

🚀 A modern, comprehensive Chrome extension starter template built with **Manifest V3** and the latest web standards.

## Features

- ✅ **Manifest V3** compliant
- 🎨 Modern, responsive UI with beautiful CSS
- 🔧 **Service Worker** background script
- 📄 **Content Scripts** for page interaction
- 🎪 **Popup** interface with real-time controls
- ⚙️ **Options Page** for settings management
- 💾 **Storage API** integration
- 🔌 **Message passing** between components
- 📱 **Responsive design** for all screen sizes
- 🎯 **Context menus** integration
- 🔍 **Page analysis** tools
- 💉 **CSS injection** capabilities
- 🛠️ **Developer tools** included

## Quick Start

### 1. Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this folder
4. The extension icon should appear in your toolbar

### 2. Test the Extension

- Click the extension icon to open the popup
- Try the "Analyze Page" button on any website
- Right-click on any page to see the context menu
- Visit the options page by clicking "Options" in the popup

## File Structure

```
chrome-extension-starter/
├── manifest.json          # Extension manifest (V3)
├── background.js          # Service worker (background script)
├── content.js            # Content script (runs on web pages)
├── content.css           # Content script styles
├── popup.html            # Popup interface
├── popup.js              # Popup logic
├── popup.css             # Popup styles
├── options.html          # Options/settings page
├── options.js            # Options page logic
├── options.css           # Options page styles
├── injected.js           # Injected script (runs in page context)
├── icons/                # Extension icons
└── README.md             # This file
```

## Core Components

### Service Worker (background.js)
- Handles extension lifecycle events
- Manages storage and settings
- Processes messages from content scripts and popup
- Creates context menus
- Handles alarms and periodic tasks

### Content Script (content.js)
- Runs on all web pages
- Analyzes page content
- Injects UI elements
- Communicates with background script
- Manipulates DOM elements

### Popup (popup.html/js/css)
- Main user interface
- Real-time page analysis
- Quick action buttons
- Settings toggles
- Developer tools

### Options Page (options.html/js/css)
- Comprehensive settings management
- Data import/export
- Theme selection
- Advanced configuration options

## Key Features

### 🔍 Page Analysis
- Word count, image count, link analysis
- Performance metrics
- SEO-friendly data extraction

### 🎨 CSS Injection
- Live CSS editing and injection
- Element highlighting
- Custom styling capabilities

### 💾 Storage Management
- Sync storage across devices
- Settings persistence
- Data export/import functionality

### 📨 Message Passing
- Background ↔ Content Script communication
- Popup ↔ Background communication
- Content Script ↔ Popup communication

## Development

### Adding New Features

1. **Background Script Features**: Add to `background.js`
2. **Page Interaction**: Modify `content.js`
3. **UI Elements**: Update `popup.html` and `popup.js`
4. **Settings**: Add to `options.html` and `options.js`

### Message Types

The extension uses a structured message passing system:

```javascript
// From popup to content script
chrome.tabs.sendMessage(tabId, {
    type: 'HIGHLIGHT_ELEMENT',
    selector: '.my-class'
});

// From content script to background
chrome.runtime.sendMessage({
    type: 'SAVE_DATA',
    data: { key: 'value' }
});
```

### Common Message Types

- `GET_PAGE_INFO` - Get page analysis data
- `HIGHLIGHT_ELEMENT` - Highlight elements by selector
- `INJECT_CSS` - Inject custom CSS
- `SCROLL_TO_TOP` - Scroll page to top
- `SAVE_DATA` - Save data to storage
- `GET_TAB_INFO` - Get current tab information

## Permissions Explained

- `activeTab` - Access to currently active tab
- `storage` - Store settings and data
- `scripting` - Execute scripts in web pages
- `contextMenus` - Create right-click menu items
- `host_permissions` - Access to all websites

## Customization

### Changing the Extension Name
Update the `name` field in `manifest.json`

### Adding New Permissions
Add to the `permissions` array in `manifest.json`

### Styling
- Modify `popup.css` for popup styling
- Update `content.css` for injected element styling
- Edit `options.css` for settings page styling

### Adding Icons
Replace the placeholder icon references in `manifest.json` with your own PNG files in the `icons/` directory.

## API Usage Examples

### Storage API
```javascript
// Save data
chrome.storage.sync.set({ key: 'value' }, () => {
    console.log('Data saved');
});

// Load data
chrome.storage.sync.get(['key'], (result) => {
    console.log('Data loaded:', result.key);
});
```

### Tabs API
```javascript
// Get current tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log('Current tab:', tabs[0]);
});

// Execute script in tab
chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: () => console.log('Hello from tab!')
});
```

### Runtime API
```javascript
// Send message
chrome.runtime.sendMessage({ type: 'HELLO' }, (response) => {
    console.log('Response:', response);
});

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'HELLO') {
        sendResponse({ success: true });
    }
});
```

## Best Practices

1. **Always handle errors** in async operations
2. **Use meaningful message types** for communication
3. **Keep storage usage minimal** for sync storage
4. **Test on different websites** to ensure compatibility
5. **Follow Chrome's security guidelines**
6. **Use semantic versioning** for releases

## Troubleshooting

### Extension Won't Load
- Check `manifest.json` syntax
- Verify all referenced files exist
- Check browser console for errors

### Content Script Not Working
- Verify `host_permissions` in manifest
- Check if website has Content Security Policy restrictions
- Use browser dev tools to debug

### Storage Issues
- Check if sync storage quota is exceeded
- Verify storage permissions in manifest
- Use local storage for large data

## Security Notes

- This template follows Manifest V3 security requirements
- Uses Content Security Policy (CSP) compliant code
- Avoids `eval()` and inline scripts
- Implements proper error handling

## Browser Compatibility

- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this template for your own projects!

## Support

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/migrating/)
- [Chrome Extension Samples](https://github.com/GoogleChrome/chrome-extensions-samples)

---

**Happy coding! 🚀**
