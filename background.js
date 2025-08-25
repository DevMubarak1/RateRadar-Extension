// RateRadar Background Script - Handles alerts and notifications
class RateRadarBackground {
    constructor() {
        this.settings = {};
        this.alertCheckInterval = null;
        this.init();
    }

    async init() {
        try {
            console.log('RateRadar: Initializing background script...');
            
            // Load settings
            await this.loadSettings();
            
            // Setup alert checking
            this.setupAlertChecking();
            
            // Listen for settings changes
            this.setupSettingsListener();
            
            console.log('RateRadar: Background script initialized successfully');
            
        } catch (error) {
            console.error('RateRadar: Error during background initialization:', error);
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
            theme: 'light',
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

    setupAlertChecking() {
        // Clear existing interval
        if (this.alertCheckInterval) {
            clearInterval(this.alertCheckInterval);
        }

        // Set up new interval based on settings
        const alertInterval = (this.settings.alertCheckInterval || 5) * 60 * 1000; // Convert to milliseconds
        this.alertCheckInterval = setInterval(async () => {
            await this.checkAlerts();
        }, alertInterval);

        console.log(`Alert checking set to ${this.settings.alertCheckInterval} minutes`);
    }

    setupSettingsListener() {
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync' && changes.settings) {
                console.log('Settings changed in background, updating...');
                this.settings = changes.settings.newValue || this.getDefaultSettings();
                this.setupAlertChecking();
            }
        });
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

            console.log(`Background: Checking ${alerts.length} alerts...`);

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

            console.log(`Background: Alert triggered: ${alert.fromCurrency} to ${alert.toCurrency} = ${currentRate}`);
            
        } catch (error) {
            console.error('Error triggering alert:', error);
        }
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

    async getExchangeRate(fromCurrency, toCurrency) {
        try {
            console.log(`Background: Fetching rate: ${fromCurrency} to ${toCurrency}`);
            
            // Try multiple API endpoints for reliability
            const apis = [
                {
                    url: `https://api.exchangerate.host/latest?base=${fromCurrency.toUpperCase()}&symbols=${toCurrency.toUpperCase()}`,
                    handler: (data) => data.rates && data.rates[toCurrency.toUpperCase()]
                },
                {
                    url: `https://latest.currency-api.pages.dev/v1/currencies/${fromCurrency.toLowerCase()}.json`,
                    handler: (data) => data[fromCurrency.toLowerCase()] && data[fromCurrency.toLowerCase()][toCurrency.toLowerCase()]
                }
            ];
            
            for (let i = 0; i < apis.length; i++) {
                try {
                    console.log(`Background: Trying API ${i + 1}: ${apis[i].url}`);
                    
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
                        console.log(`Background: API ${i + 1} response:`, data);
                        
                        const rate = apis[i].handler(data);
                        if (rate) {
                            console.log(`Background: Success! Rate: ${rate}`);
                            return parseFloat(rate);
                        }
                    }
                } catch (apiError) {
                    console.log(`Background: API ${i + 1} failed:`, apiError.message);
                    continue;
                }
            }
            
            throw new Error('All exchange rate APIs failed');
            
        } catch (error) {
            console.error('Background: Error fetching exchange rate:', error);
            throw error;
        }
    }

    async getCryptoPrice(cryptoId, targetCurrency = 'usd') {
        try {
            console.log(`Background: Fetching crypto price: ${cryptoId} to ${targetCurrency}`);
            
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
                console.log(`Background: Crypto API response:`, data);
                
                if (data[coinGeckoId] && data[coinGeckoId][targetCurrency]) {
                    const price = data[coinGeckoId][targetCurrency];
                    console.log(`Background: Success! Crypto price: ${price}`);
                    return parseFloat(price);
                }
            }
            
            throw new Error('Failed to fetch crypto price');
            
        } catch (error) {
            console.error('Background: Error fetching crypto price:', error);
            throw error;
        }
    }
}

// Initialize the background script
const rateRadarBackground = new RateRadarBackground(); 