import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Mail, CheckCircle2, Zap, Crown, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BackofficeSubscription() {
  const [loading, setLoading] = useState(null); // 'starter', 'pro', 'premium' or null
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const isSubscribed = user?.subscriptionStatus === 'active' &&
    user?.subscriptionEndDate &&
    new Date(user.subscriptionEndDate) > new Date();

  // Helper to construct stripe URL with prefilled email
  const getStripeUrl = (baseUrl) => {
    if (!user?.email) return baseUrl;
    return `${baseUrl}?prefilled_email=${encodeURIComponent(user.email)}`;
  };

  const handleSubscribe = (offerType, stripeUrl) => {
    // Check if running in iframe
    if (window.self !== window.top) {
      alert('Le paiement par carte bancaire nécessite d\'ouvrir l\'application dans un nouvel onglet. Veuillez publier votre application et l\'ouvrir directement.');
      return;
    }

    setLoading(offerType);
    window.location.href = getStripeUrl(stripeUrl);
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

  const offers = [
    {
      id: 'starter',
      name: 'Essentiel',
      price: '49',
      description: 'Pour les petits établissements',
      icon: Zap,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      stripeUrl: 'https://buy.stripe.com/4gMeVc460eFdaAk9IE7N608',
      features: [
        'Gestion des réservations',
        'Vue des tables simplifiée',
        'Configuration horaires standard',
        'Export CSV basique',
        'Support par email'
      ]
    },
    {
      id: 'pro',
      name: 'Restaurateur',
      price: '79',
      popular: true,
      description: 'La solution complète recommandée',
      icon: Crown,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      stripeUrl: 'https://buy.stripe.com/14A00i460bt15g04ok7N609',
      features: [
        'Tout du pack Essentiel',
        'Dashboard & statistiques avancés',
        'Plan de salle interactif',
        'Gestion multi-services',
        'Historique illimité',
        'Support prioritaire 7j/7'
      ]
    },
    {
      id: 'premium',
      name: 'Elite',
      price: '109',
      description: 'Pour les établissements exigeants',
      icon: Shield,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      stripeUrl: 'https://buy.stripe.com/7sY5kCdGA9kTaAk2gc7N60a',
      features: [
        'Tout du pack Restaurateur',
        'Multi-comptes utilisateurs',
        'API & Intégrations sur mesure',
        'Formation équipe incluse',
        'Account Manager dédié',
        'Badge "Restaurant Vérifié"'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur-sm rounded-full text-amber-300 text-sm mb-4">
            <Sparkles className="h-4 w-4" />
            Nouveaux Tarifs
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Des offres adaptées à vos besoins
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Choisissez la formule qui correspond le mieux à votre activité et commencez à optimiser votre gestion dès aujourd'hui.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {offers.map((offer) => (
            <Card
              key={offer.id}
              className={`bg-white/5 backdrop-blur-sm border-white/10 flex flex-col relative ${offer.popular ? 'border-amber-500/50 shadow-lg shadow-amber-900/20 scale-105 z-10' : ''
                }`}
            >
              {offer.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  Recommandé
                </div>
              )}

              <CardHeader className="text-center pt-8">
                <div className="mx-auto mb-4 w-12 h-12 rounded-lg flex items-center justify-center bg-white/5">
                  <offer.icon className={`h-6 w-6 ${offer.color}`} />
                </div>
                <CardTitle className="text-2xl text-white mb-2">{offer.name}</CardTitle>
                <div className="flex justify-center items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">{offer.price}€</span>
                  <span className="text-gray-400">/mois</span>
                </div>
                <CardDescription className="text-gray-400 min-h-[40px]">
                  {offer.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="space-y-4">
                  {offer.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                      <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full ${offer.bgColor} flex items-center justify-center`}>
                        <Check className={`h-2.5 w-2.5 ${offer.color}`} />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="pt-6 pb-8">
                <Button
                  className={`w-full h-12 font-semibold ${offer.popular
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  onClick={() => handleSubscribe(offer.id, offer.stripeUrl)}
                  disabled={loading && loading !== offer.id}
                >
                  {loading === offer.id ? 'Redirection...' : 'Choisir cette offre'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500 mb-4">
            Vous avez des questions ou besoin d'une offre sur mesure ?
          </p>
          <Button
            variant="outline"
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            onClick={() => window.location.href = 'mailto:contact@restoponot.com'}
          >
            <Mail className="h-4 w-4 mr-2" />
            Contacter l'équipe commerciale
          </Button>
        </div>
      </div>
    </div>
  );
}