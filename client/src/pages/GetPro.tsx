import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import betbotLogo from "@assets/dde5f7b9-6c02-4772-9430-78d9b96b7edb_1752677738478.png";

const features = [
  "AI-powered game predictions with confidence scores",
  "Real-time odds monitoring across 15+ sportsbooks", 
  "Advanced baseball analytics with Statcast metrics",
  "Live umpire data integration and impact analysis",
  "Premium chat access to BET BOT Sports Genie AI"
];

const testimonials = [
  {
    rating: 5,
    text: "The AI predictions are incredibly accurate. I've been profitable for 3 months straight using their baseball picks. The umpire data integration is a game-changer.",
    author: "App Store Review - BaseballBetter22"
  },
  {
    rating: 5,
    text: "Best sports betting tool I've ever used. The real-time odds monitoring saved me thousands by catching line movements. Worth every penny!",
    author: "Reddit - MLBSharpBettor"
  },
  {
    rating: 5,
    text: "BET BOT's weather-adjusted predictions are unreal. Hit 7 out of 10 over/under bets last week. The continuous learning model keeps getting better.",
    author: "Twitter - SportsAnalyticsPro"
  }
];

const plans = [
  {
    id: "annual",
    name: "Annual",
    price: "$9.99",
    period: "month",
    billingNote: "billed annually",
    badge: "Best Offer",
    popular: true
  },
  {
    id: "monthly", 
    name: "Monthly",
    price: "$29.99",
    period: "month",
    billingNote: "billed monthly",
    popular: false
  },
  {
    id: "weekly",
    name: "Weekly", 
    price: "$19.99",
    period: "week",
    billingNote: "billed weekly",
    popular: false
  }
];

export default function GetPro() {
  const [selectedPlan, setSelectedPlan] = useState("annual");

  const handleSubscribe = (planId: string) => {
    // In a real app, this would integrate with payment processor
    alert(`Subscribing to ${planId} plan - Payment integration would go here`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              Back to BET BOT
            </Link>
            <div className="flex items-center gap-2">
              <img src={betbotLogo} alt="BET BOT" className="w-6 h-6" />
              <Badge variant="default" className="bg-blue-600 text-white">PRO</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Stop guessing. Use Bet Bot.
              </h1>
              
              {/* Features Grid */}
              <div className="grid grid-cols-1 gap-3 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Pricing Plans */}
              <div className="space-y-4">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id}
                    className={`cursor-pointer transition-all ${
                      selectedPlan === plan.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              checked={selectedPlan === plan.id}
                              onChange={() => setSelectedPlan(plan.id)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {plan.name}
                                </span>
                                {plan.badge && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {plan.badge}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {plan.price} <span className="text-sm font-normal text-gray-500">/ {plan.period}</span>
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {plan.billingNote}
                              </div>
                            </div>
                          </div>
                        </div>
                        {selectedPlan === plan.id && (
                          <Check className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Account Section */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  1. Account
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Begin by logging in or creating a free account.
                </p>
                <Button 
                  onClick={() => handleSubscribe(selectedPlan)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  Subscribe Now
                </Button>
              </div>
            </div>
          </div>

          {/* Testimonials Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">What people are saying</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                      {testimonial.text}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {testimonial.author}
                    </p>
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