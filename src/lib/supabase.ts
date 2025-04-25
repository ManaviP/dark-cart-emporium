import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a more robust storage mechanism for auth tokens
const customStorage = {
  getItem: (key: string) => {
    const value = localStorage.getItem(key);
    console.log('Getting auth item from storage:', key, value ? 'exists' : 'not found');
    return value;
  },
  setItem: (key: string, value: string) => {
    console.log('Setting auth item in storage:', key);
    localStorage.setItem(key, value);

    // Also store in sessionStorage for cross-browser support
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.error('Failed to set item in sessionStorage:', e);
    }
  },
  removeItem: (key: string) => {
    console.log('Removing auth item from storage:', key);
    localStorage.removeItem(key);
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to remove item from sessionStorage:', e);
    }
  }
};

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      storageKey: 'dark-cart-auth-token',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: customStorage
    }
  }
);

// Helper function to get user ID from session
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting session:", error);
      return null;
    }

    if (!session) {
      console.log("No active session found");
      return null;
    }

    console.log("Current user ID:", session.user?.id);
    return session?.user?.id || null;
  } catch (error) {
    console.error("Unexpected error in getCurrentUserId:", error);
    return null;
  }
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
