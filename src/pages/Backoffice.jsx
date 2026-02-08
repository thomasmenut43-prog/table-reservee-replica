import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2, Shield, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Backoffice() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notAuthenticated, setNotAuthenticated] = useState(false);

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      try {
        const currentUser = await base44.auth.me();

        if (!currentUser) {
          setNotAuthenticated(true);
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // Redirect based on role
        if (currentUser.role === 'admin') {
          window.location.href = createPageUrl('AdminDashboard');
        } else if (currentUser.restaurantId) {
          window.location.href = createPageUrl('BackofficeDashboard');
        } else {
          setLoading(false);
        }
      } catch (error) {
        // Not authenticated
        setNotAuthenticated(true);
        setLoading(false);
      }
    };

    checkUserAndRedirect();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">Redirection vers votre espace...</p>
        </div>
      </div>
    );
  }

  if (notAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connexion requise
            </h2>
            <p className="text-gray-500 mb-6">
              Veuillez vous connecter pour accéder au back-office.
            </p>
            <Button onClick={() => window.location.href = createPageUrl('Home')}>
              Aller à l'accueil pour se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Accès non autorisé
          </h2>
          <p className="text-gray-500 mb-6">
            Vous n'avez pas accès au back-office. Veuillez contacter l'administrateur.
          </p>
          <a
            href={createPageUrl('Home')}
            className="text-primary hover:underline"
          >
            Retour à l'accueil
          </a>
        </CardContent>
      </Card>
    </div>
  );
}