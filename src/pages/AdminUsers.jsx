import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { userManagement } from '@/lib/supabaseClient';
import {
  Menu, Search, Users, Shield, Building2, Mail,
  Power, UserPlus, Store, UserCircle, Eye, EyeOff, Loader2
} from 'lucide-react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Sidebar from '@/components/backoffice/Sidebar';

export default function AdminUsers() {
  const [user, setUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createData, setCreateData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'restaurateur',
    restaurantId: ''
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const isAdmin = user?.role === 'admin';

  // Fetch users from Supabase profiles table
  const { data: users = [], isLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['supabase-profiles'],
    queryFn: async () => {
      try {
        return await userManagement.getProfiles();
      } catch (error) {
        console.error('Error fetching profiles:', error);
        // Fallback to local storage if profiles table doesn't exist yet
        return await base44.entities.User.list();
      }
    },
    enabled: isAdmin
  });

  const { data: restaurants = [] } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
    enabled: isAdmin
  });

  // Handle user creation
  const handleCreateUser = async () => {
    if (!createData.email || !createData.password) {
      toast.error('Email et mot de passe requis');
      return;
    }

    if (createData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsCreating(true);
    try {
      const newUser = await userManagement.createUserWithProfile(
        createData.email,
        createData.password,
        {
          full_name: createData.full_name || createData.email.split('@')[0],
          role: createData.role,
          restaurantId: createData.restaurantId || null
        }
      );

      if (newUser.needsEmailConfirmation) {
        toast.success(`Utilisateur créé ! Un email de confirmation a été envoyé à ${createData.email}`);
      } else {
        toast.success('Utilisateur créé avec succès !');
      }

      setIsCreateOpen(false);
      setCreateData({ email: '', password: '', full_name: '', role: 'restaurateur', restaurantId: '' });
      refetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.message?.includes('already registered')) {
        toast.error('Cet email est déjà utilisé');
      } else {
        toast.error(`Erreur: ${error.message}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle user disabled status
  const toggleDisabled = async (targetUser) => {
    try {
      await userManagement.toggleUserDisabled(targetUser.id, !targetUser.is_disabled);
      toast.success(targetUser.is_disabled ? 'Utilisateur activé' : 'Utilisateur désactivé');
      refetchUsers();
    } catch (error) {
      console.error('Error toggling user:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  // Assign restaurant to user
  const assignRestaurant = async (targetUser, restaurantId) => {
    try {
      await userManagement.assignRestaurant(targetUser.id, restaurantId || null);
      toast.success('Restaurant assigné');
      refetchUsers();
    } catch (error) {
      console.error('Error assigning restaurant:', error);
      toast.error('Erreur lors de l\'assignation');
    }
  };

  // Change user role
  const changeRole = async (targetUser, newRole) => {
    try {
      await userManagement.updateProfile(targetUser.id, { role: newRole });
      const roleLabel = { admin: 'Admin', restaurateur: 'Restaurateur', utilisateur: 'Utilisateur' }[newRole] || newRole;
      toast.success(`Rôle changé en ${roleLabel}`);
      refetchUsers();
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Erreur lors du changement de rôle');
    }
  };

  // Separate users by category
  const restaurantUsers = users.filter(u => u.role !== 'admin' && u.restaurant_id);
  const regularUsers = users.filter(u => u.role !== 'admin' && !u.restaurant_id);
  const adminUsers = users.filter(u => u.role === 'admin');

  // Filter users based on active tab and search
  const getFilteredUsers = () => {
    let usersToFilter = [];
    if (activeTab === 'all') {
      usersToFilter = users;
    } else if (activeTab === 'restaurants') {
      usersToFilter = restaurantUsers;
    } else if (activeTab === 'users') {
      usersToFilter = regularUsers;
    } else {
      usersToFilter = adminUsers;
    }

    if (!searchQuery) return usersToFilter;
    const query = searchQuery.toLowerCase();
    return usersToFilter.filter(u =>
      u.email?.toLowerCase().includes(query) || u.full_name?.toLowerCase().includes(query)
    );
  };

  const filteredUsers = getFilteredUsers();

  // Get restaurant name
  const getRestaurantName = (restaurantId) => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    return restaurant?.name || null;
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
              <h1 className="text-xl font-bold text-gray-900">Utilisateurs</h1>
            </div>

            <Button onClick={() => setIsCreateOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Créer un utilisateur
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Store className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{restaurantUsers.length}</p>
                  <p className="text-sm text-gray-500">Restaurateurs</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <UserCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{regularUsers.length}</p>
                  <p className="text-sm text-gray-500">Utilisateurs</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{adminUsers.length}</p>
                  <p className="text-sm text-gray-500">Admins</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">
                <Users className="h-4 w-4 mr-2" />
                Tous les utilisateurs ({users.length})
              </TabsTrigger>
              <TabsTrigger value="restaurants">
                <Store className="h-4 w-4 mr-2" />
                Restaurateurs ({restaurantUsers.length})
              </TabsTrigger>
              <TabsTrigger value="users">
                <UserCircle className="h-4 w-4 mr-2" />
                Utilisateurs ({regularUsers.length})
              </TabsTrigger>
              <TabsTrigger value="admins">
                <Shield className="h-4 w-4 mr-2" />
                Admins ({adminUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {filteredUsers.map(targetUser => (
                        <div key={targetUser.id} className={`p-4 ${targetUser.is_disabled ? 'opacity-50' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="font-medium text-gray-600">
                                  {targetUser.full_name?.[0] || targetUser.email?.[0] || '?'}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{targetUser.full_name || 'Sans nom'}</p>
                                  <Badge variant={targetUser.role === 'admin' ? 'default' : 'secondary'}>
                                    {targetUser.role === 'admin' ? 'Admin' : targetUser.role === 'utilisateur' ? 'Utilisateur' : 'Restaurateur'}
                                  </Badge>
                                  {targetUser.is_disabled && (
                                    <Badge variant="destructive">Désactivé</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {targetUser.email}
                                </p>
                                {targetUser.restaurant_id && (
                                  <p className="text-sm text-emerald-600 flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {getRestaurantName(targetUser.restaurant_id)}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Role selector */}
                              <Select
                                value={targetUser.role || 'restaurateur'}
                                onValueChange={(value) => changeRole(targetUser, value)}
                                disabled={targetUser.id === user?.id}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue placeholder="Rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="utilisateur">Utilisateur</SelectItem>
                                  <SelectItem value="restaurateur">Restaurateur</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>

                              {/* Restaurant selector */}
                              <Select
                                value={targetUser.restaurant_id || 'none'}
                                onValueChange={(value) => assignRestaurant(targetUser, value === 'none' ? null : value)}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Restaurant" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Aucun restaurant</SelectItem>
                                  {restaurants.map(restaurant => (
                                    <SelectItem key={restaurant.id} value={restaurant.id}>
                                      {restaurant.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleDisabled(targetUser)}
                                disabled={targetUser.id === user?.id}
                              >
                                <Power className="h-4 w-4 mr-1" />
                                {targetUser.is_disabled ? 'Activer' : 'Désactiver'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {!isLoading && filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun utilisateur trouvé</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un utilisateur</DialogTitle>
            <DialogDescription>
              L'utilisateur recevra un email de confirmation pour activer son compte.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom complet</Label>
              <Input
                value={createData.full_name}
                onChange={(e) => setCreateData({ ...createData, full_name: e.target.value })}
                placeholder="Jean Dupont"
              />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={createData.email}
                onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Mot de passe temporaire *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={createData.password}
                  onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                  placeholder="Minimum 6 caractères"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">L'utilisateur pourra changer son mot de passe après connexion</p>
            </div>

            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={createData.role}
                onValueChange={(value) => setCreateData({ ...createData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utilisateur">Utilisateur</SelectItem>
                  <SelectItem value="restaurateur">Restaurateur</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(createData.role === 'restaurateur' || createData.role === 'utilisateur') && (
              <div className="space-y-2">
                <Label>Restaurant (optionnel)</Label>
                <Select
                  value={createData.restaurantId || 'none'}
                  onValueChange={(value) => setCreateData({ ...createData, restaurantId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assigner plus tard" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Assigner plus tard</SelectItem>
                    {restaurants.map(restaurant => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              Annuler
            </Button>
            <Button onClick={handleCreateUser} disabled={!createData.email || !createData.password || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer l\'utilisateur'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}