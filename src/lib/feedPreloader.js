// Precarga el feed durante el splash para que FeedPage lo muestre al instante.
// Este módulo es el único punto donde se escribe _feedCache desde fuera de FeedPage.
// FeedPage lo lee normalmente — sin cambios en su lógica.

import { listPosts } from '../api/posts'

// Referencia compartida con FeedPage (mismo objeto, mismo módulo)
export let preloadedFeed = { posts: [], ts: 0, filters: '{}', sort: 'smart' }

let _loading = false

export async function preloadFeed(userId) {
  // Solo una carga a la vez, y solo si el cache está vacío o expirado
  if (_loading) return
  if (preloadedFeed.posts.length > 0 && Date.now() - preloadedFeed.ts < 3 * 60 * 1000) return
  _loading = true
  try {
    const posts = await listPosts({ limit: 20, filters: {}, sort: 'smart', userId })
    preloadedFeed = { posts, ts: Date.now(), filters: '{}', sort: 'smart' }
  } catch {
    // Silencioso — si falla, FeedPage carga normalmente
  } finally {
    _loading = false
  }
}
