/**
 * Définit le mot de passe de l'utilisateur test (restaurateur).
 * Usage: node scripts/set-test-user-password.js [email] [password]
 * Ou avec variables d'environnement: TEST_USER_EMAIL, TEST_USER_PASSWORD
 * 
 * Requiert: SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://bictooxiosihmzijddyu.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const email = process.argv[2] || process.env.TEST_USER_EMAIL || 'Tom.marcon@live.fr';
const password = process.argv[3] || process.env.TEST_USER_PASSWORD || 'TestResto2025!';

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquante.');
  console.error('   Ajoute-la dans ton fichier .env (clé depuis Supabase → Settings → API → service_role)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  console.log(`🔑 Définition du mot de passe pour ${email}...`);

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Erreur listage utilisateurs:', listError.message);
    process.exit(1);
  }

  const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error(`❌ Utilisateur "${email}" introuvable dans Supabase Auth.`);
    console.error('   Crée d\'abord l\'utilisateur via l\'app (signup) ou le Dashboard Supabase.');
    process.exit(1);
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
  if (error) {
    console.error('❌ Erreur mise à jour:', error.message);
    process.exit(1);
  }

  console.log('✅ Mot de passe défini avec succès.');
  console.log(`   Email: ${email}`);
  console.log(`   Mot de passe: ${password}`);
}

main();
