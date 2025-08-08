// RateRadar Popup JavaScript
class RateRadar {
    constructor() {
        this.currentTab = 'converter';
        this.exchangeRate = 0;
        this.cryptoPrice = 0;
        this.historyChart = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCurrencies();
        this.switchTab('converter');
        this.loadFavorites();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.glass-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Currency converter events
        document.getElementById('fromAmount').addEventListener('input', () => this.convertCurrency());
        document.getElementById('fromCurrency').addEventListener('change', () => this.convertCurrency());
        document.getElementById('toCurrency').addEventListener('change', () => this.convertCurrency());
        document.getElementById('swapBtn').addEventListener('click', () => this.swapCurrencies());

        // Crypto converter events
        document.getElementById('fromCryptoAmount').addEventListener('input', () => this.convertCrypto());
        document.getElementById('fromCrypto').addEventListener('change', () => this.convertCrypto());
        document.getElementById('toCrypto').addEventListener('change', () => this.convertCrypto());
        document.getElementById('swapCryptoBtn').addEventListener('click', () => this.swapCrypto());

        // Action buttons
        document.getElementById('setAlertBtn').addEventListener('click', () => this.setAlert());
        document.getElementById('favoriteBtn').addEventListener('click', () => this.toggleFavorite());
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());

        // History period buttons
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                this.loadHistory(period);
            });
        });
    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        // Remove active class from all tab buttons
        document.querySelectorAll('.glass-tab').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab content
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');
        
        // Add active class to selected tab button
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        this.currentTab = tabName;

        // Load data for the selected tab
        if (tabName === 'converter') {
            this.convertCurrency();
        } else if (tabName === 'crypto') {
            this.convertCrypto();
        } else if (tabName === 'history') {
            this.loadHistory(7);
        }
    }

    async convertCurrency() {
        const fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;

        if (fromAmount === 0) {
            document.getElementById('toAmount').value = '';
            document.getElementById('exchangeRate').textContent = `1 ${fromCurrency} = 0.00 ${toCurrency}`;
            return;
        }

        try {
            this.showLoading(true);
            const rate = await this.getExchangeRate(fromCurrency, toCurrency);
            const convertedAmount = fromAmount * rate;
            
            document.getElementById('toAmount').value = convertedAmount.toFixed(2);
            document.getElementById('exchangeRate').textContent = `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
            document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
            
            this.exchangeRate = rate;
        } catch (error) {
            console.error('Error converting currency:', error);
            this.showError('Network error - check connection');
            // Show fallback data
            document.getElementById('toAmount').value = '0.00';
            document.getElementById('exchangeRate').textContent = `1 ${fromCurrency} = 0.00 ${toCurrency}`;
            document.getElementById('lastUpdated').textContent = 'Offline';
        } finally {
            this.showLoading(false);
        }
    }

    async convertCrypto() {
        const fromAmount = parseFloat(document.getElementById('fromCryptoAmount').value) || 0;
        const fromCrypto = document.getElementById('fromCrypto').value;
        const toCrypto = document.getElementById('toCrypto').value;

        if (fromAmount === 0) {
            document.getElementById('toCryptoAmount').value = '';
            return;
        }

        try {
            this.showLoading(true);
            
            if (this.isCrypto(toCrypto)) {
                // Crypto to Crypto conversion
                const rate = await this.getCryptoRate(fromCrypto, toCrypto);
                const convertedAmount = fromAmount * rate;
                document.getElementById('toCryptoAmount').value = convertedAmount.toFixed(6);
            } else {
                // Crypto to Fiat conversion
                const rate = await this.getCryptoToFiatRate(fromCrypto, toCrypto);
                const convertedAmount = fromAmount * rate;
                document.getElementById('toCryptoAmount').value = convertedAmount.toFixed(2);
            }

            // Update price display
            const price = await this.getCryptoPrice(fromCrypto);
            const change = await this.getCryptoChange(fromCrypto);
            
            document.getElementById('cryptoPrice').textContent = `$${price.toFixed(2)}`;
            document.getElementById('cryptoChange').textContent = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
            document.getElementById('cryptoChange').className = `text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`;
            
            this.cryptoPrice = price;
        } catch (error) {
            console.error('Error converting crypto:', error);
            this.showError('Network error - check connection');
            // Show fallback data
            document.getElementById('toCryptoAmount').value = '0.00';
            document.getElementById('cryptoPrice').textContent = '$0.00';
            document.getElementById('cryptoChange').textContent = '+0.00%';
        } finally {
            this.showLoading(false);
        }
    }

    async getExchangeRate(from, to) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
            const response = await fetch(`https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=1`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error('API returned unsuccessful response');
            }
            
            return data.result;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    async getCryptoPrice(cryptoId) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data[cryptoId]) {
                throw new Error('Failed to fetch crypto price');
            }
            
            return data[cryptoId].usd;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    async getCryptoChange(cryptoId) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd&include_24hr_change=true`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data[cryptoId]) {
                throw new Error('Failed to fetch crypto change');
            }
            
            return data[cryptoId].usd_24h_change;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    async getCryptoRate(fromCrypto, toCrypto) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${fromCrypto}&vs_currencies=${toCrypto}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data[fromCrypto]) {
                throw new Error('Failed to fetch crypto rate');
            }
            
            return data[fromCrypto][toCrypto];
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    async getCryptoToFiatRate(cryptoId, fiatCurrency) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=${fiatCurrency}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data[cryptoId]) {
                throw new Error('Failed to fetch crypto to fiat rate');
            }
            
            return data[cryptoId][fiatCurrency];
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
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

        this.convertCurrency();
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

        this.convertCrypto();
    }

    async loadHistory(period = 7) {
        try {
            this.showLoading(true);
            
            // Update active period button
            document.querySelectorAll('[data-period]').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-period="${period}"]`).classList.add('active');

            // Get current currency pair
            const fromCurrency = document.getElementById('fromCurrency').value;
            const toCurrency = document.getElementById('toCurrency').value;

            // Fetch historical data
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(`https://api.exchangerate.host/timeseries?start_date=${this.getDateDaysAgo(period)}&end_date=${this.getDateToday()}&base=${fromCurrency}&symbols=${toCurrency}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error('Failed to fetch historical data');
            }

            // Process data for chart
            const chartData = this.processHistoryData(data.rates, toCurrency);
            this.renderHistoryChart(chartData, period);

        } catch (error) {
            console.error('Error loading history:', error);
            this.showError('Failed to load history');
            // Show empty chart
            this.renderHistoryChart({ labels: [], values: [] }, period);
        } finally {
            this.showLoading(false);
        }
    }

    processHistoryData(rates, targetCurrency) {
        const labels = [];
        const values = [];

        Object.keys(rates).sort().forEach(date => {
            labels.push(new Date(date).toLocaleDateString());
            values.push(rates[date][targetCurrency]);
        });

        return { labels, values };
    }

    renderHistoryChart(data, period) {
        const ctx = document.getElementById('historyChart').getContext('2d');
        
        if (this.historyChart) {
            this.historyChart.destroy();
        }

        this.historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: `${period}D`,
                    data: data.values,
                    borderColor: 'rgba(59, 130, 246, 0.8)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(59, 130, 246, 0.9)',
                    pointBorderColor: 'rgba(59, 130, 246, 1)',
                    pointBorderWidth: 1,
                    pointRadius: 2,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(0, 0, 0, 0.6)',
                            font: {
                                size: 8
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(0, 0, 0, 0.6)',
                            font: {
                                size: 8
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                elements: {
                    point: {
                        hoverBackgroundColor: 'rgba(59, 130, 246, 1)',
                        hoverBorderColor: 'rgba(59, 130, 246, 1)'
                    }
                }
            }
        });
    }

    getDateDaysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    }

    getDateToday() {
        return new Date().toISOString().split('T')[0];
    }

    isCrypto(currency) {
        const cryptoCurrencies = ['bitcoin', 'ethereum', 'cardano', 'solana'];
        return cryptoCurrencies.includes(currency);
    }

    async loadCurrencies() {
        // This would typically load from an API, but for now we'll use a predefined list
        const currencies = ['USD', 'EUR', 'GBP', 'NGN', 'ZAR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
        
        // Populate currency dropdowns
        const fromSelect = document.getElementById('fromCurrency');
        const toSelect = document.getElementById('toCurrency');
        
        // Clear existing options
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';
        
        currencies.forEach(currency => {
            fromSelect.add(new Option(currency, currency));
            toSelect.add(new Option(currency, currency));
        });
    }

    async setAlert() {
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;
        const currentRate = this.exchangeRate;

        if (!currentRate) {
            this.showError('Convert a currency first');
            return;
        }

        // Simple alert creation without modal
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
    }

    async toggleFavorite() {
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;
        const pair = `${fromCurrency}/${toCurrency}`;

        chrome.storage.sync.get(['favorites'], (result) => {
            const favorites = result.favorites || [];
            const index = favorites.indexOf(pair);
            
            if (index > -1) {
                favorites.splice(index, 1);
                document.getElementById('favoriteBtn').textContent = '★';
                this.showSuccess('Removed');
            } else {
                favorites.push(pair);
                document.getElementById('favoriteBtn').textContent = '★';
                this.showSuccess('Added');
            }
            
            chrome.storage.sync.set({ favorites });
        });
    }

    async loadFavorites() {
        chrome.storage.sync.get(['favorites'], (result) => {
            const favorites = result.favorites || [];
            const fromCurrency = document.getElementById('fromCurrency').value;
            const toCurrency = document.getElementById('toCurrency').value;
            const pair = `${fromCurrency}/${toCurrency}`;
            
            if (favorites.includes(pair)) {
                document.getElementById('favoriteBtn').textContent = '★';
            }
        });
    }

    openSettings() {
        chrome.runtime.openOptionsPage();
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    showError(message) {
        // Create compact error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-2 right-2 liquid-glass px-3 py-2 shadow-lg z-50';
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-xs text-gray-700">${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 2000);
    }

    showSuccess(message) {
        // Create compact success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-2 right-2 liquid-glass px-3 py-2 shadow-lg z-50';
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-xs text-gray-700">${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 2000);
    }
}

// Initialize RateRadar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RateRadar();
}); 