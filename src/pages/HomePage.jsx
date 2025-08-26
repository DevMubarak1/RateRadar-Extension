import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
  DollarSign, 
  Bitcoin, 
  Bell, 
  ShoppingCart, 
  Download, 
  Code, 
  Globe, 
  Zap,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Github,
  Twitter,
  Mail
} from 'lucide-react';

function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const features = [
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Universal Currency Converter",
      description: "Convert any currency to any other with real-time exchange rates from reliable APIs. Support for 170+ world currencies.",
      benefits: ["Real-time exchange rates", "Swap button for instant reverse conversion", "170+ world currencies supported"]
    },
    {
      icon: <Bitcoin className="w-8 h-8" />,
      title: "Crypto Exchange Rates",
      description: "Convert crypto to fiat currencies and between cryptocurrencies with live price tracking and 24h change indicators.",
      benefits: ["7,000+ cryptocurrencies supported", "Live price tracking", "24h change indicators"]
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: "Smart Rate Alerts",
      description: "Set custom alerts for currency pairs with desktop notifications when targets are hit. Background monitoring every 5 minutes.",
      benefits: ["Custom alerts for currency pairs", "Desktop notifications", "Above/below threshold alerts"]
    },
    {
      icon: <ShoppingCart className="w-8 h-8" />,
      title: "Smart Shopping",
      description: "Detect product prices on e-commerce sites, convert prices to your preferred currency, and set price drop alerts for deals.",
      benefits: ["Automatic price detection", "Currency conversion for prices", "Price drop alerts"]
    }
  ];

  const stats = [
    { number: "170+", label: "Currencies" },
    { number: "7,000+", label: "Cryptocurrencies" },
    { number: "<500ms", label: "API Response" },
    { number: "<1MB", label: "Extension Size" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                RateRadar
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('installation')}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Install
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                About
              </button>
              <Button 
                variant="gradient" 
                size="sm"
                className="shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Download className="w-4 h-4 mr-2" />
                Add to Chrome
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={() => scrollToSection('features')}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('installation')}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                Install
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                About
              </button>
              <Button 
                variant="gradient" 
                size="sm"
                className="w-full mt-2 shadow-lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Add to Chrome
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className={`space-y-8 ${isVisible ? 'animate-fade-in' : ''}`}>
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Track, Convert &{' '}
                  <span className="gradient-text">Monitor</span>
                </h1>
                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700">
                  Currency & Crypto Exchange Rates
                </h2>
              </div>
              
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                Your ultimate Chrome extension for real-time currency conversion, crypto tracking, and smart shopping with price alerts.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="gradientYellow" 
                  size="xl"
                  className="shadow-xl hover:shadow-2xl transition-all duration-300 animate-pulse-glow"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Install RateRadar
                </Button>
                <Button 
                  variant="outline" 
                  size="xl"
                  onClick={() => scrollToSection('features')}
                  className="border-2 hover:bg-gray-50"
                >
                  Learn More
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>170+ Currencies</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>7,000+ Cryptos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Real-time Rates</span>
                </div>
              </div>
            </div>

            <div className={`${isVisible ? 'animate-slide-in' : ''}`}>
              <Card className="p-6 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">RateRadar</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Currency Converter Demo */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Currency Converter</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <input 
                          type="number" 
                          value="100" 
                          readOnly 
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm"
                        />
                        <select className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm">
                          <option>USD</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <input 
                          type="number" 
                          value="75,000" 
                          readOnly 
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm"
                        />
                        <select className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm">
                          <option>NGN</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Crypto Demo */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Live Crypto Prices</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Bitcoin className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium">Bitcoin</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">$43,250.00</div>
                          <div className="text-xs text-green-600">+2.5%</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium">Ethereum</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">$2,650.00</div>
                          <div className="text-xs text-green-600">+1.8%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need for currency and crypto tracking
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl mt-4">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 mb-4">
                    {feature.description}
                  </CardDescription>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center justify-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Installation Section */}
      <section id="installation" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose your preferred installation method
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white">
                  <Download className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl mt-4">Chrome Web Store</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <CardDescription className="text-gray-600">
                  One-click installation from the official Chrome Web Store
                </CardDescription>
                <Button 
                  variant="gradient" 
                  size="lg"
                  className="w-full shadow-lg hover:shadow-xl"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Install from Store
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-gray-500 to-slate-600 rounded-xl flex items-center justify-center text-white">
                  <Code className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl mt-4">Manual Installation</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <CardDescription className="text-gray-600">
                  Download and install manually for advanced users
                </CardDescription>
                <div className="bg-gray-50 p-4 rounded-lg text-left text-sm space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Download the extension files</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Open Chrome and go to <code className="bg-gray-200 px-1 rounded">chrome://extensions/</code></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Enable "Developer mode"</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Click "Load unpacked" and select the folder</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full border-2"
                >
                  Download Files
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl font-bold">
                  About RateRadar
                </h2>
                <p className="text-lg text-gray-300 leading-relaxed">
                  RateRadar is a powerful Chrome extension designed to make currency conversion and crypto tracking simple, fast, and reliable. Built for travelers, traders, and anyone who needs to stay updated with exchange rates.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Technology Stack</h3>
                <div className="flex flex-wrap gap-3">
                  {['HTML5', 'CSS3 (Tailwind)', 'JavaScript (ES6+)', 'Chrome APIs', 'Exchangerate.host API', 'CoinGecko API'].map((tech, index) => (
                    <span 
                      key={index}
                      className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm border border-white/20 hover:bg-white/20 transition-colors"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">
                      {stat.number}
                    </div>
                    <div className="text-gray-300 font-medium">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">RateRadar</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Making currency conversion and crypto tracking simple, fast, and reliable.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-yellow-400">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => scrollToSection('features')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('installation')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Installation
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('about')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    About
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-yellow-400">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4" />
                    <span>Documentation</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2">
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Support</span>
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-yellow-400">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-gray-400 hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              Built with ❤️ by <strong className="text-white">Dev.Mubarak</strong> for the global community
            </p>
            <p className="text-gray-500 text-sm mt-2">
              © 2024 RateRadar. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage; 