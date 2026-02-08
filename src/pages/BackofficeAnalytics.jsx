import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Menu, TrendingUp, Calendar, Users, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Sidebar from '@/components/backoffice/Sidebar';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subMonths, addDays, addWeeks, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SubscriptionGuard from '@/components/backoffice/SubscriptionGuard';
import { toast } from 'sonner';

export default function BackofficeAnalytics() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [dayOffset, setDayOffset] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    base44.auth.me()
      .then(userData => {
        setUser(userData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const urlRestaurantId = urlParams.get('restaurantId');
  const restaurantId = urlRestaurantId || user?.restaurantId;

  const { data: restaurant } = useQuery({
    queryKey: ['my-restaurant', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;
      const results = await base44.entities.Restaurant.filter({ id: restaurantId });
      return results[0];
    },
    enabled: !!restaurantId
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['analytics-reservations', restaurantId],
    queryFn: () => base44.entities.Reservation.filter({ restaurantId }),
    enabled: !!restaurantId
  });

  // Statistiques par jour avec défilement
  const dailyStats = useMemo(() => {
    if (!reservations.length) return [];
    
    const startDay = addDays(new Date(), dayOffset);
    const last30Days = eachDayOfInterval({
      start: subMonths(startDay, 1),
      end: startDay
    });
    
    return last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayReservations = reservations.filter(r => {
        const resDate = format(new Date(r.dateTimeStart), 'yyyy-MM-dd');
        return resDate === dayStr && r.status !== 'canceled';
      });
      
      return {
        date: format(day, 'dd MMM', { locale: fr }),
        reservations: dayReservations.length,
        couverts: dayReservations.reduce((sum, r) => sum + (r.guestsCount || 0), 0),
        fullDate: dayStr
      };
    });
  }, [reservations, dayOffset]);

  // Statistiques par semaine avec défilement
  const weeklyStats = useMemo(() => {
    if (!reservations.length) return [];
    
    const baseDate = addWeeks(new Date(), weekOffset);
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const date = addWeeks(baseDate, -i);
      const weekStart = startOfWeek(date, { locale: fr });
      const weekEnd = endOfWeek(date, { locale: fr });
      
      const weekReservations = reservations.filter(r => {
        const resDate = new Date(r.dateTimeStart);
        return resDate >= weekStart && resDate <= weekEnd && r.status !== 'canceled';
      });
      
      weeks.push({
        week: `S${format(weekStart, 'w', { locale: fr })}`,
        reservations: weekReservations.length,
        couverts: weekReservations.reduce((sum, r) => sum + (r.guestsCount || 0), 0)
      });
    }
    
    return weeks;
  }, [reservations, weekOffset]);

  // Statistiques par mois avec défilement
  const monthlyStats = useMemo(() => {
    if (!reservations.length) return [];
    
    const baseDate = addMonths(new Date(), monthOffset);
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = addMonths(baseDate, -i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthReservations = reservations.filter(r => {
        const resDate = new Date(r.dateTimeStart);
        return resDate >= monthStart && resDate <= monthEnd && r.status !== 'canceled';
      });
      
      months.push({
        month: format(date, 'MMM yyyy', { locale: fr }),
        reservations: monthReservations.length,
        couverts: monthReservations.reduce((sum, r) => sum + (r.guestsCount || 0), 0)
      });
    }
    
    return months;
  }, [reservations, monthOffset]);

  // Statistiques globales
  const globalStats = useMemo(() => {
    const confirmedReservations = reservations.filter(r => r.status === 'confirmed' || r.status === 'pending');
    const totalCouverts = confirmedReservations.reduce((sum, r) => sum + (r.guestsCount || 0), 0);
    const avgCouverts = confirmedReservations.length > 0 ? (totalCouverts / confirmedReservations.length).toFixed(1) : 0;
    
    // Taux d'annulation
    const canceledCount = reservations.filter(r => r.status === 'canceled').length;
    const cancelRate = reservations.length > 0 ? ((canceledCount / reservations.length) * 100).toFixed(1) : 0;
    
    // Service le plus populaire
    const midiCount = reservations.filter(r => r.serviceType === 'MIDI' && r.status !== 'canceled').length;
    const soirCount = reservations.filter(r => r.serviceType === 'SOIR' && r.status !== 'canceled').length;
    
    return {
      totalReservations: confirmedReservations.length,
      totalCouverts,
      avgCouverts,
      cancelRate,
      popularService: midiCount > soirCount ? 'Midi' : 'Soir'
    };
  }, [reservations]);

  // Générer l'analyse IA
  const generateAiAnalysis = async () => {
    if (!restaurant || !reservations.length) {
      toast.error('Pas assez de données pour générer une analyse');
      return;
    }

    setLoadingAnalysis(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un expert en analyse de données pour restaurants. Analyse les données suivantes et fournis une analyse détaillée et des recommandations en français :

Restaurant: ${restaurant.name}
Période analysée: 12 derniers mois

Statistiques globales:
- Nombre total de réservations confirmées: ${globalStats.totalReservations}
- Total de couverts: ${globalStats.totalCouverts}
- Moyenne de couverts par réservation: ${globalStats.avgCouverts}
- Taux d'annulation: ${globalStats.cancelRate}%
- Service le plus populaire: ${globalStats.popularService}

Données mensuelles (12 derniers mois):
${monthlyStats.map(m => `${m.month}: ${m.reservations} réservations, ${m.couverts} couverts`).join('\n')}

Fournis une analyse structurée avec:
1. Tendance générale de l'affluence
2. Points forts
3. Points d'amélioration
4. Recommandations concrètes pour augmenter l'affluence
5. Conclusion

Sois précis, professionnel et actionnable dans tes recommandations.`,
        add_context_from_internet: false
      });

      setAiAnalysis(response);
    } catch (error) {
      toast.error('Erreur lors de la génération de l\'analyse');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h2>
          <p className="text-gray-600">Vous devez être connecté pour accéder à cette page.</p>
        </div>
      </div>
    );
  }
  
  const isAdmin = user.role === 'admin';

  if (!restaurantId && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h2>
          <p className="text-gray-600">Vous n'êtes pas associé à un restaurant.</p>
        </div>
      </div>
    );
  }
  
  if (!restaurantId && isAdmin) {
    const RestaurantSelector = React.lazy(() => import('@/components/backoffice/RestaurantSelector'));
    return (
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Chargement...</p></div>}>
        <RestaurantSelector onSelect={(id) => window.location.href = `?restaurantId=${id}`} />
      </React.Suspense>
    );
  }

  return (
    <SubscriptionGuard user={user}>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar 
          user={user} 
          restaurant={restaurant}
          isAdmin={false}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Analytique</h1>
                  <p className="text-gray-600 mt-1">Analyse de l'affluence{restaurant ? ` de ${restaurant.name}` : ''}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setIsMobileOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </div>

              {/* Statistiques globales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Réservations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{globalStats.totalReservations}</div>
                    <p className="text-xs text-gray-500 mt-1">Confirmées ou en attente</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Couverts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{globalStats.totalCouverts}</div>
                    <p className="text-xs text-gray-500 mt-1">Personnes accueillies</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Moyenne / Résa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{globalStats.avgCouverts}</div>
                    <p className="text-xs text-gray-500 mt-1">Couverts par réservation</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Taux d'annulation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{globalStats.cancelRate}%</div>
                    <p className="text-xs text-gray-500 mt-1">Service populaire: {globalStats.popularService}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Analyse IA */}
              <Card className="mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        Analyse IA
                      </CardTitle>
                      <CardDescription>Obtenez une analyse détaillée de votre affluence</CardDescription>
                    </div>
                    <Button 
                      onClick={generateAiAnalysis} 
                      disabled={loadingAnalysis || !reservations.length}
                    >
                      {loadingAnalysis ? 'Génération...' : 'Générer l\'analyse'}
                    </Button>
                  </div>
                </CardHeader>
                {aiAnalysis && (
                  <CardContent>
                    <div className="prose prose-slate max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700">{aiAnalysis}</div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Graphiques */}
              <Tabs defaultValue="day" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="day">Par Jour</TabsTrigger>
                  <TabsTrigger value="week">Par Semaine</TabsTrigger>
                  <TabsTrigger value="month">Par Mois</TabsTrigger>
                </TabsList>

                <TabsContent value="day">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Affluence des 30 derniers jours</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setDayOffset(dayOffset - 30)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setDayOffset(dayOffset + 30)}
                          disabled={dayOffset + 30 > 0}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={dailyStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="reservations" stroke="#8b5cf6" name="Réservations" />
                          <Line type="monotone" dataKey="couverts" stroke="#10b981" name="Couverts" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="week">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Affluence des 12 dernières semaines</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setWeekOffset(weekOffset - 12)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setWeekOffset(weekOffset + 12)}
                          disabled={weekOffset + 12 > 0}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={weeklyStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="reservations" fill="#8b5cf6" name="Réservations" />
                          <Bar dataKey="couverts" fill="#10b981" name="Couverts" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="month">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Affluence des 12 derniers mois</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setMonthOffset(monthOffset - 12)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setMonthOffset(monthOffset + 12)}
                          disabled={monthOffset + 12 > 0}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={monthlyStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="reservations" fill="#8b5cf6" name="Réservations" />
                          <Bar dataKey="couverts" fill="#10b981" name="Couverts" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SubscriptionGuard>
  );
}