import { createHmac, timingSafeEqual } from 'node:crypto'
import { isLiveNotchPayKey } from '../lib/notchpay.js'

export const config = { api: { bodyParser: false } }

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

async function readRawBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 1024 * 1024) throw new Error('Webhook payload too large')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

function validSignature(payload, signature, secret) {
  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return false
  const expected = createHmac('sha256', secret).update(payload).digest()
  const received = Buffer.from(signature, 'hex')
  return received.length === expected.length && timingSafeEqual(received, expected)
}

async function rpc(name, args) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  })
  if (!response.ok) throw new Error(`Supabase RPC ${name} failed`)
  const body = await response.text()
  return body ? JSON.parse(body) : null
}

async function fulfill(payment) {
  const reference = String(payment.reference || '')
  const amount = Number(payment.amount)
  const userIdFromWallet = reference.match(new RegExp(`^CVORA-WALLET-(${UUID})-${UUID}$`, 'i'))?.[1]
  if (userIdFromWallet) {
    if (![2000, 5000, 10000, 20000].includes(amount)) throw new Error('Unexpected wallet amount')
    await rpc('cvora_wallet_credit', {
      p_user: userIdFromWallet,
      p_amount: amount,
      p_reference: reference,
      p_description: `Recharge NotchPay confirmée (${amount} XAF)`
    })
    return
  }

  const subscription = reference.match(new RegExp(`^CVORA-SUB-(${UUID})-(day1|day2|month4)-${UUID}$`, 'i'))
  if (subscription) {
    const prices = { day1: 1500, day2: 2500, month4: 9500 }
    const plan = subscription[2].toLowerCase()
    if (prices[plan] !== amount) throw new Error('Subscription amount mismatch')
    await rpc('cvora_activate_subscription', {
      p_user: subscription[1], p_plan: plan, p_reference: reference, p_amount: amount
    })
    return
  }

  const document = reference.match(new RegExp(`^CVORA-(${UUID})-${UUID}$`, 'i'))
  if (document) {
    const type = String(payment.metadata?.document_type || '').toLowerCase()
    const expectedAmount = type.includes('stage') ? 500 : type.includes('emploi') ? 500 : type.includes('lettre') ? 1000 : type.includes('cv') ? 1500 : null
    if (expectedAmount === null || amount !== expectedAmount) throw new Error('Document payment amount mismatch')
    await rpc('cvora_record_payment', {
      p_user: document[1], p_reference: reference, p_amount: amount, p_kind: 'document'
    })
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const secret = process.env.NOTCHPAY_WEBHOOK_HASH
  const apiKey = process.env.NOTCHPAY_PUBLIC_KEY
  if (!secret || !apiKey || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: 'NotchPay webhook is not fully configured.' })
  }
  if (!isLiveNotchPayKey(apiKey)) return res.status(503).json({ error: 'Live webhook fulfillment is not enabled.' })

  try {
    const rawBody = await readRawBody(req)
    const signature = String(req.headers['x-notch-signature'] || '')
    if (!validSignature(rawBody, signature, secret)) return res.status(401).json({ error: 'Invalid signature' })

    const event = JSON.parse(rawBody.toString('utf8'))
    if (event.type !== 'payment.complete') return res.status(200).json({ received: true })
    const eventPayment = event.data?.payment || event.data?.transaction || event.data || {}
    const suppliedReference = String(eventPayment.reference || event.reference || eventPayment.id || '')
    if (!suppliedReference) return res.status(400).json({ error: 'Missing payment reference' })

    // Treat the signed notification as a prompt only; verify the current payment
    // state and amount directly with Notch Pay before changing any CVORA records.
    const response = await fetch(`https://api.notchpay.co/payments/${encodeURIComponent(suppliedReference)}`, {
      headers: { Authorization: apiKey }
    })
    const result = await response.json()
    if (!response.ok) return res.status(502).json({ error: 'Unable to verify payment with Notch Pay' })
    const payment = result.payment || result.transaction || result.data?.payment || result.data?.transaction || result.data || {}
    if (!['complete', 'completed'].includes(String(payment.status || '').toLowerCase())) {
      return res.status(200).json({ received: true, pending: true })
    }
    if (String(payment.currency || '').toUpperCase() !== 'XAF' || !Number.isSafeInteger(Number(payment.amount)) || Number(payment.amount) < 1) {
      return res.status(400).json({ error: 'Invalid payment details' })
    }
    await fulfill(payment)
    return res.status(200).json({ received: true, fulfilled: true })
  } catch (error) {
    console.error('NotchPay webhook processing failed:', error.message)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}
