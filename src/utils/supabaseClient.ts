import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 如果環境變數缺失，創建 mock 客戶端以避免導入時出錯
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockSupabaseClient()

// Mock Supabase 客戶端，當環境變數缺失時使用
function createMockSupabaseClient() {
  return {
    from: () => ({
      select: () => Promise.resolve({ data: null, error: { message: 'Supabase 未配置' } }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Supabase 未配置' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Supabase 未配置' } }),
    }),
  }
}
