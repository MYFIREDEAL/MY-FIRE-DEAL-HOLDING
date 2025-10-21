# MY FIRE DEAL

## Auth & Supabase configuration

- Le client utilise **Supabase Auth** (`supabase.auth.signUp` / `signInWithPassword`).  
- Lorsqu'un utilisateur est créé, on insère un profil dans `public.profiles` via un simple `upsert`.  
- Les projets (`public.projects`) sont protégés par RLS et liés à `auth.users(id)` via `owner_id`.
- Définissez `VITE_SITE_URL` (ex. `http://localhost:3000` en dev, `https://myfiredeal.github.io/MY-FIRE-DEAL-HOLDING` en prod) pour que les redirections Supabase Auth fonctionnent sans URL codée en dur.

### Clés Supabase

- **SUPABASE_URL / VITE_SUPABASE_URL** et **VITE_SUPABASE_ANON_KEY** : utilisées côté client (Vite).
- **SUPABASE_SERVICE_ROLE_KEY** : à conserver côté serveur uniquement (scripts d’admin, migrations, cron).  
  Ne jamais l’exposer dans le front. Placez-la dans les variables d’environnement du serveur (ex. `process.env.SUPABASE_SERVICE_ROLE_KEY`) et utilisez-la uniquement pour les opérations qui doivent contourner RLS.

### Scripts / migrations

Le dossier `supabase/migrations/` contient le SQL permettant de vérifier la présence des colonnes `owner_id` et `is_public`, ainsi que la contrainte de clé étrangère vers `auth.users`. Exécutez ces scripts via la CLI Supabase ou via le SQL Editor avant de lancer l’application.
