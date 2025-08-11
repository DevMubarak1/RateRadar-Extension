// RateRadar Popup JavaScript - Real-time API Version
class RateRadar {
    constructor() {
        this.currentTab = 'converter';
        this.exchangeRate = 0;
        this.cryptoPrice = 0;
        this.historyChart = null;
        this.isOnline = true;
        
        // API endpoints for exchange rates (multiple fallbacks) - UPDATED TO NEW FORMAT
        this.exchangeAPIs = [
            'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies',
            'https://latest.currency-api.pages.dev/v1/currencies',
            'https://api.exchangerate-api.com/v4/latest'
        ];
        
        // Crypto API endpoints
        this.cryptoAPIs = [
            'https://api.coingecko.com/api/v3/simple/price',
            'https://api.coincap.io/v2/assets'
        ];
        
        // Cache for API responses (5 minute cache)
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        this.init();
    }

    init() {
        console.log('RateRadar initializing with real-time APIs...');
        try {
            this.loadSettings().then(() => {
                this.setupEventListeners();
                this.loadCurrencies();
                this.switchTab('converter');
                this.checkConnection();
                this.applyTheme();
                console.log('RateRadar initialized successfully');
            }).catch(error => {
                console.error('Error during initialization:', error);
            });
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['settings']);
            this.settings = result.settings || this.getDefaultSettings();
            console.log('Settings loaded:', this.settings);
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            theme: 'light',
            autoRefresh: true,
            refreshInterval: 5,
            notifications: true,
            soundAlerts: false,
            smartShopping: true,
            baseCurrency: 'USD',
            decimalPlaces: 2,
            cacheDuration: 300,
            showTrends: true
        };
    }

    applyTheme() {
        const theme = this.settings.theme || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        console.log('Theme applied:', theme);
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                try {
                    const tab = e.currentTarget.dataset.tab;
                    if (tab) this.switchTab(tab);
                } catch (error) {
                    console.error('Error in tab switching:', error);
                }
            });
        });

        // Currency converter events with null checks
        this.setupCurrencyEvents();
        this.setupCryptoEvents();
        this.setupActionEvents();
        this.setupHistoryEvents();

        // Listen for theme updates from settings
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'updateTheme') {
                this.settings.theme = request.theme;
                this.applyTheme();
                sendResponse({ success: true });
            } else if (request.action === 'settingChanged') {
                this.handleSettingChange(request.setting, request.value);
                sendResponse({ success: true });
            }
        });

        // Setup auto refresh if enabled
        this.setupAutoRefresh();
    }

    handleSettingChange(setting, value) {
        this.settings[setting] = value;
        
        switch (setting) {
            case 'theme':
                this.applyTheme();
                break;
                
            case 'autoRefresh':
                if (value) {
                    this.setupAutoRefresh();
                } else {
                    this.clearAutoRefresh();
                }
                break;
                
            case 'refreshInterval':
                if (this.settings.autoRefresh) {
                    this.setupAutoRefresh();
                }
                break;
                
            case 'baseCurrency':
                // Update display with new base currency
                this.updateDisplayWithSettings();
                break;
                
            case 'decimalPlaces':
                // Update display precision
                this.updateDisplayWithSettings();
                break;
                
            case 'showTrends':
                // Update trend indicators if present
                this.updateTrendDisplay();
                break;
                
            case 'notifications':
                // Handle notification settings
                this.updateNotificationSettings();
                break;
                
            case 'soundAlerts':
                // Handle sound alert settings
                this.updateSoundSettings();
                break;
                
            case 'smartShopping':
                // Smart shopping is handled by content script
                break;
                
            case 'cacheDuration':
                // Update cache timeout
                this.cacheTimeout = value * 1000;
                break;
                
            default:
                console.log('Unknown setting change:', setting, value);
        }
    }

    setupAutoRefresh() {
        this.clearAutoRefresh();
        
        if (this.settings.autoRefresh) {
            const interval = this.settings.refreshInterval * 60 * 1000; // Convert minutes to milliseconds
            this.autoRefreshInterval = setInterval(() => {
                this.refreshRates();
            }, interval);
            
            console.log(`Auto refresh set to ${this.settings.refreshInterval} minutes`);
        }
    }

    clearAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    async refreshRates() {
        console.log('Auto refreshing rates...');
        
        if (this.currentTab === 'converter') {
            await this.convertCurrency();
        } else if (this.currentTab === 'crypto') {
            await this.convertCrypto();
        }
    }

    updateDisplayWithSettings() {
        // Update decimal places in displays
        const decimalPlaces = this.settings.decimalPlaces || 2;
        
        // Update exchange rate display
        const exchangeRateElement = document.getElementById('exchangeRate');
        if (exchangeRateElement && this.exchangeRate) {
            const fromCurrency = document.getElementById('fromCurrency')?.value || 'USD';
            const toCurrency = document.getElementById('toCurrency')?.value || 'EUR';
            exchangeRateElement.textContent = `1 ${fromCurrency} = ${this.exchangeRate.toFixed(decimalPlaces)} ${toCurrency}`;
        }
        
        // Update crypto price display
        const cryptoPriceElement = document.getElementById('cryptoPrice');
        if (cryptoPriceElement && this.cryptoPrice) {
            cryptoPriceElement.textContent = `$${this.cryptoPrice.toFixed(decimalPlaces)}`;
        }
    }

    updateTrendDisplay() {
        // Disable trend indicators to prevent issues
        this.removeTrendIndicators();
    }

    addTrendIndicators() {
        // Disable trend indicators to prevent issues
        return;
    }

    removeTrendIndicators() {
        const trendIndicators = document.querySelectorAll('.trend-indicator');
        trendIndicators.forEach(indicator => indicator.remove());
    }

    updateNotificationSettings() {
        if (this.settings.notifications) {
            console.log('Notifications enabled');
        } else {
            console.log('Notifications disabled');
        }
    }

    updateSoundSettings() {
        if (this.settings.soundAlerts) {
            console.log('Sound alerts enabled');
        } else {
            console.log('Sound alerts disabled');
        }
    }

    setupCurrencyEvents() {
        const elements = {
            fromAmount: document.getElementById('fromAmount'),
            fromCurrency: document.getElementById('fromCurrency'),
            toCurrency: document.getElementById('toCurrency'),
            swapBtn: document.getElementById('swapBtn')
        };
        
        if (elements.fromAmount) {
            elements.fromAmount.addEventListener('input', () => {
                try { this.convertCurrency(); } catch (e) { console.error('Error in currency conversion:', e); }
            });
        }
        if (elements.fromCurrency) {
            elements.fromCurrency.addEventListener('change', () => {
                try { this.convertCurrency(); } catch (e) { console.error('Error in currency conversion:', e); }
            });
        }
        if (elements.toCurrency) {
            elements.toCurrency.addEventListener('change', () => {
                try { this.convertCurrency(); } catch (e) { console.error('Error in currency conversion:', e); }
            });
        }
        if (elements.swapBtn) {
            elements.swapBtn.addEventListener('click', () => {
                try { this.swapCurrencies(); } catch (e) { console.error('Error in currency swap:', e); }
            });
        }
    }

    setupCryptoEvents() {
        const elements = {
            fromCryptoAmount: document.getElementById('fromCryptoAmount'),
            fromCrypto: document.getElementById('fromCrypto'),
            toCrypto: document.getElementById('toCrypto'),
            swapCryptoBtn: document.getElementById('swapCryptoBtn')
        };
        
        if (elements.fromCryptoAmount) {
            elements.fromCryptoAmount.addEventListener('input', () => {
                try { this.convertCrypto(); } catch (e) { console.error('Error in crypto conversion:', e); }
            });
        }
        if (elements.fromCrypto) {
            elements.fromCrypto.addEventListener('change', () => {
                try { this.convertCrypto(); } catch (e) { console.error('Error in crypto conversion:', e); }
            });
        }
        if (elements.toCrypto) {
            elements.toCrypto.addEventListener('change', () => {
                try { this.convertCrypto(); } catch (e) { console.error('Error in crypto conversion:', e); }
            });
        }
        if (elements.swapCryptoBtn) {
            elements.swapCryptoBtn.addEventListener('click', () => {
                try { this.swapCrypto(); } catch (e) { console.error('Error in crypto swap:', e); }
            });
        }
    }

    setupActionEvents() {
        const elements = {
            setAlertBtn: document.getElementById('setAlertBtn'),
            favoriteBtn: document.getElementById('favoriteBtn'),
            settingsBtn: document.getElementById('settingsBtn')
        };
        
        if (elements.setAlertBtn) {
            elements.setAlertBtn.addEventListener('click', () => {
                try { this.setAlert(); } catch (e) { console.error('Error setting alert:', e); }
            });
        }
        if (elements.favoriteBtn) {
            elements.favoriteBtn.addEventListener('click', () => {
                try { this.toggleFavorite(); } catch (e) { console.error('Error toggling favorite:', e); }
            });
        }
        if (elements.settingsBtn) {
            elements.settingsBtn.addEventListener('click', () => {
                try { this.openSettings(); } catch (e) { console.error('Error opening settings:', e); }
            });
        }
    }

    setupHistoryEvents() {
        document.querySelectorAll('.period-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                try {
                    const period = e.currentTarget.dataset.period;
                    if (period) this.loadHistory(period);
                } catch (error) {
                    console.error('Error loading history:', error);
                }
            });
        });
    }

    switchTab(tabName) {
        try {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // Remove active class from all tab buttons
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });

            // Show selected tab content
            const selectedTab = document.getElementById(`${tabName}-tab`);
            if (selectedTab) {
                selectedTab.classList.add('active');
            }
            
            // Add active class to selected tab button
            const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
            if (selectedButton) {
                selectedButton.classList.add('active');
            }

            this.currentTab = tabName;

            // Load data for the selected tab
            if (tabName === 'converter') {
                this.convertCurrency();
            } else if (tabName === 'crypto') {
                this.convertCrypto();
            } else if (tabName === 'history') {
                this.loadHistory(7);
            }
        } catch (error) {
            console.error('Error switching tabs:', error);
        }
    }

    async convertCurrency() {
        try {
            const elements = {
                fromAmount: document.getElementById('fromAmount'),
                toAmount: document.getElementById('toAmount'),
                fromCurrency: document.getElementById('fromCurrency'),
                toCurrency: document.getElementById('toCurrency'),
                exchangeRate: document.getElementById('exchangeRate'),
                lastUpdated: document.getElementById('lastUpdated')
            };
            
            // Check if all required elements exist
            if (!elements.fromAmount || !elements.toAmount || !elements.fromCurrency || 
                !elements.toCurrency || !elements.exchangeRate || !elements.lastUpdated) {
                console.warn('Some currency converter elements not found');
                return;
            }
            
            const fromAmount = parseFloat(elements.fromAmount.value) || 0;
            const fromCurrency = elements.fromCurrency.value.toLowerCase();
            const toCurrency = elements.toCurrency.value.toLowerCase();

            if (fromAmount === 0) {
                elements.toAmount.value = '';
                elements.exchangeRate.textContent = `1 ${fromCurrency.toUpperCase()} = 0.00 ${toCurrency.toUpperCase()}`;
                return;
            }

            this.showLoading(true);

            // Get exchange rate from API
            const rate = await this.getExchangeRate(fromCurrency, toCurrency);
            
            if (rate !== null) {
                const convertedAmount = fromAmount * rate;
                elements.toAmount.value = convertedAmount.toFixed(2);
                elements.exchangeRate.textContent = `1 ${fromCurrency.toUpperCase()} = ${rate.toFixed(4)} ${toCurrency.toUpperCase()}`;
                elements.lastUpdated.textContent = new Date().toLocaleTimeString();
                this.exchangeRate = rate;
                this.updateConnectionStatus(true);
            } else {
                // API failed, show error
                elements.toAmount.value = '0.00';
                elements.exchangeRate.textContent = `1 ${fromCurrency.toUpperCase()} = 0.00 ${toCurrency.toUpperCase()}`;
                elements.lastUpdated.textContent = 'Rate unavailable';
                this.exchangeRate = 0;
                this.updateConnectionStatus(false);
                this.showError('Unable to get exchange rate');
            }
        } catch (error) {
            console.error('Error in convertCurrency:', error);
            this.showError('Conversion error');
            this.updateConnectionStatus(false);
        } finally {
            this.showLoading(false);
        }
    }

    async getExchangeRate(fromCurrency, toCurrency) {
        const cacheKey = `${fromCurrency}/${toCurrency}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('Using cached rate for', cacheKey);
                return cached.rate;
            }
        }

        // Try each API endpoint
        for (let i = 0; i < this.exchangeAPIs.length; i++) {
            try {
                const rate = await this.fetchFromExchangeAPI(this.exchangeAPIs[i], fromCurrency, toCurrency);
                if (rate !== null) {
                    // Cache the result
                    this.cache.set(cacheKey, { rate, timestamp: Date.now() });
                    console.log(`Successfully got rate from API ${i + 1}:`, rate);
                    return rate;
                }
            } catch (error) {
                console.warn(`API ${i + 1} failed:`, error.message);
                continue;
            }
        }

        console.error('All exchange rate APIs failed');
        return null;
    }

    async fetchFromExchangeAPI(apiUrl, fromCurrency, toCurrency) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            let response;
            
            if (apiUrl.includes('fawazahmed0') || apiUrl.includes('currency-api')) {
                // Use the new fawazahmed0 API format
                const url = `${apiUrl}/${fromCurrency}.json`;
                response = await fetch(url, { 
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'RateRadar/1.0'
                    }
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                // New format: { "date": "2024-01-01", "usd": { "eur": 0.85, "gbp": 0.73 } }
                if (data[fromCurrency] && data[fromCurrency][toCurrency]) {
                    return data[fromCurrency][toCurrency];
                }
            } else if (apiUrl.includes('exchangerate-api')) {
                // Use ExchangeRate-API format
                const url = `${apiUrl}/${fromCurrency.toUpperCase()}`;
                response = await fetch(url, { 
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'RateRadar/1.0'
                    }
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                if (data.rates && data.rates[toCurrency.toUpperCase()]) {
                    return data.rates[toCurrency.toUpperCase()];
                }
            }
            
            throw new Error('Rate not found in response');
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw new Error(`API returned unsuccessful response: ${error.message}`);
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async convertCrypto() {
        try {
            const elements = {
                fromCryptoAmount: document.getElementById('fromCryptoAmount'),
                toCryptoAmount: document.getElementById('toCryptoAmount'),
                fromCrypto: document.getElementById('fromCrypto'),
                toCrypto: document.getElementById('toCrypto'),
                cryptoPrice: document.getElementById('cryptoPrice'),
                cryptoChange: document.getElementById('cryptoChange')
            };
            
            // Check if all required elements exist
            if (!elements.fromCryptoAmount || !elements.toCryptoAmount || !elements.fromCrypto || 
                !elements.toCrypto || !elements.cryptoPrice || !elements.cryptoChange) {
                console.warn('Some crypto converter elements not found');
                return;
            }
            
            const fromAmount = parseFloat(elements.fromCryptoAmount.value) || 0;
            const fromCrypto = elements.fromCrypto.value;
            const toCrypto = elements.toCrypto.value;

            if (fromAmount === 0) {
                elements.toCryptoAmount.value = '';
                return;
            }

            this.showLoading(true);

            // Get crypto rate
            const cryptoData = await this.getCryptoRate(fromCrypto, toCrypto);
            
            if (cryptoData) {
                const convertedAmount = fromAmount * cryptoData.rate;
                elements.toCryptoAmount.value = convertedAmount.toFixed(6);
                elements.cryptoPrice.textContent = `$${cryptoData.price.toFixed(2)}`;
                elements.cryptoChange.textContent = `${cryptoData.change >= 0 ? '+' : ''}${cryptoData.change.toFixed(2)}%`;
                elements.cryptoChange.className = `change-text ${cryptoData.change >= 0 ? 'positive' : 'negative'}`;
                
                this.cryptoPrice = cryptoData.price;
                this.updateConnectionStatus(true);
            } else {
                // Crypto API failed
                elements.toCryptoAmount.value = '0.00';
                elements.cryptoPrice.textContent = '$0.00';
                elements.cryptoChange.textContent = '+0.00%';
                elements.cryptoChange.className = 'change-text positive';
                this.updateConnectionStatus(false);
                this.showError('Unable to get crypto rates');
            }
        } catch (error) {
            console.error('Error in convertCrypto:', error);
            this.showError('Crypto conversion error');
            this.updateConnectionStatus(false);
        } finally {
            this.showLoading(false);
        }
    }

    async getCryptoRate(fromCrypto, toCrypto) {
        const cacheKey = `crypto_${fromCrypto}/${toCrypto}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            // Map crypto names to CoinGecko IDs
            const cryptoMap = {
                'bitcoin': 'bitcoin',
                'ethereum': 'ethereum', 
                'cardano': 'cardano',
                'solana': 'solana'
            };
            
            const cryptoId = cryptoMap[fromCrypto] || fromCrypto;
            const targetCurrency = toCrypto === 'usd' ? 'usd' : cryptoMap[toCrypto] || toCrypto;
            
            let url;
            if (targetCurrency === 'usd') {
                url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd&include_24hr_change=true`;
            } else {
                url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId},${targetCurrency}&vs_currencies=usd`;
            }
            
            const response = await fetch(url, { 
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'RateRadar/1.0'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (data[cryptoId]) {
                let rate, price, change;
                
                if (targetCurrency === 'usd') {
                    rate = data[cryptoId].usd;
                    price = data[cryptoId].usd;
                    change = data[cryptoId].usd_24h_change || 0;
                } else if (data[targetCurrency]) {
                    // Convert crypto to crypto
                    const fromPrice = data[cryptoId].usd;
                    const toPrice = data[targetCurrency].usd;
                    rate = fromPrice / toPrice;
                    price = fromPrice;
                    change = data[cryptoId].usd_24h_change || 0;
                } else {
                    throw new Error('Invalid crypto pair');
                }
                
                const result = { rate, price, change };
                
                // Cache the result
                this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
                
                return result;
            }
            
            throw new Error('No data received');
            
        } catch (error) {
            console.error('Crypto API error:', error);
            return null;
        }
    }

    swapCurrencies() {
        try {
            const elements = {
                fromCurrency: document.getElementById('fromCurrency'),
                toCurrency: document.getElementById('toCurrency'),
                fromAmount: document.getElementById('fromAmount'),
                toAmount: document.getElementById('toAmount')
            };

            if (!elements.fromCurrency || !elements.toCurrency || !elements.fromAmount || !elements.toAmount) {
                console.warn('Swap elements not found');
                return;
            }

            const tempCurrency = elements.fromCurrency.value;
            const tempAmount = elements.fromAmount.value;

            elements.fromCurrency.value = elements.toCurrency.value;
            elements.toCurrency.value = tempCurrency;
            elements.fromAmount.value = elements.toAmount.value;
            elements.toAmount.value = tempAmount;

            this.convertCurrency();
        } catch (error) {
            console.error('Error swapping currencies:', error);
        }
    }

    swapCrypto() {
        try {
            const elements = {
                fromCrypto: document.getElementById('fromCrypto'),
                toCrypto: document.getElementById('toCrypto'),
                fromAmount: document.getElementById('fromCryptoAmount'),
                toAmount: document.getElementById('toCryptoAmount')
            };

            if (!elements.fromCrypto || !elements.toCrypto || !elements.fromAmount || !elements.toAmount) {
                console.warn('Crypto swap elements not found');
                return;
            }

            const tempCrypto = elements.fromCrypto.value;
            const tempAmount = elements.fromAmount.value;

            elements.fromCrypto.value = elements.toCrypto.value;
            elements.toCrypto.value = tempCrypto;
            elements.fromAmount.value = elements.toAmount.value;
            elements.toAmount.value = tempAmount;

            this.convertCrypto();
        } catch (error) {
            console.error('Error swapping crypto:', error);
        }
    }

    async loadHistory(period = 7) {
        try {
            this.showLoading(true);
            
            // Update active period button
            document.querySelectorAll('.period-button').forEach(btn => {
                btn.classList.remove('active');
            });
            const activeButton = document.querySelector(`[data-period="${period}"]`);
            if (activeButton) {
                activeButton.classList.add('active');
            }

            // Get current currency pair
            const fromCurrencyEl = document.getElementById('fromCurrency');
            const toCurrencyEl = document.getElementById('toCurrency');
            
            if (!fromCurrencyEl || !toCurrencyEl) {
                console.warn('Currency elements not found for history');
                return;
            }
            
            const fromCurrency = fromCurrencyEl.value.toLowerCase();
            const toCurrency = toCurrencyEl.value.toLowerCase();

            // Get historical data from API
            const historyData = await this.getHistoricalData(fromCurrency, toCurrency, period);
            this.renderHistoryChart(historyData, period);
            this.updateConnectionStatus(true);
            
        } catch (error) {
            console.error('Error in loadHistory:', error);
            this.showError('Failed to load history');
            this.renderHistoryChart({ labels: [], values: [] }, period);
            this.updateConnectionStatus(false);
        } finally {
            this.showLoading(false);
        }
    }

    async getHistoricalData(fromCurrency, toCurrency, period) {
        const cacheKey = `history_${fromCurrency}/${toCurrency}/${period}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout * 6) { // Cache for 30 minutes
                return cached.data;
            }
        }

        try {
            // For now, generate sample data based on current rate
            const currentRate = await this.getExchangeRate(fromCurrency, toCurrency);
            const historyData = this.generateSampleHistoryData(period, fromCurrency, toCurrency, currentRate);
            
            // Cache the result
            this.cache.set(cacheKey, { data: historyData, timestamp: Date.now() });
            
            return historyData;
        } catch (error) {
            console.error('Error getting historical data:', error);
            return this.generateSampleHistoryData(period, fromCurrency, toCurrency, 1.0);
        }
    }

    generateSampleHistoryData(period, fromCurrency, toCurrency, baseRate = 1.0) {
        const labels = [];
        const values = [];
        
        for (let i = period; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString());
            
            // Generate realistic-looking data with some variation around the base rate
            const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
            values.push(baseRate * (1 + variation));
        }
        
        return { labels, values };
    }

    renderHistoryChart(data, period) {
        try {
            const canvas = document.getElementById('historyChart');
            if (!canvas) {
                console.warn('History chart canvas not found');
                return;
            }
            
            // Ensure canvas has proper dimensions
            canvas.width = canvas.offsetWidth || 300;
            canvas.height = canvas.offsetHeight || 200;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.warn('Could not get canvas context');
                return;
            }
            
            // Simple chart rendering
            this.renderSimpleChart(ctx, data, period);
        } catch (error) {
            console.error('Error rendering chart:', error);
        }
    }

    renderSimpleChart(ctx, data, period) {
        try {
            const canvas = ctx.canvas;
            const width = canvas.width || 300;
            const height = canvas.height || 200;
            
            // Clear canvas
            ctx.clearRect(0, 0, width, height);
            
            if (!data.values || data.values.length === 0) {
                // Show "No data" message
                ctx.fillStyle = 'rgba(102, 126, 234, 0.6)';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('No data available', width / 2, height / 2);
                return;
            }
            
            // Draw simple line chart
            const padding = 20;
            const chartWidth = width - 2 * padding;
            const chartHeight = height - 2 * padding;
            
            const minValue = Math.min(...data.values);
            const maxValue = Math.max(...data.values);
            const range = maxValue - minValue || 1;
            
            // Draw grid lines
            ctx.strokeStyle = 'rgba(102, 126, 234, 0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = padding + (i * chartHeight / 4);
                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(width - padding, y);
                ctx.stroke();
            }
            
            // Draw line chart
            ctx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            data.values.forEach((value, index) => {
                const x = padding + (index * chartWidth / (data.values.length - 1));
                const y = height - padding - ((value - minValue) * chartHeight / range);
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // Draw points
            ctx.fillStyle = 'rgba(102, 126, 234, 0.9)';
            data.values.forEach((value, index) => {
                const x = padding + (index * chartWidth / (data.values.length - 1));
                const y = height - padding - ((value - minValue) * chartHeight / range);
                
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            });
        } catch (error) {
            console.error('Error in renderSimpleChart:', error);
        }
    }

    loadCurrencies() {
        try {
            // Comprehensive currency list
            const currencies = [
                'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 
                'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RUB', 'TRY', 'BRL', 
                'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'VEF', 'NGN', 'ZAR', 'EGP', 
                'MAD', 'TND', 'DZD', 'LYD', 'KES', 'UGX', 'TZS', 'ETB', 'GHS', 'XOF', 
                'XAF', 'INR', 'PKR', 'BDT', 'LKR', 'NPR', 'THB', 'VND', 'IDR', 'MYR', 
                'SGD', 'HKD', 'TWD', 'KRW', 'PHP', 'ILS', 'AED', 'SAR', 'QAR', 'KWD', 
                'BHD', 'OMR', 'JOD', 'LBP', 'IRR', 'IQD', 'AFN', 'UZS', 'KZT', 'GEL', 
                'ARM', 'AZN', 'BYN', 'MDL', 'UAH', 'KGS', 'TJS', 'TMT', 'MNT', 'LAK', 
                'KHR', 'MMK', 'BND', 'MVR', 'BTN', 'MOP', 'FJD', 'WST', 'TOP', 'VUV', 
                'SBD', 'PGK', 'NZD'
            ];
            
            const fromSelect = document.getElementById('fromCurrency');
            const toSelect = document.getElementById('toCurrency');
            
            if (!fromSelect || !toSelect) {
                console.warn('Currency select elements not found');
                return;
            }
            
            // Clear existing options
            fromSelect.innerHTML = '';
            toSelect.innerHTML = '';
            
            currencies.forEach(currency => {
                fromSelect.add(new Option(currency, currency));
                toSelect.add(new Option(currency, currency));
            });
        } catch (error) {
            console.error('Error loading currencies:', error);
        }
    }

    setAlert() {
        try {
            const fromCurrencyEl = document.getElementById('fromCurrency');
            const toCurrencyEl = document.getElementById('toCurrency');
            
            if (!fromCurrencyEl || !toCurrencyEl) {
                console.warn('Currency elements not found for alert');
                return;
            }
            
            const fromCurrency = fromCurrencyEl.value;
            const toCurrency = toCurrencyEl.value;
            const currentRate = this.exchangeRate;

            if (!currentRate) {
                this.showError('Convert a currency first');
                return;
            }

            const alert = {
                id: Date.now(),
                fromCurrency,
                toCurrency,
                targetRate: currentRate,
                alertType: 'below',
                createdAt: new Date().toISOString(),
                active: true
            };

            // Save to Chrome storage
            chrome.storage.sync.get(['alerts'], (result) => {
                const alerts = result.alerts || [];
                alerts.push(alert);
                chrome.storage.sync.set({ alerts }, () => {
                    this.showSuccess('Alert set!');
                });
            });
        } catch (error) {
            console.error('Error setting alert:', error);
        }
    }

    toggleFavorite() {
        try {
            const fromCurrencyEl = document.getElementById('fromCurrency');
            const toCurrencyEl = document.getElementById('toCurrency');
            
            if (!fromCurrencyEl || !toCurrencyEl) {
                console.warn('Currency elements not found for favorite');
                return;
            }
            
            const fromCurrency = fromCurrencyEl.value;
            const toCurrency = toCurrencyEl.value;
            const pair = `${fromCurrency}/${toCurrency}`;

            chrome.storage.sync.get(['favorites'], (result) => {
                const favorites = result.favorites || [];
                const index = favorites.indexOf(pair);
                
                if (index > -1) {
                    favorites.splice(index, 1);
                    this.showSuccess('Removed from favorites');
                } else {
                    favorites.push(pair);
                    this.showSuccess('Added to favorites');
                }
                
                chrome.storage.sync.set({ favorites });
            });
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    }

    openSettings() {
        try {
            chrome.runtime.openOptionsPage();
        } catch (error) {
            console.error('Error opening settings:', error);
        }
    }

    async checkConnection() {
        try {
            // Test connection with our primary API
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', {
                method: 'HEAD',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            this.updateConnectionStatus(response.ok);
        } catch (error) {
            console.warn('Connection check failed:', error);
            this.updateConnectionStatus(false);
        }
    }

    updateConnectionStatus(isOnline) {
        try {
            this.isOnline = isOnline;
            const statusIndicator = document.getElementById('connectionStatus');
            if (!statusIndicator) {
                console.warn('Connection status indicator not found');
                return;
            }
            
            const statusText = statusIndicator.querySelector('.status-text');
            if (!statusText) {
                console.warn('Status text element not found');
                return;
            }
            
            if (isOnline) {
                statusIndicator.className = 'status-indicator online';
                statusText.textContent = 'Online';
            } else {
                statusIndicator.className = 'status-indicator offline';
                statusText.textContent = 'Offline';
            }
        } catch (error) {
            console.error('Error updating connection status:', error);
        }
    }

    showLoading(show) {
        try {
            const overlay = document.getElementById('loadingOverlay');
            if (!overlay) {
                console.warn('Loading overlay not found');
                return;
            }
            
            if (show) {
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error showing loading:', error);
        }
    }

    showError(message) {
        try {
            console.warn('Showing error:', message);
            const notification = document.createElement('div');
            notification.className = 'notification error';
            notification.innerHTML = `
                <div class="notification-content">
                    <svg class="notification-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="notification-text">${message}</span>
                </div>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 3000);
        } catch (error) {
            console.error('Error showing error notification:', error);
        }
    }

    showSuccess(message) {
        try {
            console.log('Showing success:', message);
            const notification = document.createElement('div');
            notification.className = 'notification success';
            notification.innerHTML = `
                <div class="notification-content">
                    <svg class="notification-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span class="notification-text">${message}</span>
                </div>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 3000);
        } catch (error) {
            console.error('Error showing success notification:', error);
        }
    }
}

// Initialize RateRadar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('DOM loaded, initializing RateRadar with real-time APIs...');
        new RateRadar();
    } catch (error) {
        console.error('Fatal error initializing RateRadar:', error);
    }
}); 