import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import StarRating from '@/components/ui/StarRating';

export default function RestaurantCard({ restaurant }) {
  return (
    <Link to={createPageUrl(`Restaurant?id=${restaurant.id}`)}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white">
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
      </Card>
    </Link>
  );
}