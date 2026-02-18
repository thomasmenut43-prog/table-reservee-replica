import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: { label: 'En attente', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  confirmed: { label: 'Confirmée', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  completed: { label: 'Terminée', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  canceled: { label: 'Annulée', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  no_show: { label: 'No-show', className: 'bg-red-100 text-red-800 border-red-200' },
  open: { label: 'Ouverte', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  contacted: { label: 'Contacté', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  closed: { label: 'Fermée', className: 'bg-gray-100 text-gray-800 border-gray-200' }
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100' };
  
  return (
    <Badge variant="outline" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}