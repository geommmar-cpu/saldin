import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CreditCard, Calendar, Smartphone as PhoneIcon } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/balanceCalculations";
import type { CreditCard as CreditCardType } from "@/types/creditCard";
import { detectBank } from "@/lib/cardBranding";
import { BankLogo } from "@/components/BankLogo";

interface CreditCardsCarouselProps {
    cards: CreditCardType[];
    installments: any[];
    selectedMonth: Date;
}

export const CreditCardsCarousel = ({ cards, installments, selectedMonth }: CreditCardsCarouselProps) => {
    const navigate = useNavigate();
    const { data: profile } = useProfile();
    const defaultCardId = (profile as any)?.wa_default_expense_card_id;

    if (cards.length === 0) return null;

    // Calculate invoice total for each card for the selected month
    const cardTotals = cards.map(card => {
        const total = installments
            .filter(inst => inst.purchase?.card_id === card.id)
            .reduce((sum, inst) => sum + Number(inst.amount), 0);

        const limit = card.credit_limit || 0;
        const usage = limit > 0 ? (total / limit) * 100 : 0;

        // Detect bank theme for colors
        const bankTheme = detectBank(card.card_name, null);

        return { ...card, currentInvoice: total, usage, limit, bankTheme };
    });

    // Sort cardTotals: Main first
    const sortedCardTotals = [...cardTotals].sort((a, b) => {
        const isAMain = a.id === defaultCardId;
        const isBMain = b.id === defaultCardId;
        if (isAMain && !isBMain) return -1;
        if (!isAMain && isBMain) return 1;
        return 0;
    });

    return (
        <div className="space-y-4">
            {/* Legend for Main Card */}
            <div className="px-4 pb-2">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 bg-muted/30 w-fit px-3 py-1 rounded-full border border-muted-foreground/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Gastos enviados pelo WhatsApp são registrados no cartão <span className="text-primary font-bold">Principal</span> por padrão.
                </p>
            </div>

            <div
                className="w-full max-w-full pb-6 pt-2 px-1"
                style={{
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch'
                }}
            >
                <div className="flex gap-4 snap-x snap-mandatory min-w-full w-max px-4 sm:px-0">
                    {sortedCardTotals.map((card, index) => (

                        <motion.div
                            key={card.id}
                            onClick={() => navigate(`/cards/${card.id}`)}
                            className="snap-center shrink-0 w-[280px] sm:w-[320px] h-[190px] rounded-[1.8rem] p-6 relative overflow-hidden shadow-large group cursor-pointer transition-all duration-500 border border-white/10"
                            style={{
                                animationDelay: `${index * 100}ms`,
                            }}
                        >
                            {/* Card Dynamic Background with Texture */}
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-br transition-all duration-700 group-hover:scale-110",
                                card.bankTheme.gradient || "from-slate-700 to-slate-900"
                            )} />

                            {/* Subtle Noise/Texture Overlay */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                            {/* Premium Gloss Reflection */}
                            <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />

                            {/* Inner Shadow for Depth */}
                            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.2)]" />

                            {/* Content Container */}
                            <div className="relative z-10 flex flex-col h-full justify-between text-white">
                                {/* Top row: Bank Logo & Wireless Icon */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-soft">
                                            <BankLogo
                                                bankName={card.card_name}
                                                className="w-8 h-8"
                                                iconClassName="text-white"
                                                size="md"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold tracking-tight drop-shadow-md">
                                                {card.card_name}
                                            </p>
                                            <p className="text-[9px] uppercase font-bold tracking-[0.1em] opacity-60">
                                                {card.card_brand || "Crédito"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        {/* Wireless Icon */}
                                        <div className="opacity-40 rotate-90">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 8a10 10 0 0 1 14 0" /><path d="M8.5 11.5a5 5 0 0 1 7 0" /><path d="M12 15a1 1 0 0 1 0 0" />
                                            </svg>
                                        </div>
                                        {card.id === defaultCardId && (
                                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/10">
                                                <PhoneIcon className="w-2.5 h-2.5 text-white" />
                                                <span className="text-[7px] font-black uppercase tracking-widest">Principal</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Middle row: The metallic Chip */}
                                <div className="mt-2 flex items-center justify-between">
                                    <div className="w-10 h-8 rounded-md bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 relative overflow-hidden shadow-inner border border-yellow-700/30">
                                        {/* Chip details lines */}
                                        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/20" />
                                        <div className="absolute inset-y-0 left-1/3 w-[1px] bg-black/20" />
                                        <div className="absolute inset-y-0 right-1/3 w-[1px] bg-black/20" />
                                    </div>

                                    {/* Last 4 digits in monospace premium style */}
                                    <div className="text-right">
                                        <span className="text-[10px] font-mono tracking-[0.3em] opacity-60 mr-1">••••</span>
                                        <span className="text-sm font-mono font-bold tracking-widest drop-shadow-lg">{card.last_four_digits || "0000"}</span>
                                    </div>
                                </div>

                                {/* Bottom row: Balance & Usage Bar */}
                                <div className="mt-auto pt-3">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="flex flex-col">
                                            <p className="text-[8px] uppercase font-black tracking-widest opacity-60 mb-1">Fatura Atual</p>
                                            <p className="text-2xl font-bold tracking-tight drop-shadow-md text-white">
                                                {formatCurrency(card.currentInvoice)}
                                            </p>
                                        </div>
                                        <div className="text-right pb-1">
                                            <p className="text-[9px] font-bold opacity-80 mb-0.5">Vence {card.due_day}</p>
                                            <p className="text-[8px] opacity-50 uppercase tracking-tighter">Limite: {formatCurrency(card.limit).split(',')[0]}</p>
                                        </div>
                                    </div>

                                    {/* Visual Usage Bar with Glow */}
                                    <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(card.usage, 100)}%` }}
                                            transition={{ duration: 1.2, ease: "easeOut" }}
                                            className={cn(
                                                "h-full rounded-full relative",
                                                card.usage > 90 ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                                            )}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

