// RateRadar Options Page JavaScript
class RateRadarOptions {
    constructor() {
        this.defaultSettings = {
            theme: 'light',
            defaultCurrency: 'USD',
            refreshInterval: 5,
            notifications: true,
            soundAlerts: false,
            autoRefresh: true,
            smartShopping: false,
            priceHighlighting: false,
            shoppingCurrency: 'USD',
            maxAlerts: 10,
            autoDeactivate: false,
            analytics: true
        };
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Save settings button
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Reset settings button
        document.getElementById('resetSettings').addEventListener('click', () => {
            this.resetSettings();
        });

        // Manage alerts button
        document.getElementById('manageAlerts').addEventListener('click', () => {
            this.showAlertModal();
        });

        // Export data button
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        // Clear data button
        document.getElementById('clearData').addEventListener('click', () => {
            this.clearData();
        });

        // Alert modal close button
        document.getElementById('closeAlertModal').addEventListener('click', () => {
            this.hideAlertModal();
        });

        // Close modal when clicking outside
        document.getElementById('alertModal').addEventListener('click', (e) => {
            if (e.target.id === 'alertModal') {
                this.hideAlertModal();
            }
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['settings']);
            const settings = { ...this.defaultSettings, ...result.settings };

            // Populate form fields
            document.getElementById('theme').value = settings.theme;
            document.getElementById('defaultCurrency').value = settings.defaultCurrency;
            document.getElementById('refreshInterval').value = settings.refreshInterval;
            document.getElementById('notifications').checked = settings.notifications;
            document.getElementById('soundAlerts').checked = settings.soundAlerts;
            document.getElementById('autoRefresh').checked = settings.autoRefresh;
            document.getElementById('smartShopping').checked = settings.smartShopping;
            document.getElementById('priceHighlighting').checked = settings.priceHighlighting;
            document.getElementById('shoppingCurrency').value = settings.shoppingCurrency;
            document.getElementById('maxAlerts').value = settings.maxAlerts;
            document.getElementById('autoDeactivate').checked = settings.autoDeactivate;
            document.getElementById('analytics').checked = settings.analytics;

        } catch (error) {
            console.error('Error loading settings:', error);
            this.showStatus('Error loading settings', 'error');
        }
    }

    async saveSettings() {
        try {
            const settings = {
                theme: document.getElementById('theme').value,
                defaultCurrency: document.getElementById('defaultCurrency').value,
                refreshInterval: parseInt(document.getElementById('refreshInterval').value),
                notifications: document.getElementById('notifications').checked,
                soundAlerts: document.getElementById('soundAlerts').checked,
                autoRefresh: document.getElementById('autoRefresh').checked,
                smartShopping: document.getElementById('smartShopping').checked,
                priceHighlighting: document.getElementById('priceHighlighting').checked,
                shoppingCurrency: document.getElementById('shoppingCurrency').value,
                maxAlerts: parseInt(document.getElementById('maxAlerts').value),
                autoDeactivate: document.getElementById('autoDeactivate').checked,
                analytics: document.getElementById('analytics').checked
            };

            await chrome.storage.sync.set({ settings });

            // Update background script if needed
            chrome.runtime.sendMessage({
                action: 'updateSettings',
                settings: settings
            });

            this.showStatus('Settings saved successfully!', 'success');

            // Update alarm interval if refresh interval changed
            if (settings.refreshInterval !== this.defaultSettings.refreshInterval) {
                chrome.runtime.sendMessage({
                    action: 'updateAlarmInterval',
                    interval: settings.refreshInterval
                });
            }

        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('Error saving settings', 'error');
        }
    }

    async resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            try {
                await chrome.storage.sync.set({ settings: this.defaultSettings });
                await this.loadSettings();
                this.showStatus('Settings reset to defaults', 'success');
            } catch (error) {
                console.error('Error resetting settings:', error);
                this.showStatus('Error resetting settings', 'error');
            }
        }
    }

    async showAlertModal() {
        try {
            const alerts = await this.getAlerts();
            const modal = document.getElementById('alertModal');
            const alertsList = document.getElementById('alertsList');

            if (alerts.length === 0) {
                alertsList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4 19h6a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        <p>No active alerts</p>
                        <p class="text-sm">Create alerts in the main extension popup</p>
                    </div>
                `;
            } else {
                alertsList.innerHTML = alerts.map(alert => this.createAlertHTML(alert)).join('');
            }

            modal.classList.remove('hidden');

        } catch (error) {
            console.error('Error loading alerts:', error);
            this.showStatus('Error loading alerts', 'error');
        }
    }

    hideAlertModal() {
        document.getElementById('alertModal').classList.add('hidden');
    }

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