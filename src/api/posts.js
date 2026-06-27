import { supabase } from './supabase'

const MAX_FILE_MB = 15
const UPLOAD_TIMEOUT_MS = 30_000

export const uploadMedia = async (file, authorId) => {
  // Validar tamaño antes de intentar subir
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`El archivo "${file.name}" supera el límite de ${MAX_FILE_MB} MB.`)
  }
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${authorId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  // Timeout de 30s: si Storage no responde, lanza error en lugar de congelarse
  const uploadPromise = supabase.storage
    .from('post-media')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`La subida de "${file.name}" tardó demasiado. Intenta con una conexión más estable.`)), UPLOAD_TIMEOUT_MS)
  )
  const { error } = await Promise.race([uploadPromise, timeoutPromise])
  if (error) throw error
  const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(path)
  return { url: urlData.publicUrl, type: file.type, name: file.name, path }
}

export const createPost = async (payload, mediaFiles = []) => {
  const { author_id, title, content, category, subcategory, location, intent, event_date } = payload
  let media = []
  if (mediaFiles.length > 0) {
    media = await Promise.all(mediaFiles.map(f => uploadMedia(f, author_id)))
  }
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id, title, content: content || '', category,
      subcategory: subcategory || null,
      location:    location    || null,
      intent:      intent      || 'ofrecen',
      event_date:  event_date  || null,
      media: media.length > 0 ? media : null,
    })
    .select().single()
  // Rate limit: mensaje amigable
  if (error?.message?.includes('rate_limit_exceeded')) {
    throw new Error('Máximo 10 publicaciones por hora. Intenta más tarde.')
  }
  if (error) throw error
  return data
}

// Próximos eventos: posts con event_date futura, ordenados por fecha, máximo 3
export const getUpcomingEvents = async () => {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, event_date, category, subcategory')
    .not('event_date', 'is', null)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(3)
  if (error) return []
  return data || []
}

// ─── SCORE DE ENGAGEMENT ────────────────────────────────────────────────────
// score = (reacciones * 3) + (comentarios * 5) + decaimiento temporal
const engagementScore = (post) => {
  const ageHours = (Date.now() - new Date(post.created_at)) / 3_600_000
  const reactions = post.reaction_count || 0
  const comments  = post.comment_count  || 0
  const raw = (reactions * 3) + (comments * 5)
  return raw / Math.log2(ageHours + 2)
}

export const listPosts = async ({ cursor, limit = 20, filters = {}, sort = 'smart' } = {}) => {
  // Smart sort: trae el doble para tener margen de ranking sin desperdiciar el triple
  const fetchLimit = sort === 'smart' ? Math.min(limit * 2, 40) : limit

  let q = supabase
    .from('posts')
    .select(`
      *,
      profiles!posts_author_id_fkey(id, full_name, identity_mode, identity_number, city, avatar_url),
      reaction_count:reactions(count),
      comment_count:comments(count),
      reactions(type, user_id)
    `)
    .order('created_at', { ascending: false })
    .limit(fetchLimit)

  if (cursor) q = q.lt('created_at', cursor)

  // Tab-level: filtrar por array de categorías (Tienda, Novedades, Vacantes)
  if (filters.categories?.length) q = q.in('category', filters.categories)

  // Categoría individual dentro de Tienda
  if (filters.category)    q = q.eq('category', filters.category)
  if (filters.subcategory) q = q.eq('subcategory', filters.subcategory)

  // Intent: Buscan / Ofrecen — usa idx_posts_intent
  if (filters.intent) q = q.eq('intent', filters.intent)

  // Ubicación (Vacantes) — usa idx_posts_location
  if (filters.location) q = q.eq('location', filters.location)

  // Búsqueda: FTS con GIN en español para ≥3 chars, ilike para 1-2
  if (filters.search) {
    const term = filters.search.trim()
    if (term.length >= 3) {
      q = q.textSearch('title', term, { type: 'websearch', config: 'spanish' })
    } else {
      const safe = term.replace(/[%_\\]/g, '\\$&')
      q = q.ilike('title', `%${safe}%`)
    }
  }

  const { data, error } = await q
  if (error) throw error

  let posts = (data || []).map(p => ({
    ...p,
    reaction_count: p.reaction_count?.[0]?.count ?? 0,
    comment_count:  p.comment_count?.[0]?.count  ?? 0,
    reactions: p.reactions || [],
  }))

  if (sort === 'smart' && !cursor) {
    posts = posts
      .map(p => ({ ...p, _score: engagementScore(p) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, limit)
  } else {
    posts = posts.slice(0, limit)
  }

  return posts
}

// Posts trending: top 5 últimas 72h
export const getTrending = async () => {
  const since = new Date(Date.now() - 72 * 3_600_000).toISOString()
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, title, category, subcategory, created_at,
      profiles!posts_author_id_fkey(full_name, identity_mode, identity_number),
      reaction_count:reactions(count),
      comment_count:comments(count)
    `)
    .gte('created_at', since)
    .limit(30)
  if (error) return []
  return (data || [])
    .map(p => ({
      ...p,
      reaction_count: p.reaction_count?.[0]?.count ?? 0,
      comment_count:  p.comment_count?.[0]?.count  ?? 0,
      score: (p.reaction_count?.[0]?.count ?? 0) * 3 + (p.comment_count?.[0]?.count ?? 0) * 5,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

export const getPostsByUser = async (userId, { limit = 20, cursor } = {}) => {
  let q = supabase
    .from('posts')
    .select(`
      *,
      profiles!posts_author_id_fkey(id, full_name, identity_mode, identity_number, city, avatar_url),
      reaction_count:reactions(count),
      comment_count:comments(count)
    `)
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (cursor) q = q.lt('created_at', cursor)
  const { data, error } = await q
  if (error) throw error
  return (data || []).map(p => ({
    ...p,
    reaction_count: p.reaction_count?.[0]?.count ?? 0,
    comment_count:  p.comment_count?.[0]?.count  ?? 0,
  }))
}

export const getPostById = async (id) => {
  const { data, error } = await supabase
    .from('posts')
    .select(`*, profiles!posts_author_id_fkey(id, full_name, identity_mode, identity_number, city, avatar_url)`)
    .eq('id', id).single()
  if (error) throw error
  return data
}
