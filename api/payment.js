import { randomUUID } from 'node:crypto'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

const PRODUCTS = {
  cv: { amount: 1500, title: 'CV' },
  letter: { amount: 1000, title: 'Lettre de motivation' },
  job: { amount: 500, title: 'Demande d’emploi' },
  stage: { amount: 500, title: 'Demande de stage' }
}

function productFor(value = '') {
  const text = String(value).toLowerCase()
  if (text.includes('stage')) return PRODUCTS.stage
  if (text.includes('emploi')) return PRODUCTS.job
  if (text.includes('lettre')) return PRODUCTS.letter
  if (text.includes('cv')) return PRODUCTS.cv
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })
  const key = process.env.NOTCHPAY_PUBLIC_KEY || process.env.NOTCHPAY_SECRET_KEY
  if (!key) return res.status(503).json({ error: 'NotchPay n’est pas configuré sur le serveur.' })
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(503).json({ error: 'Supabase Auth n’est pas configuré sur le serveur.' })

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Connectez-vous avant de payer.' })
  let userResponse
  try {
    userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
    })
  } catch {
    return res.status(502).json({ error: 'Impossible de vérifier votre session.' })
  }
  if (!userResponse.ok) return res.status(401).json({ error: 'Votre session a expiré. Reconnectez-vous.' })
  const user = await userResponse.json()

  const { name, phone, method, documentType } = req.body || {}
  const customerName = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 120)
  const numericPhone = String(phone || '').replace(/\D/g, '').replace(/^237/, '')
  const product = productFor(documentType)
  if (customerName.length < 2) return res.status(400).json({ error: 'Saisissez votre nom complet.' })
  if (!/^6[0-9]{8}$/.test(numericPhone)) return res.status(400).json({ error: 'Numéro Mobile Money invalide : saisissez 9 chiffres commençant par 6.' })
  if (!product) return res.status(400).json({ error: 'Type de document invalide.' })
  if (!['MTN Mobile Money', 'Orange Money'].includes(method)) return res.status(400).json({ error: 'Choisissez MTN Mobile Money ou Orange Money.' })
  if (!user.email) return res.status(400).json({ error: 'Votre compte doit avoir une adresse e-mail vérifiée pour le paiement.' })

  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'cvora-ten.vercel.app').split(',')[0]
  const protocol = req.headers['x-forwarded-proto'] || 'https'
  const callbackUrl = `${protocol}://${host}/api/payment-callback`
  const reference = `CVORA-${user.id}-${randomUUID()}`
  const headers = { Authorization: key, 'Content-Type': 'application/json' }
  const channel = method === 'Orange Money' ? 'cm.orange' : 'cm.mtn'

  try {
    const initializedResponse = await fetch('https://api.notchpay.co/payments', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: product.amount,
        currency: 'XAF',
        customer: { name: customerName, email: user.email, phone: `+237${numericPhone}` },
        title: `CVORA — ${product.title}`,
        description: `Document CVORA : ${product.title}`,
        reference,
        callback: callbackUrl
      })
    })
    const initialized = await initializedResponse.json()
    if (!initializedResponse.ok) return res.status(initializedResponse.status).json({ error: initialized.message || 'NotchPay a refusé la création du paiement.' })

    const transactionReference = initialized.transaction?.reference || initialized.data?.reference || reference
    const chargeResponse = await fetch(`https://api.notchpay.co/payments/${encodeURIComponent(transactionReference)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ channel, phone: `+237${numericPhone}` })
    })
    const charged = await chargeResponse.json()
    if (!chargeResponse.ok) return res.status(chargeResponse.status).json({ error: charged.message || 'NotchPay n’a pas pu démarrer la demande USSD.', reference: transactionReference })

    const transaction = charged.transaction || charged.data || {}
    return res.status(202).json({
      reference: transactionReference,
      status: transaction.status || 'pending',
      mode: key.startsWith('test_') ? 'test' : 'live'
    })
  } catch {
    return res.status(502).json({ error: 'Impossible de joindre NotchPay. Réessayez dans quelques instants.' })
  }
}
