import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('[Supabase] Config:', {
  url: supabaseUrl ? '✅ Set' : '❌ Missing',
  key: supabaseAnonKey ? '✅ Set' : '❌ Missing'
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] ⚠️ Missing environment variables!')
  console.log('VITE_SUPABASE_URL:', supabaseUrl)
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***' : 'MISSING')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

console.log('[Supabase] Client created successfully')
