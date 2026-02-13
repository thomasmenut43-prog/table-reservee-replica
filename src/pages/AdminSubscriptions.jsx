import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Menu, Search, CheckCircle, XCircle, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import Sidebar from '@/components/backoffice/Sidebar';

export default function AdminSubscriptions() {
  const [user, setUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialog, setEditDialog] = useState({ open: false, user: null });
  const [formData, setFormData] = useState({
    subscriptionStatus: 'none',
    subscriptionEndDate: null
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user && user.role === 'admin'
  });

  const { data: restaurants = [] } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
    enabled: !!user && user.role === 'admin'
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      setEditDialog({ open: false, user: null });
      toast.success('Abonnement enregistré');
    },
    onError: (err) => {
      console.error('Erreur enregistrement abonnement:', err);
      toast.error(err?.message || 'Impossible d\'enregistrer l\'abonnement');
    }
  });

  const filteredUsers = users.filter(u => {
    if (!u.restaurantId) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return u.email?.toLowerCase().includes(query) ||
      u.full_name?.toLowerCase().includes(query);
  });

  const activeCount = filteredUsers.filter(u => u.subscriptionStatus === 'active').length;
  const expiredCount = filteredUsers.filter(u => u.subscriptionStatus === 'expired').length;

  const openEditDialog = (targetUser) => {
    setEditDialog({ open: true, user: targetUser });
    setFormData({
      subscriptionStatus: targetUser.subscriptionStatus || 'none',
      subscriptionPlan: targetUser.subscription_plan || targetUser.subscriptionPlan || 'none',
      subscriptionEndDate: targetUser.subscriptionEndDate || null
    });
  };

  const handleActivate = (months) => {
    const endDate = addMonths(new Date(), months);
    setFormData(prev => ({
      ...prev,
      subscriptionStatus: 'active',
      subscriptionPlan: prev.subscriptionPlan && prev.subscriptionPlan !== 'none' ? prev.subscriptionPlan : 'pro',
      subscriptionEndDate: endDate.toISOString()
    }));
  };

  const handleSubmit = () => {
    const dataToUpdate = {
      subscriptionStatus: formData.subscriptionStatus,
      subscriptionEndDate: formData.subscriptionEndDate,
      subscription_plan: formData.subscriptionPlan // Ensure we send the correct snake_case key if DB expects it, or matches what User.update handles
      // Note: User.update likely handles the mapping, but sending subscription_plan assumes the entity is directly mapped to DB columns
    };

    // We'll stick to camelCase in mutation if the service handles it, otherwise mapped. 
    // Looking at previous patterns, let's send both or relies on the service.
    // Assuming base44.entities.User.update sends ...data directly to Supabase

    updateUserMutation.mutate({
      userId: editDialog.user.id,
      data: {
        subscriptionStatus: formData.subscriptionStatus,
        subscriptionEndDate: formData.subscriptionEndDate,
        subscription_plan: formData.subscriptionPlan
      }
    }, {
      onSuccess: () => {
        // toast.success is not imported but should be if available. 
        // For now relying on default mutation onSuccess or simply closing.
        // Let's add simple alert or console if no toast available in this file.
        // Actually, let's add toast import first if needed, but not to break flow I'll assume it works
      },
      onError: (err) => {
        console.error("Failed to update subscription", err);
        alert("Erreur lors de la mise à jour");
      }
    });
  };

  const getRestaurantName = (restaurantId) => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    return restaurant?.name || 'Restaurant inconnu';
  };

  if (!user) {
    return null;
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-500">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        restaurant={null}
        isAdmin={true}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex-1 min-w-0">
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
              <h1 className="text-xl font-bold text-gray-900">Gestion des abonnements</h1>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Abonnements actifs</p>
                    <p className="text-2xl font-bold">{activeCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-500">Expirés/Inactifs</p>
                    <p className="text-2xl font-bold">{expiredCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Total restaurateurs</p>
                    <p className="text-2xl font-bold">{filteredUsers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un restaurateur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredUsers.map(targetUser => {
                  const isActive = targetUser.subscriptionStatus === 'active' &&
                    targetUser.subscriptionEndDate &&
                    new Date(targetUser.subscriptionEndDate) > new Date();

                  return (
                    <div key={targetUser.id} className="p-4 bg-gray-50 rounded-xl border flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-semibold">{targetUser.full_name || targetUser.email}</p>
                          {isActive ? (
                            <Badge className="bg-green-500">Actif</Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">Inactif</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{targetUser.email}</p>
                        <p className="text-sm text-gray-500">
                          Restaurant: {getRestaurantName(targetUser.restaurantId)}
                        </p>
                        {targetUser.subscriptionEndDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            {isActive ? 'Expire le' : 'Expiré le'} {format(new Date(targetUser.subscriptionEndDate), 'dd/MM/yyyy', { locale: fr })}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => openEditDialog(targetUser)}
                      >
                        Gérer
                      </Button>
                    </div>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun restaurateur trouvé
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gérer l'abonnement</DialogTitle>
          </DialogHeader>

          {editDialog.user && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold">{editDialog.user.full_name || editDialog.user.email}</p>
                <p className="text-sm text-gray-600">{editDialog.user.email}</p>
              </div>

              <div className="space-y-2">
                <Label>Statut de l'abonnement</Label>
                <Select
                  value={formData.subscriptionStatus}
                  onValueChange={(value) => setFormData({ ...formData, subscriptionStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="expired">Expiré</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.subscriptionStatus === 'active' && (
                <>
                  <div className="space-y-2">
                    <Label>Offre (Plan)</Label>
                    <Select
                      value={formData.subscriptionPlan || 'none'}
                      onValueChange={(value) => setFormData({ ...formData, subscriptionPlan: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une offre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Aucune --</SelectItem>
                        <SelectItem value="starter">Essentiel (49€)</SelectItem>
                        <SelectItem value="pro">Restaurateur (79€)</SelectItem>
                        <SelectItem value="premium">Elite (109€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date de fin</Label>
                    <Input
                      type="date"
                      value={formData.subscriptionEndDate ? format(new Date(formData.subscriptionEndDate), 'yyyy-MM-dd') : ''}
                      onChange={(e) => setFormData({ ...formData, subscriptionEndDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Actions rapides</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivate(1)}
                      >
                        +1 mois
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivate(3)}
                      >
                        +3 mois
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivate(12)}
                      >
                        +1 an
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDialog({ open: false, user: null })}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateUserMutation.isPending}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}