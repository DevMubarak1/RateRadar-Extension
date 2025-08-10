// RateRadar Content Script
// Handles smart shopping features and price detection

class RateRadarContent {
    constructor() {
        this.isEnabled = false;
        this.detectedPrices = [];
        this.init();
    }

    init() {
        this.checkIfEnabled();
        this.setupEventListeners();
        this.detectPrices();
    }

    async checkIfEnabled() {
        try {
            const result = await chrome.storage.sync.get(['settings']);
            const settings = result.settings || {};
            this.isEnabled = settings.smartShopping || false;
        } catch (error) {
            console.error('Error checking settings:', error);
        }
    }

    setupEventListeners() {
        // Listen for messages from popup/background
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true;
        });

        // Watch for dynamic content changes
        const observer = new MutationObserver(() => {
            if (this.isEnabled) {
                this.detectPrices();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'enableSmartShopping':
                this.isEnabled = true;
                this.detectPrices();
                sendResponse({ success: true });
                break;
                
            case 'disableSmartShopping':
                this.isEnabled = false;
                sendResponse({ success: true });
                break;
                
            case 'getDetectedPrices':
                sendResponse({ success: true, prices: this.detectedPrices });
                break;
                
            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    }

    detectPrices() {
        if (!this.isEnabled) return;

        const priceElements = this.findPriceElements();
        this.detectedPrices = [];

        priceElements.forEach(element => {
            const priceData = this.extractPriceData(element);
            if (priceData) {
                this.detectedPrices.push(priceData);
                this.highlightPrice(element, priceData);
            }
        });

        // Send detected prices to background script
        if (this.detectedPrices.length > 0) {
            chrome.runtime.sendMessage({
                action: 'pricesDetected',
                prices: this.detectedPrices,
                url: window.location.href
            });
        }
    }

    findPriceElements() {
        // Common selectors for price elements
        const selectors = [
            '[data-price]',
            '[class*="price"]',
            '[class*="Price"]',
            '[id*="price"]',
            '[id*="Price"]',
            '.price',
            '.Price',
            '.amount',
            '.Amount',
            'span[class*="currency"]',
            'span[class*="Currency"]'
        ];

        const elements = [];
        selectors.forEach(selector => {
            try {
                const found = document.querySelectorAll(selector);
                elements.push(...Array.from(found));
            } catch (error) {
                // Ignore invalid selectors
            }
        });

        return elements;
    }

    extractPriceData(element) {
        const text = element.textContent.trim();
        const priceRegex = /([$€£¥₦₿])\s*([\d,]+(?:\.\d{2})?)/g;
        const matches = [...text.matchAll(priceRegex)];

        if (matches.length === 0) return null;

        const match = matches[0];
        const currency = match[1];
        const amount = parseFloat(match[2].replace(/,/g, ''));

        if (isNaN(amount)) return null;

        return {
            currency: this.normalizeCurrency(currency),
            amount: amount,
            originalText: text,
            element: element,
            timestamp: Date.now()
        };
    }

    normalizeCurrency(currencySymbol) {
        const currencyMap = {
            '$': 'USD',
            '€': 'EUR',
            '£': 'GBP',
            '¥': 'JPY',
            '₦': 'NGN',
            '₿': 'BTC'
        };

        return currencyMap[currencySymbol] || currencySymbol;
    }

    highlightPrice(element, priceData) {
        // Add visual indicator for detected prices
        if (!element.classList.contains('rateradar-detected')) {
            element.classList.add('rateradar-detected');
            element.style.border = '2px solid #3B82F6';
            element.style.borderRadius = '4px';
            element.style.padding = '2px';
            
            // Add tooltip
            element.title = `RateRadar detected: ${priceData.currency} ${priceData.amount}`;
            
            // Add click handler for conversion
            element.addEventListener('click', (e) => {
                e.preventDefault();
                this.showConversionModal(priceData);
            });
        }
    }

    showConversionModal(priceData) {
        // Create modal for price conversion
        const modal = document.createElement('div');
        modal.className = 'rateradar-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%;">
                <h3 style="margin: 0 0 15px 0; color: #333;">Convert Price</h3>
                <p style="margin: 0 0 15px 0; color: #666;">
                    Original: ${priceData.currency} ${priceData.amount}
                </p>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #333;">Convert to:</label>
                    <select id="targetCurrency" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="NGN">NGN</option>
                        <option value="ZAR">ZAR</option>
                    </select>
                </div>
                <div id="convertedAmount" style="margin-bottom: 15px; font-size: 18px; font-weight: bold; color: #3B82F6;">
                    Converting...
                </div>
                <div style="display: flex; gap: 10px;">
                    <button id="setAlert" style="flex: 1; padding: 8px; background: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Set Alert
                    </button>
                    <button id="closeModal" style="flex: 1; padding: 8px; background: #6B7280; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle modal events
        const targetSelect = modal.querySelector('#targetCurrency');
        const convertedDiv = modal.querySelector('#convertedAmount');
        const setAlertBtn = modal.querySelector('#setAlert');
        const closeBtn = modal.querySelector('#closeModal');

        // Convert price when target currency changes
        targetSelect.addEventListener('change', () => {
            this.convertPrice(priceData, targetSelect.value, convertedDiv);
        });

        // Set alert
        setAlertBtn.addEventListener('click', () => {
            this.setPriceAlert(priceData, targetSelect.value);
            document.body.removeChild(modal);
        });

        // Close modal
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Initial conversion
        this.convertPrice(priceData, targetSelect.value, convertedDiv);
    }

    async convertPrice(priceData, targetCurrency, displayElement) {
        try {
            const rate = await this.getExchangeRate(priceData.currency, targetCurrency);
            if (rate !== null) {
                const convertedAmount = priceData.amount * rate;
                displayElement.textContent = `${targetCurrency} ${convertedAmount.toFixed(2)}`;
            } else {
                displayElement.textContent = 'Conversion failed';
            }
        } catch (error) {
            displayElement.textContent = 'Conversion failed';
            console.error('Error converting price:', error);
        }
    }

    async setPriceAlert(priceData, targetCurrency) {
        try {
            const rate = await this.getExchangeRate(priceData.currency, targetCurrency);
            if (rate !== null) {
                const convertedAmount = priceData.amount * rate;
                const alert = {
                    id: Date.now(),
                    fromCurrency: priceData.currency,
                    toCurrency: targetCurrency,
                    targetRate: rate,
                    alertType: 'below',
                    createdAt: new Date().toISOString(),
                    active: true,
                    isPriceAlert: true,
                    originalPrice: priceData.amount,
                    targetPrice: convertedAmount
                };

                // Send to background script
                chrome.runtime.sendMessage({
                    action: 'addAlert',
                    alert: alert
                });

                // Show success message
                this.showNotification('Price alert set successfully!', 'success');
            } else {
                this.showNotification('Failed to get exchange rate', 'error');
            }
        } catch (error) {
            console.error('Error setting price alert:', error);
            this.showNotification('Failed to set price alert', 'error');
        }
    }

    async getExchangeRate(fromCurrency, toCurrency) {
        const exchangeAPIs = [
            'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies',
            'https://latest.currency-api.pages.dev/v1/currencies',
            'https://api.exchangerate-api.com/v4/latest'
        ];

        const from = fromCurrency.toLowerCase();
        const to = toCurrency.toLowerCase();

        // Try each API endpoint
        for (let i = 0; i < exchangeAPIs.length; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                
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
                        console.log(`Content: Successfully got rate from API ${i + 1}`);
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
                        console.log(`Content: Successfully got rate from API ${i + 1}`);
                        return data.rates[to.toUpperCase()];
                    }
                }
                
                throw new Error('Rate not found in response');
                
            } catch (error) {
                console.warn(`Content: API ${i + 1} failed:`, error.message);
                continue;
            }
        }

        console.error('Content: All exchange rate APIs failed');
        return null;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 10001;
            ${type === 'success' ? 'background: #10B981;' : type === 'error' ? 'background: #EF4444;' : 'background: #3B82F6;'}
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    // Utility methods for future features
    isEcommerceSite() {
        const ecommerceKeywords = [
            'amazon', 'ebay', 'etsy', 'shopify', 'woocommerce',
            'walmart', 'target', 'bestbuy', 'newegg', 'aliexpress'
        ];

        const url = window.location.hostname.toLowerCase();
        return ecommerceKeywords.some(keyword => url.includes(keyword));
    }

    getProductInfo() {
        // Extract product information from page
        const productInfo = {
            title: this.getProductTitle(),
            price: this.getProductPrice(),
            currency: this.getProductCurrency(),
            url: window.location.href
        };

        return productInfo;
    }

    getProductTitle() {
        // Try common selectors for product titles
        const selectors = [
            'h1[class*="title"]',
            'h1[class*="Title"]',
            '[class*="product-title"]',
            '[class*="ProductTitle"]',
            'h1',
            '.title',
            '.Title'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }

        return document.title;
    }

    getProductPrice() {
        // This would be implemented based on detected prices
        return this.detectedPrices.length > 0 ? this.detectedPrices[0].amount : null;
    }

    getProductCurrency() {
        // This would be implemented based on detected prices
        return this.detectedPrices.length > 0 ? this.detectedPrices[0].currency : null;
    }
}

// Initialize RateRadar content script
const rateRadarContent = new RateRadarContent(); 