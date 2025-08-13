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

        // Theme change handler - Fix the theme toggle
        const themeSelect = document.getElementById('theme');
        if (themeSelect) {
            themeSelect.addEventListener('change', () => {
                this.applyTheme();
            });
        }

        // Auto refresh toggle
        const autoRefreshToggle = document.getElementById('autoRefresh');
        if (autoRefreshToggle) {
            autoRefreshToggle.addEventListener('change', () => this.updateAutoRefresh());
        }

        // Refresh interval change
        const refreshIntervalSelect = document.getElementById('refreshInterval');
        if (refreshIntervalSelect) {
            refreshIntervalSelect.addEventListener('change', () => this.updateRefreshInterval());
        }

        // Notifications toggle
        const notificationsToggle = document.getElementById('notifications');
        if (notificationsToggle) {
            notificationsToggle.addEventListener('change', () => this.updateNotifications());
        }

        // Sound alerts toggle
        const soundAlertsToggle = document.getElementById('soundAlerts');
        if (soundAlertsToggle) {
            soundAlertsToggle.addEventListener('change', () => this.updateSoundAlerts());
        }

        // Smart shopping toggle
        const smartShoppingToggle = document.getElementById('smartShopping');
        if (smartShoppingToggle) {
            smartShoppingToggle.addEventListener('change', () => this.updateSmartShopping());
        }

        // Base currency change
        const baseCurrencySelect = document.getElementById('baseCurrency');
        if (baseCurrencySelect) {
            baseCurrencySelect.addEventListener('change', () => this.updateBaseCurrency());
        }

        // Decimal places change
        const decimalPlacesSelect = document.getElementById('decimalPlaces');
        if (decimalPlacesSelect) {
            decimalPlacesSelect.addEventListener('change', () => this.updateDecimalPlaces());
        }

        // Cache duration change
        const cacheDurationSelect = document.getElementById('cacheDuration');
        if (cacheDurationSelect) {
            cacheDurationSelect.addEventListener('change', () => this.updateCacheDuration());
        }

        // Show trends toggle
        const showTrendsToggle = document.getElementById('showTrends');
        if (showTrendsToggle) {
            showTrendsToggle.addEventListener('change', () => this.updateShowTrends());
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
            this.applyThemeToPage(); // Apply theme to settings page
            console.log('Settings loaded:', this.settings);
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = this.getDefaultSettings();
            this.populateSettings();
            this.applyThemeToPage();
        }
    }

    applyThemeToPage() {
        const theme = this.settings.theme || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        console.log('Theme applied to settings page:', theme);
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
                try {
                    if (element.type === 'checkbox') {
                        element.checked = this.settings[key];
                    } else {
                        element.value = this.settings[key];
                    }
                } catch (error) {
                    console.warn(`Error setting value for ${key}:`, error);
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

    applyTheme() {
        const themeSelect = document.getElementById('theme');
        if (themeSelect) {
            const theme = themeSelect.value;
            document.documentElement.setAttribute('data-theme', theme);
            
            // Update settings immediately
            this.settings.theme = theme;
            this.applySettingChange('theme', theme);
            
            // Apply theme to all extension pages
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    if (tab.url && tab.url.startsWith('chrome-extension://')) {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'updateTheme',
                            theme: theme
                        }).catch(() => {
                            // Ignore errors for tabs that don't have content scripts
                        });
                    }
                });
            });
        }
    }

    updateAutoRefresh() {
        const autoRefreshToggle = document.getElementById('autoRefresh');
        if (autoRefreshToggle) {
            this.settings.autoRefresh = autoRefreshToggle.checked;
            this.applySettingChange('autoRefresh', autoRefreshToggle.checked);
        }
    }

    updateRefreshInterval() {
        const refreshIntervalSelect = document.getElementById('refreshInterval');
        if (refreshIntervalSelect) {
            this.settings.refreshInterval = parseInt(refreshIntervalSelect.value);
            this.applySettingChange('refreshInterval', parseInt(refreshIntervalSelect.value));
        }
    }

    updateNotifications() {
        const notificationsToggle = document.getElementById('notifications');
        if (notificationsToggle) {
            this.settings.notifications = notificationsToggle.checked;
            this.applySettingChange('notifications', notificationsToggle.checked);
            
            // Request notification permission if enabled
            if (notificationsToggle.checked) {
                this.requestNotificationPermission();
            }
        }
    }

    updateSoundAlerts() {
        const soundAlertsToggle = document.getElementById('soundAlerts');
        if (soundAlertsToggle) {
            this.settings.soundAlerts = soundAlertsToggle.checked;
            this.applySettingChange('soundAlerts', soundAlertsToggle.checked);
        }
    }

    updateSmartShopping() {
        const smartShoppingToggle = document.getElementById('smartShopping');
        if (smartShoppingToggle) {
            this.settings.smartShopping = smartShoppingToggle.checked;
            this.applySettingChange('smartShopping', smartShoppingToggle.checked);
            
            // Notify content scripts about smart shopping change
            this.notifyContentScripts('smartShopping', smartShoppingToggle.checked);
        }
    }

    updateBaseCurrency() {
        const baseCurrencySelect = document.getElementById('baseCurrency');
        if (baseCurrencySelect) {
            this.settings.baseCurrency = baseCurrencySelect.value;
            this.applySettingChange('baseCurrency', baseCurrencySelect.value);
            
            // Notify content scripts about currency change
            this.notifyContentScripts('baseCurrency', baseCurrencySelect.value);
        }
    }

    updateDecimalPlaces() {
        const decimalPlacesSelect = document.getElementById('decimalPlaces');
        if (decimalPlacesSelect) {
            this.settings.decimalPlaces = parseInt(decimalPlacesSelect.value);
            this.applySettingChange('decimalPlaces', parseInt(decimalPlacesSelect.value));
        }
    }

    updateCacheDuration() {
        const cacheDurationSelect = document.getElementById('cacheDuration');
        if (cacheDurationSelect) {
            this.settings.cacheDuration = parseInt(cacheDurationSelect.value);
            this.applySettingChange('cacheDuration', parseInt(cacheDurationSelect.value));
        }
    }

    updateShowTrends() {
        const showTrendsToggle = document.getElementById('showTrends');
        if (showTrendsToggle) {
            this.settings.showTrends = showTrendsToggle.checked;
            this.applySettingChange('showTrends', showTrendsToggle.checked);
        }
    }

    async applySettingChange(setting, value) {
        try {
            // Update settings in storage
            await chrome.storage.sync.set({ settings: this.settings });
            
            // Show immediate feedback
            this.showToast(`${this.getSettingName(setting)} updated!`, 'success');
            
            // Update statistics if needed
            if (setting === 'baseCurrency' || setting === 'smartShopping') {
                this.loadStatistics();
            }
            
        } catch (error) {
            console.error('Error applying setting change:', error);
            this.showToast('Failed to update setting', 'error');
        }
    }

    getSettingName(setting) {
        const names = {
            'theme': 'Theme',
            'autoRefresh': 'Auto Refresh',
            'refreshInterval': 'Refresh Interval',
            'notifications': 'Notifications',
            'soundAlerts': 'Sound Alerts',
            'smartShopping': 'Smart Shopping',
            'baseCurrency': 'Base Currency',
            'decimalPlaces': 'Decimal Places',
            'cacheDuration': 'Cache Duration',
            'showTrends': 'Show Trends'
        };
        return names[setting] || setting;
    }

    async requestNotificationPermission() {
        try {
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    this.showToast('Notifications enabled! 🔔', 'success');
                } else {
                    this.showToast('Please enable notifications in browser settings', 'error');
                }
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }

    notifyContentScripts(setting, value) {
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.url && !tab.url.startsWith('chrome://')) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'settingChanged',
                        setting: setting,
                        value: value
                    }).catch(() => {
                        // Ignore errors for tabs without content scripts
                    });
                }
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RateRadarOptions();
}); 
    createAlertHTML(alert) {
        const isActive = alert.active ? 'Active' : 'Inactive';
        const statusClass = alert.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
        const alertType = alert.alertType === 'above' ? 'Above' : 'Below';
        const isPriceAlert = alert.isPriceAlert ? ' (Price Alert)' : '';

        return `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="font-medium text-gray-900">
                            ${alert.fromCurrency} → ${alert.toCurrency}${isPriceAlert}
                        </h4>
                        <p class="text-sm text-gray-600">
                            Alert when rate is ${alertType.toLowerCase()} ${alert.targetRate.toFixed(4)}
                        </p>
                    </div>
                    <div class="flex space-x-2">
                        <span class="px-2 py-1 text-xs rounded-full ${statusClass}">
                            ${isActive}
                        </span>
                        <button onclick="rateRadarOptions.toggleAlert('${alert.id}')" class="text-blue-600 hover:text-blue-800 text-sm">
                            ${alert.active ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">
                        Created: ${new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                    <button onclick="rateRadarOptions.deleteAlert('${alert.id}')" class="text-red-600 hover:text-red-800 text-sm">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    async getAlerts() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['alerts'], (result) => {
                resolve(result.alerts || []);
            });
        });
    }

    async toggleAlert(alertId) {
        try {
            const alerts = await this.getAlerts();
            const alertIndex = alerts.findIndex(alert => alert.id === parseInt(alertId));
            
            if (alertIndex !== -1) {
                alerts[alertIndex].active = !alerts[alertIndex].active;
                await chrome.storage.sync.set({ alerts });
                this.showAlertModal(); // Refresh the modal
                this.showStatus(`Alert ${alerts[alertIndex].active ? 'activated' : 'deactivated'}`, 'success');
            }
        } catch (error) {
            console.error('Error toggling alert:', error);
            this.showStatus('Error updating alert', 'error');
        }
    }

    async deleteAlert(alertId) {
        if (confirm('Are you sure you want to delete this alert?')) {
            try {
                const alerts = await this.getAlerts();
                const filteredAlerts = alerts.filter(alert => alert.id !== parseInt(alertId));
                await chrome.storage.sync.set({ alerts: filteredAlerts });
                this.showAlertModal(); // Refresh the modal
                this.showStatus('Alert deleted', 'success');
            } catch (error) {
                console.error('Error deleting alert:', error);
                this.showStatus('Error deleting alert', 'error');
            }
        }
    }

    async exportData() {
        try {
            const data = await chrome.storage.sync.get();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rateradar-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showStatus('Data exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showStatus('Error exporting data', 'error');
        }
    }

    async clearData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            try {
                await chrome.storage.sync.clear();
                await chrome.storage.local.clear();
                this.showStatus('All data cleared', 'success');
                
                // Reload settings to defaults
                setTimeout(() => {
                    this.loadSettings();
                }, 1000);
            } catch (error) {
                console.error('Error clearing data:', error);
                this.showStatus('Error clearing data', 'error');
            }
        }
    }

    showStatus(message, type = 'success') {
        const statusDiv = document.getElementById('statusMessage');
        const statusText = document.getElementById('statusText');
        
        // Remove existing classes
        statusDiv.className = 'mt-4';
        
        // Add appropriate classes based on type
        if (type === 'success') {
            statusDiv.classList.add('bg-green-100', 'border', 'border-green-400', 'text-green-700', 'px-4', 'py-3', 'rounded');
        } else if (type === 'error') {
            statusDiv.classList.add('bg-red-100', 'border', 'border-red-400', 'text-red-700', 'px-4', 'py-3', 'rounded');
        } else {
            statusDiv.classList.add('bg-blue-100', 'border', 'border-blue-400', 'text-blue-700', 'px-4', 'py-3', 'rounded');
        }
        
        statusText.textContent = message;
        statusDiv.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 3000);
    }

    // Make methods available globally for inline onclick handlers
    toggleAlert(alertId) {
        this.toggleAlert(alertId);
    }

    deleteAlert(alertId) {
        this.deleteAlert(alertId);
    }
}

// Initialize RateRadar options when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.rateRadarOptions = new RateRadarOptions();
}); 
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

    applyTheme() {
        const themeSelect = document.getElementById('theme');
        if (themeSelect) {
            const theme = themeSelect.value;
            document.documentElement.setAttribute('data-theme', theme);
            
            // Update settings immediately
            this.settings.theme = theme;
            this.applySettingChange('theme', theme);
            
            // Apply theme to all extension pages
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    if (tab.url && tab.url.startsWith('chrome-extension://')) {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'updateTheme',
                            theme: theme
                        }).catch(() => {
                            // Ignore errors for tabs that don't have content scripts
                        });
                    }
                });
            });
        }
    }

    updateAutoRefresh() {
        const autoRefreshToggle = document.getElementById('autoRefresh');
        if (autoRefreshToggle) {
            this.settings.autoRefresh = autoRefreshToggle.checked;
            this.applySettingChange('autoRefresh', autoRefreshToggle.checked);
        }
    }

    updateRefreshInterval() {
        const refreshIntervalSelect = document.getElementById('refreshInterval');
        if (refreshIntervalSelect) {
            this.settings.refreshInterval = parseInt(refreshIntervalSelect.value);
            this.applySettingChange('refreshInterval', parseInt(refreshIntervalSelect.value));
        }
    }

    updateNotifications() {
        const notificationsToggle = document.getElementById('notifications');
        if (notificationsToggle) {
            this.settings.notifications = notificationsToggle.checked;
            this.applySettingChange('notifications', notificationsToggle.checked);
            
            // Request notification permission if enabled
            if (notificationsToggle.checked) {
                this.requestNotificationPermission();
            }
        }
    }

    updateSoundAlerts() {
        const soundAlertsToggle = document.getElementById('soundAlerts');
        if (soundAlertsToggle) {
            this.settings.soundAlerts = soundAlertsToggle.checked;
            this.applySettingChange('soundAlerts', soundAlertsToggle.checked);
        }
    }

    updateSmartShopping() {
        const smartShoppingToggle = document.getElementById('smartShopping');
        if (smartShoppingToggle) {
            this.settings.smartShopping = smartShoppingToggle.checked;
            this.applySettingChange('smartShopping', smartShoppingToggle.checked);
            
            // Notify content scripts about smart shopping change
            this.notifyContentScripts('smartShopping', smartShoppingToggle.checked);
        }
    }

    updateBaseCurrency() {
        const baseCurrencySelect = document.getElementById('baseCurrency');
        if (baseCurrencySelect) {
            this.settings.baseCurrency = baseCurrencySelect.value;
            this.applySettingChange('baseCurrency', baseCurrencySelect.value);
            
            // Notify content scripts about currency change
            this.notifyContentScripts('baseCurrency', baseCurrencySelect.value);
        }
    }

    updateDecimalPlaces() {
        const decimalPlacesSelect = document.getElementById('decimalPlaces');
        if (decimalPlacesSelect) {
            this.settings.decimalPlaces = parseInt(decimalPlacesSelect.value);
            this.applySettingChange('decimalPlaces', parseInt(decimalPlacesSelect.value));
        }
    }

    updateCacheDuration() {
        const cacheDurationSelect = document.getElementById('cacheDuration');
        if (cacheDurationSelect) {
            this.settings.cacheDuration = parseInt(cacheDurationSelect.value);
            this.applySettingChange('cacheDuration', parseInt(cacheDurationSelect.value));
        }
    }

    updateShowTrends() {
        const showTrendsToggle = document.getElementById('showTrends');
        if (showTrendsToggle) {
            this.settings.showTrends = showTrendsToggle.checked;
            this.applySettingChange('showTrends', showTrendsToggle.checked);
        }
    }

    async applySettingChange(setting, value) {
        try {
            // Update settings in storage
            await chrome.storage.sync.set({ settings: this.settings });
            
            // Show immediate feedback
            this.showToast(`${this.getSettingName(setting)} updated!`, 'success');
            
            // Update statistics if needed
            if (setting === 'baseCurrency' || setting === 'smartShopping') {
                this.loadStatistics();
            }
            
        } catch (error) {
            console.error('Error applying setting change:', error);
            this.showToast('Failed to update setting', 'error');
        }
    }

    getSettingName(setting) {
        const names = {
            'theme': 'Theme',
            'autoRefresh': 'Auto Refresh',
            'refreshInterval': 'Refresh Interval',
            'notifications': 'Notifications',
            'soundAlerts': 'Sound Alerts',
            'smartShopping': 'Smart Shopping',
            'baseCurrency': 'Base Currency',
            'decimalPlaces': 'Decimal Places',
            'cacheDuration': 'Cache Duration',
            'showTrends': 'Show Trends'
        };
        return names[setting] || setting;
    }

    async requestNotificationPermission() {
        try {
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    this.showToast('Notifications enabled! 🔔', 'success');
                } else {
                    this.showToast('Please enable notifications in browser settings', 'error');
                }
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }

    notifyContentScripts(setting, value) {
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.url && !tab.url.startsWith('chrome://')) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'settingChanged',
                        setting: setting,
                        value: value
                    }).catch(() => {
                        // Ignore errors for tabs without content scripts
                    });
                }
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RateRadarOptions();
}); 
    createAlertHTML(alert) {
        const isActive = alert.active ? 'Active' : 'Inactive';
        const statusClass = alert.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
        const alertType = alert.alertType === 'above' ? 'Above' : 'Below';
        const isPriceAlert = alert.isPriceAlert ? ' (Price Alert)' : '';

        return `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="font-medium text-gray-900">
                            ${alert.fromCurrency} → ${alert.toCurrency}${isPriceAlert}
                        </h4>
                        <p class="text-sm text-gray-600">
                            Alert when rate is ${alertType.toLowerCase()} ${alert.targetRate.toFixed(4)}
                        </p>
                    </div>
                    <div class="flex space-x-2">
                        <span class="px-2 py-1 text-xs rounded-full ${statusClass}">
                            ${isActive}
                        </span>
                        <button onclick="rateRadarOptions.toggleAlert('${alert.id}')" class="text-blue-600 hover:text-blue-800 text-sm">
                            ${alert.active ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">
                        Created: ${new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                    <button onclick="rateRadarOptions.deleteAlert('${alert.id}')" class="text-red-600 hover:text-red-800 text-sm">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    async getAlerts() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['alerts'], (result) => {
                resolve(result.alerts || []);
            });
        });
    }

    async toggleAlert(alertId) {
        try {
            const alerts = await this.getAlerts();
            const alertIndex = alerts.findIndex(alert => alert.id === parseInt(alertId));
            
            if (alertIndex !== -1) {
                alerts[alertIndex].active = !alerts[alertIndex].active;
                await chrome.storage.sync.set({ alerts });
                this.showAlertModal(); // Refresh the modal
                this.showStatus(`Alert ${alerts[alertIndex].active ? 'activated' : 'deactivated'}`, 'success');
            }
        } catch (error) {
            console.error('Error toggling alert:', error);
            this.showStatus('Error updating alert', 'error');
        }
    }

    async deleteAlert(alertId) {
        if (confirm('Are you sure you want to delete this alert?')) {
            try {
                const alerts = await this.getAlerts();
                const filteredAlerts = alerts.filter(alert => alert.id !== parseInt(alertId));
                await chrome.storage.sync.set({ alerts: filteredAlerts });
                this.showAlertModal(); // Refresh the modal
                this.showStatus('Alert deleted', 'success');
            } catch (error) {
                console.error('Error deleting alert:', error);
                this.showStatus('Error deleting alert', 'error');
            }
        }
    }

    async exportData() {
        try {
            const data = await chrome.storage.sync.get();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rateradar-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showStatus('Data exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showStatus('Error exporting data', 'error');
        }
    }

    async clearData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            try {
                await chrome.storage.sync.clear();
                await chrome.storage.local.clear();
                this.showStatus('All data cleared', 'success');
                
                // Reload settings to defaults
                setTimeout(() => {
                    this.loadSettings();
                }, 1000);
            } catch (error) {
                console.error('Error clearing data:', error);
                this.showStatus('Error clearing data', 'error');
            }
        }
    }

    showStatus(message, type = 'success') {
        const statusDiv = document.getElementById('statusMessage');
        const statusText = document.getElementById('statusText');
        
        // Remove existing classes
        statusDiv.className = 'mt-4';
        
        // Add appropriate classes based on type
        if (type === 'success') {
            statusDiv.classList.add('bg-green-100', 'border', 'border-green-400', 'text-green-700', 'px-4', 'py-3', 'rounded');
        } else if (type === 'error') {
            statusDiv.classList.add('bg-red-100', 'border', 'border-red-400', 'text-red-700', 'px-4', 'py-3', 'rounded');
        } else {
            statusDiv.classList.add('bg-blue-100', 'border', 'border-blue-400', 'text-blue-700', 'px-4', 'py-3', 'rounded');
        }
        
        statusText.textContent = message;
        statusDiv.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 3000);
    }

    // Make methods available globally for inline onclick handlers
    toggleAlert(alertId) {
        this.toggleAlert(alertId);
    }

    deleteAlert(alertId) {
        this.deleteAlert(alertId);
    }
}

// Initialize RateRadar options when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.rateRadarOptions = new RateRadarOptions();
}); 
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

    applyTheme() {
        const themeSelect = document.getElementById('theme');
        if (themeSelect) {
            const theme = themeSelect.value;
            document.documentElement.setAttribute('data-theme', theme);
            
            // Update settings immediately
            this.settings.theme = theme;
            this.applySettingChange('theme', theme);
            
            // Apply theme to all extension pages
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    if (tab.url && tab.url.startsWith('chrome-extension://')) {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'updateTheme',
                            theme: theme
                        }).catch(() => {
                            // Ignore errors for tabs that don't have content scripts
                        });
                    }
                });
            });
        }
    }

    updateAutoRefresh() {
        const autoRefreshToggle = document.getElementById('autoRefresh');
        if (autoRefreshToggle) {
            this.settings.autoRefresh = autoRefreshToggle.checked;
            this.applySettingChange('autoRefresh', autoRefreshToggle.checked);
        }
    }

    updateRefreshInterval() {
        const refreshIntervalSelect = document.getElementById('refreshInterval');
        if (refreshIntervalSelect) {
            this.settings.refreshInterval = parseInt(refreshIntervalSelect.value);
            this.applySettingChange('refreshInterval', parseInt(refreshIntervalSelect.value));
        }
    }

    updateNotifications() {
        const notificationsToggle = document.getElementById('notifications');
        if (notificationsToggle) {
            this.settings.notifications = notificationsToggle.checked;
            this.applySettingChange('notifications', notificationsToggle.checked);
            
            // Request notification permission if enabled
            if (notificationsToggle.checked) {
                this.requestNotificationPermission();
            }
        }
    }

    updateSoundAlerts() {
        const soundAlertsToggle = document.getElementById('soundAlerts');
        if (soundAlertsToggle) {
            this.settings.soundAlerts = soundAlertsToggle.checked;
            this.applySettingChange('soundAlerts', soundAlertsToggle.checked);
        }
    }

    updateSmartShopping() {
        const smartShoppingToggle = document.getElementById('smartShopping');
        if (smartShoppingToggle) {
            this.settings.smartShopping = smartShoppingToggle.checked;
            this.applySettingChange('smartShopping', smartShoppingToggle.checked);
            
            // Notify content scripts about smart shopping change
            this.notifyContentScripts('smartShopping', smartShoppingToggle.checked);
        }
    }

    updateBaseCurrency() {
        const baseCurrencySelect = document.getElementById('baseCurrency');
        if (baseCurrencySelect) {
            this.settings.baseCurrency = baseCurrencySelect.value;
            this.applySettingChange('baseCurrency', baseCurrencySelect.value);
            
            // Notify content scripts about currency change
            this.notifyContentScripts('baseCurrency', baseCurrencySelect.value);
        }
    }

    updateDecimalPlaces() {
        const decimalPlacesSelect = document.getElementById('decimalPlaces');
        if (decimalPlacesSelect) {
            this.settings.decimalPlaces = parseInt(decimalPlacesSelect.value);
            this.applySettingChange('decimalPlaces', parseInt(decimalPlacesSelect.value));
        }
    }

    updateCacheDuration() {
        const cacheDurationSelect = document.getElementById('cacheDuration');
        if (cacheDurationSelect) {
            this.settings.cacheDuration = parseInt(cacheDurationSelect.value);
            this.applySettingChange('cacheDuration', parseInt(cacheDurationSelect.value));
        }
    }

    updateShowTrends() {
        const showTrendsToggle = document.getElementById('showTrends');
        if (showTrendsToggle) {
            this.settings.showTrends = showTrendsToggle.checked;
            this.applySettingChange('showTrends', showTrendsToggle.checked);
        }
    }

    async applySettingChange(setting, value) {
        try {
            // Update settings in storage
            await chrome.storage.sync.set({ settings: this.settings });
            
            // Show immediate feedback
            this.showToast(`${this.getSettingName(setting)} updated!`, 'success');
            
            // Update statistics if needed
            if (setting === 'baseCurrency' || setting === 'smartShopping') {
                this.loadStatistics();
            }
            
        } catch (error) {
            console.error('Error applying setting change:', error);
            this.showToast('Failed to update setting', 'error');
        }
    }

    getSettingName(setting) {
        const names = {
            'theme': 'Theme',
            'autoRefresh': 'Auto Refresh',
            'refreshInterval': 'Refresh Interval',
            'notifications': 'Notifications',
            'soundAlerts': 'Sound Alerts',
            'smartShopping': 'Smart Shopping',
            'baseCurrency': 'Base Currency',
            'decimalPlaces': 'Decimal Places',
            'cacheDuration': 'Cache Duration',
            'showTrends': 'Show Trends'
        };
        return names[setting] || setting;
    }

    async requestNotificationPermission() {
        try {
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    this.showToast('Notifications enabled! 🔔', 'success');
                } else {
                    this.showToast('Please enable notifications in browser settings', 'error');
                }
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }

    notifyContentScripts(setting, value) {
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.url && !tab.url.startsWith('chrome://')) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'settingChanged',
                        setting: setting,
                        value: value
                    }).catch(() => {
                        // Ignore errors for tabs without content scripts
                    });
                }
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RateRadarOptions();
}); 
    createAlertHTML(alert) {
        const isActive = alert.active ? 'Active' : 'Inactive';
        const statusClass = alert.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
        const alertType = alert.alertType === 'above' ? 'Above' : 'Below';
        const isPriceAlert = alert.isPriceAlert ? ' (Price Alert)' : '';

        return `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="font-medium text-gray-900">
                            ${alert.fromCurrency} → ${alert.toCurrency}${isPriceAlert}
                        </h4>
                        <p class="text-sm text-gray-600">
                            Alert when rate is ${alertType.toLowerCase()} ${alert.targetRate.toFixed(4)}
                        </p>
                    </div>
                    <div class="flex space-x-2">
                        <span class="px-2 py-1 text-xs rounded-full ${statusClass}">
                            ${isActive}
                        </span>
                        <button onclick="rateRadarOptions.toggleAlert('${alert.id}')" class="text-blue-600 hover:text-blue-800 text-sm">
                            ${alert.active ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">
                        Created: ${new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                    <button onclick="rateRadarOptions.deleteAlert('${alert.id}')" class="text-red-600 hover:text-red-800 text-sm">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    async getAlerts() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['alerts'], (result) => {
                resolve(result.alerts || []);
            });
        });
    }

    async toggleAlert(alertId) {
        try {
            const alerts = await this.getAlerts();
            const alertIndex = alerts.findIndex(alert => alert.id === parseInt(alertId));
            
            if (alertIndex !== -1) {
                alerts[alertIndex].active = !alerts[alertIndex].active;
                await chrome.storage.sync.set({ alerts });
                this.showAlertModal(); // Refresh the modal
                this.showStatus(`Alert ${alerts[alertIndex].active ? 'activated' : 'deactivated'}`, 'success');
            }
        } catch (error) {
            console.error('Error toggling alert:', error);
            this.showStatus('Error updating alert', 'error');
        }
    }

    async deleteAlert(alertId) {
        if (confirm('Are you sure you want to delete this alert?')) {
            try {
                const alerts = await this.getAlerts();
                const filteredAlerts = alerts.filter(alert => alert.id !== parseInt(alertId));
                await chrome.storage.sync.set({ alerts: filteredAlerts });
                this.showAlertModal(); // Refresh the modal
                this.showStatus('Alert deleted', 'success');
            } catch (error) {
                console.error('Error deleting alert:', error);
                this.showStatus('Error deleting alert', 'error');
            }
        }
    }

    async exportData() {
        try {
            const data = await chrome.storage.sync.get();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rateradar-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showStatus('Data exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showStatus('Error exporting data', 'error');
        }
    }

    async clearData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            try {
                await chrome.storage.sync.clear();
                await chrome.storage.local.clear();
                this.showStatus('All data cleared', 'success');
                
                // Reload settings to defaults
                setTimeout(() => {
                    this.loadSettings();
                }, 1000);
            } catch (error) {
                console.error('Error clearing data:', error);
                this.showStatus('Error clearing data', 'error');
            }
        }
    }

    showStatus(message, type = 'success') {
        const statusDiv = document.getElementById('statusMessage');
        const statusText = document.getElementById('statusText');
        
        // Remove existing classes
        statusDiv.className = 'mt-4';
        
        // Add appropriate classes based on type
        if (type === 'success') {
            statusDiv.classList.add('bg-green-100', 'border', 'border-green-400', 'text-green-700', 'px-4', 'py-3', 'rounded');
        } else if (type === 'error') {
            statusDiv.classList.add('bg-red-100', 'border', 'border-red-400', 'text-red-700', 'px-4', 'py-3', 'rounded');
        } else {
            statusDiv.classList.add('bg-blue-100', 'border', 'border-blue-400', 'text-blue-700', 'px-4', 'py-3', 'rounded');
        }
        
        statusText.textContent = message;
        statusDiv.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 3000);
    }

    // Make methods available globally for inline onclick handlers
    toggleAlert(alertId) {
        this.toggleAlert(alertId);
    }

    deleteAlert(alertId) {
        this.deleteAlert(alertId);
    }
}

// Initialize RateRadar options when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.rateRadarOptions = new RateRadarOptions();
}); 
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

    applyTheme() {
        const themeSelect = document.getElementById('theme');
        if (themeSelect) {
            const theme = themeSelect.value;
            document.documentElement.setAttribute('data-theme', theme);
            
            // Update settings immediately
            this.settings.theme = theme;
            this.applySettingChange('theme', theme);
            
            // Apply theme to all extension pages
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    if (tab.url && tab.url.startsWith('chrome-extension://')) {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'updateTheme',
                            theme: theme
                        }).catch(() => {
                            // Ignore errors for tabs that don't have content scripts
                        });
                    }
                });
            });
        }
    }

    updateAutoRefresh() {
        const autoRefreshToggle = document.getElementById('autoRefresh');
        if (autoRefreshToggle) {
            this.settings.autoRefresh = autoRefreshToggle.checked;
            this.applySettingChange('autoRefresh', autoRefreshToggle.checked);
        }
    }

    updateRefreshInterval() {
        const refreshIntervalSelect = document.getElementById('refreshInterval');
        if (refreshIntervalSelect) {
            this.settings.refreshInterval = parseInt(refreshIntervalSelect.value);
            this.applySettingChange('refreshInterval', parseInt(refreshIntervalSelect.value));
        }
    }

    updateNotifications() {
        const notificationsToggle = document.getElementById('notifications');
        if (notificationsToggle) {
            this.settings.notifications = notificationsToggle.checked;
            this.applySettingChange('notifications', notificationsToggle.checked);
            
            // Request notification permission if enabled
            if (notificationsToggle.checked) {
                this.requestNotificationPermission();
            }
        }
    }

    updateSoundAlerts() {
        const soundAlertsToggle = document.getElementById('soundAlerts');
        if (soundAlertsToggle) {
            this.settings.soundAlerts = soundAlertsToggle.checked;
            this.applySettingChange('soundAlerts', soundAlertsToggle.checked);
        }
    }

    updateSmartShopping() {
        const smartShoppingToggle = document.getElementById('smartShopping');
        if (smartShoppingToggle) {
            this.settings.smartShopping = smartShoppingToggle.checked;
            this.applySettingChange('smartShopping', smartShoppingToggle.checked);
            
            // Notify content scripts about smart shopping change
            this.notifyContentScripts('smartShopping', smartShoppingToggle.checked);
        }
    }

    updateBaseCurrency() {
        const baseCurrencySelect = document.getElementById('baseCurrency');
        if (baseCurrencySelect) {
            this.settings.baseCurrency = baseCurrencySelect.value;
            this.applySettingChange('baseCurrency', baseCurrencySelect.value);
            
            // Notify content scripts about currency change
            this.notifyContentScripts('baseCurrency', baseCurrencySelect.value);
        }
    }

    updateDecimalPlaces() {
        const decimalPlacesSelect = document.getElementById('decimalPlaces');
        if (decimalPlacesSelect) {
            this.settings.decimalPlaces = parseInt(decimalPlacesSelect.value);
            this.applySettingChange('decimalPlaces', parseInt(decimalPlacesSelect.value));
        }
    }

    updateCacheDuration() {
        const cacheDurationSelect = document.getElementById('cacheDuration');
        if (cacheDurationSelect) {
            this.settings.cacheDuration = parseInt(cacheDurationSelect.value);
            this.applySettingChange('cacheDuration', parseInt(cacheDurationSelect.value));
        }
    }

    updateShowTrends() {
        const showTrendsToggle = document.getElementById('showTrends');
        if (showTrendsToggle) {
            this.settings.showTrends = showTrendsToggle.checked;
            this.applySettingChange('showTrends', showTrendsToggle.checked);
        }
    }

    async applySettingChange(setting, value) {
        try {
            // Update settings in storage
            await chrome.storage.sync.set({ settings: this.settings });
            
            // Show immediate feedback
            this.showToast(`${this.getSettingName(setting)} updated!`, 'success');
            
            // Update statistics if needed
            if (setting === 'baseCurrency' || setting === 'smartShopping') {
                this.loadStatistics();
            }
            
        } catch (error) {
            console.error('Error applying setting change:', error);
            this.showToast('Failed to update setting', 'error');
        }
    }

    getSettingName(setting) {
        const names = {
            'theme': 'Theme',
            'autoRefresh': 'Auto Refresh',
            'refreshInterval': 'Refresh Interval',
            'notifications': 'Notifications',
            'soundAlerts': 'Sound Alerts',
            'smartShopping': 'Smart Shopping',
            'baseCurrency': 'Base Currency',
            'decimalPlaces': 'Decimal Places',
            'cacheDuration': 'Cache Duration',
            'showTrends': 'Show Trends'
        };
        return names[setting] || setting;
    }

    async requestNotificationPermission() {
        try {
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    this.showToast('Notifications enabled! 🔔', 'success');
                } else {
                    this.showToast('Please enable notifications in browser settings', 'error');
                }
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }

    notifyContentScripts(setting, value) {
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.url && !tab.url.startsWith('chrome://')) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'settingChanged',
                        setting: setting,
                        value: value
                    }).catch(() => {
                        // Ignore errors for tabs without content scripts
                    });
                }
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RateRadarOptions();
}); 
    createAlertHTML(alert) {
        const isActive = alert.active ? 'Active' : 'Inactive';
        const statusClass = alert.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
        const alertType = alert.alertType === 'above' ? 'Above' : 'Below';
        const isPriceAlert = alert.isPriceAlert ? ' (Price Alert)' : '';

        return `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="font-medium text-gray-900">
                            ${alert.fromCurrency} → ${alert.toCurrency}${isPriceAlert}
                        </h4>
                        <p class="text-sm text-gray-600">
                            Alert when rate is ${alertType.toLowerCase()} ${alert.targetRate.toFixed(4)}
                        </p>
                    </div>
                    <div class="flex space-x-2">
                        <span class="px-2 py-1 text-xs rounded-full ${statusClass}">
                            ${isActive}
                        </span>
                        <button onclick="rateRadarOptions.toggleAlert('${alert.id}')" class="text-blue-600 hover:text-blue-800 text-sm">
                            ${alert.active ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">
                        Created: ${new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                    <button onclick="rateRadarOptions.deleteAlert('${alert.id}')" class="text-red-600 hover:text-red-800 text-sm">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    async getAlerts() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['alerts'], (result) => {
                resolve(result.alerts || []);
            });
        });
    }

    async toggleAlert(alertId) {
        try {
            const alerts = await this.getAlerts();
            const alertIndex = alerts.findIndex(alert => alert.id === parseInt(alertId));
            
            if (alertIndex !== -1) {
                alerts[alertIndex].active = !alerts[alertIndex].active;
                await chrome.storage.sync.set({ alerts });
                this.showAlertModal(); // Refresh the modal
                this.showStatus(`Alert ${alerts[alertIndex].active ? 'activated' : 'deactivated'}`, 'success');
            }
        } catch (error) {
            console.error('Error toggling alert:', error);
            this.showStatus('Error updating alert', 'error');
        }
    }

    async deleteAlert(alertId) {
        if (confirm('Are you sure you want to delete this alert?')) {
            try {
                const alerts = await this.getAlerts();
                const filteredAlerts = alerts.filter(alert => alert.id !== parseInt(alertId));
                await chrome.storage.sync.set({ alerts: filteredAlerts });
                this.showAlertModal(); // Refresh the modal
                this.showStatus('Alert deleted', 'success');
            } catch (error) {
                console.error('Error deleting alert:', error);
                this.showStatus('Error deleting alert', 'error');
            }
        }
    }

    async exportData() {
        try {
            const data = await chrome.storage.sync.get();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rateradar-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showStatus('Data exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showStatus('Error exporting data', 'error');
        }
    }

    async clearData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            try {
                await chrome.storage.sync.clear();
                await chrome.storage.local.clear();
                this.showStatus('All data cleared', 'success');
                
                // Reload settings to defaults
                setTimeout(() => {
                    this.loadSettings();
                }, 1000);
            } catch (error) {
                console.error('Error clearing data:', error);
                this.showStatus('Error clearing data', 'error');
            }
        }
    }

    showStatus(message, type = 'success') {
        const statusDiv = document.getElementById('statusMessage');
        const statusText = document.getElementById('statusText');
        
        // Remove existing classes
        statusDiv.className = 'mt-4';
        
        // Add appropriate classes based on type
        if (type === 'success') {
            statusDiv.classList.add('bg-green-100', 'border', 'border-green-400', 'text-green-700', 'px-4', 'py-3', 'rounded');
        } else if (type === 'error') {
            statusDiv.classList.add('bg-red-100', 'border', 'border-red-400', 'text-red-700', 'px-4', 'py-3', 'rounded');
        } else {
            statusDiv.classList.add('bg-blue-100', 'border', 'border-blue-400', 'text-blue-700', 'px-4', 'py-3', 'rounded');
        }
        
        statusText.textContent = message;
        statusDiv.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 3000);
    }

    // Make methods available globally for inline onclick handlers
    toggleAlert(alertId) {
        this.toggleAlert(alertId);
    }

    deleteAlert(alertId) {
        this.deleteAlert(alertId);
    }
}

// Initialize RateRadar options when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.rateRadarOptions = new RateRadarOptions();
}); 