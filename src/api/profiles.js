import { supabase } from './supabase'

export const getPublicProfile = async (uid) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, company_name, city, identity_mode, identity_number, avatar_url, segment')
    .eq('id', uid)
    .maybeSingle()
  if (error) throw error
  return data
}

export const getProfile = async (uid) => {
  // Leer perfil público + datos privados en paralelo
  const [profileRes, privRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
    supabase.from('profiles_private').select('phone, email').eq('id', uid).maybeSingle(),
  ])

  let base = profileRes.data
  // Si el SELECT con `*` falló (ej: RLS sobre alguna columna), reintentar con
  // las columnas mínimas seguras para no perder el perfil existente.
  if (profileRes.error || !base) {
    if (profileRes.error) console.warn('profiles select * falló:', profileRes.error.message)
    const fallback = await supabase
      .from('profiles')
      .select('id, full_name, company_name, city, identity_mode, identity_number, avatar_url, role, segment, email_domain')
      .eq('id', uid)
      .maybeSingle()
    if (fallback.data) base = fallback.data
    else if (fallback.error) throw fallback.error
  }

  if (!base) return null
  if (privRes.error) console.warn('profiles_private select falló:', privRes.error.message)
  const priv = privRes.data
  return { ...base, phone: priv?.phone || null, email: priv?.email || null }
}

export const uploadAvatar = async (uid, file) => {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${uid}/avatar.${ext}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { cacheControl: '3600', upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  // Forzar cache bust
  return data.publicUrl + '?t=' + Date.now()
}

const tryWithFallback = async (op, payload) => {
  let { data, error } = await op(payload)
  while (error && error.message?.includes('column')) {
    const bad = error.message.match(/'([^']+)' column/) || error.message.match(/column "([^"]+)"/)
    if (!bad) break
    const col = bad[1].replace(/^profiles\./, '')
    if (!(col in payload)) break
    delete payload[col]
    console.warn('Columna no existe:', col, '- reintentando sin ella')
    const r = await op(payload)
    data = r.data; error = r.error
  }
  return { data, error }
}

export const updateProfile = async (uid, fields) => {
  const phone = fields.phone?.trim() || null
  const email = fields.email || null

  // Datos PÚBLICOS → profiles (sin teléfono ni email completo)
  const payload = {
    full_name: fields.full_name?.trim() || null,
    company_name: fields.company_name?.trim() || null,
    city: fields.city || null,
    identity_mode: fields.identity_mode || 'anon',
    identity_number: fields.identity_number || null,
    email_domain: fields.email_domain || (email ? '@' + email.split('@')[1] : null),
    updated_at: new Date().toISOString(),
  }
  if (fields.segment) payload.segment = fields.segment
  if (fields.avatar_url !== undefined) payload.avatar_url = fields.avatar_url

  const upd = await tryWithFallback(
    p => supabase.from('profiles').update(p).eq('id', uid).select().maybeSingle(),
    { ...payload }
  )
  let row = upd.data
  if (upd.error || !upd.data) {
    const ins = await tryWithFallback(
      p => supabase.from('profiles').insert({ id: uid, created_at: new Date().toISOString(), ...p }).select().single(),
      { ...payload }
    )
    if (ins.error) throw ins.error
    row = ins.data
  }

  // Contacto PRIVADO → profiles_private (solo el dueño lo lee)
  // tryWithFallback maneja columnas que no existen (ej: updated_at puede no estar)
  const privResult = await tryWithFallback(
    p => supabase.from('profiles_private').upsert(p).select().maybeSingle(),
    { id: uid, phone, email, updated_at: new Date().toISOString() }
  )
  if (privResult.error) {
    // Si falla por RLS u otro motivo, lo advertimos pero NO bloqueamos al usuario
    console.warn('profiles_private upsert falló:', privResult.error.message)
  }

  return { ...row, phone, email }
}

export const uploadCover = async (uid, file) => {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${uid}/cover.${ext}`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { cacheControl: '3600', upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl + '?t=' + Date.now()
}
