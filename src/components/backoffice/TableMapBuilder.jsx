import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { 
  Square, Circle, RectangleHorizontal, Building2, Palmtree, 
  Wine, Edit2, Trash2, Lock, Unlock, Users, Plus, ZoomIn, 
  ZoomOut, RotateCw, Move, Ban, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function TableMapBuilder({ restaurantId, floorPlanId, tables, mapObjects }) {
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [resizeSize, setResizeSize] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [editDialog, setEditDialog] = useState({ open: false, item: null });
  const [formData, setFormData] = useState({});
  const canvasRef = useRef(null);
  const queryClient = useQueryClient();
  const dragPositionRef = useRef(null);
  const hasMovedRef = useRef(false);
  const resizeRef = useRef({ startX: 0, startY: 0, startWidth: 0, startHeight: 0 });
  const resizeSizeRef = useRef(null);

  const canvasWidth = 800;
  const canvasHeight = 600;

  // Mutations
  const createTableMutation = useMutation({
    mutationFn: (data) => base44.entities.Table.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tables', restaurantId, floorPlanId]);
    }
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Table.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries(['tables', restaurantId, floorPlanId]);
      const previousTables = queryClient.getQueryData(['tables', restaurantId, floorPlanId]);
      queryClient.setQueryData(['tables', restaurantId, floorPlanId], old => 
        old?.map(t => t.id === id ? { ...t, ...data } : t)
      );
      return { previousTables };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['tables', restaurantId, floorPlanId], context.previousTables);
      toast.error(err?.message || 'Impossible d\'enregistrer la table');
    },
    onSettled: () => {
      queryClient.invalidateQueries(['tables', restaurantId, floorPlanId]);
    }
  });

  const deleteTableMutation = useMutation({
    mutationFn: (id) => base44.entities.Table.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tables', restaurantId, floorPlanId]);
    },
    onError: (err) => toast.error(err?.message || 'Impossible de supprimer la table')
  });

  const createObjectMutation = useMutation({
    mutationFn: (data) => base44.entities.MapObject.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['map-objects', restaurantId, floorPlanId]);
    },
    onError: (err) => {
      toast.error(err?.message || 'Impossible d\'ajouter l\'élément');
    }
  });

  const updateObjectMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MapObject.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries(['map-objects', restaurantId, floorPlanId]);
      const previousObjects = queryClient.getQueryData(['map-objects', restaurantId, floorPlanId]);
      queryClient.setQueryData(['map-objects', restaurantId, floorPlanId], old => 
        old?.map(o => o.id === id ? { ...o, ...data } : o)
      );
      return { previousObjects };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['map-objects', restaurantId, floorPlanId], context.previousObjects);
      toast.error(err?.message || 'Impossible d\'enregistrer l\'élément');
    },
    onSettled: () => {
      queryClient.invalidateQueries(['map-objects', restaurantId, floorPlanId]);
    }
  });

  const deleteObjectMutation = useMutation({
    mutationFn: (id) => base44.entities.MapObject.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['map-objects', restaurantId, floorPlanId]);
    },
    onError: (err) => toast.error(err?.message || 'Impossible de supprimer l\'élément')
  });



  const MIN_WIDTH = 20;
  const MIN_HEIGHT = 20;

  // Resize: start
  const handleResizeStart = (e, item, isTable) => {
    e.stopPropagation();
    e.preventDefault();
    if (item.locked) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x0 = (e.clientX - rect.left) / zoom;
    const y0 = (e.clientY - rect.top) / zoom;
    const w0 = item.width ?? 60;
    const h0 = item.height ?? 40;
    resizeRef.current = { startX: x0, startY: y0, startWidth: w0, startHeight: h0 };
    setResizing({ item, isTable });
    setResizeSize({ width: w0, height: h0 });
  };

  // Resize: move & end
  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      const { startX, startY, startWidth, startHeight } = resizeRef.current;
      const newWidth = Math.max(MIN_WIDTH, Math.round(startWidth + (x - startX)));
      const newHeight = Math.max(MIN_HEIGHT, Math.round(startHeight + (y - startY)));
      resizeSizeRef.current = { width: newWidth, height: newHeight };
      setResizeSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      const size = resizeSizeRef.current;
      if (size && resizing) {
        if (resizing.isTable) {
          updateTableMutation.mutate({
            id: resizing.item.id,
            data: { width: size.width, height: size.height }
          });
        } else {
          updateObjectMutation.mutate({
            id: resizing.item.id,
            data: { width: size.width, height: size.height }
          });
        }
      }
      setResizing(null);
      setResizeSize(null);
      resizeSizeRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, zoom]);

  // Handle canvas click to add items (only objects, not tables)
  const handleCanvasClick = (e) => {
    if (!selectedTool || !canvasRef.current || dragging || resizing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, (e.clientX - rect.left) / zoom);
    const y = Math.max(0, (e.clientY - rect.top) / zoom);

    const objectSizes = {
      wall: { width: 200, height: 20 },
      pillar: { width: 40, height: 40 },
      plant: { width: 50, height: 50 },
      bar: { width: 150, height: 80 },
      decor: { width: 60, height: 60 }
    };

    const size = objectSizes[selectedTool] || { width: 60, height: 60 };
    
    createObjectMutation.mutate({
      restaurantId,
      floorPlanId,
      type: selectedTool,
      position_x: x,
      position_y: y,
      ...size,
      rotation: 0,
      color: selectedTool === 'wall' ? '#6B7280' : selectedTool === 'plant' ? '#10B981' : '#8B5CF6'
    });

    setSelectedTool(null);
  };

  // Handle drag start
  const handleDragStart = (e, item, isTable) => {
    e.stopPropagation();
    e.preventDefault();
    if (item.locked || resizing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    hasMovedRef.current = false;
    dragPositionRef.current = null;
    setDragging({ item, isTable, hasMoved: false });
    setDragOffset({
      x: (e.clientX - rect.left) / zoom - (item.position_x ?? item.positionX ?? 0),
      y: (e.clientY - rect.top) / zoom - (item.position_y ?? item.positionY ?? 0)
    });
  };

  // Handle drag
  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom - dragOffset.x;
      const y = (e.clientY - rect.top) / zoom - dragOffset.y;

      hasMovedRef.current = true;
      dragPositionRef.current = { x, y };
      setDragPosition({ x, y });
    };

    const handleMouseUp = () => {
      const savedPosition = dragPositionRef.current;
      const didMove = hasMovedRef.current;

      if (didMove && savedPosition) {
        const posX = Math.round(Number(savedPosition.x));
        const posY = Math.round(Number(savedPosition.y));
        if (dragging.isTable) {
          updateTableMutation.mutate({ 
            id: dragging.item.id, 
            data: { position_x: posX, position_y: posY } 
          });
        } else {
          updateObjectMutation.mutate({ 
            id: dragging.item.id, 
            data: { position_x: posX, position_y: posY } 
          });
        }
      }

      setDragging(null);
      setDragPosition(null);
      dragPositionRef.current = null;
      hasMovedRef.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragOffset, zoom]);

  // Open edit dialog
  const openEditDialog = (item, isTable) => {
    setEditDialog({ open: true, item, isTable });
    setFormData(item);
  };

  // Handle save
  const handleSave = () => {
    if (editDialog.isTable) {
      updateTableMutation.mutate({ id: formData.id, data: formData });
    } else {
      updateObjectMutation.mutate({ id: formData.id, data: formData });
    }
    setEditDialog({ open: false, item: null, isTable: false });
  };

  // Handle delete
  const handleDelete = () => {
    if (editDialog.isTable) {
      deleteTableMutation.mutate(formData.id);
    } else {
      deleteObjectMutation.mutate(formData.id);
    }
    setEditDialog({ open: false, item: null, isTable: false });
  };

  // Rotate item
  const rotateItem = (item, isTable) => {
    const newRotation = (item.rotation + 90) % 360;
    if (isTable) {
      updateTableMutation.mutate({ id: item.id, data: { rotation: newRotation } });
    } else {
      updateObjectMutation.mutate({ id: item.id, data: { rotation: newRotation } });
    }
  };

  // Get table color
  const getTableColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-500 border-green-600';
      case 'reserved': return 'bg-red-500 border-red-600';
      case 'blocked': return 'bg-gray-500 border-gray-600';
      default: return 'bg-blue-500 border-blue-600';
    }
  };

  const tools = [
    { id: 'wall', label: 'Mur', icon: Building2 },
    { id: 'pillar', label: 'Pilier', icon: Square },
    { id: 'bar', label: 'Bar', icon: Wine }
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Ajouter:</span>
            {tools.map(tool => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  size="sm"
                  variant={selectedTool === tool.id ? 'default' : 'outline'}
                  onClick={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tool.label}
                </Button>
              );
            })}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">{Math.round(zoom * 100)}%</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {selectedTool && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              ✨ Cliquez sur le plan pour ajouter un élément de décoration
            </p>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            💡 Utilisez le bouton "Ajouter une table" en haut pour créer de nouvelles tables. Passez la souris sur un élément puis tirez la poignée bleue en bas à droite pour modifier la largeur et la hauteur.
          </p>
        </div>
      </Card>

      {/* Canvas */}
      <Card className="p-4 bg-gray-50">
        <div className="overflow-auto">
          <div
            ref={canvasRef}
            className="relative border-2 border-gray-300 rounded-lg mx-auto"
            style={{
              width: `${canvasWidth * zoom}px`,
              height: `${canvasHeight * zoom}px`,
              backgroundColor: '#F5F5DC',
              cursor: selectedTool ? 'crosshair' : 'default',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left'
            }}
            onClick={handleCanvasClick}
          >
            {/* Map Objects */}
            {mapObjects?.map(obj => {
              const isDragging = dragging?.item?.id === obj.id && !dragging.isTable;
              const isResizing = resizing?.item?.id === obj.id && !resizing.isTable;
              const posX = isDragging && dragPosition ? dragPosition.x : (obj.position_x ?? obj.positionX ?? 0);
              const posY = isDragging && dragPosition ? dragPosition.y : (obj.position_y ?? obj.positionY ?? 0);
              const w = isResizing && resizeSize ? resizeSize.width : (obj.width ?? 60);
              const h = isResizing && resizeSize ? resizeSize.height : (obj.height ?? 40);
              
              return (
              <div
                key={obj.id}
                className="absolute group cursor-move hover:ring-2 hover:ring-blue-400 transition-all"
                style={{
                  left: `${posX}px`,
                  top: `${posY}px`,
                  width: `${w}px`,
                  height: `${h}px`,
                  transform: `rotate(${obj.rotation}deg)`,
                  backgroundColor: obj.type === 'plant' ? 'transparent' : obj.color,
                  opacity: obj.locked ? 0.5 : 1,
                  borderRadius: obj.type === 'pillar' ? '50%' : '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseDown={(e) => handleDragStart(e, obj, false)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem({ item: obj, isTable: false });
                }}
              >
                {obj.type === 'plant' && (
                  <Palmtree className="w-full h-full" style={{ color: '#10B981' }} />
                )}
                {!obj.locked && (
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-sm cursor-se-resize opacity-0 group-hover:opacity-100 z-10 shadow"
                    title="Redimensionner (glisser)"
                    onMouseDown={(e) => handleResizeStart(e, obj, false)}
                  />
                )}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 flex gap-1 pointer-events-auto">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(obj, false);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      rotateItem(obj, false);
                    }}
                  >
                    <RotateCw className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateObjectMutation.mutate({ 
                        id: obj.id, 
                        data: { locked: !obj.locked } 
                      });
                    }}
                  >
                    {obj.locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    </Button>
                    </div>
                    </div>
                    );
                    })}

                    {/* Tables */}
            {tables?.map(table => {
              const isDragging = dragging?.item?.id === table.id && dragging.isTable;
              const isResizing = resizing?.item?.id === table.id && resizing.isTable;
              const posX = isDragging && dragPosition ? dragPosition.x : (table.position_x ?? table.positionX ?? 0);
              const posY = isDragging && dragPosition ? dragPosition.y : (table.position_y ?? table.positionY ?? 0);
              const w = isResizing && resizeSize ? resizeSize.width : (table.width ?? 60);
              const h = isResizing && resizeSize ? resizeSize.height : (table.height ?? 40);
              
              return (
              <div
                key={table.id}
                className={`absolute group cursor-move hover:ring-2 hover:ring-blue-400 transition-all shadow-lg border-2 flex flex-col items-center justify-center text-white font-semibold ${
                  getTableColor(table.status)
                }`}
                style={{
                  left: `${posX}px`,
                  top: `${posY}px`,
                  width: `${w}px`,
                  height: `${h}px`,
                  transform: `rotate(${table.rotation ?? 0}deg)`,
                  borderRadius: (table.shape || 'square') === 'round' ? '50%' : '8px'
                }}
                onMouseDown={(e) => handleDragStart(e, table, true)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem({ item: table, isTable: true });
                }}
              >
                <span className="text-sm">{table.name}</span>
                <div className="flex items-center gap-1 text-xs opacity-90">
                  <Users className="h-3 w-3" />
                  <span>{table.seats}</span>
                </div>

                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-sm cursor-se-resize opacity-0 group-hover:opacity-100 z-10 shadow"
                  title="Redimensionner (glisser)"
                  onMouseDown={(e) => handleResizeStart(e, table, true)}
                />

                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 flex gap-1 pointer-events-auto">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(table, true);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      rotateItem(table, true);
                    }}
                  >
                    <RotateCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Réservée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span>Bloquée</span>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, item: null, isTable: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editDialog.isTable ? 'Modifier la table' : 'Modifier l\'objet'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {editDialog.isTable ? (
              <>
                <div>
                  <Label>Numéro de table</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Nombre de places</Label>
                  <Input
                    type="number"
                    value={formData.seats || ''}
                    onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="reserved">Réservée</SelectItem>
                      <SelectItem value="blocked">Bloquée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>Largeur (px)</Label>
                  <Input
                    type="number"
                    value={formData.width || ''}
                    onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Hauteur (px)</Label>
                  <Input
                    type="number"
                    value={formData.height || ''}
                    onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
            <Button onClick={handleSave}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}