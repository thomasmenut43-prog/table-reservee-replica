# Mot de passe du restaurateur test

Pour définir le mot de passe **Laguna05\*** pour le compte restaurateur test :

## Via le tableau de bord Supabase

1. Ouvrir [Supabase Dashboard](https://supabase.com/dashboard) → votre projet.
2. Aller dans **Authentication** → **Users**.
3. Trouver l’utilisateur « restaurateur test » (par exemple `tom.marcon@live.fr` ou l’email du compte test).
4. Cliquer sur les **3 points** (⋮) à droite de l’utilisateur.
5. Choisir **Send password recovery** pour envoyer un lien de réinitialisation à l’email du compte,  
   **ou** utiliser l’API / un script avec la clé **service_role** pour définir le mot de passe directement (voir ci‑dessous).

## Définir le mot de passe directement (script)

Si tu préfères définir le mot de passe sans email de récupération, tu peux exécuter une fois le script suivant (avec la clé **service_role** uniquement en local, jamais commitée) :

- Soit en utilisant la fonction **Update user** dans Supabase Dashboard → Authentication → Users → [user] → **Edit user** (certains projets proposent un champ mot de passe).
- Soit en appelant l’API Admin Supabase depuis un script local qui lit la clé dans une variable d’environnement (ex. `SUPABASE_SERVICE_ROLE_KEY`).

Mot de passe à utiliser pour le restaurateur test : **Laguna05\***
