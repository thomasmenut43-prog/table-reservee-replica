import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Menu, Save, Palette, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Sidebar from '@/components/backoffice/Sidebar';
import { toast } from 'sonner';
import { compressImage } from '@/components/utils/imageCompression';

export default function AdminDesign() {
  const [user, setUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    logoUrl: '',
    heroTitle: 'Réservez votre table',
    heroSubtitle: 'en quelques clics',
    heroDescription: 'Découvrez les meilleurs restaurants de votre ville et réservez facilement votre table pour le déjeuner ou le dîner.',
    bannerAdUrl: '',
    bannerAdLink: ''
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const isAdmin = user?.role === 'admin';

  const { data: settings } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const result = await base44.entities.PlatformSettings.filter({ settingKey: 'design' });
      return result[0] || null;
    },
    enabled: isAdmin
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        logoUrl: settings.logoUrl || '',
        heroTitle: settings.heroTitle || 'Réservez votre table',
        heroSubtitle: settings.heroSubtitle || 'en quelques clics',
        heroDescription: settings.heroDescription || 'Découvrez les meilleurs restaurants de votre ville et réservez facilement votre table pour le déjeuner ou le dîner.',
        bannerAdUrl: settings.bannerAdUrl || '',
        bannerAdLink: settings.bannerAdLink || ''
      });
    }
  }, [settings]);

  const saveSettings = useMutation({
    mutationFn: async (data) => {
      if (settings) {
        return base44.entities.PlatformSettings.update(settings.id, data);
      } else {
        return base44.entities.PlatformSettings.create({ ...data, settingKey: 'design' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['platform-settings']);
      toast.success('Paramètres enregistrés avec succès');
    },
    onError: (err) => toast.error(err?.message || 'Impossible d\'enregistrer les paramètres')
  });

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressedFile = await compressImage(file);
      const result = await base44.integrations.Core.UploadFile({ file: compressedFile, folder: 'design' });
      setFormData({ ...formData, logoUrl: result.file_url });
      toast.success('Logo téléchargé avec succès');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveSettings.mutate(formData);
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
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold text-gray-900">Design & Personnalisation</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-8">
          <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
            {/* Logo Section */}
            <Card>
              <CardHeader>
                <CardTitle>Logo de la plateforme</CardTitle>
                <CardDescription>
                  Personnalisez le logo affiché dans le header et footer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>URL du logo</Label>
                  <Input
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://exemple.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ou télécharger un logo</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload').click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? 'Téléchargement...' : 'Télécharger'}
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogo}
                      className="hidden"
                    />
                  </div>
                </div>

                {formData.logoUrl && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <Label className="mb-2 block">Aperçu</Label>
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      className="h-12 object-contain"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hero Section */}
            <Card>
              <CardHeader>
                <CardTitle>Bannière d'accueil</CardTitle>
                <CardDescription>
                  Personnalisez les textes de la section hero sur la page d'accueil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre principal</Label>
                  <Input
                    value={formData.heroTitle}
                    onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                    placeholder="Réservez votre table"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sous-titre (texte en surbrillance)</Label>
                  <Input
                    value={formData.heroSubtitle}
                    onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                    placeholder="en quelques clics"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.heroDescription}
                    onChange={(e) => setFormData({ ...formData, heroDescription: e.target.value })}
                    placeholder="Découvrez les meilleurs restaurants..."
                    rows={3}
                  />
                </div>

                <div className="border rounded-lg p-4 bg-gray-50">
                  <Label className="mb-2 block">Aperçu</Label>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {formData.heroTitle}
                      <br />
                      <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                        {formData.heroSubtitle}
                      </span>
                    </h3>
                    <p className="text-gray-600">{formData.heroDescription}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Banner Ad Section */}
            <Card>
              <CardHeader>
                <CardTitle>Bannière publicitaire</CardTitle>
                <CardDescription>
                  Ajoutez une bannière publicitaire en bas de la page d'accueil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>URL de la bannière</Label>
                  <Input
                    value={formData.bannerAdUrl}
                    onChange={(e) => setFormData({ ...formData, bannerAdUrl: e.target.value })}
                    placeholder="https://exemple.com/banner.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ou télécharger une bannière</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('banner-upload').click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? 'Téléchargement...' : 'Télécharger'}
                    </Button>
                    <input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploading(true);
                        try {
                          const compressedFile = await compressImage(file);
                          const result = await base44.integrations.Core.UploadFile({ file: compressedFile, folder: 'design' });
                          setFormData({ ...formData, bannerAdUrl: result.file_url });
                          toast.success('Bannière téléchargée avec succès');
                        } catch (error) {
                          console.error(error);
                          toast.error('Erreur lors du téléchargement');
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Lien de destination (optionnel)</Label>
                  <Input
                    value={formData.bannerAdLink}
                    onChange={(e) => setFormData({ ...formData, bannerAdLink: e.target.value })}
                    placeholder="https://exemple.com"
                  />
                </div>

                {formData.bannerAdUrl && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <Label className="mb-2 block">Aperçu</Label>
                    <img
                      src={formData.bannerAdUrl}
                      alt="Bannière pub"
                      className="w-full rounded-lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saveSettings.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}