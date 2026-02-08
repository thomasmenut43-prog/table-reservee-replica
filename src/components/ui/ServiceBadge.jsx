import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ServiceBadge({ serviceType, size = 'default' }) {
  const isMidi = serviceType === 'MIDI';
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-medium border',
        sizeClasses[size],
        isMidi 
          ? 'bg-orange-50 text-orange-700 border-orange-200' 
          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
      )}
    >
      {isMidi ? <Sun className="h-3 w-3 mr-1" /> : <Moon className="h-3 w-3 mr-1" />}
      {isMidi ? 'Midi' : 'Soir'}
    </Badge>
  );
}