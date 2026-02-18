-- Add transaction_code column to expenses and incomes
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS transaction_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.incomes 
ADD COLUMN IF NOT EXISTS transaction_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ, -- For soft delete standardization
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'; -- Consistency with expenses enum approach

-- Create index for transaction_code
CREATE INDEX IF NOT EXISTS idx_expenses_transaction_code ON public.expenses(transaction_code);
CREATE INDEX IF NOT EXISTS idx_incomes_transaction_code ON public.incomes(transaction_code);

-- Transaction Audit Logs Table
CREATE TABLE IF NOT EXISTS public.transaction_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('expense', 'income')),
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'restore')),
    changed_fields JSONB, -- Stores specific fields changed (e.g. { "amount": { "old": 100, "new": 200 } })
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for audit logs
ALTER TABLE public.transaction_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audit logs" ON public.transaction_audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audit logs" ON public.transaction_audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversation States for Interactive Flows (Edit Command)
CREATE TABLE IF NOT EXISTS public.conversation_states (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    step TEXT NOT NULL, -- e.g., 'awaiting_edit_selection', 'awaiting_new_value'
    context JSONB DEFAULT '{}', -- Stores transaction_code, type, etc.
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for conversation states
ALTER TABLE public.conversation_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own conversation state" ON public.conversation_states FOR ALL USING (auth.uid() = user_id);

-- Update function for updated_at in expenses/incomes
DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_incomes_updated_at ON public.incomes;
CREATE TRIGGER update_incomes_updated_at BEFORE UPDATE ON public.incomes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- New Balance Calculation Function (Respects Soft Deletes)
CREATE OR REPLACE FUNCTION public.calculate_liquid_balance_v2(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_income NUMERIC;
    v_expense NUMERIC;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO v_income
    FROM public.incomes 
    WHERE user_id = p_user_id AND deleted_at IS NULL;

    SELECT COALESCE(SUM(amount), 0) INTO v_expense
    FROM public.expenses 
    WHERE user_id = p_user_id AND deleted_at IS NULL AND (status IS NULL OR status != 'deleted');

    RETURN v_income - v_expense;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

