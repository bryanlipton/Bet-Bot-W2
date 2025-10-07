import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Zap, CreditCard, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const GetProButton: React.FC = () => {
  const { user, profile, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    if (!isAuthenticated || !user) {
      setError('Please log in to upgrade to Pro');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const { sessionId, error: sessionError } = await response.json();

      if (sessionError) {
        throw new Error(sessionError);
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      await stripe.redirectToCheckout({ sessionId });

    } catch (error) {
      console.error('Upgrade error:', error);
      setError(error instanceof Error ? error.message : 'Failed to start upgrade process');
    } finally {
      setIsLoading(false);
    }
  };

  if (profile?.is_pro) {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle size={20} className="text-green-400" />
        <span className="text-green-400 font-medium">Pro Member</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleUpgrade}
        disabled={isLoading || !isAuthenticated}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Zap size={20} />
            Get Pro - $9.99/month
            <CreditCard size={16} className="opacity-75" />
          </>
        )}
      </button>

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-600 rounded p-3">
          {error}
        </div>
      )}
    </div>
  );
};

export default GetProButton;
