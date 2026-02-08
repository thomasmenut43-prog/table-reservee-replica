import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Menu, Save, Building2, Clock, CreditCard, Shield, Upload, Loader2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import Sidebar from '@/components/backoffice/Sidebar';
import SubscriptionGuard from '@/components/backoffice/SubscriptionGuard';
import { compressImage } from '@/components/utils/imageCompression';

const CUISINE_TAGS = [
  'Français', 'Italien', 'Japonais', 'Chinois', 'Indien', 
  'Mexicain', 'Méditerranéen', 'Américain', 'Thaï', 'Libanais',
  'Végétarien', 'Gastronomique', 'Bistrot', 'Brasserie', 'Fruits de mer'
];

export default function BackofficeSettings() {
  const [user, setUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);
  
  const urlParams = new URLSearchParams(window.location.search);
  const urlRestaurantId = urlParams.get('restaurantId');
  const restaurantId = urlRestaurantId || user?.restaurantId;
  
  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['my-restaurant', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;
      const results = await base44.entities.Restaurant.filter({ id: restaurantId });
      return results[0];
    },
    enabled: !!restaurantId
  });
  
  useEffect(() => {
    if (restaurant) {
      setFormData(restaurant);
    }
  }, [restaurant]);
  
  const updateRestaurant = useMutation({
    mutationFn: (data) => base44.entities.Restaurant.update(restaurant.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-restaurant', restaurantId]);
      setHasChanges(false);
      toast.success('Paramètres enregistrés');
    }
  });
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };
  
  const handleTagToggle = (tag) => {
    const currentTags = formData.cuisineTags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    handleChange('cuisineTags', newTags);
  };
  
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const compressedFile = await compressImage(file);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: compressedFile });
    handleChange('coverPhoto', file_url);
    setUploading(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const currentPhotos = formData.photos || [];
    if (currentPhotos.length >= 4) {
      toast.error('Maximum 4 photos autorisées');
      return;
    }
    
    setUploading(true);
    const compressedFile = await compressImage(file);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: compressedFile });
    handleChange('photos', [...currentPhotos, file_url]);
    setUploading(false);
  };
  
  const removePhoto = (url) => {
    const newPhotos = (formData.photos || []).filter(p => p !== url);
    handleChange('photos', newPhotos);
  };
  
  const handleSave = () => {
    updateRestaurant.mutate(formData);
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
              <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>
            </div>
            
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || updateRestaurant.isPending}
            >
              {updateRestaurant.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>
        </header>
        
        {/* Content */}
        <main className="p-4 lg:p-8 max-w-4xl">
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom du restaurant</Label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Input
                      value={formData.city || ''}
                      onChange={(e) => handleChange('city', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Latitude</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={formData.latitude || ''}
                      onChange={(e) => handleChange('latitude', parseFloat(e.target.value))}
                      placeholder="Ex: 45.0437"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Longitude</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={formData.longitude || ''}
                      onChange={(e) => handleChange('longitude', parseFloat(e.target.value))}
                      placeholder="Ex: 3.8857"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Pour trouver les coordonnées exactes : 
                  <a 
                    href={`https://www.google.com/maps/search/${encodeURIComponent(formData.address + ', ' + formData.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline ml-1"
                  >
                    Ouvrir dans Google Maps
                  </a>
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Types de cuisine</Label>
                  <div className="flex flex-wrap gap-2">
                    {CUISINE_TAGS.map(tag => (
                      <Badge
                        key={tag}
                        variant={formData.cuisineTags?.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Photo de bannière</Label>
                    <p className="text-xs text-gray-500">Photo principale affichée en haut de la page</p>
                    {formData.coverPhoto ? (
                      <div className="relative group w-full h-48 rounded-lg overflow-hidden">
                        <img
                          src={formData.coverPhoto}
                          alt="Photo de bannière"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleChange('coverPhoto', '')}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        {uploading ? (
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">Cliquer pour uploader</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCoverUpload}
                        />
                      </label>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Photos du restaurant (max 4)</Label>
                    <p className="text-xs text-gray-500">Ces photos seront affichées en bas de la page</p>
                    <div className="flex flex-wrap gap-3">
                      {(formData.photos || []).map((photo, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={photo}
                            alt={`Photo ${i + 1}`}
                            className="h-24 w-24 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removePhoto(photo)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {(formData.photos || []).length < 4 && (
                        <label className="h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                          {uploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          ) : (
                            <Upload className="h-6 w-6 text-gray-400" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Booking Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Paramètres de réservation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Durée d'un repas (minutes)</Label>
                    <Input
                      type="number"
                      value={formData.mealDurationMinutes || 90}
                      onChange={(e) => handleChange('mealDurationMinutes', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Intervalle créneaux (minutes)</Label>
                    <Input
                      type="number"
                      value={formData.slotIntervalMinutes || 15}
                      onChange={(e) => handleChange('slotIntervalMinutes', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Délai minimum (minutes avant)</Label>
                    <Input
                      type="number"
                      value={formData.minAdvanceMinutes || 60}
                      onChange={(e) => handleChange('minAdvanceMinutes', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fenêtre de réservation (jours)</Label>
                    <Input
                      type="number"
                      value={formData.bookingWindowDays || 60}
                      onChange={(e) => handleChange('bookingWindowDays', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-4 border-t">
                  <div>
                    <Label>Confirmation automatique</Label>
                    <p className="text-sm text-gray-500">
                      Les réservations sont confirmées immédiatement
                    </p>
                  </div>
                  <Switch
                    checked={formData.autoConfirmEnabled ?? true}
                    onCheckedChange={(checked) => handleChange('autoConfirmEnabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between py-4 border-t">
                  <div>
                    <Label>Combinaison de tables</Label>
                    <p className="text-sm text-gray-500">
                      Autoriser le jumelage de tables pour les groupes
                    </p>
                  </div>
                  <Switch
                    checked={formData.tableJoiningEnabled ?? false}
                    onCheckedChange={(checked) => handleChange('tableJoiningEnabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between py-4 border-t">
                  <div>
                    <Label>Liste d'attente</Label>
                    <p className="text-sm text-gray-500">
                      Proposer l'inscription en liste d'attente si complet
                    </p>
                  </div>
                  <Switch
                    checked={formData.waitlistEnabled ?? true}
                    onCheckedChange={(checked) => handleChange('waitlistEnabled', checked)}
                  />
                </div>
                
                <div className="space-y-2 pt-4 border-t">
                  <Label>Seuil groupe (mise en attente auto)</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Au-delà de ce nombre de personnes, la réservation nécessite une confirmation manuelle
                  </p>
                  <Input
                    type="number"
                    value={formData.groupPendingThreshold || 8}
                    onChange={(e) => handleChange('groupPendingThreshold', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Deposit Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Acompte
                </CardTitle>
                <CardDescription>
                  Demandez un acompte pour les réservations (le paiement est géré hors plateforme)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <Label>Activer l'acompte</Label>
                  <Switch
                    checked={formData.depositEnabled ?? false}
                    onCheckedChange={(checked) => handleChange('depositEnabled', checked)}
                  />
                </div>
                
                {formData.depositEnabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={formData.depositType || 'fixed'}
                          onValueChange={(value) => handleChange('depositType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                            <SelectItem value="percent">Pourcentage (%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Valeur</Label>
                        <Input
                          type="number"
                          value={formData.depositValue || 0}
                          onChange={(e) => handleChange('depositValue', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Conditions</Label>
                      <Textarea
                        value={formData.depositConditionsText || ''}
                        onChange={(e) => handleChange('depositConditionsText', e.target.value)}
                        placeholder="Ex: L'acompte sera déduit de la note finale..."
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Anti-spam */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Anti-spam
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Max réservations par téléphone par jour</Label>
                  <Input
                    type="number"
                    value={formData.antiSpamMaxPerPhonePerDay || 3}
                    onChange={(e) => handleChange('antiSpamMaxPerPhonePerDay', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}