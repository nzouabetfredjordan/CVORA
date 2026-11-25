// Accept both documented live-key spellings, including pk_live_... forms.
// Refuse sandbox and hash keys before any request can create a payment.
export function isLiveNotchPayKey(value) {
  const key = String(value || '').trim()
  return !/test/i.test(key) && /^(?:pk_)?live_/i.test(key)
}
