import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://zytrfwugneemhamekwna.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null
export const isSupabaseConfigured = Boolean(supabase)
export async function getEnabledOAuthProviders() {
  if (!url || !key) return []
  const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
  if (!response.ok) return []
  const settings = await response.json()
  return Object.entries(settings.external || {})
    .filter(([provider, enabled]) => enabled && ['google', 'github', 'discord', 'azure', 'apple', 'facebook', 'gitlab', 'linkedin_oidc'].includes(provider))
    .map(([provider]) => provider)
}
