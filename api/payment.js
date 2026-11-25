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

function detectOperator(phone) {
  if (/^(?:650|651|652|653|654|67|680|681|682|683)/.test(phone)) return 'MTN Mobile Money'
  if (/^(?:64|655|656|657|658|659|686|687|688|689|69)/.test(phone)) return 'Orange Money'
  if (/^(?:66|684|685)/.test(phone)) return 'unsupported'
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })
  // Collection endpoints use the public API key. Keep private/hash keys out of
  // this flow; they are not substitutes for the public key.
  const key = process.env.NOTCHPAY_PUBLIC_KEY
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

  const { name, phone, method: requestedMethod, documentType } = req.body || {}
  const customerName = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 120)
  const numericPhone = String(phone || '').replace(/\D/g, '').replace(/^237/, '')
  const product = productFor(documentType)
  const detectedOperator = detectOperator(numericPhone)
  const method = requestedMethod || (detectedOperator !== 'unsupported' ? detectedOperator : '')
  if (customerName.length < 2) return res.status(400).json({ error: 'Saisissez votre nom complet.' })
  if (!/^6[0-9]{8}$/.test(numericPhone)) return res.status(400).json({ error: 'Numéro Mobile Money invalide : saisissez 9 chiffres commençant par 6.' })
  if (!product) return res.status(400).json({ error: 'Type de document invalide.' })
  if (detectedOperator === 'unsupported') return res.status(400).json({ error: 'Ce numero semble appartenir a Nexttel. Seuls MTN Mobile Money et Orange Money sont disponibles.' })
  if (!['MTN Mobile Money', 'Orange Money'].includes(method)) return res.status(400).json({ error: 'Choisissez MTN Mobile Money ou Orange Money.' })
  if (!user.email) return res.status(400).json({ error: 'Votre compte doit avoir une adresse e-mail vérifiée pour le paiement.' })

  const isTestKey = /test/i.test(key)
  if (/^hsk_/i.test(key)) return res.status(503).json({ error: 'Cette clé NotchPay est une clé de hachage, pas une clé publique de paiement. Configurez NOTCHPAY_PUBLIC_KEY avec la clé publique du mode souhaité.' })
  const testNumbers = new Set(['670000000', '670000001', '670000002', '670000003', '670000004'])
  if (isTestKey && !testNumbers.has(numericPhone)) return res.status(409).json({ error: 'Les paiements réels ne sont pas activés pour CVORA. Le compte marchand NotchPay doit être validé, puis sa clé de production configurée dans Vercel.' })

  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'cvora-ten.vercel.app').split(',')[0]
  const protocol = req.headers['x-forwarded-proto'] || 'https'
  const callbackUrl = `${protocol}://${host}/api/payment-callback`
  const reference = `CVORA-${user.id}-${randomUUID()}`
  const headers = { Authorization: key, 'Content-Type': 'application/json' }
  const channel = method === 'Orange Money' ? 'cm.orange.ussd' : 'cm.mtn.ussd'

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
        metadata: { user_id: user.id, document_type: documentType, product_name: product.title },
        callback: callbackUrl
      })
    })
    const initialized = await initializedResponse.json()
    if (!initializedResponse.ok) return res.status(initializedResponse.status).json({ error: 'NotchPay a refusé la création du paiement. Vérifiez le compte marchand, les paramètres et les moyens de paiement activés.' })

    const initializedPayment = initialized.payment || initialized.transaction || initialized.data?.payment || initialized.data?.transaction || initialized.data || {}
    const transactionReference = initializedPayment.reference || reference
    const chargeResponse = await fetch(`https://api.notchpay.co/payments/${encodeURIComponent(transactionReference)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ channel, data: { phone: `+237${numericPhone}` } })
    })
    const charged = await chargeResponse.json()
    if (!chargeResponse.ok) return res.status(chargeResponse.status).json({ error: 'NotchPay n’a pas pu démarrer la demande Mobile Money. Vérifiez le numéro et réessayez.' })

    const transaction = charged.payment || charged.transaction || charged.data?.payment || charged.data?.transaction || charged.data || {}
    return res.status(202).json({
      reference: transactionReference,
      status: transaction.status || 'pending',
      ussdCode: charged.ussd_code || charged.data?.ussd_code || transaction.ussd_code || null,
      mode: isTestKey ? 'test' : 'live',
      operator: method
    })
  } catch {
    return res.status(502).json({ error: 'Impossible de joindre NotchPay. Réessayez dans quelques instants.' })
  }
}
