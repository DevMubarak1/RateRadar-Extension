// RateRadar Enhanced Popup JavaScript - Optimized Performance
class RateRadar {
    constructor() {
        this.currentTab = 'converter';
        this.exchangeRate = 0;
        this.cryptoPrice = 0;
        this.historyChart = null;
        this.isOnline = true;
        this.isLoading = false;
        
        // Optimized API endpoints with better fallbacks
        this.exchangeAPIs = [
            'https://api.exchangerate-api.com/v4/latest',
            'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies',
            'https://latest.currency-api.pages.dev/v1/currencies'
        ];
        
        // Crypto API endpoints
        this.cryptoAPIs = [
            'https://api.coingecko.com/api/v3/simple/price',
            'https://api.coincap.io/v2/assets'
        ];
        
        // Enhanced cache with better management
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.lastCacheCleanup = Date.now();
        
        // Performance optimization flags
        this.initialized = false;
        this.pendingRequests = new Map();
        
        this.init();
    }

    async init() {
        try {
            console.log('RateRadar initializing with enhanced performance...');
            
            // Load settings first
            await this.loadSettings();
            
            // Setup UI elements
            this.setupUI();
            
            // Initialize with cached data if available
            await this.initializeWithCache();
            
            // Mark as initialized
            this.initialized = true;
            
            // Perform initial conversion
            await this.performConversion();
            
        } catch (error) {
            console.error('RateRadar initialization error:', error);
            this.showError('Failed to initialize RateRadar');
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'baseCurrency',
                'userCurrency',
                'theme',
                'autoRefresh',
                'refreshInterval',
                'notifications',
                'soundAlerts',
                'smartShopping',
                'decimalPlaces',
                'showTrends'
            ]);
            
            this.settings = {
                baseCurrency: result.baseCurrency || 'USD',
                userCurrency: result.userCurrency || 'USD',
                theme: result.theme || 'light',
                autoRefresh: result.autoRefresh || false,
                refreshInterval: result.refreshInterval || 5,
                notifications: result.notifications || false,
                soundAlerts: result.soundAlerts || false,
                smartShopping: result.smartShopping || false,
                decimalPlaces: result.decimalPlaces || 2,
                showTrends: result.showTrends || false
            };
            
            // Apply theme
            this.applyTheme(this.settings.theme);
            
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            baseCurrency: 'USD',
            userCurrency: 'USD',
            theme: 'light',
            autoRefresh: false,
            refreshInterval: 5,
            notifications: false,
            soundAlerts: false,
            smartShopping: false,
            decimalPlaces: 2,
            showTrends: false
        };
    }

    setupUI() {
        // Setup tab switching
        this.setupTabs();
        
        // Setup currency inputs
        this.setupCurrencyInputs();
        
        // Setup action buttons
        this.setupActionButtons();
        
        // Setup settings button
        this.setupSettingsButton();
        
        // Setup swap buttons
        this.setupSwapButtons();
        
        // Setup crypto inputs
        this.setupCryptoInputs();
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(tabName) {
        // Update active tab
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
        
        // Perform conversion for the new tab
        this.performConversion();
    }

    setupCurrencyInputs() {
        const fromAmount = document.getElementById('fromAmount');
        const toAmount = document.getElementById('toAmount');
        const fromCurrency = document.getElementById('fromCurrency');
        const toCurrency = document.getElementById('toCurrency');
        
        // Setup amount input
        fromAmount.addEventListener('input', () => {
            this.debounceConversion();
        });
        
        // Setup currency selects
        fromCurrency.addEventListener('change', () => {
            this.performConversion();
        });
        
        toCurrency.addEventListener('change', () => {
            this.performConversion();
        });
        
        // Set default values
        fromAmount.value = '100';
        fromCurrency.value = this.settings.baseCurrency;
        toCurrency.value = this.settings.userCurrency;
    }

    setupCryptoInputs() {
        const fromCryptoAmount = document.getElementById('fromCryptoAmount');
        const toCryptoAmount = document.getElementById('toCryptoAmount');
        const fromCrypto = document.getElementById('fromCrypto');
        const toCrypto = document.getElementById('toCrypto');
        
        // Setup crypto amount input
        fromCryptoAmount.addEventListener('input', () => {
            this.debounceCryptoConversion();
        });
        
        // Setup crypto selects
        fromCrypto.addEventListener('change', () => {
            this.performCryptoConversion();
        });
        
        toCrypto.addEventListener('change', () => {
            this.performCryptoConversion();
        });
        
        // Set default values
        fromCryptoAmount.value = '1';
        fromCrypto.value = 'bitcoin';
        toCrypto.value = 'usd';
    }

    setupActionButtons() {
        // Setup alert button
        const setAlertBtn = document.getElementById('setAlertBtn');
        if (setAlertBtn) {
            setAlertBtn.addEventListener('click', () => {
                this.setRateAlert();
            });
        }
        
        // Setup favorite button
        const favoriteBtn = document.getElementById('favoriteBtn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => {
                this.toggleFavorite();
            });
        }
        
        // Setup crypto alert button
        const setCryptoAlertBtn = document.getElementById('setCryptoAlertBtn');
        if (setCryptoAlertBtn) {
            setCryptoAlertBtn.addEventListener('click', () => {
                this.setCryptoAlert();
            });
        }
        
        // Setup crypto favorite button
        const favoriteCryptoBtn = document.getElementById('favoriteCryptoBtn');
        if (favoriteCryptoBtn) {
            favoriteCryptoBtn.addEventListener('click', () => {
                this.toggleCryptoFavorite();
            });
        }
    }

    setupSettingsButton() {
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                chrome.runtime.openOptionsPage();
            });
        }
    }

    setupSwapButtons() {
        const swapBtn = document.getElementById('swapBtn');
        if (swapBtn) {
            swapBtn.addEventListener('click', () => {
                this.swapCurrencies();
            });
        }
        
        const swapCryptoBtn = document.getElementById('swapCryptoBtn');
        if (swapCryptoBtn) {
            swapCryptoBtn.addEventListener('click', () => {
                this.swapCrypto();
            });
        }
    }

    async initializeWithCache() {
        // Check for cached data
        const cachedData = this.getCachedData('exchangeRates');
        if (cachedData) {
            this.exchangeRate = cachedData.rate;
            this.updateRateDisplay();
        }
        
        const cachedCrypto = this.getCachedData('cryptoPrices');
        if (cachedCrypto) {
            this.cryptoPrice = cachedCrypto.price;
            this.updateCryptoDisplay();
        }
    }

    debounceConversion() {
        if (this.conversionTimeout) {
            clearTimeout(this.conversionTimeout);
        }
        
        this.conversionTimeout = setTimeout(() => {
            this.performConversion();
        }, 300);
    }

    debounceCryptoConversion() {
        if (this.cryptoConversionTimeout) {
            clearTimeout(this.cryptoConversionTimeout);
        }
        
        this.cryptoConversionTimeout = setTimeout(() => {
            this.performCryptoConversion();
        }, 300);
    }

    async performConversion() {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.showLoading(true);
            
            const fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
            const fromCurrency = document.getElementById('fromCurrency').value;
            const toCurrency = document.getElementById('toCurrency').value;
            
            if (fromAmount <= 0) {
                this.updateToAmount(0);
                return;
            }
            
            // Check cache first
            const cacheKey = `${fromCurrency}_${toCurrency}`;
            const cachedRate = this.getCachedData(cacheKey);
            
            let rate;
            if (cachedRate && !this.isCacheExpired(cachedRate.timestamp)) {
                rate = cachedRate.rate;
            } else {
                rate = await this.getExchangeRate(fromCurrency, toCurrency);
                if (rate) {
                    this.cacheData(cacheKey, { rate, timestamp: Date.now() });
                }
            }
            
            if (rate) {
                this.exchangeRate = rate;
                const convertedAmount = fromAmount * rate;
                this.updateToAmount(convertedAmount);
                this.updateRateDisplay();
                this.updateLastUpdated();
            } else {
                this.showError('Failed to get exchange rate');
            }
            
        } catch (error) {
            console.error('Conversion error:', error);
            this.showError('Conversion failed');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    async performCryptoConversion() {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.showLoading(true);
            
            const fromAmount = parseFloat(document.getElementById('fromCryptoAmount').value) || 0;
            const fromCrypto = document.getElementById('fromCrypto').value;
            const toCrypto = document.getElementById('toCrypto').value;
            
            if (fromAmount <= 0) {
                this.updateToCryptoAmount(0);
                return;
            }
            
            // Check cache first
            const cacheKey = `crypto_${fromCrypto}_${toCrypto}`;
            const cachedPrice = this.getCachedData(cacheKey);
            
            let price;
            if (cachedPrice && !this.isCacheExpired(cachedPrice.timestamp)) {
                price = cachedPrice.price;
            } else {
                price = await this.getCryptoPrice(fromCrypto, toCrypto);
                if (price) {
                    this.cacheData(cacheKey, { price, timestamp: Date.now() });
                }
            }
            
            if (price) {
                this.cryptoPrice = price;
                const convertedAmount = fromAmount * price;
                this.updateToCryptoAmount(convertedAmount);
                this.updateCryptoDisplay();
            } else {
                this.showError('Failed to get crypto price');
            }
            
        } catch (error) {
            console.error('Crypto conversion error:', error);
            this.showError('Crypto conversion failed');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    async getExchangeRate(fromCurrency, toCurrency) {
        // Check if request is already pending
        const requestKey = `${fromCurrency}_${toCurrency}`;
        if (this.pendingRequests.has(requestKey)) {
            return this.pendingRequests.get(requestKey);
        }
        
        const requestPromise = this.fetchExchangeRate(fromCurrency, toCurrency);
        this.pendingRequests.set(requestKey, requestPromise);
        
        try {
            const rate = await requestPromise;
            this.pendingRequests.delete(requestKey);
            return rate;
        } catch (error) {
            this.pendingRequests.delete(requestKey);
            throw error;
        }
    }

    async fetchExchangeRate(fromCurrency, toCurrency) {
        const from = fromCurrency.toLowerCase();
        const to = toCurrency.toLowerCase();
        
        // Try each API endpoint
        for (let i = 0; i < this.exchangeAPIs.length; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                let response, data;
                
                if (this.exchangeAPIs[i].includes('fawazahmed0') || this.exchangeAPIs[i].includes('currency-api')) {
                    const url = `${this.exchangeAPIs[i]}/${from}.json`;
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
                        return data[from][to];
                    }
                } else if (this.exchangeAPIs[i].includes('exchangerate-api')) {
                    const url = `${this.exchangeAPIs[i]}/${from.toUpperCase()}`;
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
                        return data.rates[to.toUpperCase()];
                    }
                }
            } catch (error) {
                console.log(`API ${i + 1} failed:`, error);
                continue;
            }
        }
        
        throw new Error('All APIs failed');
    }

    async getCryptoPrice(cryptoId, targetCurrency) {
        try {
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=${targetCurrency}`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(url, { 
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'RateRadar/1.1'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return data[cryptoId]?.[targetCurrency] || null;
            
        } catch (error) {
            console.error('Crypto API error:', error);
            return null;
        }
    }

    updateToAmount(amount) {
        const toAmount = document.getElementById('toAmount');
        if (toAmount) {
            toAmount.value = amount.toFixed(this.settings.decimalPlaces);
        }
    }

    updateToCryptoAmount(amount) {
        const toCryptoAmount = document.getElementById('toCryptoAmount');
        if (toCryptoAmount) {
            toCryptoAmount.value = amount.toFixed(6);
        }
    }

    updateRateDisplay() {
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;
        const exchangeRateElement = document.getElementById('exchangeRate');
        
        if (exchangeRateElement && this.exchangeRate) {
            exchangeRateElement.textContent = `1 ${fromCurrency} = ${this.exchangeRate.toFixed(this.settings.decimalPlaces)} ${toCurrency}`;
        }
    }

    updateCryptoDisplay() {
        const fromCrypto = document.getElementById('fromCrypto');
        const toCrypto = document.getElementById('toCrypto');
        const cryptoPriceElement = document.getElementById('cryptoPrice');
        const cryptoChangeElement = document.getElementById('cryptoChange');
        
        if (cryptoPriceElement && this.cryptoPrice) {
            const selectedCrypto = fromCrypto.options[fromCrypto.selectedIndex].text;
            const selectedCurrency = toCrypto.options[toCrypto.selectedIndex].text;
            cryptoPriceElement.textContent = `${this.formatPrice(this.cryptoPrice, toCrypto.value)}`;
        }
    }

    updateLastUpdated() {
        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            const now = new Date();
            lastUpdatedElement.textContent = now.toLocaleTimeString();
        }
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.toggle('hidden', !show);
        }
    }

    showError(message) {
        console.error('RateRadar Error:', message);
        // You can implement a toast notification here
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    swapCurrencies() {
        const fromCurrency = document.getElementById('fromCurrency');
        const toCurrency = document.getElementById('toCurrency');
        const fromAmount = document.getElementById('fromAmount');
        const toAmount = document.getElementById('toAmount');
        
        const tempCurrency = fromCurrency.value;
        const tempAmount = fromAmount.value;
        
        fromCurrency.value = toCurrency.value;
        toCurrency.value = tempCurrency;
        fromAmount.value = toAmount.value;
        toAmount.value = tempAmount;
        
        this.performConversion();
    }

    swapCrypto() {
        const fromCrypto = document.getElementById('fromCrypto');
        const toCrypto = document.getElementById('toCrypto');
        const fromCryptoAmount = document.getElementById('fromCryptoAmount');
        const toCryptoAmount = document.getElementById('toCryptoAmount');
        
        const tempCrypto = fromCrypto.value;
        const tempAmount = fromCryptoAmount.value;
        
        fromCrypto.value = toCrypto.value;
        toCrypto.value = tempCrypto;
        fromCryptoAmount.value = toCryptoAmount.value;
        toCryptoAmount.value = tempAmount;
        
        this.performCryptoConversion();
    }

    async setRateAlert() {
        // Implementation for setting rate alerts
        console.log('Setting rate alert...');
    }

    async toggleFavorite() {
        // Implementation for toggling favorites
        console.log('Toggling favorite...');
    }

    async setCryptoAlert() {
        // Implementation for setting crypto alerts
        console.log('Setting crypto alert...');
    }

    async toggleCryptoFavorite() {
        // Implementation for toggling crypto favorites
        console.log('Toggling crypto favorite...');
    }

    // Cache management
    getCachedData(key) {
        const data = this.cache.get(key);
        if (data && !this.isCacheExpired(data.timestamp)) {
            return data;
        }
        return null;
    }

    cacheData(key, data) {
        this.cache.set(key, data);
        this.cleanupCache();
    }

    isCacheExpired(timestamp) {
        return Date.now() - timestamp > this.cacheTimeout;
    }

    cleanupCache() {
        const now = Date.now();
        if (now - this.lastCacheCleanup > 60000) { // Cleanup every minute
            for (const [key, data] of this.cache.entries()) {
                if (this.isCacheExpired(data.timestamp)) {
                    this.cache.delete(key);
                }
            }
            this.lastCacheCleanup = now;
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
            'NZD': 'NZ$', 'CAD': 'C$', 'AUD': 'A$', 'CHF': 'CHF'
        };
        
        const symbol = currencySymbols[currency] || currency;
        return `${symbol}${parseFloat(amount).toFixed(this.settings.decimalPlaces)}`;
    }
}

// Initialize RateRadar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RateRadar();
}); 