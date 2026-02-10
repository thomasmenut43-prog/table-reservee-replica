import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TopRatedCarousel({ restaurants }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const navigate = useNavigate();

  // Get top 5 rated restaurants
  const topRestaurants = restaurants
    .filter(r => r.ratingAvg && r.ratingAvg > 0)
    .sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0))
    .slice(0, 5);

  if (topRestaurants.length === 0) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % topRestaurants.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + topRestaurants.length) % topRestaurants.length);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    
    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  const goToRestaurant = (restaurantId) => {
    navigate(createPageUrl(`Restaurant?id=${restaurantId}`));
  };

  return (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
          Les mieux notés
        </h2>
        <p className="text-gray-600 text-sm mt-1">Découvrez les restaurants les plus appréciés</p>
      </div>

      <div className="relative">
        <div 
          className="overflow-hidden px-4 lg:px-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex gap-4 lg:gap-6 transition-transform duration-500 ease-out" style={{
            transform: `translateX(calc(-${currentIndex * 100}% - ${currentIndex * 16}px))`
          }}>
            {topRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="flex-shrink-0 w-full lg:w-[calc(50%-0.75rem)]"
                onClick={() => goToRestaurant(restaurant.id)}
              >
                <div className="relative bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full border border-gray-100">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-4 lg:p-6 p-0">
                    {/* Image */}
                    <div className="relative h-64 lg:h-56 lg:rounded-xl overflow-hidden rounded-none">
                      <img
                        src={restaurant.coverPhoto || 'https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=500&h=500&fit=crop'}
                        alt={restaurant.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col justify-center lg:p-0 p-6">
                      <div className="mb-3">
                        <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">{restaurant.name}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 lg:h-5 w-4 lg:w-5 ${
                                  i < Math.floor(restaurant.ratingAvg || 0)
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {restaurant.ratingAvg?.toFixed(1)}/5
                          </span>
                          {restaurant.ratingCount > 0 && (
                            <span className="text-xs lg:text-sm text-gray-600">
                              ({restaurant.ratingCount} avis)
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2 text-sm">{restaurant.description}</p>

                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        {restaurant.cuisineTags && restaurant.cuisineTags.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {restaurant.cuisineTags.slice(0, 3).map((cuisine, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-orange-50 rounded-full text-sm font-medium text-orange-600 border border-orange-100"
                              >
                                {cuisine}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          goToRestaurant(restaurant.id);
                        }}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold w-full rounded-3xl"
                      >
                        Réserver une table
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        {topRestaurants.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all hover:bg-gray-50"
              aria-label="Précédent"
            >
              <ChevronLeft className="h-6 w-6 text-gray-900" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all hover:bg-gray-50"
              aria-label="Suivant"
            >
              <ChevronRight className="h-6 w-6 text-gray-900" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {topRestaurants.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {topRestaurants.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-orange-500 w-8'
                    : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`}
                aria-label={`Aller au restaurant ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}