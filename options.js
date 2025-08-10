// RateRadar Options Page JavaScript
class RateRadarOptions {
    constructor() {
        this.settings = {};
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.loadStatistics();
        this.initHistoryChart();
    }

    setupEventListeners() {
        // Settings save button
        const saveBtn = document.getElementById('saveSettings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }

        // Reset button
        const resetBtn = document.getElementById('resetSettings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSettings());
        }

        // Export button
        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // History controls
        this.setupHistoryControls();
    }

    setupHistoryControls() {
        // Period buttons
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.loadHistory(e.target.dataset.period);
            });
        });

        // Currency selectors
        const fromSelect = document.getElementById('historyFromCurrency');
        const toSelect = document.getElementById('historyToCurrency');
        
        if (fromSelect) {
            fromSelect.addEventListener('change', () => this.loadHistory());
        }
        if (toSelect) {
            toSelect.addEventListener('change', () => this.loadHistory());
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['settings']);
            this.settings = result.settings || this.getDefaultSettings();
            this.populateSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = this.getDefaultSettings();
            this.populateSettings();
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

    populateSettings() {
        // Populate form fields with current settings
        Object.keys(this.settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = this.settings[key];
                } else {
                    element.value = this.settings[key];
                }
            }
        });
    }

    async saveSettings() {
        try {
            // Collect all settings from form
            const newSettings = {};
            
            // Checkboxes
            ['autoRefresh', 'notifications', 'soundAlerts', 'smartShopping', 'showTrends'].forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    newSettings[key] = element.checked;
                }
            });

            // Selects and inputs
            ['theme', 'refreshInterval', 'baseCurrency', 'decimalPlaces', 'cacheDuration'].forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    newSettings[key] = element.value;
                }
            });

            // Save to Chrome storage
            await chrome.storage.sync.set({ settings: newSettings });
            this.settings = newSettings;

            // Show success message
            this.showToast('Settings saved successfully! ✅', 'success');
            
            // Update statistics
            this.loadStatistics();
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showToast('Failed to save settings', 'error');
        }
    }

    async resetSettings() {
        try {
            const defaultSettings = this.getDefaultSettings();
            await chrome.storage.sync.set({ settings: defaultSettings });
            this.settings = defaultSettings;
            this.populateSettings();
            this.showToast('Settings reset to default! 🔄', 'success');
        } catch (error) {
            console.error('Error resetting settings:', error);
            this.showToast('Failed to reset settings', 'error');
        }
    }

    async exportData() {
        try {
            const data = await chrome.storage.sync.get();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `rateradar-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Data exported successfully! 📥', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showToast('Failed to export data', 'error');
        }
    }

    async loadStatistics() {
        try {
            const data = await chrome.storage.sync.get(['conversions', 'alerts', 'favorites']);
            
            const totalConversions = document.getElementById('totalConversions');
            const activeAlerts = document.getElementById('activeAlerts');
            const favoritePairs = document.getElementById('favoritePairs');
            
            if (totalConversions) {
                totalConversions.textContent = data.conversions || 0;
            }
            if (activeAlerts) {
                activeAlerts.textContent = data.alerts ? data.alerts.length : 0;
            }
            if (favoritePairs) {
                favoritePairs.textContent = data.favorites ? data.favorites.length : 0;
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    async loadHistory(period = 7) {
        try {
            const fromCurrency = document.getElementById('historyFromCurrency')?.value || 'USD';
            const toCurrency = document.getElementById('historyToCurrency')?.value || 'EUR';
            
            // Get current rate for base calculation
            const currentRate = await this.getCurrentRate(fromCurrency, toCurrency);
            
            // Generate historical data (in a real app, this would come from an API)
            const historyData = this.generateHistoryData(period, currentRate);
            
            this.renderHistoryChart(historyData, period);
            this.updateHistoryInfo(currentRate);
            
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    async getCurrentRate(fromCurrency, toCurrency) {
        // This would normally call the same API as the popup
        // For now, return a sample rate
        return 0.85; // Sample EUR/USD rate
    }

    generateHistoryData(period, baseRate) {
        const data = [];
        const labels = [];
        
        for (let i = period; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString());
            
            // Generate realistic variation
            const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
            data.push(baseRate * (1 + variation));
        }
        
        return { labels, data };
    }

    renderHistoryChart(historyData, period) {
        const canvas = document.getElementById('historyChartLarge');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        const minValue = Math.min(...historyData.data);
        const maxValue = Math.max(...historyData.data);
        const range = maxValue - minValue || 1;
        
        // Draw grid
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + (i * chartHeight / 5);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        // Vertical grid lines
        for (let i = 0; i <= 10; i++) {
            const x = padding + (i * chartWidth / 10);
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }
        
        // Draw line chart
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        historyData.data.forEach((value, index) => {
            const x = padding + (index * chartWidth / (historyData.data.length - 1));
            const y = height - padding - ((value - minValue) * chartHeight / range);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw points
        ctx.fillStyle = '#3B82F6';
        historyData.data.forEach((value, index) => {
            const x = padding + (index * chartWidth / (historyData.data.length - 1));
            const y = height - padding - ((value - minValue) * chartHeight / range);
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Draw labels
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        // X-axis labels
        historyData.labels.forEach((label, index) => {
            const x = padding + (index * chartWidth / (historyData.labels.length - 1));
            ctx.fillText(label, x, height - padding + 20);
        });
        
        // Y-axis labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const y = padding + (i * chartHeight / 5);
            const value = minValue + (i * range / 5);
            ctx.fillText(value.toFixed(4), padding - 10, y + 4);
        }
    }

    updateHistoryInfo(currentRate) {
        const currentRateDisplay = document.getElementById('currentRateDisplay');
        const rateChangeDisplay = document.getElementById('rateChangeDisplay');
        
        if (currentRateDisplay) {
            const fromCurrency = document.getElementById('historyFromCurrency')?.value || 'USD';
            const toCurrency = document.getElementById('historyToCurrency')?.value || 'EUR';
            currentRateDisplay.textContent = `1 ${fromCurrency} = ${currentRate.toFixed(4)} ${toCurrency}`;
        }
        
        if (rateChangeDisplay) {
            const change = (Math.random() - 0.5) * 0.1; // Random change for demo
            const isPositive = change >= 0;
            rateChangeDisplay.textContent = `${isPositive ? '+' : ''}${(change * 100).toFixed(2)}%`;
            rateChangeDisplay.className = `change-value ${isPositive ? 'positive' : 'negative'}`;
        }
    }

    initHistoryChart() {
        // Load initial history data
        this.loadHistory(7);
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('successToast');
        if (toast) {
            toast.textContent = message;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RateRadarOptions();
}); 