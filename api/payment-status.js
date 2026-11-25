const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' })
  const key = process.env.NOTCHPAY_PUBLIC_KEY
  const reference = String(req.query?.reference || '')
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!key || !SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(503).json({ error: 'Le paiement n’est pas configuré.' })
  const match = reference.match(/^CVORA-([a-f0-9-]{36})-([a-f0-9-]{36})$/i)
  if (!match) return res.status(400).json({ error: 'Référence de paiement invalide.' })
  if (!token) return res.status(401).json({ error: 'Connectez-vous pour vérifier le paiement.' })

  try {
    const auth = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } })
    if (!auth.ok) return res.status(401).json({ error: 'Votre session a expiré.' })
    const user = await auth.json()
    if (user.id !== match[1]) return res.status(403).json({ error: 'Ce paiement ne correspond pas à votre compte.' })
    const response = await fetch(`https://api.notchpay.co/payments/${encodeURIComponent(reference)}`, { headers: { Authorization: key } })
    const result = await response.json()
    if (!response.ok) return res.status(response.status).json({ error: 'Statut de paiement momentanément indisponible.' })
    const transaction = result.payment || result.transaction || result.data?.payment || result.data?.transaction || result.data || {}
    const rawStatus = String(transaction.status || result.status || 'pending').toLowerCase()
    const status = rawStatus === 'complete' || rawStatus === 'completed' ? 'complete'
      : ['failed', 'canceled', 'cancelled', 'expired', 'rejected'].includes(rawStatus) ? 'failed' : 'pending'
    if (status === 'complete' && SUPABASE_SERVICE_ROLE_KEY) {
      const record = await fetch(`${SUPABASE_URL}/rest/v1/rpc/cvora_record_payment`, { method: 'POST', headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_user: user.id, p_reference: reference, p_amount: Number(transaction.amount), p_kind: 'document' }) })
      if (!record.ok) return res.status(502).json({ error: 'Paiement confirmé mais son enregistrement comptable a échoué. Contactez le support.' })
    }
    return res.status(200).json({ status })
  } catch {
    return res.status(502).json({ error: 'Impossible de vérifier le statut auprès de NotchPay.' })
  }
}
