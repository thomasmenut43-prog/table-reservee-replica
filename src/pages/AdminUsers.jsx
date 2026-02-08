import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Menu, Search, Users, Shield, Building2, Mail, 
  Power, UserPlus, Store, UserCircle
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
  const [activeTab, setActiveTab] = useState('restaurants');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'user',
    restaurantId: ''
  });
  const queryClient = useQueryClient();
  
  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);
  
  const isAdmin = user?.role === 'admin';
  
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin
  });
  
  const { data: restaurants = [] } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
    enabled: isAdmin
  });
  
  const updateUser = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
    }
  });
  
  const handleInvite = async () => {
    await base44.users.inviteUser(inviteData.email, inviteData.role);
    toast.success('Invitation envoyée. Vous pourrez assigner le restaurant après la première connexion.');
    setIsInviteOpen(false);
    setInviteData({ email: '', role: 'user', restaurantId: '' });
    queryClient.invalidateQueries(['all-users']);
  };
  
  const toggleDisabled = (targetUser) => {
    updateUser.mutate({
      id: targetUser.id,
      data: { isDisabled: !targetUser.isDisabled }
    });
  };
  
  const assignRestaurant = (targetUser, restaurantId) => {
    updateUser.mutate({
      id: targetUser.id,
      data: { restaurantId: restaurantId || null }
    });
  };
  
  // Separate users by category
  const restaurantUsers = users.filter(u => u.role !== 'admin' && u.restaurantId);
  const regularUsers = users.filter(u => u.role !== 'admin' && !u.restaurantId);
  const adminUsers = users.filter(u => u.role === 'admin');
  
  // Filter users based on active tab and search
  const getFilteredUsers = () => {
    let usersToFilter = [];
    if (activeTab === 'restaurants') {
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
            
            <Button onClick={() => setIsInviteOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter
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
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {filteredUsers.map(targetUser => (
                  <div key={targetUser.id} className={`p-4 ${targetUser.isDisabled ? 'opacity-50' : ''}`}>
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
                              {targetUser.role === 'admin' ? 'Admin' : 'Utilisateur'}
                            </Badge>
                            {targetUser.isDisabled && (
                              <Badge variant="destructive">Désactivé</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {targetUser.email}
                          </p>
                          {targetUser.restaurantId && (
                            <p className="text-sm text-emerald-600 flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {getRestaurantName(targetUser.restaurantId)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Select
                          value={targetUser.restaurantId || 'none'}
                          onValueChange={(value) => assignRestaurant(targetUser, value === 'none' ? null : value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Assigner restaurant" />
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
                          {targetUser.isDisabled ? 'Activer' : 'Désactiver'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
                </CardContent>
                </Card>

                {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun utilisateur trouvé</p>
                </div>
                )}
                </TabsContent>
                </Tabs>
        </main>
      </div>
      
      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un utilisateur</DialogTitle>
            <DialogDescription>
              Un email d'invitation sera envoyé à l'adresse indiquée.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={inviteData.role}
                onValueChange={(value) => setInviteData({ ...inviteData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur (Restaurateur)</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {inviteData.role === 'user' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 Pour les restaurateurs, vous pourrez assigner le restaurant après leur première connexion dans la liste des utilisateurs ci-dessus.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleInvite} disabled={!inviteData.email}>
              Envoyer l'invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}