import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ban, CheckCircle, Users, Palmtree, Sun, Moon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function DashboardTableMap({ 
  tables = [], 
  mapObjects = [],
  currentBlocks = [],
  todayReservations = [],
  onBlockTable,
  onUnblockTable,
  onCompleteReservation
}) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [blockDialog, setBlockDialog] = useState({ open: false, table: null });
  const [blockService, setBlockService] = useState('MIDI');
  const [blockSoirService, setBlockSoirService] = useState(1);

  const isTableBlocked = (tableId) => {
    return currentBlocks.find(b => (b.tableId ?? b.table_id) === tableId);
  };

  const isTableReserved = (tableId) => {
    const now = new Date();
    return todayReservations.some(r => 
      r.tableIds?.includes(tableId) && 
      r.status === 'confirmed' &&
      new Date(r.dateTimeStart) <= now &&
      new Date(r.dateTimeEnd) >= now
    );
  };

  const getCurrentReservationsForTable = (tableId) => {
    const now = new Date();
    return todayReservations.filter(r =>
      r.tableIds?.includes(tableId) &&
      r.status === 'confirmed' &&
      new Date(r.dateTimeStart) <= now &&
      new Date(r.dateTimeEnd) >= now
    );
  };

  const handleTableClick = (table) => {
    setSelectedTable(table);
    const blocked = isTableBlocked(table.id);
    const reserved = isTableReserved(table.id);
    if (!blocked && !reserved) {
      setBlockDialog({ open: true, table });
    }
  };

  const handleBlock = () => {
    if (blockDialog.table) {
      onBlockTable(blockDialog.table, blockService, blockSoirService);
      setBlockDialog({ open: false, table: null });
      setSelectedTable(null);
      setBlockService('MIDI');
      setBlockSoirService(1);
    }
  };

  const handleUnblock = (tableId) => {
    const blocks = currentBlocks.filter(b => (b.tableId ?? b.table_id) === tableId);
    blocks.forEach(b => b.id && onUnblockTable(b.id));
    if (blocks.length) setSelectedTable(null);
  };

  const getTableColor = (table) => {
    if (isTableBlocked(table.id)) return 'bg-red-500 border-red-600';
    if (isTableReserved(table.id)) return 'bg-red-500 border-red-600';
    return 'bg-green-500 border-green-600';
  };

  if (tables.length === 0 && mapObjects.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Aucune table ou objet configuré sur ce plan
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 text-sm">
          <Badge variant="outline" className="bg-green-50">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            Disponible
          </Badge>
          <Badge variant="outline" className="bg-red-50">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
            Occupée
          </Badge>
        </div>
      </div>

      <div>
          <div className="relative border rounded-lg overflow-hidden" style={{ height: '600px', width: '100%', backgroundColor: '#F5F5DC' }}>
            <div className="relative w-full h-full">
              {/* Map Objects */}
              {mapObjects.map(obj => (
                <div
                  key={obj.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: obj.position_x ?? obj.positionX ?? 0,
                    top: obj.position_y ?? obj.positionY ?? 0,
                    width: obj.width ?? 60,
                    height: obj.height ?? 40,
                    transform: `rotate(${obj.rotation || 0}deg)`,
                    backgroundColor: obj.type === 'plant' ? 'transparent' : (obj.color || '#94a3b8'),
                    opacity: 1,
                    borderRadius: obj.type === 'pillar' ? '50%' : '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {obj.type === 'plant' && (
                    <Palmtree className="w-full h-full" style={{ color: '#10B981' }} />
                  )}
                </div>
              ))}

              {/* Tables */}
              {tables.map(table => {
                const blocked = isTableBlocked(table.id);
                const reserved = isTableReserved(table.id);
                const block = blocked ? currentBlocks.find(b => b.tableId === table.id) : null;

                return (
                  <div
                    key={table.id}
                    className={`absolute border-2 cursor-pointer transition-all hover:scale-105 ${getTableColor(table)}`}
                    style={{
                      left: table.position_x ?? table.positionX ?? 0,
                      top: table.position_y ?? table.positionY ?? 0,
                      width: table.width ?? 80,
                      height: table.height ?? 80,
                      transform: `rotate(${table.rotation || 0}deg)`,
                      borderRadius: table.shape === 'round' ? '50%' : '8px'
                    }}
                    onClick={() => handleTableClick(table)}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs font-semibold">
                      <div>{table.name}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3" />
                        {table.seats}
                      </div>
                      {reserved && (
                        <Badge className="mt-1 bg-white text-red-600 text-[10px] px-1 py-0">
                          Réservée
                        </Badge>
                      )}
                      {blocked && block && (
                        <Badge className="mt-1 bg-white text-gray-600 text-[10px] px-1 py-0">
                          {new Date(block.endDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        {/* Selected Table Info */}
        {selectedTable && (
          <div className="mt-4 p-4 border rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{selectedTable.name}</h3>
                <p className="text-sm text-gray-600">{selectedTable.seats} places • Zone: {selectedTable.zone}</p>
              </div>
              {isTableBlocked(selectedTable.id) ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUnblock(selectedTable.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Libérer
                </Button>
              ) : isTableReserved(selectedTable.id) && onCompleteReservation ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    getCurrentReservationsForTable(selectedTable.id).forEach(r => onCompleteReservation(r.id));
                    setSelectedTable(null);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Libérer la table
                </Button>
              ) : (
                <Badge className={isTableReserved(selectedTable.id) ? 'bg-red-500' : 'bg-green-500'}>
                  {isTableReserved(selectedTable.id) ? 'Réservée' : 'Disponible'}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Block Dialog */}
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
            <Button onClick={handleBlock}>
              <Ban className="h-4 w-4 mr-2" />
              Marquer occupée
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}