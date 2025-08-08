// RateRadar Background Service Worker
class RateRadarBackground {
    constructor() {
        this.alarmInterval = 5; // Check every 5 minutes
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAlarms();
        this.checkAlerts();
    }

    setupEventListeners() {
        // Handle extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.onFirstInstall();
            }
        });

        // Handle alarm events
        chrome.alarms.onAlarm.addListener((alarm) => {
            if (alarm.name === 'checkAlerts') {
                this.checkAlerts();
            }
        });

        // Handle notification clicks
        chrome.notifications.onClicked.addListener((notificationId) => {
            this.handleNotificationClick(notificationId);
        });

        // Handle messages from popup/content scripts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async response
        });
    }

    setupAlarms() {
        // Create alarm to check alerts every 5 minutes
        chrome.alarms.create('checkAlerts', {
            delayInMinutes: this.alarmInterval,
            periodInMinutes: this.alarmInterval
        });
    }

    async checkAlerts() {
        try {
            const alerts = await this.getStoredAlerts();
            const activeAlerts = alerts.filter(alert => alert.active);

            if (activeAlerts.length === 0) {
                return;
            }

            // Check each active alert
            for (const alert of activeAlerts) {
                await this.checkSingleAlert(alert);
            }
        } catch (error) {
            console.error('Error checking alerts:', error);
        }
    }

    async checkSingleAlert(alert) {
        try {
            // Get current exchange rate
            const currentRate = await this.getCurrentRate(alert.fromCurrency, alert.toCurrency);
            
            let shouldTrigger = false;
            let message = '';

            if (alert.alertType === 'above' && currentRate >= alert.targetRate) {
                shouldTrigger = true;
                message = `${alert.fromCurrency}/${alert.toCurrency} rate is now ${currentRate.toFixed(4)} (above your target of ${alert.targetRate.toFixed(4)})`;
            } else if (alert.alertType === 'below' && currentRate <= alert.targetRate) {
                shouldTrigger = true;
                message = `${alert.fromCurrency}/${alert.toCurrency} rate is now ${currentRate.toFixed(4)} (below your target of ${alert.targetRate.toFixed(4)})`;
            }

            if (shouldTrigger) {
                await this.showNotification(alert, message, currentRate);
                
                // Optionally deactivate the alert after triggering
                // await this.deactivateAlert(alert.id);
            }
        } catch (error) {
            console.error(`Error checking alert ${alert.id}:`, error);
        }
    }

    async getCurrentRate(fromCurrency, toCurrency) {
        const response = await fetch(`https://api.exchangerate.host/convert?from=${fromCurrency}&to=${toCurrency}&amount=1`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Failed to fetch current rate');
        }
        
        return data.result;
    }

    async showNotification(alert, message, currentRate) {
        const notificationId = `alert_${alert.id}`;
        
        const notificationOptions = {
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'RateRadar Alert',
            message: message,
            priority: 1,
            requireInteraction: false
        };

        try {
            await chrome.notifications.create(notificationId, notificationOptions);
            
            // Store notification data for click handling
            await this.storeNotificationData(notificationId, {
                alertId: alert.id,
                fromCurrency: alert.fromCurrency,
                toCurrency: alert.toCurrency,
                currentRate: currentRate,
                targetRate: alert.targetRate
            });
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    async handleNotificationClick(notificationId) {
        try {
            const notificationData = await this.getNotificationData(notificationId);
            
            if (notificationData) {
                // Open the popup with the alert details
                await chrome.action.openPopup();
                
                // Send message to popup to show alert details
                chrome.runtime.sendMessage({
                    action: 'showAlertDetails',
                    data: notificationData
                });
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'getAlerts':
                    const alerts = await this.getStoredAlerts();
                    sendResponse({ success: true, alerts });
                    break;
                    
                case 'addAlert':
                    await this.addAlert(request.alert);
                    sendResponse({ success: true });
                    break;
                    
                case 'updateAlert':
                    await this.updateAlert(request.alertId, request.updates);
                    sendResponse({ success: true });
                    break;
                    
                case 'deleteAlert':
                    await this.deleteAlert(request.alertId);
                    sendResponse({ success: true });
                    break;
                    
                case 'checkAlertsNow':
                    await this.checkAlerts();
                    sendResponse({ success: true });
                    break;
                    
                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async getStoredAlerts() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['alerts'], (result) => {
                resolve(result.alerts || []);
            });
        });
    }

    async addAlert(alert) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['alerts'], (result) => {
                const alerts = result.alerts || [];
                alerts.push(alert);
                chrome.storage.sync.set({ alerts }, resolve);
            });
        });
    }

    async updateAlert(alertId, updates) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['alerts'], (result) => {
                const alerts = result.alerts || [];
                const index = alerts.findIndex(alert => alert.id === alertId);
                
                if (index !== -1) {
                    alerts[index] = { ...alerts[index], ...updates };
                    chrome.storage.sync.set({ alerts }, resolve);
                } else {
                    resolve();
                }
            });
        });
    }

    async deleteAlert(alertId) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['alerts'], (result) => {
                const alerts = result.alerts || [];
                const filteredAlerts = alerts.filter(alert => alert.id !== alertId);
                chrome.storage.sync.set({ alerts: filteredAlerts }, resolve);
            });
        });
    }

    async deactivateAlert(alertId) {
        await this.updateAlert(alertId, { active: false });
    }

    async storeNotificationData(notificationId, data) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [notificationId]: data }, resolve);
        });
    }

    async getNotificationData(notificationId) {
        return new Promise((resolve) => {
            chrome.storage.local.get([notificationId], (result) => {
                resolve(result[notificationId]);
            });
        });
    }

    onFirstInstall() {
        // Set up default settings
        const defaultSettings = {
            theme: 'light',
            notifications: true,
            autoRefresh: true,
            refreshInterval: 5
        };

        chrome.storage.sync.set({ settings: defaultSettings }, () => {
            console.log('RateRadar installed with default settings');
        });
    }

    // Smart shopping alert functionality (future feature)
    async detectProductPrices() {
        // This would be implemented in content script
        // Background script would handle the alert logic
        console.log('Product price detection not yet implemented');
    }

    // Analytics and tracking (for monetization)
    async trackEvent(eventName, eventData) {
        // This would send analytics data to your backend
        console.log('Analytics event:', eventName, eventData);
    }
}

// Initialize the background service worker
const rateRadarBackground = new RateRadarBackground(); 