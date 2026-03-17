import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import {
    ArrowLeft,
    Calendar,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    PieChart as PieIcon,
    BarChart3,
    LayoutGrid,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useExpenses } from "@/hooks/useExpenses";
import { useCardInstallmentsByMonth } from "@/hooks/useCreditCards";
import { defaultCategories, categoryGroups, type CategoryGroup } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { useAllCategories } from "@/hooks/useCategories";

const COLORS = [
    "#3B82F6", "#10B981", "#EF4444", "#14b8a6", "#F59E0B",
    "#EC4899", "#14B8A6", "#6366F1", "#94A3B8"
];

export default function Reports() {
    const navigate = useNavigate();
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState<"category" | "group">("group");

    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const prevMonthStart = startOfMonth(subMonths(selectedMonth, 1));
    const prevMonthEnd = endOfMonth(subMonths(selectedMonth, 1));

    // Current month data
    const { data: expenses = [] } = useExpenses();
    const { data: installments = [] } = useCardInstallmentsByMonth(format(selectedMonth, "yyyy-MM"));

    // Prev month data (to compare)
    const { data: prevInstallments = [] } = useCardInstallmentsByMonth(format(subMonths(selectedMonth, 1), "yyyy-MM"));

    const { allCategories } = useAllCategories();

    // Aggregate current month
    const reportData = useMemo(() => {
        // 1. Manual expenses for current month
        const monthExpenses = expenses.filter(e =>
            e.status !== "deleted" &&
            isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd })
        );

        // 2. Sum everything by category ID
        const categoryTotals: Record<string, number> = {};

        monthExpenses.forEach(e => {
            const catId = e.category_id || "outros";
            categoryTotals[catId] = (categoryTotals[catId] || 0) + Number(e.amount);
        });

        installments.forEach(i => {
            // For installments, we should try to find the category from the purchase
            // Purchases are linked to installments, but the hook might not return it directly. 
            // Assuming i.purchases.category_id if available, else others.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const catId = (i as any).purchases?.category_id || "outros";
            categoryTotals[catId] = (categoryTotals[catId] || 0) + Number(i.amount);
        });

        // 3. Group by what user selected
        const groupedData: Record<string, { total: number; name: string; color: string }> = {};

        Object.entries(categoryTotals).forEach(([catId, amount]) => {
            // Find category by ID (UUID or slug)
            // Fallback: try by name 'Outros', then first available, then hardcoded fallback
            const cat = allCategories.find(c => c.id === catId) ||
                allCategories.find(c => c.name.toLowerCase() === "outros") ||
                allCategories[0];

            if (!cat) return;

            const key = viewMode === "group" ? (cat.group || "outros") : cat.id;
            const name = viewMode === "group" ? (categoryGroups[cat.group as CategoryGroup]?.name || "Outros") : cat.name;
            const color = viewMode === "group" ? (cat.color || "#3B82F6") : (cat.color || "#3B82F6");

            if (!groupedData[key]) {
                groupedData[key] = { total: 0, name: name || "Outros", color: color };
            }
            groupedData[key].total += amount;
        });

        const totalMonth = Object.values(groupedData).reduce((acc, curr) => acc + curr.total, 0);

        return Object.entries(groupedData)
            .map(([id, info]) => ({
                id,
                ...info,
                percentage: totalMonth > 0 ? (info.total / totalMonth) * 100 : 0
            }))
            .sort((a, b) => b.total - a.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expenses, installments, selectedMonth, viewMode, allCategories]);

    // Comparison logic
    const comparison = useMemo(() => {
        const totalCurrent = reportData.reduce((acc, curr) => acc + curr.total, 0);

        // Quick prev month calc
        const prevExpenses = expenses.filter(e =>
            e.status !== "deleted" &&
            isWithinInterval(new Date(e.date), { start: prevMonthStart, end: prevMonthEnd })
        );
        const totalPrevExpenses = prevExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const totalPrevInstallments = prevInstallments.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const totalPrev = totalPrevExpenses + totalPrevInstallments;

        if (totalPrev === 0) return { diff: 0, trend: "neutral" };

        const diff = totalCurrent - totalPrev;
        const diffPercent = (diff / totalPrev) * 100;

        return {
            diff,
            diffPercent,
            trend: diff > 0 ? "up" : "down",
            totalPrev
        };
    }, [reportData, expenses, prevInstallments, prevMonthStart, prevMonthEnd]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);

    const prevMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));
    const nextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1));

    return (
        <div className="min-h-screen bg-background pb-24">
      <title>Saldin | Reports</title>
      <meta name="description" content="Manage your reports easily with Saldin." />
      <meta property="og:title" content="Saldin - Reports" />
      <meta property="og:description" content="Manage your reports easily with Saldin." />
        
            <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
                <div className="pt-4 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="font-serif text-xl font-semibold">Relatórios</h1>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                        <Button
                            variant={viewMode === "group" ? "warm" : "ghost"}
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => setViewMode("group")}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            Grupos
                        </Button>
                        <Button
                            variant={viewMode === "category" ? "warm" : "ghost"}
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => setViewMode("category")}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            Categorias
                        </Button>
                    </div>
                </div>
            </header>

            <main className="p-5 space-y-8 pt-4">
                {/* Month Selector Premium */}
                <div className="flex items-center justify-between glass p-2 rounded-2xl border border-white/20 shadow-medium">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl hover:bg-background/10">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex flex-col items-center">
                        <span className="max-w-[100vw] leading-relaxed text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-0.5">
                            Referente a
                        </span>
                        <h3 className="max-w-[100vw] leading-relaxed text-sm leading-relaxed font-bold capitalize">
                            {format(selectedMonth, "MMMM", { locale: ptBR })} {format(selectedMonth, "yyyy")}
                        </h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl hover:bg-background/10">
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                {/* Total & Comparison Premium */}
                <FadeIn>
                    <div className="relative overflow-hidden p-8 rounded-[2.5rem] glass shadow-large border border-white/20 group">
                        {/* Static Blurs (Matching BalanceHero) */}
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-[60px]" />

                        <div className="relative">
                            <p className="max-w-[100vw] leading-relaxed text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-2">Desembolso Mensal</p>
                            <div className="flex items-baseline justify-between gap-4">
                                <h2 className="max-w-[100vw] leading-relaxed text-4xl font-serif font-bold tracking-tight text-foreground truncate">
                                    {formatCurrency(reportData.reduce((acc, curr) => acc + curr.total, 0))}
                                </h2>

                                {comparison.totalPrev > 0 && (
                                    <div className={cn(
                                        "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm border",
                                        comparison.trend === "up"
                                            ? "text-destructive bg-destructive/10 border-destructive/20"
                                            : "text-essential bg-essential/10 border-essential/20"
                                    )}>
                                        {comparison.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {Math.abs(comparison.diffPercent).toFixed(0)}%
                                    </div>
                                )}
                            </div>

                            {/* Visual Progress Bar - Relative to prev month */}
                            {comparison.totalPrev > 0 && (
                                <div className="mt-6">
                                    <div className="h-1.5 w-full bg-background/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((reportData.reduce((acc, curr) => acc + curr.total, 0) / (comparison.totalPrev || 1)) * 100, 100)}%` }}
                                            className={cn(
                                                "h-full rounded-full",
                                                comparison.trend === "up" ? "bg-destructive" : "bg-essential"
                                            )}
                                        />
                                    </div>
                                    <p className="max-w-[100vw] leading-relaxed text-[9px] text-muted-foreground mt-2 font-medium">
                                        Comparado a {formatCurrency(comparison.totalPrev)} do mês anterior
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </FadeIn>

                {/* Pie Chart Premium */}
                <FadeIn delay={0.1}>
                    <div className="p-6 rounded-[2.5rem] bg-card/40 backdrop-blur-md border border-border/50 shadow-soft">
                        <div className="flex items-center justify-between mb-8 px-1">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                    <PieIcon className="w-5 h-5" />
                                </div>
                                <h3 className="font-serif text-lg leading-relaxed font-bold">Onde você gastou?</h3>
                            </div>
                        </div>

                        <div className="h-[280px] w-full relative">
                            {/* Center Summary for Donut */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-[-10px]">
                                <span className="max-w-[100vw] leading-relaxed text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Total</span>
                                <span className="max-w-[100vw] leading-relaxed text-xl font-serif font-bold tracking-tight">
                                    {formatCurrency(reportData.reduce((acc, curr) => acc + curr.total, 0)).split(',')[0]}
                                </span>
                            </div>

                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={reportData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={75}
                                        outerRadius={95}
                                        paddingAngle={8}
                                        dataKey="total"
                                        stroke="none"
                                    >
                                        {reportData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color || COLORS[index % COLORS.length]}
                                                className="hover:opacity-80 transition-opacity cursor-pointer shadow-large"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{
                                            backgroundColor: 'rgba(255,255,255,0.8)',
                                            backdropFilter: 'blur(12px)',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                            padding: '12px'
                                        }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Top 4 Legend - Grid Style */}
                        <div className="grid grid-cols-2 gap-4 mt-4 bg-muted/20 p-4 rounded-[1.5rem] border border-border/30">
                            {reportData.slice(0, 4).map((item, index) => (
                                <div key={item.id} className="flex items-center gap-2.5">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }} />
                                    <div className="min-w-0">
                                        <p className="max-w-[100vw] leading-relaxed text-[10px] font-bold truncate leading-none mb-0.5">{item.name}</p>
                                        <p className="max-w-[100vw] leading-relaxed text-[9px] text-muted-foreground font-medium">{item.percentage.toFixed(0)}% do mês</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeIn>

                {/* Bar Chart Premium */}
                <FadeIn delay={0.2}>
                    <div className="p-6 rounded-[2.5rem] bg-card/40 backdrop-blur-md border border-border/50 shadow-soft">
                        <div className="flex items-center gap-3 mb-8 px-1">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <h3 className="font-serif text-lg leading-relaxed font-bold">Concentração de Despesas</h3>
                        </div>

                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportData.slice(0, 6)} layout="vertical" margin={{ left: -10, right: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                                        width={90}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar
                                        dataKey="total"
                                        radius={[0, 8, 8, 0]}
                                        barSize={16}
                                    >
                                        {reportData.map((entry, index) => (
                                            <Cell
                                                key={`bar-${index}`}
                                                fill={entry.color || COLORS[index % COLORS.length]}
                                                className="shadow-inner"
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </FadeIn>

                {/* List Details Premium */}
                <FadeIn delay={0.3}>
                    <div className="space-y-4">
                        <h3 className="px-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Raio-X Mensal</h3>
                        <div className="space-y-3 pb-8">
                            {reportData.map((item) => (
                                <motion.div
                                    key={item.id}
                                    whileTap={{ scale: 0.98 }}
                                    className="group p-4 rounded-2xl bg-card border border-border/40 flex items-center justify-between shadow-soft hover:shadow-medium transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: item.color }} />
                                        <div>
                                            <p className="max-w-[100vw] leading-relaxed text-sm leading-relaxed font-bold group-hover:text-primary transition-colors">{item.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="max-w-[100vw] leading-relaxed text-[10px] font-bold text-muted-foreground bg-muted/50 px-1.5 rounded uppercase tracking-tighter">
                                                    {item.percentage.toFixed(0)}% do mês
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="max-w-[100vw] leading-relaxed text-right">
                                        <p className="font-bold text-sm leading-relaxed tracking-tight">{formatCurrency(item.total)}</p>
                                        <div className="h-0.5 w-full bg-muted rounded-full mt-1 overflow-hidden">
                                            <div
                                                className="h-full bg-current opacity-20"
                                                style={{ width: `${item.percentage}%`, color: item.color }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </FadeIn>
            </main>

            <BottomNav />
        </div>
    );
}
