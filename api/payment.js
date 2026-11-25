export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const key = process.env.NOTCHPAY_PUBLIC_KEY || process.env.NOTCHPAY_SECRET_KEY
  if (!key) return res.status(503).json({ error: 'Clé NotchPay non configurée' })

  const { amount, currency = 'XAF', email, phone, method, description } = req.body || {}
  if (!amount || !email) return res.status(400).json({ error: 'amount and email are required' })

  const callbackUrl = `https://${req.headers['x-forwarded-host'] || req.headers.host || 'cvora-ten.vercel.app'}/api/payment-callback`

  try {
    const response = await fetch('https://api.notchpay.co/payments', {
      method: 'POST',
      headers: { Authorization: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency,
        customer: {
          name: 'Client CVORA',
          email,
          phone: phone?.startsWith('+') ? phone : `+237${phone}`
        },
        description: description || 'Achat CVORA',
        reference: `CVORA-${Date.now()}`,
        metadata: { provider: method || 'mobile_money' },
        callback: callbackUrl
      })
    })
    const data = await response.json()
    if (!response.ok) return res.status(response.status).json(data)
    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({ error: 'Erreur de connexion à NotchPay', detail: error.message })
  }
}
