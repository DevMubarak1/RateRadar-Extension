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
        await this.loadSettings();
        this.setupEventListeners();
        if (this.isEnabled) {
            this.detectPrices();
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['settings']);
            const settings = result.settings || {};
            this.isEnabled = settings.smartShopping || false;
            this.userCurrency = settings.baseCurrency || 'USD';
            console.log('Smart shopping enabled:', this.isEnabled, 'Currency:', this.userCurrency);
            
            // If smart shopping is enabled, detect prices immediately
            if (this.isEnabled) {
                setTimeout(() => this.detectPrices(), 1000); // Small delay to ensure page is loaded
            }
        } catch (error) {
            console.error('Error loading settings:', error);
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
                this.detectPrices();
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
    }

    handleMessage(request, sender, sendResponse) {
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
                
            case 'theme':
                // Theme changes are handled by the popup
                break;
                
            case 'notifications':
                // Notifications are handled by the background script
                break;
                
            case 'soundAlerts':
                // Sound alerts are handled by the background script
                break;
                
            case 'autoRefresh':
                // Auto refresh is handled by the popup
                break;
                
            case 'refreshInterval':
                // Refresh interval is handled by the popup
                break;
                
            case 'decimalPlaces':
                // Decimal places are handled by the popup
                break;
                
            case 'cacheDuration':
                // Cache duration is handled by the popup
                break;
                
            case 'showTrends':
                // Show trends is handled by the popup
                break;
                
            default:
                console.log('Unknown setting change:', setting, value);
        }
    }

    detectPrices() {
        if (!this.isEnabled) return;

        console.log('Detecting prices on page...');
        const priceElements = this.findPriceElements();
        this.detectedPrices = [];

        priceElements.forEach(element => {
            const priceData = this.extractPriceData(element);
            if (priceData) {
                this.detectedPrices.push(priceData);
                this.highlightPrice(element, priceData);
            }
        });

        console.log(`Found ${this.detectedPrices.length} prices on page`);

        // Send detected prices to background script
        if (this.detectedPrices.length > 0) {
            chrome.runtime.sendMessage({
                action: 'pricesDetected',
                prices: this.detectedPrices,
                url: window.location.href
            });
        }
    }

    findPriceElements() {
        // Enhanced selectors for better price detection
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
            '.product-price__value'
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

        // Remove duplicates
        const uniqueElements = [...new Set(elements)];
        return uniqueElements;
    }

    extractPriceData(element) {
        const text = element.textContent.trim();
        
        // Enhanced price regex patterns
        const pricePatterns = [
            /([$€£¥₦₿₹₽₩₪₨₴₸₺₼₾₿])\s*([\d,]+(?:\.\d{2})?)/g,  // Standard currency symbols
            /([\d,]+(?:\.\d{2})?)\s*([$€£¥₦₿₹₽₩₪₨₴₸₺₼₾₿])/g,  // Amount before currency
            /([$€£¥₦₿₹₽₩₪₨₴₸₺₼₾₿])([\d,]+(?:\.\d{2})?)/g,   // No space
            /([\d,]+(?:\.\d{2})?)([$€£¥₦₿₹₽₩₪₨₴₸₺₼₾₿])/g      // No space, amount first
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
            top: -30px;
            right: -5px;
            background: linear-gradient(135deg, #3B82F6, #1D4ED8);
            color: white;
            padding: 6px 10px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
            border: 2px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
        `;
        
        // Convert price to user's currency
        const convertedPrice = await this.convertPrice(priceData.currency, this.userCurrency, priceData.amount);
        
        if (convertedPrice && convertedPrice !== priceData.amount) {
            const currencySymbol = this.getCurrencySymbol(this.userCurrency);
            overlay.textContent = `${currencySymbol}${convertedPrice.toFixed(2)}`;
            overlay.title = `${priceData.currency} ${priceData.amount} → ${this.userCurrency} ${convertedPrice.toFixed(2)}`;
            
            // Add hover effect
            overlay.addEventListener('mouseenter', () => {
                overlay.style.transform = 'scale(1.1)';
                overlay.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
                overlay.style.background = 'linear-gradient(135deg, #2563EB, #1E40AF)';
            });
            
            overlay.addEventListener('mouseleave', () => {
                overlay.style.transform = 'scale(1)';
                overlay.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                overlay.style.background = 'linear-gradient(135deg, #3B82F6, #1D4ED8)';
            });
            
            // Add click handler for detailed conversion
            overlay.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showDetailedConversion(priceData, convertedPrice);
            });
            
            // Position the overlay
            if (element.style.position !== 'absolute' && element.style.position !== 'relative') {
                element.style.position = 'relative';
            }
            element.appendChild(overlay);
            
            // Store reference for cleanup
            element.rateradarOverlay = overlay;
            
            console.log(`Added overlay: ${priceData.currency} ${priceData.amount} → ${this.userCurrency} ${convertedPrice.toFixed(2)}`);
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
            'shop', 'store', 'buy', 'cart', 'checkout', 'product'
        ];

        const url = window.location.hostname.toLowerCase();
        const pageText = document.body.textContent.toLowerCase();
        
        return ecommerceKeywords.some(keyword => 
            url.includes(keyword) || pageText.includes(keyword)
        );
    }
}

// Initialize RateRadar content script
const rateRadarContent = new RateRadarContent(); 