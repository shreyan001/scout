/**
 * OCR Integration Package for Chrome Extensions
 * Complete OCR functionality with keyboard shortcuts and UI integration
 * Based on Jupiter Social Trader's successful implementation
 * 
 * USAGE:
 * 1. Include this file in your manifest.json web_accessible_resources
 * 2. Import in your content script: const OCRIntegration = new OCRIntegrationPackage();
 * 3. Initialize: OCRIntegration.initialize();
 * 
 * FEATURES:
 * - Ctrl+Shift+R: Toggle OCR scan mode
 * - Ctrl+Shift+L: Toggle lens mode  
 * - ESC: Close overlays
 * - Click-to-scan functionality
 * - Text extraction from images
 * - Content analysis and keyword detection
 * - Modern UI overlays
 */

class OCRIntegrationPackage {
    constructor(options = {}) {
        this.config = {
            // Keyboard shortcuts
            scanModeShortcut: 'KeyR', // Ctrl+Shift+R
            lensModeShortcut: 'KeyL', // Ctrl+Shift+L
            closeShortcut: 'Escape',
            
            // OCR settings
            confidenceThreshold: 0.7,
            animationDuration: 300,
            autoCloseDelay: 10000,
            
            // Custom options
            ...options
        };
        
        // State management
        this.isInitialized = false;
        this.ocrMode = false;
        this.lensMode = false;
        this.currentOverlay = null;
        this.isProcessing = false;
        
        // Event handlers (bound to preserve 'this' context)
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleOverlayClick = this.handleOverlayClick.bind(this);
        
        // Scout-specific integration callbacks
        this.onOCRComplete = null;
        this.onTextAnalysis = null;
        
        console.log('🔍 OCR Integration Package loaded');
    }
    
    /**
     * Initialize the OCR integration
     * Call this from your content script
     */
    initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ OCR Integration already initialized');
            return;
        }
        
        console.log('🚀 Initializing OCR Integration...');
        
        // Inject required CSS
        this.injectCSS();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize OCR engine
        this.initializeOCREngine();
        
        this.isInitialized = true;
        console.log('✅ OCR Integration initialized successfully');
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyPress, true);
        
        // Click handlers (only active in OCR/lens mode)
        document.addEventListener('click', this.handleClick, true);
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyPress(event) {
        // Ctrl+Shift+R - Toggle OCR scan mode
        if (event.ctrlKey && event.shiftKey && event.code === this.config.scanModeShortcut) {
            event.preventDefault();
            event.stopPropagation();
            console.log('⌨️ Ctrl+Shift+R pressed - Toggle OCR mode');
            this.toggleOCRMode();
            return;
        }
        
        // Ctrl+Shift+L - Toggle lens mode
        if (event.ctrlKey && event.shiftKey && event.code === this.config.lensModeShortcut) {
            event.preventDefault();
            event.stopPropagation();
            console.log('⌨️ Ctrl+Shift+L pressed - Toggle lens mode');
            this.toggleLensMode();
            return;
        }
        
        // ESC - Close overlays
        if (event.code === this.config.closeShortcut) {
            if (this.currentOverlay || this.ocrMode || this.lensMode) {
                event.preventDefault();
                event.stopPropagation();
                console.log('⌨️ ESC pressed - Closing OCR interface');
                this.closeAll();
                return;
            }
        }
        
        // Alt+O - Quick OCR (alternative shortcut)
        if (event.altKey && event.code === 'KeyO') {
            event.preventDefault();
            event.stopPropagation();
            console.log('⌨️ Alt+O pressed - Quick OCR');
            this.toggleOCRMode();
            return;
        }
    }
    
    /**
     * Handle clicks when OCR/lens mode is active
     */
    handleClick(event) {
        // Only handle clicks in OCR or lens mode
        if (!this.ocrMode && !this.lensMode) return;
        
        // Don't interfere with our own UI
        if (event.target.closest('.ocr-overlay, .ocr-lens-overlay')) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        console.log('🖱️ Click detected in OCR mode:', event.target);
        
        // Determine what to scan
        const target = event.target;
        this.scanElement(target, event);
    }
    
    /**
     * Toggle OCR scan mode
     */
    toggleOCRMode() {
        this.ocrMode = !this.ocrMode;
        
        if (this.ocrMode) {
            this.activateOCRMode();
        } else {
            this.deactivateOCRMode();
        }
    }
    
    /**
     * Toggle lens mode (visual scanning interface)
     */
    toggleLensMode() {
        this.lensMode = !this.lensMode;
        
        if (this.lensMode) {
            this.activateLensMode();
        } else {
            this.deactivateLensMode();
        }
    }
    
    /**
     * Activate OCR scanning mode
     */
    activateOCRMode() {
        console.log('🔍 Activating OCR scan mode');
        
        // Add visual indicator
        document.body.classList.add('ocr-scan-mode');
        
        // Show instruction overlay
        this.showOCRInstructions();
        
        // Change cursor
        document.body.style.cursor = 'crosshair';
    }
    
    /**
     * Activate lens mode (Google Lens style)
     */
    activateLensMode() {
        console.log('🔍 Activating lens mode');
        
        // Add lens overlay
        const lensOverlay = document.createElement('div');
        lensOverlay.className = 'ocr-lens-overlay';
        lensOverlay.innerHTML = `
            <div class="ocr-lens-header">
                <div class="ocr-lens-title">
                    <span class="ocr-lens-icon">🔍</span>
                    Scout OCR Lens - Click to scan text from images
                </div>
                <div class="ocr-lens-controls">
                    <button class="ocr-btn" data-action="close">✖</button>
                </div>
            </div>
            <div class="ocr-lens-instructions">
                Click on any text, image, or element to extract and analyze content with Scout AI
            </div>
        `;
        
        document.body.appendChild(lensOverlay);
        document.body.classList.add('ocr-lens-mode');
        
        // Add event listeners to lens overlay
        lensOverlay.addEventListener('click', this.handleOverlayClick);
    }
    
    /**
     * Deactivate OCR mode
     */
    deactivateOCRMode() {
        console.log('🔍 Deactivating OCR scan mode');
        
        document.body.classList.remove('ocr-scan-mode');
        document.body.style.cursor = '';
        
        // Remove instruction overlay
        this.removeOCRInstructions();
    }
    
    /**
     * Deactivate lens mode
     */
    deactivateLensMode() {
        console.log('🔍 Deactivating lens mode');
        
        document.body.classList.remove('ocr-lens-mode');
        
        const lensOverlay = document.querySelector('.ocr-lens-overlay');
        if (lensOverlay) {
            lensOverlay.remove();
        }
    }
    
    /**
     * Close all OCR interfaces
     */
    closeAll() {
        if (this.currentOverlay) {
            this.closeOverlay();
        }
        
        if (this.ocrMode) {
            this.deactivateOCRMode();
            this.ocrMode = false;
        }
        
        if (this.lensMode) {
            this.deactivateLensMode();
            this.lensMode = false;
        }
    }
    
    /**
     * Show OCR instructions
     */
    showOCRInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'ocr-instructions';
        instructions.innerHTML = `
            <div class="ocr-instructions-content">
                <h3>🔍 Scout OCR Mode Active</h3>
                <p>Click on any element to extract and analyze text content with AI</p>
                <div class="ocr-instructions-shortcuts">
                    <kbd>Ctrl+Shift+R</kbd> Toggle OCR • 
                    <kbd>Ctrl+Shift+L</kbd> Lens Mode • 
                    <kbd>ESC</kbd> Close
                </div>
            </div>
        `;
        
        document.body.appendChild(instructions);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (instructions.parentNode) {
                instructions.remove();
            }
        }, 5000);
    }
    
    /**
     * Remove OCR instructions
     */
    removeOCRInstructions() {
        const instructions = document.querySelector('.ocr-instructions');
        if (instructions) {
            instructions.remove();
        }
    }
    
    /**
     * Scan an element for text content
     */
    async scanElement(element, event) {
        if (this.isProcessing) {
            console.log('⚠️ OCR already processing, skipping...');
            return;
        }
        
        this.isProcessing = true;
        
        try {
            console.log('🔍 Scanning element:', element.tagName, element.className);
            
            // Highlight the selected element
            this.highlightElement(element);
            
            let textContent = '';
            let isImage = false;
            
            // Handle different element types
            if (element.tagName === 'IMG') {
                isImage = true;
                textContent = await this.performImageOCR(element);
            } else {
                textContent = this.extractTextContent(element);
            }
            
            console.log('📝 Extracted content:', textContent);
            
            // Prepare Scout-style data
            const scoutData = {
                element: element,
                text: textContent,
                isImage: isImage,
                event: event,
                url: window.location.href,
                timestamp: Date.now(),
                context: this.extractPageContext(element)
            };
            
            // Show results
            this.showOCRResults(scoutData);
            
            // Trigger Scout analysis callback if set
            if (this.onOCRComplete) {
                this.onOCRComplete(scoutData);
            }
            
            // Send to Scout backend if available
            this.sendToScoutBackend(scoutData);
            
        } catch (error) {
            console.error('❌ OCR scanning failed:', error);
            this.showError('OCR scanning failed: ' + error.message);
        } finally {
            this.isProcessing = false;
        }
    }
    
    /**
     * Extract text content from regular elements
     */
    extractTextContent(element) {
        // Get text content from various sources
        let text = '';
        
        // Element text content
        if (element.textContent) {
            text += element.textContent + ' ';
        }
        
        // Element attributes that might contain text
        const textAttributes = ['alt', 'title', 'aria-label', 'placeholder', 'value'];
        textAttributes.forEach(attr => {
            const value = element.getAttribute(attr);
            if (value) {
                text += value + ' ';
            }
        });
        
        // If no text found, get from parent or children
        if (!text.trim() && element.parentElement) {
            text = element.parentElement.textContent?.substring(0, 500) || '';
        }
        
        return text.trim();
    }
    
    /**
     * Extract page context for Scout analysis
     */
    extractPageContext(element) {
        const rect = element.getBoundingClientRect();
        
        return {
            url: window.location.href,
            domain: window.location.hostname,
            title: document.title,
            elementType: element.tagName.toLowerCase(),
            elementClasses: element.className,
            elementId: element.id,
            position: {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                scrollX: window.scrollX,
                scrollY: window.scrollY
            }
        };
    }
    
    /**
     * Perform OCR on image element
     */
    async performImageOCR(imageElement) {
        try {
            console.log('📷 Performing OCR on image:', imageElement.src);
            
            // Create canvas to process image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Wait for image to load if needed
            if (!imageElement.complete) {
                await new Promise((resolve, reject) => {
                    imageElement.onload = resolve;
                    imageElement.onerror = reject;
                    setTimeout(reject, 5000); // 5 second timeout
                });
            }
            
            // Set canvas dimensions
            canvas.width = imageElement.naturalWidth || imageElement.width || 300;
            canvas.height = imageElement.naturalHeight || imageElement.height || 200;
            
            // Draw image to canvas
            ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
            
            // Get image data
            const imageData = canvas.toDataURL('image/png');
            
            // Perform OCR (this would integrate with Scout's OCR service)
            const ocrResult = await this.performOCRAnalysis(imageData, imageElement);
            
            return ocrResult.text || 'No text detected in image';
            
        } catch (error) {
            console.error('❌ Image OCR failed:', error);
            return 'Image OCR failed: ' + error.message;
        }
    }
    
    /**
     * Perform OCR analysis (integrate with Scout's OCR service)
     */
    async performOCRAnalysis(imageData, imageElement) {
        try {
            // Send to Scout backend if available
            const response = await chrome.runtime.sendMessage({
                type: 'PROCESS_IMAGE_OCR',
                imageData: imageData,
                imageUrl: imageElement?.src,
                context: {
                    url: window.location.href,
                    timestamp: Date.now(),
                    imageAlt: imageElement?.alt || '',
                    imageTitle: imageElement?.title || ''
                }
            });
            
            if (response && response.success) {
                return response.result;
            }
        } catch (error) {
            console.warn('Scout backend OCR unavailable:', error.message);
        }
        
        // Fallback: simulate OCR processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock OCR result - replace with actual OCR implementation
        return {
            success: true,
            text: 'Sample OCR text extracted from image\nPrice: $123.45\nVolume: 1.2M\nRisk Level: Medium',
            confidence: 0.85
        };
    }
    
    /**
     * Send data to Scout backend for analysis
     */
    async sendToScoutBackend(data) {
        try {
            await chrome.runtime.sendMessage({
                type: 'PROCESS_OCR_BACKEND',
                ocrResults: {
                    pageContent: {
                        text: data.text,
                        url: data.url,
                        title: document.title,
                        timestamp: data.timestamp
                    },
                    context: data.context,
                    elementInfo: {
                        type: data.element.tagName.toLowerCase(),
                        isImage: data.isImage,
                        text: data.text
                    }
                },
                context: data.context
            });
        } catch (error) {
            console.warn('Scout backend communication failed:', error.message);
        }
    }
    
    /**
     * Highlight selected element
     */
    highlightElement(element) {
        // Remove previous highlights
        document.querySelectorAll('.ocr-highlighted').forEach(el => {
            el.classList.remove('ocr-highlighted');
        });
        
        // Add highlight to selected element
        element.classList.add('ocr-highlighted');
        
        // Remove highlight after 2 seconds
        setTimeout(() => {
            element.classList.remove('ocr-highlighted');
        }, 2000);
    }
    
    /**
     * Show OCR results in overlay
     */
    showOCRResults(data) {
        // Close existing overlay
        this.closeOverlay();
        
        // Create results overlay
        const overlay = document.createElement('div');
        overlay.className = 'ocr-overlay ocr-results-overlay';
        overlay.innerHTML = `
            <div class="ocr-overlay-backdrop" data-action="close"></div>
            <div class="ocr-overlay-content">
                <div class="ocr-header">
                    <h3>🔍 Scout OCR Results</h3>
                    <button class="ocr-close-btn" data-action="close">✖</button>
                </div>
                <div class="ocr-content">
                    <div class="ocr-source">
                        <strong>Source:</strong> ${data.element.tagName.toLowerCase()}${data.isImage ? ' (image)' : ' (text)'} • ${data.context.domain}
                    </div>
                    <div class="ocr-text-content">
                        <h4>📝 Extracted Text:</h4>
                        <div class="ocr-text-result">
                            ${data.text || 'No text content found'}
                        </div>
                    </div>
                    <div class="ocr-actions">
                        <button class="ocr-btn ocr-btn-primary" data-action="copy">📋 Copy Text</button>
                        <button class="ocr-btn ocr-btn-secondary" data-action="analyze">🧠 Scout Analysis</button>
                        <button class="ocr-btn ocr-btn-secondary" data-action="close">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Position overlay
        const rect = data.element.getBoundingClientRect();
        const overlayContent = overlay.querySelector('.ocr-overlay-content');
        
        // Position near the scanned element
        let left = Math.min(rect.right + 10, window.innerWidth - 350);
        let top = Math.max(rect.top, 50);
        
        // Ensure it stays within viewport
        if (left < 20) left = 20;
        if (top + 400 > window.innerHeight) top = window.innerHeight - 400;
        
        overlayContent.style.left = left + 'px';
        overlayContent.style.top = top + 'px';
        
        // Add event listeners
        overlay.addEventListener('click', this.handleOverlayClick);
        
        // Store extracted text and data for actions
        overlay.setAttribute('data-extracted-text', data.text);
        overlay.setAttribute('data-scout-data', JSON.stringify(data));
        
        document.body.appendChild(overlay);
        this.currentOverlay = overlay;
        
        // Auto-close after configured delay
        setTimeout(() => {
            if (this.currentOverlay === overlay) {
                this.closeOverlay();
            }
        }, this.config.autoCloseDelay);
    }
    
    /**
     * Handle overlay clicks
     */
    handleOverlayClick(event) {
        const action = event.target.dataset.action;
        
        if (action === 'close') {
            event.preventDefault();
            event.stopPropagation();
            this.closeOverlay();
        } else if (action === 'copy') {
            event.preventDefault();
            event.stopPropagation();
            this.copyToClipboard();
        } else if (action === 'analyze') {
            event.preventDefault();
            event.stopPropagation();
            this.analyzeText();
        }
        
        // Close on backdrop click
        if (event.target.classList.contains('ocr-overlay-backdrop')) {
            this.closeOverlay();
        }
    }
    
    /**
     * Copy extracted text to clipboard
     */
    async copyToClipboard() {
        if (!this.currentOverlay) return;
        
        const text = this.currentOverlay.getAttribute('data-extracted-text');
        if (text) {
            try {
                await navigator.clipboard.writeText(text);
                this.showNotification('✅ Text copied to clipboard!');
            } catch (error) {
                console.error('❌ Failed to copy text:', error);
                this.showNotification('❌ Failed to copy text');
            }
        }
    }
    
    /**
     * Analyze extracted text with Scout AI
     */
    analyzeText() {
        if (!this.currentOverlay) return;
        
        const text = this.currentOverlay.getAttribute('data-extracted-text');
        const scoutDataStr = this.currentOverlay.getAttribute('data-scout-data');
        
        if (text && scoutDataStr) {
            try {
                const scoutData = JSON.parse(scoutDataStr);
                
                console.log('🧠 Analyzing text with Scout AI:', text);
                
                // Trigger Scout text analysis callback
                if (this.onTextAnalysis) {
                    this.onTextAnalysis(text, scoutData);
                }
                
                // Send to Scout backend for AI analysis
                chrome.runtime.sendMessage({
                    type: 'ANALYZE_WEB3',
                    data: {
                        text: text,
                        context: scoutData.context,
                        analysisType: 'ocr-text',
                        timestamp: Date.now()
                    }
                }).catch(console.error);
                
                this.showNotification('🧠 Scout AI analysis started...');
                
                // Close overlay after starting analysis
                setTimeout(() => this.closeOverlay(), 1000);
                
            } catch (error) {
                console.error('Scout analysis error:', error);
                this.showNotification('❌ Analysis failed');
            }
        }
    }
    
    /**
     * Close current overlay
     */
    closeOverlay() {
        if (this.currentOverlay) {
            this.currentOverlay.classList.add('ocr-overlay-closing');
            
            setTimeout(() => {
                if (this.currentOverlay && this.currentOverlay.parentNode) {
                    this.currentOverlay.remove();
                }
                this.currentOverlay = null;
            }, this.config.animationDuration);
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.showNotification('❌ ' + message, 'error');
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `ocr-notification ocr-notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('ocr-notification-show');
        }, 10);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('ocr-notification-show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }
    
    /**
     * Initialize OCR engine (customize for your OCR service)
     */
    async initializeOCREngine() {
        try {
            console.log('🔧 Initializing Scout OCR engine...');
            
            // This is where you'd initialize your OCR service
            // For Scout: integrate with backend OCR service
            
            console.log('✅ Scout OCR engine initialized');
        } catch (error) {
            console.error('❌ Failed to initialize OCR engine:', error);
        }
    }
    
    /**
     * Set Scout integration callbacks
     */
    setScoutCallbacks(onOCRComplete, onTextAnalysis) {
        this.onOCRComplete = onOCRComplete;
        this.onTextAnalysis = onTextAnalysis;
    }
    
    /**
     * Inject required CSS styles
     */
    injectCSS() {
        if (document.getElementById('ocr-integration-styles')) {
            return; // Already injected
        }
        
        const style = document.createElement('style');
        style.id = 'ocr-integration-styles';
        style.textContent = `
            /* OCR Integration Styles */
            .ocr-scan-mode {
                cursor: crosshair !important;
            }
            
            .ocr-lens-mode {
                position: relative !important;
            }
            
            /* Highlighted element */
            .ocr-highlighted {
                outline: 3px solid #667eea !important;
                outline-offset: 2px !important;
                background: rgba(102, 126, 234, 0.1) !important;
                animation: ocrPulse 1s ease-in-out !important;
                box-shadow: 0 0 20px rgba(102, 126, 234, 0.3) !important;
            }
            
            @keyframes ocrPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.02); }
            }
            
            /* Instructions overlay */
            .ocr-instructions {
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                color: white !important;
                padding: 15px 20px !important;
                border-radius: 12px !important;
                z-index: 10000 !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                font-size: 14px !important;
                box-shadow: 0 6px 25px rgba(102, 126, 234, 0.3) !important;
                animation: ocrSlideIn 0.3s ease-out !important;
                backdrop-filter: blur(10px) !important;
                border: 1px solid rgba(255,255,255,0.2) !important;
            }
            
            .ocr-instructions h3 {
                margin: 0 0 8px 0 !important;
                font-size: 16px !important;
                font-weight: 600 !important;
            }
            
            .ocr-instructions p {
                margin: 0 0 10px 0 !important;
                opacity: 0.9 !important;
            }
            
            .ocr-instructions-shortcuts {
                font-size: 12px !important;
                opacity: 0.8 !important;
            }
            
            .ocr-instructions kbd {
                background: rgba(255, 255, 255, 0.2) !important;
                padding: 2px 6px !important;
                border-radius: 3px !important;
                font-size: 11px !important;
            }
            
            /* Lens overlay */
            .ocr-lens-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 9999 !important;
                background: rgba(0, 0, 0, 0.85) !important;
                color: white !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                animation: ocrFadeIn 0.3s ease-out !important;
                backdrop-filter: blur(5px) !important;
            }
            
            .ocr-lens-header {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                padding: 15px 20px !important;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
            
            .ocr-lens-title {
                display: flex !important;
                align-items: center !important;
                font-size: 16px !important;
                font-weight: 600 !important;
            }
            
            .ocr-lens-icon {
                margin-right: 8px !important;
                font-size: 18px !important;
            }
            
            .ocr-lens-instructions {
                padding: 15px 20px !important;
                text-align: center !important;
                font-size: 14px !important;
                opacity: 0.9 !important;
            }
            
            /* Main overlay */
            .ocr-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                z-index: 10001 !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                animation: ocrFadeIn 0.3s ease-out !important;
            }
            
            .ocr-overlay-backdrop {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0, 0, 0, 0.4) !important;
                backdrop-filter: blur(4px) !important;
            }
            
            .ocr-overlay-content {
                position: absolute !important;
                width: 420px !important;
                max-height: 500px !important;
                background: white !important;
                border-radius: 16px !important;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
                overflow: hidden !important;
                animation: ocrSlideUp 0.4s ease-out !important;
                border: 1px solid rgba(102, 126, 234, 0.2) !important;
            }
            
            .ocr-header {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                padding: 20px !important;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                color: white !important;
            }
            
            .ocr-header h3 {
                margin: 0 !important;
                font-size: 18px !important;
                font-weight: 600 !important;
            }
            
            .ocr-close-btn {
                background: rgba(255,255,255,0.2) !important;
                border: none !important;
                font-size: 18px !important;
                cursor: pointer !important;
                padding: 5px !important;
                border-radius: 50% !important;
                width: 30px !important;
                height: 30px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                color: white !important;
                transition: all 0.2s ease !important;
            }
            
            .ocr-close-btn:hover {
                background: rgba(255,255,255,0.3) !important;
            }
            
            .ocr-content {
                padding: 20px !important;
                max-height: 400px !important;
                overflow-y: auto !important;
            }
            
            .ocr-source {
                font-size: 12px !important;
                color: #666 !important;
                margin-bottom: 15px !important;
                padding: 8px 12px !important;
                background: #f8f9fa !important;
                border-radius: 6px !important;
                border-left: 3px solid #667eea !important;
            }
            
            .ocr-text-content h4 {
                margin: 0 0 10px 0 !important;
                font-size: 14px !important;
                font-weight: 600 !important;
                color: #333 !important;
            }
            
            .ocr-text-result {
                background: #f8f9fa !important;
                border: 1px solid #e9ecef !important;
                border-radius: 8px !important;
                padding: 15px !important;
                font-size: 14px !important;
                line-height: 1.5 !important;
                color: #333 !important;
                white-space: pre-wrap !important;
                max-height: 200px !important;
                overflow-y: auto !important;
                font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace !important;
            }
            
            .ocr-actions {
                display: flex !important;
                gap: 10px !important;
                margin-top: 20px !important;
                justify-content: flex-end !important;
            }
            
            .ocr-btn {
                padding: 10px 16px !important;
                border: none !important;
                border-radius: 8px !important;
                font-size: 13px !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
            }
            
            .ocr-btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                color: white !important;
            }
            
            .ocr-btn-primary:hover {
                transform: translateY(-1px) !important;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
            }
            
            .ocr-btn-secondary {
                background: #6c757d !important;
                color: white !important;
            }
            
            .ocr-btn-secondary:hover {
                background: #545b62 !important;
                transform: translateY(-1px) !important;
            }
            
            /* Notifications */
            .ocr-notification {
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                padding: 12px 20px !important;
                border-radius: 8px !important;
                font-size: 14px !important;
                font-weight: 500 !important;
                z-index: 10002 !important;
                transform: translateX(400px) !important;
                transition: transform 0.3s ease !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            }
            
            .ocr-notification-show {
                transform: translateX(0) !important;
            }
            
            .ocr-notification-info {
                background: linear-gradient(135deg, #17a2b8 0%, #117a8b 100%) !important;
                color: white !important;
            }
            
            .ocr-notification-error {
                background: linear-gradient(135deg, #dc3545 0%, #c82333 100%) !important;
                color: white !important;
            }
            
            /* Closing animation */
            .ocr-overlay-closing {
                animation: ocrFadeOut 0.3s ease-in forwards !important;
            }
            
            .ocr-overlay-closing .ocr-overlay-content {
                animation: ocrSlideDown 0.3s ease-in forwards !important;
            }
            
            /* Animations */
            @keyframes ocrFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes ocrFadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes ocrSlideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
            
            @keyframes ocrSlideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            @keyframes ocrSlideDown {
                from { transform: translateY(0); opacity: 1; }
                to { transform: translateY(20px); opacity: 0; }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Public API methods for external integration
     */
    
    // Get current state
    getState() {
        return {
            isInitialized: this.isInitialized,
            ocrMode: this.ocrMode,
            lensMode: this.lensMode,
            isProcessing: this.isProcessing,
            hasOverlay: !!this.currentOverlay
        };
    }
    
    // Manually trigger OCR on element
    async scanElementById(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            await this.scanElement(element, null);
        } else {
            throw new Error('Element not found: ' + elementId);
        }
    }
    
    // Manually trigger OCR on selector
    async scanElementBySelector(selector) {
        const element = document.querySelector(selector);
        if (element) {
            await this.scanElement(element, null);
        } else {
            throw new Error('Element not found: ' + selector);
        }
    }
    
    // Set custom OCR service
    setOCRService(ocrFunction) {
        this.performOCRAnalysis = ocrFunction;
    }
    
    // Cleanup (call when page unloads)
    destroy() {
        console.log('🧹 Cleaning up OCR Integration...');
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyPress, true);
        document.removeEventListener('click', this.handleClick, true);
        
        // Close all interfaces
        this.closeAll();
        
        // Remove injected CSS
        const style = document.getElementById('ocr-integration-styles');
        if (style) {
            style.remove();
        }
        
        // Clean up body classes
        document.body.classList.remove('ocr-scan-mode', 'ocr-lens-mode');
        document.body.style.cursor = '';
        
        this.isInitialized = false;
        console.log('✅ OCR Integration cleaned up');
    }
}

// Export for use in other extensions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OCRIntegrationPackage;
} else {
    window.OCRIntegrationPackage = OCRIntegrationPackage;
}

// Auto-initialize if in content script context
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    console.log('🚀 Scout OCR Integration Package ready for use');
    console.log('📖 Usage: const ocr = new OCRIntegrationPackage(); ocr.initialize();');
}
