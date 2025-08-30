# RateRadar - Currency & Crypto Exchange Rate Tracker

![RateRadar Logo](icons/icon.png)

> Track, convert, and monitor currency and crypto exchange rates—anytime, anywhere.

## 🌟 Features

### 💱 Universal Currency Converter
- Convert any currency to any other (e.g., NGN → USD, GBP → ZAR)
- Real-time exchange rates from reliable APIs
- Swap button for instant reverse conversion
- Support for 170+ world currencies

### 🪙 Crypto Exchange Rates
- Convert crypto to fiat currencies (BTC → USD, ETH → NGN)
- Convert between cryptocurrencies (BTC → ETH)
- Live price tracking with 24h change indicators
- Support for 7,000+ cryptocurrencies


### 🔔 Smart Rate Alerts
- Set custom alerts for currency pairs
- Desktop notifications when targets are hit
- Above/below threshold alerts
- Background monitoring every 5 minutes

### 🛒 Smart Shopping (Coming Soon)
- Detect product prices on e-commerce sites
- Convert prices to your preferred currency
- Set price drop alerts for deals
- Affiliate integration for monetization

## 🚀 Quick Start

### Installation

1. **Download the Extension**
   - Visit- https://rateradar-five.vercel.app/
   - Click on the Install RateRadar button

2. **Start Using**
   - Open Chrome and go to `chrome://extensions/`
   - Click the RateRadar icon in your toolbar
   - Convert currencies, track crypto, and set alerts

### First-Time Setup

1. **Configure Settings**
   - Click the settings gear icon
   - Set your default currency
   - Enable notifications
   - Configure smart shopping features

2. **Test Features**
   - Try converting USD to EUR
   - Check Bitcoin prices
   - Set up a test alert
   - View rate history


## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Tailwind), JavaScript (ES6+)
- **Chrome APIs**: Storage, Notifications, Alarms, Runtime
- **APIs**: 
  - [Exchangerate.host](https://exchangerate.host/) - Fiat currency conversion
  - [CoinGecko API](https://www.coingecko.com/en/api) - Cryptocurrency data
- **Styling**: Tailwind CSS for modern UI

## 🔧 Development

### Prerequisites
- Google Chrome (v88+)
- Node.js (v14+)
- Git

### Local Development

1. **Clone the Repository**
   ```bash
   git clone https://github.com/DevMubarak1/RateRadar-Extension.git
   cd rateradar
   ```

2. **Load Extension**
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the project directory

3. **Make Changes**
   - Edit files as needed
   - Click the refresh icon on the extension
   - Test changes immediately

### API Integration

The extension uses free APIs with rate limits:

- **Exchangerate.host**: Unlimited requests, no API key required
- **CoinGecko API**: 10,000 calls/month free tier

### Adding New Features

1. **Currency Support**
   - Add currency codes to `popup.js`
   - Update API calls if needed

2. **New Alerts**
   - Extend `background.js` alert logic
   - Add UI elements in `popup.html`

3. **Smart Shopping**
   - Enhance `content.js` price detection
   - Add new e-commerce site support

## 📊 Performance

- **Memory Usage**: ~5MB when active
- **API Calls**: Optimized to minimize requests
- **Background Checks**: Every 5 minutes (configurable)
- **Storage**: Local Chrome storage for settings/alerts

## 🔒 Privacy & Security

- **No Personal Data**: Only stores settings and alerts locally
- **API Calls**: Only for currency/crypto data
- **No Tracking**: No analytics or user tracking
- **Open Source**: Transparent code for security review

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### How to Contribute

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Areas for Contribution

- **UI/UX Improvements**: Better designs and animations
- **New Features**: Additional currency pairs, crypto support
- **Bug Fixes**: Performance and reliability improvements
- **Documentation**: Better guides and examples

## 🐛 Known Issues

- **API Rate Limits**: Free APIs have usage limits
- **Chrome Permissions**: Requires notification permissions
- **Offline Mode**: Limited functionality without internet
- **Mobile Support**: Chrome extension only (no mobile app)

## 📞 Support

### Getting Help

1. **Check Documentation**: Review this README and INSTALLATION.md
2. **Browser Console**: Check for error messages
3. **GitHub Issues**: Report bugs and feature requests

### Common Issues

- **Extension Not Loading**: Check manifest.json and file structure
- **API Errors**: Verify internet connection and API status
- **Notifications**: Ensure Chrome notification permissions
- **Performance**: Adjust refresh intervals in settings

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Exchangerate.host**: Free currency API
- **CoinGecko**: Comprehensive crypto data
- **Tailwind CSS**: Beautiful UI framework
- **Chrome Extensions Team**: Excellent documentation

## 📊 Statistics

- **Supported Currencies**: 170+
- **Supported Cryptocurrencies**: 123+
- **API Response Time**: <500ms average
- **Extension Size**: <1MB
- **Memory Usage**: ~5MB active

---

**RateRadar** - Making currency conversion and crypto tracking simple, fast, and reliable.

*Built with ❤️ for the global community*
