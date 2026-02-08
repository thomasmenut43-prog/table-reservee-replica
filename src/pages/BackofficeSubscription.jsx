import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, CreditCard, Mail, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BackofficeSubscription() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);
  
  const isSubscribed = user?.subscriptionStatus === 'active' && 
    user?.subscriptionEndDate && 
    new Date(user.subscriptionEndDate) > new Date();

  const handleStripeCheckout = async () => {
    // Check if running in iframe
    if (window.self !== window.top) {
      alert('Le paiement par carte bancaire nécessite d\'ouvrir l\'application dans un nouvel onglet. Veuillez publier votre application et l\'ouvrir directement.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('createSubscriptionCheckout');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Erreur checkout:', error);
      alert('Erreur lors de la création de la session de paiement');
      setLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Offre Active</h2>
              <p className="text-gray-300 mb-2">Votre offre RestoPonot est active</p>
              <p className="text-gray-400 text-sm mb-8">
                Valide jusqu'au {user?.subscriptionEndDate ? new Date(user.subscriptionEndDate).toLocaleDateString('fr-FR') : ''}
              </p>
              <Button 
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                onClick={() => window.location.href = '/BackofficeDashboard'}
              >
                Accéder au back-office
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur-sm rounded-full text-amber-300 text-sm mb-4">
            <Sparkles className="h-4 w-4" />
            Offre RestoPonot
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Débloquez votre back-office
          </h1>
          <p className="text-gray-400 text-lg">
            Gérez vos réservations en toute simplicité
          </p>
        </div>

        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader className="text-center pb-8 pt-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="text-6xl font-bold text-white">70€</div>
                <div className="absolute -top-2 -right-12 text-gray-400 text-sm">/mois</div>
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Offre Restaurateur</CardTitle>
            <CardDescription className="text-gray-400">
              Accès complet à tous les outils de gestion
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-3">
            {[
            'Dashboard avec statistiques en temps réel',
            'Gestion complète des réservations',
            'Vue et modifications des tables',
            'Configuration des horaires midi/soir',
            'Gestion des indisponibilités de tables',
            'Paramètres du restaurant (photos, infos, etc.)',
            'Export CSV des réservations',
            'Historique et suivi complet',
            'Support prioritaire'
            ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3 text-gray-300">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Check className="h-3 w-3 text-amber-400" />
              </div>
              <span>{feature}</span>
            </div>
            ))}
            </div>

            <div className="pt-6 space-y-3">
              <Button 
                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                onClick={handleStripeCheckout}
                disabled={loading}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {loading ? 'Redirection...' : 'Payer par carte bancaire'}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-slate-900 text-gray-400">ou</span>
                </div>
              </div>
              
              <Button 
                variant="outline"
                className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10"
                onClick={() => window.location.href = 'mailto:contact@restoponot.com?subject=Offre RestoPonot - Autre moyen de paiement'}
              >
                <Mail className="h-5 w-5 mr-2" />
                Autre moyen de paiement
              </Button>
              
              <p className="text-center text-xs text-gray-500">
                Paiement sécurisé via Stripe ou contactez-nous
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}