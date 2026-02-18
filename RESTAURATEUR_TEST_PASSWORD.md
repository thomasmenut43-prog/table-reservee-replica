# Mot de passe du restaurateur test

## Utilisateur test

- **Email** : `Tom.marcon@live.fr`
- **Mot de passe** : `TestResto2025!`

## Définir le mot de passe (si le compte existe déjà)

### Option 1 : Script Node (recommandé)

1. Récupère ta clé **service_role** : Supabase Dashboard → Settings → API → `service_role` (secret)
2. Ajoute-la dans un fichier `.env` à la racine (ne pas commiter) :
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
3. Exécute :
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=ta_cle node scripts/set-test-user-password.js
   ```
   Ou avec un email/mot de passe personnalisé :
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=ta_cle node scripts/set-test-user-password.js Tom.marcon@live.fr MonMotDePasse123!
   ```

### Option 2 : Via le tableau de bord Supabase

1. Ouvrir [Supabase Dashboard](https://supabase.com/dashboard) → ton projet
2. **Authentication** → **Users**
3. Trouver l’utilisateur `Tom.marcon@live.fr` (ou créer le compte via l’app)
4. Cliquer sur les **3 points** (⋮) → **Send password recovery** pour recevoir un lien de réinitialisation par email
5. Ou utiliser **Edit user** si le projet permet de définir le mot de passe directement

### Créer l’utilisateur s’il n’existe pas

Si le compte n’existe pas encore, inscris-toi via l’app (page d’accueil → Connexion / Inscription) avec l’email `Tom.marcon@live.fr`, puis exécute le script pour définir le mot de passe.

### Configurer l’utilisateur comme restaurateur (accès back-office)

Si l’utilisateur voit « Mes réservations » au lieu du Back-office, exécute dans Supabase SQL Editor le script **`supabase_set_test_user_restaurateur.sql`**. Il définit le rôle `restaurateur` et assigne un restaurant au compte test.
