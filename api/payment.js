export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const secret = process.env.NOTCHPAY_SECRET_KEY
  if (!secret) return res.status(503).json({ error: 'NOTCHPAY_SECRET_KEY n’est pas configurée' })

  const { amount, currency = 'XAF', email, phone, method, description } = req.body || {}
  if (!amount || !email) return res.status(400).json({ error: 'amount and email are required' })

  try {
    const response = await fetch('https://api.notchpay.co/payments', {
      method: 'POST',
      headers: { Authorization: secret, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency,
        email,
        phone,
        description: description || 'Achat CVORA',
        reference: `CVORA-${Date.now()}`,
        metadata: { provider: method || 'mobile_money' },
        callback: process.env.NOTCHPAY_CALLBACK_URL
      })
    })
    const data = await response.json()
    if (!response.ok) return res.status(response.status).json(data)
    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({ error: 'Erreur de connexion à NotchPay', detail: error.message })
  }
}
