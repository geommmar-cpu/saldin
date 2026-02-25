
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
    metodo?: string; // Add method for logging/debugging
}

export async function processTransaction(data: TransactionData) {
    const { userId, type, amount, description, categoryId, bankAccountId, date, transactionCode, isCreditCard } = data;
    const finalDate = date ? new Date(date).toISOString() : new Date().toISOString();

    try {
        let result;
        let error;

        if (isCreditCard && type === 'expense') {
            if (!bankAccountId) {
                throw new Error("Não encontrei um cartão cadastrado para vincular este gasto.");
            }

            // Register as Credit Card Purchase
            const payload: any = {
                user_id: userId,
                card_id: bankAccountId, // bankAccountId acts as cardId here
                total_amount: amount,
                description,
                purchase_date: finalDate,
                total_installments: 1, // Default to 1 for WhatsApp unless otherwise specified
                transaction_code: transactionCode, // Ensure we store the code here too
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
                // Ensure reference_month is the 1st of the month
                const d = new Date(finalDate);
                const refMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;

                await supabaseAdmin
                    .from('credit_card_installments')
                    .insert({
                        user_id: userId,
                        purchase_id: purchase.id,
                        amount: amount,
                        installment_number: 1,
                        reference_month: refMonth,
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
                transaction_code: transactionCode,
                created_at: finalDate,
                status: 'active'
            };
            if (categoryId) payload.category_id = categoryId;
            if (bankAccountId) payload.bank_account_id = bankAccountId;

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

        // Update Bank Account Balance if linked
        let accountBalance: number | undefined;
        if (bankAccountId && !isCreditCard) {
            const { data: acc } = await supabaseAdmin
                .from('bank_accounts')
                .select('current_balance')
                .eq('id', bankAccountId)
                .single();

            if (acc) {
                const currentBal = Number(acc.current_balance) || 0;
                const newAccBal = type === 'income' ? (currentBal + amount) : (currentBal - amount);

                await supabaseAdmin
                    .from('bank_accounts')
                    .update({ current_balance: newAccBal })
                    .eq('id', bankAccountId);

                accountBalance = newAccBal;
            }
        }

        const newBalance = await getBalance(userId);

        return {
            ...result,
            new_balance: newBalance,
            account_balance: accountBalance,
            dest_name: result?.bank_account?.bank_name || result?.card?.card_name || (isCreditCard ? "Cartão" : "Conta"),
            is_credit_card: isCreditCard
        };

    } catch (err) {
        console.error("Financial Transaction Failed:", err);
        throw new Error("Erro ao registrar transação no banco.");
    }
}


export async function getBalance(userId: string): Promise<number> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const refMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    // 1. Bank Total
    const { data: banks } = await supabaseAdmin.from('bank_accounts').select('current_balance').eq('user_id', userId).eq('active', true);
    const bankTotal = banks?.reduce((acc: number, b: any) => acc + Number(b.current_balance), 0) || 0;

    // 2. Unlinked Transactions (Confirmed but not in a bank account yet)
    // Incomes
    const { data: unlinkedIncomes } = await supabaseAdmin.from('incomes')
        .select('amount')
        .eq('user_id', userId)
        .is('bank_account_id', null)
        .or('status.eq.received,status.eq.confirmed')
        .gte('date', monthStart)
        .lte('date', monthEnd);
    const confirmedUnlinkedIncome = unlinkedIncomes?.reduce((acc: number, i: any) => acc + Number(i.amount), 0) || 0;

    // Expenses
    const { data: unlinkedExpenses } = await supabaseAdmin.from('expenses')
        .select('amount')
        .eq('user_id', userId)
        .is('bank_account_id', null)
        .eq('status', 'confirmed')
        .gte('date', monthStart)
        .lte('date', monthEnd);
    const confirmedUnlinkedExpenses = unlinkedExpenses?.reduce((acc: number, e: any) => acc + Number(e.amount), 0) || 0;

    const saldoBruto = bankTotal + confirmedUnlinkedIncome - confirmedUnlinkedExpenses;

    // 3. Commitments (Saldo Comprometido)
    // Pending essential/pilar expenses
    const { data: pendingExpenses } = await supabaseAdmin.from('expenses')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .or('emotion.eq.essencial,emotion.eq.pilar')
        .gte('date', monthStart)
        .lte('date', monthEnd);
    const pendingTotal = pendingExpenses?.reduce((acc: number, e: any) => acc + Number(e.amount), 0) || 0;

    // Active debts
    const { data: debts } = await supabaseAdmin.from('debts')
        .select('total_amount, installment_amount, is_installment')
        .eq('user_id', userId)
        .eq('status', 'active');
    const debtTotal = debts?.reduce((acc: number, d: any) => acc + Number(d.is_installment ? (d.installment_amount || 0) : d.total_amount), 0) || 0;

    // CC Installments for the month
    const { data: ccInstallments } = await supabaseAdmin.from('credit_card_installments')
        .select('amount')
        .eq('user_id', userId)
        .eq('reference_month', refMonthStr)
        .eq('status', 'open');
    const ccTotal = ccInstallments?.reduce((acc: number, inst: any) => acc + Number(inst.amount), 0) || 0;

    const saldoComprometido = pendingTotal + debtTotal + ccTotal;

    // 4. Goals Saved (Saldo Guardado)
    const { data: goals } = await supabaseAdmin.from('goals')
        .select('current_amount')
        .eq('user_id', userId)
        .neq('is_personal', false)
        .eq('status', 'in_progress');
    const saldoGuardado = goals?.reduce((acc: number, g: any) => acc + Number(g.current_amount), 0) || 0;

    // 5. Saldo Livre = Saldo Bruto - Comprometido - Guardado
    return saldoBruto - saldoComprometido - saldoGuardado;
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

    const cleanMethod = method?.toLowerCase().trim();

    // 1. Try to find a matching Credit Card by name (e.g., "Inter", "Nubank")
    if (cleanMethod && !['credito', 'cartão', 'cartao'].includes(cleanMethod)) {
        const { data: matchedCard } = await supabaseAdmin
            .from('credit_cards')
            .select('id')
            .eq('user_id', userId)
            .eq('active', true)
            .ilike('card_name', `%${cleanMethod}%`)
            .maybeSingle();

        if (matchedCard) return { id: matchedCard.id, isCreditCard: true };
    }

    // 2. Try to find a matching Bank Account by name (e.g., "Itaú", "Cofre")
    if (cleanMethod && !['pix', 'debito', 'dinheiro', 'boleto'].includes(cleanMethod)) {
        const { data: matchedAcc } = await supabaseAdmin
            .from('bank_accounts')
            .select('id')
            .eq('user_id', userId)
            .eq('active', true)
            .ilike('bank_name', `%${cleanMethod}%`)
            .maybeSingle();

        if (matchedAcc) return { id: matchedAcc.id, isCreditCard: false };
    }

    // 3. Fallback to default Credit Card logic
    if (cleanMethod && ['credito', 'cartão', 'cartao', 'visa', 'master', 'elo', 'amex'].some(m => cleanMethod.includes(m))) {
        if (profile?.wa_default_expense_card_id) {
            return { id: profile.wa_default_expense_card_id, isCreditCard: true };
        }

        const { data: card } = await supabaseAdmin
            .from('credit_cards')
            .select('id')
            .eq('user_id', userId)
            .eq('active', true)
            .limit(1)
            .maybeSingle();

        return { id: card?.id || null, isCreditCard: !!card };
    }

    // 4. Default: Check for default accounts (Pix, Debit, etc.)
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

