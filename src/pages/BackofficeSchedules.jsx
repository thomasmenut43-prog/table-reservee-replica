import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Menu, Sun, Moon, Save, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Sidebar from '@/components/backoffice/Sidebar';
import SubscriptionGuard from '@/components/backoffice/SubscriptionGuard';

const DAYS = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' }
];

export default function BackofficeSchedules() {
  const [user, setUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
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
  
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules', restaurantId],
    queryFn: () => base44.entities.ServiceSchedule.filter({ restaurantId }),
    enabled: !!restaurantId
  });
  
  // Initialize schedule data
  useEffect(() => {
    if (schedules.length > 0) {
      const data = {};
      DAYS.forEach(day => {
        ['MIDI', 'SOIR'].forEach(service => {
          const key = `${day.value}-${service}`;
          const existing = schedules.find(s => s.dayOfWeek === day.value && s.serviceType === service);
          data[key] = existing || {
            dayOfWeek: day.value,
            serviceType: service,
            isOpen: false,
            startTime: service === 'MIDI' ? '12:00' : '19:00',
            endTime: service === 'MIDI' ? '14:00' : '22:00',
            maxCoversPerSlot: null,
            maxReservationsPerSlot: null
          };
        });
      });
      setScheduleData(data);
    } else if (user?.restaurantId && !isLoading) {
      // Initialize with defaults if no schedules exist
      const data = {};
      DAYS.forEach(day => {
        ['MIDI', 'SOIR'].forEach(service => {
          const key = `${day.value}-${service}`;
          data[key] = {
            dayOfWeek: day.value,
            serviceType: service,
            isOpen: day.value >= 1 && day.value <= 5, // Lundi-Vendredi by default
            startTime: service === 'MIDI' ? '12:00' : '19:00',
            endTime: service === 'MIDI' ? '14:00' : '22:00',
            maxCoversPerSlot: null,
            maxReservationsPerSlot: null
          };
        });
      });
      setScheduleData(data);
    }
  }, [schedules, restaurantId, isLoading]);
  
  const updateSchedule = (key, field, value) => {
    setScheduleData(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
    setHasChanges(true);
  };
  
  const createSchedule = useMutation({
    mutationFn: (data) => base44.entities.ServiceSchedule.create({ ...data, restaurantId })
  });
  
  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ServiceSchedule.update(id, data)
  });
  
  const saveAllSchedules = async () => {
    const promises = Object.entries(scheduleData).map(async ([key, data]) => {
      const existing = schedules.find(s => s.dayOfWeek === data.dayOfWeek && s.serviceType === data.serviceType);
      
      const payload = {
        isOpen: data.isOpen,
        startTime: data.startTime,
        endTime: data.endTime,
        maxCoversPerSlot: data.maxCoversPerSlot || null,
        maxReservationsPerSlot: data.maxReservationsPerSlot || null
      };
      
      if (existing) {
        return updateScheduleMutation.mutateAsync({ id: existing.id, data: payload });
      } else {
        return createSchedule.mutateAsync({
          ...payload,
          dayOfWeek: data.dayOfWeek,
          serviceType: data.serviceType
        });
      }
    });
    
    await Promise.all(promises);
    queryClient.invalidateQueries(['schedules', restaurantId]);
    setHasChanges(false);
    toast.success('Horaires enregistrés');
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
              <div>
                <h1 className="text-xl font-bold text-gray-900">Services & Horaires</h1>
                <p className="text-sm text-gray-500">Configurez vos services midi et soir</p>
              </div>
            </div>
            
            <Button 
              onClick={saveAllSchedules} 
              disabled={!hasChanges || createSchedule.isPending || updateScheduleMutation.isPending}
            >
              {(createSchedule.isPending || updateScheduleMutation.isPending) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>
        </header>
        
        {/* Content */}
        <main className="p-4 lg:p-8">
          <div className="space-y-6">
            {/* Schedule Cards */}
            <div className="space-y-4">
              {DAYS.map(day => {
              const midiKey = `${day.value}-MIDI`;
              const soirKey = `${day.value}-SOIR`;
              const midi = scheduleData[midiKey];
              const soir = scheduleData[soirKey];
              
              if (!midi || !soir) return null;
              
              return (
                <Card key={day.value}>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">{day.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* MIDI */}
                      <div className={`p-4 rounded-xl border-2 transition-colors ${midi.isOpen ? 'border-orange-200 bg-orange-50/50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Sun className={`h-5 w-5 ${midi.isOpen ? 'text-orange-500' : 'text-gray-400'}`} />
                            <span className="font-medium">Service Midi</span>
                          </div>
                          <Switch
                            checked={midi.isOpen}
                            onCheckedChange={(checked) => updateSchedule(midiKey, 'isOpen', checked)}
                          />
                        </div>
                        
                        {midi.isOpen && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Ouverture</Label>
                                <Input
                                  type="time"
                                  value={midi.startTime}
                                  onChange={(e) => updateSchedule(midiKey, 'startTime', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Fermeture</Label>
                                <Input
                                  type="time"
                                  value={midi.endTime}
                                  onChange={(e) => updateSchedule(midiKey, 'endTime', e.target.value)}
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Max couverts/créneau</Label>
                                <Input
                                  type="number"
                                  placeholder="Illimité"
                                  value={midi.maxCoversPerSlot || ''}
                                  onChange={(e) => updateSchedule(midiKey, 'maxCoversPerSlot', e.target.value ? parseInt(e.target.value) : null)}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Max résa/créneau</Label>
                                <Input
                                  type="number"
                                  placeholder="Illimité"
                                  value={midi.maxReservationsPerSlot || ''}
                                  onChange={(e) => updateSchedule(midiKey, 'maxReservationsPerSlot', e.target.value ? parseInt(e.target.value) : null)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* SOIR */}
                      <div className={`p-4 rounded-xl border-2 transition-colors ${soir.isOpen ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Moon className={`h-5 w-5 ${soir.isOpen ? 'text-indigo-500' : 'text-gray-400'}`} />
                            <span className="font-medium">Service Soir</span>
                          </div>
                          <Switch
                            checked={soir.isOpen}
                            onCheckedChange={(checked) => updateSchedule(soirKey, 'isOpen', checked)}
                          />
                        </div>
                        
                        {soir.isOpen && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Ouverture</Label>
                                <Input
                                  type="time"
                                  value={soir.startTime}
                                  onChange={(e) => updateSchedule(soirKey, 'startTime', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Fermeture</Label>
                                <Input
                                  type="time"
                                  value={soir.endTime}
                                  onChange={(e) => updateSchedule(soirKey, 'endTime', e.target.value)}
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Max couverts/créneau</Label>
                                <Input
                                  type="number"
                                  placeholder="Illimité"
                                  value={soir.maxCoversPerSlot || ''}
                                  onChange={(e) => updateSchedule(soirKey, 'maxCoversPerSlot', e.target.value ? parseInt(e.target.value) : null)}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Max résa/créneau</Label>
                                <Input
                                  type="number"
                                  placeholder="Illimité"
                                  value={soir.maxReservationsPerSlot || ''}
                                  onChange={(e) => updateSchedule(soirKey, 'maxReservationsPerSlot', e.target.value ? parseInt(e.target.value) : null)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}