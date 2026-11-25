export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const key = process.env.NOTCHPAY_PUBLIC_KEY || process.env.NOTCHPAY_SECRET_KEY
  if (!key) return res.status(503).json({ error: 'Clé NotchPay non configurée' })
  const { amount, currency = 'XAF', email, phone, method, description, documentType } = req.body || {}
  const numericPhone = String(phone || '').replace(/[^0-9]/g, '')
  if (!amount || Number(amount) < 500) return res.status(400).json({ error: 'Montant invalide' })
  if (!email) return res.status(400).json({ error: 'Adresse e-mail requise' })
  if (!/^6[0-9]{8}$/.test(numericPhone)) return res.status(400).json({ error: 'Numéro Mobile Money camerounais invalide. Utilisez 9 chiffres commençant par 6.' })
  const isOrange = method === 'Orange Money'
  const channel = isOrange ? 'cm.orange' : 'cm.mtn'
  const callbackUrl = `https://${req.headers['x-forwarded-host'] || req.headers.host || 'cvora-ten.vercel.app'}/api/payment-callback`
  const headers = { Authorization: key, 'Content-Type': 'application/json' }
  const mtnReceiver = process.env.NOTCHPAY_MTN_RECEIVER || '680409437'
  const orangeReceiver = process.env.NOTCHPAY_ORANGE_RECEIVER || '698419257'
  try {
    const initResponse = await fetch('https://api.notchpay.co/payments', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: Number(amount),
        currency,
        customer: {
          name: 'Client CVORA',
          email,
          phone: `+237${numericPhone}`
        },
        title: documentType ? `Achat CVORA — ${documentType}` : 'Achat CVORA',
        description: description || `Achat CVORA — ${documentType || 'Document'}`,
        reference: `CVORA-${Date.now()}-${numericPhone.slice(-4)}`,
        metadata: {
          provider: method || 'MTN Mobile Money',
          merchant_name: 'NZOUABET Fred Jordan',
          merchant_mtn: mtnReceiver,
          merchant_orange: orangeReceiver,
          document_type: documentType || 'document'
        },
        callback: callbackUrl
      })
    })
    const initialized = await initResponse.json()
    if (!initResponse.ok) return res.status(initResponse.status).json(initialized)
    const reference = initialized.transaction?.reference
    if (!reference) return res.status(502).json({ error: 'Référence NotchPay non retournée', detail: initialized })
    const chargeResponse = await fetch(`https://api.notchpay.co/payments/${encodeURIComponent(reference)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ channel, data: { account_number: `+237${numericPhone}` } })
    })
    const charged = await chargeResponse.json()
    if (!chargeResponse.ok) return res.status(chargeResponse.status).json({ ...charged, reference })
    return res.status(200).json({ ...charged, reference, channel, mode: key.startsWith('pk_test') || key.startsWith('sk_test') ? 'test' : 'live', merchant: 'NZOUABET Fred Jordan' })
  } catch (error) {
    return res.status(500).json({ error: 'Erreur de connexion à NotchPay', detail: error.message })
  }
}
