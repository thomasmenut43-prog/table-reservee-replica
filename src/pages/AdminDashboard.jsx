import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, isToday, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Building2, Users, CalendarDays, Sun, Moon, Menu, TrendingUp, 
  AlertTriangle, UserX, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Sidebar from '@/components/backoffice/Sidebar';
import StatsCard from '@/components/backoffice/StatsCard';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);
  
  const isAdmin = user?.role === 'admin';
  
  const { data: restaurants = [] } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
    enabled: isAdmin,
    staleTime: 0,
    gcTime: 0
  });
  
  const { data: reservations = [] } = useQuery({
    queryKey: ['all-reservations'],
    queryFn: () => base44.entities.Reservation.list('-dateTimeStart', 1000),
    enabled: isAdmin,
    staleTime: 0,
    gcTime: 0
  });
  
  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
    staleTime: 0,
    gcTime: 0
  });
  
  const { data: waitlist = [] } = useQuery({
    queryKey: ['all-waitlist'],
    queryFn: () => base44.entities.WaitlistRequest.filter({ status: 'open' }),
    enabled: isAdmin,
    staleTime: 0,
    gcTime: 0
  });
  
  // Stats
  const todayReservations = reservations.filter(r => isToday(new Date(r.dateTimeStart)) && r.status !== 'canceled');
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const monthReservations = reservations.filter(r => {
    const date = new Date(r.dateTimeStart);
    return isWithinInterval(date, { start: monthStart, end: monthEnd }) && r.status !== 'canceled';
  });
  
  const todayCovers = todayReservations.reduce((sum, r) => sum + r.guestsCount, 0);
  const monthCovers = monthReservations.reduce((sum, r) => sum + r.guestsCount, 0);
  const noShowCount = reservations.filter(r => r.status === 'no_show').length;
  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  
  const midiCoversToday = todayReservations.filter(r => r.serviceType === 'MIDI').reduce((sum, r) => sum + r.guestsCount, 0);
  const soirCoversToday = todayReservations.filter(r => r.serviceType === 'SOIR').reduce((sum, r) => sum + r.guestsCount, 0);
  
  // Top restaurants
  const restaurantStats = useMemo(() => {
    return restaurants.map(restaurant => {
      const resaCount = monthReservations.filter(r => r.restaurantId === restaurant.id).length;
      const covers = monthReservations.filter(r => r.restaurantId === restaurant.id)
        .reduce((sum, r) => sum + r.guestsCount, 0);
      return { ...restaurant, resaCount, covers };
    }).sort((a, b) => b.covers - a.covers);
  }, [restaurants, monthReservations]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès non autorisé</h2>
          <p className="text-gray-500">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        user={user} 
        isAdmin={true}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-30">
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
              <div>
                <h1 className="text-xl font-bold text-gray-900">Vue d'ensemble</h1>
                <p className="text-sm text-gray-500">
                  {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="p-4 lg:p-8">
          {/* Global Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Restaurants actifs"
              value={restaurants.filter(r => r.isActive).length}
              subtitle={`${restaurants.length} au total`}
              icon={Building2}
              color="primary"
            />
            <StatsCard
              title="Réservations aujourd'hui"
              value={todayReservations.length}
              subtitle={`${todayCovers} couverts`}
              icon={CalendarDays}
              color="emerald"
            />
            <StatsCard
              title="Couverts ce mois"
              value={monthCovers}
              subtitle={`${monthReservations.length} réservations`}
              icon={Users}
              color="blue"
            />
            <StatsCard
              title="No-shows"
              value={noShowCount}
              subtitle="ce mois"
              icon={UserX}
              color="red"
            />
          </div>
          
          {/* Today's Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-orange-500" />
                  Midi aujourd'hui
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-orange-600 mb-2">{midiCoversToday}</div>
                <p className="text-gray-500">couverts</p>
                <p className="text-sm text-gray-400 mt-2">
                  {todayReservations.filter(r => r.serviceType === 'MIDI').length} réservations
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-indigo-500" />
                  Soir aujourd'hui
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-indigo-600 mb-2">{soirCoversToday}</div>
                <p className="text-gray-500">couverts</p>
                <p className="text-sm text-gray-400 mt-2">
                  {todayReservations.filter(r => r.serviceType === 'SOIR').length} réservations
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Alerts */}
          {(pendingCount > 0 || waitlist.length > 0) && (
            <div className="mb-8 space-y-3">
              {pendingCount > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900">
                      {pendingCount} réservation{pendingCount > 1 ? 's' : ''} en attente de confirmation
                    </p>
                  </div>
                </div>
              )}
              
              {waitlist.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">
                      {waitlist.length} demande{waitlist.length > 1 ? 's' : ''} en liste d'attente
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Top Restaurants */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top restaurants ce mois
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {restaurantStats.slice(0, 10).map((restaurant, index) => (
                  <div key={restaurant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-sm text-gray-500">{restaurant.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{restaurant.covers} couverts</p>
                      <p className="text-sm text-gray-500">{restaurant.resaCount} résa</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}