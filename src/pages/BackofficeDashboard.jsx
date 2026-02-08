import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/ThemeProvider';
import { format, startOfDay, endOfDay, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CalendarDays, Users, Sun, Moon, Clock, AlertTriangle, 
  Menu, Bell, TrendingUp, TrendingDown, UserX, MapPin, Ban, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Sidebar from '@/components/backoffice/Sidebar';
import StatsCard from '@/components/backoffice/StatsCard';
import ReservationRow from '@/components/backoffice/ReservationRow';
import StatusBadge from '@/components/ui/StatusBadge';
import ServiceBadge from '@/components/ui/ServiceBadge';
import SubscriptionGuard from '@/components/backoffice/SubscriptionGuard';
import RestaurantSelector from '@/components/backoffice/RestaurantSelector';
import DashboardTableMap from '@/components/backoffice/DashboardTableMap';

export default function BackofficeDashboard() {
  const [user, setUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [calendarDialog, setCalendarDialog] = useState({ open: false, table: null });
  const [selectedFloorPlan, setSelectedFloorPlan] = useState(null);
  const queryClient = useQueryClient();
  const { isDark } = useTheme() || { isDark: false };
  
  // Get restaurantId from URL parameter or user data
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantIdFromUrl = urlParams.get('restaurantId');
  
  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);
  
  const restaurantId = restaurantIdFromUrl || user?.restaurantId;
  
  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ['my-restaurant', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;
      const results = await base44.entities.Restaurant.filter({ id: restaurantId });
      return results[0];
    },
    enabled: !!restaurantId
  });
  
  const { data: floorPlans = [] } = useQuery({
    queryKey: ['floor-plans', restaurantId],
    queryFn: () => base44.entities.FloorPlan.filter({ restaurantId }),
    enabled: !!restaurantId
  });

  // Auto-select default floor plan
  useEffect(() => {
    if (floorPlans.length > 0 && !selectedFloorPlan) {
      const defaultPlan = floorPlans.find(p => p.isDefault) || floorPlans[0];
      setSelectedFloorPlan(defaultPlan.id);
    }
  }, [floorPlans, selectedFloorPlan]);
  
  const { data: reservations = [], isLoading: loadingReservations } = useQuery({
    queryKey: ['reservations', restaurantId],
    queryFn: () => base44.entities.Reservation.filter({ restaurantId }, '-dateTimeStart'),
    enabled: !!restaurantId
  });
  
  const { data: tables = [] } = useQuery({
    queryKey: ['tables', restaurantId, selectedFloorPlan],
    queryFn: () => base44.entities.Table.filter({ restaurantId, floorPlanId: selectedFloorPlan }),
    enabled: !!restaurantId && !!selectedFloorPlan
  });

  const { data: mapObjects = [] } = useQuery({
    queryKey: ['map-objects', restaurantId, selectedFloorPlan],
    queryFn: () => base44.entities.MapObject.filter({ restaurantId, floorPlanId: selectedFloorPlan }),
    enabled: !!restaurantId && !!selectedFloorPlan
  });
  
  const { data: waitlist = [] } = useQuery({
    queryKey: ['waitlist', restaurantId],
    queryFn: () => base44.entities.WaitlistRequest.filter({ restaurantId, status: 'open' }),
    enabled: !!restaurantId
  });

  const { data: currentBlocks = [] } = useQuery({
    queryKey: ['current-blocks', restaurantId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const blocks = await base44.entities.TableBlock.filter({ restaurantId });
      return blocks.filter(b => new Date(b.endDateTime) > new Date(now));
    },
    enabled: !!restaurantId
  });

  // Real-time sync for table blocks
  useEffect(() => {
    if (!restaurantId) return;
    
    const unsubscribe = base44.entities.TableBlock.subscribe(() => {
      queryClient.invalidateQueries(['current-blocks', restaurantId]);
    });
    
    return unsubscribe;
  }, [restaurantId, queryClient]);
  
  // Stats calculations
  const todayReservations = useMemo(() => {
    const today = new Date();
    return reservations.filter(r => {
      const date = new Date(r.dateTimeStart);
      return isToday(date) && r.status !== 'canceled';
    });
  }, [reservations]);
  
  const midiReservations = todayReservations.filter(r => r.serviceType === 'MIDI');
  const soirReservations = todayReservations.filter(r => r.serviceType === 'SOIR');
  const midiCovers = midiReservations.reduce((sum, r) => sum + r.guestsCount, 0);
  const soirCovers = soirReservations.reduce((sum, r) => sum + r.guestsCount, 0);
  
  const pendingReservations = reservations.filter(r => r.status === 'pending');
  const upcomingReservations = reservations
    .filter(r => new Date(r.dateTimeStart) > new Date() && r.status !== 'canceled')
    .slice(0, 5);
  
  // Calculate occupancy - including blocked tables for today
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  
  // Define service time periods for today
  const midiStart = new Date(todayStart);
  midiStart.setHours(0, 0, 0, 0);
  const midiEnd = new Date(todayStart);
  midiEnd.setHours(16, 0, 0, 0);
  
  const soirStart = new Date(todayStart);
  soirStart.setHours(16, 0, 0, 0);
  const soirEnd = new Date(todayEnd);
  soirEnd.setHours(23, 59, 59, 999);
  
  // Count blocked tables capacity for each service
  const midiBlockedCapacity = currentBlocks
    .filter(b => {
      const blockStart = new Date(b.startDateTime);
      const blockEnd = new Date(b.endDateTime);
      // Check if block overlaps with midi period and is today
      return isToday(blockStart) && blockStart < midiEnd;
    })
    .reduce((sum, b) => {
      const table = tables.find(t => t.id === b.tableId);
      return sum + (table?.capacity || 0);
    }, 0);
  
  const soirBlockedCapacity = currentBlocks
    .filter(b => {
      const blockStart = new Date(b.startDateTime);
      const blockEnd = new Date(b.endDateTime);
      // Check if block overlaps with soir period and is today
      return isToday(blockStart) && blockStart >= soirStart;
    })
    .reduce((sum, b) => {
      const table = tables.find(t => t.id === b.tableId);
      return sum + (table?.capacity || 0);
    }, 0);
  
  const totalCapacity = tables.filter(t => t.status === 'available').reduce((sum, t) => sum + (t.seats || t.capacity || 0), 0);
  const midiOccupancy = totalCapacity > 0 ? Math.round(((midiCovers + midiBlockedCapacity) / totalCapacity) * 100) : 0;
  const soirOccupancy = totalCapacity > 0 ? Math.round(((soirCovers + soirBlockedCapacity) / totalCapacity) * 100) : 0;

  const isTableBlocked = (tableId) => {
    return currentBlocks.some(b => b.tableId === tableId);
  };
  
  // Calculate real-time table occupancy
  const now = new Date();
  const occupiedTables = tables.filter(t => {
    if (!t.isActive) return false;
    // Check if table is blocked
    if (isTableBlocked(t.id)) return true;
    // Check if table has a current reservation
    return reservations.some(r => 
      r.tableIds?.includes(t.id) && 
      r.status === 'confirmed' &&
      new Date(r.dateTimeStart) <= now && 
      new Date(r.dateTimeEnd) >= now
    );
  }).length;
  const totalActiveTables = tables.filter(t => t.isActive).length;
  const tableOccupancyRate = totalActiveTables > 0 ? Math.round((occupiedTables / totalActiveTables) * 100) : 0;

  const getTableBlock = (tableId) => {
    return currentBlocks.find(b => b.tableId === tableId);
  };

  const getTableUpcomingReservations = (tableId) => {
    const now = new Date();
    return reservations
      .filter(r => 
        r.tableIds?.includes(tableId) && 
        new Date(r.dateTimeStart) > now && 
        r.status !== 'canceled'
      )
      .sort((a, b) => new Date(a.dateTimeStart) - new Date(b.dateTimeStart))
      .slice(0, 3);
  };

  const blockTableMutation = useMutation({
    mutationFn: ({ tableId, service, soirService }) => {
      const today = new Date();
      let startDateTime, endDateTime;
      
      if (service === 'MIDI') {
        startDateTime = new Date(today.setHours(0, 0, 0, 0));
        endDateTime = new Date(today.setHours(16, 0, 0, 0));
      } else {
        if (soirService === 1) {
          startDateTime = new Date(today.setHours(18, 0, 0, 0));
          endDateTime = new Date(today.setHours(21, 0, 0, 0));
        } else {
          startDateTime = new Date(today.setHours(21, 0, 0, 0));
          endDateTime = new Date(today.setHours(23, 59, 59, 999));
        }
      }
      
      return base44.entities.TableBlock.create({
        restaurantId,
        tableId,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        reason: `Table occupée - Service ${service === 'MIDI' ? 'Midi' : `Soir ${soirService}`}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['current-blocks', restaurantId]);
    }
  });

  const unblockTableMutation = useMutation({
    mutationFn: (blockId) => base44.entities.TableBlock.delete(blockId),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-blocks', restaurantId]);
    }
  });
  
  if (!user) {
    return null;
  }
  
  const isAdmin = user.role === 'admin';
  
  if (!restaurantId && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès non autorisé</h2>
          <p className="text-gray-500">Vous n'êtes pas associé à un restaurant.</p>
        </div>
      </div>
    );
  }
  
  if (!restaurantId && isAdmin) {
    return <RestaurantSelector onSelect={(id) => window.location.href = `?restaurantId=${id}`} />;
  }


  
  const isSubscribed = user.subscriptionStatus === 'active' && 
    user.subscriptionEndDate && 
    new Date(user.subscriptionEndDate) > new Date();

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
        {/* Header */}
        <header className={`${isDark ? 'dark bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-30`}>
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
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {pendingReservations.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  <Bell className="h-3 w-3 mr-1" />
                  {pendingReservations.length} en attente
                </Badge>
              )}
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className={`p-4 lg:p-8 ${isDark ? 'dark bg-slate-950' : ''}`}>
          {/* Stats Cards */}
          <SubscriptionGuard user={user}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Réservations aujourd'hui"
              value={todayReservations.length}
              subtitle={`${midiReservations.length} midi • ${soirReservations.length} soir`}
              icon={CalendarDays}
              color="primary"
            />
            <StatsCard
              title="Couverts midi"
              value={midiCovers}
              subtitle={`${midiOccupancy}% d'occupation`}
              icon={Sun}
              color="amber"
            />
            <StatsCard
              title="Couverts soir"
              value={soirCovers}
              subtitle={`${soirOccupancy}% d'occupation`}
              icon={Moon}
              color="purple"
            />
            <StatsCard
              title="Liste d'attente"
              value={waitlist.length}
              subtitle="demandes en cours"
              icon={Clock}
              color="blue"
            />
            </div>
          </SubscriptionGuard>

          {/* Tables Management - Visual Map */}
          <SubscriptionGuard user={user}>
            <Card className="mb-8">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Plan des tables
                  </CardTitle>
                  {floorPlans.length > 0 && (
                    <Select value={selectedFloorPlan} onValueChange={setSelectedFloorPlan}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Sélectionner un plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {floorPlans.map(plan => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <DashboardTableMap
                  tables={tables}
                  mapObjects={mapObjects}
                  currentBlocks={currentBlocks}
                  todayReservations={todayReservations}
                  onBlockTable={(table, service, soirService) => blockTableMutation.mutate({ tableId: table.id, service, soirService })}
                  onUnblockTable={(blockId) => unblockTableMutation.mutate(blockId)}
                />
              </CardContent>
            </Card>
          </SubscriptionGuard>
          
          {/* Alerts */}
          <SubscriptionGuard user={user}>
          {(pendingReservations.length > 0 || waitlist.length > 0) && (
            <div className="mb-8 space-y-3">
              {pendingReservations.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900">
                      {pendingReservations.length} réservation{pendingReservations.length > 1 ? 's' : ''} en attente de confirmation
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white">
                    Voir
                  </Button>
                </div>
              )}
              
              {waitlist.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">
                      {waitlist.length} demande{waitlist.length > 1 ? 's' : ''} sur la liste d'attente
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white">
                    Voir
                  </Button>
                </div>
              )}
            </div>
          )}
          </SubscriptionGuard>
          
          {/* Today's Reservations */}
          <SubscriptionGuard user={user}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Midi */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-orange-500" />
                  Service Midi
                  <Badge variant="secondary">{midiReservations.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {midiReservations.length > 0 ? (
                  <div className="space-y-3">
                    {midiReservations.map(res => (
                      <ReservationRow 
                        key={res.id} 
                        reservation={res} 
                        tables={tables}
                        onStatusChange={() => {}}
                        onEdit={() => {}}
                        onTableChange={() => {}}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucune réservation pour le midi
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Soir */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-indigo-500" />
                  Service Soir
                  <Badge variant="secondary">{soirReservations.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {soirReservations.length > 0 ? (
                  <div className="space-y-3">
                    {soirReservations.map(res => (
                      <ReservationRow 
                        key={res.id} 
                        reservation={res} 
                        tables={tables}
                        onStatusChange={() => {}}
                        onEdit={() => {}}
                        onTableChange={() => {}}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucune réservation pour le soir
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          </SubscriptionGuard>
          
          {/* Daily Occupancy by Service */}
          <SubscriptionGuard user={user}>
            <Card className="mb-8 mt-8">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Taux d'occupation journalière</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Midi */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sun className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">Service Midi</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{midiOccupancy}%</span>
                    </div>
                    <Progress value={midiOccupancy} className="h-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {midiCovers + midiBlockedCapacity} / {totalCapacity} couverts
                      </span>
                      <span className={`font-medium ${
                        midiOccupancy >= 80 ? 'text-red-600' : 
                        midiOccupancy >= 50 ? 'text-orange-600' : 
                        'text-green-600'
                      }`}>
                        {midiOccupancy >= 80 ? 'Complet' : 
                         midiOccupancy >= 50 ? 'Moyen' : 
                         'Disponible'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Soir */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Moon className="h-5 w-5 text-indigo-500" />
                        <span className="font-medium">Service Soir</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{soirOccupancy}%</span>
                    </div>
                    <Progress value={soirOccupancy} className="h-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {soirCovers + soirBlockedCapacity} / {totalCapacity} couverts
                      </span>
                      <span className={`font-medium ${
                        soirOccupancy >= 80 ? 'text-red-600' : 
                        soirOccupancy >= 50 ? 'text-orange-600' : 
                        'text-green-600'
                      }`}>
                        {soirOccupancy >= 80 ? 'Complet' : 
                         soirOccupancy >= 50 ? 'Moyen' : 
                         'Disponible'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SubscriptionGuard>

          {/* Upcoming Reservations */}
          <SubscriptionGuard user={user}>
            <Card className="mt-8">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Prochaines réservations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {upcomingReservations.length > 0 ? (
                <div className="space-y-3">
                  {upcomingReservations.map(res => (
                    <div key={res.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{res.firstName} {res.lastName}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(res.dateTimeStart), 'EEEE d MMMM à HH:mm', { locale: fr })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{res.guestsCount} pers.</Badge>
                          {res.serviceType === 'MIDI' ? (
                            <Sun className="h-4 w-4 text-orange-500" />
                          ) : (
                            <Moon className="h-4 w-4 text-indigo-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune réservation à venir
                </div>
              )}
            </CardContent>
          </Card>
          </SubscriptionGuard>
        </main>
      </div>



      {/* Calendar Dialog */}
      <Dialog open={calendarDialog.open} onOpenChange={(open) => setCalendarDialog({ open, table: null })}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Réservations à venir - Table {calendarDialog.table?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {calendarDialog.table && (() => {
              const allUpcoming = reservations
                .filter(r => 
                  r.tableIds?.includes(calendarDialog.table.id) && 
                  new Date(r.dateTimeStart) > new Date() && 
                  r.status !== 'canceled'
                )
                .sort((a, b) => new Date(a.dateTimeStart) - new Date(b.dateTimeStart));
              
              return allUpcoming.length > 0 ? (
                allUpcoming.map(res => (
                  <div key={res.id} className="p-4 bg-gray-50 rounded-xl border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{res.firstName} {res.lastName}</h4>
                          <StatusBadge status={res.status} />
                          <ServiceBadge serviceType={res.serviceType} size="sm" />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            {format(new Date(res.dateTimeStart), 'EEEE d MMMM', { locale: fr })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(res.dateTimeStart), 'HH:mm')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {res.guestsCount} pers.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune réservation à venir pour cette table
                </div>
              );
            })()}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setCalendarDialog({ open: false, table: null })}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}