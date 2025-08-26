import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <div className="logo-icon">📊</div>
            <span>RateRadar</span>
          </div>
          <div className="nav-links">
            <button onClick={() => scrollToSection('features')}>Features</button>
            <button onClick={() => scrollToSection('installation')}>Install</button>
            <button onClick={() => scrollToSection('about')}>About</button>
            <a 
              href="https://chrome.google.com/webstore/detail/rateradar/your-extension-id" 
              target="_blank" 
              rel="noopener noreferrer"
              className="install-btn"
            >
              Add to Chrome
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className={`hero-text ${isVisible ? 'fade-in' : ''}`}>
            <h1>Track, Convert & Monitor</h1>
            <h2>Currency & Crypto Exchange Rates</h2>
            <p>Your ultimate Chrome extension for real-time currency conversion, crypto tracking, and smart shopping with price alerts.</p>
            <div className="hero-buttons">
              <a 
                href="https://chrome.google.com/webstore/detail/rateradar/your-extension-id" 
                target="_blank" 
                rel="noopener noreferrer"
                className="cta-button primary"
              >
                🚀 Install RateRadar
              </a>
              <button onClick={() => scrollToSection('features')} className="cta-button secondary">
                Learn More
              </button>
            </div>
          </div>
          <div className={`hero-visual ${isVisible ? 'slide-in' : ''}`}>
            <div className="extension-preview">
              <div className="extension-header">
                <div className="extension-icon">📊</div>
                <span>RateRadar</span>
              </div>
              <div className="extension-content">
                <div className="conversion-demo">
                  <div className="input-group">
                    <input type="number" value="100" readOnly />
                    <select value="USD" readOnly>
                      <option>USD</option>
                    </select>
                  </div>
                  <div className="swap-icon">⇄</div>
                  <div className="input-group">
                    <input type="number" value="75,000" readOnly />
                    <select value="NGN" readOnly>
                      <option>NGN</option>
                    </select>
                  </div>
                </div>
                <div className="crypto-demo">
                  <div className="crypto-item">
                    <span>₿ Bitcoin</span>
                    <span className="price">$43,250.00</span>
                    <span className="change positive">+2.5%</span>
                  </div>
                  <div className="crypto-item">
                    <span>Ξ Ethereum</span>
                    <span className="price">$2,650.00</span>
                    <span className="change positive">+1.8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2>Powerful Features</h2>
            <p>Everything you need for currency and crypto tracking</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">💱</div>
              <h3>Universal Currency Converter</h3>
              <p>Convert any currency to any other with real-time exchange rates from reliable APIs. Support for 170+ world currencies.</p>
              <ul>
                <li>Real-time exchange rates</li>
                <li>Swap button for instant reverse conversion</li>
                <li>170+ world currencies supported</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🪙</div>
              <h3>Crypto Exchange Rates</h3>
              <p>Convert crypto to fiat currencies and between cryptocurrencies with live price tracking and 24h change indicators.</p>
              <ul>
                <li>7,000+ cryptocurrencies supported</li>
                <li>Live price tracking</li>
                <li>24h change indicators</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Smart Rate Alerts</h3>
              <p>Set custom alerts for currency pairs with desktop notifications when targets are hit. Background monitoring every 5 minutes.</p>
              <ul>
                <li>Custom alerts for currency pairs</li>
                <li>Desktop notifications</li>
                <li>Above/below threshold alerts</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛒</div>
              <h3>Smart Shopping</h3>
              <p>Detect product prices on e-commerce sites, convert prices to your preferred currency, and set price drop alerts for deals.</p>
              <ul>
                <li>Automatic price detection</li>
                <li>Currency conversion for prices</li>
                <li>Price drop alerts</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Section */}
      <section id="installation" className="installation">
        <div className="container">
          <div className="section-header">
            <h2>Get Started in Minutes</h2>
            <p>Choose your preferred installation method</p>
          </div>
          <div className="installation-methods">
            <div className="method-card">
              <div className="method-icon">🛒</div>
              <h3>Chrome Web Store</h3>
              <p>One-click installation from the official Chrome Web Store</p>
              <a 
                href="https://chrome.google.com/webstore/detail/rateradar/your-extension-id" 
                target="_blank" 
                rel="noopener noreferrer"
                className="method-button"
              >
                Install from Store
              </a>
            </div>
            <div className="method-card">
              <div className="method-icon">💻</div>
              <h3>Manual Installation</h3>
              <p>Download and install manually for advanced users</p>
              <div className="manual-steps">
                <ol>
                  <li>Download the extension files</li>
                  <li>Open Chrome and go to <code>chrome://extensions/</code></li>
                  <li>Enable "Developer mode"</li>
                  <li>Click "Load unpacked" and select the folder</li>
                </ol>
              </div>
              <a href="#" className="method-button secondary">Download Files</a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>About RateRadar</h2>
              <p>RateRadar is a powerful Chrome extension designed to make currency conversion and crypto tracking simple, fast, and reliable. Built for travelers, traders, and anyone who needs to stay updated with exchange rates.</p>
              <div className="tech-stack">
                <h3>Technology Stack</h3>
                <div className="tech-items">
                  <span className="tech-item">HTML5</span>
                  <span className="tech-item">CSS3 (Tailwind)</span>
                  <span className="tech-item">JavaScript (ES6+)</span>
                  <span className="tech-item">Chrome APIs</span>
                  <span className="tech-item">Exchangerate.host API</span>
                  <span className="tech-item">CoinGecko API</span>
                </div>
              </div>
            </div>
            <div className="about-stats">
              <div className="stat-item">
                <div className="stat-number">170+</div>
                <div className="stat-label">Currencies</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">7,000+</div>
                <div className="stat-label">Cryptocurrencies</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">&lt;500ms</div>
                <div className="stat-label">API Response</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">&lt;1MB</div>
                <div className="stat-label">Extension Size</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <div className="logo-icon">📊</div>
                <span>RateRadar</span>
              </div>
              <p>Making currency conversion and crypto tracking simple, fast, and reliable.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><button onClick={() => scrollToSection('features')}>Features</button></li>
                <li><button onClick={() => scrollToSection('installation')}>Installation</button></li>
                <li><button onClick={() => scrollToSection('about')}>About</button></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Resources</h4>
              <ul>
                <li><a href="#" target="_blank" rel="noopener noreferrer">Documentation</a></li>
                <li><a href="#" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                <li><a href="#" target="_blank" rel="noopener noreferrer">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>Built with ❤️ by <strong>Dev.Mubarak</strong> for the global community</p>
            <p>&copy; 2024 RateRadar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
