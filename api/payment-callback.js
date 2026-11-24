export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const event = req.body || {}
  if (event.status === 'complete' || event.status === 'successful') {
    return res.status(200).json({ received: true, payment: 'verified' })
  }
  return res.status(200).json({ received: true })
}
