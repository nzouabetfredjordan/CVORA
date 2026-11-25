# Notch Pay production setup

CVORA keeps all Notch Pay credentials in server-side Vercel environment variables. Never prefix these values with `VITE_` and never commit them.

## Vercel variables

Set these values for the **Production** environment:

- `NOTCHPAY_PUBLIC_KEY`: the public API key selected in Notch Pay Production mode. CVORA accepts only Live key formats (`live_...` or `pk_live_...`); sandbox and hash keys are rejected by payment and fulfillment routes.
- `NOTCHPAY_WEBHOOK_HASH`: the Hash Key shown for the registered webhook endpoint in the same Notch Pay environment. This is not the payment API key.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key, server-side only.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`: the project URL and public/publishable key used by the application.

After changing any Vercel environment variable, redeploy Production so the serverless functions receive the new values.

## Notch Pay webhook

After deploying the code, register this endpoint in Notch Pay **Settings → Webhooks**:

`https://cvora-ten.vercel.app/api/notchpay-webhook`

Subscribe to `payment.complete` and `payment.failed`. Save the endpoint and put its matching Hash Key in `NOTCHPAY_WEBHOOK_HASH`. Notch Pay signs the raw request body with HMAC-SHA256 in the `x-notch-signature` header. The endpoint verifies this signature, then retrieves the payment from Notch Pay and checks its status, currency and amount before recording it or crediting a wallet/subscription. Duplicate events are safe because the Supabase fulfillment functions are idempotent.

CVORA deliberately refuses checkout, payment confirmation, wallet credit and subscription activation whenever the configured public key contains `test`. This prevents simulated transactions from being mistaken for real money. For Production, use the approved Production public key and the matching Production webhook Hash Key; never mix credentials from different environments.

## Supabase prerequisites

Before accepting payments, run the repository migrations in the Supabase SQL Editor in order:

1. `supabase/schema.sql`
2. `supabase/wallet.sql`
3. `supabase/analytics-subscriptions.sql`

These create the payment ledger, wallet and subscription RPCs used to verify/fulfill confirmed purchases. The application must not mark a purchase paid based only on a browser redirect or webhook body; it independently checks the transaction with the Notch Pay API.

Before enabling Production, reconcile any wallet balances or subscription entitlements created during earlier sandbox use. The current guard prevents new sandbox fulfillment, but it cannot determine whether historical credits represent real funds.

## Live activation

Notch Pay must first verify the merchant account and enable Production. An individual merchant should upload the requested identity and address documents directly to the Notch Pay dashboard. Ask Notch Pay to confirm that CVORA's non-transferable, non-withdrawable, CVORA-only prepaid wallet is acceptable before enabling live wallet top-ups. After their approval, add the Production public key and matching webhook Hash Key to Vercel and redeploy.
