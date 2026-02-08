import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { UtensilsCrossed, Settings, LogIn, LogOut, User, Moon, Sun, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';
import ScrollToTop from '@/components/ScrollToTop';
import InstallPWA from '@/components/InstallPWA';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// Pages that should have no layout (fullscreen backoffice)
const noLayoutPages = [
  'BackofficeDashboard',
  'BackofficeReservations',
  'BackofficeAnalytics',
  'BackofficeTables',
  'BackofficeSchedules',
  'BackofficeBlocks',
  'BackofficeSettings',
  'AdminDashboard',
  'AdminRestaurants',
  'AdminUsers',
  'AdminReservations',
  'AdminDesign'
];

function LayoutContent({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const { isDark, toggleTheme } = useTheme() || { isDark: false, toggleTheme: () => { } };

  const loadUser = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    }
  };

  useEffect(() => {
    loadUser();

    // Load platform settings
    base44.entities.PlatformSettings.filter({ settingKey: 'design' })
      .then(result => setSettings(result[0] || null))
      .catch(() => { });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const loggedInUser = await base44.auth.login(loginEmail, 'demo');
      setUser(loggedInUser);
      setShowLoginModal(false);
      setLoginEmail('');
    } catch (error) {
      setLoginError('Email non trouvé. Utilisez: admin@restaurant.fr, manager@petitbistrot.fr, ou client@email.fr');
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
    setUser(null);
  };

  // Backoffice pages have their own full layout with header
  if (noLayoutPages.includes(currentPageName)) {
    return (
      <div className="min-h-screen bg-white">
        <main className="bg-white">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connexion</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.fr"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-600">{loginError}</p>
            )}
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
              <p className="font-medium mb-1">Comptes de démo :</p>
              <ul className="space-y-1 text-xs">
                <li>• <code>admin@restaurant.fr</code> (Admin)</li>
                <li>• <code>manager@petitbistrot.fr</code> (Manager)</li>
                <li>• <code>client@email.fr</code> (Client)</li>
              </ul>
            </div>
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Public Header - Only for public pages */}
      {(currentPageName === 'Home' || currentPageName === 'Restaurant') && (
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between md:justify-center h-16 relative">
              <Link to={createPageUrl('Home')} className="flex items-center gap-2 flex-shrink-0">
                {settings?.logoUrl ? (
                  <img src={settings.logoUrl} alt="RestoPonot" className="h-14 object-contain" />
                ) : (
                  <>
                    <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                      <UtensilsCrossed className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-xl text-gray-900">RestoPonot</span>
                  </>
                )}
              </Link>

              <div className="md:absolute md:right-0 flex items-center gap-3">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <User className="h-4 w-4 mr-2" />
                        {user.full_name || user.email}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-2">
                        <p className="text-sm font-medium">{user.full_name || 'Utilisateur'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      {(user.role === 'admin' || user.restaurantId) && (
                        <>
                          <DropdownMenuItem onClick={() => window.location.href = createPageUrl('Backoffice')}>
                            <Settings className="h-4 w-4 mr-2" />
                            Back-office
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {user.role !== 'admin' && !user.restaurantId && (
                        <>
                          <DropdownMenuItem onClick={() => window.location.href = createPageUrl('MyReservations')}>
                            <CalendarDays className="h-4 w-4 mr-2" />
                            Mes réservations
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowLoginModal(true)}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Connexion
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1">
        {children}
      </main>

      {/* Public Footer */}
      {(currentPageName === 'Home' || currentPageName === 'Restaurant' || currentPageName === 'RGPD' || currentPageName === 'MentionsLegales') && (
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                {settings?.logoUrl ? (
                  <img src={settings.logoUrl} alt="RestoPonot" className="h-9 object-contain brightness-0 invert" />
                ) : (
                  <>
                    <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                      <UtensilsCrossed className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-xl">RestoPonot</span>
                  </>
                )}
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-4 text-sm">
                  <Link to={createPageUrl('RGPD')} className="text-gray-400 hover:text-white transition-colors">
                    RGPD
                  </Link>
                  <span className="text-gray-600">•</span>
                  <Link to={createPageUrl('MentionsLegales')} className="text-gray-400 hover:text-white transition-colors">
                    Mentions Légales
                  </Link>
                </div>
                <p className="text-gray-400 text-sm">
                  © {new Date().getFullYear()} RestoPonot. Tous droits réservés.
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <ScrollToTop />
      <LayoutContent currentPageName={currentPageName}>
        {children}
      </LayoutContent>
    </ThemeProvider>
  );
}