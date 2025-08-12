// RateRadar Background Script
// Handles notifications, alarms, and background tasks

class RateRadarBackground {
    constructor() {
        this.settings = {};
        this.alerts = [];
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.setupAlarms();
        console.log('RateRadar background script initialized');
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['settings', 'alerts']);
            this.settings = result.settings || this.getDefaultSettings();
            this.alerts = result.alerts || [];
            console.log('Background: Settings loaded:', this.settings);
        } catch (error) {
            console.error('Background: Error loading settings:', error);
            this.settings = this.getDefaultSettings();
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

    setupEventListeners() {
        // Listen for messages from popup and content scripts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true;
        });

        // Listen for storage changes
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync') {
                this.handleStorageChanges(changes);
            }
        });

        // Listen for alarm events
        chrome.alarms.onAlarm.addListener((alarm) => {
            this.handleAlarm(alarm);
        });

        // Listen for notification clicks
        chrome.notifications.onClicked.addListener((notificationId) => {
            this.handleNotificationClick(notificationId);
        });
    }

    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'setAlert':
                this.setAlert(request.data);
                sendResponse({ success: true });
                break;
                
            case 'removeAlert':
                this.removeAlert(request.alertId);
                sendResponse({ success: true });
                break;
                
            case 'getAlerts':
                sendResponse({ success: true, alerts: this.alerts });
                break;
                
            case 'pricesDetected':
                this.handlePricesDetected(request.prices, request.url);
                sendResponse({ success: true });
                break;
                
            case 'playSound':
                this.playSound(request.soundType);
                sendResponse({ success: true });
                break;
                
            case 'showNotification':
                this.showNotification(request.title, request.message, request.type);
                sendResponse({ success: true });
                break;
                
            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    }

    handleStorageChanges(changes) {
        if (changes.settings) {
            this.settings = changes.settings.newValue || this.getDefaultSettings();
            console.log('Background: Settings updated:', this.settings);
        }
        
        if (changes.alerts) {
            this.alerts = changes.alerts.newValue || [];
            this.updateAlarms();
        }
    }

    async setAlert(alertData) {
        try {
            const alert = {
                id: Date.now().toString(),
                ...alertData,
                createdAt: new Date().toISOString(),
                isActive: true
            };
            
            this.alerts.push(alert);
            await chrome.storage.sync.set({ alerts: this.alerts });
            
            // Set alarm for this alert
            this.setAlertAlarm(alert);
            
            console.log('Alert set:', alert);
            
            // Show confirmation notification
            if (this.settings.notifications) {
                this.showNotification(
                    'Alert Set',
                    `Rate alert set for ${alert.fromCurrency}/${alert.toCurrency}`,
                    'success'
                );
            }
            
        } catch (error) {
            console.error('Error setting alert:', error);
        }
    }

    async removeAlert(alertId) {
        try {
            this.alerts = this.alerts.filter(alert => alert.id !== alertId);
            await chrome.storage.sync.set({ alerts: this.alerts });
            
            // Clear alarm for this alert
            chrome.alarms.clear(`alert_${alertId}`);
            
            console.log('Alert removed:', alertId);
            
        } catch (error) {
            console.error('Error removing alert:', error);
        }
    }

    setAlertAlarm(alert) {
        const alarmName = `alert_${alert.id}`;
        const checkInterval = 5 * 60 * 1000; // Check every 5 minutes
        
        chrome.alarms.create(alarmName, {
            delayInMinutes: 1, // Start checking after 1 minute
            periodInMinutes: 5 // Check every 5 minutes
        });
    }

    updateAlarms() {
        // Clear all existing alarms
        chrome.alarms.clearAll();
        
        // Recreate alarms for active alerts
        this.alerts.filter(alert => alert.isActive).forEach(alert => {
            this.setAlertAlarm(alert);
        });
    }

    async handleAlarm(alarm) {
        if (alarm.name.startsWith('alert_')) {
            const alertId = alarm.name.replace('alert_', '');
            const alert = this.alerts.find(a => a.id === alertId);
            
            if (alert && alert.isActive) {
                await this.checkAlert(alert);
            }
        }
    }

    async checkAlert(alert) {
        try {
            // Get current rate
            const currentRate = await this.getCurrentRate(alert.fromCurrency, alert.toCurrency);
            
            if (!currentRate) return;
            
            // Check if alert condition is met
            let shouldTrigger = false;
            
            if (alert.condition === 'above' && currentRate >= alert.targetRate) {
                shouldTrigger = true;
            } else if (alert.condition === 'below' && currentRate <= alert.targetRate) {
                shouldTrigger = true;
            }
            
            if (shouldTrigger) {
                await this.triggerAlert(alert, currentRate);
            }
            
        } catch (error) {
            console.error('Error checking alert:', error);
        }
    }

    async getCurrentRate(fromCurrency, toCurrency) {
        // Use the same API as the popup
        const exchangeAPIs = [
            'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies',
            'https://latest.currency-api.pages.dev/v1/currencies',
            'https://api.exchangerate-api.com/v4/latest'
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
                            'User-Agent': 'RateRadar/1.0'
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
                            'User-Agent': 'RateRadar/1.0'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    
                    data = await response.json();
                    if (data.rates && data.rates[to.toUpperCase()]) {
                        return data.rates[to.toUpperCase()];
                    }
                }
                
                throw new Error('Rate not found in response');
                
            } catch (error) {
                console.warn(`Background: API ${i + 1} failed:`, error.message);
                continue;
            }
        }

        return null;
    }

    async triggerAlert(alert, currentRate) {
        try {
            // Deactivate alert
            alert.isActive = false;
            await chrome.storage.sync.set({ alerts: this.alerts });
            
            // Show notification
            if (this.settings.notifications) {
                const title = 'Rate Alert Triggered!';
                const message = `${alert.fromCurrency}/${alert.toCurrency} is now ${currentRate.toFixed(4)} (${alert.condition} ${alert.targetRate})`;
                
                this.showNotification(title, message, 'alert');
            }
            
            // Play sound
            if (this.settings.soundAlerts) {
                this.playSound('alert');
            }
            
            console.log('Alert triggered:', alert, 'Current rate:', currentRate);
            
        } catch (error) {
            console.error('Error triggering alert:', error);
        }
    }

    showNotification(title, message, type = 'info') {
        const notificationId = `rateradar_${Date.now()}`;
        
        const notificationOptions = {
            type: 'basic',
            iconUrl: 'icons/icon.png',
            title: title,
            message: message,
            priority: type === 'alert' ? 2 : 1
        };
        
        chrome.notifications.create(notificationId, notificationOptions);
    }

    playSound(soundType) {
        // Create audio context for sound alerts
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        let frequency, duration;
        
        switch (soundType) {
            case 'alert':
                frequency = 800;
                duration = 0.3;
                break;
            case 'success':
                frequency = 600;
                duration = 0.2;
                break;
            case 'error':
                frequency = 400;
                duration = 0.4;
                break;
            default:
                frequency = 500;
                duration = 0.2;
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    handleNotificationClick(notificationId) {
        // Open the extension popup when notification is clicked
        chrome.action.openPopup();
    }

    handlePricesDetected(prices, url) {
        // Log detected prices for analytics
        console.log('Prices detected on:', url, 'Count:', prices.length);
        
        // Could send to analytics service here
        // this.sendAnalytics('prices_detected', { url, count: prices.length });
    }

    setupAlarms() {
        // Set up periodic tasks
        chrome.alarms.create('periodic_check', {
            delayInMinutes: 1,
            periodInMinutes: 30 // Check every 30 minutes
        });
    }
}

// Initialize background script
const rateRadarBackground = new RateRadarBackground(); 
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
            
            // Play sound
            if (this.settings.soundAlerts) {
                this.playSound('alert');
            }
            
            console.log('Alert triggered:', alert, 'Current rate:', currentRate);
            
        } catch (error) {
            console.error('Error triggering alert:', error);
        }
    }

    showNotification(title, message, type = 'info') {
        const notificationId = `rateradar_${Date.now()}`;
        
        const notificationOptions = {
            type: 'basic',
            iconUrl: 'icons/icon.png',
            title: title,
            message: message,
            priority: type === 'alert' ? 2 : 1
        };
        
        chrome.notifications.create(notificationId, notificationOptions);
    }

    playSound(soundType) {
        // Create audio context for sound alerts
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        let frequency, duration;
        
        switch (soundType) {
            case 'alert':
                frequency = 800;
                duration = 0.3;
                break;
            case 'success':
                frequency = 600;
                duration = 0.2;
                break;
            case 'error':
                frequency = 400;
                duration = 0.4;
                break;
            default:
                frequency = 500;
                duration = 0.2;
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    handleNotificationClick(notificationId) {
        // Open the extension popup when notification is clicked
        chrome.action.openPopup();
    }

    handlePricesDetected(prices, url) {
        // Log detected prices for analytics
        console.log('Prices detected on:', url, 'Count:', prices.length);
        
        // Could send to analytics service here
        // this.sendAnalytics('prices_detected', { url, count: prices.length });
    }

    setupAlarms() {
        // Set up periodic tasks
        chrome.alarms.create('periodic_check', {
            delayInMinutes: 1,
            periodInMinutes: 30 // Check every 30 minutes
        });
    }
}

// Initialize background script
const rateRadarBackground = new RateRadarBackground(); 