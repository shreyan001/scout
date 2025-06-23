# Scout Extension - Complete Wallet Integration

## Overview
The Scout Social Trader extension now has a complete wallet integration system that connects the popup, background script, and connection page seamlessly.

## File Structure & Flow

### 1. Popup (popup.html + popup.js)
**Purpose**: Main extension interface
**Key Features**:
- Shows wallet connection status
- Displays wallet balance when connected
- Provides connect/disconnect buttons
- Offers quick actions (Test OCR, Scan Page)

**Flow**:
1. User clicks "Connect Wallet" button
2. popup.js sends message to background script
3. Background script opens connection.html in new tab
4. After connection, popup automatically updates

### 2. Connection Page (connection.html + connection.js)
**Purpose**: Dedicated wallet connection interface
**Key Features**:
- Detects available Solana wallets (Phantom, Solflare, Sollet)
- Handles wallet connection process
- Fetches and displays wallet balance
- Stores connection data in chrome.storage

**Flow**:
1. Page loads and detects available wallets
2. User selects preferred wallet
3. Wallet connection is established
4. Balance is fetched from Solana RPC
5. Data is stored in extension storage
6. Success screen is shown

### 3. Background Script (background.js)
**Purpose**: Extension service worker and message handler
**Key Features**:
- Handles inter-component communication
- Opens connection page when requested
- Manages wallet data storage
- Handles disconnect requests

## Storage Schema

The extension uses `chrome.storage.local` with the following keys:

```javascript
{
  "walletData": {
    "walletName": "Phantom",
    "publicKey": "ABC123...XYZ789",
    "balance": "1.2345",
    "connectedAt": "2025-06-21T12:00:00.000Z"
  },
  "connectedWallet": "Phantom",
  "walletAddress": "ABC123...XYZ789"
}
```

## API Integration

### Solana RPC
- **Endpoint**: `https://api.mainnet-beta.solana.com`
- **Method**: `getBalance`
- **Purpose**: Fetch SOL balance for connected wallet

### Wallet Providers
- **Phantom**: `window.phantom.solana`
- **Solflare**: `window.solflare`
- **Sollet**: `window.sollet`

## Message Flow

### Connect Wallet Flow
```
Popup → Background → Connection Page → Storage → Popup
```

1. **Popup**: `chrome.runtime.sendMessage({ action: 'openWalletConnection' })`
2. **Background**: Opens `connection.html` in new tab
3. **Connection Page**: Handles wallet connection and stores data
4. **Popup**: Refreshes and shows connected state

### Disconnect Wallet Flow
```
Popup → Background → Storage → Popup
```

1. **Popup**: `chrome.runtime.sendMessage({ action: 'disconnectWallet' })`
2. **Background**: Removes wallet data from storage
3. **Popup**: Updates to disconnected state

## UI Design System

Both popup and connection page use the unified shadcn/ui design system:

- **Font**: Geist
- **Border Radius**: 0 (sharp corners)
- **Color Tokens**: HSL-based CSS variables
- **Dark Mode**: Automatic detection with `prefers-color-scheme`

## Error Handling

### Connection Errors
- Wallet not detected
- Connection refused by user
- Network errors during balance fetch

### Storage Errors
- Extension storage unavailable
- Data corruption

### Display Errors
- Invalid wallet data
- Balance fetch failures

## Testing Instructions

### Manual Testing
1. **Install Extension**: Load unpacked extension in Chrome
2. **Open Popup**: Click extension icon
3. **Connect Wallet**: Click "Connect Wallet" button
4. **Verify Connection**: Check that wallet info appears in popup
5. **Test Disconnect**: Click "Disconnect" button
6. **Verify Cleanup**: Confirm wallet info is cleared

### Functional Testing
1. **Multiple Wallets**: Test with different wallet providers
2. **Balance Display**: Verify SOL balance appears correctly
3. **Persistence**: Close and reopen popup to check persistence
4. **Error Handling**: Test with no wallets installed

## File Dependencies

### Manifest Requirements
```json
{
  "permissions": ["storage", "tabs"],
  "web_accessible_resources": [
    {
      "resources": ["connection.html", "connection.js"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

### Required Files
- `popup.html` - Main popup interface
- `popup.js` - Popup logic and event handlers
- `popup.css` - Popup styling (shadcn/ui design)
- `connection.html` - Wallet connection page
- `connection.js` - Connection logic and wallet detection
- `background.js` - Service worker and message handling
- `manifest.json` - Extension configuration

## Integration Points

### With Content Scripts
- OCR functionality can check wallet connection status
- Context menu actions can access wallet data
- Transaction signing can use connected wallet

### With Scout API
- Wallet address used for price queries
- Connected wallet can sign Scout swap transactions
- Balance data for portfolio tracking

## Security Considerations

### Storage Security
- Wallet data stored locally only
- No private keys stored
- Connection status and public data only

### Communication Security
- Messages between components validated
- No sensitive data in transit
- Wallet providers handle private key security

## Future Enhancements

### Additional Features
- Transaction history
- Token balance display
- Multi-wallet support
- Portfolio tracking
- Auto-reconnection

### Performance Improvements
- Connection caching
- Background balance updates
- Optimized storage usage
