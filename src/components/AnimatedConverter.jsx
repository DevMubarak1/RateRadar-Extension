import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

const AnimatedConverter = () => {
  const [currentState, setCurrentState] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const conversionStates = [
    { from: '₿', to: '$', fromName: 'Bitcoin', toName: 'USD', rate: '43,250' },
    { from: 'Ξ', to: '$', fromName: 'Ethereum', toName: 'USD', rate: '2,650' },
    { from: '◎', to: '$', fromName: 'Solana', toName: 'USD', rate: '98.50' },
    { from: '₿', to: '€', fromName: 'Bitcoin', toName: 'EUR', rate: '39,800' },
  ];

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

  const currentConversion = conversionStates[currentState];

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
                <span className="text-3xl font-bold text-white">{currentConversion.from}</span>
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
                <span className="text-3xl font-bold text-white">{currentConversion.to}</span>
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
              1 {currentConversion.from} = {currentConversion.to}{currentConversion.rate}
            </div>
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