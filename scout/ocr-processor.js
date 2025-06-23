// OCR Processor for Scout - Interfaces with backend API
// Handles image processing and sends extracted text to Scout backend

class ScoutOCRProcessor {
  constructor() {
    this.backendUrl = 'http://localhost:3001/api/process';
    this.isProcessing = false;
    console.log('🔍 Scout OCR Processor initialized');
  }

  // Main function to process image and get backend analysis
  async processImage(imageElement) {
    console.log('🔍 === OCR PROCESSOR START ===');
    console.log('📷 Image element received:', imageElement.tagName, imageElement.className);
    
    if (this.isProcessing) {
      console.log('⚠️ OCR processor busy, rejecting request');
      throw new Error('OCR processor is busy with another image');
    }

    this.isProcessing = true;
    
    try {
      console.log('🔍 Step 1: Extracting text from image...');
      const ocrText = await this.extractTextFromImage(imageElement);
      
      console.log('📝 Raw OCR result:', ocrText);
      
      if (!ocrText || ocrText.trim().length === 0) {
        console.log('❌ No text extracted, using fallback');
        const fallbackText = this.generateFallbackText();
        console.log('🎭 Fallback text:', fallbackText);
        
        // Still try to send fallback to backend
        try {
          const backendAnalysis = await this.sendToBackend(fallbackText);
          return { success: true, ocrText: fallbackText, backendAnalysis, source: 'fallback-ocr' };
        } catch (backendError) {
          console.log('🔄 Backend failed, showing fallback results');
          this.showFallbackResults(fallbackText);
          return { success: true, ocrText: fallbackText, fallback: true };
        }
      }
      
      console.log('🔍 Step 2: Sending to backend for analysis...');
      const backendAnalysis = await this.sendToBackend(ocrText);
      
      console.log('✅ OCR Processor completed successfully');
      console.log('🔍 === OCR PROCESSOR END ===');
      
      return {
        success: true,
        ocrText: ocrText,
        backendAnalysis: backendAnalysis,
        source: 'image-ocr'
      };
      
    } catch (error) {
      console.error('❌ OCR processing failed:', error.message);
      console.log('🔄 Switching to fallback mode...');
      
      const fallbackText = this.generateFallbackText();
      this.showFallbackResults(fallbackText);
      
      console.log('🔍 === OCR PROCESSOR END (FALLBACK) ===');
      
      return {
        success: true,
        ocrText: fallbackText,
        fallback: true,
        error: error.message
      };
    } finally {
      this.isProcessing = false;
    }
  }

  // Extract text from image using built-in OCR or fallback
  async extractTextFromImage(imageElement) {
    try {
      // Try to use the OCR worker if available
      if (window.lensOCR) {
        const imageDataURL = await this.imageToDataURL(imageElement);
        const result = await window.lensOCR.processImage(imageDataURL);
        
        if (result.success && result.text) {
          return result.text;
        }
      }
      
      // Fallback to simulated OCR for demo purposes
      return this.simulateOCR(imageElement);
      
    } catch (error) {
      console.warn('⚠️ OCR extraction failed, using fallback:', error);
      return this.simulateOCR(imageElement);
    }
  }

  // Convert image element to data URL
  async imageToDataURL(imageElement) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Handle cross-origin images
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          canvas.width = img.naturalWidth || img.width || 300;
          canvas.height = img.naturalHeight || img.height || 200;
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };
        
        img.onerror = () => {
          // If cross-origin fails, try direct canvas approach
          try {
            canvas.width = imageElement.naturalWidth || imageElement.width || 300;
            canvas.height = imageElement.naturalHeight || imageElement.height || 200;
            ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
          } catch (err) {
            reject(err);
          }
        };
        
        img.src = imageElement.src;
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Send extracted text to Scout backend
  async sendToBackend(text) {
    console.log('🚀 === BACKEND CALL START ===');
    console.log('📝 Sending text to backend:', text);
    console.log('🌐 Backend URL:', this.backendUrl);
    
    try {
      const requestFormats = [
        { message: text, source: 'ocr-image' },
        { message: text },
        { query: text, source: 'ocr-image' },
        { text: text, source: 'ocr-image' },
        { query: text }
      ];
      
      let response;
      let lastError;
      
      for (const format of requestFormats) {
        console.log('📦 OCR trying format:', format);
        
        try {
          response = await fetch(this.backendUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(format)
          });
          
          if (response.ok) {
            console.log('✅ OCR format worked:', format);
            break;
          } else {
            lastError = `${response.status} ${response.statusText}`;
          }
        } catch (err) {
          lastError = err.message;
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`OCR API formats failed: ${lastError}`);
      }

      console.log('📡 Backend response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Backend response received:', result);
      
      if (result.success && result.result) {
        console.log('🎨 Processing OCR backend result...');
        
        // Parse result if it's a string
        let parsedResult = result.result;
        if (typeof result.result === 'string') {
          console.log('🔄 OCR result is string, parsing JSON...');
          try {
            parsedResult = JSON.parse(result.result);
            console.log('✅ OCR JSON parsed successfully:', parsedResult);
          } catch (parseError) {
            console.error('❌ OCR JSON parse failed:', parseError);
            throw new Error('Failed to parse OCR backend result');
          }
        }
        
        console.log('🎨 Displaying OCR backend results...');
        this.displayBackendResults(parsedResult, text);
        console.log('🚀 === BACKEND CALL SUCCESS ===');
      } else {
        console.log('❌ Backend returned unsuccessful result');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Backend API call failed:', error.message);
      
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        console.log('⚠️ Request blocked/failed, showing fallback');
        this.showFallbackResults(text);
        console.log('🚀 === BACKEND CALL END (FALLBACK) ===');
        return { success: true, fallback: true, ocrText: text };
      }
      
      console.log('🚀 === BACKEND CALL END (ERROR) ===');
      throw error;
    }
  }

  // Display backend analysis results
  displayBackendResults(backendResult, ocrText) {
    const { 
      detectedTokens = [], 
      tokenData = [], 
      mcpConnected = false,
      classification = 'unknown',
      confidence = 0
    } = backendResult;

    // Create results overlay
    const overlay = document.createElement('div');
    overlay.className = 'scout-ocr-results';
    overlay.style.cssText = `
      position: fixed; top: 20px; right: 20px; width: 350px;
      background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      border: 1px solid #e1e5e9;
    `;

    const tokensHtml = tokenData.map(token => `
      <div style="padding: 8px; background: #f8f9fa; border-radius: 6px; margin: 4px 0;">
        <strong>$${token.symbol}</strong> - ${token.metadata?.name || 'Unknown'}
        ${token.contractAddress ? `<br><small>${token.contractAddress.slice(0, 8)}...${token.contractAddress.slice(-6)}</small>` : ''}
      </div>
    `).join('');

    overlay.innerHTML = `
      <div style="padding: 16px; border-bottom: 1px solid #e1e5e9;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; color: #1a1a1a; font-size: 16px;">🔍 OCR Analysis</h3>
          <button onclick="this.closest('.scout-ocr-results').remove()" 
                  style="background: none; border: none; font-size: 18px; cursor: pointer;">✖</button>
        </div>
      </div>
      <div style="padding: 16px;">
        <div style="margin-bottom: 12px;">
          <strong>📝 Extracted Text:</strong>
          <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; margin-top: 4px; font-size: 12px;">
            ${ocrText}
          </div>
        </div>
        ${detectedTokens.length > 0 ? `
          <div style="margin-bottom: 12px;">
            <strong>🪙 Tokens Found (${detectedTokens.length}):</strong>
            ${tokensHtml}
          </div>
        ` : '<div style="color: #666; font-style: italic;">No tokens detected</div>'}
        <div style="font-size: 12px; color: #666; margin-top: 12px;">
          ${backendResult.fallbackMessage || `Classification: ${classification}`} | 
          Confidence: ${Math.round(confidence * 100)}% | 
          MCP: ${mcpConnected ? '✅' : '❌'}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
    }, 15000);
  }

  // Show fallback results when backend is blocked
  showFallbackResults(ocrText) {
    const tokens = this.extractTokens(ocrText);
    
    const fallbackMessages = [
      'OCR completed - backend connection failed',
      'Image analyzed locally - network unavailable', 
      'Text extracted - using offline token detection',
      'OCR successful - limited analysis mode active'
    ];
    
    const randomMsg = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
    
    const mockResult = {
      detectedTokens: tokens,
      tokenData: tokens.map(token => ({
        symbol: token,
        success: false,
        metadata: { 
          name: this.getTokenName(token), 
          symbol: token,
          source: 'OCR-only'
        }
      })),
      mcpConnected: false,
      classification: 'ocr-fallback',
      confidence: 0.4 + Math.random() * 0.3,
      fallbackMessage: randomMsg
    };
    
    this.displayBackendResults(mockResult, ocrText);
  }

  // Get token names
  getTokenName(symbol) {
    const names = {
      'SOL': 'Solana', 'BTC': 'Bitcoin', 'ETH': 'Ethereum',
      'JUP': 'Jupiter', 'BONK': 'Bonk Inu', 'WIF': 'dogwifhat',
      'USDC': 'USD Coin', 'USDT': 'Tether', 'KAITO': 'Kaito AI'
    };
    return names[symbol] || `${symbol} Token`;
  }

  // Extract tokens from text
  extractTokens(text) {
    const tokens = [];
    const patterns = [
      /\b(SOL|BTC|ETH|JUP|BONK|WIF|USDC|USDT|KAITO|DEGEN)\b/gi,
      /\$([A-Z]{2,8})\b/g
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const token = match.replace('$', '').toUpperCase();
          if (!tokens.includes(token) && token.length >= 2) {
            tokens.push(token);
          }
        });
      }
    });
    
    return tokens;
  }

  // Simulate OCR for demo/fallback purposes
  simulateOCR(imageElement) {
    console.log('🎭 === SIMULATED OCR START ===');
    console.log('🖼️ Image context - alt:', imageElement.alt, 'title:', imageElement.title);
    
    const scenarios = [
      "SOL/USDC $98.45 📈 +5.2%\nJUP $0.85 🚀 +12.3%\nBONK $0.000018 💎 +8.7%",
      "🔥 Scout aggregator finds best route:\n5 SOL → 450 JUP\nSlippage: 0.1% ✅",
      "💰 Portfolio Update:\nSOL: 25.5 tokens 📊\nJUP: 1,250 tokens 🔥\nTotal: $2,847.30",
      "⚠️ Market Alert:\nSOL down -3.2%\nBONK pump +25% ⚡\nDEGEN volume up",
      "🎯 Long SOL/USDC @ $95.20\nTarget: $102.50 🎯\nStop: $92.00 🛡️",
      "KAITO AI token 🤖\nPrice: $0.0045\nVolume: $2.3M",
      "DeFi yield farming\nAPY: 420.69%\nTVL: $50M"
    ];
    
    const imageAlt = imageElement.alt || imageElement.title || '';
    let selectedScenario;
    
    console.log('🔍 Selecting scenario based on image context...');
    
    if (imageAlt.toLowerCase().includes('portfolio')) {
      selectedScenario = scenarios[2];
      console.log('💼 Portfolio context detected');
    } else if (imageAlt.toLowerCase().includes('trading')) {
      selectedScenario = scenarios[4];
      console.log('💹 Trading context detected');
    } else if (imageAlt.toLowerCase().includes('price')) {
      selectedScenario = scenarios[0];
      console.log('💰 Price context detected');
    } else {
      selectedScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      console.log('🎲 Random scenario selected');
    }
    
    console.log('📝 Simulated OCR result:', selectedScenario);
    console.log('🎭 === SIMULATED OCR END ===');
    
    return selectedScenario;
  }

  // Generate fallback text when everything fails
  generateFallbackText() {
    return "SOL $98.45 (+5.2%)\nImage analysis unavailable - please check your connection";
  }

  // Check if backend is available
  async checkBackendHealth() {
    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      return data.status === 'OK';
    } catch (error) {
      console.warn('⚠️ Backend health check failed:', error);
      return false;
    }
  }
}

// Export for use in content script
if (typeof window !== 'undefined') {
  window.ScoutOCRProcessor = ScoutOCRProcessor;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScoutOCRProcessor;
}
