
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://vmkhqtuqgvtcapwmxtov.supabase.co"
const supabaseKey = "sb_publishable_jEssWL7mMXX1rIWl5HTvVA_W4A-cL7m"
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    console.log("Checking whatsapp_users...");
    const { data, error } = await supabase.from('whatsapp_users').select('phone_number, is_verified').limit(10);
    if (error) {
        console.error("Error fetching users:", error.message);
    } else {
        console.log("Users:", data);
    }

    console.log("Checking last 5 logs...");
    const { data: logs, error: errorLogs } = await supabase.from('whatsapp_logs').select('phone_number, message_content, processed, error_message, created_at').order('created_at', { ascending: false }).limit(5);
    if (errorLogs) {
        console.error("Error fetching logs:", errorLogs.message);
    } else {
        console.log("Logs:", logs);
    }
}

check();
