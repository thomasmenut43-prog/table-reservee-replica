import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapPin, Star, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Composant pour gérer le zoom et le centre de la carte
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  
  return null;
}

export default function MapView({ restaurants }) {
  const [zoomLevel, setZoomLevel] = useState(10);
  const [mapCenter, setMapCenter] = useState([45.0428, 3.8848]); // Le Puy-en-Velay par défaut
  
  // Filtrer les restaurants qui ont des coordonnées
  const restaurantsWithCoords = useMemo(() => {
    return restaurants.filter(r => r.latitude && r.longitude);
  }, [restaurants]);
  
  // Calculer le centre de la carte basé sur les restaurants visibles
  useEffect(() => {
    if (restaurantsWithCoords.length > 0) {
      const lats = restaurantsWithCoords.map(r => r.latitude);
      const lngs = restaurantsWithCoords.map(r => r.longitude);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      setMapCenter([centerLat, centerLng]);
    }
  }, [restaurantsWithCoords]);
  
  // Filtrer les restaurants en fonction du niveau de zoom
  const visibleRestaurants = useMemo(() => {
    if (zoomLevel >= 13) {
      // Zoom très élevé : afficher uniquement les restaurants proches du centre
      return restaurantsWithCoords.filter(r => {
        const distance = Math.sqrt(
          Math.pow(r.latitude - mapCenter[0], 2) + 
          Math.pow(r.longitude - mapCenter[1], 2)
        );
        return distance < 0.03;
      });
    }
    // Par défaut, afficher tous les restaurants
    return restaurantsWithCoords;
  }, [restaurantsWithCoords, zoomLevel, mapCenter]);
  
  if (restaurantsWithCoords.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center shadow-sm">
        <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Aucun restaurant avec localisation disponible</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Contrôles de zoom */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex items-center gap-4">
          <MapPin className="h-5 w-5 text-orange-500" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Niveau de zoom</span>
              <span className="text-sm text-gray-500">{visibleRestaurants.length} restaurant(s)</span>
            </div>
            <Slider
              value={[zoomLevel]}
              onValueChange={(value) => setZoomLevel(value[0])}
              min={8}
              max={14}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Vue régionale</span>
              <span>Vue locale</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Carte */}
      <div className="h-[500px] relative">
        <MapContainer
          center={mapCenter}
          zoom={zoomLevel}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController center={mapCenter} zoom={zoomLevel} />
          
          {visibleRestaurants.map(restaurant => (
            <Marker
              key={restaurant.id}
              position={[restaurant.latitude, restaurant.longitude]}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-gray-900 mb-2">{restaurant.name}</h3>
                  
                  {restaurant.coverPhoto && (
                    <img 
                      src={restaurant.coverPhoto} 
                      alt={restaurant.name}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="h-3 w-3" />
                    <span>{restaurant.city}</span>
                  </div>
                  
                  {restaurant.ratingAvg > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium">{restaurant.ratingAvg.toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-gray-500">({restaurant.ratingCount} avis)</span>
                    </div>
                  )}
                  
                  {restaurant.cuisineTags && restaurant.cuisineTags.length > 0 && (
                    <div className="flex items-center gap-1 mb-3 flex-wrap">
                      <Utensils className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">{restaurant.cuisineTags[0]}</span>
                    </div>
                  )}
                  
                  <Link to={createPageUrl('Restaurant') + `?id=${restaurant.id}`}>
                    <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600">
                      Voir le restaurant
                    </Button>
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}