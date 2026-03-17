
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');
const envConfig = dotenv.parse(fs.readFileSync('.env'));

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: logs } = await supabase.from('whatsapp_logs').select('*').eq('message_type', 'auto_notification').order('created_at', {ascending:false}).limit(5);
  console.log('LOGS:', JSON.stringify(logs, null, 2));

  const { data: users } = await supabase.from('whatsapp_users').select('*').eq('is_verified', true);
  console.log('USERS:', JSON.stringify(users, null, 2));
}
check();

