// RateRadar Content Script - Enhanced Smart Shopping with Proper Price Display
    class RateRadarContent {
        constructor() {
            this.isEnabled = false;
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
                console.log('RateRadar: Settings loaded - Smart shopping enabled:', this.isEnabled);
                
                // Only initialize if smart shopping is enabled
                if (this.isEnabled) {
                    this.setupHighlightListener();
                    console.log('RateRadar: Smart shopping enabled for highlight-based conversion');
                } else {
                    console.log('RateRadar: Smart shopping is disabled in settings');
                }
            } catch (error) {
                console.log('RateRadar: Error during initialization:', error);
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
        // Enhanced price detection patterns
        const pricePatterns = [
            /^\$[\d,]+\.?\d*$/,           // $123.45
            /^[\d,]+\.?\d*\s*\$/,         // 123.45$
            /^€[\d,]+\.?\d*$/,            // €123.45
            /^[\d,]+\.?\d*\s*€/,          // 123.45€
            /^£[\d,]+\.?\d*$/,            // £123.45
            /^[\d,]+\.?\d*\s*£/,          // 123.45£
            /^¥[\d,]+\.?\d*$/,            // ¥123.45
            /^[\d,]+\.?\d*\s*¥/,          // 123.45¥
            /^₦[\d,]+\.?\d*$/,            // ₦123.45
            /^[\d,]+\.?\d*\s*₦/,          // 123.45₦
            /^₹[\d,]+\.?\d*$/,            // ₹123.45
            /^[\d,]+\.?\d*\s*₹/,          // 123.45₹
            /^₩[\d,]+\.?\d*$/,            // ₩123.45
            /^[\d,]+\.?\d*\s*₩/,          // 123.45₩
            /^₽[\d,]+\.?\d*$/,            // ₽123.45
            /^[\d,]+\.?\d*\s*₽/,          // 123.45₽
            /^₺[\d,]+\.?\d*$/,            // ₺123.45
            /^[\d,]+\.?\d*\s*₺/,          // 123.45₺
            /^[\d,]+\.?\d*\s*(USD|EUR|GBP|JPY|CNY|CAD|AUD|CHF|NGN|ZAR|INR|BRL|MXN|ARS|CLP|COP|PEN|UYU|VEF|EGP|MAD|TND|DZD|LYD|KES|UGX|TZS|ETB|GHS|XOF|XAF|PKR|BDT|LKR|NPR|THB|VND|IDR|MYR|SGD|HKD|TWD|KRW|PHP|ILS|AED|SAR|QAR|KWD|BHD|OMR|JOD|LBP|IRR|IQD|AFN|UZS|KZT|GEL|ARM|AZN|BYN|MDL|UAH|KGS|TJS|TMT|MNT|LAK|KHR|MMK|BND|MVR|BTN|MOP|FJD|WST|TOP|VUV|SBD|PGK|NZD)$/i,  // 123.45 USD
            /^(USD|EUR|GBP|JPY|CNY|CAD|AUD|CHF|NGN|ZAR|INR|BRL|MXN|ARS|CLP|COP|PEN|UYU|VEF|EGP|MAD|TND|DZD|LYD|KES|UGX|TZS|ETB|GHS|XOF|XAF|PKR|BDT|LKR|NPR|THB|VND|IDR|MYR|SGD|HKD|TWD|KRW|PHP|ILS|AED|SAR|QAR|KWD|BHD|OMR|JOD|LBP|IRR|IQD|AFN|UZS|KZT|GEL|ARM|AZN|BYN|MDL|UAH|KGS|TJS|TMT|MNT|LAK|KHR|MMK|BND|MVR|BTN|MOP|FJD|WST|TOP|VUV|SBD|PGK|NZD)\s*[\d,]+\.?\d*$/i  // USD 123.45
        ];
        
        return pricePatterns.some(pattern => pattern.test(text));
    }

    parsePrice(text) {
        // Currency symbols mapping
        const currencyMap = {
            '$': 'USD',
            '€': 'EUR',
            '£': 'GBP',
            '¥': 'JPY',
            '₦': 'NGN',
            '₹': 'INR',
            '₩': 'KRW',
            '₽': 'RUB',
            '₺': 'TRY'
        };

        // Extract currency and amount
        let currency = 'USD';
        let amount = 0;

        // Check for currency symbols
        for (const [symbol, code] of Object.entries(currencyMap)) {
            if (text.includes(symbol)) {
                currency = code;
                amount = parseFloat(text.replace(symbol, '').replace(/,/g, ''));
                        break;
            }
        }

        // Check for currency codes
        if (amount === 0) {
            const currencyCodes = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF', 'NGN', 'ZAR', 'INR', 'BRL', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'VEF', 'EGP', 'MAD', 'TND', 'DZD', 'LYD', 'KES', 'UGX', 'TZS', 'ETB', 'GHS', 'XOF', 'XAF', 'PKR', 'BDT', 'LKR', 'NPR', 'THB', 'VND', 'IDR', 'MYR', 'SGD', 'HKD', 'TWD', 'KRW', 'PHP', 'ILS', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'IRR', 'IQD', 'AFN', 'UZS', 'KZT', 'GEL', 'ARM', 'AZN', 'BYN', 'MDL', 'UAH', 'KGS', 'TJS', 'TMT', 'MNT', 'LAK', 'KHR', 'MMK', 'BND', 'MVR', 'BTN', 'MOP', 'FJD', 'WST', 'TOP', 'VUV', 'SBD', 'PGK', 'NZD'];
            
            for (const code of currencyCodes) {
                const regex = new RegExp(`\\b${code}\\b`, 'i');
                if (regex.test(text)) {
                    currency = code;
                    amount = parseFloat(text.replace(regex, '').replace(/,/g, '').trim());
                    break;
                }
            }
        }

        // If still no amount found, try to extract just the number
        if (amount === 0) {
            amount = parseFloat(text.replace(/[^\d.,]/g, '').replace(/,/g, ''));
        }

        return { currency, amount };
    }

    async showPriceOverlay(priceText, event) {
        try {
            const { currency, amount } = this.parsePrice(priceText);
            
            if (amount <= 0) return;

            // Convert the price
            const convertedAmount = await this.convertPrice(amount, currency, this.userCurrency);
            
            if (convertedAmount > 0) {
                this.createOverlay(priceText, convertedAmount, currency, this.userCurrency, event);
                    }
                } catch (error) {
            console.log('RateRadar: Error showing price overlay:', error);
        }
    }

    async convertPrice(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return amount;

        try {
            // Multiple API endpoints for reliability
            const apis = [
                `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
                `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${fromCurrency}.json`,
                `https://latest.currency-api.pages.dev/v1/currencies/${fromCurrency}.json`
            ];

            for (const api of apis) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);

                    const response = await fetch(api, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const data = await response.json();
                        let rate = 0;

                        if (api.includes('exchangerate-api.com')) {
                            rate = data.rates[toCurrency];
                        } else if (api.includes('fawazahmed0')) {
                            rate = data[fromCurrency][toCurrency];
                        } else if (api.includes('currency-api.pages.dev')) {
                            rate = data[fromCurrency][toCurrency];
                        }

                        if (rate && rate > 0) {
                            return amount * rate;
                        }
                    }
                } catch (error) {
                    console.log(`RateRadar: API ${api} failed:`, error.message);
                    continue;
                }
            }

            throw new Error('All exchange rate APIs failed');
        } catch (error) {
            console.log('RateRadar: Error converting price:', error);
            return 0;
        }
    }

    createOverlay(originalText, convertedAmount, fromCurrency, toCurrency, event) {
        // Remove existing overlay
        this.removeOverlay();

        // Create overlay element
            const overlay = document.createElement('div');
            overlay.className = 'rateradar-price-overlay';
            overlay.style.cssText = `
            position: fixed;
            background: linear-gradient(135deg, #3B82F6, #2563EB);
                color: white;
            padding: 12px 16px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px;
                font-weight: 600;
            z-index: 10000;
            backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 300px;
            word-wrap: break-word;
            animation: rateradar-fade-in 0.3s ease-out;
        `;

        // Format the converted amount
        const formattedAmount = this.formatPrice(convertedAmount, toCurrency);
        const originalFormatted = this.formatPrice(parseFloat(originalText.replace(/[^\d.,]/g, '').replace(/,/g, '')), fromCurrency);

        overlay.innerHTML = `
            <div style="margin-bottom: 4px; font-size: 12px; opacity: 0.9;">
                💱 RateRadar Conversion
            </div>
            <div style="margin-bottom: 6px;">
                <span style="opacity: 0.8;">${originalFormatted}</span>
                <span style="margin: 0 8px;">→</span>
                <span style="font-size: 16px; font-weight: 700;">${formattedAmount}</span>
            </div>
            <div style="font-size: 11px; opacity: 0.7;">
                Click to dismiss
            </div>
        `;

        // Position the overlay near the mouse
        const x = event.clientX + 10;
        const y = event.clientY - 10;
        
        overlay.style.left = `${Math.min(x, window.innerWidth - 320)}px`;
        overlay.style.top = `${Math.max(y, 10)}px`;

        // Add click to dismiss
        overlay.addEventListener('click', () => this.removeOverlay());

        // Add to page
        document.body.appendChild(overlay);
        this.priceOverlay = overlay;

        // Auto-remove after 5 seconds
        setTimeout(() => this.removeOverlay(), 5000);
    }

    formatPrice(amount, currency) {
        const currencySymbols = {
                'USD': '$',
                'EUR': '€',
                'GBP': '£',
                'JPY': '¥',
                'NGN': '₦',
            'ZAR': 'R',
                'INR': '₹',
            'BRL': 'R$',
                'MXN': '$',
            'ARS': '$',
            'CLP': '$',
            'COP': '$',
            'PEN': 'S/',
            'UYU': '$',
            'VEF': 'Bs',
            'EGP': 'E£',
            'MAD': 'MAD',
            'TND': 'TND',
            'DZD': 'DZD',
            'LYD': 'LYD',
            'KES': 'KSh',
            'UGX': 'UGX',
            'TZS': 'TSh',
            'ETB': 'ETB',
            'GHS': 'GH₵',
            'XOF': 'CFA',
            'XAF': 'FCFA',
            'PKR': '₨',
            'BDT': '৳',
            'LKR': '₨',
            'NPR': '₨',
            'THB': '฿',
                'VND': '₫',
            'IDR': 'Rp',
            'MYR': 'RM',
                'SGD': 'S$',
                'HKD': 'HK$',
            'TWD': 'NT$',
            'KRW': '₩',
            'PHP': '₱',
            'ILS': '₪',
                'AED': 'د.إ',
            'SAR': '﷼',
            'QAR': '﷼',
                'KWD': 'د.ك',
                'BHD': '.د.ب',
                'OMR': 'ر.ع.',
            'JOD': 'د.ا',
                'LBP': 'ل.ل',
                'IRR': '﷼',
            'IQD': 'ع.د',
                'AFN': '؋',
                'UZS': 'so\'m',
            'KZT': '₸',
            'GEL': '₾',
            'ARM': '֏',
            'AZN': '₼',
                'BYN': 'Br',
            'MDL': 'L',
            'UAH': '₴',
                'KGS': 'с',
            'TJS': 'ЅМ',
            'TMT': 'T',
            'MNT': '₮',
            'LAK': '₭',
            'KHR': '៛',
            'MMK': 'K',
            'BND': 'B$',
            'MVR': 'Rf',
            'BTN': 'Nu.',
            'MOP': 'MOP$',
            'FJD': 'FJ$',
            'WST': 'T',
            'TOP': 'T$',
            'VUV': 'VT',
            'SBD': 'SI$',
            'PGK': 'K',
            'NZD': 'NZ$'
        };

        const symbol = currencySymbols[currency] || currency;
        const formattedAmount = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);

        return `${symbol}${formattedAmount}`;
    }

    removeOverlay() {
        if (this.priceOverlay) {
            this.priceOverlay.remove();
            this.priceOverlay = null;
        }
    }

    // Handle settings changes from options page
    handleSettingChange(setting, value) {
        if (setting === 'smartShopping') {
            this.isEnabled = value;
            if (value) {
                this.setupHighlightListener();
            } else {
                this.removeOverlay();
                // Remove event listeners (simplified approach)
            }
        } else if (setting === 'baseCurrency') {
            this.baseCurrency = value;
        } else if (setting === 'userCurrency') {
            this.userCurrency = value;
        }
    }
}

// Add CSS for overlay animation
const style = document.createElement('style');
style.textContent = `
    @keyframes rateradar-fade-in {
        from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
`;
document.head.appendChild(style);

// Initialize RateRadar content script
const rateRadar = new RateRadarContent();

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'settingChanged') {
        rateRadar.handleSettingChange(message.setting, message.value);
    }
    sendResponse({ success: true });
}); 