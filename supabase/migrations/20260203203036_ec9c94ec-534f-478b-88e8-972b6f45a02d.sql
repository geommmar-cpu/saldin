-- Drop all application tables (cascade will handle foreign keys)
DROP TABLE IF EXISTS public.receivable_installments CASCADE;
DROP TABLE IF EXISTS public.receivables CASCADE;
DROP TABLE IF EXISTS public.debt_installments CASCADE;
DROP TABLE IF EXISTS public.debts CASCADE;
DROP TABLE IF EXISTS public.incomes CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop custom types/enums
DROP TYPE IF EXISTS public.alert_frequency CASCADE;
DROP TYPE IF EXISTS public.alert_type CASCADE;
DROP TYPE IF EXISTS public.debt_category CASCADE;
DROP TYPE IF EXISTS public.debt_status CASCADE;
DROP TYPE IF EXISTS public.debt_type CASCADE;
DROP TYPE IF EXISTS public.emotion_category CASCADE;
DROP TYPE IF EXISTS public.expense_category CASCADE;
DROP TYPE IF EXISTS public.expense_source CASCADE;
DROP TYPE IF EXISTS public.expense_status CASCADE;
DROP TYPE IF EXISTS public.income_source CASCADE;
DROP TYPE IF EXISTS public.income_type CASCADE;
DROP TYPE IF EXISTS public.receivable_payment_type CASCADE;
DROP TYPE IF EXISTS public.receivable_status CASCADE;
DROP TYPE IF EXISTS public.record_source CASCADE;

-- Drop custom functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;