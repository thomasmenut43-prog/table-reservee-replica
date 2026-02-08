import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Calendar, Clock, Users, MapPin, Phone, Mail, 
  CheckCircle, XCircle, AlertCircle, ChevronRight, ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/ui/StatusBadge';
import ServiceBadge from '@/components/ui/ServiceBadge';

export default function MyReservations() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['my-reservations', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allReservations = await base44.entities.Reservation.filter({ email: user.email }, '-dateTimeStart');
      return allReservations;
    },
    enabled: !!user?.email
  });

  const { data: restaurants = [] } = useQuery({
    queryKey: ['restaurants-list'],
    queryFn: () => base44.entities.Restaurant.list(),
    enabled: reservations.length > 0
  });

  const now = new Date();
  const upcomingReservations = reservations.filter(r => 
    new Date(r.dateTimeStart) >= now && r.status !== 'canceled'
  );
  const pastReservations = reservations.filter(r => 
    new Date(r.dateTimeStart) < now || r.status === 'canceled'
  );

  const getRestaurant = (restaurantId) => {
    return restaurants.find(r => r.id === restaurantId);
  };

  const ReservationCard = ({ reservation }) => {
    const restaurant = getRestaurant(reservation.restaurantId);
    const isPast = new Date(reservation.dateTimeStart) < now;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{restaurant?.name || 'Restaurant'}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                {restaurant?.city}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={reservation.status} />
              <ServiceBadge serviceType={reservation.serviceType} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{format(new Date(reservation.dateTimeStart), 'EEEE d MMMM yyyy', { locale: fr })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{format(new Date(reservation.dateTimeStart), 'HH:mm')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-gray-400" />
              <span>{reservation.guestsCount} personne{reservation.guestsCount > 1 ? 's' : ''}</span>
            </div>
            {reservation.reference && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Réf:</span>
                <span className="font-mono text-xs">{reservation.reference}</span>
              </div>
            )}
          </div>

          {reservation.comment && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <strong>Commentaire:</strong> {reservation.comment}
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{restaurant?.phone}</span>
                </div>
              </div>
              {!isPast && reservation.status === 'confirmed' && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Confirmée
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes réservations</h1>
          <p className="text-gray-600">Retrouvez toutes vos réservations passées et à venir</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation</h3>
            <p className="text-gray-500 mb-6">Vous n'avez pas encore effectué de réservation</p>
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
              <TabsTrigger value="upcoming">
                À venir ({upcomingReservations.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Passées ({pastReservations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingReservations.length > 0 ? (
                upcomingReservations.map(reservation => (
                  <ReservationCard key={reservation.id} reservation={reservation} />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Aucune réservation à venir</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastReservations.length > 0 ? (
                pastReservations.map(reservation => (
                  <ReservationCard key={reservation.id} reservation={reservation} />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Aucune réservation passée</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}