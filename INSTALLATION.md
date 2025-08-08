# RateRadar Chrome Extension - Installation Guide

## Prerequisites
- Google Chrome browser (version 88 or higher)
- Internet connection for API calls

## Installation Steps

### Method 1: Developer Mode Installation (Recommended for Development)

1. **Download the Extension Files**
   - Download or clone this repository to your local machine
   - Ensure all files are in a single directory

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or go to Chrome Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner
   - This will reveal additional options

4. **Load the Extension**
   - Click "Load unpacked" button
   - Select the directory containing your RateRadar extension files
   - The extension should now appear in your extensions list

5. **Pin the Extension (Optional)**
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "RateRadar" and click the pin icon
   - This will keep the extension icon visible in your toolbar

### Method 2: Chrome Web Store Installation (Future)

Once the extension is published to the Chrome Web Store:
1. Visit the RateRadar page on the Chrome Web Store
2. Click "Add to Chrome"
3. Confirm the installation

## First-Time Setup

1. **Click the RateRadar Icon**
   - Click the RateRadar icon in your Chrome toolbar
   - The popup will open with the currency converter

2. **Configure Settings (Optional)**
   - Click the settings gear icon in the popup
   - Configure your preferences:
     - Default currency
     - Notification settings
     - Smart shopping features
     - Alert preferences

3. **Test the Extension**
   - Try converting between different currencies
   - Test the crypto conversion feature
   - Set up a test alert

## Features Overview

### 💱 Currency Converter
- Convert between any supported currencies
- Real-time exchange rates
- Swap currencies with one click
- Support for major world currencies

### 🪙 Crypto Converter
- Convert crypto to fiat currencies
- Convert between cryptocurrencies
- Live crypto prices and 24h changes
- Support for Bitcoin, Ethereum, and more

### 📊 Rate History
- View 7, 30, or 90-day rate trends
- Interactive charts
- Historical data visualization

### 🔔 Smart Alerts
- Set rate alerts for currency pairs
- Desktop notifications when targets are hit
- Customizable alert conditions

### 🛒 Smart Shopping (Coming Soon)
- Detect prices on e-commerce sites
- Convert prices to your preferred currency
- Set price drop alerts

## Troubleshooting

### Extension Not Loading
- Ensure all files are present in the directory
- Check that `manifest.json` is valid
- Try refreshing the extensions page

### API Errors
- Check your internet connection
- The extension uses free APIs with rate limits
- Wait a few minutes and try again

### Notifications Not Working
- Check Chrome notification permissions
- Go to Chrome Settings → Privacy and Security → Site Settings → Notifications
- Ensure RateRadar has permission to show notifications

### Performance Issues
- The extension checks rates every 5 minutes by default
- You can adjust this in the settings
- Disable auto-refresh if needed

## API Information

RateRadar uses the following free APIs:
- **Exchangerate.host**: For fiat currency conversion
- **CoinGecko API**: For cryptocurrency data

These APIs are free to use but have rate limits. The extension is designed to work within these limits.

## Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review the browser console for error messages
3. Ensure you're using a supported Chrome version
4. Try reinstalling the extension

## Development

To modify the extension:
1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the RateRadar extension
4. Test your changes

## Privacy

RateRadar:
- Stores your settings and alerts locally
- Does not collect personal information
- Only makes API calls for currency data
- Respects your privacy settings

## Updates

To update the extension:
1. Download the latest version
2. Replace the old files with new ones
3. Refresh the extension in Chrome
4. Your settings and alerts will be preserved 