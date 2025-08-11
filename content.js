// RateRadar Content Script
// Handles smart shopping features and price detection

class RateRadarContent {
    constructor() {
        this.isEnabled = false;
        this.detectedPrices = [];
        this.userCurrency = 'USD';
        this.init();
    }

    async init() {
        console.log('RateRadar Content Script: Initializing...');
        console.log('Current URL:', window.location.href);
        console.log('Document ready state:', document.readyState);
        
        // Add a test message to verify script is running
        this.addTestMessage();
        
        await this.loadSettings();
        this.setupEventListeners();
        
        // Always try to detect prices on any website if smart shopping is enabled
        if (this.isEnabled) {
            console.log('Smart shopping enabled by settings, detecting prices...');
            this.detectPrices();
        } else if (this.isEcommerceSite()) {
            console.log('E-commerce site detected, enabling smart shopping...');
            this.isEnabled = true;
            this.detectPrices();
        }
        
        // Add a visual indicator that the script is running
        this.addScriptIndicator();
        
        // Test price detection after a delay
        setTimeout(() => {
            console.log('RateRadar: Running delayed price detection test...');
            this.detectPrices();
        }, 3000);
    }

    addTestMessage() {
        // Add a test message to the page to verify the script is running
        const testDiv = document.createElement('div');
        testDiv.id = 'rateradar-test';
        testDiv.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            background: #10b981;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 999999;
            opacity: 0.8;
            pointer-events: none;
        `;
        testDiv.textContent = 'RateRadar Active';
        document.body.appendChild(testDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (testDiv.parentNode) {
                testDiv.parentNode.removeChild(testDiv);
            }
        }, 5000);
    }

    addScriptIndicator() {
        // Add a small indicator to show the script is running
        const indicator = document.createElement('div');
        indicator.id = 'rateradar-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 20px;
            height: 20px;
            background: #3B82F6;
            border-radius: 50%;
            z-index: 999999;
            opacity: 0.7;
            pointer-events: none;
            display: ${this.isEnabled ? 'block' : 'none'};
        `;
        document.body.appendChild(indicator);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 3000);
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['settings']);
            const settings = result.settings || {};
            this.isEnabled = settings.smartShopping || false;
            this.userCurrency = settings.baseCurrency || 'USD';
            console.log('RateRadar: Settings loaded - Smart shopping:', this.isEnabled, 'Currency:', this.userCurrency);
            
            // If smart shopping is enabled, detect prices immediately
            if (this.isEnabled) {
                setTimeout(() => this.detectPrices(), 2000); // Longer delay to ensure page is fully loaded
            }
        } catch (error) {
            console.error('RateRadar: Error loading settings:', error);
        }
    }

    setupEventListeners() {
        // Listen for messages from popup/background
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true;
        });

        // Watch for dynamic content changes
        const observer = new MutationObserver(() => {
            if (this.isEnabled) {
                setTimeout(() => this.detectPrices(), 500); // Debounce price detection
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Listen for settings changes
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync' && changes.settings) {
                this.loadSettings().then(() => {
                    if (this.isEnabled) {
                        this.detectPrices();
                    } else {
                        this.removeAllPriceOverlays();
                    }
                });
            }
        });

        // Also detect prices when page is fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                if (this.isEnabled) {
                    setTimeout(() => this.detectPrices(), 1000);
                }
            });
        } else {
            if (this.isEnabled) {
                setTimeout(() => this.detectPrices(), 1000);
            }
        }
    }

    handleMessage(request, sender, sendResponse) {
        console.log('RateRadar: Received message:', request.action);
        
        switch (request.action) {
            case 'enableSmartShopping':
                this.isEnabled = true;
                this.detectPrices();
                sendResponse({ success: true });
                break;
                
            case 'disableSmartShopping':
                this.isEnabled = false;
                this.removeAllPriceOverlays();
                sendResponse({ success: true });
                break;
                
            case 'getDetectedPrices':
                sendResponse({ success: true, prices: this.detectedPrices });
                break;
                
            case 'updateCurrency':
                this.userCurrency = request.currency;
                this.detectPrices();
                sendResponse({ success: true });
                break;
                
            case 'updateTheme':
                // Apply theme to content script if needed
                document.documentElement.setAttribute('data-theme', request.theme);
                sendResponse({ success: true });
                break;
                
            case 'settingChanged':
                this.handleSettingChange(request.setting, request.value);
                sendResponse({ success: true });
                break;
                
            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    }

    handleSettingChange(setting, value) {
        console.log('RateRadar: Setting changed:', setting, value);
        
        switch (setting) {
            case 'smartShopping':
                this.isEnabled = value;
                if (value) {
                    this.detectPrices();
                } else {
                    this.removeAllPriceOverlays();
                }
                break;
                
            case 'baseCurrency':
                this.userCurrency = value;
                if (this.isEnabled) {
                    this.detectPrices();
                }
                break;
                
            default:
                console.log('RateRadar: Unknown setting change:', setting, value);
        }
    }

    detectPrices() {
        if (!this.isEnabled) {
            console.log('RateRadar: Smart shopping disabled, skipping price detection');
            return;
        }

        console.log('RateRadar: Detecting prices on page...');
        
        // Use general price detection for all sites
        this.detectGeneralPrices();
    }

    detectAmazonPrices() {
        console.log('RateRadar: Using Amazon-specific price detection...');
        
        // Look for Amazon price containers
        const priceContainers = document.querySelectorAll('.a-price, [data-a-color="price"]');
        console.log('RateRadar: Found Amazon price containers:', priceContainers.length);
        
        priceContainers.forEach((container, index) => {
            try {
                // Get the whole price part
                const wholeElement = container.querySelector('.a-price-whole');
                const fractionElement = container.querySelector('.a-price-fraction');
                const symbolElement = container.querySelector('.a-price-symbol');
                
                let priceText = '';
                let currency = 'USD'; // Default for Amazon
                
                if (symbolElement) {
                    currency = this.normalizeCurrency(symbolElement.textContent.trim());
                }
                
                if (wholeElement) {
                    priceText += wholeElement.textContent.trim();
                }
                
                if (fractionElement) {
                    priceText += '.' + fractionElement.textContent.trim();
                }
                
                if (priceText) {
                    const amount = parseFloat(priceText.replace(/,/g, ''));
                    if (!isNaN(amount) && amount > 0) {
                        console.log(`RateRadar: Amazon price ${index + 1}:`, currency, amount);
                        
                        const priceData = {
                            currency: currency,
                            amount: amount,
                            originalText: priceText,
                            element: container,
                            timestamp: Date.now()
                        };
                        
                        this.detectedPrices.push(priceData);
                        this.highlightPrice(container, priceData);
                    }
                }
            } catch (error) {
                console.log('RateRadar: Error processing Amazon price container:', error);
            }
        });
        
        console.log(`RateRadar: Successfully processed ${this.detectedPrices.length} Amazon prices`);
    }

    detectGeneralPrices() {
        const priceElements = this.findPriceElements();
        this.detectedPrices = [];

        console.log('RateRadar: Found', priceElements.length, 'potential price elements');

        priceElements.forEach((element, index) => {
            const priceData = this.extractPriceData(element);
            if (priceData) {
                this.detectedPrices.push(priceData);
                this.highlightPrice(element, priceData);
                console.log(`RateRadar: Price ${index + 1}:`, priceData.currency, priceData.amount);
            }
        });

        console.log(`RateRadar: Successfully processed ${this.detectedPrices.length} prices`);
        
        // Send detected prices to background script
        if (this.detectedPrices.length > 0) {
            chrome.runtime.sendMessage({
                action: 'pricesDetected',
                prices: this.detectedPrices,
                url: window.location.href
            }).catch(error => {
                console.log('RateRadar: Could not send prices to background script:', error);
            });
        }
    }

    findPriceElements() {
        // Enhanced selectors for better price detection on all websites
        const selectors = [
            // Common price selectors
            '[data-price]',
            '[class*="price"]',
            '[class*="Price"]',
            '[id*="price"]',
            '[id*="Price"]',
            '.price',
            '.Price',
            '.amount',
            '.Amount',
            '.cost',
            '.Cost',
            '.value',
            '.Value',
            
            // Shopping site specific selectors
            '.product-price',
            '.item-price',
            '.sale-price',
            '.regular-price',
            '.discount-price',
            '.final-price',
            '.current-price',
            '.offer-price',
            '.deal-price',
            
            // E-commerce specific
            '[data-testid*="price"]',
            '[data-testid*="Price"]',
            '[data-cy*="price"]',
            '[data-cy*="Price"]',
            
            // Currency spans
            'span[class*="currency"]',
            'span[class*="Currency"]',
            'span[class*="price"]',
            'span[class*="Price"]',
            
            // Common shopping patterns
            '.price__current',
            '.price__value',
            '.price-current',
            '.price-value',
            '.product__price',
            '.product-price__value',
            
            // Amazon specific selectors
            '.a-price-whole',
            '.a-price-fraction', 
            '.a-price-symbol',
            '.a-price',
            '.a-offscreen',
            '[data-a-color="price"]',
            '.a-price-range',
            '.a-price-current',
            
            // eBay specific selectors
            '.x-price-primary',
            '.x-price-original',
            '.x-price-current',
            
            // General text elements that might contain prices
            'span',
            'div',
            'p',
            'strong',
            'b',
            'em'
        ];

        const elements = [];
        selectors.forEach(selector => {
            try {
                const found = document.querySelectorAll(selector);
                elements.push(...Array.from(found));
            } catch (error) {
                // Ignore invalid selectors
            }
        });

        // Remove duplicates and filter out elements that are too small or too large
        const uniqueElements = [...new Set(elements)].filter(element => {
            const text = element.textContent.trim();
            return text.length > 0 && text.length < 200 && text.length > 1; // Filter out very long and very short text
        });
        
        console.log('RateRadar: Found elements with selectors:', uniqueElements.length);
        return uniqueElements;
    }

    extractPriceData(element) {
        const text = element.textContent.trim();
        
        // Skip if text is too long or empty
        if (!text || text.length > 200) {
            return null;
        }
        
        console.log('RateRadar: Analyzing element text:', text);
        
        // Enhanced price regex patterns for all websites
        const pricePatterns = [
            /([$€£¥₦₿₹₽₩₪₨₴₸₺₼₾₿])\s*([\d,]+(?:\.\d{2})?)/g,  // Standard currency symbols
            /([\d,]+(?:\.\d{2})?)\s*([$€£¥₦₿₹₽₩₪₨₴₸₺₼₾₿])/g,  // Amount before currency
            /([$€£¥₦₿₹₽₩₪₨₴₸₺₼₾₿])([\d,]+(?:\.\d{2})?)/g,   // No space
            /([\d,]+(?:\.\d{2})?)([$€£¥₦₿₹₽₩₪₨₴₸₺₼₾₿])/g,      // No space, amount first
            /([$€£¥₦₿₹₽₩₪₨₴₸₺₼₾₿])\s*([\d,]+)/g,           // Currency symbol with whole numbers
            /([\d,]+)\s*([$€£¥₦₿₹₽₩₪₨₴₸₺₼₾₿])/g,              // Whole numbers with currency symbol
            /([$€£¥₦₿₹₽₩₪₨₴₸₺₼₾₿])([\d,]+)/g,               // Currency symbol with whole numbers, no space
            /([\d,]+)([$€£¥₦₿₹₽₩₪₨₴₸₺₼₾₿])/g                  // Whole numbers with currency symbol, no space
        ];

        for (const pattern of pricePatterns) {
            const matches = [...text.matchAll(pattern)];
            if (matches.length > 0) {
                const match = matches[0];
                let currency, amount;
                
                if (match[1].match(/[$€£¥₦₿₹₽₩₪₨₴₸₺₼₾₿]/)) {
                    currency = this.normalizeCurrency(match[1]);
                    amount = parseFloat(match[2].replace(/,/g, ''));
                } else {
                    currency = this.normalizeCurrency(match[2]);
                    amount = parseFloat(match[1].replace(/,/g, ''));
                }

                if (!isNaN(amount) && amount > 0 && amount < 1000000) { // Reasonable price range
                    console.log('RateRadar: Found price:', currency, amount, 'in text:', text);
                    return {
                        currency: currency,
                        amount: amount,
                        originalText: text,
                        element: element,
                        timestamp: Date.now()
                    };
                }
            }
        }

        // Try to find prices without currency symbols (common on many sites)
        const numberPatterns = [
            /(\d+(?:,\d{3})*(?:\.\d{2})?)/g,  // Standard decimal format
            /(\d+(?:,\d{3})*)/g,              // Whole numbers with commas
            /(\d+\.\d{2})/g,                  // Decimal format without commas
            /(\d+)/g                          // Any number
        ];
        
        for (const pattern of numberPatterns) {
            const numbers = [...text.matchAll(pattern)];
            if (numbers.length > 0) {
                const number = parseFloat(numbers[0][1].replace(/,/g, ''));
                if (!isNaN(number) && number > 0 && number < 1000000) {
                    // Try to determine currency from context
                    let currency = 'USD'; // Default
                    
                    // Check if there are any currency hints in the text
                    if (text.includes('€') || text.toLowerCase().includes('euro')) {
                        currency = 'EUR';
                    } else if (text.includes('£') || text.toLowerCase().includes('pound')) {
                        currency = 'GBP';
                    } else if (text.includes('¥') || text.toLowerCase().includes('yen')) {
                        currency = 'JPY';
                    } else if (text.includes('₦') || text.toLowerCase().includes('naira')) {
                        currency = 'NGN';
                    }
                    
                    console.log('RateRadar: Found number (assuming', currency, '):', number, 'in text:', text);
                    return {
                        currency: currency,
                        amount: number,
                        originalText: text,
                        element: element,
                        timestamp: Date.now()
                    };
                }
            }
        }

        return null;
    }

    normalizeCurrency(currencySymbol) {
        const currencyMap = {
            '$': 'USD',
            '€': 'EUR',
            '£': 'GBP',
            '¥': 'JPY',
            '₦': 'NGN',
            '₿': 'BTC',
            '₹': 'INR',
            '₽': 'RUB',
            '₩': 'KRW',
            '₪': 'ILS',
            '₨': 'PKR',
            '₴': 'UAH',
            '₸': 'KZT',
            '₺': 'TRY',
            '₼': 'AZN',
            '₾': 'GEL'
        };

        return currencyMap[currencySymbol] || currencySymbol;
    }

    async highlightPrice(element, priceData) {
        // Remove existing overlay if present
        this.removePriceOverlay(element);
        
        // Create price overlay
        const overlay = document.createElement('div');
        overlay.className = 'rateradar-price-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: -35px;
            right: -10px;
            background: linear-gradient(135deg, #3B82F6, #1D4ED8);
            color: white;
            padding: 8px 12px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 700;
            z-index: 100000;
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
            border: 2px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(10px);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;
        
        // Convert price to user's currency
        const convertedPrice = await this.convertPrice(priceData.currency, this.userCurrency, priceData.amount);
        
        if (convertedPrice && convertedPrice !== priceData.amount) {
            const currencySymbol = this.getCurrencySymbol(this.userCurrency);
            overlay.textContent = `${currencySymbol}${convertedPrice.toFixed(2)}`;
            overlay.title = `${priceData.currency} ${priceData.amount} → ${this.userCurrency} ${convertedPrice.toFixed(2)}`;
            
            // Add hover effect
            overlay.addEventListener('mouseenter', () => {
                overlay.style.transform = 'scale(1.15)';
                overlay.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.7)';
                overlay.style.background = 'linear-gradient(135deg, #2563EB, #1E40AF)';
            });
            
            overlay.addEventListener('mouseleave', () => {
                overlay.style.transform = 'scale(1)';
                overlay.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
                overlay.style.background = 'linear-gradient(135deg, #3B82F6, #1D4ED8)';
            });
            
            // Add click handler for detailed conversion
            overlay.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showDetailedConversion(priceData, convertedPrice);
            });
            
            // Find the best element to attach the overlay to
            let targetElement = element;
            
            // Try to find a parent container that's better positioned
            const parentSelectors = [
                '.a-price', '.a-price-range', '[data-a-color="price"]', // Amazon
                '.price', '.product-price', '.item-price', // General
                '.x-price-primary', '.x-price-current', // eBay
                'span', 'div', 'p' // Fallback
            ];
            
            for (const selector of parentSelectors) {
                const parent = element.closest(selector);
                if (parent && parent !== element) {
                    targetElement = parent;
                    break;
                }
            }
            
            // Ensure the target element has relative positioning
            if (targetElement.style.position !== 'absolute' && targetElement.style.position !== 'relative') {
                targetElement.style.position = 'relative';
            }
            
            // Check if the element is visible and has dimensions
            const rect = targetElement.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                targetElement.appendChild(overlay);
                
                // Store reference for cleanup
                element.rateradarOverlay = overlay;
                
                console.log(`RateRadar: Added overlay: ${priceData.currency} ${priceData.amount} → ${this.userCurrency} ${convertedPrice.toFixed(2)}`);
            } else {
                console.log('RateRadar: Element not visible, skipping overlay');
            }
        } else {
            console.log('RateRadar: No conversion needed or conversion failed for:', priceData.currency, priceData.amount);
        }
    }

    removePriceOverlay(element) {
        if (element.rateradarOverlay) {
            element.rateradarOverlay.remove();
            delete element.rateradarOverlay;
        }
    }

    removeAllPriceOverlays() {
        document.querySelectorAll('.rateradar-price-overlay').forEach(overlay => {
            overlay.remove();
        });
    }

    getCurrencySymbol(currency) {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'NGN': '₦',
            'BTC': '₿',
            'INR': '₹',
            'RUB': '₽',
            'KRW': '₩',
            'ILS': '₪',
            'PKR': '₨',
            'UAH': '₴',
            'KZT': '₸',
            'TRY': '₺',
            'AZN': '₼',
            'GEL': '₾'
        };
        return symbols[currency] || currency;
    }

    async convertPrice(fromCurrency, toCurrency, amount) {
        if (fromCurrency === toCurrency) return amount;
        
        try {
            const rate = await this.getExchangeRate(fromCurrency, toCurrency);
            return rate ? amount * rate : null;
        } catch (error) {
            console.error('Error converting price:', error);
            return null;
        }
    }

    async getExchangeRate(fromCurrency, toCurrency) {
        const exchangeAPIs = [
            'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies',
            'https://latest.currency-api.pages.dev/v1/currencies',
            'https://api.exchangerate-api.com/v4/latest'
        ];

        const from = fromCurrency.toLowerCase();
        const to = toCurrency.toLowerCase();

        // Try each API endpoint
        for (let i = 0; i < exchangeAPIs.length; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                let response, data;
                
                if (exchangeAPIs[i].includes('fawazahmed0') || exchangeAPIs[i].includes('currency-api')) {
                    const url = `${exchangeAPIs[i]}/${from}.json`;
                    response = await fetch(url, { 
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'RateRadar/1.0'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    
                    data = await response.json();
                    if (data[from] && data[from][to]) {
                        return data[from][to];
                    }
                } else if (exchangeAPIs[i].includes('exchangerate-api')) {
                    const url = `${exchangeAPIs[i]}/${from.toUpperCase()}`;
                    response = await fetch(url, { 
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'RateRadar/1.0'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    
                    data = await response.json();
                    if (data.rates && data.rates[to.toUpperCase()]) {
                        return data.rates[to.toUpperCase()];
                    }
                }
                
                throw new Error('Rate not found in response');
                
            } catch (error) {
                console.warn(`Content: API ${i + 1} failed:`, error.message);
                continue;
            }
        }

        console.error('Content: All exchange rate APIs failed');
        return null;
    }

    showDetailedConversion(priceData, convertedPrice) {
        // Create detailed conversion modal
        const modal = document.createElement('div');
        modal.className = 'rateradar-conversion-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 12px; max-width: 400px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                <h3 style="margin: 0 0 15px 0; color: #333; text-align: center;">Price Conversion</h3>
                <div style="margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #666;">Original:</span>
                        <span style="font-weight: 600; color: #333;">${this.getCurrencySymbol(priceData.currency)}${priceData.amount.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #666;">Converted:</span>
                        <span style="font-weight: 600; color: #3B82F6;">${this.getCurrencySymbol(this.userCurrency)}${convertedPrice.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #666;">Rate:</span>
                        <span style="font-weight: 600; color: #333;">1 ${priceData.currency} = ${(convertedPrice / priceData.amount).toFixed(4)} ${this.userCurrency}</span>
                    </div>
                </div>
                <div style="text-align: center;">
                    <button id="closeModal" style="padding: 8px 16px; background: #3B82F6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal
        modal.querySelector('#closeModal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // Utility methods for future features
    isEcommerceSite() {
        const ecommerceKeywords = [
            'amazon', 'ebay', 'etsy', 'shopify', 'woocommerce',
            'walmart', 'target', 'bestbuy', 'newegg', 'aliexpress',
            'shop', 'store', 'buy', 'cart', 'checkout', 'product',
            'price', 'sale', 'deal', 'offer', 'discount'
        ];

        const url = window.location.hostname.toLowerCase();
        const pageText = document.body.textContent.toLowerCase();
        
        // Check URL first
        const urlMatch = ecommerceKeywords.some(keyword => url.includes(keyword));
        if (urlMatch) {
            console.log('RateRadar: E-commerce site detected by URL:', url);
            return true;
        }
        
        // Check page content
        const contentMatch = ecommerceKeywords.some(keyword => pageText.includes(keyword));
        if (contentMatch) {
            console.log('RateRadar: E-commerce site detected by content');
            return true;
        }
        
        // Check for common e-commerce elements
        const ecommerceSelectors = [
            '[data-price]',
            '.price',
            '.product-price',
            '.add-to-cart',
            '.buy-now',
            '.shopping-cart',
            '.checkout',
            '.product',
            '.item'
        ];
        
        const hasEcommerceElements = ecommerceSelectors.some(selector => {
            try {
                return document.querySelector(selector) !== null;
            } catch (e) {
                return false;
            }
        });
        
        if (hasEcommerceElements) {
            console.log('RateRadar: E-commerce site detected by elements');
            return true;
        }
        
        console.log('RateRadar: Not an e-commerce site');
        return false;
    }
}

// Initialize RateRadar content script
const rateRadarContent = new RateRadarContent(); 