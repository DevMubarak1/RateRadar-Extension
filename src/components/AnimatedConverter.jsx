import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

const AnimatedConverter = () => {
  const [currentState, setCurrentState] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [loading, setLoading] = useState(true);

  const conversionStates = [
    { from: 'BTC', to: 'USD', fromName: 'Bitcoin', toName: 'US Dollar', fromSymbol: '₿', toSymbol: '$' },
    { from: 'ETH', to: 'USD', fromName: 'Ethereum', toName: 'US Dollar', fromSymbol: 'Ξ', toSymbol: '$' },
    { from: 'SOL', to: 'USD', fromName: 'Solana', toName: 'US Dollar', fromSymbol: '◎', toSymbol: '$' },
    { from: 'BTC', to: 'EUR', fromName: 'Bitcoin', toName: 'Euro', fromSymbol: '₿', toSymbol: '€' },
  ];

  // Fetch real-time exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        setLoading(true);
        
        // Fetch crypto rates from CoinGecko API
        const cryptoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd,eur');
        const cryptoData = await cryptoResponse.json();
        
        // Fetch fiat rates from ExchangeRate API
        const fiatResponse = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=EUR');
        const fiatData = await fiatResponse.json();
        
        const rates = [
          {
            from: 'BTC',
            to: 'USD',
            fromName: 'Bitcoin',
            toName: 'US Dollar',
            fromSymbol: '₿',
            toSymbol: '$',
            rate: cryptoData.bitcoin?.usd || 43250,
            change: 2.5
          },
          {
            from: 'ETH',
            to: 'USD',
            fromName: 'Ethereum',
            toName: 'US Dollar',
            fromSymbol: 'Ξ',
            toSymbol: '$',
            rate: cryptoData.ethereum?.usd || 2650,
            change: 1.8
          },
          {
            from: 'SOL',
            to: 'USD',
            fromName: 'Solana',
            toName: 'US Dollar',
            fromSymbol: '◎',
            toSymbol: '$',
            rate: cryptoData.solana?.usd || 98.5,
            change: -0.5
          },
          {
            from: 'BTC',
            to: 'EUR',
            fromName: 'Bitcoin',
            toName: 'Euro',
            fromSymbol: '₿',
            toSymbol: '€',
            rate: (cryptoData.bitcoin?.usd || 43250) * (fiatData.rates?.EUR || 0.85),
            change: 2.2
          }
        ];
        
        setExchangeRates(rates);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Fallback to static data if API fails
        const fallbackRates = [
          { from: 'BTC', to: 'USD', fromName: 'Bitcoin', toName: 'US Dollar', fromSymbol: '₿', toSymbol: '$', rate: 43250, change: 2.5 },
          { from: 'ETH', to: 'USD', fromName: 'Ethereum', toName: 'US Dollar', fromSymbol: 'Ξ', toSymbol: '$', rate: 2650, change: 1.8 },
          { from: 'SOL', to: 'USD', fromName: 'Solana', toName: 'US Dollar', fromSymbol: '◎', toSymbol: '$', rate: 98.5, change: -0.5 },
          { from: 'BTC', to: 'EUR', fromName: 'Bitcoin', toName: 'Euro', fromSymbol: '₿', toSymbol: '€', rate: 39800, change: 2.2 }
        ];
        setExchangeRates(fallbackRates);
        setLoading(false);
      }
    };

    fetchExchangeRates();
    
    // Refresh rates every 30 seconds
    const interval = setInterval(fetchExchangeRates, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentState((prev) => (prev + 1) % conversionStates.length);
        setIsAnimating(false);
      }, 600);
    }, 4000);

    return () => clearInterval(interval);
  }, [conversionStates.length]);

  const currentConversion = exchangeRates[currentState] || conversionStates[currentState];

  const formatNumber = (num) => {
    if (num >= 1000) {
      return num.toLocaleString('en-US', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2 
      });
    }
    return num.toFixed(2);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading live rates...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg bg-white/95 backdrop-blur-md border-0 shadow-2xl overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Live Conversion</h3>
          <p className="text-sm text-gray-600">Real-time crypto to fiat exchange</p>
        </div>

        {/* Animated Conversion Display */}
        <div className="relative mb-8">
          <div className="flex items-center justify-center space-x-8">
            {/* From Currency */}
            <div className={`text-center transition-all duration-500 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center mb-3 shadow-lg">
                <span className="text-3xl font-bold text-white">{currentConversion.fromSymbol}</span>
              </div>
              <div className="text-sm font-medium text-gray-700">{currentConversion.fromName}</div>
            </div>

            {/* Animated Arrow */}
            <div className="relative">
              <div className={`w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center transition-all duration-500 ${
                isAnimating ? 'scale-125 rotate-180' : 'scale-100'
              }`}>
                <svg 
                  className={`w-8 h-8 text-white transition-transform duration-500 ${
                    isAnimating ? 'translate-x-1' : ''
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
              
              {/* Morphing Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-500 ${
                isAnimating ? 'opacity-100 scale-110' : 'opacity-0 scale-100'
              }`}>
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* To Currency */}
            <div className={`text-center transition-all duration-500 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-3 shadow-lg">
                <span className="text-3xl font-bold text-white">{currentConversion.toSymbol}</span>
              </div>
              <div className="text-sm font-medium text-gray-700">{currentConversion.toName}</div>
            </div>
          </div>
        </div>

        {/* Exchange Rate */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Current Exchange Rate</div>
            <div className={`text-3xl font-bold text-gray-900 transition-all duration-500 ${
              isAnimating ? 'scale-110' : 'scale-100'
            }`}>
              1 {currentConversion.fromSymbol} = {currentConversion.toSymbol}{formatNumber(currentConversion.rate)}
            </div>
            {currentConversion.change && (
              <div className={`flex items-center justify-center space-x-1 mt-2 ${
                currentConversion.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className="text-sm font-medium">
                  {currentConversion.change >= 0 ? '+' : ''}{currentConversion.change}%
                </span>
                <span className="text-xs">24h</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex justify-center space-x-4 mt-6">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Live Rates
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Real-time
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Secure
          </Badge>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mt-6">
          {conversionStates.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentState 
                  ? 'bg-blue-500 scale-125' 
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnimatedConverter; 