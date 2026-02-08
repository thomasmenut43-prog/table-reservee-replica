import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Menu, Plus, Ban, Trash2, Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Sidebar from '@/components/backoffice/Sidebar';
import SubscriptionGuard from '@/components/backoffice/SubscriptionGuard';

export default function BackofficeBlocks() {
  const [user, setUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteBlock, setDeleteBlock] = useState(null);
  const [formData, setFormData] = useState({
    tableId: '',
    startDate: null,
    startTime: '12:00',
    endDate: null,
    endTime: '14:00',
    reason: ''
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
  
  const { data: tables = [] } = useQuery({
    queryKey: ['tables', restaurantId],
    queryFn: () => base44.entities.Table.filter({ restaurantId }),
    enabled: !!restaurantId
  });
  
  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ['tableBlocks', restaurantId],
    queryFn: () => base44.entities.TableBlock.filter({ restaurantId }, '-startDateTime'),
    enabled: !!restaurantId
  });
  
  const createBlock = useMutation({
    mutationFn: (data) => base44.entities.TableBlock.create({ ...data, restaurantId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tableBlocks', restaurantId]);
      setIsDialogOpen(false);
      resetForm();
    }
  });
  
  const removeBlock = useMutation({
    mutationFn: (id) => base44.entities.TableBlock.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tableBlocks', restaurantId]);
      setDeleteBlock(null);
    }
  });
  
  const resetForm = () => {
    setFormData({
      tableId: '',
      startDate: null,
      startTime: '12:00',
      endDate: null,
      endTime: '14:00',
      reason: ''
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const startDateTime = new Date(formData.startDate);
    const [startH, startM] = formData.startTime.split(':');
    startDateTime.setHours(parseInt(startH), parseInt(startM));
    
    const endDateTime = new Date(formData.endDate || formData.startDate);
    const [endH, endM] = formData.endTime.split(':');
    endDateTime.setHours(parseInt(endH), parseInt(endM));
    
    createBlock.mutate({
      tableId: formData.tableId,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      reason: formData.reason
    });
  };
  
  const getTableName = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    return table ? table.name : 'Table inconnue';
  };
  
  // Filter upcoming blocks
  const upcomingBlocks = blocks.filter(b => new Date(b.endDateTime) > new Date());
  const pastBlocks = blocks.filter(b => new Date(b.endDateTime) <= new Date());
  
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
                <h1 className="text-xl font-bold text-gray-900">Indisponibilités</h1>
                <p className="text-sm text-gray-500">Bloquez des tables pour maintenance ou privatisation</p>
              </div>
            </div>
            
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </header>
        
        {/* Content */}
        <main className="p-4 lg:p-8">
          <SubscriptionGuard user={user}>
            {/* Upcoming */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-red-500" />
                  Indisponibilités en cours / à venir
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingBlocks.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingBlocks.map(block => (
                      <div key={block.id} className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{getTableName(block.tableId)}</Badge>
                            <span className="text-sm text-gray-600">
                              {format(new Date(block.startDateTime), 'dd/MM/yyyy HH:mm', { locale: fr })}
                              {' → '}
                              {format(new Date(block.endDateTime), 'dd/MM/yyyy HH:mm', { locale: fr })}
                            </span>
                          </div>
                          {block.reason && (
                            <p className="text-sm text-gray-600">{block.reason}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteBlock(block)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucune indisponibilité programmée
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Past */}
            {pastBlocks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-500">Indisponibilités passées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pastBlocks.slice(0, 10).map(block => (
                      <div key={block.id} className="p-4 bg-gray-50 border rounded-xl flex items-center justify-between opacity-60">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{getTableName(block.tableId)}</Badge>
                            <span className="text-sm text-gray-600">
                              {format(new Date(block.startDateTime), 'dd/MM/yyyy HH:mm', { locale: fr })}
                              {' → '}
                              {format(new Date(block.endDateTime), 'dd/MM/yyyy HH:mm', { locale: fr })}
                            </span>
                          </div>
                          {block.reason && (
                            <p className="text-sm text-gray-600">{block.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </SubscriptionGuard>
        </main>
      </div>
      
      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une indisponibilité</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Table</Label>
              <Select
                value={formData.tableId}
                onValueChange={(value) => setFormData({ ...formData, tableId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map(table => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.name} ({table.capacity}p - {table.zone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {formData.startDate ? format(formData.startDate, 'dd/MM/yyyy') : 'Sélectionner'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData({ ...formData, startDate: date, endDate: date })}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Heure de début</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {formData.endDate ? format(formData.endDate, 'dd/MM/yyyy') : 'Sélectionner'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData({ ...formData, endDate: date })}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Heure de fin</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Motif (optionnel)</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Maintenance, privatisation, événement..."
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={!formData.tableId || !formData.startDate || createBlock.isPending}
              >
                Ajouter
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBlock} onOpenChange={() => setDeleteBlock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'indisponibilité ?</AlertDialogTitle>
            <AlertDialogDescription>
              La table sera de nouveau disponible aux réservations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => removeBlock.mutate(deleteBlock.id)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}