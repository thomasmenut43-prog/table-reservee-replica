import React from 'react';
import { Search, SlidersHorizontal, X, MapPin, Utensils, Star, Sun, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function SearchFilters({ filters, setFilters, cities, availableCuisines }) {
  const activeFiltersCount = [
    filters.cuisine,
    filters.minRating > 0,
    filters.serviceType
  ].filter(Boolean).length;
  
  const clearFilters = () => {
    setFilters({
      search: '',
      cuisine: '',
      minRating: 0,
      serviceType: ''
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un restaurant..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10 h-12 bg-white border-gray-200 rounded-xl"
          />
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-12 px-4 rounded-xl border-gray-200 relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-primary">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                Filtres
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Effacer
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>
            
            <div className="space-y-6 mt-6">
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  Type de cuisine
                </Label>
                <Select
                  value={filters.cuisine}
                  onValueChange={(value) => setFilters({ ...filters, cuisine: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Tous les types</SelectItem>
                    {availableCuisines && availableCuisines.length > 0 ? (
                      availableCuisines.map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value={null} disabled>Aucune catégorie disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Note minimum : {filters.minRating || 'Toutes'}
                </Label>
                <Slider
                  value={[filters.minRating]}
                  onValueChange={([value]) => setFilters({ ...filters, minRating: value })}
                  max={5}
                  step={0.5}
                  className="py-2"
                />
              </div>
              
              <div className="space-y-3">
                <Label>Service</Label>
                <div className="flex gap-2">
                  <Button
                    variant={filters.serviceType === '' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 rounded-xl"
                    onClick={() => setFilters({ ...filters, serviceType: '' })}
                  >
                    Tous
                  </Button>
                  <Button
                    variant={filters.serviceType === 'MIDI' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 rounded-xl"
                    onClick={() => setFilters({ ...filters, serviceType: 'MIDI' })}
                  >
                    <Sun className="h-4 w-4 mr-1" />
                    Midi
                  </Button>
                  <Button
                    variant={filters.serviceType === 'SOIR' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 rounded-xl"
                    onClick={() => setFilters({ ...filters, serviceType: 'SOIR' })}
                  >
                    <Moon className="h-4 w-4 mr-1" />
                    Soir
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.cuisine && (
            <Badge variant="secondary" className="rounded-full pl-3">
              {filters.cuisine}
              <button 
                onClick={() => setFilters({ ...filters, cuisine: '' })}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.minRating > 0 && (
            <Badge variant="secondary" className="rounded-full pl-3">
              ≥ {filters.minRating} étoiles
              <button 
                onClick={() => setFilters({ ...filters, minRating: 0 })}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.serviceType && (
            <Badge variant="secondary" className="rounded-full pl-3">
              {filters.serviceType === 'MIDI' ? 'Midi' : 'Soir'}
              <button 
                onClick={() => setFilters({ ...filters, serviceType: '' })}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}