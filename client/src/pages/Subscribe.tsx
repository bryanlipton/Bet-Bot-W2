import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import betbotLogo from "@assets/dde5f7b9-6c02-4772-9430-78d9b96b7edb_1752677738478.png";

// Load Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Stripe price IDs - These need to be configured in your Stripe Dashboard
// Go to: https://dashboard.stripe.com/products to create price IDs
const PRICING_PLANS = {
  monthly: {
    priceId: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID || 'price_monthly_placeholder',
    amount: 29.99,
    interval: 'month'
  },
  annual: {
    priceId: import.meta.env.VITE_STRIPE_ANNUAL_PRICE_ID || 'price_annual_placeholder',
    amount: 299.99,
    interval: 'year'
  }
};

const CheckoutForm = ({ selectedPlan }: { selectedPlan: 'monthly' | 'annual' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: "Welcome to BET BOT Pro! Your subscription is now active.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Subscribe for $${PRICING_PLANS[selectedPlan].amount}/${selectedPlan === 'monthly' ? 'month' : 'year'}`
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to subscribe to BET BOT Pro.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 2000);
      return;
    }
  }, [isAuthenticated, toast]);

  const createSubscription = async () => {
    if (!isAuthenticated) return;

    const priceId = PRICING_PLANS[selectedPlan].priceId;
    
    // Check for placeholder price IDs
    if (priceId.includes('placeholder')) {
      toast({
        title: "Configuration Required",
        description: "Stripe price IDs need to be configured. Please set VITE_STRIPE_MONTHLY_PRICE_ID and VITE_STRIPE_ANNUAL_PRICE_ID environment variables.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/subscription/create", {
        priceId: priceId
      });

      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.clientSecret);
        
        if (data.status === 'active') {
          toast({
            title: "Already Subscribed",
            description: "You already have an active subscription!",
          });
        }
      } else {
        throw new Error('Failed to create subscription');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Back to BET BOT
          </Link>
          <div className="flex items-center gap-2">
            <img src={betbotLogo} alt="BET BOT" className="w-6 h-6" />
            <Badge variant="default" className="bg-blue-600 text-white">PRO</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subscription Plans */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Choose Your Plan
            </h1>
            
            <div className="space-y-4">
              {/* Monthly Plan */}
              <Card className={`cursor-pointer transition-all ${selectedPlan === 'monthly' ? 'ring-2 ring-blue-600' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Monthly</CardTitle>
                      <CardDescription>Perfect for trying out BET BOT Pro</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${PRICING_PLANS.monthly.amount}
                      </div>
                      <div className="text-sm text-gray-500">/month</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant={selectedPlan === 'monthly' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setSelectedPlan('monthly')}
                  >
                    {selectedPlan === 'monthly' ? 'Selected' : 'Select Monthly'}
                  </Button>
                </CardContent>
              </Card>

              {/* Annual Plan */}
              <Card className={`cursor-pointer transition-all ${selectedPlan === 'annual' ? 'ring-2 ring-blue-600' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Annual
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Save 17%</Badge>
                      </CardTitle>
                      <CardDescription>Best value for serious bettors</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${PRICING_PLANS.annual.amount}
                      </div>
                      <div className="text-sm text-gray-500">/year</div>
                      <div className="text-sm text-green-600">$24.99/month</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant={selectedPlan === 'annual' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setSelectedPlan('annual')}
                  >
                    {selectedPlan === 'annual' ? 'Selected' : 'Select Annual'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Features */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                What's included:
              </h3>
              <div className="space-y-3">
                {[
                  "AI-powered game predictions with confidence scores",
                  "Real-time odds monitoring across 15+ sportsbooks",
                  "Advanced baseball analytics with Statcast metrics",
                  "Live umpire data integration and impact analysis",
                  "Premium chat access to BET BOT Sports Genie AI"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Subscription</CardTitle>
                <CardDescription>
                  Subscribing to BET BOT Pro {selectedPlan} plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!clientSecret ? (
                  <Button 
                    onClick={createSubscription}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      `Continue to Payment`
                    )}
                  </Button>
                ) : (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm selectedPlan={selectedPlan} />
                  </Elements>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}