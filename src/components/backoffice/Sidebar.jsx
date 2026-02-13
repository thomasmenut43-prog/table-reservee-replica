import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutDashboard, CalendarDays, UtensilsCrossed, Clock,
  Ban, Settings, ChevronRight, Building2, Users, BarChart3,
  Menu, X, Home, CheckCircle2, FileText, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const restaurateurLinks = [
  { name: 'Dashboard', page: 'BackofficeDashboard', icon: LayoutDashboard },
  { name: 'Réservations', page: 'BackofficeReservations', icon: CalendarDays },
  { name: 'Analytique', page: 'BackofficeAnalytics', icon: TrendingUp },
  { name: 'Tables', page: 'BackofficeTables', icon: UtensilsCrossed },
  { name: 'Services & Horaires', page: 'BackofficeSchedules', icon: Clock },
  { name: 'Indisponibilités', page: 'BackofficeBlocks', icon: Ban },
  { name: 'Paramètres', page: 'BackofficeSettings', icon: Settings }
];

const adminLinks = [
  { name: 'Vue d\'ensemble', page: 'AdminDashboard', icon: BarChart3 },
  { name: 'Restaurants', page: 'AdminRestaurants', icon: Building2 },
  { name: 'Utilisateurs', page: 'AdminUsers', icon: Users },
  { name: 'Offres', page: 'AdminSubscriptions', icon: CalendarDays },
  { name: 'Réservations', page: 'AdminReservations', icon: CalendarDays },
  { name: 'Design', page: 'AdminDesign', icon: Settings },
  { name: 'Pages Légales', page: 'AdminLegal', icon: FileText }
];

export default function Sidebar({ user, restaurant, isAdmin, isMobileOpen, setIsMobileOpen }) {
  const location = useLocation();
  const currentPage = location.pathname.split('/').pop().replace('.jsx', '');

  const links = isAdmin ? adminLinks : restaurateurLinks;

  const urlParams = new URLSearchParams(window.location.search);
  const restaurantIdFromUrl = urlParams.get('restaurantId');
  // Garder le restaurant dans l’URL pour tous les onglets (admin + restaurateur)
  const restaurantId = restaurantIdFromUrl || restaurant?.id;

  const createLinkUrl = (page) => {
    if (!restaurantId) {
      return createPageUrl(page);
    }
    return createPageUrl(page) + `?restaurantId=${restaurantId}`;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                  <UtensilsCrossed className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-900">
                      {isAdmin ? 'Administration' : 'Back Office'}
                    </h2>
                    {!isAdmin && user?.subscriptionStatus === 'active' && user?.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date() && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-semibold text-green-700">Actif</span>
                      </div>
                    )}
                  </div>
                  {!isAdmin && restaurant && (
                    <p className="text-sm text-gray-500 truncate max-w-[150px]">
                      {restaurant.name}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {/* Link to public site - shown for all users */}
            <div className="mb-4 pb-4 border-b">
              <Link
                to={createPageUrl('Home')}
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-all"
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Retour au site public</span>
              </Link>
            </div>
            <div className="space-y-1">
              {links.map(link => {
                const isActive = currentPage === link.page;
                return (
                  <Link
                    key={link.page}
                    to={createLinkUrl(link.page)}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    <span className="font-medium">{link.name}</span>
                    {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user?.full_name?.[0] || user?.email?.[0] || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name || user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {isAdmin ? 'Super Admin' : 'Restaurateur'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}