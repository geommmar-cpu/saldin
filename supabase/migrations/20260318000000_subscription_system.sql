-- Migration: Subscription System and Hotmart Integration
-- Description: Adds subscription tracking to profiles and creates a log table for Hotmart events.

-- 1. Update Profiles table with subscription fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS hotmart_subscriber_code TEXT;

-- Create index for hotmart code if we need to search by it
CREATE INDEX IF NOT EXISTS idx_profiles_hotmart_code ON public.profiles(hotmart_subscriber_code);

-- 2. Create User Subscriptions Log Table (Audit trail for payments)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL, -- Hotmart event (PURCHASE_APPROVED, etc)
    transaction_id TEXT, -- Hotmart transaction ID
    product_id TEXT,
    plan_name TEXT,
    amount NUMERIC(12, 2),
    currency TEXT,
    status TEXT,
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription logs" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- 3. Function to reactively handle subscription changes (Optional, but good for logs)
-- We'll mostly handle this via the Edge Function, but RLS/Triggers can be added here if needed.

-- 4. Sample check function for API/Functions
CREATE OR REPLACE FUNCTION public.is_user_premium(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = p_user_id 
        AND subscription_active = true 
        AND (subscription_expires_at IS NULL OR subscription_expires_at > now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
