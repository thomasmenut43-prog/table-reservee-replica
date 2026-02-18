import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, parse, setHours, setMinutes, addMinutes, isBefore, isAfter, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Users, Sun, Moon, Clock, AlertCircle, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function BookingForm({ 
  restaurant, 
  schedules, 
  tables, 
  existingReservations,
  tableBlocks,
  onSubmit, 
  isLoading 
}) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [serviceType, setServiceType] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [guestsCount, setGuestsCount] = useState(2);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    comment: ''
  });
  const [availabilityError, setAvailabilityError] = useState('');
  
  // Get schedule for selected date
  const getScheduleForDate = (date, service) => {
    if (!date) return null;
    const dayOfWeek = date.getDay();
    const schedule = schedules.find(s => Number(s.dayOfWeek) === dayOfWeek && s.serviceType === service);
    return schedule?.isOpen !== false ? schedule : null;
  };
  
  // Available services for selected date
  const availableServices = useMemo(() => {
    if (!selectedDate) return [];
    const dayOfWeek = selectedDate.getDay();
    const services = [];
    
    // Check MIDI service
    const midiSchedule = schedules.find(s => Number(s.dayOfWeek) === dayOfWeek && s.serviceType === 'MIDI');
    if (midiSchedule && midiSchedule.isOpen !== false && midiSchedule.startTime && midiSchedule.endTime) {
      services.push({ type: 'MIDI', schedule: midiSchedule });
    }
    
    // Check SOIR service
    const soirSchedule = schedules.find(s => Number(s.dayOfWeek) === dayOfWeek && s.serviceType === 'SOIR');
    if (soirSchedule && soirSchedule.isOpen !== false && soirSchedule.startTime && soirSchedule.endTime) {
      services.push({ type: 'SOIR', schedule: soirSchedule });
    }
    
    return services;
  }, [selectedDate, schedules]);
  
  // Plages réservation RestoPonot : midi 12h-14h, soir 19h-21h30, créneaux 15 min
  const hasOffer = restaurant?.ownerHasActiveSubscription === true;
  const OFFER_MIDI = { start: '12:00', end: '14:00' };
  const OFFER_SOIR = { start: '19:00', end: '21:30' };

  // Generate time slots
  const timeSlots = useMemo(() => {
    if (!selectedDate || !serviceType) return [];
    const schedule = getScheduleForDate(selectedDate, serviceType);
    if (!schedule) return [];
    
    const slots = [];
    const interval = hasOffer ? 15 : (restaurant.slotIntervalMinutes || 15);
    const minAdvance = restaurant.minAdvanceMinutes || 0;

    let startStr = schedule.startTime;
    let endStr = schedule.endTime;
    if (hasOffer) {
      const range = serviceType === 'MIDI' ? OFFER_MIDI : OFFER_SOIR;
      startStr = schedule.startTime > range.start ? schedule.startTime : range.start;
      endStr = schedule.endTime < range.end ? schedule.endTime : range.end;
    }
    
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    
    let slotTime = setMinutes(setHours(selectedDate, startH), startM);
    const endTime = setMinutes(setHours(selectedDate, endH), endM);
    const now = new Date();
    const minTime = addMinutes(now, minAdvance);
    
    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
    
    while (isBefore(slotTime, endTime)) {
      if (!isToday || isAfter(slotTime, minTime)) {
        slots.push(format(slotTime, 'HH:mm'));
      }
      slotTime = addMinutes(slotTime, interval);
    }
    
    return slots;
  }, [selectedDate, serviceType, restaurant, schedules, hasOffer]);
  
  // Calculate max capacity and available tables
  const { maxCapacity, availableTables } = useMemo(() => {
    if (!selectedDate || !serviceType || !selectedTime) {
      return { maxCapacity: 0, availableTables: [] };
    }
    
    const mealDuration = restaurant.mealDurationMinutes || 90;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startDateTime = setMinutes(setHours(selectedDate, hours), minutes);
    const endDateTime = addMinutes(startDateTime, mealDuration);
    
    // Filter available tables
    const available = tables.filter(table => {
      // Check table blocks
      const isBlocked = tableBlocks.some(block => {
        if (block.tableId !== table.id) return false;
        const blockStart = new Date(block.startDateTime);
        const blockEnd = new Date(block.endDateTime);
        return !(endDateTime <= blockStart || startDateTime >= blockEnd);
      });
      if (isBlocked) return false;
      
      // Check existing reservations
      const hasConflict = existingReservations.some(res => {
        if (!res.tableIds?.includes(table.id)) return false;
        if (res.status === 'canceled') return false;
        const resStart = new Date(res.dateTimeStart);
        const resEnd = new Date(res.dateTimeEnd);
        return !(endDateTime <= resStart || startDateTime >= resEnd);
      });
      
      return !hasConflict;
    });
    
    if (available.length === 0) {
      return { maxCapacity: 0, availableTables: [] };
    }
    
    // Max capacity from single table
    let maxCap = Math.max(...available.map(t => t.seats));
    
    // Check combinations if joining enabled
    if (restaurant.tableJoiningEnabled) {
      const joinable = available.filter(t => t.isJoinable);
      
      // 2-table combinations
      for (let i = 0; i < joinable.length; i++) {
        for (let j = i + 1; j < joinable.length; j++) {
          maxCap = Math.max(maxCap, joinable[i].seats + joinable[j].seats);
        }
      }
      
      // 3-table combinations
      for (let i = 0; i < joinable.length; i++) {
        for (let j = i + 1; j < joinable.length; j++) {
          for (let k = j + 1; k < joinable.length; k++) {
            maxCap = Math.max(maxCap, joinable[i].seats + joinable[j].seats + joinable[k].seats);
          }
        }
      }
    }
    
    return { maxCapacity: maxCap, availableTables: available };
  }, [selectedDate, serviceType, selectedTime, tables, existingReservations, tableBlocks, restaurant]);

  // Calculate distance between two tables
  const getTableDistance = (table1, table2) => {
    const dx = (table1.position_x || 0) - (table2.position_x || 0);
    const dy = (table1.position_y || 0) - (table2.position_y || 0);
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Check availability for specific guest count
  const checkAvailability = () => {
    if (!selectedDate || !serviceType || !selectedTime || availableTables.length === 0) {
      return { available: false };
    }
    
    // Find single table that fits
    const singleTable = availableTables
      .filter(t => t.seats >= guestsCount)
      .sort((a, b) => a.seats - b.seats)[0];
    
    if (singleTable) {
      return { 
        available: true, 
        tableIds: [singleTable.id],
        tables: [singleTable]
      };
    }
    
    // Try combinations if joining enabled
    if (restaurant.tableJoiningEnabled) {
      const joinable = availableTables.filter(t => t.isJoinable);
      
      // Try 2-table combinations - prioritize closest tables
      let bestCombination = null;
      let bestDistance = Infinity;
      
      for (let i = 0; i < joinable.length; i++) {
        for (let j = i + 1; j < joinable.length; j++) {
          const totalSeats = joinable[i].seats + joinable[j].seats;
          if (totalSeats >= guestsCount) {
            const distance = getTableDistance(joinable[i], joinable[j]);
            // Prefer exact match, or closest tables if over capacity
            if (!bestCombination || totalSeats < bestCombination.totalSeats || 
               (totalSeats === bestCombination.totalSeats && distance < bestDistance)) {
              bestCombination = {
                tables: [joinable[i], joinable[j]],
                totalSeats
              };
              bestDistance = distance;
            }
          }
        }
      }
      
      if (bestCombination) {
        return {
          available: true,
          tableIds: bestCombination.tables.map(t => t.id),
          tables: bestCombination.tables
        };
      }
      
      // Try 3-table combinations if 2 tables weren't enough
      for (let i = 0; i < joinable.length; i++) {
        for (let j = i + 1; j < joinable.length; j++) {
          for (let k = j + 1; k < joinable.length; k++) {
            const totalSeats = joinable[i].seats + joinable[j].seats + joinable[k].seats;
            if (totalSeats >= guestsCount) {
              const avgDistance = (getTableDistance(joinable[i], joinable[j]) + 
                                 getTableDistance(joinable[j], joinable[k]) + 
                                 getTableDistance(joinable[i], joinable[k])) / 3;
              if (!bestCombination || totalSeats < bestCombination.totalSeats || 
                 (totalSeats === bestCombination.totalSeats && avgDistance < bestDistance)) {
                bestCombination = {
                  tables: [joinable[i], joinable[j], joinable[k]],
                  totalSeats
                };
                bestDistance = avgDistance;
              }
            }
          }
        }
      }
      
      if (bestCombination) {
        return {
          available: true,
          tableIds: bestCombination.tables.map(t => t.id),
          tables: bestCombination.tables
        };
      }
    }
    
    return { available: false };
  };
  
  const availability = useMemo(() => {
    const result = checkAvailability();
    if (selectedDate && serviceType && selectedTime && !result.available) {
      setAvailabilityError('Aucune table disponible pour ce créneau');
    } else {
      setAvailabilityError('');
    }
    return result;
  }, [selectedDate, serviceType, selectedTime, guestsCount, tables, existingReservations, tableBlocks]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!availability.available) return;
    
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startDateTime = setMinutes(setHours(selectedDate, hours), minutes);
    const endDateTime = addMinutes(startDateTime, restaurant.mealDurationMinutes || 90);
    
    // Determine status
    let status = 'confirmed';
    if (!restaurant.autoConfirmEnabled) {
      status = 'pending';
    }
    if (guestsCount >= (restaurant.groupPendingThreshold || 8)) {
      status = 'pending';
    }
    
    onSubmit({
      ...formData,
      serviceType,
      dateTimeStart: startDateTime.toISOString(),
      dateTimeEnd: endDateTime.toISOString(),
      guestsCount,
      tableIds: availability.tableIds,
      status,
      reference: `RES-${Date.now().toString(36).toUpperCase()}`
    });
  };
  
  const maxDate = addDays(new Date(), restaurant.bookingWindowDays || 60);
  
  const needsPhoneConfirmation = guestsCount > 10 || (guestsCount > maxCapacity && maxCapacity > 0);
  
  const isFormValid = selectedDate && serviceType && selectedTime && 
    formData.firstName && formData.lastName && formData.phone && 
    availability.available;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-12 rounded-xl",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr }) : 'Sélectionner une date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setServiceType('');
                setSelectedTime('');
              }}
              disabled={(date) => isBefore(date, startOfDay(new Date())) || isAfter(date, maxDate)}
              locale={fr}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Service Selection */}
      {selectedDate && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Service</Label>
          <div className="grid grid-cols-2 gap-3">
            {availableServices.map(({ type, schedule }) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setServiceType(type);
                  setSelectedTime('');
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  serviceType === type 
                    ? type === 'MIDI' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                {type === 'MIDI' ? (
                  <Sun className={cn("h-6 w-6", serviceType === type ? 'text-orange-500' : 'text-gray-400')} />
                ) : (
                  <Moon className={cn("h-6 w-6", serviceType === type ? 'text-indigo-500' : 'text-gray-400')} />
                )}
                <span className="font-medium">{type === 'MIDI' ? 'Midi' : 'Soir'}</span>
                <span className="text-sm text-gray-500">{schedule.startTime} - {schedule.endTime}</span>
              </button>
            ))}
          </div>
          {availableServices.length === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Restaurant fermé ce jour</AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
      {/* Time Selection */}
      {serviceType && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Heure</Label>
          <Select value={selectedTime} onValueChange={setSelectedTime}>
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="Sélectionner un horaire">
                {selectedTime && (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {selectedTime}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {timeSlots.length > 0 ? (
                timeSlots.map(slot => (
                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-gray-500 text-center">
                  Aucun créneau disponible
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Guests Count */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Nombre de personnes</Label>
        {selectedDate && serviceType && selectedTime && (
          <p className="text-xs text-gray-500">
            {availableTables.length > 0 
              ? `${availableTables.length} table(s) disponible(s) - Capacité max : ${maxCapacity} personnes`
              : `Aucune table trouvée (Total tables: ${tables?.length || 0})`
            }
          </p>
        )}
        {!selectedDate && !serviceType && !selectedTime && maxCapacity > 0 && (
          <p className="text-xs text-gray-500">
            Capacité disponible : jusqu'à {maxCapacity} personnes
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl"
            onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
          >
            -
          </Button>
          <div className="flex-1 h-12 flex items-center justify-center bg-gray-50 rounded-xl font-semibold">
            <Users className="h-4 w-4 mr-2 text-gray-500" />
            {guestsCount} {guestsCount > 1 ? 'personnes' : 'personne'}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl"
            onClick={() => setGuestsCount(guestsCount + 1)}
          >
            +
          </Button>
        </div>
        {needsPhoneConfirmation && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Soumis à confirmation. Pour les groupes de plus de 10 personnes, veuillez contacter le restaurant par téléphone.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* Availability Info */}
      {availability.available && !needsPhoneConfirmation && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-800 font-medium">
              ✓ Disponible pour {guestsCount} {guestsCount > 1 ? 'personnes' : 'personne'}
            </p>
          </CardContent>
        </Card>
      )}
      
      {availabilityError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {availabilityError}
            {restaurant.waitlistEnabled && (
              <span className="block mt-1">
                Vous pouvez vous inscrire sur la liste d'attente.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Contact Info */}
      {!needsPhoneConfirmation && (
      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-medium">Vos coordonnées</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Prénom *</Label>
            <Input
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="h-12 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="h-12 rounded-xl"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Téléphone *</Label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="06 12 34 56 78"
            className="h-12 rounded-xl"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label>Email (optionnel)</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="votre@email.com"
            className="h-12 rounded-xl"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Commentaire (optionnel)</Label>
          <Textarea
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            placeholder="Allergies, occasion spéciale, demandes particulières..."
            className="rounded-xl resize-none"
            rows={3}
          />
        </div>
      </div>
      )}
      
      {/* Deposit Info */}
      {!needsPhoneConfirmation && restaurant.depositEnabled && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-amber-900 mb-2">Acompte demandé</h4>
            <p className="text-sm text-amber-800">
              {restaurant.depositType === 'fixed' 
                ? `${restaurant.depositValue}€` 
                : `${restaurant.depositValue}%`} par personne
            </p>
            {restaurant.depositConditionsText && (
              <p className="text-xs text-amber-700 mt-2">{restaurant.depositConditionsText}</p>
            )}
            <p className="text-xs text-amber-600 mt-2 italic">
              Le paiement de l'acompte sera géré directement par le restaurant.
            </p>
          </CardContent>
        </Card>
      )}
      
      {needsPhoneConfirmation ? (
        <a 
          href={`tel:${restaurant.phone}`}
          className="w-full"
        >
          <Button 
            type="button"
            className="w-full h-14 rounded-3xl text-lg font-semibold"
          >
            Appeler le restaurant
          </Button>
        </a>
      ) : (
        <Button 
          type="submit" 
          className="w-full h-14 rounded-3xl text-lg font-semibold"
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Réservation en cours...
            </>
          ) : (
            'Confirmer la réservation'
          )}
        </Button>
      )}
    </form>
  );
}