import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, startOfDay, endOfDay, addDays, isWithinInterval, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CalendarDays, Search, Filter, Download, Plus, Menu,
  Sun, Moon, ChevronLeft, ChevronRight, UserPlus
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import Sidebar from '@/components/backoffice/Sidebar';
import ReservationRow from '@/components/backoffice/ReservationRow';
import SubscriptionGuard from '@/components/backoffice/SubscriptionGuard';
import ReservationCalendar from '@/components/backoffice/ReservationCalendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

// Créneaux horaires par service (tranches de 15 min) : midi 12h-14h, soir 19h-21h30
const MIDI_SLOTS = ['12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45', '14:00'];
const SOIR_SLOTS = ['19:00', '19:15', '19:30', '19:45', '20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30'];
const getTimeSlotsForService = (serviceType) =>
  serviceType === 'SOIR' ? SOIR_SLOTS : MIDI_SLOTS;

export default function BackofficeReservations() {
  const [user, setUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [createDialog, setCreateDialog] = useState(false);
  const [newReservation, setNewReservation] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '12:00',
    serviceType: 'MIDI',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    guestsCount: 2,
    comment: '',
    status: 'confirmed',
    tableIds: []
  });
  const queryClient = useQueryClient();
  
  useEffect(() => {
    base44.auth.me().then(setUser);
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
  
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations', restaurantId],
    queryFn: () => base44.entities.Reservation.filter({ restaurantId }, '-dateTimeStart'),
    enabled: !!restaurantId
  });

  // Synchronisation temps réel : nouvelles réservations clients visibles immédiatement
  useEffect(() => {
    if (!restaurantId) return;
    const unsubscribe = base44.entities.Reservation.subscribe(() => {
      queryClient.invalidateQueries(['reservations', restaurantId]);
    });
    return unsubscribe;
  }, [restaurantId, queryClient]);
  
  const { data: tables = [] } = useQuery({
    queryKey: ['tables', restaurantId],
    queryFn: () => base44.entities.Table.filter({ restaurantId }),
    enabled: !!restaurantId
  });
  
  const updateReservation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Reservation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['reservations', restaurantId]);
    },
    onError: (err) => toast.error(err?.message || 'Impossible d\'enregistrer la réservation')
  });
  
  const deleteReservation = useMutation({
    mutationFn: (id) => base44.entities.Reservation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['reservations', restaurantId]);
    },
    onError: (err) => toast.error(err?.message || 'Impossible de supprimer')
  });

  const createReservation = useMutation({
    mutationFn: async (data) => {
      const dateTime = new Date(`${data.date}T${data.time}`);
      const endDateTime = new Date(dateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + (restaurant?.mealDurationMinutes || 90));
      
      const reference = `M${Date.now().toString().slice(-8)}`;
      
      return base44.entities.Reservation.create({
        restaurantId,
        serviceType: data.serviceType,
        dateTimeStart: dateTime.toISOString(),
        dateTimeEnd: endDateTime.toISOString(),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email || null,
        guestsCount: parseInt(data.guestsCount),
        comment: data.comment || null,
        status: data.status,
        reference,
        tableIds: data.tableIds || []
      });
    },
    onSuccess: async (createdReservation) => {
      queryClient.invalidateQueries(['reservations', restaurantId]);
      await createAuditLog('create', createdReservation.id, { manual: true });
      setCreateDialog(false);
      setNewReservation({
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '12:00',
        serviceType: 'MIDI',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        guestsCount: 2,
        comment: '',
        status: 'confirmed',
        tableIds: []
      });
    },
    onError: (err) => toast.error(err?.message || 'Impossible de créer la réservation')
  });
  
  const handleTableChange = async (reservationId, newTableIds) => {
    const reservation = reservations.find(r => r.id === reservationId);
    await updateReservation.mutateAsync({ 
      id: reservationId, 
      data: { tableIds: newTableIds } 
    });
    await createAuditLog(
      'move',
      reservationId,
      { previousTables: reservation.tableIds, newTables: newTableIds }
    );
  };
  
  const createAuditLog = async (actionType, entityId, details) => {
    await base44.entities.AuditLog.create({
      restaurantId,
      actorEmail: user.email,
      actorName: user.full_name,
      actionType,
      entityType: 'reservation',
      entityId,
      details: JSON.stringify(details)
    });
  };
  
  const handleStatusChange = async (id, newStatus) => {
    const reservation = reservations.find(r => r.id === id);
    await updateReservation.mutateAsync({ id, data: { status: newStatus } });
    await createAuditLog(
      newStatus === 'confirmed' ? 'confirm' : newStatus === 'canceled' ? 'cancel' : newStatus,
      id,
      { previousStatus: reservation.status, newStatus }
    );
  };
  
  // Filter reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      // Date filter
      const resDate = new Date(r.dateTimeStart);
      if (!isWithinInterval(resDate, { 
        start: startOfDay(selectedDate), 
        end: endOfDay(selectedDate) 
      })) {
        return false;
      }
      
      // Service filter
      if (serviceFilter !== 'all' && r.serviceType !== serviceFilter) return false;
      
      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!r.firstName?.toLowerCase().includes(query) &&
            !r.lastName?.toLowerCase().includes(query) &&
            !r.phone?.includes(query) &&
            !r.email?.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      return true;
    });
  }, [reservations, selectedDate, serviceFilter, statusFilter, searchQuery]);
  
  // Export CSV
  const exportCSV = () => {
    const headers = ['Date', 'Heure', 'Service', 'Nom', 'Prénom', 'Téléphone', 'Email', 'Couverts', 'Statut', 'Tables', 'Commentaire'];
    const rows = filteredReservations.map(r => [
      format(new Date(r.dateTimeStart), 'dd/MM/yyyy'),
      format(new Date(r.dateTimeStart), 'HH:mm'),
      r.serviceType,
      r.lastName,
      r.firstName,
      r.phone,
      r.email || '',
      r.guestsCount,
      r.status,
      tables.filter(t => r.tableIds?.includes(t.id)).map(t => t.name).join(' + '),
      r.comment || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reservations_${format(selectedDate, 'yyyy-MM-dd')}.csv`;
    link.click();
  };
  
  const goToDate = (days) => {
    setSelectedDate(addDays(selectedDate, days));
  };
  
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
    const RestaurantSelector = React.lazy(() => import('@/components/backoffice/RestaurantSelector'));
    return (
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Chargement...</p></div>}>
        <RestaurantSelector onSelect={(id) => window.location.href = `?restaurantId=${id}`} />
      </React.Suspense>
    );
  }
  
  const isSubscribed = user?.subscriptionStatus === 'active' && 
    user?.subscriptionEndDate && 
    new Date(user.subscriptionEndDate) > new Date();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        user={user} 
        restaurant={restaurant}
        isAdmin={false}
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
              <h1 className="text-xl font-bold text-gray-900">Réservations</h1>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setCreateDialog(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Nouvelle réservation
              </Button>
              <Button onClick={exportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="p-4 lg:p-8">
          <SubscriptionGuard user={user}>
             {/* Filters */}
             <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Date Navigation */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => goToDate(-1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="min-w-[200px]">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="icon" onClick={() => goToDate(1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Aujourd'hui
                    </Button>
                  </div>
                  
                  {/* Other Filters */}
                  <div className="flex flex-1 flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={serviceFilter} onValueChange={setServiceFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous services</SelectItem>
                        <SelectItem value="MIDI">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4 text-orange-500" />
                            Midi
                          </div>
                        </SelectItem>
                        <SelectItem value="SOIR">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4 text-indigo-500" />
                            Soir
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="confirmed">Confirmée</SelectItem>
                        <SelectItem value="canceled">Annulée</SelectItem>
                        <SelectItem value="no_show">No-show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Stats for the day */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{filteredReservations.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-sm text-gray-500">Couverts</p>
              <p className="text-2xl font-bold">
                {filteredReservations.reduce((sum, r) => sum + r.guestsCount, 0)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-sm text-gray-500">Midi</p>
              <p className="text-2xl font-bold text-orange-600">
                {filteredReservations.filter(r => r.serviceType === 'MIDI').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-sm text-gray-500">Soir</p>
              <p className="text-2xl font-bold text-indigo-600">
                {filteredReservations.filter(r => r.serviceType === 'SOIR').length}
              </p>
            </div>
            </div>
            
            {/* Reservations List */}
             <Card>
             <CardContent className="p-4">
               {filteredReservations.length > 0 ? (
                 <div className="space-y-3">
                   {filteredReservations.map(res => (
                     <ReservationRow
                       key={res.id}
                       reservation={res}
                       tables={tables}
                       onStatusChange={handleStatusChange}
                       onEdit={() => {}}
                       onTableChange={handleTableChange}
                       onDelete={(id) => deleteReservation.mutate(id)}
                     />
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-12">
                   <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                   <p className="text-gray-500">Aucune réservation pour cette date</p>
                 </div>
               )}
             </CardContent>
             </Card>

             {/* Calendar */}
             <ReservationCalendar 
               reservations={reservations}
               selectedDate={selectedDate}
               onSelectDate={setSelectedDate}
               onMonthChange={(offset) => setCurrentMonth(addMonths(currentMonth, offset))}
               currentMonth={currentMonth}
             />
            </SubscriptionGuard>
        </main>
      </div>

      {/* Create Reservation Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une réservation manuelle</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newReservation.date}
                  onChange={(e) => setNewReservation({...newReservation, date: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">Heure *</Label>
                <Select
                  value={newReservation.time}
                  onValueChange={(value) => setNewReservation({ ...newReservation, time: value })}
                >
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Choisir l'heure" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTimeSlotsForService(newReservation.serviceType).map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Service */}
            <div>
              <Label>Service *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  type="button"
                  variant={newReservation.serviceType === 'MIDI' ? 'default' : 'outline'}
                  onClick={() => {
                    const slots = MIDI_SLOTS;
                    const time = slots.includes(newReservation.time) ? newReservation.time : slots[0];
                    setNewReservation({ ...newReservation, serviceType: 'MIDI', time });
                  }}
                  className="justify-start"
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Midi
                </Button>
                <Button
                  type="button"
                  variant={newReservation.serviceType === 'SOIR' ? 'default' : 'outline'}
                  onClick={() => {
                    const slots = SOIR_SLOTS;
                    const time = slots.includes(newReservation.time) ? newReservation.time : slots[0];
                    setNewReservation({ ...newReservation, serviceType: 'SOIR', time });
                  }}
                  className="justify-start"
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Soir
                </Button>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={newReservation.firstName}
                  onChange={(e) => setNewReservation({...newReservation, firstName: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={newReservation.lastName}
                  onChange={(e) => setNewReservation({...newReservation, lastName: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newReservation.phone}
                  onChange={(e) => setNewReservation({...newReservation, phone: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newReservation.email}
                  onChange={(e) => setNewReservation({...newReservation, email: e.target.value})}
                />
              </div>
            </div>

            {/* Guests & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guestsCount">Nombre de personnes *</Label>
                <Input
                  id="guestsCount"
                  type="number"
                  min="1"
                  max="50"
                  value={newReservation.guestsCount}
                  onChange={(e) => setNewReservation({...newReservation, guestsCount: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Statut *</Label>
                <Select 
                  value={newReservation.status} 
                  onValueChange={(value) => setNewReservation({...newReservation, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmée</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Comment */}
            <div>
              <Label htmlFor="comment">Commentaire</Label>
              <Textarea
                id="comment"
                value={newReservation.comment}
                onChange={(e) => setNewReservation({...newReservation, comment: e.target.value})}
                rows={3}
                placeholder="Allergies, demandes particulières..."
              />
            </div>

            {/* Table Selection */}
            <div>
              <Label>Tables assignées (optionnel)</Label>
              <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                {tables.length > 0 ? (
                  tables.map(table => (
                    <div key={table.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`table-${table.id}`}
                        checked={newReservation.tableIds.includes(table.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewReservation({
                              ...newReservation,
                              tableIds: [...newReservation.tableIds, table.id]
                            });
                          } else {
                            setNewReservation({
                              ...newReservation,
                              tableIds: newReservation.tableIds.filter(id => id !== table.id)
                            });
                          }
                        }}
                      />
                      <label
                        htmlFor={`table-${table.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {table.name} ({table.seats} places) - {table.zone}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Aucune table disponible</p>
                )}
              </div>
              {newReservation.tableIds.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {newReservation.tableIds.length} table(s) sélectionnée(s)
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setCreateDialog(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={() => createReservation.mutate(newReservation)}
              disabled={!newReservation.firstName || !newReservation.lastName || !newReservation.phone || createReservation.isPending}
            >
              {createReservation.isPending ? 'Création...' : 'Créer la réservation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}