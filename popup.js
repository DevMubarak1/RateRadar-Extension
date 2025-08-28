// RateRadar Simplified Popup JavaScript
class RateRadar {
    constructor() {
        this.currentTab = 'converter';
        this.settings = {};
        this.init();
    }

    async init() {
        try {
            console.log('RateRadar: Initializing popup...');
            
            // Load settings
            await this.loadSettings();
            
            // Setup UI event listeners
            this.setupUI();
            
            // Apply theme
            this.applyTheme();
            
            // Setup auto refresh if enabled
            this.setupAutoRefresh();
            
            // Perform initial conversions
            await this.performConversion();
            await this.performCryptoConversion();
            
            // Load data
            this.loadAlertsList();
            this.loadFavoritesList();
            this.loadHistoryList();
            
            // Setup settings sync
            this.setupSettingsSync();
            
            console.log('RateRadar: Popup initialized successfully');
            
        } catch (error) {
            console.error('RateRadar: Error during initialization:', error);
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['settings']);
            this.settings = result.settings || this.getDefaultSettings();
            
            // Apply settings immediately
            this.applySettings();
            
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = this.getDefaultSettings();
            this.applySettings();
        }
    }

    getDefaultSettings() {
        return {
            theme: 'auto', // Changed from 'light' to 'auto'
            autoRefresh: true,
            refreshInterval: 5,
            notifications: true,
            soundAlerts: false,
            smartShopping: true,
            baseCurrency: 'USD',
            decimalPlaces: 2,
            cacheDuration: 300,
            showTrends: true,
            alertCheckInterval: 5,
            maxAlerts: 10
        };
    }

    applySettings() {
        // Apply theme
        this.applyTheme(this.settings.theme);
        
        // Apply decimal places
        this.applyDecimalPlaces();
        
        // Apply base currency
        this.applyBaseCurrency();
        
        // Apply other settings
        this.applyOtherSettings();
    }

    applyTheme(theme) {
        const themeToApply = theme || this.settings.theme || 'auto';
        
        if (themeToApply === 'auto') {
            // Detect system theme
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            const actualTheme = prefersDark ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', actualTheme);
            console.log('Auto theme applied:', actualTheme);
            
            // Listen for system theme changes
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                    if (this.settings.theme === 'auto') {
                        const newTheme = e.matches ? 'dark' : 'light';
                        document.documentElement.setAttribute('data-theme', newTheme);
                        console.log('System theme changed to:', newTheme);
                    }
                });
            }
        } else {
            document.documentElement.setAttribute('data-theme', themeToApply);
            console.log('Theme applied:', themeToApply);
        }
    }

    applyDecimalPlaces() {
        const decimalPlaces = this.settings.decimalPlaces || 2;
        // Update display precision for all numeric inputs
        const numericInputs = document.querySelectorAll('input[type="number"]');
        numericInputs.forEach(input => {
            input.step = `0.${'0'.repeat(decimalPlaces - 1)}1`;
        });
    }

    applyBaseCurrency() {
        const baseCurrency = this.settings.baseCurrency || 'USD';
        // Update default currency selections if needed
        const fromCurrency = document.getElementById('fromCurrency');
        const toCurrency = document.getElementById('toCurrency');
        
        if (fromCurrency && !fromCurrency.value) {
            fromCurrency.value = baseCurrency;
        }
        
        if (toCurrency && !toCurrency.value) {
            toCurrency.value = baseCurrency === 'USD' ? 'EUR' : 'USD';
        }
    }

    applyOtherSettings() {
        // Apply other settings as needed
        console.log('Applied settings:', this.settings);
    }

    setupAutoRefresh() {
        if (this.settings.autoRefresh) {
            const interval = (this.settings.refreshInterval || 5) * 60 * 1000; // Convert to milliseconds
            this.autoRefreshInterval = setInterval(async () => {
                console.log('Auto refreshing rates...');
                await this.performConversion();
                await this.performCryptoConversion();
                
                // Check alerts after refreshing rates
                await this.checkAlerts();
            }, interval);
        }
        
        // Also set up alert checking interval
        this.setupAlertChecking();
    }

    setupAlertChecking() {
        const alertInterval = (this.settings.alertCheckInterval || 5) * 60 * 1000; // Convert to milliseconds
        this.alertCheckInterval = setInterval(async () => {
            await this.checkAlerts();
        }, alertInterval);
    }

    async checkAlerts() {
        try {
            if (!this.settings.notifications) {
                return; // Notifications disabled
            }

            const result = await chrome.storage.sync.get(['alerts']);
            const alerts = result.alerts || [];
            
            if (alerts.length === 0) {
                return;
            }

            console.log(`Checking ${alerts.length} alerts...`);

            for (const alert of alerts) {
                if (alert.status !== 'active') {
                    continue;
                }

                try {
                    let currentRate;
                    
                    // Check if it's a crypto alert
                    const isFromCrypto = this.isCryptoCurrency(alert.fromCurrency);
                    const isToCrypto = this.isCryptoCurrency(alert.toCurrency);
                    
                    if (isFromCrypto || isToCrypto) {
                        // Crypto alert
                        if (isFromCrypto && !isToCrypto) {
                            // Crypto to Fiat
                            currentRate = await this.getCryptoPrice(alert.fromCurrency, alert.toCurrency);
                        } else if (!isFromCrypto && isToCrypto) {
                            // Fiat to Crypto
                            currentRate = await this.getCryptoPrice(alert.toCurrency, alert.fromCurrency);
                            currentRate = 1 / currentRate; // Invert for fiat-to-crypto
                        } else if (isFromCrypto && isToCrypto) {
                            // Crypto to Crypto
                            const fromPrice = await this.getCryptoPrice(alert.fromCurrency, 'usd');
                            const toPrice = await this.getCryptoPrice(alert.toCurrency, 'usd');
                            currentRate = fromPrice / toPrice;
                        }
                    } else {
                        // Currency alert
                        currentRate = await this.getExchangeRate(alert.fromCurrency, alert.toCurrency);
                    }

                    if (currentRate && !isNaN(currentRate)) {
                        const shouldTrigger = this.checkAlertCondition(currentRate, alert.targetRate, alert.condition);
                        
                        if (shouldTrigger) {
                            await this.triggerAlert(alert, currentRate);
                        }
                    }
                } catch (error) {
                    console.error(`Error checking alert ${alert.id}:`, error);
                }
            }
        } catch (error) {
            console.error('Error checking alerts:', error);
        }
    }

    checkAlertCondition(currentRate, targetRate, condition) {
        if (condition === 'above') {
            return currentRate >= targetRate;
        } else if (condition === 'below') {
            return currentRate <= targetRate;
        }
        return false;
    }

    async triggerAlert(alert, currentRate) {
        try {
            // Create notification
            const notificationOptions = {
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'RateRadar Alert',
                message: `${alert.fromCurrency} to ${alert.toCurrency} is now ${currentRate.toFixed(4)} (${alert.condition} ${alert.targetRate})`,
                priority: 2
            };

            // Send notification
            if (this.settings.notifications) {
                chrome.notifications.create(`alert_${alert.id}`, notificationOptions);
            }

            // Play sound if enabled
            if (this.settings.soundAlerts) {
                this.playAlertSound();
            }

            // Mark alert as triggered (optional - you can remove this if you want alerts to trigger multiple times)
            // await this.markAlertAsTriggered(alert.id);

            console.log(`Alert triggered: ${alert.fromCurrency} to ${alert.toCurrency} = ${currentRate}`);
            
            // Show success message in popup
            this.showSuccessMessage(`Alert triggered: ${alert.fromCurrency} → ${alert.toCurrency} = ${currentRate.toFixed(4)} 🔔`);
            
        } catch (error) {
            console.error('Error triggering alert:', error);
        }
    }

    playAlertSound() {
        try {
            // Create audio context for alert sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.error('Error playing alert sound:', error);
        }
    }

    async markAlertAsTriggered(alertId) {
        try {
            const result = await chrome.storage.sync.get(['alerts']);
            const alerts = result.alerts || [];
            
            const alertIndex = alerts.findIndex(alert => alert.id === alertId);
            if (alertIndex !== -1) {
                alerts[alertIndex].lastTriggered = new Date().toISOString();
                alerts[alertIndex].triggerCount = (alerts[alertIndex].triggerCount || 0) + 1;
                
                await chrome.storage.sync.set({ alerts });
            }
        } catch (error) {
            console.error('Error marking alert as triggered:', error);
        }
    }

    setupSettingsSync() {
        // Listen for settings changes from options page
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync' && changes.settings) {
                console.log('Settings changed, updating...');
                this.settings = changes.settings.newValue || this.getDefaultSettings();
                this.applySettings();
                
                // Restart auto refresh if needed
                if (this.autoRefreshInterval) {
                    clearInterval(this.autoRefreshInterval);
                }
                this.setupAutoRefresh();
            }
        });
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
            // Prevent invalid input
            fromAmount.addEventListener('keypress', (e) => {
                const char = String.fromCharCode(e.which);
                if (!/[\d.]/.test(char) && e.which !== 8 && e.which !== 9) {
                    e.preventDefault();
                }
            });
        }
        if (fromCurrency) {
            fromCurrency.addEventListener('change', () => this.performConversion());
            // Initialize searchable dropdown after a short delay
            setTimeout(() => {
                this.makeDropdownSearchable(fromCurrency, this.getCurrencyOptions());
            }, 100);
        }
        if (toCurrency) {
            toCurrency.addEventListener('change', () => this.performConversion());
            setTimeout(() => {
                this.makeDropdownSearchable(toCurrency, this.getCurrencyOptions());
            }, 100);
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
            // Prevent invalid input
            fromCryptoAmount.addEventListener('keypress', (e) => {
                const char = String.fromCharCode(e.which);
                if (!/[\d.]/.test(char) && e.which !== 8 && e.which !== 9) {
                    e.preventDefault();
                }
            });
        }
        if (fromCrypto) {
            fromCrypto.addEventListener('change', () => this.performCryptoConversion());
            setTimeout(() => {
                this.makeDropdownSearchable(fromCrypto, this.getCryptoOptions());
            }, 100);
        }
        if (toCrypto) {
            toCrypto.addEventListener('change', () => this.performCryptoConversion());
            setTimeout(() => {
                this.makeDropdownSearchable(toCrypto, this.getCryptoOptions());
            }, 100);
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
        
        // Check online status
        this.checkOnlineStatus();
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
    }

    checkOnlineStatus() {
        const statusElement = document.getElementById('onlineStatus');
        if (!statusElement) return;
        
        const updateStatus = () => {
            // Check if we can reach a reliable endpoint
            fetch('https://api.exchangerate.host/latest?base=USD&symbols=EUR', { 
                method: 'HEAD',
                mode: 'no-cors'
            }).then(() => {
                statusElement.textContent = '🟢 Online';
                statusElement.className = 'status-indicator online';
                this.isOnline = true;
            }).catch(() => {
                // Fallback to navigator.onLine
                if (navigator.onLine) {
                    statusElement.textContent = '🟢 Online';
                    statusElement.className = 'status-indicator online';
                    this.isOnline = true;
                } else {
                    statusElement.textContent = '🔴 Offline';
                    statusElement.className = 'status-indicator offline';
                    this.isOnline = false;
                }
            });
        };
        
        // Initial check
        updateStatus();
        
        // Listen for online/offline events
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        
        // Also check periodically
        setInterval(updateStatus, 10000);
    }

    async performConversion() {
        try {
            const fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
            const fromCurrency = document.getElementById('fromCurrency').value;
            const toCurrency = document.getElementById('toCurrency').value;
            
            if (fromAmount <= 0) {
                document.getElementById('toAmount').value = '';
                document.getElementById('exchangeRate').textContent = `1 ${fromCurrency} = 0.00 ${toCurrency}`;
                return;
            }
            
            if (fromCurrency === toCurrency) {
                document.getElementById('toAmount').value = fromAmount.toFixed(2);
                document.getElementById('exchangeRate').textContent = `1 ${fromCurrency} = 1.00 ${toCurrency}`;
                return;
            }
            
            // Show loading state
            document.getElementById('toAmount').value = '';
            document.getElementById('exchangeRate').textContent = 'Fetching rate...';
            
            const rate = await this.getExchangeRate(fromCurrency, toCurrency);
            
            if (rate && !isNaN(rate)) {
                const convertedAmount = fromAmount * rate;
                document.getElementById('toAmount').value = convertedAmount.toFixed(2);
                document.getElementById('exchangeRate').textContent = `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
                
                // Update last updated time
                const lastUpdatedElement = document.getElementById('lastUpdated');
                if (lastUpdatedElement) {
                    lastUpdatedElement.textContent = new Date().toLocaleTimeString();
                }
                
                console.log(`Conversion successful: ${fromAmount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`);
            } else {
                throw new Error('Invalid exchange rate received');
            }
            
        } catch (error) {
            console.error('Conversion error:', error);
            document.getElementById('toAmount').value = '';
            document.getElementById('exchangeRate').textContent = 'Rate unavailable';
            this.showErrorMessage('Failed to convert currency. Please try again.');
        }
    }

    async performCryptoConversion() {
        try {
            const fromAmount = parseFloat(document.getElementById('fromCryptoAmount').value) || 0;
            const fromCrypto = document.getElementById('fromCrypto').value;
            const toCrypto = document.getElementById('toCrypto').value;
            
            if (fromAmount <= 0) {
                document.getElementById('toCryptoAmount').value = '';
                document.getElementById('cryptoPrice').textContent = '0.00';
                document.getElementById('cryptoChange').textContent = '+0.00%';
                return;
            }
            
            if (fromCrypto === toCrypto) {
                document.getElementById('toCryptoAmount').value = fromAmount.toFixed(6);
                document.getElementById('cryptoPrice').textContent = '1.00';
                document.getElementById('cryptoChange').textContent = '+0.00%';
                return;
            }
            
            // Show loading state
            document.getElementById('toCryptoAmount').value = '';
            document.getElementById('cryptoPrice').textContent = 'Fetching...';
            document.getElementById('cryptoChange').textContent = '...';
            
            let convertedAmount, price;
            
            // Check if both are cryptocurrencies
            const isFromCrypto = this.isCryptoCurrency(fromCrypto);
            const isToCrypto = this.isCryptoCurrency(toCrypto);
            
            if (isFromCrypto && isToCrypto) {
                // Crypto to Crypto conversion
                price = await this.getCryptoPrice(fromCrypto, 'usd');
                const toCryptoPrice = await this.getCryptoPrice(toCrypto, 'usd');
                
                if (price && toCryptoPrice) {
                    convertedAmount = (fromAmount * price) / toCryptoPrice;
                    price = price / toCryptoPrice; // Show exchange rate
                }
            } else if (isFromCrypto && !isToCrypto) {
                // Crypto to Fiat conversion
                price = await this.getCryptoPrice(fromCrypto, toCrypto);
                convertedAmount = fromAmount * price;
            } else if (!isFromCrypto && isToCrypto) {
                // Fiat to Crypto conversion
                price = await this.getCryptoPrice(toCrypto, fromCrypto);
                convertedAmount = fromAmount / price;
            } else {
                // Fiat to Fiat conversion (fallback to regular currency conversion)
                const rate = await this.getExchangeRate(fromCrypto, toCrypto);
                convertedAmount = fromAmount * rate;
                price = rate;
            }
            
            if (convertedAmount && !isNaN(convertedAmount)) {
                // Format large numbers properly - avoid scientific notation
                let displayAmount;
                if (convertedAmount >= 1000000) {
                    // Use locale string for large numbers to avoid scientific notation
                    displayAmount = convertedAmount.toLocaleString('en-US', { 
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2
                    });
                } else if (convertedAmount >= 1000) {
                    displayAmount = convertedAmount.toLocaleString('en-US', { 
                        maximumFractionDigits: 6,
                        minimumFractionDigits: 2
                    });
                } else {
                    displayAmount = convertedAmount.toFixed(6);
                }
                
                // Set the value without commas for the input field
                document.getElementById('toCryptoAmount').value = convertedAmount.toFixed(6);
                
                // Format price display
                if (isFromCrypto && isToCrypto) {
                    document.getElementById('cryptoPrice').textContent = `1 ${fromCrypto.toUpperCase()} = ${price.toFixed(6)} ${toCrypto.toUpperCase()}`;
                } else if (isFromCrypto && !isToCrypto) {
                    const currencySymbol = this.getCurrencySymbol(toCrypto);
                    document.getElementById('cryptoPrice').textContent = `${currencySymbol}${price.toFixed(2)}`;
                } else {
                    document.getElementById('cryptoPrice').textContent = `${price.toFixed(6)}`;
                }
                
                // Get 24h change for crypto
                if (isFromCrypto) {
                    try {
                        const change = await this.getCryptoChange(fromCrypto);
                        if (change && !isNaN(change)) {
                            const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                            document.getElementById('cryptoChange').textContent = changeText;
                            document.getElementById('cryptoChange').className = `change-text ${change >= 0 ? 'positive' : 'negative'}`;
                        } else {
                            document.getElementById('cryptoChange').textContent = '+0.00%';
                            document.getElementById('cryptoChange').className = 'change-text positive';
                        }
                    } catch (changeError) {
                        console.log('Could not fetch 24h change:', changeError);
                        document.getElementById('cryptoChange').textContent = '+0.00%';
                        document.getElementById('cryptoChange').className = 'change-text positive';
                    }
                } else {
                    document.getElementById('cryptoChange').textContent = 'N/A';
                    document.getElementById('cryptoChange').className = 'change-text';
                }
                
                console.log(`Crypto conversion successful: ${fromAmount} ${fromCrypto} = ${displayAmount} ${toCrypto}`);
            } else {
                throw new Error('Invalid conversion result received');
            }
            
        } catch (error) {
            console.error('Crypto conversion error:', error);
            document.getElementById('toCryptoAmount').value = '';
            document.getElementById('cryptoPrice').textContent = 'Error';
            document.getElementById('cryptoChange').textContent = 'Error';
            this.showErrorMessage('Failed to convert cryptocurrency. Please try again.');
        }
    }

    // Helper function to get currency symbol
    getCurrencySymbol(currency) {
        const currencySymbols = {
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
            'mvr': 'Rf',
            'btn': 'Nu.',
            'mop': 'MOP$',
            'fjd': 'FJ$',
            'wst': 'T',
            'top': 'T$',
            'vuv': 'VT',
            'sbd': 'SI$',
            'pgk': 'K',
            'nzd': 'NZ$'
        };
        
        return currencySymbols[currency.toLowerCase()] || currency.toUpperCase();
    }

    // Helper function to check if a currency is crypto
    isCryptoCurrency(currency) {
        const cryptoCurrencies = [
            'bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana', 'ripple', 'polkadot', 'dogecoin',
            'avalanche-2', 'chainlink', 'matic-network', 'litecoin', 'uniswap', 'stellar', 'vechain',
            'filecoin', 'tron', 'monero', 'eos', 'aave', 'algorand', 'tezos', 'cosmos', 'neo', 'dash',
            'zcash', 'bitcoin-cash', 'ethereum-classic', 'iota', 'nem', 'waves', 'decred', 'qtum',
            'omisego', 'icon', 'zilliqa', '0x', 'basic-attention-token', 'augur', 'golem', 'siacoin',
            'digibyte', 'verge', 'steem', 'pivx', 'komodo', 'ardor', 'stratis', 'nxt', 'factom',
            'maidsafecoin', 'peercoin', 'namecoin', 'feathercoin', 'novacoin', 'primecoin', 'gridcoin',
            'vertcoin', 'potcoin', 'megacoin', 'auroracoin', 'reddcoin', 'blackcoin', 'nushares',
            'nubits', 'mazacoin', 'burst', 'counterparty', 'omni', 'bitshares', 'zcoin', 'zencash',
            'horizen', 'aeon', 'sumokoin', 'masari', 'turtlecoin', 'karbo', 'haven', 'loki-network',
            'wownero', 'ryo-currency', 'lethean', 'dero', 'graft', 'stellite', 'triton', 'conceal',
            'plenteum', 'italocoin', 'dinastycoin', 'bitcoin-private', 'bitcoin-gold', 'bitcoin-diamond',
            'bitcoin-cash-abc', 'bitcoin-sv', 'polygon', 'compound', 'sushi', 'pancakeswap-token',
            'curve-dao-token', 'yearn-finance', 'synthetix-network-token', 'balancer', '1inch', 'nano',
            'ontology', 'harmony', 'elrond-erd-2', 'near', 'fantom', 'the-graph', 'decentraland',
            'sandbox', 'enjincoin', 'axie-infinity', 'gala', 'chiliz', 'flow', 'internet-computer',
            'theta-token', 'vega-protocol', 'celo', 'kusama'
        ];
        return cryptoCurrencies.includes(currency.toLowerCase());
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
        fromAmount.value = toAmount.value || '';
        toAmount.value = tempAmount || '';
        
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
        fromAmount.value = toAmount.value || '';
        toAmount.value = tempAmount || '';
        
        this.performCryptoConversion();
    }

    showAlertModal(type = 'custom') {
        const modal = document.getElementById('alertModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.populateCurrencyOptions(type);
        }
    }

    populateCurrencyOptions(type = 'custom') {
        // Populate From Currency dropdown
        const fromCurrencySelect = document.getElementById('alertFromCurrency');
        const toCurrencySelect = document.getElementById('alertToCurrency');
        
        if (fromCurrencySelect && toCurrencySelect) {
            // Clear existing options
            fromCurrencySelect.innerHTML = '';
            toCurrencySelect.innerHTML = '';
            
            let options = [];
            
            if (type === 'currency') {
                // Currency only options
                options = this.getCurrencyOptions();
            } else if (type === 'crypto') {
                // Crypto only options
                options = this.getCryptoOptions();
            } else {
                // Combined options for custom alerts
                options = [
                    ...this.getCurrencyOptions(),
                    ...this.getCryptoOptions()
                ];
            }
            
            // Add currencies to both dropdowns
            options.forEach(option => {
                const fromOption = document.createElement('option');
                fromOption.value = option.value;
                fromOption.textContent = option.text;
                fromCurrencySelect.appendChild(fromOption);
                
                const toOption = document.createElement('option');
                toOption.value = option.value;
                toOption.textContent = option.text;
                toCurrencySelect.appendChild(toOption);
            });
            
            // Set default values based on type
            if (type === 'currency') {
                fromCurrencySelect.value = 'USD';
                toCurrencySelect.value = 'EUR';
            } else if (type === 'crypto') {
                fromCurrencySelect.value = 'bitcoin';
                toCurrencySelect.value = 'usd';
            } else {
                fromCurrencySelect.value = 'USD';
                toCurrencySelect.value = 'EUR';
            }
            
            // Make dropdowns searchable
            this.makeDropdownSearchable(fromCurrencySelect, options);
            this.makeDropdownSearchable(toCurrencySelect, options);
        }
    }

    hideAlertModal() {
        const modal = document.getElementById('alertModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async saveAlert() {
        try {
            const fromCurrency = document.getElementById('alertFromCurrency').value;
            const toCurrency = document.getElementById('alertToCurrency').value;
            const targetRate = parseFloat(document.getElementById('alertTargetRate').value);
            const condition = document.getElementById('alertCondition').value;
            const description = document.getElementById('alertDescription').value || `${fromCurrency} to ${toCurrency}`;
            
            if (!targetRate || targetRate <= 0) {
                alert('Please enter a valid target rate');
                return;
            }
            
            // Create new alert
            const newAlert = {
                id: Date.now().toString(),
                fromCurrency,
                toCurrency,
                targetRate,
                condition,
                description,
                status: 'active',
                createdAt: new Date().toISOString()
            };
            
            // Load existing alerts
            const result = await chrome.storage.sync.get(['alerts']);
            const alerts = result.alerts || [];
            
            // Add new alert
            alerts.push(newAlert);
            
            // Save back to storage
            await chrome.storage.sync.set({ alerts });
            
            // Clear form
            document.getElementById('alertTargetRate').value = '';
            document.getElementById('alertDescription').value = '';
            
            // Hide modal and reload alerts list
            this.hideAlertModal();
            this.loadAlertsList();
            
            // Show success message
            this.showSuccessMessage('Alert saved successfully! 🔔');
            
            console.log('Alert saved successfully:', newAlert);
            
        } catch (error) {
            console.error('Error saving alert:', error);
            this.showErrorMessage('Failed to save alert. Please try again.');
        }
    }

    showSuccessMessage(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            animation: slideInRight 0.3s ease-out;
        `;
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successDiv.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 300);
        }, 3000);
    }

    showErrorMessage(message) {
        // Create a temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--error-color);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            animation: slideInRight 0.3s ease-out;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            errorDiv.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 300);
        }, 3000);
    }

    async addToFavorites(type) {
        try {
            let fromCurrency, toCurrency, fromAmount, toAmount, rate;
            
            if (type === 'currency') {
                fromCurrency = document.getElementById('fromCurrency').value;
                toCurrency = document.getElementById('toCurrency').value;
                fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
                toAmount = parseFloat(document.getElementById('toAmount').value) || 0;
                rate = document.getElementById('exchangeRate').textContent;
            } else if (type === 'crypto') {
                fromCurrency = document.getElementById('fromCrypto').value;
                toCurrency = document.getElementById('toCrypto').value;
                fromAmount = parseFloat(document.getElementById('fromCryptoAmount').value) || 0;
                toAmount = parseFloat(document.getElementById('toCryptoAmount').value) || 0;
                rate = document.getElementById('cryptoPrice').textContent;
            }
            
            if (!fromCurrency || !toCurrency || fromAmount <= 0) {
                this.showErrorMessage('Please enter valid amounts and select currencies first');
                return;
            }
            
            // Create favorite pair
            const favorite = {
                id: Date.now().toString(),
                fromCurrency,
                toCurrency,
                fromAmount,
                toAmount,
                rate,
                type,
                createdAt: new Date().toISOString()
            };
            
            // Load existing favorites
            const result = await chrome.storage.sync.get(['favorites']);
            const favorites = result.favorites || [];
            
            // Check if already exists
            const exists = favorites.find(fav => 
                fav.fromCurrency === fromCurrency && 
                fav.toCurrency === toCurrency && 
                fav.type === type
            );
            
            if (exists) {
                this.showErrorMessage('This pair is already in your favorites');
                return;
            }
            
            // Add to favorites
            favorites.push(favorite);
            
            // Save to storage
            await chrome.storage.sync.set({ favorites });
            
            // Reload favorites list
            this.loadFavoritesList();
            
            // Show success message
            this.showSuccessMessage('Added to favorites! ⭐');
            
            console.log('Added to favorites:', favorite);
            
        } catch (error) {
            console.error('Error adding to favorites:', error);
            this.showErrorMessage('Failed to add to favorites');
        }
    }

    async loadFavoritesList() {
        const favoritesList = document.getElementById('favoritesList');
        if (favoritesList) {
            try {
                // Load favorites from storage
                const result = await chrome.storage.sync.get(['favorites']);
                let favorites = result.favorites || [];
                
                // Add sample favorites if none exist
                if (favorites.length === 0) {
                    favorites = [
                        {
                            id: 'sample1',
                            fromCurrency: 'USD',
                            toCurrency: 'EUR',
                            fromAmount: 100,
                            toAmount: 85,
                            rate: '1 USD = 0.85 EUR',
                            type: 'currency',
                            createdAt: new Date().toISOString(),
                            isSample: true
                        },
                        {
                            id: 'sample2',
                            fromCurrency: 'bitcoin',
                            toCurrency: 'usd',
                            fromAmount: 1,
                            toAmount: 45000,
                            rate: this.getCurrencySymbol('usd') + '45,000',
                            type: 'crypto',
                            createdAt: new Date().toISOString(),
                            isSample: true
                        },
                        {
                            id: 'sample3',
                            fromCurrency: 'ethereum',
                            toCurrency: 'usd',
                            fromAmount: 1,
                            toAmount: 3200,
                            rate: this.getCurrencySymbol('usd') + '3,200',
                            type: 'crypto',
                            createdAt: new Date().toISOString(),
                            isSample: true
                        }
                    ];
                }
                
                if (favorites.length === 0) {
                    favoritesList.innerHTML = `
                        <div class="empty-state">
                            <div class="icon">⭐</div>
                            <h4>No Favorites</h4>
                            <p>Add currency pairs to your favorites for quick access.</p>
                        </div>
                    `;
                } else {
                    favoritesList.innerHTML = favorites.map(favorite => `
                        <div class="favorite-item" data-favorite-id="${favorite.id}">
                            <div class="favorite-info">
                                <div class="favorite-title">${favorite.fromCurrency} → ${favorite.toCurrency}</div>
                                <div class="favorite-details">${favorite.type === 'crypto' ? 'Cryptocurrency' : 'Currency'} Pair</div>
                                <div class="favorite-rate">${favorite.rate}</div>
                                ${favorite.isSample ? '<div class="sample-badge">Sample</div>' : ''}
                            </div>
                            <div class="favorite-actions">
                                <button class="use-favorite-btn" data-favorite-id="${favorite.id}">Use</button>
                                <button class="delete-favorite-btn" data-favorite-id="${favorite.id}">Remove</button>
                            </div>
                        </div>
                    `).join('');
                    
                    // Add event listeners to buttons
                    favoritesList.querySelectorAll('.use-favorite-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.preventDefault();
                            const favoriteId = btn.getAttribute('data-favorite-id');
                            this.useFavorite(favoriteId);
                        });
                    });
                    
                    favoritesList.querySelectorAll('.delete-favorite-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.preventDefault();
                            const favoriteId = btn.getAttribute('data-favorite-id');
                            this.deleteFavorite(favoriteId);
                        });
                    });
                }
            } catch (error) {
                console.error('Error loading favorites:', error);
                favoritesList.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">⭐</div>
                        <h4>Error Loading Favorites</h4>
                        <p>Failed to load favorites. Please try refreshing the extension.</p>
                    </div>
                `;
            }
        }
    }

    async useFavorite(favoriteId) {
        try {
            const result = await chrome.storage.sync.get(['favorites']);
            const favorites = result.favorites || [];
            
            const favorite = favorites.find(fav => fav.id === favoriteId);
            if (!favorite) {
                console.log('Sample favorite used');
                // Handle sample favorites
                if (favoriteId === 'sample1') {
                    // USD to EUR
                    document.getElementById('fromCurrency').value = 'USD';
                    document.getElementById('toCurrency').value = 'EUR';
                    document.getElementById('fromAmount').value = '100';
                    this.performConversion();
                    this.switchTab('converter');
                } else if (favoriteId === 'sample2') {
                    // BTC to USD
                    document.getElementById('fromCrypto').value = 'bitcoin';
                    document.getElementById('toCrypto').value = 'usd';
                    document.getElementById('fromCryptoAmount').value = '1';
                    this.performCryptoConversion();
                    this.switchTab('crypto');
                } else if (favoriteId === 'sample3') {
                    // ETH to USD
                    document.getElementById('fromCrypto').value = 'ethereum';
                    document.getElementById('toCrypto').value = 'usd';
                    document.getElementById('fromCryptoAmount').value = '1';
                    this.performCryptoConversion();
                    this.switchTab('crypto');
                }
                return;
            }
            
            // Apply favorite to current tab
            if (favorite.type === 'currency') {
                document.getElementById('fromCurrency').value = favorite.fromCurrency;
                document.getElementById('toCurrency').value = favorite.toCurrency;
                document.getElementById('fromAmount').value = favorite.fromAmount;
                this.performConversion();
                this.switchTab('converter');
            } else if (favorite.type === 'crypto') {
                document.getElementById('fromCrypto').value = favorite.fromCurrency;
                document.getElementById('toCrypto').value = favorite.toCurrency;
                document.getElementById('fromCryptoAmount').value = favorite.fromAmount;
                this.performCryptoConversion();
                this.switchTab('crypto');
            }
            
            this.showSuccessMessage('Favorite applied! 🎯');
            
        } catch (error) {
            console.error('Error using favorite:', error);
            this.showErrorMessage('Failed to apply favorite');
        }
    }

    async deleteFavorite(favoriteId) {
        try {
            if (!confirm('Are you sure you want to remove this favorite?')) {
                return;
            }
            
            const result = await chrome.storage.sync.get(['favorites']);
            let favorites = result.favorites || [];
            
            // Remove the favorite (including sample favorites)
            favorites = favorites.filter(fav => fav.id !== favoriteId);
            
            // Save updated favorites
            await chrome.storage.sync.set({ favorites });
            
            // Reload favorites list
            this.loadFavoritesList();
            
            console.log(`Favorite ${favoriteId} deleted`);
        } catch (error) {
            console.error('Error deleting favorite:', error);
        }
    }

    async loadAlertsList() {
        const alertsList = document.getElementById('alertsList');
        if (alertsList) {
            try {
                // Load alerts from storage
                const result = await chrome.storage.sync.get(['alerts']);
                let alerts = result.alerts || [];
                
                // Add sample alerts if no alerts exist
                if (alerts.length === 0) {
                    alerts = [
                        {
                            id: 'sample1',
                            title: 'BTC Price Alert',
                            details: 'Bitcoin above $50,000',
                            status: 'active',
                            condition: 'above',
                            target: 50000,
                            fromCurrency: 'bitcoin',
                            toCurrency: 'usd',
                            targetRate: 50000,
                            description: 'Bitcoin above $50,000',
                            createdAt: new Date().toISOString(),
                            isSample: true,
                            type: 'crypto'
                        },
                        {
                            id: 'sample2',
                            title: 'EUR/USD Alert',
                            details: 'Euro below 0.85 USD',
                            status: 'inactive',
                            condition: 'below',
                            target: 0.85,
                            fromCurrency: 'EUR',
                            toCurrency: 'USD',
                            targetRate: 0.85,
                            description: 'Euro below 0.85 USD',
                            createdAt: new Date().toISOString(),
                            isSample: true,
                            type: 'currency'
                        },
                        {
                            id: 'sample3',
                            title: 'ETH to BTC Alert',
                            details: 'Ethereum above 0.05 BTC',
                            status: 'active',
                            condition: 'above',
                            target: 0.05,
                            fromCurrency: 'ethereum',
                            toCurrency: 'bitcoin',
                            targetRate: 0.05,
                            description: 'Ethereum above 0.05 BTC',
                            createdAt: new Date().toISOString(),
                            isSample: true,
                            type: 'crypto'
                        }
                    ];
                }
                
                if (alerts.length === 0) {
                    alertsList.innerHTML = `
                        <div class="empty-state">
                            <div class="icon">🔔</div>
                            <h4>No Alerts Set</h4>
                            <p>Create your first rate alert to get notified when prices reach your target.</p>
                        </div>
                    `;
                } else {
                    alertsList.innerHTML = alerts.map(alert => `
                        <div class="alert-item" data-alert-id="${alert.id}">
                            <div class="alert-info">
                                <div class="alert-title">${alert.description || `${alert.fromCurrency} to ${alert.toCurrency}`}</div>
                                <div class="alert-details">
                                    ${alert.fromCurrency} ${alert.condition} ${alert.targetRate} ${alert.toCurrency}
                                    <span class="alert-type ${alert.type || 'currency'}">${alert.type || 'currency'}</span>
                                </div>
                                <div class="alert-status ${alert.status}">${alert.status.toUpperCase()}</div>
                            </div>
                            <div class="alert-actions">
                                <button class="toggle-alert-btn" data-alert-id="${alert.id}">
                                    ${alert.status === 'active' ? 'Disable' : 'Enable'}
                                </button>
                                <button class="delete-alert-btn" data-alert-id="${alert.id}">Delete</button>
                            </div>
                        </div>
                    `).join('');
                    
                    // Add event listeners to buttons
                    alertsList.querySelectorAll('.toggle-alert-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.preventDefault();
                            const alertId = btn.getAttribute('data-alert-id');
                            this.toggleAlert(alertId);
                        });
                    });
                    
                    alertsList.querySelectorAll('.delete-alert-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.preventDefault();
                            const alertId = btn.getAttribute('data-alert-id');
                            this.deleteAlert(alertId);
                        });
                    });
                }
            } catch (error) {
                console.error('Error loading alerts:', error);
                alertsList.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">🔔</div>
                        <h4>Error Loading Alerts</h4>
                        <p>Failed to load alerts. Please try refreshing the extension.</p>
                    </div>
                `;
            }
        }
    }

    async toggleAlert(alertId) {
        try {
            const result = await chrome.storage.sync.get(['alerts']);
            let alerts = result.alerts || [];
            
            // Find and toggle the alert
            const alertIndex = alerts.findIndex(alert => alert.id === alertId);
            if (alertIndex !== -1) {
                alerts[alertIndex].status = alerts[alertIndex].status === 'active' ? 'inactive' : 'active';
                
                // Save updated alerts
                await chrome.storage.sync.set({ alerts });
                
                // Reload alerts list
                this.loadAlertsList();
                
                console.log(`Alert ${alertId} ${alerts[alertIndex].status}`);
            } else {
                // Handle sample alerts (they're not in storage)
                console.log(`Toggling sample alert ${alertId}`);
                // For sample alerts, just reload to show the change
                this.loadAlertsList();
            }
        } catch (error) {
            console.error('Error toggling alert:', error);
        }
    }

    async deleteAlert(alertId) {
        try {
            if (!confirm('Are you sure you want to delete this alert?')) {
                return;
            }
            
            const result = await chrome.storage.sync.get(['alerts']);
            let alerts = result.alerts || [];
            
            // Remove the alert
            alerts = alerts.filter(alert => alert.id !== alertId);
            
            // Save updated alerts
            await chrome.storage.sync.set({ alerts });
            
            // Reload alerts list
            this.loadAlertsList();
            
            console.log(`Alert ${alertId} deleted`);
        } catch (error) {
            console.error('Error deleting alert:', error);
        }
    }

    async loadHistoryList() {
        const historyList = document.getElementById('historyList');
        if (historyList) {
            // Sample historical data
            const sampleData = [
                {
                    pair: 'USD → EUR',
                    min: 0.82,
                    max: 0.88,
                    avg: 0.85,
                    change: '+2.3%',
                    positive: true
                },
                {
                    pair: 'BTC → USD',
                    min: 42000,
                    max: 48000,
                    avg: 45000,
                    change: '-1.2%',
                    positive: false
                },
                {
                    pair: 'ETH → USD',
                    min: 3000,
                    max: 3400,
                    avg: 3200,
                    change: '+5.7%',
                    positive: true
                }
            ];
            
            if (sampleData.length === 0) {
                historyList.innerHTML = `
                    <div class="empty-history">
                        <div class="icon">📊</div>
                        <h4>No Historical Data</h4>
                        <p>Start converting currencies and cryptocurrencies to build up historical data.</p>
                    </div>
                `;
            } else {
                historyList.innerHTML = sampleData.map(item => `
                    <div class="history-item">
                        <div class="history-pair">${item.pair}</div>
                        <div class="history-stats">
                            <div class="stat-item">
                                <div class="stat-label">Min</div>
                                <div class="stat-value">${item.min.toLocaleString()}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Max</div>
                                <div class="stat-value">${item.max.toLocaleString()}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Avg</div>
                                <div class="stat-value">${item.avg.toLocaleString()}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Change</div>
                                <div class="stat-change ${item.positive ? 'positive' : 'negative'}">${item.change}</div>
                            </div>
                        </div>
                        <div class="history-chart">
                            <div class="chart-line"></div>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    async getExchangeRate(fromCurrency, toCurrency) {
        try {
            console.log(`Fetching rate: ${fromCurrency} to ${toCurrency}`);
            
            // Try multiple API endpoints for reliability
            const apis = [
                {
                    url: `https://api.exchangerate.host/latest?base=${fromCurrency.toUpperCase()}&symbols=${toCurrency.toUpperCase()}`,
                    handler: (data) => data.rates && data.rates[toCurrency.toUpperCase()]
                },
                {
                    url: `https://latest.currency-api.pages.dev/v1/currencies/${fromCurrency.toLowerCase()}.json`,
                    handler: (data) => data[fromCurrency.toLowerCase()] && data[fromCurrency.toLowerCase()][toCurrency.toLowerCase()]
                },
                {
                    url: `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${fromCurrency.toLowerCase()}.json`,
                    handler: (data) => data[fromCurrency.toLowerCase()] && data[fromCurrency.toLowerCase()][toCurrency.toLowerCase()]
                }
            ];
            
            for (let i = 0; i < apis.length; i++) {
                try {
                    console.log(`Trying API ${i + 1}: ${apis[i].url}`);
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000);
                    
                    const response = await fetch(apis[i].url, { 
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'RateRadar/1.0'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`API ${i + 1} response:`, data);
                        
                        const rate = apis[i].handler(data);
                        if (rate) {
                            console.log(`Success! Rate: ${rate}`);
                            return parseFloat(rate);
                        }
                    }
                } catch (apiError) {
                    console.log(`API ${i + 1} failed:`, apiError.message);
                    continue;
                }
            }
            
            // If all APIs fail, return a fallback rate (1:1 for same currency, 0 for others)
            if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) {
                return 1;
            }
            
            throw new Error('All exchange rate APIs failed');
            
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            throw error;
        }
    }

    async getCryptoPrice(cryptoId, targetCurrency = 'usd') {
        try {
            console.log(`Fetching crypto price: ${cryptoId} to ${targetCurrency}`);
            
            // Map common crypto names to CoinGecko IDs
            const cryptoMap = {
                'bitcoin': 'bitcoin', 'btc': 'bitcoin',
                'ethereum': 'ethereum', 'eth': 'ethereum',
                'binancecoin': 'binancecoin', 'bnb': 'binancecoin',
                'cardano': 'cardano', 'ada': 'cardano',
                'solana': 'solana', 'sol': 'solana',
                'ripple': 'ripple', 'xrp': 'ripple',
                'polkadot': 'polkadot', 'dot': 'polkadot',
                'dogecoin': 'dogecoin', 'doge': 'dogecoin',
                'avalanche-2': 'avalanche-2', 'avax': 'avalanche-2',
                'chainlink': 'chainlink', 'link': 'chainlink',
                'matic-network': 'matic-network', 'matic': 'matic-network',
                'litecoin': 'litecoin', 'ltc': 'litecoin',
                'uniswap': 'uniswap', 'uni': 'uniswap',
                'stellar': 'stellar', 'xlm': 'stellar',
                'vechain': 'vechain', 'vet': 'vechain',
                'filecoin': 'filecoin', 'fil': 'filecoin',
                'tron': 'tron', 'trx': 'tron',
                'monero': 'monero', 'xmr': 'monero',
                'eos': 'eos', 'aave': 'aave',
                'algorand': 'algorand', 'algo': 'algorand',
                'tezos': 'tezos', 'xtz': 'tezos',
                'cosmos': 'cosmos', 'atom': 'cosmos',
                'neo': 'neo', 'dash': 'dash',
                'zcash': 'zcash', 'zec': 'zcash',
                'bitcoin-cash': 'bitcoin-cash', 'bch': 'bitcoin-cash',
                'iota': 'iota', 'miota': 'iota',
                'nem': 'nem', 'xem': 'nem',
                'waves': 'waves', 'decred': 'decred', 'dcr': 'decred',
                'qtum': 'qtum', 'omisego': 'omisego', 'omg': 'omisego',
                'icon': 'icon', 'icx': 'icon',
                'zilliqa': 'zilliqa', 'zil': 'zilliqa',
                '0x': '0x', 'zrx': '0x',
                'basic-attention-token': 'basic-attention-token', 'bat': 'basic-attention-token',
                'augur': 'augur', 'rep': 'augur',
                'golem': 'golem', 'gnt': 'golem',
                'siacoin': 'siacoin', 'sc': 'siacoin',
                'digibyte': 'digibyte', 'dgb': 'digibyte',
                'verge': 'verge', 'xvg': 'verge',
                'steem': 'steem', 'pivx': 'pivx',
                'komodo': 'komodo', 'kmd': 'komodo',
                'ardor': 'ardor', 'ardr': 'ardor',
                'stratis': 'stratis', 'strat': 'stratis',
                'nxt': 'nxt', 'factom': 'factom', 'fct': 'factom',
                'maidsafecoin': 'maidsafecoin', 'maid': 'maidsafecoin',
                'peercoin': 'peercoin', 'ppc': 'peercoin',
                'namecoin': 'namecoin', 'nmc': 'namecoin',
                'feathercoin': 'feathercoin', 'ftc': 'feathercoin',
                'novacoin': 'novacoin', 'nvc': 'novacoin',
                'primecoin': 'primecoin', 'xpm': 'primecoin',
                'gridcoin': 'gridcoin', 'grc': 'gridcoin',
                'vertcoin': 'vertcoin', 'vtc': 'vertcoin',
                'potcoin': 'potcoin', 'pot': 'potcoin',
                'megacoin': 'megacoin', 'mec': 'megacoin',
                'auroracoin': 'auroracoin', 'aur': 'auroracoin',
                'reddcoin': 'reddcoin', 'rdd': 'reddcoin',
                'blackcoin': 'blackcoin', 'blk': 'blackcoin',
                'nushares': 'nushares', 'nsr': 'nushares',
                'nubits': 'nubits', 'usnbt': 'nubits',
                'mazacoin': 'mazacoin', 'mzc': 'mazacoin',
                'burst': 'burst', 'counterparty': 'counterparty', 'xcp': 'counterparty',
                'omni': 'omni', 'mastercoin': 'omni', 'msc': 'omni',
                'bitshares': 'bitshares', 'bts': 'bitshares',
                'zcoin': 'zcoin', 'xzc': 'zcoin',
                'zencash': 'zencash', 'zen': 'zencash',
                'horizen': 'horizen', 'aeon': 'aeon',
                'sumokoin': 'sumokoin', 'sumo': 'sumokoin',
                'masari': 'masari', 'msr': 'masari',
                'turtlecoin': 'turtlecoin', 'trtl': 'turtlecoin',
                'karbo': 'karbo', 'krb': 'karbo',
                'haven': 'haven', 'xhv': 'haven',
                'loki-network': 'loki-network',
                'wownero': 'wownero', 'wow': 'wownero',
                'ryo-currency': 'ryo-currency',
                'lethean': 'lethean', 'lthn': 'lethean',
                'dero': 'dero', 'graft': 'graft', 'grft': 'graft',
                'stellite': 'stellite', 'xla': 'stellite',
                'triton': 'triton', 'xeq': 'triton',
                'conceal': 'conceal', 'ccx': 'conceal',
                'plenteum': 'plenteum', 'pltx': 'plenteum',
                'italocoin': 'italocoin', 'ita': 'italocoin',
                'dinastycoin': 'dinastycoin', 'dcy': 'dinastycoin',
                'bitcoin-private': 'bitcoin-private', 'btcp': 'bitcoin-private',
                'bitcoin-gold': 'bitcoin-gold', 'btg': 'bitcoin-gold',
                'bitcoin-diamond': 'bitcoin-diamond', 'bcd': 'bitcoin-diamond',
                'bitcoin-cash-abc': 'bitcoin-cash-abc', 'bcha': 'bitcoin-cash-abc',
                'bitcoin-sv': 'bitcoin-sv', 'bsv': 'bitcoin-sv',
                'ethereum-classic': 'ethereum-classic', 'etc': 'ethereum-classic'
            };
            
            // Get the correct CoinGecko ID
            const coinGeckoId = cryptoMap[cryptoId.toLowerCase()] || cryptoId.toLowerCase();
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=${targetCurrency}&include_24hr_change=true`, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'RateRadar/1.0'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`Crypto API response:`, data);
                
                if (data[coinGeckoId] && data[coinGeckoId][targetCurrency]) {
                    const price = data[coinGeckoId][targetCurrency];
                    console.log(`Success! Crypto price: ${price}`);
                    return parseFloat(price);
                }
            }
            
            throw new Error('Failed to fetch crypto price');
            
        } catch (error) {
            console.error('Error fetching crypto price:', error);
            throw error;
        }
    }

    async getCryptoChange(cryptoId) {
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd&include_24hr_change=true`);
            
            if (response.ok) {
                const data = await response.json();
                if (data[cryptoId] && data[cryptoId].usd_24h_change !== undefined) {
                    return data[cryptoId].usd_24h_change;
                }
            }
            
            throw new Error('Failed to fetch crypto change');
            
        } catch (error) {
            console.error('Error fetching crypto change:', error);
            throw error;
        }
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

    makeDropdownSearchable(selectElement, options) {
        // Check if already converted
        if (selectElement.parentNode.querySelector('.searchable-dropdown-wrapper')) {
            return;
        }
        
        // Create a wrapper div
        const wrapper = document.createElement('div');
        wrapper.className = 'searchable-dropdown-wrapper';
        wrapper.style.cssText = `
            position: relative;
            width: 100%;
        `;
        
        // Create search input
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'searchable-dropdown-input';
        searchInput.placeholder = 'Type to search...';
        searchInput.style.cssText = `
            width: 100%;
            padding: 12px 32px 12px 16px;
            border: 2px solid var(--input-border);
            border-radius: 12px;
            background: var(--input-bg);
            color: var(--input-text);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: center;
        `;
        
        // Create dropdown list
        const dropdownList = document.createElement('div');
        dropdownList.className = 'searchable-dropdown-list';
        dropdownList.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--dropdown-bg);
            border: 1px solid var(--dropdown-border);
            border-radius: 8px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            box-shadow: 0 4px 12px var(--shadow-color);
        `;
        
        // Insert wrapper before select
        selectElement.parentNode.insertBefore(wrapper, selectElement);
        wrapper.appendChild(searchInput);
        wrapper.appendChild(dropdownList);
        wrapper.appendChild(selectElement);
        
        // Hide original select
        selectElement.style.display = 'none';
        
        // Show current value in search input
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        if (selectedOption) {
            searchInput.value = selectedOption.textContent;
        }
        
        // Handle click on search input
        searchInput.addEventListener('click', () => {
            dropdownList.style.display = 'block';
            searchInput.focus();
            this.populateDropdownList(dropdownList, options, searchInput.value);
        });
        
        // Handle search input
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            this.populateDropdownList(dropdownList, options, searchTerm);
        });
        
        // Handle focus out
        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                dropdownList.style.display = 'none';
            }, 200);
        });
        
        // Handle dropdown item selection
        dropdownList.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-item')) {
                const value = e.target.dataset.value;
                const text = e.target.textContent;
                
                // Update select element
                selectElement.value = value;
                selectElement.dispatchEvent(new Event('change'));
                
                // Update search input with centered text
                searchInput.value = text;
                searchInput.style.textAlign = 'center';
                
                // Hide dropdown
                dropdownList.style.display = 'none';
            }
        });
        
        // Handle escape key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdownList.style.display = 'none';
                searchInput.blur();
            }
        });
    }

    populateDropdownList(dropdownList, options, searchTerm) {
        const filteredOptions = options.filter(option => 
            option.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.value.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        dropdownList.innerHTML = filteredOptions.map(option => `
            <div class="dropdown-item" data-value="${option.value}" style="
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid var(--border-color);
                transition: background 0.2s ease;
            ">
                ${option.text}
            </div>
        `).join('');
        
        // Add event listeners to dropdown items
        dropdownList.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('mouseover', function() {
                this.style.background = 'var(--dropdown-hover)';
            });
            
            item.addEventListener('mouseout', function() {
                this.style.background = 'transparent';
            });
        });
    }

    getCurrencyOptions() {
        return [
            { value: 'USD', text: 'USD - US Dollar' },
            { value: 'EUR', text: 'EUR - Euro' },
            { value: 'GBP', text: 'GBP - British Pound' },
            { value: 'JPY', text: 'JPY - Japanese Yen' },
            { value: 'CNY', text: 'CNY - Chinese Yuan' },
            { value: 'CAD', text: 'CAD - Canadian Dollar' },
            { value: 'AUD', text: 'AUD - Australian Dollar' },
            { value: 'CHF', text: 'CHF - Swiss Franc' },
            { value: 'SEK', text: 'SEK - Swedish Krona' },
            { value: 'NOK', text: 'NOK - Norwegian Krone' },
            { value: 'DKK', text: 'DKK - Danish Krone' },
            { value: 'PLN', text: 'PLN - Polish Złoty' },
            { value: 'CZK', text: 'CZK - Czech Koruna' },
            { value: 'HUF', text: 'HUF - Hungarian Forint' },
            { value: 'RON', text: 'RON - Romanian Leu' },
            { value: 'BGN', text: 'BGN - Bulgarian Lev' },
            { value: 'HRK', text: 'HRK - Croatian Kuna' },
            { value: 'RUB', text: 'RUB - Russian Ruble' },
            { value: 'TRY', text: 'TRY - Turkish Lira' },
            { value: 'BRL', text: 'BRL - Brazilian Real' },
            { value: 'MXN', text: 'MXN - Mexican Peso' },
            { value: 'ARS', text: 'ARS - Argentine Peso' },
            { value: 'CLP', text: 'CLP - Chilean Peso' },
            { value: 'COP', text: 'COP - Colombian Peso' },
            { value: 'PEN', text: 'PEN - Peruvian Sol' },
            { value: 'UYU', text: 'UYU - Uruguayan Peso' },
            { value: 'VEF', text: 'VEF - Venezuelan Bolívar' },
            { value: 'NGN', text: 'NGN - Nigerian Naira' },
            { value: 'ZAR', text: 'ZAR - South African Rand' },
            { value: 'EGP', text: 'EGP - Egyptian Pound' },
            { value: 'MAD', text: 'MAD - Moroccan Dirham' },
            { value: 'TND', text: 'TND - Tunisian Dinar' },
            { value: 'DZD', text: 'DZD - Algerian Dinar' },
            { value: 'LYD', text: 'LYD - Libyan Dinar' },
            { value: 'KES', text: 'KES - Kenyan Shilling' },
            { value: 'UGX', text: 'UGX - Ugandan Shilling' },
            { value: 'TZS', text: 'TZS - Tanzanian Shilling' },
            { value: 'ETB', text: 'ETB - Ethiopian Birr' },
            { value: 'GHS', text: 'GHS - Ghanaian Cedi' },
            { value: 'XOF', text: 'XOF - West African CFA Franc' },
            { value: 'XAF', text: 'XAF - Central African CFA Franc' },
            { value: 'INR', text: 'INR - Indian Rupee' },
            { value: 'PKR', text: 'PKR - Pakistani Rupee' },
            { value: 'BDT', text: 'BDT - Bangladeshi Taka' },
            { value: 'LKR', text: 'LKR - Sri Lankan Rupee' },
            { value: 'NPR', text: 'NPR - Nepalese Rupee' },
            { value: 'THB', text: 'THB - Thai Baht' },
            { value: 'VND', text: 'VND - Vietnamese Dong' },
            { value: 'IDR', text: 'IDR - Indonesian Rupiah' },
            { value: 'MYR', text: 'MYR - Malaysian Ringgit' },
            { value: 'SGD', text: 'SGD - Singapore Dollar' },
            { value: 'HKD', text: 'HKD - Hong Kong Dollar' },
            { value: 'TWD', text: 'TWD - Taiwan Dollar' },
            { value: 'KRW', text: 'KRW - South Korean Won' },
            { value: 'PHP', text: 'PHP - Philippine Peso' },
            { value: 'ILS', text: 'ILS - Israeli Shekel' },
            { value: 'AED', text: 'AED - UAE Dirham' },
            { value: 'SAR', text: 'SAR - Saudi Riyal' },
            { value: 'QAR', text: 'QAR - Qatari Riyal' },
            { value: 'KWD', text: 'KWD - Kuwaiti Dinar' },
            { value: 'BHD', text: 'BHD - Bahraini Dinar' },
            { value: 'OMR', text: 'OMR - Omani Rial' },
            { value: 'JOD', text: 'JOD - Jordanian Dinar' },
            { value: 'LBP', text: 'LBP - Lebanese Pound' },
            { value: 'IRR', text: 'IRR - Iranian Rial' },
            { value: 'IQD', text: 'IQD - Iraqi Dinar' },
            { value: 'AFN', text: 'AFN - Afghan Afghani' },
            { value: 'UZS', text: 'UZS - Uzbekistani Som' },
            { value: 'KZT', text: 'KZT - Kazakhstani Tenge' },
            { value: 'GEL', text: 'GEL - Georgian Lari' },
            { value: 'ARM', text: 'ARM - Armenian Dram' },
            { value: 'AZN', text: 'AZN - Azerbaijani Manat' },
            { value: 'BYN', text: 'BYN - Belarusian Ruble' },
            { value: 'MDL', text: 'MDL - Moldovan Leu' },
            { value: 'UAH', text: 'UAH - Ukrainian Hryvnia' },
            { value: 'KGS', text: 'KGS - Kyrgyzstani Som' },
            { value: 'TJS', text: 'TJS - Tajikistani Somoni' },
            { value: 'TMT', text: 'TMT - Turkmenistani Manat' },
            { value: 'MNT', text: 'MNT - Mongolian Tögrög' },
            { value: 'LAK', text: 'LAK - Lao Kip' },
            { value: 'KHR', text: 'KHR - Cambodian Riel' },
            { value: 'MMK', text: 'MMK - Myanmar Kyat' },
            { value: 'BND', text: 'BND - Brunei Dollar' },
            { value: 'MVR', text: 'MVR - Maldivian Rufiyaa' },
            { value: 'BTN', text: 'BTN - Bhutanese Ngultrum' },
            { value: 'MOP', text: 'MOP - Macanese Pataca' },
            { value: 'FJD', text: 'FJD - Fijian Dollar' },
            { value: 'WST', text: 'WST - Samoan Tālā' },
            { value: 'TOP', text: 'TOP - Tongan Paʻanga' },
            { value: 'VUV', text: 'VUV - Vanuatu Vatu' },
            { value: 'SBD', text: 'SBD - Solomon Islands Dollar' },
            { value: 'PGK', text: 'PGK - Papua New Guinean Kina' },
            { value: 'NZD', text: 'NZD - New Zealand Dollar' }
        ];
    }

    getCryptoOptions() {
        return [
            // Major Cryptocurrencies
            { value: 'bitcoin', text: 'Bitcoin (BTC)' },
            { value: 'ethereum', text: 'Ethereum (ETH)' },
            { value: 'binancecoin', text: 'Binance Coin (BNB)' },
            { value: 'cardano', text: 'Cardano (ADA)' },
            { value: 'solana', text: 'Solana (SOL)' },
            { value: 'ripple', text: 'Ripple (XRP)' },
            { value: 'polkadot', text: 'Polkadot (DOT)' },
            { value: 'dogecoin', text: 'Dogecoin (DOGE)' },
            { value: 'avalanche-2', text: 'Avalanche (AVAX)' },
            { value: 'chainlink', text: 'Chainlink (LINK)' },
            { value: 'matic-network', text: 'Polygon (MATIC)' },
            { value: 'litecoin', text: 'Litecoin (LTC)' },
            { value: 'uniswap', text: 'Uniswap (UNI)' },
            { value: 'stellar', text: 'Stellar (XLM)' },
            { value: 'vechain', text: 'VeChain (VET)' },
            { value: 'filecoin', text: 'Filecoin (FIL)' },
            { value: 'tron', text: 'TRON (TRX)' },
            { value: 'monero', text: 'Monero (XMR)' },
            { value: 'eos', text: 'EOS (EOS)' },
            { value: 'aave', text: 'Aave (AAVE)' },
            { value: 'algorand', text: 'Algorand (ALGO)' },
            { value: 'tezos', text: 'Tezos (XTZ)' },
            { value: 'cosmos', text: 'Cosmos (ATOM)' },
            { value: 'neo', text: 'Neo (NEO)' },
            { value: 'dash', text: 'Dash (DASH)' },
            { value: 'zcash', text: 'Zcash (ZEC)' },
            { value: 'bitcoin-cash', text: 'Bitcoin Cash (BCH)' },
            { value: 'ethereum-classic', text: 'Ethereum Classic (ETC)' },
            { value: 'iota', text: 'IOTA (MIOTA)' },
            { value: 'nem', text: 'NEM (XEM)' },
            { value: 'waves', text: 'Waves (WAVES)' },
            { value: 'decred', text: 'Decred (DCR)' },
            { value: 'qtum', text: 'Qtum (QTUM)' },
            { value: 'omisego', text: 'OMG Network (OMG)' },
            { value: 'icon', text: 'ICON (ICX)' },
            { value: 'zilliqa', text: 'Zilliqa (ZIL)' },
            { value: '0x', text: '0x (ZRX)' },
            { value: 'basic-attention-token', text: 'Basic Attention Token (BAT)' },
            { value: 'augur', text: 'Augur (REP)' },
            { value: 'golem', text: 'Golem (GNT)' },
            { value: 'siacoin', text: 'Siacoin (SC)' },
            { value: 'digibyte', text: 'DigiByte (DGB)' },
            { value: 'verge', text: 'Verge (XVG)' },
            { value: 'steem', text: 'Steem (STEEM)' },
            { value: 'pivx', text: 'PIVX (PIVX)' },
            { value: 'komodo', text: 'Komodo (KMD)' },
            { value: 'ardor', text: 'Ardor (ARDR)' },
            { value: 'stratis', text: 'Stratis (STRAT)' },
            { value: 'nxt', text: 'Nxt (NXT)' },
            { value: 'factom', text: 'Factom (FCT)' },
            { value: 'maidsafecoin', text: 'MaidSafeCoin (MAID)' },
            { value: 'peercoin', text: 'Peercoin (PPC)' },
            { value: 'namecoin', text: 'Namecoin (NMC)' },
            { value: 'feathercoin', text: 'Feathercoin (FTC)' },
            { value: 'novacoin', text: 'Novacoin (NVC)' },
            { value: 'primecoin', text: 'Primecoin (XPM)' },
            { value: 'gridcoin', text: 'Gridcoin (GRC)' },
            { value: 'vertcoin', text: 'Vertcoin (VTC)' },
            { value: 'potcoin', text: 'PotCoin (POT)' },
            { value: 'megacoin', text: 'Megacoin (MEC)' },
            { value: 'auroracoin', text: 'Auroracoin (AUR)' },
            { value: 'reddcoin', text: 'Reddcoin (RDD)' },
            { value: 'blackcoin', text: 'Blackcoin (BLK)' },
            { value: 'nushares', text: 'NuShares (NSR)' },
            { value: 'nubits', text: 'NuBits (USNBT)' },
            { value: 'mazacoin', text: 'Mazacoin (MZC)' },
            { value: 'burst', text: 'Burst (BURST)' },
            { value: 'counterparty', text: 'Counterparty (XCP)' },
            { value: 'omni', text: 'Omni (OMNI)' },
            { value: 'bitshares', text: 'BitShares (BTS)' },
            { value: 'zcoin', text: 'Zcoin (XZC)' },
            { value: 'zencash', text: 'Zencash (ZEN)' },
            { value: 'horizen', text: 'Horizen (ZEN)' },
            { value: 'aeon', text: 'Aeon (AEON)' },
            { value: 'sumokoin', text: 'Sumokoin (SUMO)' },
            { value: 'masari', text: 'Masari (MSR)' },
            { value: 'turtlecoin', text: 'TurtleCoin (TRTL)' },
            { value: 'karbo', text: 'Karbo (KRB)' },
            { value: 'haven', text: 'Haven (XHV)' },
            { value: 'loki-network', text: 'Loki Network (LOKI)' },
            { value: 'wownero', text: 'Wownero (WOW)' },
            { value: 'ryo-currency', text: 'Ryo Currency (RYO)' },
            { value: 'lethean', text: 'Lethean (LTHN)' },
            { value: 'dero', text: 'Dero (DERO)' },
            { value: 'graft', text: 'Graft (GRFT)' },
            { value: 'stellite', text: 'Stellite (XLA)' },
            { value: 'triton', text: 'Triton (XEQ)' },
            { value: 'conceal', text: 'Conceal (CCX)' },
            { value: 'plenteum', text: 'Plenteum (PLTX)' },
            { value: 'italocoin', text: 'Italocoin (ITA)' },
            { value: 'dinastycoin', text: 'Dinastycoin (DCY)' },
            { value: 'bitcoin-private', text: 'Bitcoin Private (BTCP)' },
            { value: 'bitcoin-gold', text: 'Bitcoin Gold (BTG)' },
            { value: 'bitcoin-diamond', text: 'Bitcoin Diamond (BCD)' },
            { value: 'bitcoin-cash-abc', text: 'Bitcoin Cash ABC (BCHA)' },
            { value: 'bitcoin-sv', text: 'Bitcoin SV (BSV)' },
            { value: 'polygon', text: 'Polygon (MATIC)' },
            { value: 'compound', text: 'Compound (COMP)' },
            { value: 'sushi', text: 'SushiSwap (SUSHI)' },
            { value: 'pancakeswap-token', text: 'PancakeSwap (CAKE)' },
            { value: 'curve-dao-token', text: 'Curve DAO (CRV)' },
            { value: 'yearn-finance', text: 'Yearn Finance (YFI)' },
            { value: 'synthetix-network-token', text: 'Synthetix (SNX)' },
            { value: 'balancer', text: 'Balancer (BAL)' },
            { value: '1inch', text: '1inch (1INCH)' },
            { value: 'nano', text: 'Nano (XNO)' },
            { value: 'ontology', text: 'Ontology (ONT)' },
            { value: 'harmony', text: 'Harmony (ONE)' },
            { value: 'elrond-erd-2', text: 'Elrond (EGLD)' },
            { value: 'near', text: 'NEAR Protocol (NEAR)' },
            { value: 'fantom', text: 'Fantom (FTM)' },
            { value: 'the-graph', text: 'The Graph (GRT)' },
            { value: 'decentraland', text: 'Decentraland (MANA)' },
            { value: 'sandbox', text: 'The Sandbox (SAND)' },
            { value: 'enjincoin', text: 'Enjin Coin (ENJ)' },
            { value: 'axie-infinity', text: 'Axie Infinity (AXS)' },
            { value: 'gala', text: 'Gala (GALA)' },
            { value: 'chiliz', text: 'Chiliz (CHZ)' },
            { value: 'flow', text: 'Flow (FLOW)' },
            { value: 'internet-computer', text: 'Internet Computer (ICP)' },
            { value: 'theta-token', text: 'Theta Token (THETA)' },
            { value: 'vega-protocol', text: 'Vega Protocol (VEGA)' },
            { value: 'celo', text: 'Celo (CELO)' },
            { value: 'kusama', text: 'Kusama (KSM)' },
            
            // Fiat Currencies (for crypto-to-fiat conversion)
            { value: 'usd', text: 'USD - US Dollar' },
            { value: 'eur', text: 'EUR - Euro' },
            { value: 'gbp', text: 'GBP - British Pound' },
            { value: 'jpy', text: 'JPY - Japanese Yen' },
            { value: 'cny', text: 'CNY - Chinese Yuan' },
            { value: 'cad', text: 'CAD - Canadian Dollar' },
            { value: 'aud', text: 'AUD - Australian Dollar' },
            { value: 'chf', text: 'CHF - Swiss Franc' },
            { value: 'sek', text: 'SEK - Swedish Krona' },
            { value: 'nok', text: 'NOK - Norwegian Krone' },
            { value: 'dkk', text: 'DKK - Danish Krone' },
            { value: 'pln', text: 'PLN - Polish Złoty' },
            { value: 'czk', text: 'CZK - Czech Koruna' },
            { value: 'huf', text: 'HUF - Hungarian Forint' },
            { value: 'ron', text: 'RON - Romanian Leu' },
            { value: 'bgn', text: 'BGN - Bulgarian Lev' },
            { value: 'hrk', text: 'HRK - Croatian Kuna' },
            { value: 'rub', text: 'RUB - Russian Ruble' },
            { value: 'try', text: 'TRY - Turkish Lira' },
            { value: 'brl', text: 'BRL - Brazilian Real' },
            { value: 'mxn', text: 'MXN - Mexican Peso' },
            { value: 'ars', text: 'ARS - Argentine Peso' },
            { value: 'clp', text: 'CLP - Chilean Peso' },
            { value: 'cop', text: 'COP - Colombian Peso' },
            { value: 'pen', text: 'PEN - Peruvian Sol' },
            { value: 'uyu', text: 'UYU - Uruguayan Peso' },
            { value: 'vef', text: 'VEF - Venezuelan Bolívar' },
            { value: 'ngn', text: 'NGN - Nigerian Naira' },
            { value: 'zar', text: 'ZAR - South African Rand' },
            { value: 'egp', text: 'EGP - Egyptian Pound' },
            { value: 'mad', text: 'MAD - Moroccan Dirham' },
            { value: 'tnd', text: 'TND - Tunisian Dinar' },
            { value: 'dzd', text: 'DZD - Algerian Dinar' },
            { value: 'lyd', text: 'LYD - Libyan Dinar' },
            { value: 'kes', text: 'KES - Kenyan Shilling' },
            { value: 'ugx', text: 'UGX - Ugandan Shilling' },
            { value: 'tzs', text: 'TZS - Tanzanian Shilling' },
            { value: 'etb', text: 'ETB - Ethiopian Birr' },
            { value: 'ghs', text: 'GHS - Ghanaian Cedi' },
            { value: 'xof', text: 'XOF - West African CFA Franc' },
            { value: 'xaf', text: 'XAF - Central African CFA Franc' },
            { value: 'inr', text: 'INR - Indian Rupee' },
            { value: 'pkr', text: 'PKR - Pakistani Rupee' },
            { value: 'bdt', text: 'BDT - Bangladeshi Taka' },
            { value: 'lkr', text: 'LKR - Sri Lankan Rupee' },
            { value: 'npr', text: 'NPR - Nepalese Rupee' },
            { value: 'thb', text: 'THB - Thai Baht' },
            { value: 'vnd', text: 'VND - Vietnamese Dong' },
            { value: 'idr', text: 'IDR - Indonesian Rupiah' },
            { value: 'myr', text: 'MYR - Malaysian Ringgit' },
            { value: 'sgd', text: 'SGD - Singapore Dollar' },
            { value: 'hkd', text: 'HKD - Hong Kong Dollar' },
            { value: 'twd', text: 'TWD - Taiwan Dollar' },
            { value: 'krw', text: 'KRW - South Korean Won' },
            { value: 'php', text: 'PHP - Philippine Peso' },
            { value: 'ils', text: 'ILS - Israeli Shekel' },
            { value: 'aed', text: 'AED - UAE Dirham' },
            { value: 'sar', text: 'SAR - Saudi Riyal' },
            { value: 'qar', text: 'QAR - Qatari Riyal' },
            { value: 'kwd', text: 'KWD - Kuwaiti Dinar' },
            { value: 'bhd', text: 'BHD - Bahraini Dinar' },
            { value: 'omr', text: 'OMR - Omani Rial' },
            { value: 'jod', text: 'JOD - Jordanian Dinar' },
            { value: 'lbp', text: 'LBP - Lebanese Pound' },
            { value: 'irr', text: 'IRR - Iranian Rial' },
            { value: 'iqd', text: 'IQD - Iraqi Dinar' },
            { value: 'afn', text: 'AFN - Afghan Afghani' },
            { value: 'uzs', text: 'UZS - Uzbekistani Som' },
            { value: 'kzt', text: 'KZT - Kazakhstani Tenge' },
            { value: 'gel', text: 'GEL - Georgian Lari' },
            { value: 'arm', text: 'ARM - Armenian Dram' },
            { value: 'azn', text: 'AZN - Azerbaijani Manat' },
            { value: 'byn', text: 'BYN - Belarusian Ruble' },
            { value: 'mdl', text: 'MDL - Moldovan Leu' },
            { value: 'uah', text: 'UAH - Ukrainian Hryvnia' },
            { value: 'kgs', text: 'KGS - Kyrgyzstani Som' },
            { value: 'tjs', text: 'TJS - Tajikistani Somoni' },
            { value: 'tmt', text: 'TMT - Turkmenistani Manat' },
            { value: 'mnt', text: 'MNT - Mongolian Tögrög' },
            { value: 'lak', text: 'LAK - Lao Kip' },
            { value: 'khr', text: 'KHR - Cambodian Riel' },
            { value: 'mmk', text: 'MMK - Myanmar Kyat' },
            { value: 'bnd', text: 'BND - Brunei Dollar' },
            { value: 'mvr', text: 'MVR - Maldivian Rufiyaa' },
            { value: 'btn', text: 'BTN - Bhutanese Ngultrum' },
            { value: 'mop', text: 'MOP - Macanese Pataca' },
            { value: 'fjd', text: 'FJD - Fijian Dollar' },
            { value: 'wst', text: 'WST - Samoan Tālā' },
            { value: 'top', text: 'TOP - Tongan Paʻanga' },
            { value: 'vuv', text: 'VUV - Vanuatu Vatu' },
            { value: 'sbd', text: 'SBD - Solomon Islands Dollar' },
            { value: 'pgk', text: 'PGK - Papua New Guinean Kina' },
            { value: 'nzd', text: 'NZD - New Zealand Dollar' }
        ];
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.rateRadar = new RateRadar();
}); 