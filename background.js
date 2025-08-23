// RateRadar Simplified Background Service Worker
class RateRadarBackground {
    constructor() {
        this.alarmInterval = 5; // 5 minutes
        this.alerts = new Map();
        this.init();
    }

    async init() {
        try {
            console.log('RateRadar Background initializing...');
            
            // Load existing alerts
            await this.loadAlerts();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup alarms
            this.setupAlarms();
            
            // Handle installation
            this.handleInstallation();
            
            console.log('RateRadar Background initialized successfully');
        } catch (error) {
            console.error('RateRadar Background initialization error:', error);
        }
    }

    async loadAlerts() {
        try {
            const result = await chrome.storage.sync.get('rateAlerts');
            if (result.rateAlerts) {
                this.alerts = new Map(Object.entries(result.rateAlerts));
            }
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    }

    async saveAlerts() {
        try {
            const alertsObject = Object.fromEntries(this.alerts);
            await chrome.storage.sync.set({ rateAlerts: alertsObject });
        } catch (error) {
            console.error('Error saving alerts:', error);
        }
    }

    setupEventListeners() {
        // Handle extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.onFirstInstall();
            } else if (details.reason === 'update') {
                this.onUpdate(details.previousVersion);
            }
        });

        // Handle alarm events
        chrome.alarms.onAlarm.addListener((alarm) => {
            if (alarm.name === 'checkAlerts') {
                this.checkAlerts();
            } else if (alarm.name === 'updateRates') {
                this.updateRates();
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

        // Handle extension startup
        chrome.runtime.onStartup.addListener(() => {
            this.onStartup();
        });
    }

    setupAlarms() {
        // Create alarm to check alerts every 5 minutes
        chrome.alarms.create('checkAlerts', {
            delayInMinutes: 1,
            periodInMinutes: this.alarmInterval
        });

        // Create alarm to update rates every 15 minutes
        chrome.alarms.create('updateRates', {
            delayInMinutes: 5,
            periodInMinutes: 15
        });
    }

    handleInstallation() {
        // Check if this is the first install
        chrome.storage.sync.get('firstInstall', (result) => {
            if (!result.firstInstall) {
                this.onFirstInstall();
            }
        });
    }

    onFirstInstall() {
        console.log('RateRadar first install detected');
        
        // Set default settings
        const defaultSettings = {
            firstInstall: true,
            installDate: Date.now(),
            baseCurrency: 'USD',
            userCurrency: 'USD',
            theme: 'light',
            autoRefresh: false,
            refreshInterval: 5,
            notifications: true,
            soundAlerts: false,
            smartShopping: false,
            decimalPlaces: 2,
            showTrends: false,
            totalConversions: 0,
            activeAlerts: 0,
            favoritePairs: 0
        };

        chrome.storage.sync.set(defaultSettings, () => {
            console.log('Default settings saved');
        });

        // Show welcome notification
        this.showWelcomeNotification();
    }

    onUpdate(previousVersion) {
        console.log(`RateRadar updated from ${previousVersion} to 1.1.0`);
        
        // Show update notification
        this.showUpdateNotification(previousVersion);
    }

    onStartup() {
        console.log('RateRadar startup detected');
        this.checkAlerts();
    }

    async checkAlerts() {
        try {
            console.log('Checking alerts...');
            // Simple alert checking - can be enhanced later
        } catch (error) {
            console.error('Error checking alerts:', error);
        }
    }

    async updateRates() {
        try {
            console.log('Updating rates...');
            // Simple rate updating - can be enhanced later
        } catch (error) {
            console.error('Error updating rates:', error);
        }
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'getCachedRate':
                    const rate = await this.getCachedRate(request.fromCurrency, request.toCurrency);
                    sendResponse({ success: true, rate: rate });
                    break;

                case 'updateRate':
                    const newRate = await this.updatePairRate(request.fromCurrency, request.toCurrency);
                    sendResponse({ success: true, rate: newRate });
                    break;

                case 'addAlert':
                    const alertId = await this.addAlert(request.alertData);
                    sendResponse({ success: true, alertId: alertId });
                    break;

                case 'removeAlert':
                    await this.removeAlert(request.alertId);
                    sendResponse({ success: true });
                    break;

                case 'getAlerts':
                    const alerts = Array.from(this.alerts.values());
                    sendResponse({ success: true, alerts: alerts });
                    break;

                case 'updateSettings':
                    await this.updateSettings(request.settings);
                    sendResponse({ success: true });
                    break;

                case 'getSettings':
                    const settings = await this.getSettings();
                    sendResponse({ success: true, settings: settings });
                    break;

                case 'incrementConversion':
                    await this.incrementConversion();
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

    async addAlert(alertData) {
        const alertId = 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const alert = {
            id: alertId,
            fromCurrency: alertData.fromCurrency,
            toCurrency: alertData.toCurrency,
            targetRate: parseFloat(alertData.targetRate),
            condition: alertData.condition,
            isActive: true,
            createdAt: Date.now(),
            lastChecked: 0,
            triggered: false,
            description: alertData.description || '',
            type: alertData.type || 'currency'
        };

        this.alerts.set(alertId, alert);
        await this.saveAlerts();
        return alertId;
    }

    async removeAlert(alertId) {
        this.alerts.delete(alertId);
        await this.saveAlerts();
    }

    async getCachedRate(fromCurrency, toCurrency) {
        try {
            const cacheKey = `rate_${fromCurrency}_${toCurrency}`;
            const result = await chrome.storage.local.get(cacheKey);
            
            if (result[cacheKey] && !this.isCacheExpired(result[cacheKey].timestamp)) {
                return result[cacheKey].rate;
            }
            
            return null;
        } catch (error) {
            console.error('Error getting cached rate:', error);
            return null;
        }
    }

    async updatePairRate(fromCurrency, toCurrency) {
        try {
            const rate = await this.getExchangeRate(fromCurrency, toCurrency);
            if (rate) {
                const cacheKey = `rate_${fromCurrency}_${toCurrency}`;
                await chrome.storage.local.set({
                    [cacheKey]: {
                        rate: rate,
                        timestamp: Date.now()
                    }
                });
                return rate;
            }
        } catch (error) {
            console.error(`Error updating rate for ${fromCurrency}/${toCurrency}:`, error);
        }
        return null;
    }

    async getExchangeRate(fromCurrency, toCurrency) {
        const exchangeAPIs = [
            'https://api.exchangerate-api.com/v4/latest',
            'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies',
            'https://latest.currency-api.pages.dev/v1/currencies'
        ];

        const from = fromCurrency.toLowerCase();
        const to = toCurrency.toLowerCase();

        for (let i = 0; i < exchangeAPIs.length; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                let response, data;
                
                if (exchangeAPIs[i].includes('fawazahmed0') || exchangeAPIs[i].includes('currency-api')) {
                    const url = `${exchangeAPIs[i]}/${from}.json`;
                    response = await fetch(url, { 
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'RateRadar/1.1'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    
                    data = await response.json();
                    if (data[from] && data[from][to]) {
                        return data[from][to];
                    }
                } else if (exchangeAPIs[i].includes('exchangerate-api')) {
                    const url = `${exchangeAPIs[i]}/${from.toUpperCase()}`;
                    response = await fetch(url, { 
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'RateRadar/1.1'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    
                    data = await response.json();
                    if (data.rates && data.rates[to.toUpperCase()]) {
                        return data.rates[to.toUpperCase()];
                    }
                }
            } catch (error) {
                console.log(`API ${i + 1} failed:`, error);
                continue;
            }
        }
        
        return null;
    }

    isCacheExpired(timestamp) {
        const cacheTimeout = 5 * 60 * 1000; // 5 minutes
        return Date.now() - timestamp > cacheTimeout;
    }

    async updateSettings(newSettings) {
        try {
            await chrome.storage.sync.set(newSettings);
        } catch (error) {
            console.error('Error updating settings:', error);
        }
    }

    async getSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'baseCurrency', 'userCurrency', 'theme', 'autoRefresh',
                'refreshInterval', 'notifications', 'soundAlerts',
                'smartShopping', 'decimalPlaces', 'showTrends',
                'totalConversions', 'activeAlerts', 'favoritePairs'
            ]);
            return result;
        } catch (error) {
            console.error('Error getting settings:', error);
            return {};
        }
    }

    async incrementConversion() {
        try {
            const result = await chrome.storage.sync.get('totalConversions');
            const currentCount = result.totalConversions || 0;
            await chrome.storage.sync.set({ totalConversions: currentCount + 1 });
        } catch (error) {
            console.error('Error incrementing conversion count:', error);
        }
    }

    handleNotificationClick(notificationId) {
        // Handle notification clicks
        if (notificationId.startsWith('rateradar_')) {
            // Open popup or options page
            chrome.action.openPopup();
        }
    }

    showWelcomeNotification() {
        chrome.notifications.create('welcome', {
            type: 'basic',
            iconUrl: 'icons/icon.png',
            title: 'Welcome to RateRadar!',
            message: 'Your currency and crypto tracking companion is ready to use.',
            priority: 1
        });
    }

    showUpdateNotification(previousVersion) {
        chrome.notifications.create('update', {
            type: 'basic',
            iconUrl: 'icons/icon.png',
            title: 'RateRadar Updated!',
            message: `Updated from ${previousVersion} to 1.1.0. New features include enhanced alerts and 180+ currency support.`,
            priority: 1
        });
    }
}

// Initialize background service worker
const rateRadarBackground = new RateRadarBackground(); 