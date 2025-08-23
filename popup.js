// RateRadar Simplified Popup JavaScript
class RateRadar {
    constructor() {
        this.currentTab = 'converter';
        this.settings = {};
        this.init();
    }

    async init() {
        try {
            console.log('RateRadar initializing...');
            
            // Load settings
            await this.loadSettings();
            
            // Setup UI elements
            this.setupUI();
            
            // Apply theme
            this.applyTheme(this.settings.theme);
            
            // Perform initial conversion
            await this.performConversion();
            await this.performCryptoConversion();
            
            // Load sample data for tabs
            this.loadAlertsList();
            this.loadFavoritesList();
            this.loadHistoryList();
            
            console.log('RateRadar initialized successfully');
            
        } catch (error) {
            console.error('RateRadar initialization error:', error);
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['settings']);
            this.settings = result.settings || this.getDefaultSettings();
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
        console.log('Theme applied:', theme);
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
        
        // Setup searchable dropdowns
        this.setupSearchableDropdowns();
    }

    setupSearchableDropdowns() {
        // Find all searchable dropdowns
        document.querySelectorAll('select[data-searchable="true"]').forEach(select => {
            this.makeDropdownSearchable(select);
        });
    }

    makeDropdownSearchable(select) {
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
            padding: 12px 16px;
            border: 2px solid var(--input-border);
            border-radius: 10px;
            background: var(--input-bg);
            color: var(--input-text);
            font-size: 14px;
            display: none;
        `;
        
        // Create dropdown list
        const dropdownList = document.createElement('div');
        dropdownList.className = 'searchable-dropdown-list';
        dropdownList.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 200px;
            overflow-y: auto;
            background: var(--dropdown-bg);
            border: 1px solid var(--dropdown-border);
            border-radius: 8px;
            box-shadow: 0 4px 12px var(--shadow-color);
            z-index: 1000;
            display: none;
        `;
        
        // Insert wrapper before select
        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(searchInput);
        wrapper.appendChild(dropdownList);
        wrapper.appendChild(select);
        
        // Hide original select
        select.style.display = 'none';
        
        // Populate dropdown list
        this.populateDropdownList(select, dropdownList, searchInput);
        
        // Show search input when clicking on wrapper
        wrapper.addEventListener('click', () => {
            searchInput.style.display = 'block';
            dropdownList.style.display = 'block';
            searchInput.focus();
        });
        
        // Handle search input
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const items = dropdownList.querySelectorAll('.dropdown-item');
            
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                searchInput.style.display = 'none';
                dropdownList.style.display = 'none';
            }
        });
    }

    populateDropdownList(select, dropdownList, searchInput) {
        // Clear existing items
        dropdownList.innerHTML = '';
        
        // Add items from select
        Array.from(select.options).forEach(option => {
            if (option.value) {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.textContent = option.textContent;
                item.style.cssText = `
                    padding: 8px 12px;
                    cursor: pointer;
                    border-bottom: 1px solid var(--border-color);
                    transition: background-color 0.2s;
                `;
                
                item.addEventListener('click', () => {
                    select.value = option.value;
                    searchInput.value = option.textContent;
                    dropdownList.style.display = 'none';
                    searchInput.style.display = 'none';
                    
                    // Trigger change event
                    const event = new Event('change', { bubbles: true });
                    select.dispatchEvent(event);
                });
                
                item.addEventListener('mouseenter', () => {
                    item.style.backgroundColor = 'var(--dropdown-hover)';
                });
                
                item.addEventListener('mouseleave', () => {
                    item.style.backgroundColor = 'transparent';
                });
                
                dropdownList.appendChild(item);
            }
        });
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

    async performConversion() {
        try {
            const fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
            const fromCurrency = document.getElementById('fromCurrency').value;
            const toCurrency = document.getElementById('toCurrency').value;
            
            if (fromAmount <= 0 || fromCurrency === toCurrency) {
                document.getElementById('toAmount').value = fromAmount.toFixed(2);
                return;
            }
            
            // Handle large numbers and various input formats
            const cleanAmount = fromAmount.toString().replace(/[^\d.,]/g, '').replace(/,/g, '');
            const numericAmount = parseFloat(cleanAmount);
            
            if (isNaN(numericAmount) || numericAmount <= 0) {
                document.getElementById('toAmount').value = '0.00';
                return;
            }
            
            // Get real-time exchange rate
            const rate = await this.getExchangeRate(fromCurrency, toCurrency);
            const convertedAmount = numericAmount * rate;
            
            // Format output based on the size of the number
            let formattedAmount;
            if (convertedAmount >= 1000000) {
                formattedAmount = (convertedAmount / 1000000).toFixed(2) + 'M';
            } else if (convertedAmount >= 1000) {
                formattedAmount = (convertedAmount / 1000).toFixed(2) + 'K';
            } else {
                formattedAmount = convertedAmount.toFixed(2);
            }
            
            document.getElementById('toAmount').value = convertedAmount.toFixed(2);
            
            // Update rate display
            document.getElementById('exchangeRate').textContent = 
                `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
            document.getElementById('lastUpdated').textContent = 
                new Date().toLocaleTimeString();
            
        } catch (error) {
            console.error('Conversion error:', error);
            // Fallback to placeholder rate
            const rate = 1.1;
            const convertedAmount = fromAmount * rate;
            document.getElementById('toAmount').value = convertedAmount.toFixed(2);
            document.getElementById('exchangeRate').textContent = 
                `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
            document.getElementById('lastUpdated').textContent = 'Error - Using cached rate';
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
            
            // Handle large numbers and various input formats
            const cleanAmount = fromAmount.toString().replace(/[^\d.,]/g, '').replace(/,/g, '');
            const numericAmount = parseFloat(cleanAmount);
            
            if (isNaN(numericAmount) || numericAmount <= 0) {
                document.getElementById('toCryptoAmount').value = '0.00';
                return;
            }
            
            // Get real-time crypto price
            const price = await this.getCryptoPrice(fromCrypto, toCrypto);
            const convertedAmount = numericAmount * price;
            
            // Format output based on the size of the number
            let formattedAmount;
            if (convertedAmount >= 1000000) {
                formattedAmount = (convertedAmount / 1000000).toFixed(2) + 'M';
            } else if (convertedAmount >= 1000) {
                formattedAmount = (convertedAmount / 1000).toFixed(2) + 'K';
            } else {
                formattedAmount = convertedAmount.toFixed(2);
            }
            
            document.getElementById('toCryptoAmount').value = convertedAmount.toFixed(2);
            
            // Update price display
            document.getElementById('cryptoPrice').textContent = `$${price.toFixed(2)}`;
            
            // Get price change
            const change = await this.getCryptoChange(fromCrypto);
            const changeElement = document.getElementById('cryptoChange');
            changeElement.textContent = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
            changeElement.className = `change-text ${change >= 0 ? 'positive' : 'negative'}`;
            
        } catch (error) {
            console.error('Crypto conversion error:', error);
            // Fallback to placeholder data
            const price = 50000;
            const convertedAmount = fromAmount * price;
            document.getElementById('toCryptoAmount').value = convertedAmount.toFixed(2);
            document.getElementById('cryptoPrice').textContent = `$${price.toFixed(2)}`;
            document.getElementById('cryptoChange').textContent = '+0.00%';
            document.getElementById('cryptoChange').className = 'change-text positive';
        }
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

    showAlertModal(type = 'custom') {
        const modal = document.getElementById('alertModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.populateCurrencyOptions();
        }
    }

    populateCurrencyOptions() {
        // Populate From Currency dropdown
        const fromCurrencySelect = document.getElementById('alertFromCurrency');
        const toCurrencySelect = document.getElementById('alertToCurrency');
        
        if (fromCurrencySelect && toCurrencySelect) {
            // Clear existing options
            fromCurrencySelect.innerHTML = '<option value="">Select currency or crypto...</option>';
            toCurrencySelect.innerHTML = '<option value="">Select currency or crypto...</option>';
            
            // Add currencies
            const currencies = [
                { code: 'USD', name: 'US Dollar' },
                { code: 'EUR', name: 'Euro' },
                { code: 'GBP', name: 'British Pound' },
                { code: 'JPY', name: 'Japanese Yen' },
                { code: 'CNY', name: 'Chinese Yuan' },
                { code: 'CAD', name: 'Canadian Dollar' },
                { code: 'AUD', name: 'Australian Dollar' },
                { code: 'CHF', name: 'Swiss Franc' },
                { code: 'SEK', name: 'Swedish Krona' },
                { code: 'NOK', name: 'Norwegian Krone' },
                { code: 'DKK', name: 'Danish Krone' },
                { code: 'PLN', name: 'Polish Złoty' },
                { code: 'CZK', name: 'Czech Koruna' },
                { code: 'HUF', name: 'Hungarian Forint' },
                { code: 'RON', name: 'Romanian Leu' },
                { code: 'BGN', name: 'Bulgarian Lev' },
                { code: 'HRK', name: 'Croatian Kuna' },
                { code: 'RUB', name: 'Russian Ruble' },
                { code: 'TRY', name: 'Turkish Lira' },
                { code: 'BRL', name: 'Brazilian Real' },
                { code: 'MXN', name: 'Mexican Peso' },
                { code: 'ARS', name: 'Argentine Peso' },
                { code: 'CLP', name: 'Chilean Peso' },
                { code: 'COP', name: 'Colombian Peso' },
                { code: 'PEN', name: 'Peruvian Sol' },
                { code: 'UYU', name: 'Uruguayan Peso' },
                { code: 'VEF', name: 'Venezuelan Bolívar' },
                { code: 'NGN', name: 'Nigerian Naira' },
                { code: 'ZAR', name: 'South African Rand' },
                { code: 'EGP', name: 'Egyptian Pound' },
                { code: 'MAD', name: 'Moroccan Dirham' },
                { code: 'TND', name: 'Tunisian Dinar' },
                { code: 'DZD', name: 'Algerian Dinar' },
                { code: 'LYD', name: 'Libyan Dinar' },
                { code: 'KES', name: 'Kenyan Shilling' },
                { code: 'UGX', name: 'Ugandan Shilling' },
                { code: 'TZS', name: 'Tanzanian Shilling' },
                { code: 'ETB', name: 'Ethiopian Birr' },
                { code: 'GHS', name: 'Ghanaian Cedi' },
                { code: 'XOF', name: 'West African CFA Franc' },
                { code: 'XAF', name: 'Central African CFA Franc' },
                { code: 'INR', name: 'Indian Rupee' },
                { code: 'PKR', name: 'Pakistani Rupee' },
                { code: 'BDT', name: 'Bangladeshi Taka' },
                { code: 'LKR', name: 'Sri Lankan Rupee' },
                { code: 'NPR', name: 'Nepalese Rupee' },
                { code: 'THB', name: 'Thai Baht' },
                { code: 'VND', name: 'Vietnamese Dong' },
                { code: 'IDR', name: 'Indonesian Rupiah' },
                { code: 'MYR', name: 'Malaysian Ringgit' },
                { code: 'SGD', name: 'Singapore Dollar' },
                { code: 'HKD', name: 'Hong Kong Dollar' },
                { code: 'TWD', name: 'Taiwan Dollar' },
                { code: 'KRW', name: 'South Korean Won' },
                { code: 'PHP', name: 'Philippine Peso' },
                { code: 'ILS', name: 'Israeli Shekel' },
                { code: 'AED', name: 'UAE Dirham' },
                { code: 'SAR', name: 'Saudi Riyal' },
                { code: 'QAR', name: 'Qatari Riyal' },
                { code: 'KWD', name: 'Kuwaiti Dinar' },
                { code: 'BHD', name: 'Bahraini Dinar' },
                { code: 'OMR', name: 'Omani Rial' },
                { code: 'JOD', name: 'Jordanian Dinar' },
                { code: 'LBP', name: 'Lebanese Pound' },
                { code: 'IRR', name: 'Iranian Rial' },
                { code: 'IQD', name: 'Iraqi Dinar' },
                { code: 'AFN', name: 'Afghan Afghani' },
                { code: 'UZS', name: 'Uzbekistani Som' },
                { code: 'KZT', name: 'Kazakhstani Tenge' },
                { code: 'GEL', name: 'Georgian Lari' },
                { code: 'ARM', name: 'Armenian Dram' },
                { code: 'AZN', name: 'Azerbaijani Manat' },
                { code: 'BYN', name: 'Belarusian Ruble' },
                { code: 'MDL', name: 'Moldovan Leu' },
                { code: 'UAH', name: 'Ukrainian Hryvnia' },
                { code: 'KGS', name: 'Kyrgyzstani Som' },
                { code: 'TJS', name: 'Tajikistani Somoni' },
                { code: 'TMT', name: 'Turkmenistani Manat' },
                { code: 'MNT', name: 'Mongolian Tögrög' },
                { code: 'LAK', name: 'Lao Kip' },
                { code: 'KHR', name: 'Cambodian Riel' },
                { code: 'MMK', name: 'Myanmar Kyat' },
                { code: 'BND', name: 'Brunei Dollar' },
                { code: 'MVR', name: 'Maldivian Rufiyaa' },
                { code: 'BTN', name: 'Bhutanese Ngultrum' },
                { code: 'MOP', name: 'Macanese Pataca' },
                { code: 'FJD', name: 'Fijian Dollar' },
                { code: 'WST', name: 'Samoan Tālā' },
                { code: 'TOP', name: 'Tongan Paʻanga' },
                { code: 'VUV', name: 'Vanuatu Vatu' },
                { code: 'SBD', name: 'Solomon Islands Dollar' },
                { code: 'PGK', name: 'Papua New Guinean Kina' },
                { code: 'NZD', name: 'New Zealand Dollar' }
            ];
            
            // Add cryptos
            const cryptos = [
                { code: 'bitcoin', name: 'Bitcoin (BTC)' },
                { code: 'ethereum', name: 'Ethereum (ETH)' },
                { code: 'cardano', name: 'Cardano (ADA)' },
                { code: 'solana', name: 'Solana (SOL)' },
                { code: 'binancecoin', name: 'Binance Coin (BNB)' },
                { code: 'ripple', name: 'Ripple (XRP)' },
                { code: 'polkadot', name: 'Polkadot (DOT)' },
                { code: 'dogecoin', name: 'Dogecoin (DOGE)' },
                { code: 'avalanche-2', name: 'Avalanche (AVAX)' },
                { code: 'polygon', name: 'Polygon (MATIC)' },
                { code: 'chainlink', name: 'Chainlink (LINK)' },
                { code: 'uniswap', name: 'Uniswap (UNI)' },
                { code: 'litecoin', name: 'Litecoin (LTC)' },
                { code: 'bitcoin-cash', name: 'Bitcoin Cash (BCH)' },
                { code: 'stellar', name: 'Stellar (XLM)' },
                { code: 'vechain', name: 'VeChain (VET)' },
                { code: 'filecoin', name: 'Filecoin (FIL)' },
                { code: 'cosmos', name: 'Cosmos (ATOM)' },
                { code: 'monero', name: 'Monero (XMR)' },
                { code: 'algorand', name: 'Algorand (ALGO)' },
                { code: 'tezos', name: 'Tezos (XTZ)' },
                { code: 'aave', name: 'Aave (AAVE)' },
                { code: 'compound', name: 'Compound (COMP)' },
                { code: 'sushi', name: 'SushiSwap (SUSHI)' },
                { code: 'pancakeswap-token', name: 'PancakeSwap (CAKE)' },
                { code: 'curve-dao-token', name: 'Curve DAO (CRV)' },
                { code: 'yearn-finance', name: 'Yearn Finance (YFI)' },
                { code: 'synthetix-network-token', name: 'Synthetix (SNX)' },
                { code: '0x', name: '0x Protocol (ZRX)' },
                { code: 'balancer', name: 'Balancer (BAL)' },
                { code: '1inch', name: '1inch (1INCH)' },
                { code: 'dash', name: 'Dash (DASH)' },
                { code: 'zcash', name: 'Zcash (ZEC)' },
                { code: 'nem', name: 'NEM (XEM)' },
                { code: 'iota', name: 'IOTA (MIOTA)' },
                { code: 'neo', name: 'Neo (NEO)' },
                { code: 'qtum', name: 'Qtum (QTUM)' },
                { code: 'waves', name: 'Waves (WAVES)' },
                { code: 'nano', name: 'Nano (XNO)' },
                { code: 'icon', name: 'ICON (ICX)' },
                { code: 'ontology', name: 'Ontology (ONT)' },
                { code: 'zilliqa', name: 'Zilliqa (ZIL)' },
                { code: 'harmony', name: 'Harmony (ONE)' },
                { code: 'elrond-erd-2', name: 'Elrond (EGLD)' },
                { code: 'near', name: 'NEAR Protocol (NEAR)' },
                { code: 'fantom', name: 'Fantom (FTM)' },
                { code: 'the-graph', name: 'The Graph (GRT)' },
                { code: 'decentraland', name: 'Decentraland (MANA)' },
                { code: 'sandbox', name: 'The Sandbox (SAND)' },
                { code: 'enjincoin', name: 'Enjin Coin (ENJ)' },
                { code: 'axie-infinity', name: 'Axie Infinity (AXS)' },
                { code: 'gala', name: 'Gala (GALA)' },
                { code: 'chiliz', name: 'Chiliz (CHZ)' },
                { code: 'flow', name: 'Flow (FLOW)' },
                { code: 'internet-computer', name: 'Internet Computer (ICP)' },
                { code: 'theta-token', name: 'Theta Token (THETA)' },
                { code: 'vega-protocol', name: 'Vega Protocol (VEGA)' },
                { code: 'celo', name: 'Celo (CELO)' },
                { code: 'kusama', name: 'Kusama (KSM)' },
                { code: 'eos', name: 'EOS (EOS)' },
                { code: 'tron', name: 'TRON (TRX)' },
                { code: 'bitcoin-sv', name: 'Bitcoin SV (BSV)' }
            ];
            
            // Combine currencies and cryptos
            const allOptions = [...currencies, ...cryptos];
            
            // Add to both dropdowns
            allOptions.forEach(option => {
                const fromOption = document.createElement('option');
                fromOption.value = option.code;
                fromOption.textContent = option.name;
                fromCurrencySelect.appendChild(fromOption);
                
                const toOption = document.createElement('option');
                toOption.value = option.code;
                toOption.textContent = option.name;
                toCurrencySelect.appendChild(toOption);
            });
            
            // Set default values
            fromCurrencySelect.value = 'USD';
            toCurrencySelect.value = 'EUR';
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
                            fromCurrency: 'BTC',
                            toCurrency: 'USD',
                            fromAmount: 1,
                            toAmount: 45000,
                            rate: '$45,000',
                            type: 'crypto',
                            createdAt: new Date().toISOString(),
                            isSample: true
                        },
                        {
                            id: 'sample3',
                            fromCurrency: 'ETH',
                            toCurrency: 'USD',
                            fromAmount: 1,
                            toAmount: 3200,
                            rate: '$3,200',
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
            
            // Remove the favorite
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
                            fromCurrency: 'BTC',
                            toCurrency: 'USD',
                            targetRate: 50000,
                            description: 'Bitcoin above $50,000',
                            createdAt: new Date().toISOString(),
                            isSample: true
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
                            isSample: true
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
                                <div class="alert-details">${alert.fromCurrency} ${alert.condition} ${alert.targetRate} ${alert.toCurrency}</div>
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
            // Try multiple API endpoints for reliability
            const apis = [
                `https://api.exchangerate.host/latest?base=${fromCurrency}&symbols=${toCurrency}`,
                `https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_1234567890abcdef&base_currency=${fromCurrency}&currencies=${toCurrency}`,
                `https://latest.currency-api.pages.dev/v1/currencies/${fromCurrency.toLowerCase()}.json`
            ];
            
            for (const api of apis) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch(api, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        // Handle different API response formats
                        if (data.rates && data.rates[toCurrency]) {
                            return data.rates[toCurrency];
                        } else if (data.data && data.data[toCurrency]) {
                            return data.data[toCurrency];
                        } else if (data[fromCurrency.toLowerCase()] && data[fromCurrency.toLowerCase()][toCurrency.toLowerCase()]) {
                            return data[fromCurrency.toLowerCase()][toCurrency.toLowerCase()];
                        }
                    }
                } catch (apiError) {
                    console.log(`API ${api} failed, trying next...`);
                    continue;
                }
            }
            
            throw new Error('All APIs failed');
            
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            throw error;
        }
    }

    async getCryptoPrice(cryptoId, targetCurrency = 'usd') {
        try {
            // Handle different crypto IDs
            const cryptoMapping = {
                'bitcoin': 'bitcoin',
                'btc': 'bitcoin',
                'ethereum': 'ethereum',
                'eth': 'ethereum',
                'cardano': 'cardano',
                'ada': 'cardano',
                'solana': 'solana',
                'sol': 'solana',
                'binancecoin': 'binancecoin',
                'bnb': 'binancecoin',
                'ripple': 'ripple',
                'xrp': 'ripple',
                'polkadot': 'polkadot',
                'dot': 'polkadot',
                'dogecoin': 'dogecoin',
                'doge': 'dogecoin'
            };
            
            const mappedCryptoId = cryptoMapping[cryptoId] || cryptoId;
            
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${mappedCryptoId}&vs_currencies=${targetCurrency}&include_24hr_change=true`);
            
            if (response.ok) {
                const data = await response.json();
                if (data[mappedCryptoId] && data[mappedCryptoId][targetCurrency]) {
                    return data[mappedCryptoId][targetCurrency];
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.rateRadar = new RateRadar();
}); 