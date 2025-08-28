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
  TrendingUp,
  Play,
  Chrome
} from 'lucide-react';

function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const openVideoModal = () => {
    setShowVideoModal(true);
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Line Background Theme */}
      <div className="absolute inset-0 opacity-30 line-background">
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Vertical lines - more frequent */}
          <div className="absolute left-1/6 w-px h-full bg-blue-400"></div>
          <div className="absolute left-1/3 w-px h-full bg-blue-400"></div>
          <div className="absolute left-1/2 w-px h-full bg-blue-400"></div>
          <div className="absolute left-2/3 w-px h-full bg-blue-400"></div>
          <div className="absolute left-5/6 w-px h-full bg-blue-400"></div>
          
          {/* Horizontal lines - more frequent */}
          <div className="absolute top-1/6 w-full h-px bg-blue-400"></div>
          <div className="absolute top-1/3 w-full h-px bg-blue-400"></div>
          <div className="absolute top-1/2 w-full h-px bg-blue-400"></div>
          <div className="absolute top-2/3 w-full h-px bg-blue-400"></div>
          <div className="absolute top-5/6 w-full h-px bg-blue-400"></div>
          
          {/* Diagonal lines - more frequent */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-0 left-0 w-full h-full transform rotate-45">
              <div className="absolute top-1/6 w-full h-px bg-blue-300"></div>
              <div className="absolute top-1/3 w-full h-px bg-blue-300"></div>
              <div className="absolute top-1/2 w-full h-px bg-blue-300"></div>
              <div className="absolute top-2/3 w-full h-px bg-blue-300"></div>
              <div className="absolute top-5/6 w-full h-px bg-blue-300"></div>
            </div>
          </div>
          
          {/* Additional diagonal lines in opposite direction */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-0 left-0 w-full h-full transform -rotate-45">
              <div className="absolute top-1/6 w-full h-px bg-blue-300"></div>
              <div className="absolute top-1/3 w-full h-px bg-blue-300"></div>
              <div className="absolute top-1/2 w-full h-px bg-blue-300"></div>
              <div className="absolute top-2/3 w-full h-px bg-blue-300"></div>
              <div className="absolute top-5/6 w-full h-px bg-blue-300"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Navigation */}
      <nav className="relative z-50 mx-4 mt-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl">
            <div className="flex justify-between items-center h-16 px-6">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                  <img 
                    src="/icons/icon.png" 
                    alt="RateRadar Logo" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent font-montserrat">
                  RateRadar
                </span>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-2 hover:bg-gray-50 font-montserrat"
                  onClick={openVideoModal}
                >
                  <Code className="w-4 h-4 mr-2" />
                  How to Install
                </Button>
                
                <Button 
                  variant="gradient" 
                  size="sm"
                  className="shadow-lg hover:shadow-xl transition-all duration-300 font-montserrat"
                  onClick={() => window.open('https://chrome.google.com/webstore/detail/rateradar/your-extension-id', '_blank')}
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  Add to Chrome
                </Button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMobileMenu}
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden border-t border-gray-200 bg-white/90 backdrop-blur-md rounded-b-2xl">
                <div className="px-6 py-4 space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full border-2 hover:bg-gray-50 font-montserrat"
                    onClick={() => {
                      openVideoModal();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    How to Install
                  </Button>
                  
                  <Button 
                    variant="gradient" 
                    size="sm"
                    className="w-full shadow-lg hover:shadow-xl transition-all duration-300 font-montserrat"
                    onClick={() => {
                      window.open('https://chrome.google.com/webstore/detail/rateradar/your-extension-id', '_blank');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Chrome className="w-4 h-4 mr-2" />
                    Add to Chrome
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className={`space-y-6 ${isVisible ? 'animate-fade-in' : ''}`}>
              <div className="space-y-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-2 font-montserrat">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Open-Source
                </Badge>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight font-montserrat">
                  Track, Convert &{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    Monitor
                  </span>
                </h1>
                
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 font-montserrat">
                  Currency & Crypto Exchange Rates
                </h2>
              </div>
              
              <p className="text-lg text-gray-600 leading-relaxed font-opensans">
                Your ultimate Chrome extension for real-time currency conversion, crypto tracking, and smart shopping with price alerts.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mobile-stack">
                <Button 
                  variant="gradientYellow" 
                  size="xl"
                  className="shadow-xl hover:shadow-2xl transition-all duration-300 animate-pulse-glow font-montserrat"
                  onClick={() => window.open('https://chrome.google.com/webstore/detail/rateradar/your-extension-id', '_blank')}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Install RateRadar
                </Button>
                <Button 
                  variant="outline" 
                  size="xl"
                  className="border-2 hover:bg-gray-50 group font-montserrat"
                  onClick={() => window.open('https://github.com/yourusername/rateradar', '_blank')}
                >
                  <Github className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Star us on GitHub
                </Button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500 font-opensans">
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
              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 font-opensans">
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

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900 font-montserrat">How to Install RateRadar</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeVideoModal}
                className="hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6">
              <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Play className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 font-opensans">YouTube video will be embedded here</p>
                  <p className="text-sm text-gray-500 mt-2 font-opensans">How to install RateRadar Chrome Extension</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage; 