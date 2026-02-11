import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StarRating from '@/components/ui/StarRating';

export default function RestaurantCard({ restaurant }) {
  const restaurantUrl = createPageUrl(`Restaurant?id=${restaurant.id}`);
  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white rounded-3xl">
      <Link to={restaurantUrl} className="block">
        <div className="relative h-64 overflow-hidden">
          <img
            src={restaurant.coverPhoto || restaurant.photos?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-bold text-xl text-white mb-2">
              {restaurant.name}
            </h3>
            <StarRating rating={restaurant.ratingAvg || 0} count={restaurant.ratingCount || 0} size="sm" />
          </div>
        </div>
      </Link>
      <div className="p-4">
        <Link to={restaurantUrl}>
          <Button
            className="w-full rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
          >
            Réserver une table
          </Button>
        </Link>
      </div>
    </Card>
  );
}