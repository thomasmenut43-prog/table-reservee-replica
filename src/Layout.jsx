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
  const [loginPassword, setLoginPassword] = useState('');
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
      const loggedInUser = await base44.auth.login(loginEmail, loginPassword);
      setUser(loggedInUser);
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (error) {
      setLoginError('Email ou mot de passe incorrect');
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
          <div className="space-y-4">
            {/* Connexion via Google / Apple */}
            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  setLoginError('');
                  try {
                    await base44.auth.loginWithGoogle();
                  } catch (err) {
                    setLoginError(err?.message || 'Connexion Google impossible. Vérifiez la configuration Supabase.');
                  }
                }}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuer avec Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  setLoginError('');
                  try {
                    await base44.auth.loginWithApple();
                  } catch (err) {
                    setLoginError(err?.message || 'Connexion Apple impossible. Vérifiez la configuration Supabase.');
                  }
                }}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18.24 2.31-.33 3.28-.22 1.15.12 1.92.44 2.9 1.4 3.85 3.84 3.27 7.46 2.9 9.91-.18 1.2-.64 2.4-1.32 3.37-.68.97-1.34 1.86-2.18 2.65zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25 2.08-.18 3.86 1.5 3.97 3.63.12 2.15-1.61 4.01-3.74 4.2-2.12.18-3.86-1.5-3.97-3.63z"/>
                </svg>
                Continuer avec Apple
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>
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
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Votre mot de passe"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              {loginError && (
                <p className="text-sm text-red-600">{loginError}</p>
              )}
              <Button type="submit" className="w-full">
                Se connecter
              </Button>
            </form>
          </div>
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