import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Users, Phone, Mail, MessageSquare, Clock, MoreVertical,
  Check, X, AlertTriangle, RefreshCw, Trash2, Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import StatusBadge from '@/components/ui/StatusBadge';
import ServiceBadge from '@/components/ui/ServiceBadge';

export default function ReservationRow({ reservation, tables, onStatusChange, onEdit, onTableChange, onDelete }) {
  const [editTableDialog, setEditTableDialog] = useState(false);
  const [selectedTableIds, setSelectedTableIds] = useState(reservation.tableIds || []);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const assignedTables = tables?.filter(t => reservation.tableIds?.includes(t.id)) || [];
  
  const handleTableEdit = () => {
    if (onTableChange) {
      onTableChange(reservation.id, selectedTableIds);
    }
    setEditTableDialog(false);
  };
  
  return (
    <div className="p-4 bg-white rounded-xl border hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-gray-900">
              {reservation.firstName} {reservation.lastName}
            </h4>
            <StatusBadge status={reservation.status} />
            <ServiceBadge serviceType={reservation.serviceType} size="sm" />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format(new Date(reservation.dateTimeStart), 'HH:mm')}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {reservation.guestsCount} pers.
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {reservation.phone}
            </span>
            {reservation.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {reservation.email}
              </span>
            )}
          </div>
          
          <div className="mt-2 flex items-center gap-2">
            {assignedTables.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assignedTables.map(table => (
                  <Badge key={table.id} variant="outline" className="text-xs">
                    {table.name} ({table.capacity}p - {table.zone})
                  </Badge>
                ))}
              </div>
            ) : (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                Aucune table assignée
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => {
                setSelectedTableIds(reservation.tableIds || []);
                setEditTableDialog(true);
              }}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
          
          {reservation.comment && (
            <p className="mt-2 text-sm text-gray-500 flex items-start gap-1">
              <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {reservation.comment}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {reservation.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={() => onStatusChange(reservation.id, 'confirmed')}
              >
                <Check className="h-4 w-4 mr-1" />
                Confirmer
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => onStatusChange(reservation.id, 'canceled')}
              >
                <X className="h-4 w-4 mr-1" />
                Refuser
              </Button>
            </>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {reservation.status === 'confirmed' && (
                <>
                  <DropdownMenuItem onClick={() => onStatusChange(reservation.id, 'no_show')}>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Marquer No-show
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(reservation.id, 'canceled')}>
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </DropdownMenuItem>
                </>
              )}
              {reservation.status === 'canceled' && (
                <DropdownMenuItem onClick={() => onStatusChange(reservation.id, 'confirmed')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rétablir
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Edit Table Dialog */}
      <Dialog open={editTableDialog} onOpenChange={setEditTableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les tables assignées</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Réservation pour <strong>{reservation.firstName} {reservation.lastName}</strong> - {reservation.guestsCount} personne{reservation.guestsCount > 1 ? 's' : ''}
            </p>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <Label>Tables disponibles</Label>
              {tables
                .filter(t => t.isActive && t.capacity >= 1)
                .sort((a, b) => a.zone.localeCompare(b.zone))
                .map(table => (
                  <div key={table.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      id={`table-${table.id}`}
                      checked={selectedTableIds.includes(table.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTableIds([...selectedTableIds, table.id]);
                        } else {
                          setSelectedTableIds(selectedTableIds.filter(id => id !== table.id));
                        }
                      }}
                    />
                    <label
                      htmlFor={`table-${table.id}`}
                      className="flex-1 text-sm cursor-pointer"
                    >
                      <span className="font-medium">{table.name}</span>
                      <span className="text-gray-500 ml-2">
                        {table.capacity} pers. - {table.zone === 'salle' ? 'Salle' : table.zone === 'terrasse' ? 'Terrasse' : 'Salon privé'}
                      </span>
                    </label>
                  </div>
                ))}
            </div>
            
            {selectedTableIds.length > 0 && (
              <p className="text-xs text-gray-500">
                Capacité totale sélectionnée : {tables.filter(t => selectedTableIds.includes(t.id)).reduce((sum, t) => sum + t.capacity, 0)} personnes
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setEditTableDialog(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleTableEdit}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette réservation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La réservation de {reservation.firstName} {reservation.lastName} sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (onDelete) {
                  onDelete(reservation.id);
                }
                setShowDeleteDialog(false);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}