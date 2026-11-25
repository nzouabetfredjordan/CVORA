export default async function handler(req, res) {
	if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
	const reference = req.query?.reference || req.body?.reference || req.body?.transaction?.reference
	if (!reference) return res.status(400).json({ error: 'Référence NotchPay manquante' })
	try {
		const key = process.env.NOTCHPAY_PUBLIC_KEY
		if (!key) return res.status(503).json({ error: 'NotchPay is not configured.' })
		const response = await fetch(`https://api.notchpay.co/payments/${encodeURIComponent(reference)}`, { headers: { Authorization: key, 'Content-Type': 'application/json' } })
		const data = await response.json()
		if (!response.ok) return res.status(response.status).json(data)
		const status = (data.payment || data.transaction || data.data?.payment || data.data?.transaction || data.data)?.status
		return res.status(200).json({ received: true, payment: status === 'complete' ? 'verified' : 'pending', reference, status })
	} catch (error) { return res.status(500).json({ error: 'Impossible de vérifier le paiement', detail: error.message }) }
}
