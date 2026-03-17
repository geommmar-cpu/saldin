import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function signUp() {
    console.log('Tentando criar usuário: teste2@gmail.com...');
    const { data, error } = await supabase.auth.signUp({
        email: 'teste2@gmail.com',
        password: process.env.TEST_USER_PASSWORD || 'local_test_pwd',
        options: {
            data: {
                full_name: 'Teste User',
            }
        }
    });

    if (error) {
        console.error('Erro ao criar usuário:', error.message);
    } else {
        console.log('Usuário criado com sucesso!');
        console.log('ID:', data.user.id);
        console.log('Email:', data.user.email);
        if (!data.session) {
            console.log('Nota: Um email de confirmação pode ter sido enviado (dependendo das configurações do Supabase).');
        } else {
            console.log('Usuário logado imediatamente (confirmação desativada).');
        }
    }
}

signUp();
