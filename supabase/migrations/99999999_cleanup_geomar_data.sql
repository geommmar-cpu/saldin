-- Clean up all data for user geomar@gmail.com
-- This script finds the user ID from auth.users and deletes associated records.

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 1. Get User ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'geomar@gmail.com';

    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE 'Cleaning up data for user ID: %', v_user_id;

        -- 1. Delete low-level dependencies FIRST (Tables that reference other tables)
        DELETE FROM public.goal_transactions WHERE user_id = v_user_id;
        DELETE FROM public.crypto_transactions WHERE user_id = v_user_id;
        DELETE FROM public.bank_transfers WHERE user_id = v_user_id;
        DELETE FROM public.credit_card_installments WHERE user_id = v_user_id;
        
        -- 2. Delete financial records
        DELETE FROM public.expenses WHERE user_id = v_user_id;
        DELETE FROM public.incomes WHERE user_id = v_user_id;
        DELETE FROM public.debts WHERE user_id = v_user_id;
        DELETE FROM public.receivables WHERE user_id = v_user_id;
        DELETE FROM public.goals WHERE user_id = v_user_id;
        
        -- 3. Delete from banking/cards
        DELETE FROM public.credit_card_purchases WHERE user_id = v_user_id;
        DELETE FROM public.credit_card_statements WHERE user_id = v_user_id;
        DELETE FROM public.credit_cards WHERE user_id = v_user_id;
        DELETE FROM public.crypto_wallets WHERE user_id = v_user_id;
        
        -- 4. Delete parent tables LAST
        DELETE FROM public.bank_accounts WHERE user_id = v_user_id;
        
        -- 5. Delete from WhatsApp & Subscriptions
        DELETE FROM public.whatsapp_logs WHERE phone_number IN (SELECT phone_number FROM public.whatsapp_users WHERE user_id = v_user_id);
        DELETE FROM public.whatsapp_users WHERE user_id = v_user_id;
        DELETE FROM public.user_subscriptions WHERE user_id = v_user_id;

        -- 6. Reset Profile (keeps the user but restarts onboarding/subscription)
        UPDATE public.profiles 
        SET 
            onboarding_completed = false,
            subscription_active = false,
            subscription_status = 'inactive',
            subscription_expires_at = NULL,
            hotmart_subscriber_code = NULL,
            phone = NULL -- Also reset phone to test WhatsApp link
        WHERE user_id = v_user_id;

        RAISE NOTICE 'Data cleanup for geomar@gmail.com completed.';
    ELSE
        RAISE NOTICE 'User geomar@gmail.com not found.';
    END IF;
END $$;
