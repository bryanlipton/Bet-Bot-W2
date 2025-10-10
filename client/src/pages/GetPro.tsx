import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, Zap } from 'lucide-react';

export default function GetPro() {
  const features = [
    { icon: <Star className="w-5 h-5" />, text: 'Exclusive lock picks daily' },
    { icon: <Zap className="w-5 h-5" />, text: 'Advanced analytics & insights' },
    { icon: <Check className="w-5 h-5" />, text: 'Priority customer support' },
    { icon: <Star className="w-5 h-5" />, text: 'Early access to new features' },
    { icon: <Zap className="w-5 h-5" />, text: 'Historical performance tracking' },
    { icon: <Check className="w-5 h-5" />, text: 'Custom alerts & notifications' },
  ];

  const testimonials = [
    { rating: 5, text: "Best sports betting insights I've ever used!", author: "Mike T." },
    { rating: 5, text: "The lock picks are incredibly accurate.", author: "Sarah K." },
    { rating: 5, text: "Worth every penny for serious bettors.", author: "John D." },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Upgrade to <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">Bet Bot Pro</span>
          </h1>
          <p className="text-xl text-gray-400">
            Take your betting game to the next level with premium insights
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Features Card */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Pro Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 text-gray-300">
                      <div className="text-blue-400">{feature.icon}</div>
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30">
                  <div className="text-center">
                    <div className="text-5xl font-bold mb-2">$9.99</div>
                    <div className="text-gray-400">per month</div>
                    <p className="text-sm text-gray-500 mt-4">
                      Cancel anytime • No hidden fees
                    </p>
                  </div>
                </div>

                <p className="text-center text-gray-400 text-sm mt-4">
                  Click "Get Pro" in the top right to subscribe
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Testimonials */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">What people are saying</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="border-b border-gray-700 pb-6 last:border-b-0">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{testimonial.text}</p>
                    <p className="text-gray-500 text-xs">{testimonial.author}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
