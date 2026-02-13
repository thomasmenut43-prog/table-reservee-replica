import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Mail, CheckCircle2, Zap, Crown, Shield, ArrowLeft, Menu } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import Sidebar from '@/components/backoffice/Sidebar';
import { useTheme } from '@/components/ThemeProvider';

export default function BackofficeSubscription() {
  const [loading, setLoading] = useState(null); // 'starter', 'pro', 'premium' or null
  const [user, setUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme() || { isDark: false };

  const urlParams = new URLSearchParams(location.search);
  const restaurantIdFromUrl = urlParams.get('restaurantId');
  const restaurantId = restaurantIdFromUrl || user?.restaurantId;

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.restaurantId || restaurantIdFromUrl) return;
    const next = `${location.pathname}?restaurantId=${user.restaurantId}`;
    if (location.search !== `?restaurantId=${user.restaurantId}`) {
      navigate(next, { replace: true });
    }
  }, [user?.restaurantId, restaurantIdFromUrl, location.pathname, location.search, navigate]);

  const [restaurant, setRestaurant] = useState(null);
  useEffect(() => {
    if (!restaurantId) {
      setRestaurant(null);
      return;
    }
    base44.entities.Restaurant.filter({ id: restaurantId }).then((res) => setRestaurant(res?.[0] ?? null));
  }, [restaurantId]);

  const isSubscribed =
    user?.subscriptionStatus === 'active' &&
    user?.subscriptionEndDate &&
    new Date(user.subscriptionEndDate) > new Date();

  const currentPlanId = user?.subscriptionPlan || user?.subscription_plan || null;

  // Helper to construct stripe URL with prefilled email
  const getStripeUrl = (baseUrl) => {
    if (!user?.email) return baseUrl;
    return `${baseUrl}?prefilled_email=${encodeURIComponent(user.email)}`;
  };

  const handleSubscribe = (offerType, stripeUrl) => {
    if (window.self !== window.top) {
      alert(
        "Le paiement par carte bancaire nécessite d'ouvrir l'application dans un nouvel onglet. Veuillez publier votre application et l'ouvrir directement."
      );
      return;
    }
    setLoading(offerType);
    window.location.href = getStripeUrl(stripeUrl);
  };

  const offers = [
    {
      id: 'starter',
      name: 'Essentiel',
      price: '49',
      description: 'Pour les petits établissements',
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200',
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
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      borderColor: 'border-amber-300',
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
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-200',
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

  if (!user) {
    return null;
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-slate-950' : 'bg-gray-50'} flex`}>
      <Sidebar
        user={user}
        restaurant={restaurant}
        isAdmin={false}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex-1 min-w-0">
        <header
          className={`${isDark ? 'dark bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-30`}
        >
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Offres & Abonnement
              </h1>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 overflow-y-auto">
          {/* Bandeau si abonné */}
          {isSubscribed && (
            <div
              className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl ${
                isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-green-50 border border-green-200'
              }`}
            >
              <CheckCircle2 className={`h-6 w-6 flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                  Votre offre est active
                </p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-green-700'}`}>
                  Valide jusqu'au{' '}
                  {user?.subscriptionEndDate
                    ? new Date(user.subscriptionEndDate).toLocaleDateString('fr-FR')
                    : '—'}
                </p>
              </div>
              <Link
                to={createPageUrl('BackofficeDashboard') + (restaurantId ? `?restaurantId=${restaurantId}` : '')}
              >
                <Button variant="outline" size="sm">
                  Retour au dashboard
                </Button>
              </Link>
            </div>
          )}

          <div className="mb-6">
            <Link
              to={createPageUrl('Backoffice') + (restaurantId ? `?restaurantId=${restaurantId}` : '')}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
          </div>

          <div className="text-center mb-12">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-4 ${
                isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Nouveaux Tarifs
            </div>
            <h2
              className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              Des offres adaptées à vos besoins
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Choisissez la formule qui correspond le mieux à votre activité et commencez à
              optimiser votre gestion dès aujourd'hui.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {offers.map((offer) => {
              const isCurrentPlan = isSubscribed && currentPlanId === offer.id;
              return (
                <Card
                  key={offer.id}
                  className={`flex flex-col relative transition-opacity ${
                    isCurrentPlan
                      ? 'opacity-75 bg-gray-100 border-gray-300 dark:bg-slate-800/50 dark:border-slate-600'
                      : isDark
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-white border-gray-200 shadow-md'
                  } ${offer.popular && !isCurrentPlan ? 'border-amber-400 shadow-xl shadow-amber-100 scale-105 z-10' : ''}`}
                >
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg z-20">
                      Votre plan actuel
                    </div>
                  )}
                  {offer.popular && !isCurrentPlan && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      Recommandé
                    </div>
                  )}

                  <CardHeader className="text-center pt-8">
                    <div
                      className={`mx-auto mb-4 w-12 h-12 rounded-lg flex items-center justify-center ${
                        isCurrentPlan ? 'bg-gray-200 dark:bg-slate-600' : offer.bgColor
                      }`}
                    >
                      <offer.icon
                        className={`h-6 w-6 ${isCurrentPlan ? 'text-gray-500 dark:text-slate-400' : offer.color}`}
                      />
                    </div>
                    <CardTitle
                      className={`text-2xl mb-2 ${isCurrentPlan ? 'text-gray-500 dark:text-slate-400' : isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                      {offer.name}
                    </CardTitle>
                    <div className="flex justify-center items-baseline gap-1 mb-2">
                      <span
                        className={`text-4xl font-bold ${isCurrentPlan ? 'text-gray-500 dark:text-slate-400' : isDark ? 'text-white' : 'text-gray-900'}`}
                      >
                        {offer.price}€
                      </span>
                      <span className={isDark ? 'text-slate-500' : 'text-gray-500'}>/mois</span>
                    </div>
                    <CardDescription
                      className={isCurrentPlan ? 'text-gray-400 dark:text-slate-500' : 'text-gray-500 min-h-[40px]'}
                    >
                      {offer.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      {offer.features.map((feature, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-3 text-sm ${
                            isCurrentPlan ? 'text-gray-500 dark:text-slate-400' : isDark ? 'text-slate-300' : 'text-gray-700'
                          }`}
                        >
                          <div
                            className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                              isCurrentPlan ? 'bg-gray-200 dark:bg-slate-600' : offer.bgColor
                            }`}
                          >
                            <Check
                              className={`h-2.5 w-2.5 ${
                                isCurrentPlan ? 'text-gray-500 dark:text-slate-400' : offer.color
                              }`}
                            />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-6 pb-8">
                    <Button
                      className={`w-full h-12 font-semibold ${
                        isCurrentPlan
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400'
                          : offer.popular
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                      onClick={() => !isCurrentPlan && handleSubscribe(offer.id, offer.stripeUrl)}
                      disabled={isCurrentPlan || (loading && loading !== offer.id)}
                    >
                      {isCurrentPlan
                        ? 'Votre plan actuel'
                        : loading === offer.id
                          ? 'Redirection...'
                          : 'Choisir cette offre'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <p className={`mb-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              Vous avez des questions ou besoin d'une offre sur mesure ?
            </p>
            <Button
              variant="outline"
              className={isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}
              onClick={() => (window.location.href = 'mailto:contact@restoponot.com')}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contacter l'équipe commerciale
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
