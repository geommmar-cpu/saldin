
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface TransactionData {
    userId: string;
    type: "expense" | "income";
    amount: number;
    description: string;
    categoryId?: string;
    bankAccountId?: string;
    date?: string; // YYYY-MM-DD
    transactionCode: string;
    isCreditCard?: boolean;
}

export async function processTransaction(data: TransactionData) {
    const { userId, type, amount, description, categoryId, bankAccountId, date, transactionCode, isCreditCard } = data;
    const finalDate = date ? new Date(date).toISOString() : new Date().toISOString();

    try {
        let result;
        let error;

        if (isCreditCard && type === 'expense') {
            // Register as Credit Card Purchase
            const payload: any = {
                user_id: userId,
                card_id: bankAccountId, // bankAccountId acts as cardId here
                total_amount: amount,
                description,
                purchase_date: finalDate,
                total_installments: 1, // Default to 1 for WhatsApp unless otherwise specified
                created_at: finalDate
            };
            if (categoryId) payload.category_id = categoryId;

            const { data: purchase, error: err } = await supabaseAdmin
                .from('credit_card_purchases')
                .insert(payload)
                .select('*, card:credit_cards(card_name)')
                .single();

            result = purchase;
            error = err;

            // Generate first installment
            if (purchase && !error) {
                await supabaseAdmin
                    .from('credit_card_installments')
                    .insert({
                        user_id: userId,
                        purchase_id: purchase.id,
                        amount: amount,
                        installment_number: 1,
                        reference_month: finalDate, // approximate
                        status: 'open'
                    });
            }

            return {
                ...result,
                new_balance: await getBalance(userId),
                dest_name: result?.card?.card_name || "Cartão",
                is_credit_card: true
            };
        }

        if (type === 'expense') {
            const payload: any = {
                user_id: userId,
                amount,
                description,
                date: finalDate,
                source: 'whatsapp',
                status: 'confirmed',
                confirmed_at: finalDate,
                transaction_code: transactionCode,
                created_at: finalDate
            };
            if (categoryId) payload.category_id = categoryId;
            if (bankAccountId) payload.bank_account_id = bankAccountId;

            console.log("📤 Inserting EXPENSE:", JSON.stringify(payload));
            const { data: exp, error: err } = await supabaseAdmin
                .from('expenses')
                .insert(payload)
                .select('*, bank_account:bank_accounts(bank_name)')
                .single();
            result = exp;
            error = err;
        } else {
            let incomeType = 'other';
            const descLower = description.toLowerCase();
            if (descLower.includes('salário') || descLower.includes('salario')) incomeType = 'salary';
            else if (descLower.includes('freelance') || descLower.includes('freela')) incomeType = 'freelance';
            else if (descLower.includes('investimento')) incomeType = 'investment';
            else if (descLower.includes('presente')) incomeType = 'gift';

            const payload: any = {
                user_id: userId,
                amount,
                description,
                date: finalDate,
                type: incomeType,
                is_recurring: false,
                source: 'whatsapp',
                transaction_code: transactionCode,
                created_at: finalDate,
                status: 'active'
            };
            if (categoryId) payload.category_id = categoryId;
            if (bankAccountId) payload.bank_account_id = bankAccountId;

            console.log("📤 Inserting INCOME:", JSON.stringify(payload));
            const { data: inc, error: err } = await supabaseAdmin
                .from('incomes')
                .insert(payload)
                .select('*, bank_account:bank_accounts(bank_name)')
                .single();
            result = inc;
            error = err;
        }

        if (error) {
            console.error("❌ DB Insert Error:", JSON.stringify(error));
            throw error;
        }

        console.log("✅ DB Insert Success:", type);

        // Update Bank Account Balance if linked
        if (bankAccountId && !isCreditCard) {
            const { data: acc } = await supabaseAdmin
                .from('bank_accounts')
                .select('current_balance')
                .eq('id', bankAccountId)
                .single();

            if (acc) {
                const currentBal = Number(acc.current_balance) || 0;
                const newBal = type === 'income' ? (currentBal + amount) : (currentBal - amount);

                await supabaseAdmin
                    .from('bank_accounts')
                    .update({ current_balance: newBal })
                    .eq('id', bankAccountId);
            }
        }

        const newBalance = await getBalance(userId);

        return {
            ...result,
            new_balance: newBalance,
            dest_name: result?.bank_account?.bank_name || "Conta",
            is_credit_card: false
        };

    } catch (err) {
        console.error("Financial Transaction Failed:", err);
        throw new Error("Erro ao registrar transação no banco.");
    }
}


export async function getBalance(userId: string): Promise<number> {
    // Updated Logic: Mirror Frontend "Total Balance"
    // Sum of all active bank accounts only.
    // Ignored manual/cash transactions (unlinked) to avoid discrepancies with the App Dashboard.

    const { data: banks } = await supabaseAdmin
        .from('bank_accounts')
        .select('current_balance')
        .eq('user_id', userId)
        .eq('active', true);

    const bankTotal = banks?.reduce((acc: number, b: any) => acc + Number(b.current_balance), 0) || 0;

    return bankTotal;
}

export async function getLastTransactions(userId: string, limit = 5) {
    // Busca expenses e incomes recentes
    const { data: exp, error: errExp } = await supabaseAdmin
        .from('expenses')
        .select('amount, description, date, category_id')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

    const { data: inc, error: errInc } = await supabaseAdmin
        .from('incomes')
        .select('amount, description, date, type') // Removed category_id, added type
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

    if (errExp || errInc) {
        const msg = errExp?.message || errInc?.message || "Unknown DB Error";
        console.error("Get Transactions Failed:", msg);
        throw new Error(`DB Error: ${msg}`);
    }

    // Merge expenses and incomes
    const all = [
        ...(exp || []).map((e: any) => ({ ...e, type: 'expense' })),
        ...(inc || []).map((i: any) => ({ ...i, type: 'income' }))
    ];

    // Sort by date descending
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return all.slice(0, limit);
}

export async function getPreferredAccount(userId: string, method?: string): Promise<{ id: string | null; isCreditCard: boolean }> {
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('wa_default_income_account_id, wa_default_expense_account_id, wa_default_expense_card_id')
        .eq('user_id', userId)
        .single();

    // If method implies credit card
    if (method && ['credito', 'cartão', 'cartao', 'visa', 'master', 'elo', 'amex'].includes(method.toLowerCase())) {
        if (profile?.wa_default_expense_card_id) {
            return { id: profile.wa_default_expense_card_id, isCreditCard: true };
        }

        // Fallback: Any active credit card
        const { data: card } = await supabaseAdmin
            .from('credit_cards')
            .select('id')
            .eq('user_id', userId)
            .eq('active', true)
            .limit(1)
            .maybeSingle();

        return { id: card?.id || null, isCreditCard: !!card };
    }

    // Default: Check for default accounts (Pix, Debit, etc.)
    if (profile?.wa_default_expense_account_id) return { id: profile.wa_default_expense_account_id, isCreditCard: false };
    if (profile?.wa_default_income_account_id) return { id: profile.wa_default_income_account_id, isCreditCard: false };

    // Fallback: Any active bank account
    const { data: acc } = await supabaseAdmin
        .from('bank_accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('active', true)
        .order('account_type', { ascending: true })
        .limit(1)
        .maybeSingle();

    return { id: acc?.id || null, isCreditCard: false };
}

