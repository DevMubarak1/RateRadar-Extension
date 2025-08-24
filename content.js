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
            const result = await chrome.storage.sync.get([
                'smartShopping',
                'baseCurrency',
                'userCurrency'
            ]);
            
            this.isEnabled = result.smartShopping !== false; // Default to true if not set
            this.baseCurrency = result.baseCurrency || 'USD';
            this.userCurrency = result.userCurrency || 'USD';
            
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
        // Comprehensive price detection patterns
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
            
            // Plain numbers that look like prices (3+ digits)
            /\b\d{3,}(?:,\d{3})*(?:\.\d{2})?\b/g
        ];
        
        return pricePatterns.some(pattern => pattern.test(text));
    }

    parsePrice(text) {
        // Extract currency and amount
        const currencyMap = {
            '$': 'USD', 'USD': 'USD',
            '€': 'EUR', 'EUR': 'EUR',
            '£': 'GBP', 'GBP': 'GBP',
            '¥': 'JPY', 'JPY': 'JPY',
            '₦': 'NGN', 'NGN': 'NGN',
            '₹': 'INR', 'INR': 'INR',
            'R': 'ZAR', 'ZAR': 'ZAR'
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
                this.createOverlay(priceText, convertedAmount, event);
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

    createOverlay(originalText, convertedAmount, event) {
        // Remove existing overlay
        this.removeOverlay();
        
        // Create overlay element
        this.priceOverlay = document.createElement('div');
        this.priceOverlay.style.cssText = `
            position: fixed;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            cursor: pointer;
            user-select: none;
            animation: fadeIn 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Format the converted amount
        const formattedAmount = this.formatPrice(convertedAmount, this.userCurrency);
        
        this.priceOverlay.innerHTML = `
            <div style="margin-bottom: 4px; font-size: 12px; opacity: 0.9;">${originalText}</div>
            <div style="font-size: 16px; font-weight: 700;">${formattedAmount}</div>
            <div style="font-size: 10px; opacity: 0.8; margin-top: 4px;">Click to dismiss</div>
        `;
        
        // Position the overlay near the mouse
        const x = event.clientX + 10;
        const y = event.clientY + 10;
        
        this.priceOverlay.style.left = `${x}px`;
        this.priceOverlay.style.top = `${y}px`;
        
        // Add click handler to dismiss
        this.priceOverlay.addEventListener('click', () => {
            this.removeOverlay();
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
        const symbols = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
            'NGN': '₦', 'INR': '₹', 'ZAR': 'R'
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

    removeOverlay() {
        if (this.priceOverlay && this.priceOverlay.parentNode) {
            this.priceOverlay.parentNode.removeChild(this.priceOverlay);
            this.priceOverlay = null;
        }
    }
}

// Initialize the content script
const rateRadarContent = new RateRadarContent();

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

console.log('RateRadar: Content script loaded successfully'); 