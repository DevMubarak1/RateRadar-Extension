// RateRadar Enhanced Alert System
// Supports 180+ currencies and crypto alerts

class RateRadarAlerts {
    constructor() {
        this.alerts = new Map();
        this.checkInterval = 5 * 60 * 1000; // 5 minutes
        this.isRunning = false;
        this.init();
    }

    async init() {
        try {
            await this.loadAlerts();
            this.startMonitoring();
            this.setupMessageListener();
        } catch (error) {
            console.error('Alert system initialization error:', error);
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

    async addAlert(alertData) {
        const alertId = this.generateAlertId();
        const alert = {
            id: alertId,
            fromCurrency: alertData.fromCurrency,
            toCurrency: alertData.toCurrency,
            targetRate: parseFloat(alertData.targetRate),
            condition: alertData.condition, // 'above' or 'below'
            isActive: true,
            createdAt: Date.now(),
            lastChecked: 0,
            triggered: false,
            notificationCount: 0,
            maxNotifications: alertData.maxNotifications || 1,
            soundEnabled: alertData.soundEnabled || false,
            emailEnabled: alertData.emailEnabled || false,
            description: alertData.description || '',
            type: alertData.type || 'currency' // 'currency' or 'crypto'
        };

        this.alerts.set(alertId, alert);
        await this.saveAlerts();
        return alertId;
    }

    async removeAlert(alertId) {
        this.alerts.delete(alertId);
        await this.saveAlerts();
    }

    async updateAlert(alertId, updates) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            Object.assign(alert, updates);
            await this.saveAlerts();
        }
    }

    async toggleAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.isActive = !alert.isActive;
            await this.saveAlerts();
        }
    }

    generateAlertId() {
        return 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    startMonitoring() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.checkAlerts();
        
        // Set up periodic checking
        setInterval(() => {
            this.checkAlerts();
        }, this.checkInterval);
    }

    async checkAlerts() {
        const activeAlerts = Array.from(this.alerts.values()).filter(alert => alert.isActive);
        
        for (const alert of activeAlerts) {
            try {
                await this.checkSingleAlert(alert);
            } catch (error) {
                console.error(`Error checking alert ${alert.id}:`, error);
            }
        }
    }

    async checkSingleAlert(alert) {
        // Skip if already triggered and max notifications reached
        if (alert.triggered && alert.notificationCount >= alert.maxNotifications) {
            return;
        }

        // Skip if checked recently (within 1 minute)
        if (Date.now() - alert.lastChecked < 60000) {
            return;
        }

        alert.lastChecked = Date.now();

        let currentRate;
        if (alert.type === 'crypto') {
            currentRate = await this.getCryptoRate(alert.fromCurrency, alert.toCurrency);
        } else {
            currentRate = await this.getCurrencyRate(alert.fromCurrency, alert.toCurrency);
        }

        if (!currentRate) {
            return;
        }

        const shouldTrigger = this.checkAlertCondition(alert, currentRate);

        if (shouldTrigger && !alert.triggered) {
            await this.triggerAlert(alert, currentRate);
        } else if (!shouldTrigger && alert.triggered) {
            // Reset trigger state if condition is no longer met
            alert.triggered = false;
            alert.notificationCount = 0;
            await this.saveAlerts();
        }
    }

    checkAlertCondition(alert, currentRate) {
        if (alert.condition === 'above') {
            return currentRate >= alert.targetRate;
        } else if (alert.condition === 'below') {
            return currentRate <= alert.targetRate;
        }
        return false;
    }

    async getCurrencyRate(fromCurrency, toCurrency) {
        try {
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
        } catch (error) {
            console.error('Error getting currency rate:', error);
            return null;
        }
    }

    async getCryptoRate(cryptoId, targetCurrency) {
        try {
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=${targetCurrency}`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(url, { 
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'RateRadar/1.1'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return data[cryptoId]?.[targetCurrency] || null;
            
        } catch (error) {
            console.error('Error getting crypto rate:', error);
            return null;
        }
    }

    async triggerAlert(alert, currentRate) {
        alert.triggered = true;
        alert.notificationCount++;
        await this.saveAlerts();

        // Create notification
        const notificationTitle = 'RateRadar Alert';
        const notificationMessage = this.createAlertMessage(alert, currentRate);

        // Show desktop notification
        if (alert.notificationCount <= alert.maxNotifications) {
            await this.showNotification(notificationTitle, notificationMessage, alert);
        }

        // Play sound if enabled
        if (alert.soundEnabled) {
            this.playAlertSound();
        }

        // Send email if enabled (would need backend implementation)
        if (alert.emailEnabled) {
            await this.sendEmailAlert(alert, currentRate);
        }

        // Send message to popup to update UI
        this.notifyPopup(alert, currentRate);
    }

    createAlertMessage(alert, currentRate) {
        const conditionText = alert.condition === 'above' ? 'reached' : 'dropped below';
        const currencyType = alert.type === 'crypto' ? 'crypto' : 'currency';
        
        return `${alert.fromCurrency.toUpperCase()} to ${alert.toCurrency.toUpperCase()} ${currencyType} rate has ${conditionText} ${alert.targetRate} (Current: ${currentRate.toFixed(4)})`;
    }

    async showNotification(title, message, alert) {
        try {
            const notificationId = `rateradar_${alert.id}_${Date.now()}`;
            
            await chrome.notifications.create(notificationId, {
                type: 'basic',
                iconUrl: 'icons/icon.png',
                title: title,
                message: message,
                priority: 2,
                requireInteraction: false
            });

            // Auto-remove notification after 10 seconds
            setTimeout(() => {
                chrome.notifications.clear(notificationId);
            }, 10000);

        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    playAlertSound() {
        try {
            // Create audio context for notification sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);

        } catch (error) {
            console.error('Error playing alert sound:', error);
        }
    }

    async sendEmailAlert(alert, currentRate) {
        // This would require a backend service
        // For now, just log the email alert
        console.log('Email alert would be sent:', {
            alert: alert,
            currentRate: currentRate,
            message: this.createAlertMessage(alert, currentRate)
        });
    }

    notifyPopup(alert, currentRate) {
        try {
            chrome.runtime.sendMessage({
                action: 'alertTriggered',
                alert: alert,
                currentRate: currentRate
            });
        } catch (error) {
            console.error('Error notifying popup:', error);
        }
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async response
        });
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'addAlert':
                    const alertId = await this.addAlert(request.alertData);
                    sendResponse({ success: true, alertId: alertId });
                    break;

                case 'removeAlert':
                    await this.removeAlert(request.alertId);
                    sendResponse({ success: true });
                    break;

                case 'updateAlert':
                    await this.updateAlert(request.alertId, request.updates);
                    sendResponse({ success: true });
                    break;

                case 'toggleAlert':
                    await this.toggleAlert(request.alertId);
                    sendResponse({ success: true });
                    break;

                case 'getAlerts':
                    const alerts = Array.from(this.alerts.values());
                    sendResponse({ success: true, alerts: alerts });
                    break;

                case 'checkAlert':
                    await this.checkSingleAlert(request.alert);
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

    // Utility methods
    getAlertById(alertId) {
        return this.alerts.get(alertId);
    }

    getAllAlerts() {
        return Array.from(this.alerts.values());
    }

    getActiveAlerts() {
        return Array.from(this.alerts.values()).filter(alert => alert.isActive);
    }

    getTriggeredAlerts() {
        return Array.from(this.alerts.values()).filter(alert => alert.triggered);
    }

    clearAllAlerts() {
        this.alerts.clear();
        return this.saveAlerts();
    }

    // Statistics
    getAlertStats() {
        const total = this.alerts.size;
        const active = this.getActiveAlerts().length;
        const triggered = this.getTriggeredAlerts().length;
        const currencyAlerts = Array.from(this.alerts.values()).filter(alert => alert.type === 'currency').length;
        const cryptoAlerts = Array.from(this.alerts.values()).filter(alert => alert.type === 'crypto').length;

        return {
            total,
            active,
            triggered,
            currencyAlerts,
            cryptoAlerts
        };
    }
}

// Initialize alert system
const rateRadarAlerts = new RateRadarAlerts();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RateRadarAlerts;
} 