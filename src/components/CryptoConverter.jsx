import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Bitcoin, DollarSign, TrendingUp, TrendingDown, ArrowRight, ArrowLeft } from 'lucide-react';

const CryptoConverter = () => {
  const [currentCrypto, setCurrentCrypto] = useState(0);
  const [currentFiat, setCurrentFiat] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState('right');

  const cryptoData = [
    { symbol: 'BTC', name: 'Bitcoin', price: 43250, change: 2.5, icon: Bitcoin },
    { symbol: 'ETH', name: 'Ethereum', price: 2650, change: 1.8, icon: Bitcoin },
    { symbol: 'SOL', name: 'Solana', price: 98.5, change: -0.5, icon: Bitcoin },
    { symbol: 'ADA', name: 'Cardano', price: 0.45, change: 3.2, icon: Bitcoin },
  ];

  const [currentCryptoIndex, setCurrentCryptoIndex] = useState(0);
  const currentCryptoData = cryptoData[currentCryptoIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setDirection('right');
      
      setTimeout(() => {
        setCurrentCryptoIndex((prev) => (prev + 1) % cryptoData.length);
        setIsAnimating(false);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, [cryptoData.length]);

  useEffect(() => {
    const cryptoAmount = 1;
    const fiatAmount = cryptoAmount * currentCryptoData.price;
    
    setCurrentCrypto(cryptoAmount);
    setCurrentFiat(fiatAmount);
  }, [currentCryptoData]);

  const formatNumber = (num) => {
    if (num >= 1000) {
      return num.toLocaleString('en-US', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2 
      });
    }
    return num.toFixed(2);
  };

  return (
    <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Conversion</h3>
          <div className="flex items-center justify-center space-x-2">
            <currentCryptoData.icon className="w-5 h-5 text-orange-500" />
            <span className="font-medium text-gray-700">{currentCryptoData.name}</span>
            <span className="text-sm text-gray-500">({currentCryptoData.symbol})</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Crypto Input */}
          <div className="relative">
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
              <div className="flex-shrink-0">
                <currentCryptoData.icon className="w-8 h-8 text-orange-500" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600">You send</div>
                <div className={`text-2xl font-bold text-gray-900 transition-all duration-500 ${
                  isAnimating && direction === 'right' ? 'animate-pulse' : ''
                }`}>
                  {formatNumber(currentCrypto)} {currentCryptoData.symbol}
                </div>
              </div>
            </div>
          </div>

          {/* Conversion Arrow */}
          <div className="flex justify-center">
            <div className={`w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white transition-all duration-500 ${
              isAnimating ? 'scale-110 rotate-180' : ''
            }`}>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Fiat Output */}
          <div className="relative">
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex-shrink-0">
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600">You receive</div>
                <div className={`text-2xl font-bold text-gray-900 transition-all duration-500 ${
                  isAnimating && direction === 'right' ? 'animate-pulse' : ''
                }`}>
                  ${formatNumber(currentFiat)}
                </div>
              </div>
            </div>
          </div>

          {/* Price Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Price:</span>
              <span className="font-semibold text-gray-900">${formatNumber(currentCryptoData.price)}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-600">24h Change:</span>
              <div className={`flex items-center space-x-1 ${
                currentCryptoData.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentCryptoData.change >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-medium">
                  {currentCryptoData.change >= 0 ? '+' : ''}{currentCryptoData.change}%
                </span>
              </div>
            </div>
          </div>

          {/* Exchange Rate */}
          <div className="text-center">
            <div className="text-sm text-gray-500">Exchange Rate</div>
            <div className="text-lg font-semibold text-gray-900">
              1 {currentCryptoData.symbol} = ${formatNumber(currentCryptoData.price)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CryptoConverter; 