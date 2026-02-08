import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Menu, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Sidebar from '@/components/backoffice/Sidebar';
import { toast } from 'sonner';

export default function AdminLegal() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const [rgpdData, setRgpdData] = useState({ title: '', content: '' });
  const [mentionsData, setMentionsData] = useState({ title: '', content: '' });

  useEffect(() => {
    base44.auth.me()
      .then(userData => {
        setUser(userData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const { data: legalContents = [] } = useQuery({
    queryKey: ['legal-contents'],
    queryFn: () => base44.entities.LegalContent.list(),
    enabled: user?.role === 'admin'
  });

  useEffect(() => {
    const rgpd = legalContents.find(c => c.pageKey === 'rgpd');
    const mentions = legalContents.find(c => c.pageKey === 'mentions_legales');
    
    if (rgpd) setRgpdData({ title: rgpd.title, content: rgpd.content });
    if (mentions) setMentionsData({ title: mentions.title, content: mentions.content });
  }, [legalContents]);

  const saveMutation = useMutation({
    mutationFn: async ({ pageKey, title, content }) => {
      const existing = legalContents.find(c => c.pageKey === pageKey);
      
      if (existing) {
        return base44.entities.LegalContent.update(existing.id, { title, content });
      } else {
        return base44.entities.LegalContent.create({ pageKey, title, content });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['legal-contents']);
      toast.success('Contenu sauvegardé');
    }
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h2>
          <p className="text-gray-600">Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar 
        user={user} 
        restaurant={null}
        isAdmin={true}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Pages Légales</h1>
                <p className="text-gray-600 mt-1">Gérez le contenu des pages RGPD et mentions légales</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>

            <Tabs defaultValue="rgpd" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="rgpd">RGPD</TabsTrigger>
                <TabsTrigger value="mentions">Mentions Légales</TabsTrigger>
              </TabsList>
              
              <TabsContent value="rgpd">
                <Card>
                  <CardHeader>
                    <CardTitle>Page RGPD</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Titre de la page</Label>
                      <Input
                        value={rgpdData.title}
                        onChange={(e) => setRgpdData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ex: Politique de confidentialité"
                      />
                    </div>
                    
                    <div>
                      <Label>Contenu</Label>
                      <Textarea
                        value={rgpdData.content}
                        onChange={(e) => setRgpdData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Saisissez le contenu de la page RGPD..."
                        className="min-h-[400px] font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Vous pouvez utiliser du HTML basique (p, h2, h3, ul, li, strong, em)
                      </p>
                    </div>

                    <Button
                      onClick={() => saveMutation.mutate({ 
                        pageKey: 'rgpd', 
                        title: rgpdData.title, 
                        content: rgpdData.content 
                      })}
                      disabled={saveMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="mentions">
                <Card>
                  <CardHeader>
                    <CardTitle>Mentions Légales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Titre de la page</Label>
                      <Input
                        value={mentionsData.title}
                        onChange={(e) => setMentionsData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ex: Mentions Légales"
                      />
                    </div>
                    
                    <div>
                      <Label>Contenu</Label>
                      <Textarea
                        value={mentionsData.content}
                        onChange={(e) => setMentionsData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Saisissez le contenu des mentions légales..."
                        className="min-h-[400px] font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Vous pouvez utiliser du HTML basique (p, h2, h3, ul, li, strong, em)
                      </p>
                    </div>

                    <Button
                      onClick={() => saveMutation.mutate({ 
                        pageKey: 'mentions_legales', 
                        title: mentionsData.title, 
                        content: mentionsData.content 
                      })}
                      disabled={saveMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}