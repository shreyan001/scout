# Scout Backend Integration Test Guide

## 🧪 Testing the Backend Integration

This guide provides comprehensive testing steps for the Scout Chrome Extension backend integration.

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd backend
   pnpm install
   pnpm run dev
   ```
   
2. **Extension Loaded**
   - Load unpacked extension in Chrome
   - Ensure all permissions are granted

## Test Scenarios

### 1. Backend Health Check

**Test:** Extension startup and backend connection
**Steps:**
1. Open Chrome DevTools (F12)
2. Open Scout extension popup
3. Check console for backend health check logs

**Expected Results:**
- ✅ "Scout Backend Health Check: HEALTHY" in console
- ✅ Green backend status indicator in popup
- ✅ "🟢 Scout AI Backend Connected" message

**Failure Case:**
- ⚠️ "Scout Backend Health Check: UNHEALTHY" in console
- ⚠️ Yellow backend status: "🟡 Scout AI Backend Offline (Local Mode)"

### 2. AI Query Analysis

**Test:** Web3 query processing through backend
**Steps:**
1. Open Scout popup
2. Enter query: "What is Bitcoin?"
3. Click "Analyze with AI"
4. Wait for response

**Expected Results:**
- ✅ Loading state: "🧠 AI is analyzing your query..."
- ✅ Results displayed with entities, insights, risks
- ✅ Processing time and confidence shown
- ✅ Success toast: "Analysis complete!"

**Test Queries:**
```
- "What is Bitcoin and how does it work?"
- "0xdAC17F958D2ee523a2206206994597C13D831ec7"
- "How to swap ETH for USDC on Uniswap?"
- "What are the risks of yield farming?"
```

### 3. Address Analysis Integration

**Test:** Context menu address analysis
**Steps:**
1. Navigate to page with Ethereum address
2. Select an address (e.g., 0xdAC17F958D2ee523a2206206994597C13D831ec7)
3. Right-click → "📊 Scout: Analyze Address"
4. Wait for analysis

**Expected Results:**
- ✅ Loading indicator: "📊 Analyzing Address..."
- ✅ Backend analysis attempt logged in console
- ✅ In-page notification with risk assessment
- ✅ Address highlighted on page if successful

**Fallback Test:**
1. Stop backend server
2. Repeat address analysis
3. Should see fallback analysis with "Backend unavailable"

### 4. OCR Scan Integration

**Test:** OCR with backend processing
**Steps:**
1. Navigate to page with crypto content
2. Press Ctrl+Shift+L (OCR scan shortcut)
3. Wait for scan completion

**Expected Results:**
- ✅ OCR scanning indicator appears
- ✅ Page content analyzed locally
- ✅ Results sent to backend for processing
- ✅ Enhanced insights displayed

### 5. Page Content Analysis

**Test:** Automatic Web3 content detection
**Steps:**
1. Navigate to DeFi website (e.g., Uniswap, Aave)
2. Wait for content script to load
3. Check for automatic analysis

**Expected Results:**
- ✅ Scout indicator appears briefly
- ✅ Web3 content detected and highlighted
- ✅ Backend analysis triggered automatically

## Console Logging Guide

### Key Log Messages to Monitor

**Successful Backend Integration:**
```
Scout Backend Health Check: HEALTHY
Scout: Backend address analysis successful
Scout: Backend OCR processing successful
Scout: Enhanced OCR scan completed
```

**Backend Communication:**
```
Scout Backend Request (Attempt 1/3): http://localhost:3001/analyze
Scout Backend Response: {analysis: {...}, entities: [...]}
```

**Fallback Operations:**
```
Scout: Backend analysis failed, using fallback: [error message]
Scout: Backend OCR processing unavailable: [error message]
```

### Error Patterns to Watch

**Connection Issues:**
```
Scout Backend Health Check Failed: TypeError: Failed to fetch
Scout Backend Request Failed (Attempt 3): [error details]
```

**Backend Errors:**
```
Scout Backend Analysis Error: HTTP 500: Internal Server Error
Analysis failed: [specific error message]
```

## Network Tab Monitoring

### Expected HTTP Requests

1. **Health Check:**
   ```
   GET http://localhost:3001/health
   Response: {"status":"healthy","timestamp":"..."}
   ```

2. **Analysis Request:**
   ```
   POST http://localhost:3001/analyze
   Content-Type: application/json
   Body: {"input":"user query","options":{...}}
   ```

3. **Address Analysis:**
   ```
   POST http://localhost:3001/api/address
   Body: {"address":"0x...","context":{...}}
   ```

## Backend API Testing

### Direct API Testing

Test backend endpoints directly:

```bash
# Health check
curl http://localhost:3001/health

# Analysis endpoint
curl -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{"input": "What is Bitcoin?", "options": {"includeRiskAssessment": true}}'

# Address analysis
curl -X POST http://localhost:3001/api/address \
  -H "Content-Type: application/json" \
  -d '{"address": "0xdAC17F958D2ee523a2206206994597C13D831ec7", "context": {}}'
```

### Expected Response Format

```json
{
  "classification": "web3",
  "confidence": 0.95,
  "detectedTokens": ["BTC", "ETH"],
  "detectedContracts": ["0x..."],
  "detectedWallets": ["0x..."],
  "analysis": "AI analysis text...",
  "entities": [...],
  "risks": [...],
  "opportunities": [...],
  "mcpConnected": true,
  "processingTime": 2500
}
```

## Performance Testing

### Metrics to Monitor

1. **Response Times:**
   - Health check: < 1 second
   - Simple query: < 5 seconds
   - Complex analysis: < 15 seconds

2. **Memory Usage:**
   - Extension memory should remain stable
   - No memory leaks in long-running tests

3. **Error Recovery:**
   - Graceful fallback when backend unavailable
   - Proper error messages displayed to user

## Integration Test Checklist

- [ ] Backend health check on extension startup
- [ ] AI query analysis with example queries
- [ ] Address analysis via context menu
- [ ] OCR scan with backend processing
- [ ] Automatic Web3 content detection
- [ ] Fallback behavior when backend offline
- [ ] Error handling and user notifications
- [ ] Performance within acceptable limits
- [ ] Memory usage remains stable
- [ ] All console logs appear as expected

## Troubleshooting Common Issues

### Backend Not Responding
```
Issue: 🟡 Scout AI Backend Offline
Solution: 
1. Check if backend server is running (pnpm run dev)
2. Verify http://localhost:3001/health responds
3. Check firewall/antivirus blocking connections
```

### CORS Errors
```
Issue: CORS policy errors in console
Solution:
1. Ensure backend CORS is configured for extensions
2. Check manifest.json host_permissions includes localhost:3001
```

### Analysis Timeout
```
Issue: Analysis requests timing out
Solution:
1. Increase timeout in SCOUT_BACKEND_CONFIG
2. Check backend server performance
3. Verify MCP server connectivity
```

### Memory Leaks
```
Issue: Extension memory usage growing
Solution:
1. Check for uncleaned DOM elements
2. Ensure proper event listener cleanup
3. Monitor background script memory usage
```

## Performance Optimization Tips

1. **Cache Results:** Backend responses are cached locally
2. **Debounce Requests:** Multiple rapid requests are debounced
3. **Fallback Logic:** Local analysis when backend unavailable
4. **Efficient DOM Updates:** Minimal DOM manipulation for highlights
5. **Background Processing:** Heavy lifting done in background script

## Success Criteria

The backend integration is successful when:

✅ All test scenarios pass  
✅ Fallback behavior works correctly  
✅ Performance is within acceptable limits  
✅ Error handling is graceful  
✅ User experience is smooth and informative  

## Next Steps

After successful testing:

1. **Production Deployment:** Deploy backend to cloud service
2. **Analytics Integration:** Add usage analytics and monitoring
3. **Performance Monitoring:** Set up alerts for backend health
4. **User Testing:** Conduct user acceptance testing
5. **Documentation:** Update user guides and help content

---

🎉 **Congratulations!** You've successfully integrated the Scout Chrome Extension with the LangGraph.js backend! The extension now provides AI-powered Web3 analysis with real-time blockchain data integration.
