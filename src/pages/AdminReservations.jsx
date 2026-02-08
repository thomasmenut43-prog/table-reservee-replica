import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, startOfDay, endOfDay, addDays, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CalendarDays, Search, Download, Menu, Building2,
  Sun, Moon, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import Sidebar from '@/components/backoffice/Sidebar';
import ReservationRow from '@/components/backoffice/ReservationRow';

export default function AdminReservations() {
  const [user, setUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  
  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);
  
  const isAdmin = user?.role === 'admin';
  
  const { data: restaurants = [] } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
    enabled: isAdmin
  });
  
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['all-reservations'],
    queryFn: () => base44.entities.Reservation.list('-dateTimeStart', 2000),
    enabled: isAdmin
  });
  
  const { data: tables = [] } = useQuery({
    queryKey: ['all-tables'],
    queryFn: () => base44.entities.Table.list(),
    enabled: isAdmin
  });
  
  const updateReservation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Reservation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-reservations']);
    }
  });
  
  const handleStatusChange = async (id, newStatus) => {
    await updateReservation.mutateAsync({ id, data: { status: newStatus } });
  };
  
  // Filter reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      // Exclude canceled reservations by default (unless specifically filtering for them)
      if (statusFilter === 'all' && r.status === 'canceled') return false;
      
      // Date filter
      const resDate = new Date(r.dateTimeStart);
      if (!isWithinInterval(resDate, { 
        start: startOfDay(selectedDate), 
        end: endOfDay(selectedDate) 
      })) {
        return false;
      }
      
      // Restaurant filter
      if (restaurantFilter !== 'all' && r.restaurantId !== restaurantFilter) return false;
      
      // Service filter
      if (serviceFilter !== 'all' && r.serviceType !== serviceFilter) return false;
      
      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!r.firstName?.toLowerCase().includes(query) &&
            !r.lastName?.toLowerCase().includes(query) &&
            !r.phone?.includes(query)) {
          return false;
        }
      }
      
      return true;
    });
  }, [reservations, selectedDate, restaurantFilter, serviceFilter, statusFilter, searchQuery]);
  
  // Get restaurant name
  const getRestaurantName = (restaurantId) => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    return restaurant?.name || 'Inconnu';
  };
  
  // Get tables for restaurant
  const getTablesForRestaurant = (restaurantId) => {
    return tables.filter(t => t.restaurantId === restaurantId);
  };
  
  // Export CSV
  const exportCSV = () => {
    const headers = ['Restaurant', 'Date', 'Heure', 'Service', 'Nom', 'Prénom', 'Téléphone', 'Couverts', 'Statut'];
    const rows = filteredReservations.map(r => [
      getRestaurantName(r.restaurantId),
      format(new Date(r.dateTimeStart), 'dd/MM/yyyy'),
      format(new Date(r.dateTimeStart), 'HH:mm'),
      r.serviceType,
      r.lastName,
      r.firstName,
      r.phone,
      r.guestsCount,
      r.status
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
              <h1 className="text-xl font-bold text-gray-900">Réservations globales</h1>
            </div>
            
            <Button onClick={exportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </header>
        
        {/* Content */}
        <main className="p-4 lg:p-8">
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
                  
                  <Select value={restaurantFilter} onValueChange={setRestaurantFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Restaurant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous restaurants</SelectItem>
                      {restaurants.map(restaurant => (
                        <SelectItem key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
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
              <p className="text-sm text-gray-500">Restaurants</p>
              <p className="text-2xl font-bold">
                {new Set(filteredReservations.map(r => r.restaurantId)).size}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-2xl font-bold text-amber-600">
                {filteredReservations.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
          
          {/* Reservations List */}
          <Card>
            <CardContent className="p-4">
              {filteredReservations.length > 0 ? (
                <div className="space-y-3">
                  {filteredReservations.map(res => (
                    <div key={res.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">
                          {getRestaurantName(res.restaurantId)}
                        </span>
                      </div>
                      <ReservationRow
                        reservation={res}
                        tables={getTablesForRestaurant(res.restaurantId)}
                        onStatusChange={handleStatusChange}
                        onEdit={() => {}}
                      />
                    </div>
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
        </main>
      </div>
    </div>
  );
}