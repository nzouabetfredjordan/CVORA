import { randomUUID } from 'node:crypto'
import { isLiveNotchPayKey } from '../lib/notchpay.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' })
  const key = process.env.NOTCHPAY_PUBLIC_KEY
  if (!key || /^hsk_/i.test(key)) return res.status(503).json({ error: 'Configurez la clé publique NotchPay (et non la clé de hachage) pour recharger le portefeuille.' })
  if (!isLiveNotchPayKey(key)) return res.status(503).json({ error: 'Les recharges sont suspendues tant que la clé NotchPay Live n’est pas configurée.' })
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(503).json({ error: 'Supabase n’est pas configuré.' })
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Connectez-vous pour recharger le portefeuille.' })

  try {
    const auth = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } })
    if (!auth.ok) return res.status(401).json({ error: 'Votre session a expiré.' })
    const user = await auth.json()
    const amount = Number(req.body?.amount)
    if (![2000, 5000, 10000, 20000].includes(amount)) return res.status(400).json({ error: 'Choisissez une recharge de 2 000, 5 000, 10 000 ou 20 000 FCFA.' })
    const reference = `CVORA-WALLET-${user.id}-${randomUUID()}`
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'cvora-ten.vercel.app').split(',')[0]
    const protocol = req.headers['x-forwarded-proto'] || 'https'
    const response = await fetch('https://api.notchpay.co/payments', {
      method: 'POST',
      headers: { Authorization: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount, currency: 'XAF', customer: { name: user.user_metadata?.full_name || user.user_metadata?.name || user.email, email: user.email },
        description: `Recharge portefeuille CVORA (${amount} XAF)`, reference,
        callback: `${protocol}://${host}/dashboard?wallet_payment=${encodeURIComponent(reference)}`,
        metadata: { user_id: user.id, type: 'cvora_wallet_topup', amount }
      })
    })
    const result = await response.json()
    if (!response.ok) return res.status(response.status).json({ error: 'NotchPay n’a pas pu créer la recharge. Vérifiez que le compte marchand et le moyen de paiement sont actifs.' })
    const transaction = result.payment || result.transaction || result.data?.payment || result.data?.transaction || result.data || {}
    const authorizationUrl = result.authorization_url || transaction.authorization_url
    if (!authorizationUrl) return res.status(502).json({ error: 'NotchPay n’a pas retourné de lien de paiement.' })
    return res.status(200).json({ authorization_url: authorizationUrl })
  } catch {
    return res.status(502).json({ error: 'Impossible de joindre NotchPay.' })
  }
}
