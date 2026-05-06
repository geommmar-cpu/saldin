const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vmkhqtuqgvtcapwmxtov.supabase.co';
const supabaseKey = 'sb_publishable_jEssWL7mMXX1rIWl5HTvVA_W4A-cL7m';
const supabase = createClient(supabaseUrl, supabaseKey);

async function signUp() {
    console.log('Tentando cadastrar geommmar@gmail.com...');
    const { data, error } = await supabase.auth.signUp({
        email: 'geommmar@gmail.com',
        password: 'G1e9o9m3@',
    });

    if (error) {
        console.error('Erro:', error.message);
    } else {
        console.log('Sucesso!');
        console.log('User ID:', data.user.id);
        if (!data.session) {
            console.log('Confirmao de email pendente.');
        }
    }
}

signUp();
