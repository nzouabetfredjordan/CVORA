# CVORA

Application React/Vite multilingue destinée à la création de CV, lettres de motivation, demandes d’emploi et demandes de stage.

## Stack
- React 19 + Vite
- Supabase Auth, Database et Realtime
- NotchPay API côté serveur
- Mobile Money MTN et Orange

## Règles
- Ne jamais exposer les clés secrètes côté navigateur.
- VITE_SUPABASE_* uniquement pour les clés publiques.
- Les paiements sont initiés exclusivement par `/api/payment`.
- Conserver les données personnelles et les documents sous les politiques RLS Supabase.
