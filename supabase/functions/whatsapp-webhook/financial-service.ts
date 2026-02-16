
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
}

export async function processTransaction(data: TransactionData) {
    const { userId, type, amount, description, categoryId, bankAccountId, date } = data;

    try {
        const { data: result, error } = await supabaseAdmin.rpc("process_financial_transaction", {
            p_user_id: userId,
            p_type: type,
            p_amount: amount,
            p_description: description,
            p_category_id: categoryId || null,
            p_bank_account_id: bankAccountId || null,
            p_date: date || new Date().toISOString(),
            p_source: "whatsapp"
        });

        if (error) throw error;
        return result;

    } catch (err) {
        console.error("Financial Transaction Failed:", err);
        throw new Error("Erro ao registrar transação no banco.");
    }
}

export async function getBalance(userId: string): Promise<number> {
    const { data, error } = await supabaseAdmin.rpc("calculate_liquid_balance", {
        p_user_id: userId
    });

    if (error) {
        console.error("Get Balance Failed:", error);
        throw new Error("Erro ao consultar saldo.");
    }

    return Number(data) || 0;
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
        ...(exp || []).map(e => ({ ...e, type: 'expense' })),
        ...(inc || []).map(i => ({ ...i, type: 'income' }))
    ];

    // Sort by date descending
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return all.slice(0, limit);
}

export async function getPreferredAccount(userId: string, method?: string): Promise<string | null> {
    // If method implies a bank transaction (Pix, Debit, Transfer), find a Checking Account
    if (method && ['pix', 'debito', 'transferencia', 'dinheiro', 'boleto'].includes(method.toLowerCase())) {

        // 1. Try to get the default income account (often used as main checking) from profile
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('wa_default_income_account_id, wa_default_expense_account_id')
            .eq('user_id', userId)
            .single();

        if (profile?.wa_default_expense_account_id) return profile.wa_default_expense_account_id;
        if (profile?.wa_default_income_account_id) return profile.wa_default_income_account_id;

        // 2. Fallback: Any active checking account
        const { data: acc } = await supabaseAdmin
            .from('bank_accounts')
            .select('id')
            .eq('user_id', userId)
            .eq('active', true)
            // Prioritize checking, then wallet/others
            .order('account_type', { ascending: true })
            .limit(1)
            .maybeSingle();

        return acc?.id || null;
    }

    // For Credit, we return null so the RPC can pick the default card
    return null;
}
