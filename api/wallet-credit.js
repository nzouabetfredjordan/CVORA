const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' })
  const notchpayKey = process.env.NOTCHPAY_PUBLIC_KEY
  if (!notchpayKey || !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: 'Le portefeuille n’est pas entièrement configuré sur le serveur.' })
  }
  if (/test/i.test(notchpayKey)) return res.status(503).json({ error: 'Les crédits de portefeuille sont suspendus en mode test. Configurez la clé NotchPay de production.' })
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const reference = String(req.body?.reference || '')
  if (!token) return res.status(401).json({ error: 'Connectez-vous pour confirmer la recharge.' })
  try {
    const auth = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } })
    if (!auth.ok) return res.status(401).json({ error: 'Votre session a expiré.' })
    const user = await auth.json()
    if (!new RegExp(`^CVORA-WALLET-${user.id}-[a-f0-9-]{36}$`, 'i').test(reference)) return res.status(403).json({ error: 'Cette recharge ne correspond pas à votre compte.' })

    const paymentResponse = await fetch(`https://api.notchpay.co/payments/${encodeURIComponent(reference)}`, { headers: { Authorization: notchpayKey } })
    const paymentResult = await paymentResponse.json()
    if (!paymentResponse.ok) return res.status(paymentResponse.status).json({ error: paymentResult.message || 'Paiement introuvable chez NotchPay.' })
    const payment = paymentResult.payment || paymentResult.transaction || paymentResult.data?.payment || paymentResult.data?.transaction || paymentResult.data || {}
    if (String(payment.status || '').toLowerCase() !== 'complete') return res.status(409).json({ error: 'Le paiement n’est pas confirmé. Votre portefeuille n’a pas été crédité.' })
    const amount = Number(payment.amount)
    if (![2000, 5000, 10000, 20000].includes(amount) || (payment.reference && payment.reference !== reference)) return res.status(400).json({ error: 'Montant ou référence du paiement invalide.' })

    const credited = await fetch(`${SUPABASE_URL}/rest/v1/rpc/cvora_wallet_credit`, {
      method: 'POST',
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_user: user.id, p_amount: amount, p_reference: reference, p_description: `Recharge NotchPay confirmée (${amount} XAF)` })
    })
    const balance = await credited.json()
    if (!credited.ok) return res.status(502).json({ error: 'Le paiement est confirmé, mais le crédit du portefeuille a échoué. Contactez le support pour rétablir le solde.' })
    return res.status(200).json({ credited: true, balance: Number(balance) })
  } catch {
    return res.status(502).json({ error: 'Impossible de vérifier ou créditer cette recharge.' })
  }
}
