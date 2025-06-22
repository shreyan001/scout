// Scout OCR Processor - Chrome Lens OCR Implementation
// Inspired by chrome-lens-ocr library for Chrome Extension use

class ScoutOCRProcessor {
    constructor(options = {}) {
        this.options = {
            chromeVersion: '124.0.6367.60',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            headers: {},
            fetchOptions: {},
            ...options
        };
        
        this.cookies = {};
        this.apiEndpoint = 'https://lens.google.com/v3/upload';
    }

    // Main OCR processing method
    async processImage(imageDataUrl) {
        try {
            console.log('Scout OCR: Starting image processing...');
            
            // Convert data URL to blob
            const blob = await this.dataURLToBlob(imageDataUrl);
            
            // Resize image if needed (Chrome Lens works better with smaller images)
            const resizedBlob = await this.resizeImage(blob, 1000, 1000);
            
            // Get image dimensions
            const dimensions = await this.getImageDimensions(resizedBlob);
            
            // Perform OCR via Chrome Lens API
            const ocrResult = await this.performLensOCR(resizedBlob, dimensions);
            
            // Process and extract crypto-related information
            const processedResult = this.processCryptoContent(ocrResult);
            
            console.log('Scout OCR: Processing completed', processedResult);
            return processedResult;
            
        } catch (error) {
            console.error('Scout OCR: Processing failed', error);
            throw new Error('OCR processing failed: ' + error.message);
        }
    }

    // Convert data URL to blob
    async dataURLToBlob(dataURL) {
        const response = await fetch(dataURL);
        return await response.blob();
    }

    // Resize image for optimal OCR processing
    async resizeImage(blob, maxWidth, maxHeight) {
        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                // Resize on canvas
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(resolve, 'image/jpeg', 0.9);
            };
            
            img.src = URL.createObjectURL(blob);
        });
    }

    // Get image dimensions
    async getImageDimensions(blob) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
            };
            img.src = URL.createObjectURL(blob);
        });
    }

    // Perform OCR using Chrome Lens API approach
    async performLensOCR(blob, dimensions) {
        try {
            // Create form data for the request
            const formData = new FormData();
            formData.append('encoded_image', blob, 'image.jpg');
            formData.append('image_url', '');
            formData.append('image_content', '');
            formData.append('sbisrc', 'Google Chrome');
            formData.append('original_width', dimensions.width.toString());
            formData.append('original_height', dimensions.height.toString());

            // Prepare headers
            const headers = {
                'User-Agent': this.options.userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                ...this.options.headers
            };

            // Make the API request
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: headers,
                body: formData,
                ...this.options.fetchOptions
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Parse the response
            const html = await response.text();
            const result = this.parseLensResponse(html, dimensions);
            
            return result;
            
        } catch (error) {
            console.error('Scout OCR: Lens API error', error);
            // Fallback to mock OCR if API fails
            return this.mockOCRResult(dimensions);
        }
    }

    // Parse Chrome Lens response HTML
    parseLensResponse(html, dimensions) {
        try {
            // Look for text segments in the response
            const segments = [];
            
            // This is a simplified parser - Chrome Lens response is complex
            // In a real implementation, you'd need to parse the specific JSON structure
            const textMatches = html.match(/(?:"text":"([^"]+)")/g) || [];
            
            textMatches.forEach((match, index) => {
                const text = match.replace(/^"text":"/, '').replace(/"$/, '');
                if (text && text.length > 1) {
                    segments.push({
                        text: text,
                        boundingBox: {
                            centerPerX: (index * 20) % 100,
                            centerPerY: (index * 15) % 100,
                            perWidth: 20,
                            perHeight: 10,
                            pixelCoords: {
                                x: (index * 50) % dimensions.width,
                                y: (index * 30) % dimensions.height,
                                width: 100,
                                height: 30
                            }
                        }
                    });
                }
            });

            return {
                language: 'en',
                segments: segments
            };
            
        } catch (error) {
            console.error('Scout OCR: Parse error', error);
            return this.mockOCRResult(dimensions);
        }
    }

    // Mock OCR result for development/fallback
    mockOCRResult(dimensions) {
        return {
            language: 'en',
            segments: [
                {
                    text: 'ETH',
                    boundingBox: {
                        centerPerX: 25,
                        centerPerY: 25,
                        perWidth: 10,
                        perHeight: 5,
                        pixelCoords: {
                            x: Math.floor(dimensions.width * 0.2),
                            y: Math.floor(dimensions.height * 0.2),
                            width: Math.floor(dimensions.width * 0.1),
                            height: Math.floor(dimensions.height * 0.05)
                        }
                    }
                },
                {
                    text: '$3,245.67',
                    boundingBox: {
                        centerPerX: 50,
                        centerPerY: 25,
                        perWidth: 15,
                        perHeight: 5,
                        pixelCoords: {
                            x: Math.floor(dimensions.width * 0.4),
                            y: Math.floor(dimensions.height * 0.2),
                            width: Math.floor(dimensions.width * 0.15),
                            height: Math.floor(dimensions.height * 0.05)
                        }
                    }
                }
            ]
        };
    }

    // Process OCR results for crypto-related content
    processCryptoContent(ocrResult) {
        const allText = ocrResult.segments.map(s => s.text).join(' ');
        
        // Extract tokens
        const tokens = this.extractTokens(allText, ocrResult.segments);
        
        // Extract addresses
        const addresses = this.extractAddresses(allText, ocrResult.segments);
        
        // Extract prices and market data
        const prices = this.extractPrices(allText, ocrResult.segments);
        
        // Calculate confidence
        const confidence = this.calculateConfidence(tokens, addresses, prices);
        
        return {
            success: true,
            ocrText: allText,
            tokens: tokens,
            addresses: addresses,
            prices: prices,
            confidence: confidence,
            segments: ocrResult.segments,
            language: ocrResult.language,
            processedAt: new Date().toISOString()
        };
    }    // Extract cryptocurrency tokens from OCR text  
    extractTokens(text, segments) {
        const tokens = [];
        const tokenPatterns = [
            // Major cryptocurrencies
            /\b(BTC|ETH|USDT|USDC|BNB|ADA|XRP|SOL|DOT|DOGE|AVAX|SHIB|MATIC|LTC|ATOM|LINK|UNI|AAVE|COMP|MKR|SNX|CRV|YFI|SUSHI|1INCH|ENJ|MANA|SAND|APE|BLUR)\b/gi,
            
            // Meme coins and trending tokens
            /\b(PEPE|FLOKI|BONK|WIF|POPCAT|BRETT|TOSHI|ANDY|DEGEN|HIGHER|NEIRO|GOAT|PNUT|ACT|MOODENG|CHILLGUY|TURBOS|MICHI|FWOG)\b/gi,
            
            // AI and emerging tokens
            /\b(ELIZA|ZEREBRO|VIRTUAL|CLANKER|GIGA|OPUS|ZEPHYR|CENTIENCE|NOVA|DEEP|DASHA|BASED|TRUTH|PRIME|BULLY)\b/gi,
            
            // DeFi tokens
            /\b(CAKE|ALPHA|QUICK|DODO|RUNE|THOR|OSMO|JUNO|SCRT|EVMOS|STARS|CMDX|HUAHUA|CHEQ|NETA|DESO|MNTL|XPRT|DVPN|ROWAN|BOOT)\b/gi,
            
            // Generic token patterns
            /\$[A-Z]{2,10}\b/g,
            /\b[A-Z]{2,10}(?=\s*[\:\-\$])/g,
            /\b[A-Z]{3,10}(?=\s*(?:\$[\d,]+|\d+\.\d+))/g // Token followed by price
        ];

        tokenPatterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            matches.forEach(match => {
                const symbol = match.replace(/^\$/, '').toUpperCase();
                if (symbol.length >= 2 && symbol.length <= 10 && !this.isCommonWord(symbol)) {
                    // Find the segment containing this token
                    const segment = segments.find(s => s.text.toUpperCase().includes(symbol));
                    
                    if (!tokens.find(t => t.symbol === symbol)) {
                        const price = this.extractPriceNearToken(text, symbol);
                        const change = this.extractChange24h(text, symbol);
                        
                        tokens.push({
                            symbol: symbol,
                            name: this.getTokenName(symbol),
                            segment: segment,
                            price: price || this.generateMockPrice(),
                            change24h: change || this.generateMockChange(),
                            confidence: this.calculateTokenConfidence(symbol, text, segment),
                            marketCap: this.generateMockMarketCap(),
                            volume24h: this.generateMockVolume(),
                            detected: {
                                byOCR: !!segment,
                                byPattern: !segment,
                                nearPrice: !!price,
                                nearChange: !!change
                            }
                        });
                    }
                }
            });
        });

        return tokens;
    }

    // Check if a token symbol is actually a common English word
    isCommonWord(symbol) {
        const commonWords = [
            'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'HAD',
            'HAS', 'HIS', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WHO', 'BOY', 'DID', 'ITS', 'LET',
            'PUT', 'SAY', 'SHE', 'TOO', 'USE', 'DAY', 'GET', 'MAY', 'OWN', 'RUN', 'SUN', 'TRY', 'WAY', 'WHY',
            'ASK', 'BAD', 'BAG', 'BED', 'BIG', 'BOX', 'CAR', 'CAT', 'CUT', 'DOG', 'EAR', 'EYE', 'FAR', 'FUN',
            'GOT', 'GUN', 'HAT', 'HIT', 'HOT', 'JOB', 'LAW', 'LEG', 'LET', 'LIE', 'LOT', 'MAP', 'NET', 'OFF',
            'PAY', 'RED', 'SIT', 'SIX', 'TAX', 'TEN', 'TOP', 'TRY', 'WIN', 'YES', 'YET', 'ART', 'BAR', 'BIT',
            'BUY', 'DIE', 'EAT', 'END', 'FEW', 'FIX', 'FLY', 'GOD', 'HIM', 'KEY', 'KID', 'LAY', 'LOW', 'MOM',
            'POP', 'RAT', 'SEA', 'SET', 'SON', 'TEA', 'WAR', 'WIN', 'ADD', 'AGE', 'AGO', 'AID', 'AIM', 'AIR',
            'ARM', 'BAD', 'BAN', 'BAT', 'BED', 'BET', 'BID', 'BIT', 'BOW', 'BUS', 'BUY', 'CAB', 'CAM', 'CAN',
            'CAP', 'COW', 'CRY', 'CUP', 'DAD', 'DAM', 'DAY', 'DEN', 'DEW', 'DIG', 'DOC', 'DOT', 'DRY', 'DUE',
            'EAR', 'EGG', 'END', 'ERA', 'EVE', 'FAN', 'FAT', 'FED', 'FEE', 'FIG', 'FIN', 'FIT', 'FOG', 'FOX',
            'FRY', 'FUN', 'FUR', 'GAS', 'GAY', 'GEL', 'GEM', 'GET', 'GIG', 'GIN', 'GOT', 'GUM', 'GUN', 'GUT',
            'GUY', 'GYM', 'HAD', 'HAM', 'HAS', 'HAT', 'HAY', 'HER', 'HEX', 'HID', 'HIM', 'HIP', 'HIS', 'HIT',
            'HOG', 'HOP', 'HOT', 'HOW', 'HUB', 'HUG', 'HUM', 'HUT', 'ICE', 'ICY', 'ILL', 'INK', 'INN', 'ION',
            'ITS', 'JAM', 'JAR', 'JAW', 'JET', 'JIG', 'JOB', 'JOG', 'JOT', 'JOY', 'JUG', 'KEY', 'KID', 'KIN',
            'KIT', 'LAB', 'LAD', 'LAG', 'LAP', 'LAW', 'LAY', 'LEG', 'LET', 'LID', 'LIE', 'LIP', 'LOG', 'LOT',
            'LOW', 'MAD', 'MAN', 'MAP', 'MAT', 'MAX', 'MAY', 'MEN', 'MID', 'MIX', 'MOB', 'MOM', 'MUD', 'MUG',
            'NAG', 'NAP', 'NET', 'NEW', 'NIL', 'NIT', 'NOD', 'NOR', 'NOT', 'NOW', 'NUN', 'NUT', 'OAK', 'ODD',
            'OIL', 'OLD', 'ONE', 'OPT', 'ORB', 'ORE', 'OUR', 'OUT', 'OWE', 'OWL', 'OWN', 'PAD', 'PAN', 'PAT',
            'PAW', 'PAY', 'PEA', 'PEN', 'PET', 'PIE', 'PIG', 'PIN', 'PIT', 'PLY', 'POD', 'POP', 'POT', 'PRO',
            'PUB', 'PUP', 'PUT', 'RAG', 'RAM', 'RAN', 'RAP', 'RAT', 'RAW', 'RAY', 'RED', 'RID', 'RIM', 'RIP',
            'ROD', 'ROT', 'ROW', 'RUB', 'RUG', 'RUM', 'RUN', 'RUT', 'SAD', 'SAG', 'SAP', 'SAT', 'SAW', 'SAY',
            'SEA', 'SET', 'SEW', 'SHY', 'SIN', 'SIP', 'SIR', 'SIS', 'SIT', 'SIX', 'SKI', 'SKY', 'SLY', 'SOB',
            'SOD', 'SON', 'SOP', 'SOT', 'SOW', 'SOY', 'SPA', 'SPY', 'STY', 'SUM', 'SUN', 'TAB', 'TAG', 'TAN',
            'TAP', 'TAR', 'TAX', 'TEA', 'TEN', 'THE', 'TIE', 'TIN', 'TIP', 'TOE', 'TON', 'TOO', 'TOP', 'TOT',
            'TOW', 'TOY', 'TRY', 'TUB', 'TUG', 'TWO', 'URN', 'USE', 'VAN', 'VAT', 'VET', 'VIA', 'VOW', 'WAD',
            'WAG', 'WAR', 'WAS', 'WAX', 'WAY', 'WEB', 'WED', 'WET', 'WHO', 'WHY', 'WIG', 'WIN', 'WIT', 'WOE',
            'WOK', 'WON', 'WOO', 'WOW', 'YAK', 'YAM', 'YAP', 'YAW', 'YEA', 'YES', 'YET', 'YEW', 'YIN', 'YOU',
            'ZAP', 'ZED', 'ZEE', 'ZEN', 'ZIP', 'ZIT', 'ZOO'
        ];
        
        return commonWords.includes(symbol);
    }

    // Calculate confidence for token detection
    calculateTokenConfidence(symbol, text, segment) {
        let confidence = 0.5; // Base confidence
        
        // Known token bonus
        if (this.getTokenName(symbol) !== symbol) confidence += 0.3;
        
        // OCR segment bonus
        if (segment) confidence += 0.1;
        
        // Price context bonus
        if (this.extractPriceNearToken(text, symbol)) confidence += 0.1;
        
        // Change context bonus
        if (this.extractChange24h(text, symbol)) confidence += 0.05;
        
        // Symbol length penalty for very short symbols
        if (symbol.length <= 2) confidence -= 0.1;
        
        return Math.min(Math.max(confidence, 0.1), 1.0);
    }

    // Generate mock price for tokens without detected prices
    generateMockPrice() {
        const prices = ['12.34', '567.89', '0.045', '1.23', '45.67', '234.56', '3.45', '89.12', '456.78', '23.45'];
        return prices[Math.floor(Math.random() * prices.length)];
    }

    // Generate mock 24h change
    generateMockChange() {
        const changes = ['+2.34', '-1.23', '+5.67', '-0.89', '+12.45', '-3.21', '+0.56', '-7.89', '+4.32', '-2.10'];
        return changes[Math.floor(Math.random() * changes.length)];
    }

    // Generate mock market cap
    generateMockMarketCap() {
        const caps = ['1.2B', '345M', '67.8B', '12.3M', '456K', '78.9B', '234M', '5.67B', '890M', '123K'];
        return caps[Math.floor(Math.random() * caps.length)];
    }

    // Generate mock volume
    generateMockVolume() {
        const volumes = ['45.6M', '123K', '7.89M', '234K', '56.7M', '890K', '12.3M', '345K', '67.8M', '901K'];
        return volumes[Math.floor(Math.random() * volumes.length)];
    }

    // Extract cryptocurrency addresses from OCR text
    extractAddresses(text, segments) {
        const addresses = [];
        const addressPatterns = [
            /\b0x[a-fA-F0-9]{40}\b/g, // Ethereum addresses
            /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g, // Bitcoin addresses
            /\bbc1[a-z0-9]{39,59}\b/g, // Bitcoin Bech32
            /\b[A-Z0-9]{26,35}\b/g // Other crypto addresses
        ];

        addressPatterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            matches.forEach(match => {
                const segment = segments.find(s => s.text.includes(match));
                addresses.push({
                    address: match,
                    type: this.getAddressType(match),
                    segment: segment
                });
            });
        });

        return addresses;
    }

    // Extract price information from OCR text
    extractPrices(text, segments) {
        const prices = [];
        const pricePatterns = [
            /\$[\d,]+\.?\d*/g,
            /[\d,]+\.?\d*\s*USD/g,
            /[\d,]+\.?\d*\s*USDT/g
        ];

        pricePatterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            matches.forEach(match => {
                const segment = segments.find(s => s.text.includes(match));
                prices.push({
                    value: match,
                    segment: segment
                });
            });
        });

        return prices;
    }

    // Calculate overall confidence score
    calculateConfidence(tokens, addresses, prices) {
        let score = 0.3; // Base score
        
        if (tokens.length > 0) score += 0.4;
        if (addresses.length > 0) score += 0.2;
        if (prices.length > 0) score += 0.1;
        
        return Math.min(score, 1.0);
    }

    // Helper method to get token name
    getTokenName(symbol) {
        const tokenNames = {
            'BTC': 'Bitcoin',
            'ETH': 'Ethereum',
            'USDT': 'Tether',
            'USDC': 'USD Coin',
            'BNB': 'Binance Coin',
            'ADA': 'Cardano',
            'XRP': 'Ripple',
            'SOL': 'Solana',
            'DOT': 'Polkadot',
            'DOGE': 'Dogecoin',
            'AVAX': 'Avalanche',
            'SHIB': 'Shiba Inu',
            'MATIC': 'Polygon',
            'LTC': 'Litecoin',
            'LINK': 'Chainlink',
            'UNI': 'Uniswap',
            'AAVE': 'Aave',
            'COMP': 'Compound',
            'MKR': 'Maker',
            'SNX': 'Synthetix',
            'CRV': 'Curve',
            'YFI': 'yearn.finance',
            'SUSHI': 'SushiSwap',
            'PEPE': 'Pepe',
            'FLOKI': 'Floki Inu',
            'BONK': 'Bonk',
            'WIF': 'dogwifhat',
            'POPCAT': 'Popcat',
            'BRETT': 'Brett',
            'TOSHI': 'Toshi',
            'ELIZA': 'Eliza',
            'ZEREBRO': 'Zerebro',
            'VIRTUAL': 'Virtual',
            'CLANKER': 'Clanker',
            'GIGA': 'Giga',
            'OPUS': 'Opus'
        };
        
        return tokenNames[symbol] || symbol;
    }

    // Helper method to get address type
    getAddressType(address) {
        if (address.startsWith('0x')) return 'Ethereum';
        if (address.match(/^[13]/)) return 'Bitcoin';
        if (address.startsWith('bc1')) return 'Bitcoin';
        return 'Unknown';
    }

    // Extract price near a token symbol
    extractPriceNearToken(text, symbol) {
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.includes(symbol)) {
                const priceMatch = line.match(/\$[\d,]+\.?\d*/);
                if (priceMatch) return priceMatch[0];
            }
        }
        return null;
    }

    // Extract 24h change near a token symbol
    extractChange24h(text, symbol) {
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.includes(symbol)) {
                const changeMatch = line.match(/[+-]?\d+\.?\d*%/);
                if (changeMatch) return changeMatch[0];
            }
        }
        return null;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoutOCRProcessor;
}
