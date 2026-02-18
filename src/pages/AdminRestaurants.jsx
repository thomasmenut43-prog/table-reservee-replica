import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Menu, Plus, Search, Building2, MapPin, Phone, Edit2,
  Trash2, Power, ExternalLink, Eye, X, Tag, Upload, Image as ImageIcon, Settings, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { toast } from 'sonner';
import Sidebar from '@/components/backoffice/Sidebar';
import StarRating from '@/components/ui/StarRating';

export default function AdminRestaurants() {
  const [user, setUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [deleteRestaurant, setDeleteRestaurant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    postalCode: '',
    address: '',
    phone: '',
    email: '',
    cuisineTags: [],
    coverPhoto: '',
    photos: [],
    isActive: true,
    onlineBookingEnabled: false
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [assignedRestaurantId, setAssignedRestaurantId] = useState('');
  const [offerDialog, setOfferDialog] = useState({ open: false, restaurant: null });
  const [offerFormData, setOfferFormData] = useState({
    subscriptionPlan: 'pro',
    subscriptionEndDate: format(addMonths(new Date(), 12), 'yyyy-MM-dd')
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.restaurantId) setAssignedRestaurantId(u.restaurantId);
    });
  }, []);

  const isAdmin = user?.role === 'admin';

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
    enabled: isAdmin
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin
  });

  const createRestaurant = useMutation({
    mutationFn: (data) => {
      console.log('Creating restaurant with data:', data);
      return base44.entities.Restaurant.create(data);
    },
    onSuccess: () => {
      console.log('Restaurant created successfully');
      queryClient.invalidateQueries(['all-restaurants']);
      setIsDialogOpen(false);
      resetForm();
      toast.success('Restaurant créé avec succès');
    },
    onError: (error) => {
      toast.error(error?.message || 'Erreur lors de la création du restaurant');
    }
  });

  const updateRestaurant = useMutation({
    mutationFn: ({ id, data }) => {
      console.log('Updating restaurant', id, 'with data:', data);
      return base44.entities.Restaurant.update(id, data);
    },
    onSuccess: () => {
      console.log('Restaurant updated successfully');
      queryClient.invalidateQueries(['all-restaurants']);
      setIsDialogOpen(false);
      resetForm();
      toast.success('Restaurant mis à jour');
    },
    onError: (error) => {
      toast.error(error?.message || 'Erreur lors de l\'enregistrement du restaurant');
    }
  });

  const removeRestaurant = useMutation({
    mutationFn: (id) => base44.entities.Restaurant.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-restaurants']);
      setDeleteRestaurant(null);
    },
    onError: (err) => toast.error(err?.message || 'Impossible de supprimer le restaurant')
  });

  const getUsersForRestaurant = (restaurantId) => {
    return users.filter(u => (u.restaurantId || u.restaurant_id) === restaurantId);
  };

  const setOfferMutation = useMutation({
    mutationFn: async ({ restaurant, activate, plan, endDate }) => {
      const usersList = queryClient.getQueryData(['all-users']) || [];
      const usersToUpdate = usersList.filter(u => (u.restaurantId || u.restaurant_id) === restaurant.id);
      if (activate) {
        await base44.entities.Restaurant.update(restaurant.id, { ownerHasActiveSubscription: true });
        const endDateIso = endDate ? new Date(endDate).toISOString() : addMonths(new Date(), 12).toISOString();
        for (const u of usersToUpdate) {
          await base44.entities.User.update(u.id, {
            subscriptionStatus: 'active',
            subscriptionEndDate: endDateIso,
            subscription_plan: plan || 'pro'
          });
        }
        return { updated: usersToUpdate.length };
      } else {
        await base44.entities.Restaurant.update(restaurant.id, { ownerHasActiveSubscription: false });
        for (const u of usersToUpdate) {
          await base44.entities.User.update(u.id, {
            subscriptionStatus: 'expired',
            subscriptionEndDate: null,
            subscription_plan: 'none'
          });
        }
        return { updated: usersToUpdate.length };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['all-restaurants']);
      queryClient.invalidateQueries(['all-users']);
      queryClient.invalidateQueries(['restaurant']);
      setOfferDialog({ open: false, restaurant: null });
      toast.success(
        variables.activate
          ? `Offre activée. Les utilisateurs assignés à ce restaurant en bénéficient.`
          : `Offre désactivée pour ce restaurant.`
      );
    },
    onError: (err) => {
      toast.error(err?.message || 'Erreur lors de la mise à jour de l\'offre');
    }
  });

  const resetForm = () => {
    setEditingRestaurant(null);
    setFormData({
      name: '',
      city: '',
      postalCode: '',
      address: '',
      phone: '',
      email: '',
      cuisineTags: [],
      coverPhoto: '',
      photos: [],
      isActive: true,
      onlineBookingEnabled: false
    });
    setNewCategory('');
  };

  const openEditDialog = (restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      city: restaurant.city,
      postalCode: restaurant.postalCode || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      cuisineTags: restaurant.cuisineTags || [],
      coverPhoto: restaurant.coverPhoto || '',
      photos: restaurant.photos || [],
      isActive: restaurant.isActive ?? true,
      onlineBookingEnabled: restaurant.onlineBookingEnabled ?? false
    });
    setIsDialogOpen(true);
  };

  const addCategory = () => {
    if (newCategory.trim() && !formData.cuisineTags.includes(newCategory.trim())) {
      setFormData({ ...formData, cuisineTags: [...formData.cuisineTags, newCategory.trim()] });
      setNewCategory('');
    }
  };

  const removeCategory = (category) => {
    setFormData({ ...formData, cuisineTags: formData.cuisineTags.filter(c => c !== category) });
  };

  const handleCoverPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file, folder: 'restaurants' });
      setFormData({ ...formData, coverPhoto: file_url });
      toast.success('Photo de couverture téléchargée');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploadingCover(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || formData.photos.length >= 4) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file, folder: 'restaurants' });
      setFormData({ ...formData, photos: [...formData.photos, file_url] });
      toast.success('Photo ajoutée');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (index) => {
    setFormData({ ...formData, photos: formData.photos.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingRestaurant) {
      updateRestaurant.mutate({ id: editingRestaurant.id, data: formData });
    } else {
      createRestaurant.mutate({
        ...formData,
        slotIntervalMinutes: 15,
        mealDurationMinutes: 90,
        minAdvanceMinutes: 60,
        bookingWindowDays: 60,
        autoConfirmEnabled: true,
        groupPendingThreshold: 8
      });
    }
  };

  const toggleActive = (restaurant) => {
    updateRestaurant.mutate({
      id: restaurant.id,
      data: { isActive: !restaurant.isActive }
    });
  };

  const filteredRestaurants = restaurants.filter(r => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return r.name?.toLowerCase().includes(query) || r.city?.toLowerCase().includes(query);
  });

  const getRestaurateur = (restaurantId) => {
    return users.find(u => u.restaurantId === restaurantId);
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
              <h1 className="text-xl font-bold text-gray-900">Restaurants</h1>
            </div>

            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRestaurants.map(restaurant => {
              const restaurateur = getRestaurateur(restaurant.id);

              return (
                <Card key={restaurant.id} className={!restaurant.isActive ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {restaurant.coverPhoto ? (
                          <img
                            src={restaurant.coverPhoto}
                            alt={restaurant.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{restaurant.name}</h3>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {restaurant.city}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {restaurant.ownerHasActiveSubscription && (
                          <Badge className="bg-green-600">Offre active</Badge>
                        )}
                        <Badge variant={restaurant.isActive ? 'default' : 'secondary'}>
                          {restaurant.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>

                    {restaurant.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Phone className="h-4 w-4" />
                        {restaurant.phone}
                      </div>
                    )}

                    {restaurant.cuisineTags && restaurant.cuisineTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {restaurant.cuisineTags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <StarRating rating={restaurant.ratingAvg || 0} count={restaurant.ratingCount || 0} size="xs" />
                    </div>

                    {restaurateur && (
                      <div className="text-sm text-gray-500 mb-3">
                        Géré par : <span className="font-medium">{restaurateur.full_name || restaurateur.email}</span>
                      </div>
                    )}

                    <div className="text-xs text-gray-400 mb-3 font-mono">
                      ID: {restaurant.id}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
                      {assignedRestaurantId === restaurant.id ? (
                        <Link to={createPageUrl('BackofficeDashboard') + `?restaurantId=${restaurant.id}`}>
                          <Button variant="default" size="sm">
                            <Settings className="h-4 w-4 mr-1" />
                            Back-office
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            base44.auth.updateMe({ restaurantId: restaurant.id }).then(() => {
                              setAssignedRestaurantId(restaurant.id);
                            });
                          }}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Accéder
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(restaurant)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant={restaurant.ownerHasActiveSubscription ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setOfferDialog({ open: true, restaurant });
                          if (restaurant.ownerHasActiveSubscription) {
                            const owner = getRestaurateur(restaurant.id);
                            setOfferFormData({
                              subscriptionPlan: (owner?.subscriptionPlan || owner?.subscription_plan) || 'pro',
                              subscriptionEndDate: owner?.subscriptionEndDate
                                ? format(new Date(owner.subscriptionEndDate), 'yyyy-MM-dd')
                                : format(addMonths(new Date(), 12), 'yyyy-MM-dd')
                            });
                          } else {
                            setOfferFormData({
                              subscriptionPlan: 'pro',
                              subscriptionEndDate: format(addMonths(new Date(), 12), 'yyyy-MM-dd')
                            });
                          }
                        }}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Offre
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(restaurant)}
                      >
                        <Power className="h-4 w-4 mr-1" />
                        {restaurant.isActive ? 'Désactiver' : 'Activer'}
                      </Button>
                      <Link to={createPageUrl(`Restaurant?id=${restaurant.id}`)} target="_blank">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteRestaurant(restaurant)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredRestaurants.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun restaurant trouvé</p>
            </div>
          )}
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRestaurant ? 'Modifier le restaurant' : 'Ajouter un restaurant'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ville *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Catégories / Type de cuisine
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Ex: Italien, Japonais..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                />
                <Button type="button" onClick={addCategory} size="sm">
                  Ajouter
                </Button>
              </div>
              {formData.cuisineTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.cuisineTags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="pl-3">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeCategory(tag)}
                        className="ml-2 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Photo principale</Label>
              {formData.coverPhoto ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                  <img src={formData.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData({ ...formData, coverPhoto: '' })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Cliquer pour uploader</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleCoverPhotoUpload}
                    disabled={uploadingCover}
                  />
                  {uploadingCover && <div className="text-xs text-blue-500 mt-1">Téléchargement en cours...</div>}
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label>Photos supplémentaires (max 4)</Label>
              <div className="grid grid-cols-2 gap-2">
                {formData.photos.map((photo, idx) => (
                  <div key={idx} className="relative h-24 rounded-lg overflow-hidden border">
                    <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => removePhoto(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {formData.photos.length < 4 && (
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Ajouter</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                    {uploadingPhoto && <div className="text-xs text-blue-500">...</div>}
                  </label>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <Label>Restaurant actif</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <Label>Réservation en ligne</Label>
                <p className="text-xs text-gray-500">Permet aux clients de réserver directement</p>
              </div>
              <Switch
                checked={formData.onlineBookingEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, onlineBookingEnabled: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createRestaurant.isPending || updateRestaurant.isPending}>
                {editingRestaurant ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={offerDialog.open} onOpenChange={(open) => setOfferDialog({ open, restaurant: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offre — {offerDialog.restaurant?.name}</DialogTitle>
          </DialogHeader>
          {offerDialog.restaurant && (
            <div className="space-y-4 py-4">
              {offerDialog.restaurant.ownerHasActiveSubscription ? (
                <>
                  <p className="text-sm text-gray-600">
                    Une offre est active pour ce restaurant. Tous les utilisateurs assignés en bénéficient dans leur back-office.
                  </p>
                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <Select
                      value={offerFormData.subscriptionPlan}
                      onValueChange={(v) => setOfferFormData({ ...offerFormData, subscriptionPlan: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
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
                      value={offerFormData.subscriptionEndDate}
                      onChange={(e) => setOfferFormData({ ...offerFormData, subscriptionEndDate: e.target.value })}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setOfferMutation.mutate({
                        restaurant: offerDialog.restaurant,
                        activate: false
                      })}
                      disabled={setOfferMutation.isPending}
                    >
                      Désactiver l'offre
                    </Button>
                    <Button
                      onClick={() => setOfferMutation.mutate({
                        restaurant: offerDialog.restaurant,
                        activate: true,
                        plan: offerFormData.subscriptionPlan,
                        endDate: offerFormData.subscriptionEndDate
                      })}
                      disabled={setOfferMutation.isPending}
                    >
                      {setOfferMutation.isPending ? 'Enregistrement...' : 'Mettre à jour'}
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Activer une offre pour ce restaurant. Tous les utilisateurs assignés à ce restaurant en bénéficieront (réservation en ligne, fonctionnalités back-office).
                  </p>
                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <Select
                      value={offerFormData.subscriptionPlan}
                      onValueChange={(v) => setOfferFormData({ ...offerFormData, subscriptionPlan: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
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
                      value={offerFormData.subscriptionEndDate}
                      onChange={(e) => setOfferFormData({ ...offerFormData, subscriptionEndDate: e.target.value })}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setOfferDialog({ open: false, restaurant: null })}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => setOfferMutation.mutate({
                        restaurant: offerDialog.restaurant,
                        activate: true,
                        plan: offerFormData.subscriptionPlan,
                        endDate: offerFormData.subscriptionEndDate
                      })}
                      disabled={setOfferMutation.isPending}
                    >
                      {setOfferMutation.isPending ? 'Activation...' : 'Activer l\'offre'}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRestaurant} onOpenChange={() => setDeleteRestaurant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le restaurant ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{deleteRestaurant?.name}" ?
              Cette action supprimera également toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => removeRestaurant.mutate(deleteRestaurant.id)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}