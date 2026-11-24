# CVORA

Application React/Vite de création de CV et de documents de candidature.

## Configuration Supabase

1. Dans le projet `zytrfwugneemhamekwna`, ouvrez **SQL Editor**, puis exécutez le fichier `supabase/schema.sql`. Il crée les profils, règles RLS, événements, données du tableau admin et abonnements Realtime. L’adresse autorisée est `startapp113@gmail.com`.
2. Dans **Authentication → Sign In / Providers**, activez Google et/ou GitHub et renseignez les identifiants OAuth créés chez ces fournisseurs.
3. Dans **Authentication → URL Configuration**, définissez l’URL du site et ajoutez `http://localhost:5173/auth` et `https://VOTRE-DOMAINE/auth` à la liste de redirections autorisées.
4. Copiez la clé publique (anon/publishable, jamais la clé `service_role`) dans `VITE_SUPABASE_ANON_KEY`.

Pour le développement, copiez `.env.example` vers `.env.local`, renseignez la clé publique et lancez `npm install` puis `npm run dev`.

## Publication Vercel

Importez le dépôt GitHub dans Vercel avec le framework Vite, la commande `npm run build` et le répertoire `dist`. Définissez `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` et `VITE_ADMIN_EMAIL` (`startapp113@gmail.com`) dans les environnements Preview et Production, puis déployez. Après le premier déploiement, ajoutez le domaine Vercel aux URL autorisées Supabase et aux URL de redirection OAuth Google/GitHub.

Les clés OpenAI et NotchPay sont des réglages distincts et ne sont pas nécessaires à l’authentification Supabase.
