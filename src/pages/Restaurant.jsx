import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  MapPin, Phone, Mail, Clock, ChevronLeft, Star, 
  ExternalLink, Sun, Moon, CheckCircle, AlertCircle, ChevronDown, Download, UtensilsCrossed, ChevronRight
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import StarRating from '@/components/ui/StarRating';
import BookingForm from '@/components/booking/BookingForm';
import ReviewForm from '@/components/reviews/ReviewForm';


const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// Custom marker icon
const customIcon = L.divIcon({
  html: `
    <div style="
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      border: 3px solid white;
    ">
      <svg style="
        width: 24px;
        height: 24px;
        transform: rotate(45deg);
      " viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
        <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" />
        <path d="m2.1 21.8 6.4-6.3" />
        <path d="m19 5-7 7" />
      </svg>
    </div>
  `,
  className: 'custom-marker',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48]
});

export default function RestaurantPage() {
  const params = new URLSearchParams(window.location.search);
  const restaurantId = params.get('id');
  const queryClient = useQueryClient();
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [showMobileBooking, setShowMobileBooking] = useState(false);
  
  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => {
      const results = await base44.entities.Restaurant.filter({ id: restaurantId });
      return results[0];
    },
    enabled: !!restaurantId,
    staleTime: 0,
    gcTime: 0
  });
  
  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules', restaurantId],
    queryFn: () => base44.entities.ServiceSchedule.filter({ restaurantId }),
    enabled: !!restaurantId,
    staleTime: 0,
    gcTime: 0
  });
  
  const { data: tables = [] } = useQuery({
    queryKey: ['tables', restaurantId],
    queryFn: () => base44.entities.Table.filter({ restaurantId }),
    enabled: !!restaurantId,
    staleTime: 0,
    gcTime: 0
  });
  
  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations', restaurantId],
    queryFn: () => base44.entities.Reservation.filter({ restaurantId }),
    enabled: !!restaurantId,
    staleTime: 0,
    gcTime: 0
  });
  
  const { data: tableBlocks = [] } = useQuery({
    queryKey: ['tableBlocks', restaurantId],
    queryFn: () => base44.entities.TableBlock.filter({ restaurantId }),
    enabled: !!restaurantId,
    staleTime: 0,
    gcTime: 0
  });
  
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', restaurantId],
    queryFn: () => base44.entities.Review.filter({ restaurantId }, '-created_date'),
    enabled: !!restaurantId,
    staleTime: 0,
    gcTime: 0
  });
  
  const createReservation = useMutation({
    mutationFn: (data) => {
      // Payload explicite pour la base : enregistrement et sync avec le backoffice restaurant
      return base44.entities.Reservation.create({
        restaurantId,
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        phone: data.phone ?? null,
        email: data.email || null,
        guestsCount: Number(data.guestsCount) || 2,
        serviceType: data.serviceType ?? 'MIDI',
        dateTimeStart: data.dateTimeStart,
        dateTimeEnd: data.dateTimeEnd ?? null,
        tableIds: Array.isArray(data.tableIds) ? data.tableIds : [],
        status: data.status ?? 'pending',
        reference: data.reference ?? null,
        comment: data.comment || null
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['reservations', restaurantId]);
      setBookingSuccess(data);
    },
    onError: (err) => {
      console.error('Erreur création réservation:', err);
    }
  });

  const createReview = useMutation({
    mutationFn: (data) => base44.entities.Review.create({
      ...data,
      restaurantId
    }),
    onSuccess: async () => {
      // Refresh reviews
      queryClient.invalidateQueries(['reviews', restaurantId]);
      
      // Recalculate restaurant rating
      const allReviews = await base44.entities.Review.filter({ restaurantId });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      await base44.entities.Restaurant.update(restaurantId, {
        ratingAvg: Math.round(avgRating * 10) / 10,
        ratingCount: allReviews.length
      });
      
      // Refresh restaurant data everywhere
      queryClient.invalidateQueries(['restaurant', restaurantId]);
      queryClient.invalidateQueries(['restaurants']);
    }
  });
  
  // Group schedules by day
  const schedulesByDay = DAYS.map((day, index) => {
    const daySchedules = schedules.filter(s => s.dayOfWeek === index);
    const midi = daySchedules.find(s => s.serviceType === 'MIDI');
    const soir = daySchedules.find(s => s.serviceType === 'SOIR');
    return { day, midi, soir };
  });
  
  // Résa en ligne disponible pour tous les restaurants dont le restaurateur a une offre active
  const isOnlineBookingEnabled =
    restaurant?.ownerHasActiveSubscription === true ||
    (restaurant?.ownerHasActiveSubscription == null && restaurant?.onlineBookingEnabled === true);
  
  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Skeleton className="h-80 w-full" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-1/2 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-60 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Restaurant non trouvé</h2>
          <Link to={createPageUrl('Home')}>
            <Button>Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 text-center">
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
              bookingSuccess.status === 'confirmed' ? 'bg-emerald-100' : 'bg-amber-100'
            }`}>
              {bookingSuccess.status === 'confirmed' ? (
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              ) : (
                <AlertCircle className="h-10 w-10 text-amber-600" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {bookingSuccess.status === 'confirmed' 
                ? 'Réservation confirmée !' 
                : 'Demande en attente'}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {bookingSuccess.status === 'confirmed'
                ? 'Votre table est réservée. Nous vous attendons !'
                : 'Votre demande a été transmise au restaurant. Vous serez contacté pour confirmation.'}
            </p>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Référence</span>
                  <p className="font-mono font-medium">{bookingSuccess.reference}</p>
                </div>
                <div>
                  <span className="text-gray-500">Restaurant</span>
                  <p className="font-medium">{restaurant.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Date</span>
                  <p className="font-medium">
                    {format(new Date(bookingSuccess.dateTimeStart), 'EEEE d MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Heure</span>
                  <p className="font-medium">
                    {format(new Date(bookingSuccess.dateTimeStart), 'HH:mm')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Service</span>
                  <p className="font-medium flex items-center gap-1">
                    {bookingSuccess.serviceType === 'MIDI' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {bookingSuccess.serviceType === 'MIDI' ? 'Midi' : 'Soir'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Couverts</span>
                  <p className="font-medium">{bookingSuccess.guestsCount} personne{bookingSuccess.guestsCount > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  const response = await base44.functions.invoke('generateReservationPDF', {
                    reservationId: bookingSuccess.id
                  });
                  
                  const blob = new Blob([response.data], { type: 'application/pdf' });
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `reservation-${bookingSuccess.reference}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  window.URL.revokeObjectURL(url);
                  link.remove();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
              <Link to={createPageUrl('Home')} className="w-full">
                <Button variant="outline" className="w-full">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </Link>
              <Button 
                className="w-full"
                onClick={() => setBookingSuccess(null)}
              >
                Nouvelle réservation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-64 sm:h-80 lg:h-96">
        <img
          src={restaurant.coverPhoto || restaurant.photos?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute top-4 left-4">
          <Link to={createPageUrl('Home')}>
            <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur-sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
          </Link>
        </div>
        
        <div className="absolute bottom-6 left-4 right-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              {restaurant.cuisineTags?.map((tag, i) => (
                <Badge key={i} className="bg-white/20 text-white backdrop-blur-sm border-0">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{restaurant.name}</h1>
            <div className="flex items-center gap-4 text-white/90">
              <StarRating rating={restaurant.ratingAvg || 0} count={restaurant.ratingCount || 0} />
              <span className="text-sm">{restaurant.city}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Booking Dialog */}
      <Dialog open={showMobileBooking} onOpenChange={setShowMobileBooking}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Réserver une table</DialogTitle>
          </DialogHeader>
          {isOnlineBookingEnabled ? (
            <BookingForm
              restaurant={restaurant}
              schedules={schedules}
              tables={tables}
              existingReservations={reservations}
              tableBlocks={tableBlocks}
              onSubmit={(data) => {
                createReservation.mutate(data);
                setShowMobileBooking(false);
              }}
              isLoading={createReservation.isPending}
            />
          ) : (
            <div className="text-center space-y-4 py-4">
              <h3 className="text-xl font-bold text-gray-900">{restaurant.name}</h3>
              <div className="inline-block bg-amber-50 border border-amber-200 rounded-full px-4 py-2">
                <p className="text-sm text-amber-800">😊 Désolé, ce restaurant ne fait pas encore partie de l'aventure RestoPonot</p>
              </div>
              <p className="text-sm text-gray-700">Appelez directement le restaurant pour réserver votre table !</p>
              <Button 
                className="w-full rounded-3xl"
                onClick={() => {
                  if (restaurant.phone) {
                    window.location.href = `tel:${restaurant.phone}`;
                  }
                }}
              >
                Contacter
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact & Address */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Adresse</p>
                      <p className="font-medium">{restaurant.address}</p>
                      <p className="text-gray-600">{restaurant.city}</p>
                    </div>
                  </div>
                  
                  {restaurant.phone && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Phone className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <a href={`tel:${restaurant.phone}`} className="font-medium hover:text-primary">
                          {restaurant.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {restaurant.email && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Mail className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <a href={`mailto:${restaurant.email}`} className="font-medium hover:text-primary">
                          {restaurant.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Map */}
                {restaurant.latitude && restaurant.longitude && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Localisation</p>
                    <div className="h-64 rounded-lg overflow-hidden border relative z-0">
                      <MapContainer
                        center={[restaurant.latitude, restaurant.longitude]}
                        zoom={15}
                        className="h-full w-full"
                        scrollWheelZoom={false}
                        zoomControl={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker 
                          position={[restaurant.latitude, restaurant.longitude]}
                          icon={customIcon}
                        >
                          <Popup>
                            <strong>{restaurant.name}</strong>
                            <br />
                            {restaurant.address}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Description */}
            {restaurant.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">À propos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{restaurant.description}</p>
                </CardContent>
              </Card>
            )}
            
            {/* Schedule */}
            <Collapsible>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <CardTitle className="text-lg flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Horaires
                      </div>
                      <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-3">
                      {schedulesByDay.map(({ day, midi, soir }) => (
                        <div key={day} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className="font-medium">{day}</span>
                          <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Sun className="h-4 w-4 text-orange-500" />
                              {midi?.isOpen ? (
                                <span>{midi.startTime} - {midi.endTime}</span>
                              ) : (
                                <span className="text-gray-400">Fermé</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Moon className="h-4 w-4 text-indigo-500" />
                              {soir?.isOpen ? (
                                <span>{soir.startTime} - {soir.endTime}</span>
                              ) : (
                                <span className="text-gray-400">Fermé</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
            
            {/* Reviews */}
            <Collapsible>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <CardTitle className="text-lg flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Avis ({reviews.length})
                      </div>
                      <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <Tabs defaultValue={reviews.length > 0 ? "list" : "add"} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="list">Voir les avis</TabsTrigger>
                        <TabsTrigger value="add">Laisser un avis</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="list">
                        {reviews.length > 0 ? (
                          <div className="space-y-4">
                            {reviews.slice(0, 10).map(review => (
                              <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{review.authorName}</span>
                                  <StarRating rating={review.rating} showCount={false} size="xs" />
                                </div>
                                {review.comment && (
                                  <p className="text-gray-600 text-sm">{review.comment}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <p>Aucun avis pour le moment.</p>
                            <p className="text-sm mt-2">Soyez le premier à donner votre avis !</p>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="add">
                        <ReviewForm
                          onSubmit={createReview.mutate}
                          isLoading={createReview.isPending}
                        />
                        {createReview.isSuccess && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                            ✓ Votre avis a été publié avec succès !
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
            
            {/* Photo Gallery */}
            {restaurant.photos?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Photos du restaurant</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {restaurant.photos.map((photo, i) => (
                      <div key={i} className="relative aspect-video rounded-lg overflow-hidden">
                        <img
                          src={photo}
                          alt={`${restaurant.name} - ${i + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Right Column - Booking - Desktop Only */}
          <div className="hidden lg:block space-y-6">
            <Card className="sticky top-4 rounded-3xl">
              {isOnlineBookingEnabled ? (
                <>
                  <CardHeader className="border-b">
                    <CardTitle className="text-xl">Réserver une table</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <BookingForm
                      restaurant={restaurant}
                      schedules={schedules}
                      tables={tables}
                      existingReservations={reservations}
                      tableBlocks={tableBlocks}
                      onSubmit={createReservation.mutate}
                      isLoading={createReservation.isPending}
                    />
                  </CardContent>
                </>
              ) : (
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">{restaurant.name}</h3>
                    <div className="inline-block bg-amber-50 border border-amber-200 rounded-full px-4 py-2">
                      <p className="text-sm text-amber-800">😊 Désolé, ce restaurant ne fait pas encore partie de l'aventure RestoPonot</p>
                    </div>
                    <p className="text-sm text-gray-700">Appelez directement le restaurant pour réserver votre table !</p>
                    <Button 
                      className="w-full rounded-3xl"
                      onClick={() => {
                        if (restaurant.phone) {
                          window.location.href = `tel:${restaurant.phone}`;
                        }
                      }}
                    >
                      Contacter
                    </Button>
                    
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <h4 className="text-base font-semibold text-gray-900 mb-1">Réservation en ligne</h4>
                        <p className="text-sm text-gray-500">Indisponible (peut-être bientôt 😉)</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
      
      {/* Mobile Floating Button */}
      <div className="lg:hidden sticky bottom-0 px-4 pb-6 pt-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
        <button
          onClick={() => setShowMobileBooking(true)}
          className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white text-base font-bold py-3.5 rounded-3xl shadow-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
        >
          Réserver maintenant
          <ChevronRight className="w-5 h-5" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}