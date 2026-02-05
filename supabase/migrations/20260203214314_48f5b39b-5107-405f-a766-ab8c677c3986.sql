-- Add dedicated onboarding_completed column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Update existing profiles: mark as completed if they have full_name set
UPDATE public.profiles 
SET onboarding_completed = true 
WHERE full_name IS NOT NULL AND full_name != '';

-- Update the trigger to NOT auto-populate full_name (let onboarding do it)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, onboarding_completed)
  VALUES (NEW.id, false);
  RETURN NEW;
END;
$function$;