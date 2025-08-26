import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Shield, Eye, Lock, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-lg text-gray-600">Last updated: December 2024</p>
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Your Privacy Matters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 text-gray-700 leading-relaxed">
            
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span>Information We Collect</span>
              </h2>
              <p>RateRadar is committed to protecting your privacy. We collect minimal information necessary to provide our services:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Extension Settings:</strong> Your preferred currencies, alert configurations, and display preferences</li>
                <li><strong>Usage Data:</strong> Basic analytics to improve our service (anonymized)</li>
                <li><strong>No Personal Data:</strong> We do not collect personal information like names, emails, or browsing history</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Database className="w-5 h-5 text-green-600" />
                <span>How We Use Your Information</span>
              </h2>
              <p>We use the collected information solely for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Providing currency conversion and crypto tracking services</li>
                <li>Delivering rate alerts and notifications you've configured</li>
                <li>Improving extension performance and user experience</li>
                <li>Ensuring the extension functions properly</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Lock className="w-5 h-5 text-purple-600" />
                <span>Data Security</span>
              </h2>
              <p>Your data security is our priority:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Local Storage:</strong> All settings and alerts are stored locally on your device</li>
                <li><strong>Encryption:</strong> Data transmission is encrypted using industry-standard protocols</li>
                <li><strong>No Third-Party Access:</strong> We do not sell, rent, or share your data with third parties</li>
                <li><strong>API Calls:</strong> Only currency and crypto data is fetched from external APIs</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Third-Party Services</h2>
              <p>RateRadar uses the following third-party APIs for data:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Exchangerate.host:</strong> For fiat currency conversion rates</li>
                <li><strong>CoinGecko API:</strong> For cryptocurrency price data</li>
              </ul>
              <p className="text-sm text-gray-600">These services have their own privacy policies, and we recommend reviewing them.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your stored settings and data</li>
                <li>Delete all extension data by uninstalling the extension</li>
                <li>Disable notifications and alerts at any time</li>
                <li>Contact us with privacy concerns</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">Email:</p>
                <p className="text-blue-600">privacy@rateradar.com</p>
                <p className="font-medium mt-2">Developer:</p>
                <p>Dev.Mubarak</p>
              </div>
            </section>

            <div className="border-t pt-6">
              <p className="text-sm text-gray-500">
                This privacy policy is effective as of December 2024 and will remain in effect except with respect to any changes in its provisions in the future.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Privacy; 