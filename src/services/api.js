import { supabase } from "./supabase";

/* ================= TODOS ================= */

/**
 * Fetches todos for a specific user.
 */
export const getTodos = async (userId) => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('userId', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return { data };
};

/**
 * Creates a new todo.
 */
export const createTodo = async (todo) => {
  const { data, error } = await supabase
    .from('todos')
    .insert([todo])
    .select()
    .single();
    
  if (error) throw error;
  return { data };
};

/**
 * Deletes a todo by ID.
 */
export const deleteTodo = async (id) => {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
};

/**
 * Updates an existing todo.
 */
export const updateTodo = async (id, updatedTodo) => {
  const { data, error } = await supabase
    .from('todos')
    .update(updatedTodo)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return { data };
};

/* ================= AUTH ================= */

/**
 * Registers a new user with Supabase Auth.
 */
export const registerUser = async (userData) => {
  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        name: userData.name,
      }
    }
  });
  
  if (error) throw error;
  
  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || '',
    },
    token: data.session?.access_token || null
  };
};

/**
 * Logs in a user with Supabase Auth.
 */
export const loginUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || '',
      avatar: data.user.user_metadata?.avatar_url || '',
    },
    token: data.session?.access_token
  };
};

/**
 * Updates user profile metadata or password in Supabase.
 */
export const updateUser = async (id, userData) => {
  const updatePayload = {};
  
  if (userData.password) {
    updatePayload.password = userData.password;
  }
  
  // Anything else goes into user_metadata
  const metadata = { ...userData };
  delete metadata.password;
  
  if (Object.keys(metadata).length > 0) {
    updatePayload.data = metadata;
  }

  const { data, error } = await supabase.auth.updateUser(updatePayload);
  
  if (error) throw error;
  return data.user;
};

export default supabase;

