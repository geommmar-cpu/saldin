import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { addMonths } from "date-fns";
import {
    ArrowLeft, QrCode, Banknote, Smartphone, CreditCard,
    ChevronDown, Calendar, User, Check, Minus, Plus,
    Loader2, Tag, Layers
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/balanceCalculations";
import { parseCurrency, formatCurrencyInput } from "@/lib/currency";
import { toLocalDateString } from "@/lib/dateUtils";
import { supabase } from "@/lib/backendClient";

import { useAuth } from "@/hooks/useAuth";
import { useAllCategories } from "@/hooks/useCategories";
import { useBankAccounts, useUpdateBankBalance } from "@/hooks/useBankAccounts";
import { useCreditCards, useCreateCreditCardPurchase } from "@/hooks/useCreditCards";
import { useCreateExpense, useCreateBulkExpenses } from "@/hooks/useExpenses";
import { useCreateReceivable } from "@/hooks/useReceivables";
import { useCashAccount } from "@/hooks/useCashAccount";
import { NumericKeypad } from "@/components/ui/numeric-keypad";
import { BankLogo } from "@/components/BankLogo";

// ── Types ─────────────────────────────────────────────────────────────────────
type PaymentMethod = "pix" | "cash" | "debit" | "credit";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; Icon: React.ElementType }[] = [
    { value: "pix", label: "PIX", Icon: QrCode },
    { value: "cash", label: "Dinheiro", Icon: Banknote },
    { value: "debit", label: "Débito", Icon: Smartphone },
    { value: "credit", label: "Crédito", Icon: CreditCard },
];

// Quick categories to display by default (slug IDs)
const QUICK_CAT_SLUGS = [
    "alimentacao", "transporte_publico", "mercado", "lazer", "delivery", "outros",
];

// ── UUID helper ───────────────────────────────────────────────────────────────
function isValidUuid(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ── Component ─────────────────────────────────────────────────────────────────
export const QuickExpense = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Data hooks
    const { allCategories } = useAllCategories();
    const { data: bankAccounts = [] } = useBankAccounts();
    const { data: creditCards = [] } = useCreditCards();
    const { ensureCashAccount } = useCashAccount();
    const createExpense = useCreateExpense();
    const createBulkExpenses = useCreateBulkExpenses();
    const createCreditCardPurchase = useCreateCreditCardPurchase();
    const updateBankBalance = useUpdateBankBalance();
    const createReceivable = useCreateReceivable();

    // ── Form state ──────────────────────────────────────────────────────────────
    const [amount, setAmount] = useState("");
    const [categoryId, setCategoryId] = useState<string | undefined>();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>();
    const [selectedBankId, setSelectedBankId] = useState<string | undefined>(
        bankAccounts[0]?.id // pre-select first account
    );
    const [selectedCardId, setSelectedCardId] = useState<string | undefined>();
    const [date, setDate] = useState(toLocalDateString());
    const [description, setDescription] = useState("");

    // Third-party
    const [isForOtherPerson, setIsForOtherPerson] = useState(false);
    const [reimbName, setReimbName] = useState("");
    const [reimbAmount, setReimbAmount] = useState(""); // partial reimbursement
    const [reimbDate, setReimbDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        return toLocalDateString(d);
    });

    // Credit installments
    const [installments, setInstallments] = useState(1);

    // UI state
    const [showKeypad, setShowKeypad] = useState(true);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // ── Derived ─────────────────────────────────────────────────────────────────
    const numericAmount = parseCurrency(amount);
    const selectedCategory = categoryId ? allCategories.find(c => c.id === categoryId) : undefined;
    const quickCategories = QUICK_CAT_SLUGS
        .map(slug => allCategories.find(c => c.id === slug))
        .filter(Boolean) as typeof allCategories;

    const displayedCategories = showAllCategories ? allCategories : quickCategories;

    const canSubmit = numericAmount > 0 && !!paymentMethod &&
        (paymentMethod === "credit" ? !!selectedCardId : true);

    // ── Category UUID resolver ───────────────────────────────────────────────────
    async function resolveCategoryId(catId: string | undefined): Promise<string | null> {
        if (!catId || !user) return null;
        if (isValidUuid(catId) && catId.length >= 30) return catId;

        const cat = allCategories.find(c => c.id === catId);
        if (!cat) return null;

        // Try to find by name in DB
        const { data: existing } = await supabase
            .from("categories")
            .select("id")
            .ilike("name", cat.name)
            .eq("user_id", user.id)
            .maybeSingle();

        if (existing) return existing.id;

        // Create it
        const { data: newCat } = await supabase
            .from("categories")
            .insert({
                user_id: user.id,
                name: cat.name,
                icon: "Tag",
                color: cat.color,
                type: "expense",
                group_name: cat.group,
                nature: cat.nature as any,
                is_default: true,
                allow_expense: cat.allowExpense ?? true,
                allow_card: cat.allowCard ?? true,
                allow_subscription: cat.allowSubscription ?? true,
            })
            .select()
            .single();

        return newCat?.id ?? null;
    }

    // ── Save handler ─────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!canSubmit || !user || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const finalCategoryId = await resolveCategoryId(categoryId);
            const isCreditCard = paymentMethod === "credit" && selectedCardId;

            if (isCreditCard) {
                await createCreditCardPurchase.mutateAsync({
                    card_id: selectedCardId!,
                    description: description || selectedCategory?.name || "Compra no cartão",
                    total_amount: numericAmount,
                    total_installments: installments,
                    category_id: finalCategoryId,
                    purchase_date: date,
                });
            } else {
                let bankId = selectedBankId;
                if (paymentMethod === "cash") bankId = await ensureCashAccount();

                const purchaseDate = new Date(date + "T12:00:00");

                if (installments > 1) {
                    const groupId = crypto.randomUUID();
                    const bulk = Array.from({ length: installments }, (_, i) => ({
                        amount: numericAmount,
                        description: description || selectedCategory?.name || "Gasto registrado",
                        emotion: undefined,
                        status: "confirmed" as const,
                        source: "manual" as const,
                        is_installment: false,
                        total_installments: installments,
                        installment_number: i + 1,
                        installment_group_id: groupId,
                        bank_account_id: bankId ?? undefined,
                        date: format(addMonths(purchaseDate, i), "yyyy-MM-dd"),
                        category_id: finalCategoryId,
                    }));
                    await createBulkExpenses.mutateAsync(bulk as any);
                } else {
                    await createExpense.mutateAsync({
                        amount: numericAmount,
                        description: description || selectedCategory?.name || "Gasto registrado",
                        status: "confirmed",
                        source: "manual",
                        is_installment: false,
                        installment_number: 1,
                        bank_account_id: bankId ?? undefined,
                        date,
                        category_id: finalCategoryId,
                    } as any);
                }

                if (bankId) {
                    await updateBankBalance.mutateAsync({ accountId: bankId, delta: -numericAmount });
                }
            }

            // Reimbursement for third party
            if (isForOtherPerson && reimbName.trim()) {
                const reimbValue = parseCurrency(reimbAmount) || numericAmount;
                await createReceivable.mutateAsync({
                    debtor_name: reimbName.trim(),
                    amount: reimbValue,
                    description: `Reembolso - ${description || selectedCategory?.name || "Gasto"}`,
                    due_date: reimbDate,
                    status: "pending",
                });
            }

            setShowSuccess(true);
            setTimeout(() => {
                navigate("/", { state: { success: true } });
            }, 1800);
        } catch (err: any) {
            console.error("QuickExpense save error:", err);
            toast.error(err?.message || "Erro ao salvar. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Success Screen ────────────────────────────────────────────────────────────
    if (showSuccess) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 14, stiffness: 200 }}
                    className="w-24 h-24 rounded-full bg-green-500/15 flex items-center justify-center"
                >
                    <Check className="w-12 h-12 text-green-500" strokeWidth={2.5} />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center"
                >
                    <p className="text-2xl font-bold text-foreground">Gasto registrado!</p>
                    <p className="text-muted-foreground mt-1">
                        {formatCurrency(numericAmount)} debitado{isForOtherPerson && reimbName ? ` · ${reimbName} deve te pagar` : ""}
                    </p>
                    {isForOtherPerson && reimbName && (
                        <p className="text-sm text-primary font-medium mt-2">
                            💬 Valor a receber criado para {reimbName}
                        </p>
                    )}
                </motion.div>
            </div>
        );
    }

    // ── Main Screen ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-2">
                <button
                    onClick={() => navigate(-1)}
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
                >
                    <ArrowLeft className="w-4 h-4 text-foreground" />
                </button>
                <h1 className="text-base font-bold text-foreground">Novo Gasto</h1>
            </div>

            {/* ── Scrollable Content ── */}
            <div className="flex-1 overflow-y-auto px-4 pb-56 space-y-6 pt-2">

                {/* ── Amount Display ── */}
                <motion.button
                    onClick={() => setShowKeypad(v => !v)}
                    className="w-full text-center py-4"
                    whileTap={{ scale: 0.98 }}
                >
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Valor do Gasto</p>
                    <p className={cn(
                        "text-5xl font-bold tracking-tight transition-colors",
                        numericAmount > 0 ? "text-foreground" : "text-muted-foreground/40"
                    )}>
                        {amount ? formatCurrency(numericAmount) : "R$ 0,00"}
                    </p>
                    <p className="text-xs text-primary mt-2 font-medium">
                        {showKeypad ? "Toque para esconder teclado" : "Toque para digitar"}
                    </p>
                </motion.button>

                {/* ── Categories ── */}
                <section>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Categoria</p>
                        <button
                            onClick={() => setShowAllCategories(v => !v)}
                            className="text-xs text-primary font-medium"
                        >
                            {showAllCategories ? "Ver menos" : "Ver todas"}
                        </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {displayedCategories.map(cat => {
                            const Icon = cat.icon;
                            const isSelected = categoryId === cat.id;
                            return (
                                <motion.button
                                    key={cat.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setCategoryId(isSelected ? undefined : cat.id)}
                                    className={cn(
                                        "flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl border transition-all min-w-[64px]",
                                        isSelected
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border bg-card text-muted-foreground"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-[10px] font-semibold text-center leading-tight w-12 truncate">
                                        {cat.name}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </section>

                {/* ── Payment Method ── */}
                <section>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Forma de Pagamento</p>
                    <div className="grid grid-cols-4 gap-2">
                        {PAYMENT_OPTIONS.map(({ value, label, Icon }) => {
                            const isSelected = paymentMethod === value;
                            return (
                                <motion.button
                                    key={value}
                                    whileTap={{ scale: 0.93 }}
                                    onClick={() => {
                                        setPaymentMethod(value);
                                        setSelectedCardId(undefined);
                                        if (value !== "credit") {
                                            setInstallments(1);
                                        }
                                    }}
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all",
                                        isSelected
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border bg-card text-muted-foreground"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-[10px] font-semibold">{label}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </section>

                {/* ── Account / Card selector ── */}
                <AnimatePresence mode="wait">
                    {paymentMethod && paymentMethod !== "cash" && (
                        <motion.section
                            key={paymentMethod}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            {paymentMethod === "credit" ? (
                                <>
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Cartão</p>
                                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                        {creditCards.map(card => (
                                            <motion.button
                                                key={card.id}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setSelectedCardId(card.id)}
                                                className={cn(
                                                    "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
                                                    selectedCardId === card.id
                                                        ? "border-primary bg-primary/10"
                                                        : "border-border bg-card"
                                                )}
                                            >
                                                <BankLogo bankName={card.card_name || card.bank} className="w-6 h-6" size="sm" />
                                                <span className="text-sm font-medium truncate max-w-[100px]">{card.card_name || card.bank}</span>
                                            </motion.button>
                                        ))}
                                        {creditCards.length === 0 && (
                                            <p className="text-sm text-muted-foreground py-2">Nenhum cartão cadastrado</p>
                                        )}
                                    </div>

                                    {/* Installments */}
                                    <div className="flex items-center justify-between mt-4 p-3 bg-card rounded-xl border border-border">
                                        <div className="flex items-center gap-2">
                                            <Layers className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Parcelas</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setInstallments(v => Math.max(1, v - 1))}
                                                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-base font-bold w-8 text-center">{installments}x</span>
                                            <button
                                                onClick={() => setInstallments(v => Math.min(48, v + 1))}
                                                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    {installments > 1 && numericAmount > 0 && (
                                        <p className="text-xs text-muted-foreground mt-1 ml-1">
                                            {installments}x de {formatCurrency(numericAmount / installments)} por mês
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Conta</p>
                                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                        {bankAccounts.map(acc => (
                                            <motion.button
                                                key={acc.id}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setSelectedBankId(acc.id)}
                                                className={cn(
                                                    "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
                                                    selectedBankId === acc.id
                                                        ? "border-primary bg-primary/10"
                                                        : "border-border bg-card"
                                                )}
                                            >
                                                <BankLogo bankName={acc.bank_name} className="w-6 h-6" size="sm" />
                                                <div className="text-left">
                                                    <p className="text-xs font-semibold truncate max-w-[80px]">{acc.bank_name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{formatCurrency(Number(acc.current_balance))}</p>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* ── Date ── */}
                <section className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 p-3 bg-card rounded-xl border border-border">
                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="flex-1 bg-transparent text-sm font-medium outline-none min-w-0"
                        />
                    </div>
                </section>

                {/* ── Description ── */}
                <section>
                    <input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Descrição (opcional)"
                        className="w-full p-3 bg-card rounded-xl border border-border text-sm outline-none placeholder:text-muted-foreground/50"
                    />
                </section>

                {/* ── Toggle: Gasto meu / Outra pessoa ── */}
                <section className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="flex">
                        <button
                            onClick={() => setIsForOtherPerson(false)}
                            className={cn(
                                "flex-1 py-3 text-sm font-semibold transition-all",
                                !isForOtherPerson ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                            )}
                        >
                            ✓ Gasto meu
                        </button>
                        <button
                            onClick={() => setIsForOtherPerson(true)}
                            className={cn(
                                "flex-1 py-3 text-sm font-semibold transition-all",
                                isForOtherPerson ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                            )}
                        >
                            👤 Para outra pessoa
                        </button>
                    </div>

                    <AnimatePresence>
                        {isForOtherPerson && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-border overflow-hidden"
                            >
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={reimbName}
                                            onChange={e => setReimbName(e.target.value)}
                                            placeholder="Nome da pessoa"
                                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                                        />
                                    </div>
                                    <div className="h-px bg-border" />
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Valor a receber de volta</p>
                                        <input
                                            type="text"
                                            value={reimbAmount}
                                            onChange={e => setReimbAmount(e.target.value)}
                                            placeholder={`Parcial (padrão: ${amount || "total"})`}
                                            className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50"
                                        />
                                        {numericAmount > 0 && (
                                            <div className="flex gap-2 mt-2">
                                                {[0.5, 0.33, 0.25].map(frac => (
                                                    <button
                                                        key={frac}
                                                        onClick={() => setReimbAmount(formatCurrencyInput(String(Math.round(numericAmount * frac * 100))))}
                                                        className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium"
                                                    >
                                                        {Math.round(frac * 100)}%
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-px bg-border" />
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="date"
                                            value={reimbDate}
                                            onChange={e => setReimbDate(e.target.value)}
                                            className="flex-1 bg-transparent text-xs outline-none"
                                        />
                                        <span className="text-xs text-muted-foreground">previsão devolução</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

            </div>

            {/* ── Fixed Bottom: Keypad + Button ── */}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
                <AnimatePresence>
                    {showKeypad && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "spring", damping: 24, stiffness: 300 }}
                            className="overflow-hidden"
                        >
                            <div className="p-3 pb-0">
                                <NumericKeypad value={amount} onChange={setAmount} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="px-4 py-3 pb-safe">
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSave}
                        disabled={!canSubmit || isSubmitting}
                        className={cn(
                            "w-full h-14 rounded-2xl text-base font-bold transition-all flex items-center justify-center gap-2",
                            canSubmit && !isSubmitting
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Registrar Gasto
                            </>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default QuickExpense;
