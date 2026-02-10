import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Utensils, ChevronRight, Sparkles, MapPin, UtensilsCrossed, Star, Sun, Moon, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import RestaurantCard from '@/components/public/RestaurantCard';
import SearchFilters from '@/components/public/SearchFilters';
import TopRatedCarousel from '@/components/public/TopRatedCarousel';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Home() {
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    cuisine: '',
    minRating: 0,
    serviceType: ''
  });
  const [sortBy, setSortBy] = useState('default');
  
  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => base44.entities.Restaurant.filter({ isActive: true }),
    staleTime: 0,
    gcTime: 0
  });
  
  const { data: schedules = [] } = useQuery({
    queryKey: ['all-schedules'],
    queryFn: () => base44.entities.ServiceSchedule.list(),
    staleTime: 0,
    gcTime: 0
  });
  
  const { data: settings } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const result = await base44.entities.PlatformSettings.filter({ settingKey: 'design' });
      return result[0] || null;
    },
    staleTime: 0,
    gcTime: 0
  });
  
  // Get unique cities
  const cities = useMemo(() => {
    return [...new Set(restaurants.map(r => r.city).filter(Boolean))].sort();
  }, [restaurants]);
  
  // Get unique cuisines
  const availableCuisines = useMemo(() => {
    const allCuisines = restaurants.flatMap(r => r.cuisineTags || []);
    return [...new Set(allCuisines)].sort();
  }, [restaurants]);
  
  // Filter restaurants
  const filteredRestaurants = useMemo(() => {
    const filtered = restaurants.filter(r => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (!r.name?.toLowerCase().includes(search) && 
            !r.city?.toLowerCase().includes(search)) {
          return false;
        }
      }
      
      // City filter
      if (filters.city && r.city !== filters.city) return false;
      
      // Cuisine filter
      if (filters.cuisine && !r.cuisineTags?.includes(filters.cuisine)) return false;
      
      // Rating filter
      if (filters.minRating > 0 && (r.ratingAvg || 0) < filters.minRating) return false;
      
      // Service filter
      if (filters.serviceType) {
        const hasService = schedules.some(
          s => s.restaurantId === r.id && s.serviceType === filters.serviceType && s.isOpen
        );
        if (!hasService) return false;
      }
      
      return true;
    });
    
    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.ratingAvg || 0) - (a.ratingAvg || 0);
      }
      
      // Default: fast-foods last
      const aIsFastFood = a.cuisineTags?.includes('Fast-food');
      const bIsFastFood = b.cuisineTags?.includes('Fast-food');
      if (aIsFastFood && !bIsFastFood) return 1;
      if (!aIsFastFood && bIsFastFood) return -1;
      return 0;
    });
  }, [restaurants, filters, schedules, sortBy]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-slate-900 overflow-hidden">
        {/* Background Image with enhanced overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-orange-900/70 to-amber-900/75" />
        
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 w-96 h-96 bg-orange-500 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-amber-500 rounded-full blur-[100px] animate-pulse delay-1000" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center">

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
              <span className="drop-shadow-2xl">
                {settings?.heroTitle || 'Réservez votre table'}
              </span>
              <br />
              <span className="relative inline-block mt-3">
                <span className="absolute inset-0 blur-3xl bg-gradient-to-r from-amber-400 to-orange-500 opacity-60" />
                <span className="relative bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 bg-clip-text text-transparent drop-shadow-lg">
                  {settings?.heroSubtitle || 'en quelques clics'}
                </span>
              </span>
            </h1>
            
            <p className="text-xl text-white/95 max-w-2xl mx-auto mb-12 font-medium drop-shadow-lg leading-relaxed">
              {settings?.heroDescription || 'Découvrez les meilleurs restaurants de votre ville et réservez facilement votre table pour le déjeuner ou le dîner.'}
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/90 text-sm mb-10 font-medium">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-lg">
                <Utensils className="h-5 w-5" />
                <span>{restaurants.length} restaurants</span>
              </div>
              <div className="hidden sm:flex items-center gap-3 bg-white/15 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-lg">
                <Sun className="h-4 w-4" />
                <span>Midi & Soir</span>
                <Moon className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Quick Filter Icons - Dropdown for all screens */}
        {filters.cuisine && (
          <div className="mb-6">
            <Button 
              variant="outline" 
              className="w-full md:w-auto"
              onClick={() => setFilters(prev => ({ ...prev, cuisine: '' }))}
            >
              <UtensilsCrossed className="h-4 w-4 mr-2" />
              {filters.cuisine}
              <span className="ml-2 text-xs opacity-50">✕</span>
            </Button>
          </div>
        )}
        
        {/* Top Rated Carousel */}
        {!isLoading && restaurants.length > 0 && (
          <TopRatedCarousel restaurants={restaurants} />
        )}
        
        
        {/* Filters */}
        <div className="mb-8">
          <SearchFilters filters={filters} setFilters={setFilters} cities={cities} availableCuisines={availableCuisines} />
        </div>
        
        {/* Results */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {filteredRestaurants.length} restaurant{filteredRestaurants.length > 1 ? 's' : ''} 
            {filters.search || filters.city || filters.cuisine ? ' trouvé' + (filteredRestaurants.length > 1 ? 's' : '') : ''}
          </h2>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4 mr-2" />
                {sortBy === 'rating' ? 'Meilleures notes' : 'Tri par défaut'}
                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('default')}>
                Tri par défaut
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('rating')}>
                <Star className="h-4 w-4 mr-2 text-amber-500" />
                Meilleures notes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map(restaurant => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Utensils className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun restaurant trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </div>
        )}
        
        {/* Banner Ad */}
        {settings?.bannerAdUrl && (
          <div className="mt-12 max-w-4xl mx-auto">
            {settings.bannerAdLink ? (
              <a href={settings.bannerAdLink} target="_blank" rel="noopener noreferrer">
                <img 
                  src={settings.bannerAdUrl} 
                  alt="Publicité" 
                  className="w-full h-auto rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                />
              </a>
            ) : (
              <img 
                src={settings.bannerAdUrl} 
                alt="Publicité" 
                className="w-full h-auto rounded-xl shadow-lg"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}