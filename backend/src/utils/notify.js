import { supabase } from '../config/supabase.js';

/**
 * Creates a notification row for a user (or broadcasts to the whole company room
 * when userId is omitted) and pushes it over Socket.IO in real time.
 */
export async function notify(io, { companyId, userId = null, type, title, message }) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ company_id: companyId, user_id: userId, type, title, message })
    .select()
    .single();
  if (error) {
    console.error('[notify] failed to write notification', error.message);
    return null;
  }
  if (io) io.to(`company:${companyId}`).emit('notification', data);
  return data;
}
