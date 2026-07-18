import { supabase } from './supabase'

const PROFILE_FIELDS = 'id, full_name, identity_mode, identity_number, city, email_domain'

// Get all conversations for a user
export const getConversations = async (userId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      user1:profiles!conversations_user1_id_fkey(${PROFILE_FIELDS}),
      user2:profiles!conversations_user2_id_fkey(${PROFILE_FIELDS}),
      posts!conversations_post_id_fkey(id, title, content, category)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Get or create conversation between two users for a specific post
export const getOrCreateConversation = async (user1Id, user2Id, postId) => {
  // Check if exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('post_id', postId)
    .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
    .maybeSingle()

  if (existing) return { ...existing, isNew: false }

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user1_id: user1Id, user2_id: user2Id, post_id: postId })
    .select()
    .single()
  if (error) throw error
  return { ...data, isNew: true }
}

// Get messages in a conversation
export const getMessages = async (conversationId) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`*, profiles!messages_sender_id_fkey(${PROFILE_FIELDS})`)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

// Send message
export const sendMessage = async ({ conversation_id, sender_id, content }) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id, sender_id, content })
    .select()
    .single()
  if (error) throw error

  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString(), last_message: content })
    .eq('id', conversation_id)

  return data
}
