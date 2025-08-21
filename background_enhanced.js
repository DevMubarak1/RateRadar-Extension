// RateRadar Enhanced Background Service Worker
class RateRadarBackground {
    constructor() {
        this.alarmInterval = 5; // 5 minutes
        this.alertSystem = null;
        this.init();
    }

    async init() {
        try {
            console.log('RateRadar Background initializing...');
            
            // Initialize alert system
            await this.initAlertSystem();
            
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

    async initAlertSystem() {
        try {
            // Import and initialize alert system
            const { RateRadarAlerts } = await import('./alerts.js');
            this.alertSystem = new RateRadarAlerts();
        } catch (error) {
            console.error('Error initializing alert system:', error);
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
            if (this.alertSystem) {
                await this.alertSystem.checkAlerts();
            }
        } catch (error) {
            console.error('Error checking alerts:', error);
        }
    }

    async updateRates() {
        try {
            // Update cached rates
            await this.updateCachedRates();
        } catch (error) {
            console.error('Error updating rates:', error);
        }
    }

    async updateCachedRates() {
        try {
            // Get user's favorite currency pairs
            const result = await chrome.storage.sync.get('favoritePairs');
            const favoritePairs = result.favoritePairs || [];

            // Update rates for favorite pairs
            for (const pair of favoritePairs) {
                await this.updatePairRate(pair.from, pair.to);
            }
        } catch (error) {
            console.error('Error updating cached rates:', error);
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
            }
        } catch (error) {
            console.error(`Error updating rate for ${fromCurrency}/${toCurrency}:`, error);
        }
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
                    if (this.alertSystem) {
                        const alertId = await this.alertSystem.addAlert(request.alertData);
                        sendResponse({ success: true, alertId: alertId });
                    } else {
                        sendResponse({ success: false, error: 'Alert system not initialized' });
                    }
                    break;

                case 'removeAlert':
                    if (this.alertSystem) {
                        await this.alertSystem.removeAlert(request.alertId);
                        sendResponse({ success: true });
                    } else {
                        sendResponse({ success: false, error: 'Alert system not initialized' });
                    }
                    break;

                case 'getAlerts':
                    if (this.alertSystem) {
                        const alerts = this.alertSystem.getAllAlerts();
                        sendResponse({ success: true, alerts: alerts });
                    } else {
                        sendResponse({ success: false, error: 'Alert system not initialized' });
                    }
                    break;

                case 'getAlertStats':
                    if (this.alertSystem) {
                        const stats = this.alertSystem.getAlertStats();
                        sendResponse({ success: true, stats: stats });
                    } else {
                        sendResponse({ success: false, error: 'Alert system not initialized' });
                    }
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

                case 'addFavoritePair':
                    await this.addFavoritePair(request.pair);
                    sendResponse({ success: true });
                    break;

                case 'removeFavoritePair':
                    await this.removeFavoritePair(request.pair);
                    sendResponse({ success: true });
                    break;

                case 'getFavoritePairs':
                    const pairs = await this.getFavoritePairs();
                    sendResponse({ success: true, pairs: pairs });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
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

    async addFavoritePair(pair) {
        try {
            const result = await chrome.storage.sync.get('favoritePairs');
            const pairs = result.favoritePairs || [];
            
            // Check if pair already exists
            const exists = pairs.some(p => p.from === pair.from && p.to === pair.to);
            if (!exists) {
                pairs.push(pair);
                await chrome.storage.sync.set({ favoritePairs: pairs });
            }
        } catch (error) {
            console.error('Error adding favorite pair:', error);
        }
    }

    async removeFavoritePair(pair) {
        try {
            const result = await chrome.storage.sync.get('favoritePairs');
            const pairs = result.favoritePairs || [];
            
            const filteredPairs = pairs.filter(p => !(p.from === pair.from && p.to === pair.to));
            await chrome.storage.sync.set({ favoritePairs: filteredPairs });
        } catch (error) {
            console.error('Error removing favorite pair:', error);
        }
    }

    async getFavoritePairs() {
        try {
            const result = await chrome.storage.sync.get('favoritePairs');
            return result.favoritePairs || [];
        } catch (error) {
            console.error('Error getting favorite pairs:', error);
            return [];
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

    // Analytics and tracking (for monetization)
    async trackEvent(eventName, eventData) {
        try {
            // This would send analytics data to your backend
            console.log('Analytics event:', eventName, eventData);
            
            // Store locally for now
            const result = await chrome.storage.local.get('analytics');
            const analytics = result.analytics || [];
            analytics.push({
                event: eventName,
                data: eventData,
                timestamp: Date.now()
            });
            
            // Keep only last 100 events
            if (analytics.length > 100) {
                analytics.splice(0, analytics.length - 100);
            }
            
            await chrome.storage.local.set({ analytics: analytics });
        } catch (error) {
            console.error('Error tracking event:', error);
        }
    }
}

// Initialize background service worker
const rateRadarBackground = new RateRadarBackground(); 