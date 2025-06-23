// AI Token Analyzer for Scout Social Trader
// Extracts cryptocurrency token tickers from OCR text using OpenRouter API

class AITokenAnalyzer {
  constructor() {
    this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.apiKey = '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'; // Replace with actual API key
    this.model = 'google/gemma-3n-e4b-it:free';
  }

  // Main function to analyze OCR text and extract tokens
  async analyzeText(ocrText) {
    try {
      console.log('🤖 Starting AI analysis of OCR text:', ocrText.substring(0, 100) + '...');
      
      const prompt = this.buildPrompt(ocrText);
      const response = await this.callOpenRouterAPI(prompt);
      
      if (response.success) {
        const analysis = this.parseResponse(response.data);
        console.log('✅ AI analysis completed:', analysis);
        return analysis;
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      return this.getFallbackAnalysis(ocrText);
    }
  }

  // Build optimized prompt for token extraction
  buildPrompt(ocrText) {
    return `Analyze this text extracted from an image and find cryptocurrency token tickers.

TEXT TO ANALYZE:
${ocrText}

INSTRUCTIONS:
1. Find all cryptocurrency token tickers (like SOL, BTC, ETH, JUP, BONK, etc.)
2. Look for price information associated with tokens
3. Determine overall sentiment (bullish/bearish/neutral)
4. Extract any trading signals or recommendations

RESPOND IN THIS EXACT JSON FORMAT:
{
  "tokens_found": ["SOL", "JUP"],
  "prices": ["$98.45", "$1.84"],
  "sentiment": "bullish",
  "confidence": 0.85,
  "summary": "Brief analysis summary",
  "trading_signals": ["price up", "volume increase"]
}

If no tokens found, return:
{
  "tokens_found": [],
  "prices": [],
  "sentiment": "neutral",
  "confidence": 0.0,
  "summary": "No cryptocurrency tokens detected in the text",
  "trading_signals": []
}`;
  }

  // Call OpenRouter API
  async callOpenRouterAPI(prompt) {
    try {
      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      };

      const response = await fetch(this.apiUrl, options);
      const data = await response.json();

      if (response.ok && data.choices && data.choices[0]) {
        return {
          success: true,
          data: data.choices[0].message.content
        };
      } else {
        throw new Error(data.error?.message || 'API request failed');
      }
    } catch (error) {
      console.error('❌ OpenRouter API call failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Parse AI response
  parseResponse(responseText) {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        tokens: parsed.tokens_found || [],
        prices: parsed.prices || [],
        sentiment: parsed.sentiment || 'neutral',
        confidence: parsed.confidence || 0.0,
        summary: parsed.summary || 'Analysis completed',
        tradingSignals: parsed.trading_signals || []
      };
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error);
      return this.getFallbackAnalysis(responseText);
    }
  }

  // Fallback analysis using regex patterns
  getFallbackAnalysis(text) {
    console.log('🔄 Using fallback token extraction...');
    
    const tokens = [];
    const prices = [];
    
    // Common crypto token patterns
    const tokenPatterns = [
      /\b(SOL|BTC|ETH|JUP|BONK|WIF|USDC|USDT)\b/gi,
      /\$([A-Z]{2,6})\b/g
    ];
    
    // Price patterns
    const pricePatterns = [
      /\$\d+(?:\.\d{1,6})?/g,
      /\d+(?:\.\d{1,6})?\s*(?:USD|USDC)/gi
    ];
    
    // Extract tokens
    tokenPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const token = match.replace('$', '').toUpperCase();
          if (!tokens.includes(token)) {
            tokens.push(token);
          }
        });
      }
    });
    
    // Extract prices
    pricePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!prices.includes(match)) {
            prices.push(match);
          }
        });
      }
    });
    
    // Determine sentiment
    let sentiment = 'neutral';
    const bullishWords = ['up', 'pump', 'moon', 'bullish', 'gain', '+', 'rise'];
    const bearishWords = ['down', 'dump', 'crash', 'bearish', 'loss', '-', 'fall'];
    
    const lowerText = text.toLowerCase();
    const bullishCount = bullishWords.filter(word => lowerText.includes(word)).length;
    const bearishCount = bearishWords.filter(word => lowerText.includes(word)).length;
    
    if (bullishCount > bearishCount) sentiment = 'bullish';
    else if (bearishCount > bullishCount) sentiment = 'bearish';
    
    return {
      tokens: tokens,
      prices: prices,
      sentiment: sentiment,
      confidence: tokens.length > 0 ? 0.7 : 0.1,
      summary: tokens.length > 0 ? 
        `Found ${tokens.length} token(s): ${tokens.join(', ')}` : 
        'No cryptocurrency tokens detected',
      tradingSignals: []
    };
  }
}

// Export for use in content script
if (typeof window !== 'undefined') {
  window.AITokenAnalyzer = AITokenAnalyzer;
}