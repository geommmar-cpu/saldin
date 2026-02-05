-- Drop and recreate the trigger function to ensure it works correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, ai_name, onboarding_completed)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email,
    'Assistente',
    false
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profile for existing user who doesn't have one
INSERT INTO public.profiles (user_id, name, email, ai_name, onboarding_completed)
SELECT 
  id as user_id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Usuário') as name,
  email,
  'Assistente' as ai_name,
  false as onboarding_completed
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;