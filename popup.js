// RateRadar Popup JavaScript - Perfect UI/UX
class RateRadar {
    constructor() {
        this.currentTab = 'converter';
        this.exchangeRate = 0;
        this.cryptoPrice = 0;
        this.historyChart = null;
        this.isOnline = true;
        this.cachedRates = {
            'USD/EUR': 0.85,
            'EUR/USD': 1.18,
            'USD/GBP': 0.73,
            'GBP/USD': 1.37,
            'USD/NGN': 410.0,
            'NGN/USD': 0.0024,
            'USD/ZAR': 15.2,
            'ZAR/USD': 0.066
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCurrencies();
        this.switchTab('converter');
        this.loadFavorites();
        this.checkConnection();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
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
        document.querySelectorAll('.period-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.currentTarget.dataset.period;
                this.loadHistory(period);
            });
        });
    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab content
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
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
            this.updateConnectionStatus(true);
        } catch (error) {
            console.error('Error converting currency:', error);
            
            // Try to use cached rate as last resort
            const cachedRate = this.cachedRates[`${fromCurrency}/${toCurrency}`];
            if (cachedRate) {
                const convertedAmount = fromAmount * cachedRate;
                document.getElementById('toAmount').value = convertedAmount.toFixed(2);
                document.getElementById('exchangeRate').textContent = `1 ${fromCurrency} = ${cachedRate.toFixed(4)} ${toCurrency} (cached)`;
                document.getElementById('lastUpdated').textContent = 'Offline - using cached rate';
                this.exchangeRate = cachedRate;
                this.showError('Using cached rate - check connection');
            } else {
                this.showError('Network error - check connection');
                this.updateConnectionStatus(false);
                // Show fallback data
                document.getElementById('toAmount').value = '0.00';
                document.getElementById('exchangeRate').textContent = `1 ${fromCurrency} = 0.00 ${toCurrency}`;
                document.getElementById('lastUpdated').textContent = 'Offline';
            }
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
            document.getElementById('cryptoChange').className = `change-text ${change >= 0 ? 'positive' : 'negative'}`;
            
            this.cryptoPrice = price;
            this.updateConnectionStatus(true);
        } catch (error) {
            console.error('Error converting crypto:', error);
            this.showError('Network error - check connection');
            this.updateConnectionStatus(false);
            // Show fallback data
            document.getElementById('toCryptoAmount').value = '0.00';
            document.getElementById('cryptoPrice').textContent = '$0.00';
            document.getElementById('cryptoChange').textContent = '+0.00%';
            document.getElementById('cryptoChange').className = 'change-text positive';
        } finally {
            this.showLoading(false);
        }
    }

    async getExchangeRate(from, to) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
            // Try the main API first
            const response = await fetch(`https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=1`, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'RateRadar/1.0'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error('API returned unsuccessful response');
            }
            
            if (!data.result || typeof data.result !== 'number') {
                throw new Error('Invalid exchange rate data received');
            }
            
            // Cache the successful rate
            this.cachedRates[`${from}/${to}`] = data.result;
            
            return data.result;
        } catch (error) {
            clearTimeout(timeoutId);
            
            // Try fallback API
            try {
                const fallbackResponse = await fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_demo&base_currency=${from}&currencies=${to}`, {
                    signal: AbortSignal.timeout(5000)
                });
                
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    if (fallbackData.data && fallbackData.data[to]) {
                        this.cachedRates[`${from}/${to}`] = fallbackData.data[to];
                        return fallbackData.data[to];
                    }
                }
            } catch (fallbackError) {
                console.warn('Fallback API also failed:', fallbackError);
            }
            
            // Use cached rate if available
            const cachedRate = this.cachedRates[`${from}/${to}`];
            if (cachedRate) {
                console.log('Using cached rate for', `${from}/${to}:`, cachedRate);
                return cachedRate;
            }
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - please check your connection');
            }
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error - please check your internet connection');
            }
            throw error;
        }
    }

    async getCryptoPrice(cryptoId) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

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
        const timeoutId = setTimeout(() => controller.abort(), 8000);

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
        const timeoutId = setTimeout(() => controller.abort(), 8000);

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
        const timeoutId = setTimeout(() => controller.abort(), 8000);

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
            document.querySelectorAll('.period-button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-period="${period}"]`).classList.add('active');

            // Get current currency pair
            const fromCurrency = document.getElementById('fromCurrency').value;
            const toCurrency = document.getElementById('toCurrency').value;

            // Fetch historical data
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

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
            this.updateConnectionStatus(true);

        } catch (error) {
            console.error('Error loading history:', error);
            this.showError('Failed to load history');
            this.updateConnectionStatus(false);
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
        const canvas = document.getElementById('historyChart');
        if (!canvas) {
            console.error('History chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get canvas context');
            return;
        }
        
        if (this.historyChart) {
            try {
                this.historyChart.destroy();
            } catch (error) {
                console.warn('Error destroying previous chart:', error);
            }
        }

        // Check if Chart is available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not available');
            this.renderSimpleChart(ctx, data, period);
            return;
        }

        try {
            this.historyChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: `${period}D`,
                        data: data.values,
                        borderColor: 'rgba(102, 126, 234, 0.8)',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(102, 126, 234, 0.9)',
                        pointBorderColor: 'rgba(102, 126, 234, 1)',
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
                                color: 'rgba(26, 26, 26, 0.6)',
                                font: {
                                    size: 8
                                }
                            },
                            grid: {
                                color: 'rgba(26, 26, 26, 0.1)',
                                drawBorder: false
                            }
                        },
                        y: {
                            ticks: {
                                color: 'rgba(26, 26, 26, 0.6)',
                                font: {
                                    size: 8
                                }
                            },
                            grid: {
                                color: 'rgba(26, 26, 26, 0.1)',
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
                            hoverBackgroundColor: 'rgba(102, 126, 234, 1)',
                            hoverBorderColor: 'rgba(102, 126, 234, 1)'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating chart:', error);
            this.renderSimpleChart(ctx, data, period);
        }
    }

    renderSimpleChart(ctx, data, period) {
        // Simple fallback chart rendering
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
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
                this.showSuccess('Removed from favorites');
            } else {
                favorites.push(pair);
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
                // Update UI to show it's favorited
                console.log('Pair is favorited');
            }
        });
    }

    openSettings() {
        chrome.runtime.openOptionsPage();
    }

    checkConnection() {
        // Test connection with multiple endpoints
        const testEndpoints = [
            'https://api.exchangerate.host/latest?base=USD&symbols=EUR',
            'https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_demo&base_currency=USD&currencies=EUR'
        ];
        
        let connectionTested = false;
        
        const testConnection = async (url) => {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    signal: AbortSignal.timeout(3000) // 3 second timeout
                });
                
                if (response.ok) {
                    this.updateConnectionStatus(true);
                    connectionTested = true;
                    return true;
                }
            } catch (error) {
                console.warn('Connection test failed for:', url, error);
            }
            return false;
        };
        
        // Try each endpoint
        Promise.any(testEndpoints.map(testConnection))
            .then(() => {
                if (!connectionTested) {
                    this.updateConnectionStatus(true);
                }
            })
            .catch(() => {
                this.updateConnectionStatus(false);
            });
    }

    updateConnectionStatus(isOnline) {
        this.isOnline = isOnline;
        const statusIndicator = document.getElementById('connectionStatus');
        const statusText = statusIndicator.querySelector('.status-text');
        
        if (isOnline) {
            statusIndicator.className = 'status-indicator online';
            statusText.textContent = 'Online';
        } else {
            statusIndicator.className = 'status-indicator offline';
            statusText.textContent = 'Offline';
        }
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
    }

    showSuccess(message) {
        // Create compact success notification
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
    }
}

// Initialize RateRadar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RateRadar();
}); 