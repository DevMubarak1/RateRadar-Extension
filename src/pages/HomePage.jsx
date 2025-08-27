import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import AnimatedConverter from '../components/AnimatedConverter';
import { 
  Download, 
  Code, 
  Zap,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Github,
  Star,
  TrendingUp
} from 'lucide-react';

function HomePage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Floating Navigation */}
      <nav className="relative z-50 mx-4 mt-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl">
            <div className="flex justify-between items-center h-16 px-6">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                  <img 
                    src="/icons/icon16.png" 
                    alt="RateRadar Logo" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  RateRadar
                </span>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-2 hover:bg-gray-50"
                >
                  <Code className="w-4 h-4 mr-2" />
                  How to Install
                </Button>
                
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
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={`space-y-8 ${isVisible ? 'animate-fade-in' : ''}`}>
              <div className="space-y-6">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-2">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Real-time Exchange Rates
                </Badge>
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Track, Convert &{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Monitor
                  </span>
                </h1>
                
                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700">
                  Currency & Crypto Exchange Rates
                </h2>
              </div>
              
              <p className="text-xl text-gray-600 leading-relaxed">
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
                  className="border-2 hover:bg-gray-50"
                >
                  <Star className="w-5 h-5 mr-2" />
                  Star us on GitHub
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

              {/* Developer Attribution */}
              <div className="pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Developed by{' '}
                  <a 
                    href="https://devmubarak.vercel.app/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    Dev.Mubarak
                  </a>
                </p>
              </div>
            </div>

            <div className={`${isVisible ? 'animate-slide-in' : ''}`}>
              <AnimatedConverter />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage; 