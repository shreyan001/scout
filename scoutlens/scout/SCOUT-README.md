# Scout - Web3 AI Agent

Your Personalized Web3 AI Agent — See, Scan, Act. Instantly.

## 🚀 Quick Start

### Installation
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select the `scout` folder
4. The Scout extension icon should appear in your browser toolbar

### Features Implemented
- ✅ **Wallet Connection**: Connect/disconnect MetaMask wallet
- ✅ **Token Detection**: Automatically scan pages for crypto tokens and addresses
- ✅ **OCR Integration**: Ready for image-based token scanning
- ✅ **Page Scanning**: Detect crypto content on websites
- ✅ **Real-time Monitoring**: Track page changes and wallet status
- ✅ **Modern UI**: Beautiful popup interface with scan results
- ✅ **Background Processing**: Persistent state management

### Testing
1. **Load Extension**: Follow installation steps above
2. **Test Wallet Connection**: 
   - Click Scout icon in toolbar
   - Click "Connect Wallet" (requires MetaMask installed)
3. **Test Token Scanning**:
   - Visit a crypto website (e.g., CoinGecko, Uniswap, etc.)
   - Click Scout icon → "Scan Page"
   - View detected tokens and addresses
4. **Test OCR**: 
   - Visit a page with token images/charts
   - Click "Scan Images" in popup

### Architecture
- **popup.js**: Main UI logic and user interactions
- **background.js**: Service worker for wallet connection and data processing
- **content.js**: Content script for page scanning and token detection
- **injected.js**: Injected script for MetaMask wallet bridge
- **manifest.json**: Extension configuration

### Next Steps
- [ ] Integrate real OCR with Tesseract.js
- [ ] Add Nodit MCP API integration for token insights
- [ ] Implement AI-powered risk assessment
- [ ] Add portfolio tracking
- [ ] Enhanced UI/UX improvements

## 🛠️ Development

### File Structure
```
scout/
├── manifest.json          # Extension manifest
├── popup.html/css/js      # Extension popup UI
├── background.js          # Service worker
├── content.js            # Content script
├── injected.js           # Wallet bridge script
├── options.html/css/js   # Settings page
└── icons/                # Extension icons
```

### Message Flow
1. **Popup** → Background: User actions (connect wallet, scan)
2. **Background** → Content: Scanning commands
3. **Content** → Injected: Wallet operations
4. **Injected** → Content: Wallet status updates
5. **Content** → Background: Scan results and data

## 🔧 Troubleshooting

### Common Issues
- **MetaMask not detected**: Ensure MetaMask extension is installed and enabled
- **Wallet connection fails**: Check MetaMask is unlocked and on supported network
- **Scan not working**: Ensure extension has permission to access the website
- **No tokens detected**: Try on crypto-related websites with visible token content

### Debug Mode
1. Open Chrome DevTools
2. Go to Extensions tab in DevTools
3. Find Scout extension
4. Check console logs for errors
5. Use popup inspector to debug UI issues

### Support
- Check console logs for error messages
- Ensure all required permissions are granted
- Try reloading the extension if issues persist

## 📝 License
MIT License - feel free to modify and distribute.
