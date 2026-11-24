# CVORA

Application React/Vite de création de CV et de documents de candidature.

## Configuration Supabase

1. Dans le projet `zytrfwugneemhamekwna`, ouvrez **SQL Editor**, puis copiez et exécutez le script complet [`supabase/schema.sql`](./supabase/schema.sql). Il crée les profils, CV, candidatures, événements, politiques RLS, fonctions RPC et abonnements Realtime. L’adresse administrateur autorisée est `startapp113@gmail.com`.
2. Dans **Authentication → Sign In / Providers**, activez Google et/ou GitHub et renseignez les identifiants OAuth créés chez ces fournisseurs. Pour les deux fournisseurs, l’URL de callback OAuth est `https://zytrfwugneemhamekwna.supabase.co/auth/v1/callback`.
3. Dans **Authentication → URL Configuration**, définissez comme URL du site `https://cvora-ten.vercel.app` et autorisez les redirections `https://cvora-ten.vercel.app/auth`, `http://localhost:5173/auth` et, si le serveur local est lancé sur le port 3000, `http://localhost:3000/auth`.
4. Copiez uniquement la clé publique (anon/publishable, jamais `sb_secret` ou `service_role`) dans `VITE_SUPABASE_ANON_KEY`.

### Diagnostic du RPC administrateur

L’appel doit être fait depuis une session Supabase connectée avec `startapp113@gmail.com` :

```js
const { data, error } = await supabase.rpc('cvora_admin_dashboard')
if (error) console.error({ code: error.code, message: error.message, details: error.details, hint: error.hint })
else console.log(data)
```

`PGRST202` signifie généralement que le script SQL n’a pas été exécuté ou que le cache de schéma PostgREST doit être rechargé. Dans SQL Editor, exécutez `NOTIFY pgrst, 'reload schema';` après le schéma. `42501` signifie que la session n’est pas autorisée : reconnectez-vous avec l’adresse admin exacte et vérifiez qu’elle est dans `admin_allowlist`.

L’application redirige les connexions OAuth vers `/auth`. `/oauth/consent` n’est pas une route utilisée par CVORA. Vite écoute sur `http://localhost:5173` par défaut ; démarrez-le avec `npm run dev -- --port 3000` seulement si vous voulez tester le port 3000.

## Développement

Copiez `.env.example` vers `.env.local`, renseignez la clé publique et lancez `npm install` puis `npm run dev`.

## Publication Vercel

Le dépôt GitHub `nzouabetfredjordan/CVORA` est relié au projet Vercel `cvora`. La commande de build est `npm run build` et le dossier publié est `dist`. Les variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` et `VITE_ADMIN_EMAIL` sont définies dans Preview, Development et Production.

Les clés OpenAI et NotchPay sont des réglages distincts et ne sont pas nécessaires à l’authentification Supabase.
