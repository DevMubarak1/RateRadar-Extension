// RateRadar Options Page JavaScript - Enhanced with Perfect Functionality
class RateRadarOptions {
    constructor() {
        this.settings = {};
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.loadStatistics();
        this.applyThemeToPage();
    }

    setupEventListeners() {
        // Action Buttons
        this.setupActionButtons();
        
        // Settings Controls
        this.setupSettingsControls();
        
        // Real-time Updates
        this.setupRealTimeUpdates();
    }

    setupActionButtons() {
        // 💾 Save Settings Button
        const saveBtn = document.getElementById('saveSettings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }

        // 🔄 Reset to Default Button
        const resetBtn = document.getElementById('resetSettings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSettings());
        }

        // 📥 Export Data Button
        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // 🗑️ Clear All Data Button
        const clearBtn = document.getElementById('clearData');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllData());
        }
    }

    setupSettingsControls() {
        // Theme Selection
        const themeSelect = document.getElementById('theme');
        if (themeSelect) {
            themeSelect.addEventListener('change', () => this.updateTheme());
        }

        // Auto Refresh Toggle
        const autoRefreshToggle = document.getElementById('autoRefresh');
        if (autoRefreshToggle) {
            autoRefreshToggle.addEventListener('change', () => this.updateAutoRefresh());
        }

        // Refresh Interval
        const refreshIntervalSelect = document.getElementById('refreshInterval');
        if (refreshIntervalSelect) {
            refreshIntervalSelect.addEventListener('change', () => this.updateRefreshInterval());
        }

        // Notifications Toggle
        const notificationsToggle = document.getElementById('notifications');
        if (notificationsToggle) {
            notificationsToggle.addEventListener('change', () => this.updateNotifications());
        }

        // Sound Alerts Toggle
        const soundAlertsToggle = document.getElementById('soundAlerts');
        if (soundAlertsToggle) {
            soundAlertsToggle.addEventListener('change', () => this.updateSoundAlerts());
        }

        // Smart Shopping Toggle
        const smartShoppingToggle = document.getElementById('smartShopping');
        if (smartShoppingToggle) {
            smartShoppingToggle.addEventListener('change', () => this.updateSmartShopping());
        }

        // Base Currency
        const baseCurrencySelect = document.getElementById('baseCurrency');
        if (baseCurrencySelect) {
            baseCurrencySelect.addEventListener('change', () => this.updateBaseCurrency());
        }

        // Decimal Places
        const decimalPlacesSelect = document.getElementById('decimalPlaces');
        if (decimalPlacesSelect) {
            decimalPlacesSelect.addEventListener('change', () => this.updateDecimalPlaces());
        }

        // Cache Duration
        const cacheDurationSelect = document.getElementById('cacheDuration');
        if (cacheDurationSelect) {
            cacheDurationSelect.addEventListener('change', () => this.updateCacheDuration());
        }

        // Show Trends Toggle
        const showTrendsToggle = document.getElementById('showTrends');
        if (showTrendsToggle) {
            showTrendsToggle.addEventListener('change', () => this.updateShowTrends());
        }

        // Alert Check Interval
        const alertCheckIntervalSelect = document.getElementById('alertCheckInterval');
        if (alertCheckIntervalSelect) {
            alertCheckIntervalSelect.addEventListener('change', () => this.updateAlertCheckInterval());
        }

        // Max Alerts
        const maxAlertsSelect = document.getElementById('maxAlerts');
        if (maxAlertsSelect) {
            maxAlertsSelect.addEventListener('change', () => this.updateMaxAlerts());
        }
    }

    setupRealTimeUpdates() {
        // Listen for storage changes to update statistics in real-time
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync') {
                // Update statistics when alerts or favorites change
                if (changes.alerts || changes.favorites) {
                    this.loadStatistics();
                }
            }
            if (namespace === 'local' && changes.statistics) {
                // Update statistics display when local stats change
                this.loadStatistics();
            }
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['settings']);
            this.settings = result.settings || this.getDefaultSettings();
            this.populateSettings();
            console.log('Settings loaded successfully:', this.settings);
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
            showTrends: true,
            alertCheckInterval: 5,
            maxAlerts: 10
        };
    }

    populateSettings() {
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

    // 💾 SAVE SETTINGS FUNCTION
    async saveSettings() {
        try {
            const saveBtn = document.getElementById('saveSettings');
            const originalText = saveBtn.textContent;
            
            // Show loading state
            saveBtn.textContent = '💾 Saving...';
            saveBtn.disabled = true;

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
            ['theme', 'refreshInterval', 'baseCurrency', 'decimalPlaces', 'cacheDuration', 'alertCheckInterval', 'maxAlerts'].forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    newSettings[key] = element.value;
                }
            });

            // Save to Chrome storage
            await chrome.storage.sync.set({ settings: newSettings });
            this.settings = newSettings;

            // Apply theme immediately
            this.applyThemeToPage();

            // Update statistics
            await this.updateStatistics('settings', 1);

            // Show success message
            this.showToast('Settings saved successfully! ✅', 'success');
            
            // Reset button state
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }, 1000);

            console.log('Settings saved successfully:', newSettings);
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showToast('Error saving settings! ❌', 'error');
            
            // Reset button state
            const saveBtn = document.getElementById('saveSettings');
            saveBtn.textContent = '💾 Save Settings';
            saveBtn.disabled = false;
        }
    }

    // 🔄 RESET TO DEFAULT FUNCTION
    async resetSettings() {
        try {
            const resetBtn = document.getElementById('resetSettings');
            const originalText = resetBtn.textContent;
            
            // Show loading state
            resetBtn.textContent = '🔄 Resetting...';
            resetBtn.disabled = true;

            // Get default settings
            const defaultSettings = this.getDefaultSettings();
            
            // Save default settings
            await chrome.storage.sync.set({ settings: defaultSettings });
            this.settings = defaultSettings;
            
            // Repopulate form
            this.populateSettings();
            
            // Apply theme
            this.applyThemeToPage();
            
            // Show success message
            this.showToast('Settings reset to default! 🔄', 'success');
            
            // Reset button state
            setTimeout(() => {
                resetBtn.textContent = originalText;
                resetBtn.disabled = false;
            }, 1000);

            console.log('Settings reset to default:', defaultSettings);
        } catch (error) {
            console.error('Error resetting settings:', error);
            this.showToast('Error resetting settings! ❌', 'error');
            
            // Reset button state
            const resetBtn = document.getElementById('resetSettings');
            resetBtn.textContent = '🔄 Reset to Default';
            resetBtn.disabled = false;
        }
    }

    // 📥 EXPORT DATA FUNCTION
    async exportData() {
        try {
            const exportBtn = document.getElementById('exportData');
            const originalText = exportBtn.textContent;
            
            // Show loading state
            exportBtn.textContent = '📥 Exporting...';
            exportBtn.disabled = true;

            // Get all data from storage
            const [settingsResult, alertsResult, favoritesResult, statsResult] = await Promise.all([
                chrome.storage.sync.get(['settings']),
                chrome.storage.sync.get(['rateAlerts']),
                chrome.storage.sync.get(['favoritePairs']),
                chrome.storage.local.get(['statistics'])
            ]);

            // Prepare export data
            const exportData = {
                settings: settingsResult.settings || {},
                alerts: alertsResult.rateAlerts || {},
                favorites: favoritesResult.favoritePairs || [],
                statistics: statsResult.statistics || {},
                exportDate: new Date().toISOString(),
                version: '1.1.0'
            };

            // Create and download file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `RateRadar_Export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Show success message
            this.showToast('Data exported successfully! 📥', 'success');
            
            // Reset button state
            setTimeout(() => {
                exportBtn.textContent = originalText;
                exportBtn.disabled = false;
            }, 1000);

            console.log('Data exported successfully');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showToast('Error exporting data! ❌', 'error');
            
            // Reset button state
            const exportBtn = document.getElementById('exportData');
            exportBtn.textContent = '📥 Export Data';
            exportBtn.disabled = false;
        }
    }

    // 🗑️ CLEAR ALL DATA FUNCTION
    async clearAllData() {
        try {
            const clearBtn = document.getElementById('clearData');
            const originalText = clearBtn.textContent;
            
            // Show loading state
            clearBtn.textContent = '🗑️ Clearing...';
            clearBtn.disabled = true;

            // Show confirmation dialog
            const confirmed = confirm('Are you sure you want to clear ALL data? This action cannot be undone.\n\nThis will remove:\n• All settings\n• All alerts\n• All favorites\n• All statistics\n• All cached data');
            
            if (!confirmed) {
                clearBtn.textContent = originalText;
                clearBtn.disabled = false;
                return;
            }

            // Clear all storage
            await Promise.all([
                chrome.storage.sync.clear(),
                chrome.storage.local.clear()
            ]);

            // Reset to default settings
            const defaultSettings = this.getDefaultSettings();
            await chrome.storage.sync.set({ settings: defaultSettings });
            this.settings = defaultSettings;
            
            // Repopulate form
            this.populateSettings();
            
            // Apply theme
            this.applyThemeToPage();
            
            // Reset statistics
                this.loadStatistics();
            
            // Show success message
            this.showToast('All data cleared successfully! 🗑️', 'success');
            
            // Reset button state
                setTimeout(() => {
                clearBtn.textContent = originalText;
                clearBtn.disabled = false;
                }, 1000);

            console.log('All data cleared successfully');
            } catch (error) {
                console.error('Error clearing data:', error);
            this.showToast('Error clearing data! ❌', 'error');
            
            // Reset button state
            const clearBtn = document.getElementById('clearData');
            clearBtn.textContent = '🗑️ Clear All Data';
            clearBtn.disabled = false;
        }
    }

    // Individual Settings Update Functions
    async updateTheme() {
        const theme = document.getElementById('theme').value;
        this.settings.theme = theme;
        await this.saveSettingsToStorage();
        this.applyThemeToPage();
        this.showToast(`Theme changed to ${theme}! 🎨`, 'success');
    }

    async updateAutoRefresh() {
        const autoRefresh = document.getElementById('autoRefresh').checked;
        this.settings.autoRefresh = autoRefresh;
        await this.saveSettingsToStorage();
        this.showToast(`Auto refresh ${autoRefresh ? 'enabled' : 'disabled'}! 🔄`, 'success');
    }

    async updateRefreshInterval() {
        const interval = document.getElementById('refreshInterval').value;
        this.settings.refreshInterval = interval;
        await this.saveSettingsToStorage();
        this.showToast(`Refresh interval set to ${interval} minutes! ⏱️`, 'success');
    }

    async updateNotifications() {
        const notifications = document.getElementById('notifications').checked;
        this.settings.notifications = notifications;
        await this.saveSettingsToStorage();
        this.showToast(`Notifications ${notifications ? 'enabled' : 'disabled'}! 🔔`, 'success');
    }

    async updateSoundAlerts() {
        const soundAlerts = document.getElementById('soundAlerts').checked;
        this.settings.soundAlerts = soundAlerts;
        await this.saveSettingsToStorage();
        this.showToast(`Sound alerts ${soundAlerts ? 'enabled' : 'disabled'}! 🔊`, 'success');
    }

    async updateSmartShopping() {
        const smartShopping = document.getElementById('smartShopping').checked;
        this.settings.smartShopping = smartShopping;
        await this.saveSettingsToStorage();
        this.showToast(`Smart shopping ${smartShopping ? 'enabled' : 'disabled'}! 🛒`, 'success');
    }

    async updateBaseCurrency() {
        const baseCurrency = document.getElementById('baseCurrency').value;
        this.settings.baseCurrency = baseCurrency;
        await this.saveSettingsToStorage();
        this.showToast(`Base currency set to ${baseCurrency}! 💱`, 'success');
    }

    async updateDecimalPlaces() {
        const decimalPlaces = document.getElementById('decimalPlaces').value;
        this.settings.decimalPlaces = decimalPlaces;
        await this.saveSettingsToStorage();
        this.showToast(`Decimal places set to ${decimalPlaces}! 🔢`, 'success');
    }

    async updateCacheDuration() {
        const cacheDuration = document.getElementById('cacheDuration').value;
        this.settings.cacheDuration = cacheDuration;
        await this.saveSettingsToStorage();
        this.showToast(`Cache duration set to ${cacheDuration} seconds! 💾`, 'success');
    }

    async updateShowTrends() {
        const showTrends = document.getElementById('showTrends').checked;
        this.settings.showTrends = showTrends;
        await this.saveSettingsToStorage();
        this.showToast(`Trends display ${showTrends ? 'enabled' : 'disabled'}! 📈`, 'success');
    }

    async updateAlertCheckInterval() {
        const alertCheckInterval = document.getElementById('alertCheckInterval').value;
        this.settings.alertCheckInterval = alertCheckInterval;
        await this.saveSettingsToStorage();
        this.showToast(`Alert check interval set to ${alertCheckInterval} minutes! ⏰`, 'success');
    }

    async updateMaxAlerts() {
        const maxAlerts = document.getElementById('maxAlerts').value;
        this.settings.maxAlerts = maxAlerts;
        await this.saveSettingsToStorage();
        this.showToast(`Max alerts set to ${maxAlerts}! 🔔`, 'success');
    }

    async saveSettingsToStorage() {
        try {
            await chrome.storage.sync.set({ settings: this.settings });
        } catch (error) {
            console.error('Error saving settings to storage:', error);
        }
    }

    applyThemeToPage() {
        const theme = this.settings.theme || 'light';
            document.documentElement.setAttribute('data-theme', theme);
        console.log('Theme applied:', theme);
    }

    async loadStatistics() {
        try {
            // Get statistics from local storage
            const result = await chrome.storage.local.get(['statistics']);
            const stats = result.statistics || {};
            
            // Get alerts count
            const alertsResult = await chrome.storage.sync.get(['alerts']);
            const alerts = alertsResult.alerts || [];
            const activeAlertsCount = alerts.filter(alert => alert.status === 'active').length;
            
            // Get favorites count
            const favoritesResult = await chrome.storage.sync.get(['favorites']);
            const favorites = favoritesResult.favorites || [];
            
            // Update statistics display
            const totalConversions = document.getElementById('totalConversions');
            const activeAlerts = document.getElementById('activeAlerts');
            const favoritePairs = document.getElementById('favoritePairs');
            const smartShoppingUses = document.getElementById('smartShoppingUses');
            
            if (totalConversions) {
                totalConversions.textContent = stats.totalConversions || 0;
            }
            if (activeAlerts) {
                activeAlerts.textContent = activeAlertsCount;
            }
            if (favoritePairs) {
                favoritePairs.textContent = favorites.length;
            }
            if (smartShoppingUses) {
                smartShoppingUses.textContent = stats.smartShoppingUses || 0;
            }
            
            console.log('Statistics loaded:', {
                totalConversions: stats.totalConversions || 0,
                activeAlerts: activeAlertsCount,
                favoritePairs: favorites.length,
                smartShoppingUses: stats.smartShoppingUses || 0
            });
            
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    async updateStatistics(type, increment = 1) {
        try {
            const result = await chrome.storage.local.get(['statistics']);
            const stats = result.statistics || {};
            
            switch (type) {
                case 'conversion':
                    stats.totalConversions = (stats.totalConversions || 0) + increment;
                    break;
                case 'alert':
                    stats.activeAlerts = (stats.activeAlerts || 0) + increment;
                    break;
                case 'favorite':
                    stats.favoritePairs = (stats.favoritePairs || 0) + increment;
                    break;
                case 'smartShopping':
                    stats.smartShoppingUses = (stats.smartShoppingUses || 0) + increment;
                    break;
                case 'settings':
                    // This case is handled by saveSettings, but we can update it here
                    // if we want to reflect the current settings in the statistics display
                    // For now, we'll just log it.
                    break;
            }
            
            await chrome.storage.local.set({ statistics: stats });
            console.log(`Statistics updated - ${type}:`, stats);
            
            // Reload statistics display
            this.loadStatistics();
            
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('successToast');
        if (toast) {
            toast.textContent = message;
            toast.className = `success-toast ${type}`;
            toast.classList.add('show');
            
            // Auto hide after 3 seconds
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