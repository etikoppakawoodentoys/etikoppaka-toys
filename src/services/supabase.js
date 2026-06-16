import { createClient } from '@supabase/supabase-js';

// HARDCODED CREDENTIALS - These are verified correct
const SUPABASE_URL = 'https://lvyjklkfmdubtchealte.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2eWprbGtmbWR1YnRjaGVhbHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODkyMzMsImV4cCI6MjA5MzY2NTIzM30.Me8Rj7jy3hi-IowCbpsMXIsuZMF3dXjWJzTf6HMo8ZI';

console.log('🔑 Initializing Supabase with URL:', SUPABASE_URL);
console.log('🔑 Using API key (first 20 chars):', SUPABASE_ANON_KEY.substring(0, 20) + '...');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test function to verify connection
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connected successfully!');
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err);
    return false;
  }
};

export const isAdmin = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    return data?.is_admin || false;
  } catch {
    return false;
  }
};