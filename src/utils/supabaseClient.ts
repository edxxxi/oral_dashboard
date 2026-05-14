import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// 如果環境變數缺失，創建 mock 客戶端以避免導入時出錯
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: sessionStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createMockSupabaseClient()

// Mock Supabase 客戶端，當環境變數缺失時使用
// 支援方法鏈 (insert().select()、update().eq() 等)
function createMockSupabaseClient() {
  const mockError = { message: 'Supabase 未配置' }

  type MockResult = { data: null; error: { message: string }; status: number }
  type MockChain = {
    select: () => MockChain
    insert: () => MockChain
    update: () => MockChain
    eq: () => MockChain
    order: () => MockChain
    maybeSingle: () => MockChain
    then: Promise<MockResult>['then']
    catch: Promise<MockResult>['catch']
  }

  function chain(): MockChain {
    return {
      select: () => chain(),
      insert: () => chain(),
      update: () => chain(),
      eq: () => chain(),
      order: () => chain(),
      maybeSingle: () => chain(),
      then: (onFulfilled, onRejected) => Promise.resolve({ data: null, error: mockError, status: 503 }).then(onFulfilled, onRejected),
      catch: (onRejected) => Promise.resolve({ data: null, error: mockError, status: 503 }).catch(onRejected),
    }
  }
  return {
    from: () => chain(),
    auth: {
      getSession: async () => ({ data: { session: null }, error: mockError }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: mockError }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    },
    functions: {
      invoke: async () => ({ data: null, error: mockError }),
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: mockError }),
        createSignedUrl: async () => ({ data: null, error: mockError }),
      }),
    },
  }
}
