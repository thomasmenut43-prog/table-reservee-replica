import React from 'react';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

export default function SubscriptionGuard({ user, children }) {
  const isAdmin = user?.role === 'admin';
  const isSubscribed = user?.subscriptionStatus === 'active' && 
    user?.subscriptionEndDate && 
    new Date(user.subscriptionEndDate) > new Date();

  if (isAdmin || isSubscribed) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[400px]">
      <div className="opacity-20 pointer-events-none select-none blur-sm">
        {children}
      </div>
      <div className="absolute inset-0 flex items-start justify-center pt-12">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 max-w-md text-center pointer-events-auto">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-lg font-bold mb-2">Accès restreint</h3>
          <p className="text-sm text-gray-600 mb-5">
            Cette fonctionnalité nécessite un abonnement RestoPonot actif
          </p>
          <Button 
            className="w-full h-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
            onClick={() => window.location.href = '/BackofficeSubscription'}
          >
            Voir les offres d'abonnement
          </Button>
        </div>
      </div>
    </div>
  );
}