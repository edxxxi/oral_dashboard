import { createClient } from 'jsr:@supabase/supabase-js@2'

type Role = 'admin' | 'nurse' | 'dietitian' | 'caregiver' | 'slp'

type StaffRow = {
  id: string
  email: string
  name: string
  role: Role
  active: boolean
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function badRequest(message: string) {
  return json({ error: message }, 400)
}

function isRole(value: unknown): value is Role {
  return value === 'admin' || value === 'nurse' || value === 'dietitian' || value === 'caregiver' || value === 'slp'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return badRequest('Only POST is allowed')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: 'Missing Supabase env in edge function' }, 500)
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: userData, error: userErr } = await authClient.auth.getUser()
  const caller = userData.user
  if (userErr || !caller) return json({ error: 'Unauthorized' }, 401)

  const { data: callerRow, error: callerRowErr } = await authClient
    .from('staff_accounts')
    .select('id, role, active')
    .eq('id', caller.id)
    .maybeSingle<{ id: string; role: Role; active: boolean }>()
  if (callerRowErr || !callerRow || callerRow.role !== 'admin' || !callerRow.active) {
    return json({ error: 'Permission denied' }, 403)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const action = body.action
  if (typeof action !== 'string') return badRequest('Missing action')

  if (action === 'list') {
    const { data, error } = await adminClient
      .from('staff_accounts')
      .select('id,email,name,role,active')
      .order('active', { ascending: false })
      .order('name', { ascending: true })
    if (error) return json({ error: error.message }, 500)
    return json((data ?? []) as StaffRow[])
  }

  if (action === 'create') {
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '').trim()
    const name = String(body.name ?? '').trim()
    const role = body.role
    const active = Boolean(body.active ?? true)

    if (!email || !password || !name) return badRequest('email/name/password are required')
    if (password.length < 6) return badRequest('password must be at least 6 characters')
    if (!isRole(role)) return badRequest('invalid role')

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    })
    if (createErr || !created.user) return json({ error: createErr?.message ?? 'create user failed' }, 400)

    const row: StaffRow = {
      id: created.user.id,
      email,
      name,
      role,
      active,
    }
    const { error: upsertErr } = await adminClient.from('staff_accounts').upsert(row)
    if (upsertErr) {
      await adminClient.auth.admin.deleteUser(created.user.id)
      return json({ error: upsertErr.message }, 400)
    }
    return json(row, 201)
  }

  if (action === 'set_password') {
    const userId = String(body.userId ?? '').trim()
    const password = String(body.password ?? '').trim()
    if (!userId || !password) return badRequest('userId/password are required')
    if (password.length < 6) return badRequest('password must be at least 6 characters')

    const { error } = await adminClient.auth.admin.updateUserById(userId, { password })
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  if (action === 'set_active') {
    const userId = String(body.userId ?? '').trim()
    const active = Boolean(body.active)
    if (!userId) return badRequest('userId is required')

    const { data: target, error: targetErr } = await adminClient
      .from('staff_accounts')
      .select('id,email,name,role,active')
      .eq('id', userId)
      .maybeSingle<StaffRow>()
    if (targetErr || !target) return json({ error: 'Account not found' }, 404)

    if (!active && target.role === 'admin' && target.active) {
      const { count, error: countErr } = await adminClient
        .from('staff_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('active', true)
      if (countErr) return json({ error: countErr.message }, 500)
      if ((count ?? 0) <= 1) return json({ error: '至少需要保留一個啟用中的主管帳號' }, 400)
    }

    const { data: updated, error: updateErr } = await adminClient
      .from('staff_accounts')
      .update({ active })
      .eq('id', userId)
      .select('id,email,name,role,active')
      .single<StaffRow>()
    if (updateErr || !updated) return json({ error: updateErr?.message ?? 'update failed' }, 400)
    return json(updated)
  }

  if (action === 'delete') {
    const userId = String(body.userId ?? '').trim()
    if (!userId) return badRequest('userId is required')
    if (userId === caller.id) return json({ error: '不可刪除目前登入中的帳號' }, 400)

    const { data: target, error: targetErr } = await adminClient
      .from('staff_accounts')
      .select('id,role,active')
      .eq('id', userId)
      .maybeSingle<{ id: string; role: Role; active: boolean }>()
    if (targetErr || !target) return json({ error: 'Account not found' }, 404)

    if (target.role === 'admin' && target.active) {
      const { count, error: countErr } = await adminClient
        .from('staff_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('active', true)
      if (countErr) return json({ error: countErr.message }, 500)
      if ((count ?? 0) <= 1) return json({ error: '至少需要保留一個啟用中的主管帳號' }, 400)
    }

    const { error } = await adminClient.auth.admin.deleteUser(userId)
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  return badRequest('Unknown action')
})
