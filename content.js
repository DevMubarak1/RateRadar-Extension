// RateRadar Content Script - Smart Shopping with Highlight-based Conversion
    class RateRadarContent {
        constructor() {
        this.isEnabled = true;
            this.userCurrency = 'USD';
        this.baseCurrency = 'USD';
        this.excludedSites = [
            'github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com',
            'developer.mozilla.org', 'docs.github.com', 'git-scm.com',
            'code.visualstudio.com', 'atom.io', 'sublimetext.com'
        ];
        this.priceOverlay = null;
        this.init();
    }

    async init() {
        try {
            console.log('RateRadar: Initializing content script...');
            
            // Check if we're on an excluded site
            if (this.isExcludedSite()) {
                console.log('RateRadar: Excluded site detected, skipping initialization');
                return;
            }
            
            // Load settings
                await this.loadSettings();
            
            // Setup highlight listener
            this.setupHighlightListener();
            console.log('RateRadar: Smart shopping enabled for highlight-based conversion');
            
            } catch (error) {
                console.log('RateRadar: Error during initialization:', error);
            // Even if there's an error, enable smart shopping
            this.setupHighlightListener();
        }
    }

    isExcludedSite() {
        const hostname = window.location.hostname.toLowerCase();
        return this.excludedSites.some(site => hostname.includes(site));
        }

        async loadSettings() {
            try {
                const result = await chrome.storage.sync.get(['settings']);
                const settings = result.settings || {};
                
                this.isEnabled = settings.smartShopping !== false; // Default to true if not set
                this.baseCurrency = settings.baseCurrency || 'USD';
                this.userCurrency = settings.baseCurrency || 'USD'; // Use base currency as user currency
                
                console.log('RateRadar: Loaded settings:', {
                    smartShopping: this.isEnabled,
                    baseCurrency: this.baseCurrency,
                    userCurrency: this.userCurrency
                });
            } catch (error) {
                console.log('RateRadar: Error loading settings:', error);
                // Default to enabled if there's an error
                this.isEnabled = true;
                this.baseCurrency = 'USD';
                this.userCurrency = 'USD';
            }
        }

    setupHighlightListener() {
        // Listen for text selection
        document.addEventListener('mouseup', this.handleTextSelection.bind(this));
        document.addEventListener('keyup', this.handleTextSelection.bind(this));
        
        // Remove existing overlay when clicking elsewhere
        document.addEventListener('click', this.removeOverlay.bind(this));
        
        // Listen for settings changes
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync' && changes.settings) {
                console.log('Settings changed, reloading...');
                this.loadSettings();
            }
        });
        
        console.log('RateRadar: Highlight listener setup complete');
    }

    handleTextSelection(event) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        // Remove existing overlay
        this.removeOverlay();
        
        if (selectedText && this.isPriceText(selectedText)) {
            console.log('RateRadar: Price detected:', selectedText);
            this.showPriceOverlay(selectedText, event);
        }
    }

    isPriceText(text) {
        // Comprehensive price detection patterns for 180+ currencies
        const pricePatterns = [
            // Dollar amounts
            /\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /\$\s*\d+(?:\.\d{2})?/g,
            /USD\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /USD\s*\d+(?:\.\d{2})?/g,
            
            // Euro amounts
            /€\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /€\s*\d+(?:\.\d{2})?/g,
            /EUR\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /EUR\s*\d+(?:\.\d{2})?/g,
            
            // Pound amounts
            /£\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /£\s*\d+(?:\.\d{2})?/g,
            /GBP\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /GBP\s*\d+(?:\.\d{2})?/g,
            
            // Yen amounts
            /¥\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /¥\s*\d+(?:\.\d{2})?/g,
            /JPY\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /JPY\s*\d+(?:\.\d{2})?/g,
            
            // Naira amounts
            /₦\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /₦\s*\d+(?:\.\d{2})?/g,
            /NGN\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /NGN\s*\d+(?:\.\d{2})?/g,
            
            // Rupee amounts
            /₹\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /₹\s*\d+(?:\.\d{2})?/g,
            /INR\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /INR\s*\d+(?:\.\d{2})?/g,
            
            // Rand amounts
            /R\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /R\s*\d+(?:\.\d{2})?/g,
            /ZAR\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /ZAR\s*\d+(?:\.\d{2})?/g,
            
            // Yuan amounts
            /¥\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /CNY\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /CNY\s*\d+(?:\.\d{2})?/g,
            
            // Canadian Dollar
            /C\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /CAD\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            
            // Australian Dollar
            /A\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /AUD\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            
            // Swiss Franc
            /CHF\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
            /CHF\s*\d+(?:\.\d{2})?/g,
            
            // Plain numbers that look like prices (3+ digits)
            /\b\d{3,}(?:,\d{3})*(?:\.\d{2})?\b/g
        ];
        
        return pricePatterns.some(pattern => pattern.test(text));
    }

    parsePrice(text) {
        // Enhanced currency mapping for 180+ currencies
        const currencyMap = {
            '$': 'USD', 'USD': 'USD',
            '€': 'EUR', 'EUR': 'EUR',
            '£': 'GBP', 'GBP': 'GBP',
            '¥': 'JPY', 'JPY': 'JPY',
            '₦': 'NGN', 'NGN': 'NGN',
            '₹': 'INR', 'INR': 'INR',
            'R': 'ZAR', 'ZAR': 'ZAR',
            'C$': 'CAD', 'CAD': 'CAD',
            'A$': 'AUD', 'AUD': 'AUD',
            'CHF': 'CHF',
            'CNY': 'CNY',
            'SEK': 'SEK', 'NOK': 'NOK', 'DKK': 'DKK',
            'PLN': 'PLN', 'CZK': 'CZK', 'HUF': 'HUF',
            'RON': 'RON', 'BGN': 'BGN', 'HRK': 'HRK',
            'RUB': 'RUB', 'TRY': 'TRY', 'BRL': 'BRL',
            'MXN': 'MXN', 'ARS': 'ARS', 'CLP': 'CLP',
            'COP': 'COP', 'PEN': 'PEN', 'UYU': 'UYU',
            'VEF': 'VEF', 'EGP': 'EGP', 'MAD': 'MAD',
            'TND': 'TND', 'DZD': 'DZD', 'LYD': 'LYD',
            'KES': 'KES', 'UGX': 'UGX', 'TZS': 'TZS',
            'ETB': 'ETB', 'GHS': 'GHS', 'XOF': 'XOF',
            'XAF': 'XAF', 'PKR': 'PKR', 'BDT': 'BDT',
            'LKR': 'LKR', 'NPR': 'NPR', 'THB': 'THB',
            'VND': 'VND', 'IDR': 'IDR', 'MYR': 'MYR',
            'SGD': 'SGD', 'HKD': 'HKD', 'TWD': 'TWD',
            'KRW': 'KRW', 'PHP': 'PHP', 'ILS': 'ILS',
            'AED': 'AED', 'SAR': 'SAR', 'QAR': 'QAR',
            'KWD': 'KWD', 'BHD': 'BHD', 'OMR': 'OMR',
            'JOD': 'JOD', 'LBP': 'LBP', 'IRR': 'IRR',
            'IQD': 'IQD', 'AFN': 'AFN', 'UZS': 'UZS',
            'KZT': 'KZT', 'GEL': 'GEL', 'ARM': 'ARM',
            'AZN': 'AZN', 'BYN': 'BYN', 'MDL': 'MDL',
            'UAH': 'UAH', 'KGS': 'KGS', 'TJS': 'TJS',
            'TMT': 'TMT', 'MNT': 'MNT', 'LAK': 'LAK',
            'KHR': 'KHR', 'MMK': 'MMK', 'BND': 'BND',
            'MVR': 'MVR', 'BTN': 'BTN', 'MOP': 'MOP',
            'FJD': 'FJD', 'WST': 'WST', 'TOP': 'TOP',
            'VUV': 'VUV', 'SBD': 'SBD', 'PGK': 'PGK',
            'NZD': 'NZD'
        };
        
        // Find currency symbol
        let currency = 'USD'; // Default
        for (const [symbol, code] of Object.entries(currencyMap)) {
            if (text.includes(symbol)) {
                currency = code;
                break;
            }
        }
        
        // Extract amount
        const amountMatch = text.match(/[\d,]+\.?\d*/);
        if (amountMatch) {
            const amount = parseFloat(amountMatch[0].replace(/,/g, ''));
            return { currency, amount };
        }

        return null;
    }

    async showPriceOverlay(priceText, event) {
        try {
            const priceData = this.parsePrice(priceText);
            if (!priceData) return;
            
            console.log('RateRadar: Parsed price:', priceData);
            
            // Convert to user's base currency
            const convertedAmount = await this.convertPrice(priceData.currency, this.userCurrency, priceData.amount);
            
            if (convertedAmount) {
                this.createOverlay(priceText, convertedAmount, event, priceData.currency);
            }
            
        } catch (error) {
            console.log('RateRadar: Error showing price overlay:', error);
        }
    }

    async convertPrice(fromCurrency, toCurrency, amount) {
        try {
            console.log(`RateRadar: Converting ${amount} ${fromCurrency} to ${toCurrency}`);
            
            if (fromCurrency === toCurrency) {
                return amount;
            }
            
            // Try multiple API endpoints
            const apis = [
                {
                    url: `https://api.exchangerate.host/latest?base=${fromCurrency}&symbols=${toCurrency}`,
                    handler: (data) => data.rates && data.rates[toCurrency]
                },
                {
                    url: `https://latest.currency-api.pages.dev/v1/currencies/${fromCurrency.toLowerCase()}.json`,
                    handler: (data) => data[fromCurrency.toLowerCase()] && data[fromCurrency.toLowerCase()][toCurrency.toLowerCase()]
                }
            ];
            
            for (const api of apis) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch(api.url, {
                            signal: controller.signal,
                            headers: {
                                'Accept': 'application/json',
                                'User-Agent': 'RateRadar/1.0'
                            }
                        });
                        
                        clearTimeout(timeoutId);
                        
                    if (response.ok) {
                        const data = await response.json();
                        const rate = api.handler(data);
                        
                        if (rate) {
                            const converted = amount * rate;
                            console.log(`RateRadar: Conversion successful: ${amount} ${fromCurrency} = ${converted} ${toCurrency}`);
                            return converted;
                        }
                    }
                } catch (apiError) {
                    console.log(`RateRadar: API failed:`, apiError.message);
                    continue;
                }
            }

            console.log('RateRadar: All APIs failed for conversion');
            return null;
            
        } catch (error) {
            console.log('RateRadar: Error converting price:', error);
            return null;
        }
    }

    createOverlay(originalText, convertedAmount, event, originalCurrency) {
        // Remove existing overlay
        this.removeOverlay();
        
        // Create overlay element
        this.priceOverlay = document.createElement('div');
        this.priceOverlay.style.cssText = `
            position: fixed;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            cursor: pointer;
            user-select: none;
            animation: rateRadarSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            max-width: 320px;
            word-wrap: break-word;
            border: 2px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
        `;
        
        // Format the converted amount with proper currency symbol
        const formattedAmount = this.formatPrice(convertedAmount, this.userCurrency);
        const originalFormatted = this.formatPrice(parseFloat(originalText.match(/[\d,]+\.?\d*/)[0].replace(/,/g, '')), originalCurrency);
        
        // Get currency symbols for better display
        const originalSymbol = this.getCurrencySymbol(originalCurrency);
        const convertedSymbol = this.getCurrencySymbol(this.userCurrency);
        
        this.priceOverlay.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <div style="font-size: 12px; opacity: 0.9; display: flex; align-items: center;">
                    <span style="margin-right: 6px;">${originalSymbol}</span>
                    <span>${originalFormatted}</span>
                </div>
                <div style="font-size: 10px; opacity: 0.7; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px;">
                    RateRadar
                </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="font-size: 18px; font-weight: 700; display: flex; align-items: center;">
                    <span style="margin-right: 6px;">${convertedSymbol}</span>
                    <span>${formattedAmount}</span>
                </div>
                <div style="font-size: 10px; opacity: 0.8; text-align: right;">
                    <div>Click to dismiss</div>
                    <div style="margin-top: 2px;">Auto-hide in 5s</div>
                </div>
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px; opacity: 0.8;">
                💡 Tip: Set your preferred currency in RateRadar settings
            </div>
        `;
        
        // Position the overlay near the mouse
        const x = Math.min(event.clientX + 15, window.innerWidth - 340);
        const y = Math.min(event.clientY + 15, window.innerHeight - 120);
        
        this.priceOverlay.style.left = `${x}px`;
        this.priceOverlay.style.top = `${y}px`;
        
        // Add click handler to dismiss
        this.priceOverlay.addEventListener('click', () => {
            this.removeOverlay();
        });
        
        // Add hover effects
        this.priceOverlay.addEventListener('mouseenter', () => {
            this.priceOverlay.style.transform = 'scale(1.02)';
            this.priceOverlay.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4)';
        });
        
        this.priceOverlay.addEventListener('mouseleave', () => {
            this.priceOverlay.style.transform = 'scale(1)';
            this.priceOverlay.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
        });
        
        // Add to page
        document.body.appendChild(this.priceOverlay);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            this.removeOverlay();
        }, 5000);
        
        console.log('RateRadar: Price overlay created');
    }

    formatPrice(amount, currency) {
        // Enhanced currency symbols for 180+ currencies
        const symbols = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
            'NGN': '₦', 'INR': '₹', 'ZAR': 'R', 'CAD': 'C$',
            'AUD': 'A$', 'CHF': 'CHF', 'CNY': '¥', 'SEK': 'SEK',
            'NOK': 'NOK', 'DKK': 'DKK', 'PLN': 'PLN', 'CZK': 'CZK',
            'HUF': 'HUF', 'RON': 'RON', 'BGN': 'BGN', 'HRK': 'HRK',
            'RUB': 'RUB', 'TRY': 'TRY', 'BRL': 'BRL', 'MXN': 'MXN',
            'ARS': 'ARS', 'CLP': 'CLP', 'COP': 'COP', 'PEN': 'PEN',
            'UYU': 'UYU', 'VEF': 'VEF', 'EGP': 'EGP', 'MAD': 'MAD',
            'TND': 'TND', 'DZD': 'DZD', 'LYD': 'LYD', 'KES': 'KES',
            'UGX': 'UGX', 'TZS': 'TZS', 'ETB': 'ETB', 'GHS': 'GHS',
            'XOF': 'XOF', 'XAF': 'XAF', 'PKR': 'PKR', 'BDT': 'BDT',
            'LKR': 'LKR', 'NPR': 'NPR', 'THB': 'THB', 'VND': 'VND',
            'IDR': 'IDR', 'MYR': 'MYR', 'SGD': 'SGD', 'HKD': 'HKD',
            'TWD': 'TWD', 'KRW': 'KRW', 'PHP': 'PHP', 'ILS': 'ILS',
            'AED': 'AED', 'SAR': 'SAR', 'QAR': 'QAR', 'KWD': 'KWD',
            'BHD': 'BHD', 'OMR': 'OMR', 'JOD': 'JOD', 'LBP': 'LBP',
            'IRR': 'IRR', 'IQD': 'IQD', 'AFN': 'AFN', 'UZS': 'UZS',
            'KZT': 'KZT', 'GEL': 'GEL', 'ARM': 'ARM', 'AZN': 'AZN',
            'BYN': 'BYN', 'MDL': 'MDL', 'UAH': 'UAH', 'KGS': 'KGS',
            'TJS': 'TJS', 'TMT': 'TMT', 'MNT': 'MNT', 'LAK': 'LAK',
            'KHR': 'KHR', 'MMK': 'MMK', 'BND': 'BND', 'MVR': 'MVR',
            'BTN': 'BTN', 'MOP': 'MOP', 'FJD': 'FJD', 'WST': 'WST',
            'TOP': 'TOP', 'VUV': 'VUV', 'SBD': 'SBD', 'PGK': 'PGK',
            'NZD': 'NZD'
        };
        
        const symbol = symbols[currency] || currency;
        
        if (amount >= 1000000) {
            return `${symbol}${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `${symbol}${amount.toLocaleString()}`;
        } else {
            return `${symbol}${amount.toFixed(2)}`;
        }
    }

    getCurrencySymbol(currency) {
        const symbols = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
            'NGN': '₦', 'INR': '₹', 'ZAR': 'R', 'CAD': 'C$',
            'AUD': 'A$', 'CHF': 'CHF', 'CNY': '¥', 'SEK': 'SEK',
            'NOK': 'NOK', 'DKK': 'DKK', 'PLN': 'PLN', 'CZK': 'CZK',
            'HUF': 'HUF', 'RON': 'RON', 'BGN': 'BGN', 'HRK': 'HRK',
            'RUB': 'RUB', 'TRY': 'TRY', 'BRL': 'BRL', 'MXN': 'MXN',
            'ARS': 'ARS', 'CLP': 'CLP', 'COP': 'COP', 'PEN': 'PEN',
            'UYU': 'UYU', 'VEF': 'VEF', 'EGP': 'EGP', 'MAD': 'MAD',
            'TND': 'TND', 'DZD': 'DZD', 'LYD': 'LYD', 'KES': 'KES',
            'UGX': 'UGX', 'TZS': 'TZS', 'ETB': 'ETB', 'GHS': 'GHS',
            'XOF': 'XOF', 'XAF': 'XAF', 'PKR': 'PKR', 'BDT': 'BDT',
            'LKR': 'LKR', 'NPR': 'NPR', 'THB': 'THB', 'VND': 'VND',
            'IDR': 'IDR', 'MYR': 'MYR', 'SGD': 'SGD', 'HKD': 'HKD',
            'TWD': 'TWD', 'KRW': 'KRW', 'PHP': 'PHP', 'ILS': 'ILS',
            'AED': 'AED', 'SAR': 'SAR', 'QAR': 'QAR', 'KWD': 'KWD',
            'BHD': 'BHD', 'OMR': 'OMR', 'JOD': 'JOD', 'LBP': 'LBP',
            'IRR': 'IRR', 'IQD': 'IQD', 'AFN': 'AFN', 'UZS': 'UZS',
            'KZT': 'KZT', 'GEL': 'GEL', 'ARM': 'ARM', 'AZN': 'AZN',
            'BYN': 'BYN', 'MDL': 'MDL', 'UAH': 'UAH', 'KGS': 'KGS',
            'TJS': 'TJS', 'TMT': 'TMT', 'MNT': 'MNT', 'LAK': 'LAK',
            'KHR': 'KHR', 'MMK': 'MMK', 'BND': 'BND', 'MVR': 'MVR',
            'BTN': 'BTN', 'MOP': 'MOP', 'FJD': 'FJD', 'WST': 'WST',
            'TOP': 'TOP', 'VUV': 'VUV', 'SBD': 'SBD', 'PGK': 'PGK',
            'NZD': 'NZD'
        };
        
        return symbols[currency] || currency;
    }

    removeOverlay() {
        if (this.priceOverlay && this.priceOverlay.parentNode) {
            this.priceOverlay.style.animation = 'rateRadarSlideOut 0.3s ease-out';
            setTimeout(() => {
                if (this.priceOverlay && this.priceOverlay.parentNode) {
                    this.priceOverlay.parentNode.removeChild(this.priceOverlay);
                    this.priceOverlay = null;
                }
            }, 300);
        }
    }
}

// Initialize the content script
    const rateRadarContent = new RateRadarContent(); 

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes rateRadarSlideIn {
        from { 
            opacity: 0; 
            transform: translateY(-20px) scale(0.9); 
        }
        to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
        }
    }
    
    @keyframes rateRadarSlideOut {
        from { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
        }
        to { 
            opacity: 0; 
            transform: translateY(-20px) scale(0.9); 
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

console.log('RateRadar: Content script loaded successfully'); 