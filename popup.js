// RateRadar Enhanced Popup JavaScript - Complete with Alerts, Favorites & Settings Integration
class RateRadar {
    constructor() {
        this.currentTab = 'converter';
        this.exchangeRate = 0;
        this.cryptoPrice = 0;
        this.historyChart = null;
        this.isOnline = true;
        this.isLoading = false;
        this.settings = {};
        this.alerts = new Map();
        this.favorites = [];
        this.historicalData = new Map(); // Store historical data
        
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
            console.log('RateRadar initializing with enhanced functionality...');
            
            // Set a timeout to prevent infinite loading
            const loadingTimeout = setTimeout(() => {
                this.showLoading(false);
                console.warn('RateRadar initialization timed out');
            }, 10000); // 10 second timeout
            
            // Load settings first
            await this.loadSettings();
            
            // Load historical data
            await this.loadHistoricalData();
            
            // Setup UI elements
            this.setupUI();
            
            // Load alerts and favorites
            await this.loadAlerts();
            await this.loadFavorites();
            
            // Initialize with cached data if available
            await this.initializeWithCache();
            
            // Mark as initialized
            this.initialized = true;
            
            // Clear the timeout since we're done
            clearTimeout(loadingTimeout);
            
            // Perform initial conversion
            await this.performConversion();
            
        } catch (error) {
            console.error('RateRadar initialization error:', error);
            this.showError('Failed to initialize RateRadar');
            this.showLoading(false);
        } finally {
            // Always hide loading when done
            this.showLoading(false);
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['settings']);
            this.settings = result.settings || this.getDefaultSettings();
            
            // Apply theme to popup
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
            autoRefresh: true,
            refreshInterval: 5,
            notifications: true,
            soundAlerts: false,
            smartShopping: true,
            decimalPlaces: 2,
            showTrends: true,
            alertCheckInterval: 5,
            maxAlerts: 10
        };
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        console.log('Theme applied to popup:', theme);
    }

    setupUI() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });

        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                chrome.runtime.openOptionsPage();
            });
        }

        // Currency conversion inputs
        const fromAmount = document.getElementById('fromAmount');
        const fromCurrency = document.getElementById('fromCurrency');
        const toCurrency = document.getElementById('toCurrency');
        
        if (fromAmount) {
            fromAmount.addEventListener('input', this.debounce(() => this.performConversion(), 300));
        }
        if (fromCurrency) {
            fromCurrency.addEventListener('change', () => this.performConversion());
        }
        if (toCurrency) {
            toCurrency.addEventListener('change', () => this.performConversion());
        }

        // Swap button
        const swapBtn = document.getElementById('swapBtn');
        if (swapBtn) {
            swapBtn.addEventListener('click', () => this.swapCurrencies());
        }

        // Crypto conversion inputs
        const fromCryptoAmount = document.getElementById('fromCryptoAmount');
        const fromCrypto = document.getElementById('fromCrypto');
        const toCrypto = document.getElementById('toCrypto');
        
        if (fromCryptoAmount) {
            fromCryptoAmount.addEventListener('input', this.debounce(() => this.performCryptoConversion(), 300));
        }
        if (fromCrypto) {
            fromCrypto.addEventListener('change', () => this.performCryptoConversion());
        }
        if (toCrypto) {
            toCrypto.addEventListener('change', () => this.performCryptoConversion());
        }

        // Crypto swap button
        const swapCryptoBtn = document.getElementById('swapCryptoBtn');
        if (swapCryptoBtn) {
            swapCryptoBtn.addEventListener('click', () => this.swapCrypto());
        }

        // Alert buttons
        const setAlertBtn = document.getElementById('setAlertBtn');
        const setCryptoAlertBtn = document.getElementById('setCryptoAlertBtn');
        const addAlertBtn = document.getElementById('addAlertBtn');

        if (setAlertBtn) {
            setAlertBtn.addEventListener('click', () => this.showAlertModal('currency'));
        }
        if (setCryptoAlertBtn) {
            setCryptoAlertBtn.addEventListener('click', () => this.showAlertModal('crypto'));
        }
        if (addAlertBtn) {
            addAlertBtn.addEventListener('click', () => this.showAlertModal('custom'));
        }

        // Favorite buttons
        const favoriteBtn = document.getElementById('favoriteBtn');
        const favoriteCryptoBtn = document.getElementById('favoriteCryptoBtn');

        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => this.addToFavorites('currency'));
        }
        if (favoriteCryptoBtn) {
            favoriteCryptoBtn.addEventListener('click', () => this.addToFavorites('crypto'));
        }

        // History controls
        const historyType = document.getElementById('historyType');
        const historyDays = document.getElementById('historyDays');

        if (historyType) {
            historyType.addEventListener('change', () => this.loadHistoryList());
        }
        if (historyDays) {
            historyDays.addEventListener('change', () => this.loadHistoryList());
        }

        // Alert modal
        this.setupAlertModal();
    }

    setupAlertModal() {
        const modal = document.getElementById('alertModal');
        const closeBtn = document.getElementById('closeAlertModal');
        const cancelBtn = document.getElementById('cancelAlertBtn');
        const saveBtn = document.getElementById('saveAlertBtn');

        // Ensure modal starts hidden
        if (modal) {
            modal.classList.add('hidden');
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideAlertModal());
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideAlertModal());
        }
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveAlert());
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAlertModal();
                }
            });
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

        // Load tab-specific content
        if (tabName === 'alerts') {
            this.loadAlertsList();
        } else if (tabName === 'favorites') {
            this.loadFavoritesList();
        } else if (tabName === 'history') {
            this.loadHistoryList();
        }
    }

    async performConversion() {
        try {
            const fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
            const fromCurrency = document.getElementById('fromCurrency').value;
            const toCurrency = document.getElementById('toCurrency').value;
            
            if (fromAmount <= 0 || fromCurrency === toCurrency) {
                document.getElementById('toAmount').value = fromAmount.toFixed(2);
                return;
            }
            
            this.showLoading(true);
            
            // Add timeout for conversion
            const conversionTimeout = setTimeout(() => {
                this.showLoading(false);
                this.showError('Conversion timed out');
            }, 8000);
            
            const rate = await this.getExchangeRate(fromCurrency, toCurrency);
            
            clearTimeout(conversionTimeout);
            
            if (rate > 0) {
                const convertedAmount = fromAmount * rate;
                const decimalPlaces = this.settings.decimalPlaces || 2;
                document.getElementById('toAmount').value = convertedAmount.toFixed(decimalPlaces);
                
                // Update rate display
                document.getElementById('exchangeRate').textContent = 
                    `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
                document.getElementById('lastUpdated').textContent = 
                    new Date().toLocaleTimeString();

                // Save historical data
                await this.saveHistoricalData('currency', fromCurrency, toCurrency, rate);
            }
        } catch (error) {
            console.error('Conversion error:', error);
            this.showError('Conversion failed');
        } finally {
            this.showLoading(false);
        }
    }

    async performCryptoConversion() {
        try {
            const fromAmount = parseFloat(document.getElementById('fromCryptoAmount').value) || 0;
            const fromCrypto = document.getElementById('fromCrypto').value;
            const toCrypto = document.getElementById('toCrypto').value;
            
            if (fromAmount <= 0) {
                document.getElementById('toCryptoAmount').value = fromAmount.toFixed(6);
                return;
            }
            
            this.showLoading(true);
            
            // Add timeout for crypto conversion
            const conversionTimeout = setTimeout(() => {
                this.showLoading(false);
                this.showError('Crypto conversion timed out');
            }, 8000);
            
            if (toCrypto === 'usd' || toCrypto === 'eur' || toCrypto === 'gbp' || toCrypto === 'ngn') {
                // Convert crypto to fiat
                const price = await this.getCryptoPrice(fromCrypto, toCrypto);
                clearTimeout(conversionTimeout);
                
                if (price > 0) {
                    const convertedAmount = fromAmount * price;
                    document.getElementById('toCryptoAmount').value = convertedAmount.toFixed(2);
                    
                    // Update price display
                    document.getElementById('cryptoPrice').textContent = 
                        `${this.getCurrencySymbol(toCrypto)}${price.toFixed(2)}`;

                    // Save historical data
                    await this.saveHistoricalData('crypto', fromCrypto, toCrypto, price);
                }
            } else {
                // Convert between cryptos
                const fromPrice = await this.getCryptoPrice(fromCrypto, 'usd');
                const toPrice = await this.getCryptoPrice(toCrypto, 'usd');
                
                clearTimeout(conversionTimeout);
                
                if (fromPrice > 0 && toPrice > 0) {
                    const convertedAmount = (fromAmount * fromPrice) / toPrice;
                    document.getElementById('toCryptoAmount').value = convertedAmount.toFixed(6);

                    // Save historical data
                    await this.saveHistoricalData('crypto', fromCrypto, toCrypto, (fromAmount * fromPrice) / toPrice);
                }
            }
        } catch (error) {
            console.error('Crypto conversion error:', error);
            this.showError('Crypto conversion failed');
        } finally {
            this.showLoading(false);
        }
    }

    async getExchangeRate(fromCurrency, toCurrency) {
        const cacheKey = `${fromCurrency}_${toCurrency}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.rate;
            }
        }

        // Check pending requests
        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }

        // Create new request
        const requestPromise = this.fetchExchangeRate(fromCurrency, toCurrency);
        this.pendingRequests.set(cacheKey, requestPromise);
        
        try {
            const rate = await requestPromise;
            
            // Cache the result
            this.cache.set(cacheKey, {
                rate: rate,
                timestamp: Date.now()
            });
            
            return rate;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

    async fetchExchangeRate(fromCurrency, toCurrency) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
        try {
            for (const api of this.exchangeAPIs) {
                try {
                    let url, response, data;
                    
                    if (api.includes('exchangerate-api.com')) {
                        url = `${api}/${fromCurrency}`;
                        response = await fetch(url, { signal: controller.signal });
                        data = await response.json();
                        return data.rates[toCurrency];
                    } else if (api.includes('fawazahmed0')) {
                        url = `${api}/${fromCurrency}.json`;
                        response = await fetch(url, { signal: controller.signal });
                    data = await response.json();
                        return data[fromCurrency][toCurrency];
                    } else if (api.includes('currency-api.pages.dev')) {
                        url = `${api}/${fromCurrency}.json`;
                        response = await fetch(url, { signal: controller.signal });
                    data = await response.json();
                        return data[fromCurrency][toCurrency];
                    }
                } catch (error) {
                    console.log(`API ${api} failed:`, error.message);
                    continue;
                }
            }
            
            throw new Error('All exchange rate APIs failed');
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async getCryptoPrice(cryptoId, currency = 'usd') {
        const cacheKey = `crypto_${cryptoId}_${currency}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.price;
            }
        }

        try {
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=${currency}`;
            const response = await fetch(url);
            const data = await response.json();
            
            const price = data[cryptoId][currency];
            
            // Cache the result
            this.cache.set(cacheKey, {
                price: price,
                timestamp: Date.now()
            });
            
            return price;
        } catch (error) {
            console.error('Crypto price fetch error:', error);
            return 0;
        }
    }

    getCurrencySymbol(currency) {
        const symbols = {
            'usd': '$',
            'eur': '€',
            'gbp': '£',
            'ngn': '₦',
            'jpy': '¥',
            'cny': '¥',
            'inr': '₹',
            'brl': 'R$',
            'mxn': '$',
            'cad': 'C$',
            'aud': 'A$',
            'chf': 'CHF',
            'zar': 'R'
        };
        return symbols[currency] || currency.toUpperCase();
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
        const fromAmount = document.getElementById('fromCryptoAmount');
        const toAmount = document.getElementById('toCryptoAmount');
        
        const tempCrypto = fromCrypto.value;
        const tempAmount = fromAmount.value;
        
        fromCrypto.value = toCrypto.value;
        toCrypto.value = tempCrypto;
        fromAmount.value = toAmount.value;
        toAmount.value = tempAmount;
        
        this.performCryptoConversion();
    }

    // Alert System
    async loadAlerts() {
        try {
            const result = await chrome.storage.sync.get(['rateAlerts']);
            if (result.rateAlerts) {
                this.alerts = new Map(Object.entries(result.rateAlerts));
            }
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    }

    async saveAlerts() {
        try {
            const alertsObject = Object.fromEntries(this.alerts);
            await chrome.storage.sync.set({ rateAlerts: alertsObject });
        } catch (error) {
            console.error('Error saving alerts:', error);
        }
    }

    showAlertModal(type = 'custom') {
        const modal = document.getElementById('alertModal');
        const fromSelect = document.getElementById('alertFromCurrency');
        const toSelect = document.getElementById('alertToCurrency');
        const targetRate = document.getElementById('alertTargetRate');
        const description = document.getElementById('alertDescription');

        // Clear existing options first
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';

        // Populate currency options
        this.populateCurrencyOptions(fromSelect, toSelect, type);

        // Pre-fill based on current conversion
        if (type === 'currency') {
            fromSelect.value = document.getElementById('fromCurrency').value;
            toSelect.value = document.getElementById('toCurrency').value;
            targetRate.value = document.getElementById('toAmount').value || '';
        } else if (type === 'crypto') {
            fromSelect.value = document.getElementById('fromCrypto').value;
            toSelect.value = document.getElementById('toCrypto').value;
            targetRate.value = document.getElementById('toCryptoAmount').value || '';
        }

        // Pre-fill description
        if (type === 'crypto') {
            description.value = `1 ${fromSelect.value.toUpperCase()} = $${targetRate.value}`;
        }

        // Show modal
        modal.classList.remove('hidden');
        
        // Focus on first input
        setTimeout(() => {
            fromSelect.focus();
        }, 100);
    }

    hideAlertModal() {
        const modal = document.getElementById('alertModal');
        modal.classList.add('hidden');
        
        // Clear form
        document.getElementById('alertFromCurrency').value = '';
        document.getElementById('alertToCurrency').value = '';
        document.getElementById('alertTargetRate').value = '';
        document.getElementById('alertDescription').value = '';
    }

    populateCurrencyOptions(fromSelect, toSelect, type) {
        // Clear existing options
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';

        if (type === 'crypto') {
            // Add default option
            const defaultFromOption = document.createElement('option');
            defaultFromOption.value = '';
            defaultFromOption.textContent = 'Select Crypto';
            fromSelect.appendChild(defaultFromOption);

            const defaultToOption = document.createElement('option');
            defaultToOption.value = '';
            defaultToOption.textContent = 'Select Currency';
            toSelect.appendChild(defaultToOption);

            // Crypto options
            const cryptos = [
                { value: 'bitcoin', label: 'BTC - Bitcoin' },
                { value: 'ethereum', label: 'ETH - Ethereum' },
                { value: 'cardano', label: 'ADA - Cardano' },
                { value: 'solana', label: 'SOL - Solana' },
                { value: 'binancecoin', label: 'BNB - Binance Coin' },
                { value: 'ripple', label: 'XRP - Ripple' },
                { value: 'polkadot', label: 'DOT - Polkadot' },
                { value: 'dogecoin', label: 'DOGE - Dogecoin' },
                { value: 'avalanche-2', label: 'AVAX - Avalanche' },
                { value: 'polygon', label: 'MATIC - Polygon' },
                { value: 'chainlink', label: 'LINK - Chainlink' },
                { value: 'uniswap', label: 'UNI - Uniswap' },
                { value: 'litecoin', label: 'LTC - Litecoin' },
                { value: 'bitcoin-cash', label: 'BCH - Bitcoin Cash' },
                { value: 'stellar', label: 'XLM - Stellar' },
                { value: 'vechain', label: 'VET - VeChain' },
                { value: 'filecoin', label: 'FIL - Filecoin' },
                { value: 'cosmos', label: 'ATOM - Cosmos' },
                { value: 'monero', label: 'XMR - Monero' },
                { value: 'algorand', label: 'ALGO - Algorand' },
                { value: 'tezos', label: 'XTZ - Tezos' },
                { value: 'aave', label: 'AAVE - Aave' },
                { value: 'compound', label: 'COMP - Compound' },
                { value: 'sushi', label: 'SUSHI - SushiSwap' },
                { value: 'pancakeswap-token', label: 'CAKE - PancakeSwap' },
                { value: 'curve-dao-token', label: 'CRV - Curve DAO' },
                { value: 'yearn-finance', label: 'YFI - Yearn Finance' },
                { value: 'synthetix-network-token', label: 'SNX - Synthetix' },
                { value: '0x', label: 'ZRX - 0x Protocol' },
                { value: 'balancer', label: 'BAL - Balancer' },
                { value: '1inch', label: '1INCH - 1inch' },
                { value: 'dash', label: 'DASH - Dash' },
                { value: 'zcash', label: 'ZEC - Zcash' },
                { value: 'nem', label: 'XEM - NEM' },
                { value: 'iota', label: 'MIOTA - IOTA' },
                { value: 'neo', label: 'NEO - Neo' },
                { value: 'qtum', label: 'QTUM - Qtum' },
                { value: 'waves', label: 'WAVES - Waves' },
                { value: 'nano', label: 'XNO - Nano' },
                { value: 'icon', label: 'ICX - ICON' },
                { value: 'ontology', label: 'ONT - Ontology' },
                { value: 'zilliqa', label: 'ZIL - Zilliqa' },
                { value: 'harmony', label: 'ONE - Harmony' },
                { value: 'elrond-erd-2', label: 'EGLD - Elrond' },
                { value: 'near', label: 'NEAR - NEAR Protocol' },
                { value: 'fantom', label: 'FTM - Fantom' },
                { value: 'the-graph', label: 'GRT - The Graph' },
                { value: 'decentraland', label: 'MANA - Decentraland' },
                { value: 'sandbox', label: 'SAND - The Sandbox' },
                { value: 'enjincoin', label: 'ENJ - Enjin Coin' },
                { value: 'axie-infinity', label: 'AXS - Axie Infinity' },
                { value: 'gala', label: 'GALA - Gala' },
                { value: 'chiliz', label: 'CHZ - Chiliz' },
                { value: 'flow', label: 'FLOW - Flow' },
                { value: 'internet-computer', label: 'ICP - Internet Computer' },
                { value: 'theta-token', label: 'THETA - Theta Network' },
                { value: 'vega-protocol', label: 'VEGA - Vega Protocol' },
                { value: 'celo', label: 'CELO - Celo' },
                { value: 'kusama', label: 'KSM - Kusama' },
                { value: 'eos', label: 'EOS - EOS' },
                { value: 'tron', label: 'TRX - TRON' },
                { value: 'bitcoin-sv', label: 'BSV - Bitcoin SV' }
            ];

            const fiatCurrencies = [
                { value: 'usd', label: 'USD - US Dollar' },
                { value: 'eur', label: 'EUR - Euro' },
                { value: 'gbp', label: 'GBP - British Pound' },
                { value: 'jpy', label: 'JPY - Japanese Yen' },
                { value: 'cny', label: 'CNY - Chinese Yuan' },
                { value: 'cad', label: 'CAD - Canadian Dollar' },
                { value: 'aud', label: 'AUD - Australian Dollar' },
                { value: 'chf', label: 'CHF - Swiss Franc' },
                { value: 'ngn', label: 'NGN - Nigerian Naira' },
                { value: 'zar', label: 'ZAR - South African Rand' },
                { value: 'inr', label: 'INR - Indian Rupee' },
                { value: 'brl', label: 'BRL - Brazilian Real' },
                { value: 'mxn', label: 'MXN - Mexican Peso' },
                { value: 'ars', label: 'ARS - Argentine Peso' },
                { value: 'clp', label: 'CLP - Chilean Peso' },
                { value: 'cop', label: 'COP - Colombian Peso' },
                { value: 'pen', label: 'PEN - Peruvian Sol' },
                { value: 'uyu', label: 'UYU - Uruguayan Peso' },
                { value: 'vef', label: 'VEF - Venezuelan Bolívar' },
                { value: 'egp', label: 'EGP - Egyptian Pound' },
                { value: 'mad', label: 'MAD - Moroccan Dirham' },
                { value: 'tnd', label: 'TND - Tunisian Dinar' },
                { value: 'dzd', label: 'DZD - Algerian Dinar' },
                { value: 'lyd', label: 'LYD - Libyan Dinar' },
                { value: 'kes', label: 'KES - Kenyan Shilling' },
                { value: 'ugx', label: 'UGX - Ugandan Shilling' },
                { value: 'tzs', label: 'TZS - Tanzanian Shilling' },
                { value: 'etb', label: 'ETB - Ethiopian Birr' },
                { value: 'ghs', label: 'GHS - Ghanaian Cedi' },
                { value: 'xof', label: 'XOF - West African CFA Franc' },
                { value: 'xaf', label: 'XAF - Central African CFA Franc' },
                { value: 'pkr', label: 'PKR - Pakistani Rupee' },
                { value: 'bdt', label: 'BDT - Bangladeshi Taka' },
                { value: 'lkr', label: 'LKR - Sri Lankan Rupee' },
                { value: 'npr', label: 'NPR - Nepalese Rupee' },
                { value: 'thb', label: 'THB - Thai Baht' },
                { value: 'vnd', label: 'VND - Vietnamese Dong' },
                { value: 'idr', label: 'IDR - Indonesian Rupiah' },
                { value: 'myr', label: 'MYR - Malaysian Ringgit' },
                { value: 'sgd', label: 'SGD - Singapore Dollar' },
                { value: 'hkd', label: 'HKD - Hong Kong Dollar' },
                { value: 'twd', label: 'TWD - New Taiwan Dollar' },
                { value: 'krw', label: 'KRW - South Korean Won' },
                { value: 'php', label: 'PHP - Philippine Peso' },
                { value: 'ils', label: 'ILS - Israeli Shekel' },
                { value: 'aed', label: 'AED - UAE Dirham' },
                { value: 'sar', label: 'SAR - Saudi Riyal' },
                { value: 'qar', label: 'QAR - Qatari Riyal' },
                { value: 'kwd', label: 'KWD - Kuwaiti Dinar' },
                { value: 'bhd', label: 'BHD - Bahraini Dinar' },
                { value: 'omr', label: 'OMR - Omani Rial' },
                { value: 'jod', label: 'JOD - Jordanian Dinar' },
                { value: 'lbp', label: 'LBP - Lebanese Pound' },
                { value: 'irr', label: 'IRR - Iranian Rial' },
                { value: 'iqd', label: 'IQD - Iraqi Dinar' },
                { value: 'afn', label: 'AFN - Afghan Afghani' },
                { value: 'uzs', label: 'UZS - Uzbekistani Som' },
                { value: 'kzt', label: 'KZT - Kazakhstani Tenge' },
                { value: 'gel', label: 'GEL - Georgian Lari' },
                { value: 'arm', label: 'ARM - Armenian Dram' },
                { value: 'azn', label: 'AZN - Azerbaijani Manat' },
                { value: 'byn', label: 'BYN - Belarusian Ruble' },
                { value: 'mdl', label: 'MDL - Moldovan Leu' },
                { value: 'uah', label: 'UAH - Ukrainian Hryvnia' },
                { value: 'kgs', label: 'KGS - Kyrgyzstani Som' },
                { value: 'tjs', label: 'TJS - Tajikistani Somoni' },
                { value: 'tmt', label: 'TMT - Turkmenistani Manat' },
                { value: 'mnt', label: 'MNT - Mongolian Tögrög' },
                { value: 'lak', label: 'LAK - Lao Kip' },
                { value: 'khr', label: 'KHR - Cambodian Riel' },
                { value: 'mmk', label: 'MMK - Myanmar Kyat' },
                { value: 'bnd', label: 'BND - Brunei Dollar' },
                { value: 'mvr', label: 'MVR - Maldivian Rufiyaa' },
                { value: 'btn', label: 'BTN - Bhutanese Ngultrum' },
                { value: 'mop', label: 'MOP - Macanese Pataca' },
                { value: 'fjd', label: 'FJD - Fijian Dollar' },
                { value: 'wst', label: 'WST - Samoan Tālā' },
                { value: 'top', label: 'TOP - Tongan Paʻanga' },
                { value: 'vuv', label: 'VUV - Vanuatu Vatu' },
                { value: 'sbd', label: 'SBD - Solomon Islands Dollar' },
                { value: 'pgk', label: 'PGK - Papua New Guinean Kina' },
                { value: 'nzd', label: 'NZD - New Zealand Dollar' }
            ];

            // Add crypto options to from select
            cryptos.forEach(crypto => {
                const option = document.createElement('option');
                option.value = crypto.value;
                option.textContent = crypto.label;
                fromSelect.appendChild(option);
            });

            // Add fiat currency options to to select
            fiatCurrencies.forEach(currency => {
                const option = document.createElement('option');
                option.value = currency.value;
                option.textContent = currency.label;
                toSelect.appendChild(option);
            });
        } else {
            // Add default options for currency
            const defaultFromOption = document.createElement('option');
            defaultFromOption.value = '';
            defaultFromOption.textContent = 'Select Currency';
            fromSelect.appendChild(defaultFromOption);

            const defaultToOption = document.createElement('option');
            defaultToOption.value = '';
            defaultToOption.textContent = 'Select Currency';
            toSelect.appendChild(defaultToOption);

            // Fiat currency options - 180+ currencies
            const currencies = [
                { value: 'USD', label: 'USD - US Dollar' },
                { value: 'EUR', label: 'EUR - Euro' },
                { value: 'GBP', label: 'GBP - British Pound' },
                { value: 'JPY', label: 'JPY - Japanese Yen' },
                { value: 'CNY', label: 'CNY - Chinese Yuan' },
                { value: 'CAD', label: 'CAD - Canadian Dollar' },
                { value: 'AUD', label: 'AUD - Australian Dollar' },
                { value: 'CHF', label: 'CHF - Swiss Franc' },
                { value: 'SEK', label: 'SEK - Swedish Krona' },
                { value: 'NOK', label: 'NOK - Norwegian Krone' },
                { value: 'DKK', label: 'DKK - Danish Krone' },
                { value: 'PLN', label: 'PLN - Polish Złoty' },
                { value: 'CZK', label: 'CZK - Czech Koruna' },
                { value: 'HUF', label: 'HUF - Hungarian Forint' },
                { value: 'RON', label: 'RON - Romanian Leu' },
                { value: 'BGN', label: 'BGN - Bulgarian Lev' },
                { value: 'HRK', label: 'HRK - Croatian Kuna' },
                { value: 'RUB', label: 'RUB - Russian Ruble' },
                { value: 'TRY', label: 'TRY - Turkish Lira' },
                { value: 'BRL', label: 'BRL - Brazilian Real' },
                { value: 'MXN', label: 'MXN - Mexican Peso' },
                { value: 'ARS', label: 'ARS - Argentine Peso' },
                { value: 'CLP', label: 'CLP - Chilean Peso' },
                { value: 'COP', label: 'COP - Colombian Peso' },
                { value: 'PEN', label: 'PEN - Peruvian Sol' },
                { value: 'UYU', label: 'UYU - Uruguayan Peso' },
                { value: 'VEF', label: 'VEF - Venezuelan Bolívar' },
                { value: 'NGN', label: 'NGN - Nigerian Naira' },
                { value: 'ZAR', label: 'ZAR - South African Rand' },
                { value: 'EGP', label: 'EGP - Egyptian Pound' },
                { value: 'MAD', label: 'MAD - Moroccan Dirham' },
                { value: 'TND', label: 'TND - Tunisian Dinar' },
                { value: 'DZD', label: 'DZD - Algerian Dinar' },
                { value: 'LYD', label: 'LYD - Libyan Dinar' },
                { value: 'KES', label: 'KES - Kenyan Shilling' },
                { value: 'UGX', label: 'UGX - Ugandan Shilling' },
                { value: 'TZS', label: 'TZS - Tanzanian Shilling' },
                { value: 'ETB', label: 'ETB - Ethiopian Birr' },
                { value: 'GHS', label: 'GHS - Ghanaian Cedi' },
                { value: 'XOF', label: 'XOF - West African CFA Franc' },
                { value: 'XAF', label: 'XAF - Central African CFA Franc' },
                { value: 'INR', label: 'INR - Indian Rupee' },
                { value: 'PKR', label: 'PKR - Pakistani Rupee' },
                { value: 'BDT', label: 'BDT - Bangladeshi Taka' },
                { value: 'LKR', label: 'LKR - Sri Lankan Rupee' },
                { value: 'NPR', label: 'NPR - Nepalese Rupee' },
                { value: 'THB', label: 'THB - Thai Baht' },
                { value: 'VND', label: 'VND - Vietnamese Dong' },
                { value: 'IDR', label: 'IDR - Indonesian Rupiah' },
                { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
                { value: 'SGD', label: 'SGD - Singapore Dollar' },
                { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
                { value: 'TWD', label: 'TWD - New Taiwan Dollar' },
                { value: 'KRW', label: 'KRW - South Korean Won' },
                { value: 'PHP', label: 'PHP - Philippine Peso' },
                { value: 'ILS', label: 'ILS - Israeli Shekel' },
                { value: 'AED', label: 'AED - UAE Dirham' },
                { value: 'SAR', label: 'SAR - Saudi Riyal' },
                { value: 'QAR', label: 'QAR - Qatari Riyal' },
                { value: 'KWD', label: 'KWD - Kuwaiti Dinar' },
                { value: 'BHD', label: 'BHD - Bahraini Dinar' },
                { value: 'OMR', label: 'OMR - Omani Rial' },
                { value: 'JOD', label: 'JOD - Jordanian Dinar' },
                { value: 'LBP', label: 'LBP - Lebanese Pound' },
                { value: 'IRR', label: 'IRR - Iranian Rial' },
                { value: 'IQD', label: 'IQD - Iraqi Dinar' },
                { value: 'AFN', label: 'AFN - Afghan Afghani' },
                { value: 'UZS', label: 'UZS - Uzbekistani Som' },
                { value: 'KZT', label: 'KZT - Kazakhstani Tenge' },
                { value: 'GEL', label: 'GEL - Georgian Lari' },
                { value: 'ARM', label: 'ARM - Armenian Dram' },
                { value: 'AZN', label: 'AZN - Azerbaijani Manat' },
                { value: 'BYN', label: 'BYN - Belarusian Ruble' },
                { value: 'MDL', label: 'MDL - Moldovan Leu' },
                { value: 'UAH', label: 'UAH - Ukrainian Hryvnia' },
                { value: 'KGS', label: 'KGS - Kyrgyzstani Som' },
                { value: 'TJS', label: 'TJS - Tajikistani Somoni' },
                { value: 'TMT', label: 'TMT - Turkmenistani Manat' },
                { value: 'MNT', label: 'MNT - Mongolian Tögrög' },
                { value: 'LAK', label: 'LAK - Lao Kip' },
                { value: 'KHR', label: 'KHR - Cambodian Riel' },
                { value: 'MMK', label: 'MMK - Myanmar Kyat' },
                { value: 'BND', label: 'BND - Brunei Dollar' },
                { value: 'MVR', label: 'MVR - Maldivian Rufiyaa' },
                { value: 'BTN', label: 'BTN - Bhutanese Ngultrum' },
                { value: 'MOP', label: 'MOP - Macanese Pataca' },
                { value: 'FJD', label: 'FJD - Fijian Dollar' },
                { value: 'WST', label: 'WST - Samoan Tālā' },
                { value: 'TOP', label: 'TOP - Tongan Paʻanga' },
                { value: 'VUV', label: 'VUV - Vanuatu Vatu' },
                { value: 'SBD', label: 'SBD - Solomon Islands Dollar' },
                { value: 'PGK', label: 'PGK - Papua New Guinean Kina' },
                { value: 'NZD', label: 'NZD - New Zealand Dollar' }
            ];

            // Add currency options to both selects
            currencies.forEach(currency => {
                const fromOption = document.createElement('option');
                fromOption.value = currency.value;
                fromOption.textContent = currency.label;
                fromSelect.appendChild(fromOption);

                const toOption = document.createElement('option');
                toOption.value = currency.value;
                toOption.textContent = currency.label;
                toSelect.appendChild(toOption);
            });
        }
    }

    async saveAlert() {
        try {
            const fromCurrency = document.getElementById('alertFromCurrency').value;
            const toCurrency = document.getElementById('alertToCurrency').value;
            const targetRate = parseFloat(document.getElementById('alertTargetRate').value);
            const condition = document.getElementById('alertCondition').value;
            const description = document.getElementById('alertDescription').value;

            if (!fromCurrency || !toCurrency || !targetRate || targetRate <= 0) {
                this.showError('Please fill in all required fields');
                return;
            }

            const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const alert = {
                id: alertId,
                fromCurrency: fromCurrency,
                toCurrency: toCurrency,
                targetRate: targetRate,
                condition: condition,
                description: description || `${fromCurrency.toUpperCase()} to ${toCurrency.toUpperCase()}`,
                isActive: true,
                createdAt: Date.now(),
                lastChecked: 0,
                triggered: false,
                type: fromCurrency.includes('bitcoin') || fromCurrency.includes('ethereum') ? 'crypto' : 'currency'
            };

            this.alerts.set(alertId, alert);
            await this.saveAlerts();
            
            this.hideAlertModal();
            this.showSuccess('Alert saved successfully!');
            
            // Refresh alerts list if on alerts tab
            if (this.currentTab === 'alerts') {
                this.loadAlertsList();
            }
        } catch (error) {
            console.error('Error saving alert:', error);
            this.showError('Failed to save alert');
        }
    }

    async loadAlertsList() {
        const alertsList = document.getElementById('alertsList');
        if (!alertsList) return;

        alertsList.innerHTML = '';

        if (this.alerts.size === 0) {
            alertsList.innerHTML = '<div class="empty-state">No alerts set. Click "Add Alert" to create one.</div>';
            return;
        }

        for (const [id, alert] of this.alerts) {
            const alertElement = this.createAlertElement(alert);
            alertsList.appendChild(alertElement);
        }
    }

    createAlertElement(alert) {
        const div = document.createElement('div');
        div.className = 'alert-item';
        div.innerHTML = `
            <div class="alert-info">
                <div class="alert-title">${alert.description}</div>
                <div class="alert-details">
                    ${alert.fromCurrency.toUpperCase()} → ${alert.toCurrency.toUpperCase()}
                    ${alert.condition === 'above' ? '>' : '<'} ${alert.targetRate}
                </div>
                <div class="alert-status ${alert.isActive ? 'active' : 'inactive'}">
                    ${alert.isActive ? 'Active' : 'Inactive'}
                </div>
            </div>
            <div class="alert-actions">
                <button class="toggle-alert-btn" data-id="${alert.id}">
                    ${alert.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button class="delete-alert-btn" data-id="${alert.id}">Delete</button>
            </div>
        `;

        // Add event listeners
        div.querySelector('.toggle-alert-btn').addEventListener('click', () => this.toggleAlert(alert.id));
        div.querySelector('.delete-alert-btn').addEventListener('click', () => this.deleteAlert(alert.id));

        return div;
    }

    async toggleAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.isActive = !alert.isActive;
            await this.saveAlerts();
            this.loadAlertsList();
            this.showSuccess(`Alert ${alert.isActive ? 'activated' : 'deactivated'}`);
        }
    }

    async deleteAlert(alertId) {
        if (confirm('Are you sure you want to delete this alert?')) {
            this.alerts.delete(alertId);
            await this.saveAlerts();
            this.loadAlertsList();
            this.showSuccess('Alert deleted');
        }
    }

    // Favorites System
    async loadFavorites() {
        try {
            const result = await chrome.storage.sync.get(['favoritePairs']);
            this.favorites = result.favoritePairs || [];
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }

    async saveFavorites() {
        try {
            await chrome.storage.sync.set({ favoritePairs: this.favorites });
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }

    async addToFavorites(type) {
        try {
            let favorite;
            
            if (type === 'currency') {
                const fromCurrency = document.getElementById('fromCurrency').value;
                const toCurrency = document.getElementById('toCurrency').value;
                const fromAmount = document.getElementById('fromAmount').value;
                const toAmount = document.getElementById('toAmount').value;
                
                favorite = {
                    id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'currency',
                    fromCurrency: fromCurrency,
                    toCurrency: toCurrency,
                    fromAmount: fromAmount,
                    toAmount: toAmount,
                    rate: this.exchangeRate,
                    createdAt: Date.now()
                };
            } else if (type === 'crypto') {
                const fromCrypto = document.getElementById('fromCrypto').value;
                const toCrypto = document.getElementById('toCrypto').value;
                const fromAmount = document.getElementById('fromCryptoAmount').value;
                const toAmount = document.getElementById('toCryptoAmount').value;
                
                favorite = {
                    id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'crypto',
                    fromCrypto: fromCrypto,
                    toCrypto: toCrypto,
                    fromAmount: fromAmount,
                    toAmount: toAmount,
                    price: this.cryptoPrice,
                    createdAt: Date.now()
                };
            }

            if (favorite) {
                this.favorites.push(favorite);
                await this.saveFavorites();
                this.showSuccess('Added to favorites!');
                
                // Refresh favorites list if on favorites tab
                if (this.currentTab === 'favorites') {
                    this.loadFavoritesList();
                }
            }
        } catch (error) {
            console.error('Error adding to favorites:', error);
            this.showError('Failed to add to favorites');
        }
    }

    async loadFavoritesList() {
        const favoritesList = document.getElementById('favoritesList');
        if (!favoritesList) return;

        favoritesList.innerHTML = '';

        if (this.favorites.length === 0) {
            favoritesList.innerHTML = '<div class="empty-state">No favorites yet. Convert currencies to add them here.</div>';
            return;
        }

        for (const favorite of this.favorites) {
            const favoriteElement = this.createFavoriteElement(favorite);
            favoritesList.appendChild(favoriteElement);
        }
    }

    createFavoriteElement(favorite) {
        const div = document.createElement('div');
        div.className = 'favorite-item';
        
        if (favorite.type === 'currency') {
            div.innerHTML = `
                <div class="favorite-info">
                    <div class="favorite-title">${favorite.fromCurrency} → ${favorite.toCurrency}</div>
                    <div class="favorite-details">
                        ${favorite.fromAmount} ${favorite.fromCurrency} = ${favorite.toAmount} ${favorite.toCurrency}
                    </div>
                    <div class="favorite-rate">Rate: 1 ${favorite.fromCurrency} = ${favorite.rate?.toFixed(4) || 'N/A'} ${favorite.toCurrency}</div>
                </div>
                <div class="favorite-actions">
                    <button class="use-favorite-btn" data-id="${favorite.id}">Use</button>
                    <button class="delete-favorite-btn" data-id="${favorite.id}">Delete</button>
                </div>
            `;
        } else {
            div.innerHTML = `
                <div class="favorite-info">
                    <div class="favorite-title">${favorite.fromCrypto.toUpperCase()} → ${favorite.toCrypto.toUpperCase()}</div>
                    <div class="favorite-details">
                        ${favorite.fromAmount} ${favorite.fromCrypto.toUpperCase()} = ${favorite.toAmount} ${favorite.toCrypto.toUpperCase()}
                    </div>
                    <div class="favorite-rate">Price: $${favorite.price?.toFixed(2) || 'N/A'}</div>
                </div>
                <div class="favorite-actions">
                    <button class="use-favorite-btn" data-id="${favorite.id}">Use</button>
                    <button class="delete-favorite-btn" data-id="${favorite.id}">Delete</button>
                </div>
            `;
        }

        // Add event listeners
        div.querySelector('.use-favorite-btn').addEventListener('click', () => this.useFavorite(favorite.id));
        div.querySelector('.delete-favorite-btn').addEventListener('click', () => this.deleteFavorite(favorite.id));

        return div;
    }

    useFavorite(favoriteId) {
        const favorite = this.favorites.find(f => f.id === favoriteId);
        if (!favorite) return;

        if (favorite.type === 'currency') {
            document.getElementById('fromCurrency').value = favorite.fromCurrency;
            document.getElementById('toCurrency').value = favorite.toCurrency;
            document.getElementById('fromAmount').value = favorite.fromAmount;
            this.switchTab('converter');
            this.performConversion();
        } else {
            document.getElementById('fromCrypto').value = favorite.fromCrypto;
            document.getElementById('toCrypto').value = favorite.toCrypto;
            document.getElementById('fromCryptoAmount').value = favorite.fromAmount;
            this.switchTab('crypto');
            this.performCryptoConversion();
        }
    }

    async deleteFavorite(favoriteId) {
        if (confirm('Are you sure you want to delete this favorite?')) {
            this.favorites = this.favorites.filter(f => f.id !== favoriteId);
            await this.saveFavorites();
            this.loadFavoritesList();
            this.showSuccess('Favorite deleted');
        }
    }

    // Historical Data Storage
    async saveHistoricalData(type, fromCurrency, toCurrency, rate, additionalData = {}) {
        try {
            const key = `${type}_${fromCurrency}_${toCurrency}`;
            const timestamp = Date.now();
            
            const dataPoint = {
                timestamp,
                rate: parseFloat(rate),
                ...additionalData
            };
            
            // Get existing data
            let historicalData = this.historicalData.get(key) || [];
            
            // Add new data point
            historicalData.push(dataPoint);
            
            // Keep only last 30 days of data (limit to prevent storage issues)
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            historicalData = historicalData.filter(point => point.timestamp > thirtyDaysAgo);
            
            // Store in memory
            this.historicalData.set(key, historicalData);
            
            // Save to chrome storage
            await chrome.storage.local.set({
                historicalData: Object.fromEntries(this.historicalData)
            });
            
        } catch (error) {
            console.error('Error saving historical data:', error);
        }
    }

    async loadHistoricalData() {
        try {
            const result = await chrome.storage.local.get(['historicalData']);
            if (result.historicalData) {
                this.historicalData = new Map(Object.entries(result.historicalData));
            }
        } catch (error) {
            console.error('Error loading historical data:', error);
        }
    }

    getHistoricalData(type, fromCurrency, toCurrency, days = 30) {
        const key = `${type}_${fromCurrency}_${toCurrency}`;
        const data = this.historicalData.get(key) || [];
        
        if (days < 30) {
            const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
            return data.filter(point => point.timestamp > cutoffTime);
        }
        
        return data;
    }

    calculateStatistics(data) {
        if (data.length === 0) return null;
        
        const rates = data.map(point => point.rate);
        const minRate = Math.min(...rates);
        const maxRate = Math.max(...rates);
        const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
        
        // Calculate change
        const firstRate = rates[0];
        const lastRate = rates[rates.length - 1];
        const change = ((lastRate - firstRate) / firstRate) * 100;
        
        // Calculate volatility
        const variance = rates.reduce((acc, rate) => acc + Math.pow(rate - avgRate, 2), 0) / rates.length;
        const volatility = Math.sqrt(variance);
        
        return {
            minRate,
            maxRate,
            avgRate,
            change,
            volatility,
            firstRate,
            lastRate,
            dataPoints: data.length
        };
    }

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showLoading(show) {
        this.isLoading = show;
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !show);
        }
    }

    showError(message) {
        // You can implement a toast notification system here
        console.error(message);
    }

    showSuccess(message) {
        // You can implement a toast notification system here
        console.log(message);
    }

    async initializeWithCache() {
        // Initialize with any cached data
        this.cleanupCache();
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
            }
        }
        this.lastCacheCleanup = now;
    }

    async loadHistoryList() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        const historyType = document.getElementById('historyType')?.value || 'currency';
        const historyDays = parseInt(document.getElementById('historyDays')?.value || '30');

        historyList.innerHTML = '';

        // Get all historical data for the selected type
        const allData = [];
        for (const [key, data] of this.historicalData.entries()) {
            if (key.startsWith(historyType + '_')) {
                const parts = key.split('_');
                if (parts.length >= 3) {
                    const fromCurrency = parts[1];
                    const toCurrency = parts[2];
                    const filteredData = this.getHistoricalData(historyType, fromCurrency, toCurrency, historyDays);
                    
                    if (filteredData.length > 0) {
                        allData.push({
                            fromCurrency,
                            toCurrency,
                            data: filteredData,
                            stats: this.calculateStatistics(filteredData)
                        });
                    }
                }
            }
        }

        if (allData.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <div class="icon">📊</div>
                    <h4>No Historical Data</h4>
                    <p>Start converting currencies and cryptocurrencies to build up historical data.</p>
                </div>
            `;
            return;
        }

        // Sort by most recent data
        allData.sort((a, b) => {
            const aLatest = Math.max(...a.data.map(d => d.timestamp));
            const bLatest = Math.max(...b.data.map(d => d.timestamp));
            return bLatest - aLatest;
        });

        // Display top 10 most recent pairs
        allData.slice(0, 10).forEach(item => {
            const historyElement = this.createHistoryElement(item, historyType);
            historyList.appendChild(historyElement);
        });
    }

    createHistoryElement(item, type) {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const stats = item.stats;
        const changeClass = stats.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = stats.change >= 0 ? '+' : '';
        
        div.innerHTML = `
            <div class="history-pair">
                ${item.fromCurrency.toUpperCase()} → ${item.toCurrency.toUpperCase()}
            </div>
            <div class="history-stats">
                <div class="stat-item">
                    <div class="stat-label">Current Rate</div>
                    <div class="stat-value">${stats.lastRate.toFixed(4)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Change</div>
                    <div class="stat-change ${changeClass}">${changeSymbol}${stats.change.toFixed(2)}%</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Average</div>
                    <div class="stat-value">${stats.avgRate.toFixed(4)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Volatility</div>
                    <div class="stat-value">${stats.volatility.toFixed(4)}</div>
                </div>
            </div>
            <div class="history-chart">
                <div class="chart-line"></div>
            </div>
        `;

        return div;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RateRadar();
}); 