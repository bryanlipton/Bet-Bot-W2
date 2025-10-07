import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const PaymentSuccess: React.FC = () => {
  const { profile } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 text-center">
        <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome to Pro!
        </h1>
        <p className="text-gray-300 mb-6">
          Your payment was successful and your account has been upgraded.
        </p>

        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <div className="text-gray-300 text-sm mb-2">Account Status:</div>
          <div className={`font-medium ${profile?.is_pro ? 'text-green-400' : 'text-yellow-400'}`}>
            {profile?.is_pro ? '✅ Pro Active' : '⏳ Activating Pro...'}
          </div>
        </div>

        <button
          onClick={() => window.location.href = '/dashboard'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          Go to Dashboard
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
