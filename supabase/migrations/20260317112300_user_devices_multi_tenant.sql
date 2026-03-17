-- ═══════════════════════════════════════════════════════════════
-- MULTI-TENANT DEVICE TOKENS - SETUP SCRIPT
-- ═══════════════════════════════════════════════════════════════

-- 1. Tabela de Dispositivos (Multi-tenant)
CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL UNIQUE,  -- O token que vai no Automate/MacroDroid
    device_name TEXT,                   -- Ex: "Samsung S21 do João"
    created_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ
);

-- 2. Segurança (RLS)
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own devices" 
ON public.user_devices FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages devices" 
ON public.user_devices FOR ALL 
USING (true) WITH CHECK (true);

-- 3. Índices
CREATE INDEX idx_user_devices_token ON public.user_devices(device_token);

-- 4. Migração de dados legados (opcional, se já houver capture_token em whatsapp_users)
-- Isso evita que usuários atuais percam a conexão
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='whatsapp_users' AND column_name='capture_token'
    ) THEN
        INSERT INTO public.user_devices (user_id, device_token, device_name)
        SELECT user_id, capture_token, 'Dispositivo WhatsApp (Migrado)'
        FROM public.whatsapp_users
        WHERE capture_token IS NOT NULL
        ON CONFLICT (device_token) DO NOTHING;
    END IF;
END $$;

-- 5. Adicionar bank_key se não existir (essencial para o match de banco)
-- Já existe no script FULL_DATABASE_SETUP, mas garantimos aqui
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS bank_key TEXT;
CREATE INDEX IF NOT EXISTS idx_bank_accounts_key ON public.bank_accounts(bank_key);
