// electron/supabase/client.js
const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

async function signIn() {
  console.log("Signing in to Supabase");
  console.log(config.SUPABASE_EMAIL, config.SUPABASE_PASSWORD);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: config.SUPABASE_EMAIL,
    password: config.SUPABASE_PASSWORD,
  });
  if (error) {
    console.error("Supabase sign in error:", error);
    throw error;
  }
  return data;
}

module.exports = { supabase, signIn };