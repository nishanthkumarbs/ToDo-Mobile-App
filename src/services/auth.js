import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';

/**
 * Gets the current active session user from Supabase.
 */
export async function getSessionUser() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) return null;
  
  const user = session.user;
  return {
    id: user.id, // Supabase uses UUID strings
    email: user.email,
    name: user.user_metadata?.name || '',
    avatar: user.user_metadata?.avatar_url || '',
  };
}

/**
 * Clears the Supabase session.
 */
export async function clearSession() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Error signing out:", error);
}

/**
 * Gets the JWT token from the Supabase session.
 */
export async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Helper to save session if needed manually (though Supabase usually handles this)
export async function saveSession(token, user) {
  // Supabase manages persistence automatically in its client, 
  // but we can keep this for compatibility if other components rely on it.
  if (user) {
    await SecureStore.setItemAsync('uid', String(user.id));
    await SecureStore.setItemAsync('uname', user.name || '');
  }
}

