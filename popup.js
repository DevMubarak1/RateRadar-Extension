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
            document.getElementById('lastUpdated').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
            
            this.exchangeRate = rate;
        } catch (error) {
            console.error('Error converting currency:', error);
            this.showError('Failed to convert currency. Please try again.');
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
            document.getElementById('cryptoChange').textContent = `${change > 0 ? '+' : ''}${change.toFixed(2)}% (24h)`;
            document.getElementById('cryptoChange').className = `text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'} mt-1`;
            
            this.cryptoPrice = price;
        } catch (error) {
            console.error('Error converting crypto:', error);
            this.showError('Failed to convert crypto. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async getExchangeRate(from, to) {
        const response = await fetch(`https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=1`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Failed to fetch exchange rate');
        }
        
        return data.result;
    }

    async getCryptoPrice(cryptoId) {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`);
        const data = await response.json();
        
        if (!data[cryptoId]) {
            throw new Error('Failed to fetch crypto price');
        }
        
        return data[cryptoId].usd;
    }

    async getCryptoChange(cryptoId) {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd&include_24hr_change=true`);
        const data = await response.json();
        
        if (!data[cryptoId]) {
            throw new Error('Failed to fetch crypto change');
        }
        
        return data[cryptoId].usd_24h_change;
    }

    async getCryptoRate(fromCrypto, toCrypto) {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${fromCrypto}&vs_currencies=${toCrypto}`);
        const data = await response.json();
        
        if (!data[fromCrypto]) {
            throw new Error('Failed to fetch crypto rate');
        }
        
        return data[fromCrypto][toCrypto];
    }

    async getCryptoToFiatRate(cryptoId, fiatCurrency) {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=${fiatCurrency}`);
        const data = await response.json();
        
        if (!data[cryptoId]) {
            throw new Error('Failed to fetch crypto to fiat rate');
        }
        
        return data[cryptoId][fiatCurrency];
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
            const response = await fetch(`https://api.exchangerate.host/timeseries?start_date=${this.getDateDaysAgo(period)}&end_date=${this.getDateToday()}&base=${fromCurrency}&symbols=${toCurrency}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error('Failed to fetch historical data');
            }

            // Process data for chart
            const chartData = this.processHistoryData(data.rates, toCurrency);
            this.renderHistoryChart(chartData, period);

        } catch (error) {
            console.error('Error loading history:', error);
            this.showError('Failed to load history. Please try again.');
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
                    label: `Exchange Rate (${period} days)`,
                    data: data.values,
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(255, 255, 255, 0.9)',
                    pointBorderColor: 'rgba(255, 255, 255, 1)',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255, 255, 255, 0.9)',
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                size: 10
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                size: 10
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
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
                        hoverBackgroundColor: 'rgba(255, 255, 255, 1)',
                        hoverBorderColor: 'rgba(255, 255, 255, 1)'
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
            this.showError('Please convert a currency first to set an alert.');
            return;
        }

        // Create alert modal with glass effect
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="glass-card p-6 w-80 max-w-sm">
                <h3 class="text-lg font-bold text-white mb-4">Set Rate Alert</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-white mb-2">Target Rate</label>
                        <input type="number" id="targetRate" value="${currentRate.toFixed(4)}" step="0.0001" class="glass-input w-full px-3 py-2 text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-white mb-2">Alert Type</label>
                        <select id="alertType" class="glass-input w-full px-3 py-2 text-white">
                            <option value="above">Above</option>
                            <option value="below">Below</option>
                        </select>
                    </div>
                </div>
                <div class="flex space-x-3 mt-6">
                    <button id="saveAlert" class="glass-button flex-1 py-2 px-4 text-white">Save Alert</button>
                    <button id="cancelAlert" class="glass-button flex-1 py-2 px-4 text-white">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners for modal
        document.getElementById('saveAlert').addEventListener('click', () => {
            const targetRate = parseFloat(document.getElementById('targetRate').value);
            const alertType = document.getElementById('alertType').value;
            
            this.saveAlert(fromCurrency, toCurrency, targetRate, alertType);
            document.body.removeChild(modal);
        });

        document.getElementById('cancelAlert').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    async saveAlert(fromCurrency, toCurrency, targetRate, alertType) {
        const alert = {
            id: Date.now(),
            fromCurrency,
            toCurrency,
            targetRate,
            alertType,
            createdAt: new Date().toISOString(),
            active: true
        };

        // Save to Chrome storage
        chrome.storage.sync.get(['alerts'], (result) => {
            const alerts = result.alerts || [];
            alerts.push(alert);
            chrome.storage.sync.set({ alerts }, () => {
                this.showSuccess('Alert saved successfully!');
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
                document.getElementById('favoriteBtn').textContent = '★ Favorite';
                this.showSuccess('Removed from favorites');
            } else {
                favorites.push(pair);
                document.getElementById('favoriteBtn').textContent = '★ Favorited';
                this.showSuccess('Added to favorites');
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
                document.getElementById('favoriteBtn').textContent = '★ Favorited';
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
        // Create error notification with glass effect
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 glass-card px-4 py-2 shadow-lg z-50';
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-white">${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    showSuccess(message) {
        // Create success notification with glass effect
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 glass-card px-4 py-2 shadow-lg z-50';
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-white">${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize RateRadar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RateRadar();
}); 