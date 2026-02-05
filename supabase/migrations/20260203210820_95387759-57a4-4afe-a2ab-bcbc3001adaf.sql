-- =============================================
-- APP FINANCEIRO - ESTRUTURA COMPLETA
-- =============================================

-- 1. PROFILES (dados adicionais do usuário)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  ai_name TEXT DEFAULT 'Luna',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para criar profile automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 2. CATEGORIAS
-- =============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own categories"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 3. GASTOS (EXPENSES)
-- =============================================
CREATE TYPE public.expense_status AS ENUM ('pending', 'confirmed', 'deleted');
CREATE TYPE public.expense_emotion AS ENUM ('pilar', 'essencial', 'impulso');
CREATE TYPE public.expense_source AS ENUM ('manual', 'whatsapp', 'integration');

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  emotion expense_emotion,
  status expense_status NOT NULL DEFAULT 'confirmed',
  source expense_source NOT NULL DEFAULT 'manual',
  -- Parcelamento
  is_installment BOOLEAN NOT NULL DEFAULT false,
  installment_group_id UUID,
  installment_number INTEGER,
  total_installments INTEGER,
  -- Metadados
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_user_date ON public.expenses(user_id, date DESC);
CREATE INDEX idx_expenses_installment_group ON public.expenses(installment_group_id) WHERE installment_group_id IS NOT NULL;

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- 4. RECEITAS (INCOMES)
-- =============================================
CREATE TYPE public.income_type AS ENUM ('salary', 'freelance', 'investment', 'gift', 'other');

CREATE TABLE public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type income_type NOT NULL DEFAULT 'other',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_incomes_user_date ON public.incomes(user_id, date DESC);

ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own incomes"
  ON public.incomes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 5. DÍVIDAS (DEBTS) - O que o usuário deve
-- =============================================
CREATE TYPE public.debt_status AS ENUM ('active', 'paid', 'cancelled');

CREATE TABLE public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  creditor_name TEXT NOT NULL,
  description TEXT,
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount > 0),
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  due_date DATE,
  status debt_status NOT NULL DEFAULT 'active',
  -- Parcelamento
  is_installment BOOLEAN NOT NULL DEFAULT false,
  total_installments INTEGER,
  current_installment INTEGER,
  installment_amount NUMERIC(12, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_debts_user_status ON public.debts(user_id, status);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own debts"
  ON public.debts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 6. VALORES A RECEBER (RECEIVABLES) - O que devem ao usuário
-- =============================================
CREATE TYPE public.receivable_status AS ENUM ('pending', 'received', 'cancelled');

CREATE TABLE public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  debtor_name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  due_date DATE,
  status receivable_status NOT NULL DEFAULT 'pending',
  received_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_receivables_user_status ON public.receivables(user_id, status);

ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own receivables"
  ON public.receivables FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 7. FUNÇÃO UTILITÁRIA - Atualizar updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incomes_updated_at
  BEFORE UPDATE ON public.incomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_debts_updated_at
  BEFORE UPDATE ON public.debts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_receivables_updated_at
  BEFORE UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();