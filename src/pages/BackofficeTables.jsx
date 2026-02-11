import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Plus, Menu, Edit2, Trash2, Users, MapPin, Link2, Ban, CheckCircle, Sun, Moon
} from 'lucide-react';
import { toast } from 'sonner';
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
import Sidebar from '@/components/backoffice/Sidebar';
import SubscriptionGuard from '@/components/backoffice/SubscriptionGuard';
import TableMapBuilder from '@/components/backoffice/TableMapBuilder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ZONES = [
  { value: 'main', label: 'Salle' },
  { value: 'terrace', label: 'Terrasse' },
  { value: 'private', label: 'Salon privé' }
];

export default function BackofficeTables() {
  const [user, setUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [deleteTable, setDeleteTable] = useState(null);
  const [blockDialog, setBlockDialog] = useState({ open: false, table: null });
  const [blockService, setBlockService] = useState('MIDI');
  const [blockSoirService, setBlockSoirService] = useState(1);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState(null);
  const [floorPlanDialog, setFloorPlanDialog] = useState({ open: false, plan: null });
  const [floorPlanName, setFloorPlanName] = useState('');
  const [clearDataDialog, setClearDataDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 2,
    zone: 'salle',
    isActive: true,
    isJoinable: false,
    tableShape: 'square',
    width: 3,
    height: 2,
    x: null,
    y: null
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

  const { data: floorPlans = [] } = useQuery({
    queryKey: ['floor-plans', restaurantId],
    queryFn: () => base44.entities.FloorPlan.filter({ restaurantId }),
    enabled: !!restaurantId
  });

  // Auto-select first floor plan or default
  useEffect(() => {
    if (floorPlans.length > 0 && !selectedFloorPlan) {
      const defaultPlan = floorPlans.find(p => p.isDefault) || floorPlans[0];
      setSelectedFloorPlan(defaultPlan.id);
    }
  }, [floorPlans]);

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables', restaurantId, selectedFloorPlan],
    queryFn: () => base44.entities.Table.filter({ restaurantId, floorPlanId: selectedFloorPlan }),
    enabled: !!restaurantId && !!selectedFloorPlan
  });

  const { data: mapObjects = [] } = useQuery({
    queryKey: ['map-objects', restaurantId, selectedFloorPlan],
    queryFn: () => base44.entities.MapObject.filter({ restaurantId, floorPlanId: selectedFloorPlan }),
    enabled: !!restaurantId && !!selectedFloorPlan
  });

  const { data: currentBlocks = [] } = useQuery({
    queryKey: ['current-blocks', restaurantId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const blocks = await base44.entities.TableBlock.filter({ restaurantId });
      return blocks.filter(b => new Date(b.endDateTime) > new Date(now));
    },
    enabled: !!restaurantId
  });

  // Real-time sync for table blocks
  useEffect(() => {
    if (!restaurantId) return;

    const unsubscribe = base44.entities.TableBlock.subscribe(() => {
      queryClient.invalidateQueries(['current-blocks', restaurantId]);
    });

    return unsubscribe;
  }, [restaurantId, queryClient]);

  const createFloorPlan = useMutation({
    mutationFn: (data) => {
      console.log('Creating floor plan:', data);
      return base44.entities.FloorPlan.create(data);
    },
    onSuccess: (newPlan) => {
      console.log('Floor plan created:', newPlan);
      queryClient.invalidateQueries(['floor-plans', restaurantId]);
      setSelectedFloorPlan(newPlan.id);
      setFloorPlanDialog({ open: false, plan: null });
      setFloorPlanName('');
      toast.success('Plan de salle créé');
    },
    onError: (error) => {
      console.error('Error creating floor plan:', error);
      toast.error("Erreur lors de la création du plan: " + error.message);
    }
  });

  const updateFloorPlan = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FloorPlan.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['floor-plans', restaurantId]);
      setFloorPlanDialog({ open: false, plan: null });
      setFloorPlanName('');
    }
  });

  const deleteFloorPlan = useMutation({
    mutationFn: (id) => base44.entities.FloorPlan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['floor-plans', restaurantId]);
      setSelectedFloorPlan(floorPlans.find(p => p.id !== floorPlanDialog.plan?.id)?.id || null);
      setFloorPlanDialog({ open: false, plan: null });
    }
  });

  const createTable = useMutation({
    mutationFn: (data) => {
      const { capacity, width, height, tableShape, zone, isActive, isJoinable, ...rest } = data;
      return base44.entities.Table.create({
        ...rest,
        restaurantId,
        floorPlanId: selectedFloorPlan,
        seats: capacity,
        shape: tableShape === 'round' ? 'round' : 'square',
        zone: zone,
        isJoinable: isJoinable,
        status: 'available',
        position_x: data.x || Math.floor(Math.random() * 20) * 20,
        position_y: data.y || Math.floor(Math.random() * 15) * 20,
        width: width * 20,
        height: height * 20
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tables', restaurantId, selectedFloorPlan]);
      setIsDialogOpen(false);
      resetForm();
      toast.success('Table créée');
    },
    onError: (error) => {
      console.error('Error creating table:', error);
      toast.error("Erreur lors de la création de la table: " + error.message);
    }
  });

  const updateTable = useMutation({
    mutationFn: ({ id, data }) => {
      const { capacity, width, height, tableShape, zone, isActive, isJoinable, ...rest } = data;
      return base44.entities.Table.update(id, {
        ...rest,
        seats: capacity,
        shape: tableShape === 'round' ? 'round' : 'square',
        zone: zone,
        isJoinable: isJoinable,
        width: width * 20,
        height: height * 20
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tables', restaurantId, selectedFloorPlan]);
      setIsDialogOpen(false);
      resetForm();
      toast.success('Table mise à jour');
    },
    onError: (error) => {
      console.error('Error updating table:', error);
      toast.error("Erreur lors de la modification: " + error.message);
    }
  });

  const removeTable = useMutation({
    mutationFn: (id) => base44.entities.Table.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tables', restaurantId, selectedFloorPlan]);
      setDeleteTable(null);
      toast.success('Table supprimée');
    },
    onError: (error) => {
      console.error('Error deleting table:', error);
      toast.error("Erreur lors de la suppression: " + error.message);
    }
  });

  const blockTable = useMutation({
    mutationFn: ({ tableId, service, soirService }) => {
      const today = new Date();
      let startDateTime, endDateTime;

      if (service === 'MIDI') {
        startDateTime = new Date(today.setHours(0, 0, 0, 0));
        endDateTime = new Date(today.setHours(16, 0, 0, 0));
      } else {
        if (soirService === 1) {
          startDateTime = new Date(today.setHours(18, 0, 0, 0));
          endDateTime = new Date(today.setHours(21, 0, 0, 0));
        } else {
          startDateTime = new Date(today.setHours(21, 0, 0, 0));
          endDateTime = new Date(today.setHours(23, 59, 59, 999));
        }
      }

      return base44.entities.TableBlock.create({
        restaurantId,
        tableId,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        reason: `Table occupée - Service ${service === 'MIDI' ? 'Midi' : `Soir ${soirService}`}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['current-blocks', restaurantId]);
      setBlockDialog({ open: false, table: null });
      setBlockService('MIDI');
      setBlockSoirService(1);
    }
  });

  const unblockTable = useMutation({
    mutationFn: (blockId) => base44.entities.TableBlock.delete(blockId),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-blocks', restaurantId]);
    }
  });

  const clearAllData = useMutation({
    mutationFn: async () => {
      // Delete all tables
      await Promise.all(tables.map(t => base44.entities.Table.delete(t.id)));
      // Delete all map objects
      await Promise.all(mapObjects.map(o => base44.entities.MapObject.delete(o.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tables', restaurantId, selectedFloorPlan]);
      queryClient.invalidateQueries(['map-objects', restaurantId, selectedFloorPlan]);
    }
  });

  const resetForm = () => {
    setEditingTable(null);
    setFormData({
      name: '',
      capacity: 2,
      zone: 'main',
      isActive: true,
      isJoinable: false,
      tableShape: 'square',
      width: 3,
      height: 2,
      x: null,
      y: null
    });
  };

  const openEditDialog = (table) => {
    setEditingTable(table);
    setFormData({
      name: table.name,
      capacity: table.seats || table.capacity,
      zone: table.zone,
      isActive: table.status === 'available',
      isJoinable: table.isJoinable || false,
      tableShape: table.shape === 'round' ? 'round' : 'square',
      width: Math.round((table.width || 60) / 20),
      height: Math.round((table.height || 60) / 20),
      x: table.position_x,
      y: table.position_y
    });
    setIsDialogOpen(true);
  };

  const handleUpdatePosition = async (tableId, position) => {
    await updateTable.mutateAsync({
      id: tableId,
      data: position
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTable) {
      updateTable.mutate({ id: editingTable.id, data: formData });
    } else {
      createTable.mutate(formData);
    }
  };

  // Check if table is currently blocked
  const isTableBlocked = (tableId) => {
    return currentBlocks.some(b => b.tableId === tableId);
  };

  const getTableBlock = (tableId) => {
    return currentBlocks.find(b => b.tableId === tableId);
  };

  // Group tables by zone
  const tablesByZone = ZONES.map(zone => ({
    ...zone,
    tables: tables.filter(t => t.zone === zone.value)
  }));

  const totalCapacity = tables.filter(t => t.status === 'available').reduce((sum, t) => sum + (t.seats || t.capacity), 0);

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
                <h1 className="text-xl font-bold text-gray-900">Gestion des tables</h1>
                <p className="text-sm text-gray-500">
                  {tables.length} tables • {totalCapacity} places
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {floorPlans.length > 0 && (
                <>
                  <Select value={selectedFloorPlan} onValueChange={setSelectedFloorPlan}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {floorPlans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const currentPlan = floorPlans.find(p => p.id === selectedFloorPlan);
                      setFloorPlanDialog({ open: true, plan: currentPlan });
                      setFloorPlanName(currentPlan?.name || '');
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setFloorPlanDialog({ open: true, plan: null });
                  setFloorPlanName('');
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau plan
              </Button>
              {(tables.length > 0 || mapObjects.length > 0) && (
                <Button
                  variant="destructive"
                  onClick={() => setClearDataDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              )}
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une table
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-8">
          <SubscriptionGuard user={user}>
            <Tabs defaultValue="visual" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="visual">Vue visuelle</TabsTrigger>
                <TabsTrigger value="list">Vue liste</TabsTrigger>
              </TabsList>

              <TabsContent value="visual" className="space-y-6">
                {selectedFloorPlan ? (
                  <TableMapBuilder
                    restaurantId={restaurantId}
                    floorPlanId={selectedFloorPlan}
                    tables={tables}
                    mapObjects={mapObjects}
                  />
                ) : (
                  <div className="text-center py-12 bg-gray-100 rounded-xl">
                    <p className="text-gray-600 mb-4">Aucun plan de table créé</p>
                    <Button onClick={() => setFloorPlanDialog({ open: true, plan: null })}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un plan
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="list">
                {tablesByZone.map(zone => (
                  <div key={zone.value} className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <h2 className="text-lg font-semibold text-gray-900">{zone.label}</h2>
                      <Badge variant="secondary">
                        {zone.tables.length} table{zone.tables.length > 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {zone.tables.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {zone.tables.map(table => {
                          const blocked = isTableBlocked(table.id);
                          const block = getTableBlock(table.id);
                          return (
                            <Card key={table.id} className={table.status === 'blocked' ? 'opacity-60' : blocked ? 'border-red-300 bg-red-50' : ''}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="font-semibold text-lg">{table.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                      <Users className="h-4 w-4" />
                                      {table.seats || table.capacity} places
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEditDialog(table)}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setDeleteTable(table)}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    {table.status === 'blocked' && (
                                      <Badge variant="outline" className="text-gray-500">
                                        Bloquée
                                      </Badge>
                                    )}
                                    {table.isJoinable && (
                                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                                        <Link2 className="h-3 w-3 mr-1" />
                                        Jumelable
                                      </Badge>
                                    )}
                                    {blocked && (
                                      <Badge className="bg-red-600">
                                        <Ban className="h-3 w-3 mr-1" />
                                        Occupée
                                      </Badge>
                                    )}
                                  </div>

                                  {blocked ? (
                                    <div className="pt-2 border-t">
                                      <p className="text-xs text-gray-600 mb-2">
                                        Disponible vers {new Date(block.endDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => unblockTable.mutate(block.id)}
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Libérer maintenant
                                      </Button>
                                    </div>
                                  ) : table.status === 'available' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full mt-2"
                                      onClick={() => setBlockDialog({ open: true, table })}
                                    >
                                      <Ban className="h-3 w-3 mr-1" />
                                      Marquer occupée
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-gray-100 rounded-xl p-8 text-center text-gray-500">
                        Aucune table dans cette zone
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </SubscriptionGuard>
        </main>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTable ? 'Modifier la table' : 'Ajouter une table'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom / Numéro</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Table 1, T12..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Capacité (places)</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Zone</Label>
              <Select
                value={formData.zone}
                onValueChange={(value) => setFormData({ ...formData, zone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZONES.map(zone => (
                    <SelectItem key={zone.value} value={zone.value}>
                      {zone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Forme de la table</Label>
              <Select
                value={formData.tableShape}
                onValueChange={(value) => setFormData({ ...formData, tableShape: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Carrée / Rectangulaire</SelectItem>
                  <SelectItem value="round">Ronde</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Table active</Label>
                <p className="text-sm text-gray-500">
                  Les tables inactives ne sont pas proposées
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Table jumelable</Label>
                <p className="text-sm text-gray-500">
                  Peut être combinée avec une autre table
                </p>
              </div>
              <Switch
                checked={formData.isJoinable}
                onCheckedChange={(checked) => setFormData({ ...formData, isJoinable: checked })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Largeur visuelle</Label>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hauteur visuelle</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createTable.isPending || updateTable.isPending}>
                {editingTable ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTable} onOpenChange={() => setDeleteTable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la table ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la table "{deleteTable?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => removeTable.mutate(deleteTable.id)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floor Plan Dialog */}
      <Dialog open={floorPlanDialog.open} onOpenChange={(open) => setFloorPlanDialog({ open, plan: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {floorPlanDialog.plan ? 'Modifier le plan' : 'Nouveau plan de table'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du plan</Label>
              <Input
                value={floorPlanName}
                onChange={(e) => setFloorPlanName(e.target.value)}
                placeholder="Ex: Salle principale, Terrasse, Étage..."
              />
            </div>
          </div>

          <DialogFooter>
            {floorPlanDialog.plan && (
              <Button
                variant="destructive"
                onClick={() => deleteFloorPlan.mutate(floorPlanDialog.plan.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setFloorPlanDialog({ open: false, plan: null })}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (!restaurantId) {
                  toast.error("Erreur: Identifiant du restaurant manquant");
                  return;
                }
                if (!floorPlanName.trim()) {
                  toast.error("Veuillez entrer un nom pour le plan");
                  return;
                }

                if (floorPlanDialog.plan) {
                  updateFloorPlan.mutate({
                    id: floorPlanDialog.plan.id,
                    data: { name: floorPlanName }
                  });
                } else {
                  createFloorPlan.mutate({
                    restaurantId,
                    name: floorPlanName,
                    isDefault: floorPlans.length === 0
                  });
                }
              }}
              disabled={!floorPlanName.trim() || createFloorPlan.isPending || updateFloorPlan.isPending}
            >
              {floorPlanDialog.plan ? 'Enregistrer' : 'Créer'}
              {(createFloorPlan.isPending || updateFloorPlan.isPending) && (
                <span className="ml-2 animate-spin">⌛</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Data Dialog */}
      <AlertDialog open={clearDataDialog} onOpenChange={setClearDataDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser le plan ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera toutes les tables ({tables.length}) et tous les objets de décoration ({mapObjects.length}) du plan actuel.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                clearAllData.mutate();
                setClearDataDialog(false);
              }}
              disabled={clearAllData.isPending}
            >
              {clearAllData.isPending ? 'Suppression...' : 'Tout supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Table Dialog */}
      <Dialog open={blockDialog.open} onOpenChange={(open) => setBlockDialog({ open, table: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer la table comme occupée</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Table : <strong>{blockDialog.table?.name}</strong>
            </p>

            <div className="space-y-2">
              <Label>Service d'occupation</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={blockService === 'MIDI' ? 'default' : 'outline'}
                  onClick={() => setBlockService('MIDI')}
                  className="justify-start"
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Midi
                </Button>
                <Button
                  type="button"
                  variant={blockService === 'SOIR' ? 'default' : 'outline'}
                  onClick={() => setBlockService('SOIR')}
                  className="justify-start"
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Soir
                </Button>
              </div>
            </div>

            {blockService === 'SOIR' && (
              <div className="space-y-2">
                <Label>Service soir</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={blockSoirService === 1 ? 'default' : 'outline'}
                    onClick={() => setBlockSoirService(1)}
                  >
                    Service 1
                    <span className="text-xs ml-1">(18h-21h)</span>
                  </Button>
                  <Button
                    type="button"
                    variant={blockSoirService === 2 ? 'default' : 'outline'}
                    onClick={() => setBlockSoirService(2)}
                  >
                    Service 2
                    <span className="text-xs ml-1">(21h-00h)</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBlockDialog({ open: false, table: null })}
            >
              Annuler
            </Button>
            <Button
              onClick={() => blockTable.mutate({
                tableId: blockDialog.table?.id,
                service: blockService,
                soirService: blockSoirService
              })}
              disabled={blockTable.isPending}
            >
              <Ban className="h-4 w-4 mr-2" />
              Marquer occupée
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}