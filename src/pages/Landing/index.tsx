import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import {
    Shield, Zap, CreditCard, Target, MessageCircle, Clock,
    CheckCircle, ArrowRight, ChevronDown, Star, TrendingUp,
    AlertTriangle, Eye, EyeOff, DollarSign, Users, Lock,
    Smartphone, BarChart3, Wallet, Bomb, Send, X, Menu,
    ChevronUp, Sparkles,
} from "lucide-react";
import logoSaldin from "@/assets/logo-saldin-final.png";

// ─── Animated section wrapper ───
const Section = ({ children, className = "", id = "" }: { children: React.ReactNode; className?: string; id?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });
    return (
        <motion.section
            ref={ref}
            id={id}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.section>
    );
};

// ─── Headlines rotation ───
const headlines = [
    "Você não está sem dinheiro.\nVocê está sem visão do que já está comprometido.",
    "O saldo do banco é uma mentira bonita.\nO Saldin mostra a verdade.",
    "Parcelas, dívidas e contas fixas já comeram seu salário.\nVocê só ainda não viu.",
];

// ─── Testimonials ───
const testimonials = [
    { name: "Camila R.", role: "Professora", text: "Eu achava que estava bem porque via R$ 2.000 no banco. O Saldin me mostrou que R$ 1.700 já eram de parcelas. Chorei, mas foi o melhor choque da minha vida." },
    { name: "Lucas M.", role: "Autônomo", text: "Renda variável sempre foi caótico. Agora eu sei exatamente quanto posso gastar antes de comprometer o mês. É como ter um consultor no bolso." },
    { name: "Ana Paula S.", role: "Mãe de 2", text: "Planilha eu largava no 3º dia. O Saldin eu uso pelo WhatsApp — mando áudio e ele registra. Nunca foi tão fácil." },
    { name: "Roberto F.", role: "CLT + Freela", text: "O Plano de Guerra das Dívidas me deu a data exata que eu zero tudo. Faltam 7 meses. Pela primeira vez, tenho esperança." },
];

// ─── FAQ ───
const faqs = [
    { q: "Preciso conectar meu banco?", a: "Não! O Saldin não acessa sua conta bancária. Você registra seus gastos manualmente ou via WhatsApp — com total privacidade." },
    { q: "Funciona para renda variável?", a: "Sim! O Saldin é ideal para autônomos e freelancers. Ele se adapta à sua realidade, não a um modelo fixo." },
    { q: "É seguro?", a: "Absolutamente. Seus dados são criptografados e nunca compartilhados. Não pedimos dados bancários nem CPF." },
    { q: "Posso cancelar quando quiser?", a: "Sim. Sem multa, sem pegadinha. Cancele a qualquer momento direto no app." },
    { q: "Posso usar em casal ou família?", a: "Em breve! Estamos desenvolvendo o modo família para controle compartilhado." },
];

const Landing = () => {
    const navigate = useNavigate();
    const [headlineIndex, setHeadlineIndex] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setHeadlineIndex((i) => (i + 1) % headlines.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* ─── NAVBAR ─── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <img src={logoSaldin} alt="Saldin" className="h-10" />
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                        <button onClick={() => scrollTo("problema")} className="hover:text-foreground transition-colors">O Problema</button>
                        <button onClick={() => scrollTo("mecanismo")} className="hover:text-foreground transition-colors">Como Funciona</button>
                        <button onClick={() => scrollTo("planos")} className="hover:text-foreground transition-colors">Planos</button>
                        <button onClick={() => scrollTo("faq")} className="hover:text-foreground transition-colors">FAQ</button>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="hidden md:inline-flex">
                            Entrar
                        </Button>
                        <Button size="sm" onClick={() => navigate("/auth")} className="gradient-warm text-primary-foreground border-0">
                            Começar grátis
                        </Button>
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden border-t border-border bg-background px-4 pb-4"
                    >
                        <div className="flex flex-col gap-3 pt-3 text-sm font-medium">
                            <button onClick={() => scrollTo("problema")} className="text-left py-2 text-muted-foreground">O Problema</button>
                            <button onClick={() => scrollTo("mecanismo")} className="text-left py-2 text-muted-foreground">Como Funciona</button>
                            <button onClick={() => scrollTo("planos")} className="text-left py-2 text-muted-foreground">Planos</button>
                            <button onClick={() => scrollTo("faq")} className="text-left py-2 text-muted-foreground">FAQ</button>
                            <button onClick={() => navigate("/auth")} className="text-left py-2 text-primary font-semibold">Entrar</button>
                        </div>
                    </motion.div>
                )}
            </nav>

            {/* ─── 1. HERO ─── */}
            <section className="pt-32 pb-20 px-4 relative overflow-hidden">
                <div className="absolute inset-0 gradient-soft opacity-50" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
                            <Sparkles className="w-4 h-4" />
                            5 dias grátis — sem cartão de crédito
                        </div>
                        <motion.h1
                            key={headlineIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="font-serif text-4xl md:text-6xl font-bold leading-tight mb-6 whitespace-pre-line"
                        >
                            {headlines[headlineIndex]}
                        </motion.h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                            O Saldin calcula seu <strong className="text-foreground">Saldo Livre de Verdade™</strong> — o dinheiro que realmente sobra depois de todas as contas, parcelas e dívidas.
                            Funciona via <strong className="text-foreground">WhatsApp</strong>, áudio, texto ou foto. Sem complicação.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                size="lg"
                                onClick={() => navigate("/auth")}
                                className="gradient-warm text-primary-foreground border-0 h-14 px-8 text-lg gap-2 shadow-medium hover:shadow-large transition-shadow"
                            >
                                Começar meus 5 dias grátis
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => scrollTo("mecanismo")}
                                className="h-14 px-8 text-lg gap-2"
                            >
                                Como funciona
                                <ChevronDown className="w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ─── Marquee ─── */}
            <div className="bg-foreground/5 py-3 overflow-hidden">
                <motion.div
                    animate={{ x: [0, -1500] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="flex gap-12 whitespace-nowrap text-sm font-medium text-muted-foreground"
                >
                    {[
                        "Saldo do banco ≠ dinheiro disponível",
                        "Parcelas invisíveis destroem seu mês",
                        "Clareza > Controle",
                        "Saiba antes de gastar",
                        "Fim do susto no cartão",
                        "Saldo do banco ≠ dinheiro disponível",
                        "Parcelas invisíveis destroem seu mês",
                        "Clareza > Controle",
                        "Saiba antes de gastar",
                        "Fim do susto no cartão",
                    ].map((text, i) => (
                        <span key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {text}
                        </span>
                    ))}
                </motion.div>
            </div>

            {/* ─── 3. O PROBLEMA ─── */}
            <Section id="problema" className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-sm font-bold uppercase tracking-widest text-impulse">O problema que ninguém te contou</span>
                        <h2 className="font-serif text-3xl md:text-5xl font-bold mt-3 mb-4">
                            O saldo do banco é uma ilusão
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Você olha o extrato e pensa que está bem. Mas esquece das parcelas que vêm, das contas que vencem e das dívidas que crescem no silêncio.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { icon: EyeOff, title: "Saldo ≠ Dinheiro disponível", desc: "Aquele número no app do banco inclui dinheiro que já tem dono: aluguel, parcela do carro, fatura do cartão..." },
                            { icon: CreditCard, title: "Parcelas futuras são invisíveis", desc: "Você parcelou em 12x e esqueceu. Mas as próximas 8 parcelas já estão comendo sua renda sem você perceber." },
                            { icon: AlertTriangle, title: "Dívidas silenciosas", desc: "Empréstimo, cheque especial, cartão rotativo — tudo crescendo com juros enquanto você acha que está no controle." },
                            { icon: BarChart3, title: "Apps mostram gráficos, não decisões", desc: "Gráfico bonito de pizza não responde: 'posso comprar isso agora?'. O Saldin responde." },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-2xl bg-card border border-border shadow-soft"
                            >
                                <div className="w-12 h-12 rounded-xl bg-impulse/10 flex items-center justify-center mb-4">
                                    <item.icon className="w-6 h-6 text-impulse" />
                                </div>
                                <h3 className="font-serif text-xl font-semibold mb-2">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ─── 4. O INIMIGO INVISÍVEL ─── */}
            <Section className="py-20 px-4 bg-foreground/[0.03]">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-sm font-bold uppercase tracking-widest text-obligation">O inimigo invisível</span>
                    <h2 className="font-serif text-3xl md:text-5xl font-bold mt-3 mb-6">
                        O sistema não foi feito pra te ajudar
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
                        Não é culpa sua. As ferramentas que existem foram feitas para outro tipo de pessoa — ou para outro objetivo.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-6 text-left">
                        {[
                            { emoji: "📊", title: "Planilhas são para quem já é organizado", desc: "Se você precisa de ajuda pra começar, planilha não resolve — ela é o prêmio de quem já chegou lá." },
                            { emoji: "📈", title: "Apps mostram gráficos bonitos", desc: "Mas gráfico de pizza no fim do mês é autópsia, não prevenção. Você precisa saber ANTES de gastar." },
                            { emoji: "🏦", title: "Bancos querem que você use crédito", desc: "O limite do cartão aparece como 'disponível'. O cheque especial é chamado de 'proteção'. A linguagem é projetada para confundir." },
                            { emoji: "👻", title: "Ninguém mostra o impacto real", desc: "Quanto das próximas parcelas já comprometeu o mês que vem? E o seguinte? Ninguém mostra isso — até agora." },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-2xl bg-card border border-border shadow-soft"
                            >
                                <span className="text-3xl mb-3 block">{item.emoji}</span>
                                <h3 className="font-serif text-lg font-semibold mb-2">{item.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ─── 5. MECANISMO ÚNICO ─── */}
            <Section id="mecanismo" className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-sm font-bold uppercase tracking-widest text-essential">O mecanismo único</span>
                        <h2 className="font-serif text-3xl md:text-5xl font-bold mt-3 mb-4">
                            Saldo Livre de Verdade™
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Um número. Simples. Honesto. Que mostra exatamente quanto dinheiro é <strong className="text-foreground">realmente seu</strong> pra gastar — depois de tudo.
                        </p>
                    </div>
                    <div className="relative max-w-lg mx-auto">
                        <div className="bg-card rounded-3xl border border-border shadow-large p-8 space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <span className="text-muted-foreground">Saldo no banco</span>
                                <span className="font-mono text-lg font-semibold">R$ 4.200,00</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-impulse" /> Contas fixas do mês
                                </span>
                                <span className="font-mono text-impulse">− R$ 1.800,00</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-obligation" /> Parcelas futuras
                                </span>
                                <span className="font-mono text-obligation">− R$ 890,00</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-destructive" /> Dívidas
                                </span>
                                <span className="font-mono text-destructive">− R$ 350,00</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-essential" /> A receber
                                </span>
                                <span className="font-mono text-essential">+ R$ 500,00</span>
                            </div>
                            <div className="pt-4">
                                <div className="gradient-warm rounded-2xl p-6 text-center">
                                    <p className="text-primary-foreground/80 text-sm font-medium mb-1">Saldo Livre de Verdade™</p>
                                    <p className="text-primary-foreground font-serif text-4xl font-bold">R$ 1.660,00</p>
                                    <p className="text-primary-foreground/70 text-xs mt-2">Isso é o que realmente é seu pra gastar</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ─── 6. FUNCIONALIDADES ─── */}
            <Section className="py-20 px-4 bg-foreground/[0.03]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-sm font-bold uppercase tracking-widest text-primary">Funcionalidades estratégicas</span>
                        <h2 className="font-serif text-3xl md:text-5xl font-bold mt-3 mb-4">
                            Feito pra quem vive a vida real
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: Wallet, title: "Saldo Livre de Verdade", desc: "O número que o banco deveria te mostrar — mas não mostra. Quanto sobra depois de tudo.", color: "text-essential", bg: "bg-essential/10" },
                            { icon: CreditCard, title: "Mapa de Parcelas", desc: "Veja mês a mês quanto já está comprometido com parcelas. Pare de se surpreender.", color: "text-obligation", bg: "bg-obligation/10" },
                            { icon: Bomb, title: "Plano de Guerra das Dívidas", desc: "Mostra o dia exato que você zera cada dívida. Com estratégia, não com desespero.", color: "text-impulse", bg: "bg-impulse/10" },
                            { icon: Send, title: "Quem Deve Pra Você", desc: "Organize valores a receber. Saiba de quem cobrar — e cobre com 1 clique via WhatsApp.", color: "text-pleasure", bg: "bg-pleasure/10" },
                            { icon: MessageCircle, title: "Registro via WhatsApp", desc: "Manda texto, áudio ou foto do recibo. O Saldin entende e registra. Sem abrir app, sem fricção.", color: "text-primary", bg: "bg-primary/10" },
                            { icon: Target, title: "Metas com Progresso Real", desc: "Defina objetivos e acompanhe com base no seu saldo livre real — não no imaginário.", color: "text-accent", bg: "bg-accent/10" },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="p-6 rounded-2xl bg-card border border-border shadow-soft hover:shadow-medium transition-shadow"
                            >
                                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                                    <item.icon className={`w-6 h-6 ${item.color}`} />
                                </div>
                                <h3 className="font-serif text-lg font-semibold mb-2">{item.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ─── 7. QUEBRA DE OBJEÇÕES ─── */}
            <Section className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-3xl md:text-4xl font-bold">"Mas será que funciona pra mim?"</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { objection: "Não tenho tempo", answer: "Se você tem 10 segundos pra mandar um áudio no WhatsApp, tem tempo pro Saldin. Sério, é isso." },
                            { objection: "Já tentei planilha", answer: "Planilha exige disciplina de robô. O Saldin funciona com o seu ritmo — mesmo desorganizado." },
                            { objection: "Eu sempre começo e paro", answer: "Porque as outras ferramentas exigem demais. Aqui, o mínimo já te dá clareza. E clareza vicia." },
                            { objection: "Acho difícil", answer: "Se você sabe mandar mensagem no WhatsApp, você sabe usar o Saldin. Não tem tela complicada, não tem gráfico confuso." },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-2xl border border-border bg-card shadow-soft"
                            >
                                <p className="text-impulse font-bold text-sm mb-2">"{item.objection}"</p>
                                <p className="text-foreground leading-relaxed">{item.answer}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ─── 8. PRA QUEM É ─── */}
            <Section className="py-20 px-4 bg-foreground/[0.03]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold mb-10">O Saldin é pra você se...</h2>
                    <div className="grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                        {[
                            "Vive apertado no fim do mês sem entender por quê",
                            "Usa o cartão de crédito como extensão do salário",
                            "Quer saber se pode gastar ANTES de passar o cartão",
                            "Está cansado de viver no escuro financeiro",
                            "Tem vergonha de pedir ajuda com dinheiro",
                            "Quer parar de ter medo de olhar a fatura",
                        ].map((text, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border"
                            >
                                <CheckCircle className="w-5 h-5 text-essential mt-0.5 shrink-0" />
                                <span className="text-sm leading-relaxed">{text}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ─── 9. PROVA SOCIAL ─── */}
            <Section className="py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-3xl md:text-4xl font-bold">Quem usa, não volta atrás</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-2xl bg-card border border-border shadow-soft"
                            >
                                <div className="flex gap-1 mb-3">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                                    ))}
                                </div>
                                <p className="text-foreground leading-relaxed mb-4 italic">"{t.text}"</p>
                                <div>
                                    <p className="font-semibold text-sm">{t.name}</p>
                                    <p className="text-muted-foreground text-xs">{t.role}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ─── 10-11. PLANOS + OFERTA ─── */}
            <Section id="planos" className="py-20 px-4 bg-foreground/[0.03]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-4">
                        <span className="text-sm font-bold uppercase tracking-widest text-essential">Oferta especial</span>
                        <h2 className="font-serif text-3xl md:text-5xl font-bold mt-3 mb-4">
                            Comece com 5 dias grátis
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Teste tudo. Sem cartão de crédito. Sem compromisso. Se não gostar, é só não continuar.
                        </p>
                    </div>

                    {/* Urgency */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="max-w-md mx-auto mb-12 p-4 rounded-xl bg-impulse/10 border border-impulse/20 text-center"
                    >
                        <p className="text-sm font-semibold text-impulse flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" />
                            Preço promocional de lançamento — pode aumentar a qualquer momento
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                name: "Mensal",
                                price: "19,90",
                                period: "/mês",
                                desc: "Flexibilidade total",
                                highlight: false,
                                badge: null,
                                features: ["Acesso completo", "5 dias grátis", "WhatsApp ilimitado", "Cancele quando quiser"],
                            },
                            {
                                name: "Semestral",
                                price: "89,90",
                                period: "/6 meses",
                                desc: "Mais escolhido",
                                highlight: true,
                                badge: "Economize 25%",
                                features: ["Tudo do mensal", "5 dias grátis", "Equivale a R$ 14,98/mês", "Prioridade no suporte"],
                            },
                            {
                                name: "Anual",
                                price: "149,90",
                                period: "/ano",
                                desc: "Melhor custo-benefício",
                                highlight: false,
                                badge: "Economize 37%",
                                features: ["Tudo do semestral", "5 dias grátis", "Equivale a R$ 12,49/mês", "Acesso antecipado a novidades"],
                            },
                        ].map((plan, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`relative p-6 rounded-2xl border shadow-soft flex flex-col ${plan.highlight
                                        ? "border-primary bg-card shadow-medium scale-[1.02]"
                                        : "border-border bg-card"
                                    }`}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-warm text-primary-foreground text-xs font-bold">
                                        {plan.badge}
                                    </div>
                                )}
                                <div className="text-center mb-6 pt-2">
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{plan.name}</p>
                                    <p className="text-muted-foreground text-xs mt-1">{plan.desc}</p>
                                    <div className="mt-4">
                                        <span className="font-serif text-4xl font-bold">R$ {plan.price}</span>
                                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                                    </div>
                                </div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((f, j) => (
                                        <li key={j} className="flex items-center gap-2 text-sm">
                                            <CheckCircle className="w-4 h-4 text-essential shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    onClick={() => navigate("/auth")}
                                    className={`w-full h-12 ${plan.highlight
                                            ? "gradient-warm text-primary-foreground border-0 shadow-soft"
                                            : ""
                                        }`}
                                    variant={plan.highlight ? "default" : "outline"}
                                >
                                    Começar 5 dias grátis
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ─── 13. FAQ ─── */}
            <Section id="faq" className="py-20 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-3xl md:text-4xl font-bold">Perguntas frequentes</h2>
                    </div>
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="rounded-2xl border border-border bg-card overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between p-5 text-left"
                                >
                                    <span className="font-semibold text-sm pr-4">{faq.q}</span>
                                    {openFaq === i ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
                                </button>
                                {openFaq === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        className="px-5 pb-5"
                                    >
                                        <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ─── 15. CTA FINAL ─── */}
            <section className="py-24 px-4 relative overflow-hidden">
                <div className="absolute inset-0 gradient-warm opacity-10" />
                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6">
                            Chega de viver no escuro financeiro
                        </h2>
                        <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
                            Clareza. Decisão. Fim do susto no cartão.<br />
                            Comece agora e descubra quanto dinheiro é realmente seu.
                        </p>
                        <Button
                            size="lg"
                            onClick={() => navigate("/auth")}
                            className="gradient-warm text-primary-foreground border-0 h-16 px-10 text-lg gap-2 shadow-large hover:scale-105 transition-transform"
                        >
                            Comece seus 5 dias grátis agora
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                        <p className="text-muted-foreground text-xs mt-4">Sem cartão de crédito · Cancele quando quiser</p>
                    </motion.div>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="border-t border-border py-10 px-4">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img src={logoSaldin} alt="Saldin" className="h-8" />
                        <span className="text-muted-foreground text-sm">© 2025 Saldin. Todos os direitos reservados.</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">Termos</button>
                        <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">Privacidade</button>
                        <button onClick={() => navigate("/help")} className="hover:text-foreground transition-colors">Ajuda</button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
