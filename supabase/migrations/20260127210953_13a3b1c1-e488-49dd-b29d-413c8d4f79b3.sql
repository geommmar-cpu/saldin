-- Create enums for all types
CREATE TYPE public.emotion_category AS ENUM ('essential', 'obligation', 'pleasure', 'impulse');
CREATE TYPE public.expense_source AS ENUM ('manual', 'bank', 'photo', 'whatsapp', 'audio');
CREATE TYPE public.expense_status AS ENUM ('pending', 'confirmed', 'deleted');
CREATE TYPE public.expense_category AS ENUM ('food', 'leisure', 'transport', 'subscriptions', 'housing', 'commitment', 'other');
CREATE TYPE public.income_type AS ENUM ('fixed', 'variable');
CREATE TYPE public.income_source AS ENUM ('manual', 'whatsapp', 'bank');
CREATE TYPE public.debt_type AS ENUM ('installment', 'recurring');
CREATE TYPE public.debt_status AS ENUM ('active', 'paid');
CREATE TYPE public.debt_category AS ENUM ('credit_card', 'loan', 'financing', 'store', 'personal', 'other');
CREATE TYPE public.receivable_status AS ENUM ('pending', 'received', 'overdue');
CREATE TYPE public.receivable_payment_type AS ENUM ('single', 'installment');
CREATE TYPE public.alert_type AS ENUM ('critical', 'warning', 'info');
CREATE TYPE public.alert_frequency AS ENUM ('high', 'normal', 'low');

-- Profiles table for user preferences
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  ai_name TEXT NOT NULL DEFAULT 'Assistente',
  user_challenge TEXT,
  dark_mode BOOLEAN NOT NULL DEFAULT false,
  alert_frequency public.alert_frequency NOT NULL DEFAULT 'normal',
  connected_banks TEXT[] DEFAULT '{}',
  whatsapp_connected BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  fixed_income NUMERIC(12,2) DEFAULT 0,
  variable_income NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  emotion_category public.emotion_category,
  expense_category public.expense_category,
  would_do_again BOOLEAN,
  source public.expense_source NOT NULL DEFAULT 'manual',
  status public.expense_status NOT NULL DEFAULT 'pending',
  establishment TEXT,
  -- Recurring commitment fields
  is_recurring BOOLEAN DEFAULT false,
  monthly_amount NUMERIC(12,2),
  duration_months INTEGER,
  start_date DATE,
  end_date DATE,
  remaining_months INTEGER,
  -- WhatsApp integration fields
  whatsapp_message_id TEXT,
  photo_url TEXT,
  audio_url TEXT,
  extracted_text TEXT,
  -- Bank integration fields
  bank_transaction_id TEXT,
  bank_name TEXT,
  -- AI extraction metadata
  ai_confidence NUMERIC(3,2),
  raw_message TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

-- Incomes table
CREATE TABLE public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  type public.income_type NOT NULL DEFAULT 'fixed',
  source public.income_source NOT NULL DEFAULT 'manual',
  recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Debts table
CREATE TABLE public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type public.debt_type NOT NULL DEFAULT 'installment',
  total_amount NUMERIC(12,2) NOT NULL,
  installment_amount NUMERIC(12,2) NOT NULL,
  installments INTEGER NOT NULL,
  paid_installments INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  category public.debt_category NOT NULL DEFAULT 'other',
  status public.debt_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Debt installments table
CREATE TABLE public.debt_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE NOT NULL,
  number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ
);

-- Receivables table
CREATE TABLE public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  person_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  payment_type public.receivable_payment_type NOT NULL DEFAULT 'single',
  due_date DATE NOT NULL,
  status public.receivable_status NOT NULL DEFAULT 'pending',
  installments INTEGER,
  installment_amount NUMERIC(12,2),
  received_installments INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_at TIMESTAMPTZ
);

-- Receivable installments table
CREATE TABLE public.receivable_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_id UUID REFERENCES public.receivables(id) ON DELETE CASCADE NOT NULL,
  number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status public.receivable_status NOT NULL DEFAULT 'pending',
  received_at TIMESTAMPTZ
);

-- Alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type public.alert_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  dismissible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivable_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for expenses
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for incomes
CREATE POLICY "Users can view own incomes" ON public.incomes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own incomes" ON public.incomes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own incomes" ON public.incomes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own incomes" ON public.incomes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for debts
CREATE POLICY "Users can view own debts" ON public.debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own debts" ON public.debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own debts" ON public.debts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own debts" ON public.debts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for debt_installments (via debt ownership)
CREATE POLICY "Users can view own debt installments" ON public.debt_installments FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.debts WHERE debts.id = debt_installments.debt_id AND debts.user_id = auth.uid()));
CREATE POLICY "Users can insert own debt installments" ON public.debt_installments FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.debts WHERE debts.id = debt_installments.debt_id AND debts.user_id = auth.uid()));
CREATE POLICY "Users can update own debt installments" ON public.debt_installments FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.debts WHERE debts.id = debt_installments.debt_id AND debts.user_id = auth.uid()));
CREATE POLICY "Users can delete own debt installments" ON public.debt_installments FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.debts WHERE debts.id = debt_installments.debt_id AND debts.user_id = auth.uid()));

-- RLS Policies for receivables
CREATE POLICY "Users can view own receivables" ON public.receivables FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own receivables" ON public.receivables FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own receivables" ON public.receivables FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own receivables" ON public.receivables FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for receivable_installments (via receivable ownership)
CREATE POLICY "Users can view own receivable installments" ON public.receivable_installments FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.receivables WHERE receivables.id = receivable_installments.receivable_id AND receivables.user_id = auth.uid()));
CREATE POLICY "Users can insert own receivable installments" ON public.receivable_installments FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.receivables WHERE receivables.id = receivable_installments.receivable_id AND receivables.user_id = auth.uid()));
CREATE POLICY "Users can update own receivable installments" ON public.receivable_installments FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.receivables WHERE receivables.id = receivable_installments.receivable_id AND receivables.user_id = auth.uid()));
CREATE POLICY "Users can delete own receivable installments" ON public.receivable_installments FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.receivables WHERE receivables.id = receivable_installments.receivable_id AND receivables.user_id = auth.uid()));

-- RLS Policies for alerts
CREATE POLICY "Users can view own alerts" ON public.alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.alerts FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_status ON public.expenses(status);
CREATE INDEX idx_expenses_created_at ON public.expenses(created_at);
CREATE INDEX idx_incomes_user_id ON public.incomes(user_id);
CREATE INDEX idx_debts_user_id ON public.debts(user_id);
CREATE INDEX idx_debts_status ON public.debts(status);
CREATE INDEX idx_receivables_user_id ON public.receivables(user_id);
CREATE INDEX idx_receivables_status ON public.receivables(status);
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_read ON public.alerts(read);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, ai_name)
  VALUES (NEW.id, 'Assistente');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();