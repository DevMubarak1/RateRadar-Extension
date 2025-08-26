import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Terms() {
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
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
            <p className="text-lg text-gray-600">Last updated: December 2024</p>
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 text-gray-700 leading-relaxed">
            
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
              <p>By installing and using the RateRadar Chrome extension, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our extension.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">2. Description of Service</h2>
              <p>RateRadar is a Chrome extension that provides:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Real-time currency conversion for 170+ world currencies</li>
                <li>Cryptocurrency price tracking for 7,000+ digital assets</li>
                <li>Custom rate alerts and notifications</li>
                <li>Smart shopping features with price detection</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">3. User Responsibilities</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">You agree to:</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                      <li>Use the extension for lawful purposes only</li>
                      <li>Not attempt to reverse engineer or modify the extension</li>
                      <li>Not use the extension to violate any applicable laws</li>
                      <li>Respect the intellectual property rights of others</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">You agree not to:</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                      <li>Use the extension for any illegal or unauthorized purpose</li>
                      <li>Interfere with or disrupt the extension's functionality</li>
                      <li>Attempt to gain unauthorized access to our systems</li>
                      <li>Use the extension to harm others or their property</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">4. Data and Privacy</h2>
              <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. By using RateRadar, you consent to our data practices as described in our Privacy Policy.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">5. Third-Party Services</h2>
              <p>RateRadar integrates with third-party APIs to provide currency and cryptocurrency data:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Exchangerate.host:</strong> For fiat currency conversion rates</li>
                <li><strong>CoinGecko API:</strong> For cryptocurrency price data</li>
              </ul>
              <p className="text-sm text-gray-600">We are not responsible for the accuracy, reliability, or availability of these third-party services.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">6. Disclaimers</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-yellow-800">Important Disclaimers:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-yellow-700">
                      <li>Exchange rates and cryptocurrency prices are for informational purposes only</li>
                      <li>We do not guarantee the accuracy of any financial data</li>
                      <li>RateRadar is not financial advice and should not be used for investment decisions</li>
                      <li>Always verify rates with official sources before making financial transactions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">7. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, RateRadar and its developer shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, arising out of or relating to your use of the extension.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">8. Intellectual Property</h2>
              <p>RateRadar and all related content, including but not limited to code, design, and functionality, are owned by Dev.Mubarak and are protected by copyright and other intellectual property laws.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">9. Termination</h2>
              <p>You may stop using RateRadar at any time by uninstalling the extension. We may terminate or suspend access to the extension immediately, without prior notice, for any reason, including breach of these Terms.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">10. Changes to Terms</h2>
              <p>We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes by updating the "Last updated" date at the top of this page. Your continued use of RateRadar after such changes constitutes acceptance of the new terms.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">11. Contact Information</h2>
              <p>If you have any questions about these Terms of Service, please contact us:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">Email:</p>
                <p className="text-blue-600">legal@rateradar.com</p>
                <p className="font-medium mt-2">Developer:</p>
                <p>Dev.Mubarak</p>
              </div>
            </section>

            <div className="border-t pt-6">
              <p className="text-sm text-gray-500">
                These terms of service are effective as of December 2024. By using RateRadar, you acknowledge that you have read, understood, and agree to be bound by these terms.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Terms; 