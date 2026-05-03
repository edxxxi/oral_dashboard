import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 如果環境變數缺失，創建 mock 客戶端以避免導入時出錯
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockSupabaseClient()

// Mock Supabase 客戶端，當環境變數缺失時使用
// 支援方法鏈 (insert().select()、update().eq() 等)
function createMockSupabaseClient() {
  const mockError = { message: 'Supabase 未配置' }
  function chain(): any {
    const c: any = {
      select: () => chain(),
      insert: () => chain(),
      update: () => chain(),
      eq: () => chain(),
      order: () => chain(),
      then: (res: any, rej: any) => Promise.resolve({ data: null, error: mockError }).then(res, rej),
      catch: (rej: any) => Promise.resolve({ data: null, error: mockError }).catch(rej),
    }
    return c
  }
  return { from: () => chain() }
}
