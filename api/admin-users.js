import { createClient } from '@supabase/supabase-js'

const URL = process.env.VITE_SUPABASE_URL
const ANON = process.env.VITE_SUPABASE_ANON_KEY
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN_EMAIL = String(process.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()

function replyError(res, status, error) {
  return res.status(status).json({ error })
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return replyError(res, 405, 'Méthode non autorisée.')
  if (!URL || !ANON || !SERVICE || !ADMIN_EMAIL) return replyError(res, 503, 'La gestion des utilisateurs n’est pas configurée sur le serveur.')

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return replyError(res, 401, 'Connectez-vous avec le compte administrateur.')

  const supabase = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  const adminUser = authData?.user
  if (authError || adminUser?.email?.toLowerCase() !== ADMIN_EMAIL) return replyError(res, 403, 'Accès administrateur requis.')

  if (req.method === 'POST') {
    const userId = String(req.body?.user_id || '')
    const action = String(req.body?.action || '')
    if (!/^[0-9a-f-]{36}$/i.test(userId) || !['suspend', 'restore'].includes(action)) return replyError(res, 400, 'Action ou identifiant invalide.')
    if (userId === adminUser.id) return replyError(res, 403, 'Vous ne pouvez pas modifier votre propre compte administrateur.')

    const [{ data: targetData, error: targetError }, { data: profile }] = await Promise.all([
      supabase.auth.admin.getUserById(userId),
      supabase.from('profiles').select('email,role').eq('id', userId).maybeSingle()
    ])
    const target = targetData?.user
    if (targetError || !target) return replyError(res, 404, 'Utilisateur introuvable.')
    if (target.email?.toLowerCase() === ADMIN_EMAIL || profile?.role === 'admin') return replyError(res, 403, 'La protection des comptes administrateur empêche cette action.')

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: action === 'suspend' ? '876000h' : 'none'
    })
    if (error) return replyError(res, 502, 'Supabase n’a pas pu mettre à jour le statut de cet utilisateur.')
    return res.status(200).json({ ok: true, banned_until: data.user?.banned_until || null })
  }

  const page = Math.max(1, Math.min(10000, Number.parseInt(req.query?.page, 10) || 1))
  const perPage = Math.max(5, Math.min(50, Number.parseInt(req.query?.perPage, 10) || 20))
  const search = String(req.query?.q || '').trim().replace(/[^\p{L}\p{N}@.+_\-\s]/gu, '').slice(0, 80)
  let query = supabase.from('profiles')
    .select('id,full_name,email,role,plan,created_at,last_seen', { count: 'exact' })
    .order('created_at', { ascending: false })
  if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
  const start = (page - 1) * perPage
  const { data: profiles, count, error } = await query.range(start, start + perPage - 1)
  if (error) return replyError(res, 502, 'Impossible de charger la liste des utilisateurs.')

  const users = await Promise.all((profiles || []).map(async profile => {
    const { data } = await supabase.auth.admin.getUserById(profile.id)
    const user = data?.user
    const bannedUntil = user?.banned_until || null
    return {
      id: profile.id,
      name: profile.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '',
      email: profile.email || user?.email || '',
      role: profile.role || 'user',
      plan: profile.plan || 'free',
      created_at: profile.created_at,
      last_seen: profile.last_seen,
      last_sign_in_at: user?.last_sign_in_at || null,
      providers: user?.app_metadata?.providers || (user?.app_metadata?.provider ? [user.app_metadata.provider] : []),
      banned_until: bannedUntil,
      suspended: Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now())
    }
  }))

  return res.status(200).json({ users, page, perPage, total: count || 0, hasNext: start + users.length < (count || 0) })
}
