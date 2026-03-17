
import { createClient } from './node_modules/@supabase/supabase-js/dist/main/index.js';
import pkg from 'dotenv';
const { config } = pkg;
config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkLogs() {
  const { data, error } = await supabase
    .from('whatsapp_logs')
    .select('*')
    .eq('message_type', 'auto_notification')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching logs:', error);
    return;
  }

  console.log('Recent Auto-Notification Logs:');
  data.forEach(log => {
    console.log('- Time: ' + log.created_at);
    console.log('  Phone: ' + log.phone_number);
    console.log('  Result: ' + JSON.stringify(log.processing_result));
    console.log('  Processed: ' + log.processed);
    console.log('  Error: ' + log.error_message);
    console.log('---');
  });
}

checkLogs();

