# Déployer CVORA sur GitHub puis Vercel

## GitHub
1. Initialisez le dépôt : `git init`
2. Ajoutez les fichiers : `git add .`
3. Créez le commit : `git commit -m "Version complète CVORA 2026"`
4. Créez un dépôt GitHub, puis connectez-le : `git remote add origin https://github.com/VOTRE-COMPTE/CVORA.git`
5. Envoyez le projet : `git push -u origin main`

## Vercel
1. Importez le dépôt GitHub dans Vercel.
2. Framework : Vite.
3. Build command : `npm run build`
4. Output directory : `dist`
5. Ajoutez les variables de `.env.example` dans Vercel.

## Supabase
Exécutez `supabase/schema.sql` dans SQL Editor, puis activez Email/Google dans Authentication.
