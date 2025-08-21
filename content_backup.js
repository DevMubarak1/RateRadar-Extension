// RateRadar Content Script
// Handles smart shopping features and price detection

// Check if we're in a valid extension context before creating the class
if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
    console.log('RateRadar: Not in extension context, skipping content script');
} else {
    class RateRadarContent {
        constructor() {
            this.isEnabled = false;
            this.detectedPrices = [];
            this.userCurrency = 'USD';
            
            // Double-check if we're in a valid extension context
            if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
                console.log('RateRadar: Not in extension context, skipping initialization');
                return;
            }
            
            try {
                this.init();
            } catch (error) {
                console.log('RateRadar: Error during initialization:', error);
            }
        }

        async init() {
            try {
                console.log('RateRadar Content Script: Initializing...');
                console.log('Current URL:', window.location.href);
                console.log('Document ready state:', document.readyState);
                
                // Check if chrome APIs are still available
                if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id || !chrome.storage) {
                    console.log('RateRadar: Chrome APIs not available during init');
                    return;
                }
                
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
                    try {
                        console.log('RateRadar: Running delayed price detection test...');
                        this.detectPrices();
                    } catch (error) {
                        console.log('RateRadar: Error in delayed price detection:', error);
                    }
                }, 3000);
            } catch (error) {
                console.log('RateRadar: Error during initialization:', error);
            }
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
                // Check if chrome.runtime is available
                if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id || !chrome.storage) {
                    console.log('RateRadar: Chrome APIs not available');
                    return;
                }
                
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
            try {
                // Check if chrome APIs are available before setting up listeners
                if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id || !chrome.storage) {
                    console.log('RateRadar: Chrome APIs not available, skipping event listeners');
                    return;
                }

                // Listen for messages from popup/background with error handling
                chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                    try {
                        this.handleMessage(request, sender, sendResponse);
                        return true;
                    } catch (error) {
                        console.log('RateRadar: Error handling message:', error);
                        return false;
                    }
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

                // Listen for settings changes with error handling
                try {
                    chrome.storage.onChanged.addListener((changes, namespace) => {
                        try {
                            if (namespace === 'sync' && changes.settings) {
                                this.loadSettings().then(() => {
                                    if (this.isEnabled) {
                                        this.detectPrices();
                                    } else {
                                        this.removeAllPriceOverlays();
                                    }
                                }).catch(error => {
                                    console.log('RateRadar: Error handling settings change:', error);
                                });
                            }
                        } catch (error) {
                            console.log('RateRadar: Error in storage change listener:', error);
                        }
                    });
                } catch (error) {
                    console.log('RateRadar: Could not set up storage listener:', error);
                }

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
            } catch (error) {
                console.log('RateRadar: Error setting up event listeners:', error);
            }
        }

        handleMessage(request, sender, sendResponse) {
            try {
                console.log('RateRadar: Received message:', request.action);
                
                // Check if chrome APIs are still available
                if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
                    console.log('RateRadar: Chrome APIs not available for message handling');
                    if (sendResponse) {
                        sendResponse({ success: false, error: 'Extension context invalid' });
                    }
                    return;
                }
                
                switch (request.action) {
                    case 'enableSmartShopping':
                        this.isEnabled = true;
                        this.detectPrices();
                        if (sendResponse) {
                            sendResponse({ success: true });
                        }
                        break;
                        
                    case 'disableSmartShopping':
                        this.isEnabled = false;
                        this.removeAllPriceOverlays();
                        if (sendResponse) {
                            sendResponse({ success: true });
                        }
                        break;
                        
                    case 'getDetectedPrices':
                        if (sendResponse) {
                            sendResponse({ success: true, prices: this.detectedPrices });
                        }
                        break;
                        
                    case 'updateCurrency':
                        this.userCurrency = request.currency;
                        this.detectPrices();
                        if (sendResponse) {
                            sendResponse({ success: true });
                        }
                        break;
                        
                    case 'updateTheme':
                        // Apply theme to content script if needed
                        document.documentElement.setAttribute('data-theme', request.theme);
                        if (sendResponse) {
                            sendResponse({ success: true });
                        }
                        break;
                        
                    case 'settingChanged':
                        this.handleSettingChange(request.setting, request.value);
                        if (sendResponse) {
                            sendResponse({ success: true });
                        }
                        break;
                        
                    default:
                        if (sendResponse) {
                            sendResponse({ success: false, error: 'Unknown action' });
                        }
                }
            } catch (error) {
                console.log('RateRadar: Error handling message:', error);
                if (sendResponse) {
                    sendResponse({ success: false, error: error.message });
                }
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
            try {
                if (!this.isEnabled) {
                    console.log('RateRadar: Smart shopping disabled, skipping price detection');
                    return;
                }

                console.log('RateRadar: Detecting prices on page...');
                
                // Check if chrome APIs are still available
                if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
                    console.log('RateRadar: Chrome APIs not available for price detection');
                    return;
                }
                
                // Use general price detection for all sites
                this.detectGeneralPrices();
            } catch (error) {
                console.log('RateRadar: Error in detectPrices:', error);
            }
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
            try {
                const priceElements = this.findPriceElements();
                this.detectedPrices = [];

                console.log('RateRadar: Found', priceElements.length, 'potential price elements');

                priceElements.forEach((element, index) => {
                    try {
                        const priceData = this.extractPriceData(element);
                        if (priceData) {
                            this.detectedPrices.push(priceData);
                            this.highlightPrice(element, priceData);
                            console.log(`RateRadar: Price ${index + 1}:`, priceData.currency, priceData.amount);
                        }
                    } catch (error) {
                        console.log(`RateRadar: Error processing price element ${index}:`, error);
                    }
                });

                console.log(`RateRadar: Successfully processed ${this.detectedPrices.length} prices`);
                
                // Send detected prices to background script with error handling
                if (this.detectedPrices.length > 0) {
                    // Make this completely optional - don't fail if extension context is invalid
                    setTimeout(() => {
                        try {
                            // Check if chrome APIs are available
                            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.runtime.sendMessage) {
                                chrome.runtime.sendMessage({
                                    action: 'pricesDetected',
                                    prices: this.detectedPrices,
                                    url: window.location.href
                                }).catch(error => {
                                    console.log('RateRadar: Could not send prices to background script:', error);
                                });
                            } else {
                                console.log('RateRadar: Chrome APIs not available for sending prices');
                            }
                        } catch (error) {
                            console.log('RateRadar: Error sending prices to background script:', error);
                        }
                    }, 100); // Small delay to ensure it doesn't block the main flow
                }
            } catch (error) {
                console.log('RateRadar: Error in detectGeneralPrices:', error);
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
            
            // Skip if this doesn't look like a product price
            if (!this.isLikelyProductPrice(element, text)) {
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

            // Only try to find numbers without currency symbols if we're confident it's a product price
            if (this.isDefinitelyProductPrice(element, text)) {
                const numberPatterns = [
                    /(\d+(?:,\d{3})*(?:\.\d{2})?)/g,  // Standard decimal format
                    /(\d+(?:,\d{3})*)/g,              // Whole numbers with commas
                    /(\d+\.\d{2})/g,                  // Decimal format without commas
                ];
                
                for (const pattern of numberPatterns) {
                    const numbers = [...text.matchAll(pattern)];
                    if (numbers.length > 0) {
                        const number = parseFloat(numbers[0][1].replace(/,/g, ''));
                        if (!isNaN(number) && number > 0 && number < 1000000) {
                            // Try to determine currency from context
                            let currency = this.detectCurrencyFromContext(element, text);
                            
                            console.log('RateRadar: Found product price (assuming', currency, '):', number, 'in text:', text);
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
            }

            return null;
        }

        isLikelyProductPrice(element, text) {
            // Check if this element is likely to contain a product price
            const priceKeywords = [
                'price', 'cost', 'amount', 'total', 'sum', 'value', 'fee', 'charge',
                'buy', 'purchase', 'order', 'checkout', 'cart', 'shopping', 'product',
                'item', 'goods', 'merchandise', 'sale', 'deal', 'offer', 'discount'
            ];
            
            // Check element's class, id, and data attributes
            const elementClasses = element.className.toLowerCase();
            const elementId = element.id.toLowerCase();
            const elementAttributes = element.getAttributeNames().join(' ').toLowerCase();
            
            // Check if any price-related keywords are in the element's attributes
            const hasPriceKeywords = priceKeywords.some(keyword => 
                elementClasses.includes(keyword) || 
                elementId.includes(keyword) || 
                elementAttributes.includes(keyword)
            );
            
            // Check if element is inside a product container
            const isInProductContainer = element.closest('[class*="product"], [class*="item"], [class*="card"], [class*="listing"]');
            
            // Check if text contains currency symbols
            const hasCurrencySymbol = /[$€£¥₦₿₹₽₩₪₨₴₸₺₼₾₿]/.test(text);
            
            // Check if text looks like a price (number with optional decimal)
            const looksLikePrice = /^\s*[\d,]+(?:\.\d{2})?\s*$/.test(text.trim());
            
            return hasPriceKeywords || isInProductContainer || (hasCurrencySymbol && looksLikePrice);
        }

        isDefinitelyProductPrice(element, text) {
            // More strict check for product prices
            const productSelectors = [
                '.price', '.product-price', '.item-price', '.cost', '.amount',
                '.a-price', '.a-price-whole', '.a-price-fraction',
                '.x-price-primary', '.x-price-current',
                '[data-price]', '[data-testid*="price"]', '[data-cy*="price"]'
            ];
            
            // Check if element matches product price selectors
            const matchesProductSelector = productSelectors.some(selector => {
                try {
                    return element.matches(selector) || element.closest(selector);
                } catch (e) {
                    return false;
                }
            });
            
            // Check if element is inside a clear product context
            const productContext = element.closest('[class*="product"], [class*="item"], [class*="card"], [class*="listing"], [class*="shop"]');
            
            return matchesProductSelector || (productContext && /^\s*[\d,]+(?:\.\d{2})?\s*$/.test(text.trim()));
        }

        detectCurrencyFromContext(element, text) {
            // Enhanced currency detection from context
            const context = {
                element: element,
                text: text,
                pageText: document.body.textContent.toLowerCase(),
                url: window.location.href.toLowerCase()
            };
            
            // Check for currency symbols in the text
            if (text.includes('€') || context.pageText.includes('euro') || context.pageText.includes('eur')) {
                return 'EUR';
            }
            if (text.includes('£') || context.pageText.includes('pound') || context.pageText.includes('gbp')) {
                return 'GBP';
            }
            if (text.includes('¥') || context.pageText.includes('yen') || context.pageText.includes('jpy')) {
                return 'JPY';
            }
            if (text.includes('₦') || context.pageText.includes('naira') || context.pageText.includes('ngn')) {
                return 'NGN';
            }
            if (text.includes('₹') || context.pageText.includes('rupee') || context.pageText.includes('inr')) {
                return 'INR';
            }
            if (text.includes('₽') || context.pageText.includes('ruble') || context.pageText.includes('rub')) {
                return 'RUB';
            }
            if (text.includes('₩') || context.pageText.includes('won') || context.pageText.includes('krw')) {
                return 'KRW';
            }
            if (text.includes('₪') || context.pageText.includes('shekel') || context.pageText.includes('ils')) {
                return 'ILS';
            }
            if (text.includes('₨') || context.pageText.includes('rupee') || context.pageText.includes('pkr')) {
                return 'PKR';
            }
            if (text.includes('₴') || context.pageText.includes('hryvnia') || context.pageText.includes('uah')) {
                return 'UAH';
            }
            if (text.includes('₸') || context.pageText.includes('tenge') || context.pageText.includes('kzt')) {
                return 'KZT';
            }
            if (text.includes('₺') || context.pageText.includes('lira') || context.pageText.includes('try')) {
                return 'TRY';
            }
            if (text.includes('₼') || context.pageText.includes('manat') || context.pageText.includes('azn')) {
                return 'AZN';
            }
            if (text.includes('₾') || context.pageText.includes('lari') || context.pageText.includes('gel')) {
                return 'GEL';
            }
            
            // Check URL for country/currency hints
            if (context.url.includes('.uk') || context.url.includes('uk/')) {
                return 'GBP';
            }
            if (context.url.includes('.eu') || context.url.includes('europe/')) {
                return 'EUR';
            }
            if (context.url.includes('.jp') || context.url.includes('japan/')) {
                return 'JPY';
            }
            if (context.url.includes('.ng') || context.url.includes('nigeria/')) {
                return 'NGN';
            }
            if (context.url.includes('.in') || context.url.includes('india/')) {
                return 'INR';
            }
            if (context.url.includes('.ru') || context.url.includes('russia/')) {
                return 'RUB';
            }
            if (context.url.includes('.kr') || context.url.includes('korea/')) {
                return 'KRW';
            }
            if (context.url.includes('.il') || context.url.includes('israel/')) {
                return 'ILS';
            }
            if (context.url.includes('.pk') || context.url.includes('pakistan/')) {
                return 'PKR';
            }
            if (context.url.includes('.ua') || context.url.includes('ukraine/')) {
                return 'UAH';
            }
            if (context.url.includes('.kz') || context.url.includes('kazakhstan/')) {
                return 'KZT';
            }
            if (context.url.includes('.tr') || context.url.includes('turkey/')) {
                return 'TRY';
            }
            if (context.url.includes('.az') || context.url.includes('azerbaijan/')) {
                return 'AZN';
            }
            if (context.url.includes('.ge') || context.url.includes('georgia/')) {
                return 'GEL';
            }
            
            // Default to USD if no clear indication
            return 'USD';
        }

        normalizeCurrency(currencySymbol) {
            const currencyMap = {
                // Major currencies
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
                '₾': 'GEL',
                
                // Additional currencies
                '₡': 'CRC', // Costa Rican Colón
                '₢': 'BRC', // Brazilian Cruzeiro (old)
                '₣': 'CHF', // Swiss Franc
                '₤': 'ITL', // Italian Lira (old)
                '₥': 'MXN', // Mexican Peso (centavo)
                '₦': 'NGN', // Nigerian Naira
                '₧': 'ESP', // Spanish Peseta (old)
                '₨': 'PKR', // Pakistani Rupee
                '₩': 'KRW', // South Korean Won
                '₪': 'ILS', // Israeli Shekel
                '₫': 'VND', // Vietnamese Dong
                '₭': 'LAK', // Lao Kip
                '₮': 'MNT', // Mongolian Tugrik
                '₯': 'GRD', // Greek Drachma (old)
                '₰': 'DKK', // Danish Krone (ore)
                '₱': 'PHP', // Philippine Peso
                '₲': 'PYG', // Paraguayan Guaraní
                '₳': 'ARA', // Argentine Austral (old)
                '₴': 'UAH', // Ukrainian Hryvnia
                '₵': 'GHS', // Ghanaian Cedi
                '₶': 'BRL', // Brazilian Real
                '₷': 'CZK', // Czech Koruna
                '₸': 'KZT', // Kazakhstani Tenge
                '₹': 'INR', // Indian Rupee
                '₺': 'TRY', // Turkish Lira
                '₻': 'SEK', // Swedish Krona
                '₼': 'AZN', // Azerbaijani Manat
                '₽': 'RUB', // Russian Ruble
                '₾': 'GEL', // Georgian Lari
                '₿': 'BTC', // Bitcoin
                
                // Currency codes
                'USD': 'USD',
                'EUR': 'EUR',
                'GBP': 'GBP',
                'JPY': 'JPY',
                'NGN': 'NGN',
                'BTC': 'BTC',
                'INR': 'INR',
                'RUB': 'RUB',
                'KRW': 'KRW',
                'ILS': 'ILS',
                'PKR': 'PKR',
                'UAH': 'UAH',
                'KZT': 'KZT',
                'TRY': 'TRY',
                'AZN': 'AZN',
                'GEL': 'GEL',
                'CRC': 'CRC',
                'CHF': 'CHF',
                'MXN': 'MXN',
                'VND': 'VND',
                'LAK': 'LAK',
                'MNT': 'MNT',
                'DKK': 'DKK',
                'PHP': 'PHP',
                'PYG': 'PYG',
                'GHS': 'GHS',
                'BRL': 'BRL',
                'CZK': 'CZK',
                'SEK': 'SEK'
            };

            return currencyMap[currencySymbol] || currencySymbol;
        }

        async highlightPrice(element, priceData) {
            // Remove existing overlay if present
            this.removePriceOverlay(element);
            
            // Create simplified price overlay
            const overlay = document.createElement('div');
            overlay.className = 'rateradar-price-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: -25px;
                right: -5px;
                background: rgba(59, 130, 246, 0.9);
                color: white;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                z-index: 100000;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
                border: 1px solid rgba(255, 255, 255, 0.2);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            `;
            
            // Convert price to user's currency
            const convertedPrice = await this.convertPrice(priceData.currency, this.userCurrency, priceData.amount);
            
            if (convertedPrice && convertedPrice !== priceData.amount) {
                const currencySymbol = this.getCurrencySymbol(this.userCurrency);
                overlay.textContent = `${currencySymbol}${convertedPrice.toFixed(2)}`;
                overlay.title = `${priceData.currency} ${priceData.amount} → ${this.userCurrency} ${convertedPrice.toFixed(2)}`;
                
                // Simple hover effect
                overlay.addEventListener('mouseenter', () => {
                    overlay.style.background = 'rgba(59, 130, 246, 1)';
                    overlay.style.transform = 'scale(1.05)';
                });
                
                overlay.addEventListener('mouseleave', () => {
                    overlay.style.background = 'rgba(59, 130, 246, 0.9)';
                    overlay.style.transform = 'scale(1)';
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
                // Major currencies
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
                'GEL': '₾',
                
                // Additional currencies
                'CRC': '₡',
                'CHF': '₣',
                'MXN': '$',
                'VND': '₫',
                'LAK': '₭',
                'MNT': '₮',
                'DKK': 'kr',
                'PHP': '₱',
                'PYG': '₲',
                'GHS': '₵',
                'BRL': 'R$',
                'CZK': 'Kč',
                'SEK': 'kr',
                
                // Fallback for unknown currencies
                'CAD': 'C$',
                'AUD': 'A$',
                'NZD': 'NZ$',
                'SGD': 'S$',
                'HKD': 'HK$',
                'CNY': '¥',
                'THB': '฿',
                'MYR': 'RM',
                'IDR': 'Rp',
                'ZAR': 'R',
                'EGP': 'E£',
                'SAR': '﷼',
                'AED': 'د.إ',
                'QAR': 'ر.ق',
                'KWD': 'د.ك',
                'BHD': '.د.ب',
                'OMR': 'ر.ع.',
                'JOD': 'د.أ',
                'LBP': 'ل.ل',
                'SYP': 'ل.س',
                'IQD': 'ع.د',
                'IRR': '﷼',
                'AFN': '؋',
                'BDT': '৳',
                'LKR': 'රු',
                'NPR': 'रू',
                'MMK': 'K',
                'KHR': '៛',
                'MOP': 'MOP$',
                'TWD': 'NT$',
                'HUF': 'Ft',
                'PLN': 'zł',
                'RON': 'lei',
                'BGN': 'лв',
                'HRK': 'kn',
                'RSD': 'дин.',
                'ALL': 'L',
                'MKD': 'ден',
                'MDL': 'L',
                'UZS': 'so\'m',
                'TJS': 'SM',
                'TMT': 'T',
                'AMD': '֏',
                'BYN': 'Br',
                'KGS': 'с',
                'CDF': 'FC',
                'KES': 'KSh',
                'TZS': 'TSh',
                'UGX': 'USh',
                'ETB': 'Br',
                'SOS': 'S',
                'DJF': 'Fdj',
                'KMF': 'CF',
                'MUR': '₨',
                'SCR': '₨',
                'SZL': 'L',
                'NAD': 'N$',
                'BWP': 'P',
                'ZMW': 'ZK',
                'MWK': 'MK',
                'MZN': 'MT',
                'ZWL': '$',
                'AOA': 'Kz',
                'STD': 'Db',
                'CVE': '$',
                'GNF': 'FG',
                'LRD': 'L$',
                'SLL': 'Le',
                'SLE': 'Le'
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
} 