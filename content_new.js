// RateRadar Content Script - Enhanced Smart Shopping
// Only activates on highlight and excludes GitHub-like sites

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
            // Check if we're on an excluded site
            if (this.isExcludedSite()) {
                console.log('RateRadar: Excluded site detected, skipping initialization');
                return;
            }

            // Load settings
            await this.loadSettings();
            
            // Only initialize if smart shopping is enabled
            if (this.isEnabled) {
                this.setupHighlightListener();
                console.log('RateRadar: Smart shopping enabled for highlight-based conversion');
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
            
            this.isEnabled = result.smartShopping || false;
            this.baseCurrency = result.baseCurrency || 'USD';
            this.userCurrency = result.userCurrency || 'USD';
        } catch (error) {
            console.log('RateRadar: Error loading settings:', error);
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
            /^₴[\d,]+\.?\d*$/,            // ₴123.45
            /^[\d,]+\.?\d*\s*₴/,          // 123.45₴
            /^₿[\d,]+\.?\d*$/,            // ₿123.45
            /^[\d,]+\.?\d*\s*₿/,          // 123.45₿
            /^Ξ[\d,]+\.?\d*$/,            // Ξ123.45
            /^[\d,]+\.?\d*\s*Ξ/,          // 123.45Ξ
            /^[\d,]+\.?\d*\s*(USD|EUR|GBP|JPY|CNY|CAD|AUD|CHF|NGN|ZAR|INR|BRL|MXN|ARS|CLP|COP|PEN|UYU|VEF|EGP|MAD|TND|DZD|LYD|KES|UGX|TZS|ETB|GHS|XOF|XAF|PKR|BDT|LKR|NPR|THB|VND|IDR|MYR|SGD|HKD|TWD|KRW|PHP|ILS|AED|SAR|QAR|KWD|BHD|OMR|JOD|LBP|IRR|IQD|AFN|UZS|KZT|GEL|ARM|AZN|BYN|MDL|UAH|KGS|TJS|TMT|MNT|LAK|KHR|MMK|BND|MVR|BTN|MOP|FJD|WST|TOP|VUV|SBD|PGK|NZD|BTC|ETH|ADA|SOL|BNB|XRP|DOT|DOGE|AVAX|MATIC|LINK|UNI|LTC|BCH|XLM|VET|FIL|ATOM|XMR|ALGO|XTZ|AAVE|COMP|SUSHI|CAKE|CRV|YFI|SNX|ZRX|BAL|1INCH|DASH|ZEC|XEM|MIOTA|NEO|QTUM|WAVES|XNO|ICX|ONT|ZIL|ONE|EGLD|NEAR|FTM|GRT|MANA|SAND|ENJ|AXS|GALA|CHZ|FLOW|ICP|THETA|VEGA|CELO|KSM|EOS|TRX|BSV)$/i
        ];
        
        return pricePatterns.some(pattern => pattern.test(text));
    }

    async showPriceOverlay(priceText, event) {
        try {
            // Extract currency and amount
            const { currency, amount } = this.parsePrice(priceText);
            
            if (!currency || !amount) return;
            
            // Convert price
            const convertedPrice = await this.convertPrice(currency, this.userCurrency, amount);
            
            if (convertedPrice) {
                this.createOverlay(priceText, convertedPrice, event);
            }
        } catch (error) {
            console.log('RateRadar: Error showing price overlay:', error);
        }
    }

    parsePrice(priceText) {
        // Remove commas and extract currency and amount
        const cleanText = priceText.replace(/,/g, '');
        
        // Currency symbols mapping
        const currencyMap = {
            '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₦': 'NGN',
            '₹': 'INR', '₩': 'KRW', '₽': 'RUB', '₺': 'TRY', '₴': 'UAH',
            '₿': 'BTC', 'Ξ': 'ETH', '₳': 'ADA', '◎': 'SOL', 'Ł': 'LTC',
            '₭': 'LAK', '៛': 'KHR', '₲': 'PYG', '₡': 'CRC', '₪': 'ILS',
            'د.إ': 'AED', 'ر.س': 'SAR', 'ر.ق': 'QAR', 'د.ك': 'KWD',
            'د.ب': 'BHD', 'ر.ع.': 'OMR', 'د.ا': 'JOD', 'ل.ل': 'LBP',
            '﷼': 'IRR', 'ع.د': 'IQD', '؋': 'AFN', '₸': 'KZT', '֏': 'AMD',
            '₼': 'AZN', 'Br': 'BYN', 'L': 'MDL', '₾': 'GEL', 'с': 'KGS',
            'ЅМ': 'TJS', 'T': 'TMT', '₮': 'MNT', 'Rp': 'IDR', 'RM': 'MYR',
            '₱': 'PHP', '฿': 'THB', '₫': 'VND', 'Nu.': 'BTN', 'Rf': 'MVR',
            'B$': 'BND', 'K': 'MMK', 'MOP$': 'MOP', 'so\'m': 'UZS',
            '₨': 'PKR', '৳': 'BDT', '₵': 'GHS', 'CFA': 'XOF', 'FCFA': 'XAF',
            'KSh': 'KES', 'USh': 'UGX', 'TSh': 'TZS', 'R$': 'BRL',
            'S$': 'SGD', 'HK$': 'HKD', 'NT$': 'TWD', 'C$': 'CAD',
            'A$': 'AUD', 'NZ$': 'NZD', 'FJ$': 'FJD', 'SI$': 'SBD',
            'TT$': 'TTD', 'Bds$': 'BBD', 'EC$': 'XCD', 'RD$': 'DOP',
            'J$': 'JMD', 'CHF': 'CHF'
        };
        
        // Try to find currency symbol
        for (const [symbol, code] of Object.entries(currencyMap)) {
            if (cleanText.includes(symbol)) {
                const amount = parseFloat(cleanText.replace(symbol, '').trim());
                if (!isNaN(amount)) {
                    return { currency: code, amount };
                }
            }
        }
        
        // Try to find currency code at the end
        const currencyCodeMatch = cleanText.match(/[\d.]+\.?\d*\s*([A-Z]{3})$/i);
        if (currencyCodeMatch) {
            const amount = parseFloat(currencyCodeMatch[0].replace(currencyCodeMatch[1], '').trim());
            if (!isNaN(amount)) {
                return { currency: currencyCodeMatch[1].toUpperCase(), amount };
            }
        }
        
        return { currency: null, amount: null };
    }

    async convertPrice(fromCurrency, toCurrency, amount) {
        try {
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
                    const timeoutId = setTimeout(() => controller.abort(), 3000);
                    
                    let response, data;
                    
                    if (exchangeAPIs[i].includes('fawazahmed0') || exchangeAPIs[i].includes('currency-api')) {
                        const url = `${exchangeAPIs[i]}/${from}.json`;
                        response = await fetch(url, { 
                            signal: controller.signal,
                            headers: {
                                'Accept': 'application/json',
                                'User-Agent': 'RateRadar/1.1'
                            }
                        });
                        
                        clearTimeout(timeoutId);
                        
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        
                        data = await response.json();
                        if (data[from] && data[from][to]) {
                            return amount * data[from][to];
                        }
                    } else if (exchangeAPIs[i].includes('exchangerate-api')) {
                        const url = `${exchangeAPIs[i]}/${from.toUpperCase()}`;
                        response = await fetch(url, { 
                            signal: controller.signal,
                            headers: {
                                'Accept': 'application/json',
                                'User-Agent': 'RateRadar/1.1'
                            }
                        });
                        
                        clearTimeout(timeoutId);
                        
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        
                        data = await response.json();
                        if (data.rates && data.rates[to.toUpperCase()]) {
                            return amount * data.rates[to.toUpperCase()];
                        }
                    }
                } catch (error) {
                    console.log(`RateRadar: API ${i + 1} failed:`, error);
                    continue;
                }
            }
            
            return null;
        } catch (error) {
            console.log('RateRadar: Error converting price:', error);
            return null;
        }
    }

    createOverlay(originalPrice, convertedPrice, event) {
        // Remove existing overlay
        this.removeOverlay();
        
        // Create overlay element
        this.priceOverlay = document.createElement('div');
        this.priceOverlay.className = 'rateradar-price-overlay';
        this.priceOverlay.innerHTML = `
            <div class="rateradar-overlay-content">
                <div class="rateradar-original">${originalPrice}</div>
                <div class="rateradar-converted">≈ ${this.formatPrice(convertedPrice, this.userCurrency)}</div>
                <div class="rateradar-info">RateRadar Conversion</div>
            </div>
        `;
        
        // Position overlay near the selection
        const rect = event.target.getBoundingClientRect();
        this.priceOverlay.style.position = 'fixed';
        this.priceOverlay.style.left = `${event.clientX + 10}px`;
        this.priceOverlay.style.top = `${event.clientY + 10}px`;
        this.priceOverlay.style.zIndex = '10000';
        
        // Add styles
        this.priceOverlay.style.cssText = `
            position: fixed;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 16px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            z-index: 10000;
            animation: rateradar-fade-in 0.3s ease-out;
            max-width: 200px;
        `;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rateradar-fade-in {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .rateradar-overlay-content {
                text-align: center;
            }
            .rateradar-original {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 4px;
            }
            .rateradar-converted {
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 4px;
            }
            .rateradar-info {
                font-size: 11px;
                opacity: 0.8;
            }
        `;
        document.head.appendChild(style);
        
        // Add to page
        document.body.appendChild(this.priceOverlay);
        
        // Auto-remove after 5 seconds
        setTimeout(() => this.removeOverlay(), 5000);
    }

    removeOverlay() {
        if (this.priceOverlay) {
            this.priceOverlay.remove();
            this.priceOverlay = null;
        }
    }

    formatPrice(amount, currency) {
        const currencySymbols = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CNY': '¥',
            'NGN': '₦', 'ZAR': 'R', 'INR': '₹', 'BRL': 'R$', 'MXN': '$',
            'ARS': '$', 'CLP': '$', 'COP': '$', 'PEN': 'S/', 'UYU': '$',
            'VEF': 'Bs', 'EGP': '£', 'MAD': 'د.م.', 'TND': 'د.ت',
            'DZD': 'د.ج', 'LYD': 'ل.د', 'KES': 'KSh', 'UGX': 'USh',
            'TZS': 'TSh', 'ETB': 'Br', 'GHS': '₵', 'XOF': 'CFA',
            'XAF': 'FCFA', 'PKR': '₨', 'BDT': '৳', 'LKR': '₨', 'NPR': '₨',
            'THB': '฿', 'VND': '₫', 'IDR': 'Rp', 'MYR': 'RM', 'SGD': 'S$',
            'HKD': 'HK$', 'TWD': 'NT$', 'KRW': '₩', 'PHP': '₱', 'ILS': '₪',
            'AED': 'د.إ', 'SAR': 'ر.س', 'QAR': 'ر.ق', 'KWD': 'د.ك',
            'BHD': 'د.ب', 'OMR': 'ر.ع.', 'JOD': 'د.ا', 'LBP': 'ل.ل',
            'IRR': '﷼', 'IQD': 'ع.د', 'AFN': '؋', 'UZS': 'so\'m',
            'KZT': '₸', 'GEL': '₾', 'AMD': '֏', 'AZN': '₼', 'BYN': 'Br',
            'MDL': 'L', 'UAH': '₴', 'KGS': 'с', 'TJS': 'ЅМ', 'TMT': 'T',
            'MNT': '₮', 'LAK': '₭', 'KHR': '៛', 'MMK': 'K', 'BND': 'B$',
            'MVR': 'Rf', 'BTN': 'Nu.', 'MOP': 'MOP$', 'FJD': 'FJ$',
            'WST': 'T', 'TOP': 'T$', 'VUV': 'VT', 'SBD': 'SI$', 'PGK': 'K',
            'NZD': 'NZ$', 'CAD': 'C$', 'AUD': 'A$', 'CHF': 'CHF',
            'BTC': '₿', 'ETH': 'Ξ', 'ADA': '₳', 'SOL': '◎', 'BNB': 'BNB',
            'XRP': 'XRP', 'DOT': 'DOT', 'DOGE': 'Ð', 'AVAX': 'AVAX',
            'MATIC': 'MATIC', 'LINK': 'LINK', 'UNI': 'UNI', 'LTC': 'Ł',
            'BCH': 'BCH', 'XLM': 'XLM', 'VET': 'VET', 'FIL': 'FIL',
            'ATOM': 'ATOM', 'XMR': 'XMR', 'ALGO': 'ALGO', 'XTZ': 'XTZ'
        };
        
        const symbol = currencySymbols[currency] || currency;
        return `${symbol}${parseFloat(amount).toFixed(2)}`;
    }

    // Listen for settings changes
    handleSettingChange(setting, value) {
        if (setting === 'smartShopping') {
            this.isEnabled = value;
            if (value) {
                this.setupHighlightListener();
            } else {
                this.removeOverlay();
                // Remove event listeners
                document.removeEventListener('mouseup', this.handleTextSelection.bind(this));
                document.removeEventListener('keyup', this.handleTextSelection.bind(this));
            }
        } else if (setting === 'userCurrency') {
            this.userCurrency = value;
        } else if (setting === 'baseCurrency') {
            this.baseCurrency = value;
        }
    }
}

// Initialize only if we're in a valid extension context
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    const rateRadar = new RateRadarContent();
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'settingChanged') {
            rateRadar.handleSettingChange(request.setting, request.value);
        }
        sendResponse({ success: true });
    });
} 