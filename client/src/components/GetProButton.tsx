import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Zap, CreditCard, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const GetProButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
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

      // Check response status BEFORE parsing JSON
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch {
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch {
            // Keep default error message
          }
        }
        
        throw new Error(errorMessage);
      }

      // Only parse JSON if response is ok
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.sessionId) {
        throw new Error('No session ID returned from server');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({ 
        sessionId: data.sessionId 
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

    } catch (error) {
      console.error('Upgrade error:', error);
      setError(error instanceof Error ? error.message : 'Failed to start upgrade process');
    } finally {
      setIsLoading(false);
    }
  };

  if (profile?.is_pro) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
        <CheckCircle size={compact ? 16 : 20} className="text-green-400" />
        <span className="text-green-400 font-medium">Pro Member</span>
      </div>
    );
  }

  // Compact version for header
  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={handleUpgrade}
          disabled={isLoading || !isAuthenticated}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 text-sm"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap size={16} />
              Get Pro
            </>
          )}
        </button>
        {error && (
          <div className="absolute top-full mt-2 right-0 w-64 text-red-400 text-xs bg-red-900/90 border border-red-600 rounded p-2 z-50">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Full version for pages
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
