// Scout OCR Integration Package
// Unified interface for OCR processing with Scout backend integration

class ScoutOCRIntegration {
  constructor() {
    this.processor = null;
    this.worker = null;
    this.isInitialized = false;
    this.backendAvailable = false;
    
    console.log('📦 Scout OCR Integration Package loading...');
  }

  // Initialize the OCR system
  async initialize() {
    try {
      console.log('🔧 Initializing Scout OCR system...');
      
      // Initialize OCR processor
      if (window.ScoutOCRProcessor) {
        this.processor = new window.ScoutOCRProcessor();
        console.log('✅ OCR Processor initialized');
      }
      
      // Initialize OCR worker (for fallback OCR)
      if (window.lensOCR) {
        this.worker = window.lensOCR;
        console.log('✅ OCR Worker available');
      }
      
      // Check backend availability
      this.backendAvailable = await this.checkBackend();
      
      this.isInitialized = true;
      console.log(`✅ Scout OCR Integration ready (Backend: ${this.backendAvailable ? 'Available' : 'Unavailable'})`);
      
      return {
        success: true,
        processor: !!this.processor,
        worker: !!this.worker,
        backend: this.backendAvailable
      };
      
    } catch (error) {
      console.error('❌ OCR Integration initialization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Main OCR processing function
  async processImage(imageElement) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🔍 Processing image with Scout OCR Integration...');
      
      if (this.processor && this.backendAvailable) {
        // Use full OCR + backend pipeline
        console.log('🚀 Using OCR + Backend pipeline');
        const result = await this.processor.processImage(imageElement);
        
        if (result.success) {
          return {
            success: true,
            mode: 'ocr-backend',
            ocrText: result.ocrText,
            backendAnalysis: result.backendAnalysis,
            recommendation: this.generateRecommendation(result)
          };
        }
      }
      
      // Fallback to worker-only OCR
      if (this.worker) {
        console.log('🔄 Using fallback OCR worker');
        const imageDataURL = await this.imageToDataURL(imageElement);
        const result = await this.worker.processImage(imageDataURL);
        
        if (result.success) {
          return {
            success: true,
            mode: 'ocr-only',
            ocrText: result.text,
            localAnalysis: {
              tokens: result.tokens,
              sentiment: result.sentiment,
              confidence: result.confidence
            },
            recommendation: {
              action: 'manual_review',
              message: 'Backend unavailable - manual review recommended',
              priority: 'medium'
            }
          };
        }
      }
      
      // Ultimate fallback
      throw new Error('All OCR methods failed');
      
    } catch (error) {
      console.error('❌ Image processing failed:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackResult()
      };
    }
  }

  // Process text directly (bypass OCR)
  async processText(text) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.processor && this.backendAvailable) {
        const result = await this.processor.sendToBackend(text);
        return {
          success: true,
          mode: 'text-backend',
          inputText: text,
          backendAnalysis: result
        };
      } else {
        throw new Error('Backend not available for text processing');
      }
    } catch (error) {
      console.error('❌ Text processing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate recommendation based on analysis
  generateRecommendation(result) {
    const { backendAnalysis, ocrText } = result;
    
    if (!backendAnalysis || !backendAnalysis.success) {
      return {
        action: 'retry',
        message: 'Analysis incomplete - retry recommended',
        priority: 'low'
      };
    }

    const { detectedTokens = [], detectedContracts = [], confidence = 0 } = backendAnalysis.result || {};
    
    if (detectedTokens.length > 0) {
      return {
        action: 'review_tokens',
        message: `Found ${detectedTokens.length} token(s): ${detectedTokens.join(', ')}`,
        priority: confidence > 0.8 ? 'high' : 'medium',
        tokens: detectedTokens
      };
    }
    
    if (detectedContracts.length > 0) {
      return {
        action: 'review_contracts',
        message: `Found ${detectedContracts.length} contract(s) - verify before interaction`,
        priority: 'high',
        contracts: detectedContracts
      };
    }
    
    return {
      action: 'no_action',
      message: 'No significant Web3 entities detected',
      priority: 'low'
    };
  }

  // Generate fallback result when everything fails
  generateFallbackResult() {
    return {
      success: true,
      mode: 'fallback',
      ocrText: 'OCR processing unavailable',
      localAnalysis: {
        tokens: [],
        sentiment: 'unknown',
        confidence: 0
      },
      recommendation: {
        action: 'manual_check',
        message: 'Please check your connection and try again',
        priority: 'low'
      }
    };
  }

  // Helper: Convert image to data URL
  async imageToDataURL(imageElement) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = imageElement.naturalWidth || imageElement.width || 300;
        canvas.height = imageElement.naturalHeight || imageElement.height || 200;
        
        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    });  }

  // Check backend availability
  async checkBackend() {
    try {
      const response = await fetch('http://localhost:3001/api/process', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: 'health check'
        })
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.log('Backend check failed:', error);
      return false;
    }
  }

  // Get system status
  getStatus() {
    return {
      initialized: this.isInitialized,
      processor: !!this.processor,
      worker: !!this.worker,
      backend: this.backendAvailable,
      ready: this.isInitialized && (this.processor || this.worker)
    };
  }

  // Reinitialize system (useful for reconnecting to backend)
  async reinitialize() {
    console.log('🔄 Reinitializing Scout OCR Integration...');
    this.isInitialized = false;
    return await this.initialize();
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.ScoutOCR = new ScoutOCRIntegration();
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ScoutOCR.initialize();
    });
  } else {
    window.ScoutOCR.initialize();
  }
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScoutOCRIntegration;
}
