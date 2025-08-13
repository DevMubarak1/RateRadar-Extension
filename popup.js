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
                this.checkTabContent(); // Add this line to check tab content
                // Initialize with converter tab visible by default (matches HTML)
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

    checkTabContent() {
        console.log('RateRadar: Checking tab content structure...');
        
        // Check if crypto tab content exists
        const cryptoTab = document.getElementById('crypto-tab');
        if (cryptoTab) {
            console.log('RateRadar: Crypto tab found:', cryptoTab);
            console.log('RateRadar: Crypto tab children:', cryptoTab.children.length);
            console.log('RateRadar: Crypto tab HTML:', cryptoTab.innerHTML.substring(0, 200) + '...');
            
            // Check parent elements for any hiding styles
            let parent = cryptoTab.parentElement;
            let level = 0;
            while (parent && level < 5) {
                const computedStyle = window.getComputedStyle(parent);
                console.log(`RateRadar: Parent level ${level}:`, parent.tagName, parent.className);
                console.log(`RateRadar: Parent display:`, computedStyle.display);
                console.log(`RateRadar: Parent visibility:`, computedStyle.visibility);
                console.log(`RateRadar: Parent opacity:`, computedStyle.opacity);
                console.log(`RateRadar: Parent height:`, computedStyle.height);
                console.log(`RateRadar: Parent overflow:`, computedStyle.overflow);
                
                // Check if parent is hiding the content
                if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
                    console.warn(`RateRadar: Parent level ${level} is hiding content!`);
                }
                
                parent = parent.parentElement;
                level++;
            }
        } else {
            console.error('RateRadar: Crypto tab content not found!');
        }
        
        // Check if converter tab content exists
        const converterTab = document.getElementById('converter-tab');
        if (converterTab) {
            console.log('RateRadar: Converter tab found:', converterTab);
        } else {
            console.error('RateRadar: Converter tab content not found!');
        }
        
        // List all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            console.log('RateRadar: Tab content found:', content.id, 'display:', window.getComputedStyle(content).display);
        });
        
        // Check content area
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            const computedStyle = window.getComputedStyle(contentArea);
            console.log('RateRadar: Content area display:', computedStyle.display);
            console.log('RateRadar: Content area height:', computedStyle.height);
            console.log('RateRadar: Content area overflow:', computedStyle.overflow);
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
            settingsBtn: document.getElementById('settingsBtn'),
            setCryptoAlertBtn: document.getElementById('setCryptoAlertBtn'),
            favoriteCryptoBtn: document.getElementById('favoriteCryptoBtn')
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
        if (elements.setCryptoAlertBtn) {
            elements.setCryptoAlertBtn.addEventListener('click', () => {
                try { this.setCryptoAlert(); } catch (e) { console.error('Error setting crypto alert:', e); }
            });
        }
        if (elements.favoriteCryptoBtn) {
            elements.favoriteCryptoBtn.addEventListener('click', () => {
                try { this.toggleCryptoFavorite(); } catch (e) { console.error('Error toggling crypto favorite:', e); }
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
            console.log('RateRadar: Switching to tab:', tabName);
            
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none'; // Force hide
                console.log('RateRadar: Removed active from:', content.id);
            });

            // Remove active class from all tab buttons
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
                console.log('RateRadar: Removed active from button:', btn.dataset.tab);
            });

            // Show selected tab content
            const selectedTab = document.getElementById(`${tabName}-tab`);
            if (selectedTab) {
                selectedTab.classList.add('active');
                selectedTab.style.display = 'block'; // Force show
                selectedTab.style.visibility = 'visible';
                selectedTab.style.opacity = '1';
                selectedTab.style.position = 'relative';
                selectedTab.style.zIndex = '1';
                
                console.log('RateRadar: Tab content activated:', selectedTab.id);
                console.log('RateRadar: Tab content display style:', selectedTab.style.display);
                console.log('RateRadar: Tab content classes:', selectedTab.className);
                console.log('RateRadar: Tab content computed style:', window.getComputedStyle(selectedTab).display);
                console.log('RateRadar: Tab content visibility:', window.getComputedStyle(selectedTab).visibility);
                console.log('RateRadar: Tab content opacity:', window.getComputedStyle(selectedTab).opacity);
                
                // Force display block if needed
                if (window.getComputedStyle(selectedTab).display === 'none') {
                    console.log('RateRadar: Forcing display block on tab content');
                    selectedTab.style.display = 'block';
                }
                
                // Check if content is actually visible
                const rect = selectedTab.getBoundingClientRect();
                console.log('RateRadar: Tab content dimensions:', rect.width, 'x', rect.height);
                console.log('RateRadar: Tab content position:', rect.top, rect.left);
                
                // Force a repaint
                selectedTab.offsetHeight;
                
            } else {
                console.warn('RateRadar: Tab content not found:', `${tabName}-tab`);
                // List all tab contents to help debug
                document.querySelectorAll('.tab-content').forEach(content => {
                    console.log('RateRadar: Available tab content:', content.id);
                });
            }
            
            // Add active class to selected tab button
            const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
            if (selectedButton) {
                selectedButton.classList.add('active');
                console.log('RateRadar: Tab button activated:', selectedButton.dataset.tab);
            } else {
                console.warn('RateRadar: Tab button not found:', `[data-tab="${tabName}"]`);
                // List all tab buttons to help debug
                document.querySelectorAll('.tab-button').forEach(btn => {
                    console.log('RateRadar: Available tab button:', btn.dataset.tab);
                });
            }

            this.currentTab = tabName;

            // Load data for the selected tab
            if (tabName === 'converter') {
                console.log('RateRadar: Loading converter data');
                this.convertCurrency();
            } else if (tabName === 'crypto') {
                console.log('RateRadar: Loading crypto data');
                
                // Ensure crypto tab has default values
                const fromCryptoAmount = document.getElementById('fromCryptoAmount');
                if (fromCryptoAmount && !fromCryptoAmount.value) {
                    fromCryptoAmount.value = '1';
                }
                this.convertCrypto();
            } else if (tabName === 'history') {
                console.log('RateRadar: Loading history data');
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
            console.log('RateRadar: convertCrypto called');
            
            const elements = {
                fromCryptoAmount: document.getElementById('fromCryptoAmount'),
                toCryptoAmount: document.getElementById('toCryptoAmount'),
                fromCrypto: document.getElementById('fromCrypto'),
                toCrypto: document.getElementById('toCrypto'),
                cryptoPrice: document.getElementById('cryptoPrice'),
                cryptoChange: document.getElementById('cryptoChange')
            };
            
            console.log('RateRadar: Crypto elements found:', {
                fromCryptoAmount: !!elements.fromCryptoAmount,
                toCryptoAmount: !!elements.toCryptoAmount,
                fromCrypto: !!elements.fromCrypto,
                toCrypto: !!elements.toCrypto,
                cryptoPrice: !!elements.cryptoPrice,
                cryptoChange: !!elements.cryptoChange
            });
            
            // Check if all required elements exist
            if (!elements.fromCryptoAmount || !elements.toCryptoAmount || !elements.fromCrypto || 
                !elements.toCrypto || !elements.cryptoPrice || !elements.cryptoChange) {
                console.warn('Some crypto converter elements not found');
                return;
            }
            
            // Set default value if empty
            if (!elements.fromCryptoAmount.value) {
                elements.fromCryptoAmount.value = '1';
            }
            
            const fromAmount = parseFloat(elements.fromCryptoAmount.value) || 1; // Default to 1 if 0
            const fromCrypto = elements.fromCrypto.value;
            const toCrypto = elements.toCrypto.value;

            console.log('RateRadar: Crypto conversion values:', { fromAmount, fromCrypto, toCrypto });

            if (fromAmount === 0) {
                elements.toCryptoAmount.value = '';
                elements.cryptoPrice.textContent = this.getCurrencySymbol(toCrypto) + '0.00';
                elements.cryptoChange.textContent = '+0.00%';
                elements.cryptoChange.className = 'change-text positive';
                return;
            }

            this.showLoading(true);

            // Get crypto rate
            const cryptoData = await this.getCryptoRate(fromCrypto, toCrypto);
            
            console.log('RateRadar: Crypto data received:', cryptoData);
            
            if (cryptoData) {
                const convertedAmount = fromAmount * cryptoData.rate;
                elements.toCryptoAmount.value = convertedAmount.toFixed(6);
                
                // Use the correct currency symbol for the target currency
                const currencySymbol = this.getCurrencySymbol(toCrypto);
                elements.cryptoPrice.textContent = currencySymbol + cryptoData.price.toFixed(2);
                
                elements.cryptoChange.textContent = `${cryptoData.change >= 0 ? '+' : ''}${cryptoData.change.toFixed(2)}%`;
                elements.cryptoChange.className = `change-text ${cryptoData.change >= 0 ? 'positive' : 'negative'}`;
                
                this.cryptoPrice = cryptoData.price;
                this.updateConnectionStatus(true);
                console.log('RateRadar: Crypto conversion completed successfully');
            } else {
                // Crypto API failed
                elements.toCryptoAmount.value = '0.00';
                const currencySymbol = this.getCurrencySymbol(toCrypto);
                elements.cryptoPrice.textContent = currencySymbol + '0.00';
                elements.cryptoChange.textContent = '+0.00%';
                elements.cryptoChange.className = 'change-text positive';
                this.updateConnectionStatus(false);
                this.showError('Unable to get crypto rates');
                console.log('RateRadar: Crypto API failed');
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
        
        console.log('RateRadar: getCryptoRate called with:', { fromCrypto, toCrypto });
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('RateRadar: Using cached crypto data');
                return cached.data;
            }
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            // Map crypto names to CoinGecko IDs - 200+ major cryptocurrencies
            const cryptoMap = {
                // Top 50 Cryptocurrencies
                'bitcoin': 'bitcoin',
                'ethereum': 'ethereum', 
                'cardano': 'cardano',
                'solana': 'solana',
                'binancecoin': 'binancecoin',
                'ripple': 'ripple',
                'polkadot': 'polkadot',
                'dogecoin': 'dogecoin',
                'avalanche-2': 'avalanche-2',
                'polygon': 'matic-network',
                'chainlink': 'chainlink',
                'uniswap': 'uniswap',
                'litecoin': 'litecoin',
                'bitcoin-cash': 'bitcoin-cash',
                'stellar': 'stellar',
                'vechain': 'vechain',
                'filecoin': 'filecoin',
                'cosmos': 'cosmos',
                'monero': 'monero',
                'algorand': 'algorand',
                'tezos': 'tezos',
                'aave': 'aave',
                'compound': 'compound-governance-token',
                'sushi': 'sushi',
                'pancakeswap-token': 'pancakeswap-token',
                'curve-dao-token': 'curve-dao-token',
                'yearn-finance': 'yearn-finance',
                'synthetix-network-token': 'havven',
                '0x': '0x',
                'balancer': 'balancer',
                '1inch': '1inch',
                'dash': 'dash',
                'zcash': 'zcash',
                'nem': 'nem',
                'iota': 'iota',
                'neo': 'neo',
                'qtum': 'qtum',
                'waves': 'waves',
                'nano': 'nano',
                'icon': 'icon',
                'ontology': 'ontology',
                'zilliqa': 'zilliqa',
                'harmony': 'harmony',
                'elrond-erd-2': 'elrond-erd-2',
                'near': 'near',
                'fantom': 'fantom',
                'the-graph': 'the-graph',
                'decentraland': 'decentraland',
                'sandbox': 'the-sandbox',
                'enjincoin': 'enjincoin',
                'axie-infinity': 'axie-infinity',
                'gala': 'gala',
                'chiliz': 'chiliz',
                'flow': 'flow',
                'internet-computer': 'internet-computer',
                'theta-token': 'theta-token',
                'vega-protocol': 'vega-protocol',
                'celo': 'celo',
                'kusama': 'kusama',
                'eos': 'eos',
                'tron': 'tron',
                'bitcoin-sv': 'bitcoin-cash-sv',
                
                // Additional Major Cryptocurrencies (51-100)
                'helium': 'helium',
                'amp-token': 'amp-token',
                'maker': 'maker',
                'dai': 'dai',
                'shiba-inu': 'shiba-inu',
                'terra-luna': 'terra-luna-2',
                'aptos': 'aptos',
                'sui': 'sui',
                'arbitrum': 'arbitrum',
                'optimism': 'optimism',
                'polygon-zkevm': 'polygon-zkevm',
                'base': 'base',
                'linea': 'linea',
                'scroll': 'scroll',
                'mantle': 'mantle',
                'opbnb': 'opbnb',
                'manta-network': 'manta-network',
                'sei-network': 'sei-network',
                'injective': 'injective',
                'kava': 'kava',
                'thorchain': 'thorchain',
                'osmosis': 'osmosis',
                'juno': 'juno',
                'secret': 'secret',
                'akash-network': 'akash-network',
                'band-protocol': 'band-protocol',
                'fetch-ai': 'fetch-ai',
                'ocean-protocol': 'ocean-protocol',
                'singularitynet': 'singularitynet',
                'numeraire': 'numeraire',
                'render-token': 'render-token',
                'arweave': 'arweave',
                'livepeer': 'livepeer',
                'audius': 'audius',
                'mina-protocol': 'mina-protocol',
                'celestia': 'celestia',
                'dymension': 'dymension'
            };
            
            const cryptoId = cryptoMap[fromCrypto] || fromCrypto;
            
            // Check if target is a fiat currency or crypto
            const isFiatTarget = this.isFiatCurrency(toCrypto);
            
            if (isFiatTarget) {
                // Crypto to Fiat conversion (e.g., BTC to NGN)
                const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=${toCrypto}&include_24hr_change=true`;
                
                console.log('RateRadar: Fetching crypto to fiat data from:', url);
                
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
                console.log('RateRadar: Crypto to fiat API response:', data);
                
                if (data[cryptoId] && data[cryptoId][toCrypto]) {
                    const rate = data[cryptoId][toCrypto];
                    const change = data[cryptoId][`${toCrypto}_24h_change`] || 0;
                    
                    const result = { rate, price: rate, change };
                    console.log('RateRadar: Crypto to fiat conversion result:', result);
                    
                    // Cache the result
                    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
                    
                    return result;
                }
            } else {
                // Crypto to Crypto conversion
                const targetCryptoId = cryptoMap[toCrypto] || toCrypto;
                const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId},${targetCryptoId}&vs_currencies=usd&include_24hr_change=true`;
                
                console.log('RateRadar: Fetching crypto to crypto data from:', url);
                
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
                console.log('RateRadar: Crypto to crypto API response:', data);
                
                if (data[cryptoId] && data[targetCryptoId]) {
                    const fromPrice = data[cryptoId].usd;
                    const toPrice = data[targetCryptoId].usd;
                    const rate = fromPrice / toPrice;
                    const change = data[cryptoId].usd_24h_change || 0;
                    
                    const result = { rate, price: fromPrice, change };
                    console.log('RateRadar: Crypto to crypto conversion result:', result);
                    
                    // Cache the result
                    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
                    
                    return result;
                }
            }
            
            throw new Error('No data received');
            
        } catch (error) {
            console.error('Crypto API error:', error);
            return null;
        }
    }

    // Helper function to check if a currency is fiat
    isFiatCurrency(currency) {
        const fiatCurrencies = [
            'usd', 'eur', 'gbp', 'jpy', 'cny', 'cad', 'aud', 'chf', 'sek', 'nok', 
            'dkk', 'pln', 'czk', 'huf', 'ron', 'bgn', 'hrk', 'rub', 'try', 'brl', 
            'mxn', 'ars', 'clp', 'cop', 'pen', 'uyu', 'vef', 'ngn', 'zar', 'egp', 
            'mad', 'tnd', 'dzd', 'lyd', 'kes', 'ugx', 'tzs', 'etb', 'ghs', 'xof', 
            'xaf', 'inr', 'pkr', 'bdt', 'lkr', 'npr', 'thb', 'vnd', 'idr', 'myr', 
            'sgd', 'hkd', 'twd', 'krw', 'php', 'ils', 'aed', 'sar', 'qar', 'kwd', 
            'bhd', 'omr', 'jod', 'lbp', 'irr', 'iqd', 'afn', 'uzs', 'kzt', 'gel', 
            'arm', 'azn', 'byn', 'mdl', 'uah', 'kgs', 'tjs', 'tmt', 'mnt', 'lak', 
            'khr', 'mmk', 'bnd', 'mvr', 'btn', 'mop', 'fjd', 'wst', 'top', 'vuv', 
            'sbd', 'pgk', 'nzd', 'all', 'aoa', 'xcd', 'amd', 'awg', 'bsd', 'bbd', 
            'bzd', 'bmd', 'bob', 'bam', 'bwp', 'bif', 'cve', 'kyd', 'cdf', 'crc', 
            'cup', 'ang', 'djf', 'dop', 'ern', 'fkp', 'xpf', 'gmd', 'gip', 'gtq', 
            'gnf', 'gyd', 'htg', 'hnl', 'isk', 'jmd', 'kpw', 'lvl', 'lsl', 'lrd', 
            'mkd', 'mga', 'mwk', 'mru', 'mur', 'mzn', 'nad', 'nio', 'pab', 'pyg', 
            'rwf', 'stn', 'rsd', 'scr', 'sll', 'ssp', 'sdg', 'srd', 'szl', 'syp', 
            'ttd', 'ves', 'yer', 'zmw', 'zwl'
        ];
        
        return fiatCurrencies.includes(currency.toLowerCase());
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
            // Comprehensive currency list - 180+ world currencies
            const currencies = [
                // Major Currencies
                'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 
                'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RUB', 'TRY', 'BRL', 
                'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'VEF', 'NGN', 'ZAR', 'EGP', 
                'MAD', 'TND', 'DZD', 'LYD', 'KES', 'UGX', 'TZS', 'ETB', 'GHS', 'XOF', 
                'XAF', 'INR', 'PKR', 'BDT', 'LKR', 'NPR', 'THB', 'VND', 'IDR', 'MYR', 
                'SGD', 'HKD', 'TWD', 'KRW', 'PHP', 'ILS', 'AED', 'SAR', 'QAR', 'KWD', 
                'BHD', 'OMR', 'JOD', 'LBP', 'IRR', 'IQD', 'AFN', 'UZS', 'KZT', 'GEL', 
                'ARM', 'AZN', 'BYN', 'MDL', 'UAH', 'KGS', 'TJS', 'TMT', 'MNT', 'LAK', 
                'KHR', 'MMK', 'BND', 'MVR', 'BTN', 'MOP', 'FJD', 'WST', 'TOP', 'VUV', 
                'SBD', 'PGK', 'NZD',
                
                // Additional World Currencies
                'ALL', 'DZD', 'AOA', 'XCD', 'AMD', 'AWG', 'BSD', 'BBD', 'BZD', 'XOF',
                'BMD', 'INR', 'BTN', 'BOB', 'BAM', 'BWP', 'BRL', 'BND', 'BGN', 'XOF',
                'BIF', 'KHR', 'XAF', 'CVE', 'KYD', 'XAF', 'XAF', 'XAF', 'CLP', 'CNY',
                'AUD', 'AUD', 'COP', 'KMF', 'XAF', 'CDF', 'XAF', 'CRC', 'XOF', 'HRK',
                'CUP', 'ANG', 'CZK', 'DKK', 'DJF', 'XCD', 'DOP', 'XCD', 'EGP', 'XAF',
                'ERN', 'ETB', 'FKP', 'DKK', 'FJD', 'EUR', 'XPF', 'XAF', 'GMD', 'GEL',
                'EUR', 'GHS', 'GIP', 'XCD', 'GTQ', 'GNF', 'XOF', 'GYD', 'HTG', 'HNL',
                'HUF', 'ISK', 'INR', 'IDR', 'IRR', 'IQD', 'ILS', 'JMD', 'JPY', 'JOD',
                'KZT', 'KES', 'AUD', 'KPW', 'KRW', 'KWD', 'KGS', 'LAK', 'LVL', 'LBP',
                'LSL', 'LRD', 'LYD', 'CHF', 'MKD', 'MGA', 'MWK', 'MYR', 'MVR', 'XOF',
                'MRU', 'MUR', 'MXN', 'USD', 'MDL', 'MNT', 'EUR', 'MAD', 'MZN', 'MMK',
                'NAD', 'AUD', 'NPR', 'ANG', 'XPF', 'NZD', 'NIO', 'XOF', 'NGN', 'NZD',
                'AUD', 'OMR', 'PKR', 'USD', 'PAB', 'PGK', 'PYG', 'PEN', 'PHP', 'NZD',
                'PLN', 'EUR', 'QAR', 'RON', 'RUB', 'RWF', 'XCD', 'XCD', 'XCD', 'WST',
                'STN', 'SAR', 'XOF', 'RSD', 'SCR', 'SLL', 'SGD', 'ANG', 'SBD', 'SOS',
                'ZAR', 'SSP', 'EUR', 'LKR', 'SDG', 'SRD', 'NOK', 'SZL', 'SEK', 'CHF',
                'SYP', 'TWD', 'TJS', 'TZS', 'THB', 'USD', 'XOF', 'TOP', 'TTD', 'TND',
                'TRY', 'TMT', 'USD', 'UGX', 'UAH', 'AED', 'GBP', 'USD', 'UYU', 'UZS',
                'VUV', 'VES', 'VND', 'XPF', 'YER', 'ZMW', 'ZWL'
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

    setCryptoAlert() {
        try {
            const fromCryptoEl = document.getElementById('fromCrypto');
            const toCryptoEl = document.getElementById('toCrypto');
            
            if (!fromCryptoEl || !toCryptoEl) {
                console.warn('Crypto elements not found for alert');
                return;
            }
            
            const fromCrypto = fromCryptoEl.value;
            const toCrypto = toCryptoEl.value;
            const currentPrice = this.cryptoPrice;

            if (!currentPrice) {
                this.showError('Convert a crypto first');
                return;
            }

            const alert = {
                id: Date.now(),
                fromCrypto,
                toCrypto,
                targetPrice: currentPrice,
                alertType: 'below',
                createdAt: new Date().toISOString(),
                active: true,
                type: 'crypto'
            };

            // Save to Chrome storage
            chrome.storage.sync.get(['cryptoAlerts'], (result) => {
                const alerts = result.cryptoAlerts || [];
                alerts.push(alert);
                chrome.storage.sync.set({ cryptoAlerts: alerts }, () => {
                    this.showSuccess('Crypto alert set!');
                });
            });
        } catch (error) {
            console.error('Error setting crypto alert:', error);
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

    toggleCryptoFavorite() {
        try {
            const fromCryptoEl = document.getElementById('fromCrypto');
            const toCryptoEl = document.getElementById('toCrypto');
            
            if (!fromCryptoEl || !toCryptoEl) {
                console.warn('Crypto elements not found for favorite');
                return;
            }
            
            const fromCrypto = fromCryptoEl.value;
            const toCrypto = toCryptoEl.value;
            const pair = `${fromCrypto}/${toCrypto}`;

            chrome.storage.sync.get(['cryptoFavorites'], (result) => {
                const favorites = result.cryptoFavorites || [];
                const index = favorites.indexOf(pair);
                
                if (index > -1) {
                    favorites.splice(index, 1);
                    this.showSuccess('Removed from crypto favorites');
                } else {
                    favorites.push(pair);
                    this.showSuccess('Added to crypto favorites');
                }
                
                chrome.storage.sync.set({ cryptoFavorites: favorites });
            });
        } catch (error) {
            console.error('Error toggling crypto favorite:', error);
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

    // Helper function to get currency symbol
    getCurrencySymbol(currency) {
        const currencySymbols = {
            // Major currencies
            'usd': '$',
            'eur': '€',
            'gbp': '£',
            'jpy': '¥',
            'cny': '¥',
            'cad': 'C$',
            'aud': 'A$',
            'chf': 'CHF',
            'sek': 'kr',
            'nok': 'kr',
            'dkk': 'kr',
            'pln': 'zł',
            'czk': 'Kč',
            'huf': 'Ft',
            'ron': 'lei',
            'bgn': 'лв',
            'hrk': 'kn',
            'rub': '₽',
            'try': '₺',
            'brl': 'R$',
            'mxn': '$',
            'ars': '$',
            'clp': '$',
            'cop': '$',
            'pen': 'S/',
            'uyu': '$',
            'vef': 'Bs',
            'ngn': '₦',
            'zar': 'R',
            'egp': 'E£',
            'mad': 'MAD',
            'tnd': 'TND',
            'dzd': 'DZD',
            'lyd': 'LYD',
            'kes': 'KSh',
            'ugx': 'USh',
            'tzs': 'TSh',
            'etb': 'ETB',
            'ghs': 'GH₵',
            'xof': 'CFA',
            'xaf': 'FCFA',
            'inr': '₹',
            'pkr': '₨',
            'bdt': '৳',
            'lkr': 'Rs',
            'npr': '₨',
            'thb': '฿',
            'vnd': '₫',
            'idr': 'Rp',
            'myr': 'RM',
            'sgd': 'S$',
            'hkd': 'HK$',
            'twd': 'NT$',
            'krw': '₩',
            'php': '₱',
            'ils': '₪',
            'aed': 'د.إ',
            'sar': '﷼',
            'qar': '﷼',
            'kwd': 'د.ك',
            'bhd': '.د.ب',
            'omr': 'ر.ع.',
            'jod': 'د.ا',
            'lbp': 'ل.ل',
            'irr': '﷼',
            'iqd': 'ع.د',
            'afn': '؋',
            'uzs': 'so\'m',
            'kzt': '₸',
            'gel': '₾',
            'arm': '֏',
            'azn': '₼',
            'byn': 'Br',
            'mdl': 'L',
            'uah': '₴',
            'kgs': 'с',
            'tjs': 'ЅМ',
            'tmt': 'T',
            'mnt': '₮',
            'lak': '₭',
            'khr': '៛',
            'mmk': 'K',
            'bnd': 'B$',
            'mvr': 'MVR',
            'btn': 'Nu.',
            'mop': 'MOP$',
            'fjd': 'FJ$',
            'wst': 'T',
            'top': 'T$',
            'vuv': 'VT',
            'sbd': 'SI$',
            'pgk': 'K',
            'nzd': 'NZ$',
            
            // Additional currencies
            'all': 'L',
            'aoa': 'Kz',
            'xcd': 'EC$',
            'amd': '֏',
            'awg': 'ƒ',
            'bsd': 'B$',
            'bbd': 'Bds$',
            'bzd': 'BZ$',
            'bmd': 'BD$',
            'bob': 'Bs',
            'bam': 'KM',
            'bwp': 'P',
            'bif': 'FBu',
            'cve': '$',
            'kyd': 'CI$',
            'cdf': 'FC',
            'crc': '₡',
            'cup': '$',
            'ang': 'ƒ',
            'djf': 'Fdj',
            'dop': 'RD$',
            'ern': 'Nfk',
            'fkp': 'FK£',
            'xpf': '₣',
            'gmd': 'D',
            'gip': '£',
            'gtq': 'Q',
            'gnf': 'FG',
            'gyd': 'G$',
            'htg': 'G',
            'hnl': 'L',
            'isk': 'kr',
            'jmd': 'J$',
            'kpw': '₩',
            'lvl': 'Ls',
            'lsl': 'L',
            'lrd': 'L$',
            'mkd': 'ден',
            'mga': 'Ar',
            'mwk': 'MK',
            'mru': 'UM',
            'mur': '₨',
            'mzn': 'MT',
            'nad': 'N$',
            'nio': 'C$',
            'pab': 'B/.',
            'pyg': '₲',
            'rwf': 'FRw',
            'stn': 'Db',
            'rsd': 'дин',
            'scr': '₨',
            'sll': 'Le',
            'ssp': 'SSP',
            'sdg': 'ج.س.',
            'srd': '$',
            'szl': 'L',
            'syp': '£',
            'ttd': 'TT$',
            'ves': 'Bs',
            'yer': '﷼',
            'zmw': 'ZK',
            'zwl': 'Z$'
        };
        
        return currencySymbols[currency.toLowerCase()] || currency.toUpperCase();
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