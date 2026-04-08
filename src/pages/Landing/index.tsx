import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
    Shield, Zap, CreditCard, Target, MessageCircle, Clock,
    CheckCircle, ArrowRight, ChevronDown, Star, TrendingUp,
    AlertTriangle, Eye, EyeOff, DollarSign, Users, Lock,
    Smartphone, BarChart3, Wallet, Bomb, Send, X, Menu,
    ChevronUp, Sparkles, Check, Play, UserCheck, ThumbsUp, Timer,
    Mic, Camera, FileText
} from "lucide-react";
import logoSaldin from "@/assets/logo-saldin-final.png";

// ─── Animated section wrapper ───
function Section({ children, className = "", id = "" }: { children: React.ReactNode; className?: string; id?: string }) {
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
}

// ─── Sticky CTA Bar (appears after scroll) ───
function StickyCtaBar({ onCta }: { onCta: () => void }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => setVisible(window.scrollY > 400);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-0 left-0 right-0 z-[55] bg-gray-950/95 backdrop-blur-md border-t border-white/10 px-4 py-3 shadow-2xl"
                >
                    <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-center sm:text-left">
                            <p className="text-white font-bold text-sm sm:text-base leading-tight">
                                🔥 Oferta de Lançamento — <span className="text-orange-400">4 dias grátis</span>
                            </p>
                            <p className="text-gray-400 text-xs mt-0.5">Cancele quando quiser · Sem cartão para trials</p>
                        </div>
                        <button
                            onClick={onCta}
                            className="w-full sm:w-auto shrink-0 gradient-warm text-white font-bold px-8 py-3 rounded-full text-sm shadow-lg shadow-orange-500/30 hover:scale-105 hover:shadow-orange-500/50 transition-all duration-200 whitespace-nowrap"
                        >
                            Começar Agora — É Grátis
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── Phone Mockup Component (iPhone 15 Pro Style - Light Mode) ───
function PhoneMockup() {
    const [messages, setMessages] = useState<{ type: 'user' | 'bot', text: string | React.ReactNode }[]>([]);

    useEffect(() => {
        const sequence = [
            { type: 'user', text: 'Gastei 45 no almoço no cartão Inter em 2x', delay: 1000 },
            {
                type: 'bot', text: (
                    <div className="flex flex-col text-left text-xs sm:text-sm leading-relaxed leading-relaxed w-full font-sans">
                        {/* Header: Transaction Confirmed */}
                        <div className="font-bold border-b border-border pb-2 mb-2 flex items-center gap-2 text-gray-800">
                            <div className="shrink-0 w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-[10px] text-gray-500">✓</div>
                            <span className="leading-relaxed text-[11px] sm:text-xs tracking-wider">COMPRA PARCELADA REGISTRADA</span>
                        </div>

                        {/* Details */}
                        <div className="space-y-1 mb-3 text-gray-600 text-[11px] sm:text-xs">
                            <p><span className="font-semibold text-gray-800">Valor Total:</span> R$ 90,00</p>
                            <p><span className="font-semibold text-gray-800">Parcelas:</span> <span className="leading-relaxed text-gray-900 font-bold bg-gray-100 px-1 rounded">2x de R$ 45,00</span></p>
                            <p><span className="font-semibold text-gray-800">Cartão:</span> Inter (Final 4022)</p>
                            <p><span className="font-semibold text-gray-800">Categoria:</span> Restaurante</p>
                        </div>

                        {/* Impact */}
                        <div className="font-bold border-b border-border pb-1 mb-2 text-gray-800 flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-wide mt-2">
                            📉 Impacto no Saldo Livre
                        </div>
                        <div className="space-y-1 mb-3 text-gray-600 text-[11px] sm:text-xs">
                            <div className="flex justify-between">
                                <span>Saldo Livre Atual:</span>
                                <span className="font-medium text-gray-500">R$ 1.540,00</span>
                            </div>
                            <div className="flex justify-between text-red-600 font-bold bg-red-50 p-1.5 rounded -mx-1.5 border border-red-100/50">
                                <span>Saldo Após Gasto:</span>
                                <span>R$ 1.495,00</span>
                            </div>
                        </div>

                        {/* Proactive Tip */}
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 text-[10px] text-blue-800">
                            💡 <strong>Dica do Saldin:</strong> Você já tem R$ 420,00 comprometidos em parcelas para o próximo mês. Cuidado com novas compras no crédito!
                        </div>

                        <div className="mt-3 pt-2 border-t border-border text-[9px] text-center text-gray-400 font-medium tracking-wide">
                            Saldin • Seu controle financeiro via WhatsApp
                        </div>
                    </div>
                ), delay: 2000
            }
        ];

        const timeouts: NodeJS.Timeout[] = [];
        const runSequence = () => {
            setMessages([]);
            let currentTime = 0;
            sequence.forEach(({ type, text, delay }) => {
                currentTime += delay;
                timeouts.push(setTimeout(() => {
                    setMessages(prev => [...prev, { type: type as 'user' | 'bot', text }]);
                }, currentTime));
            });
            timeouts.push(setTimeout(runSequence, currentTime + 8000));
        };
        runSequence();
        return () => timeouts.forEach(clearTimeout);
    }, []);

    // Mobile: scaled down (0.85), Desktop: full scale (1)
    return (
        <div className="relative mx-auto w-[280px] sm:w-[300px] h-[550px] sm:h-[600px] transform scale-[0.75] min-[375px]:scale-[0.85] sm:scale-100 origin-top sm:origin-center">
            {/* iPhone 15 Pro Frame - Silver / Natural Titanium */}
            <div className="relative h-full w-full bg-[#d0d1d6] rounded-[55px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3),inset_0_0_2px_1px_rgba(255,255,255,0.7)] ring-4 ring-[#b4b5b9]/50 border-[6px] border-[#e3e3e5]">

                {/* Dynamic Island */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-[100px] h-[28px] bg-foreground rounded-full z-20 transition-all duration-300"></div>

                {/* Screen Content */}
                <div className="absolute top-0 left-0 w-full h-full rounded-[50px] overflow-hidden bg-[#EFE7DD] flex flex-col">

                    {/* Header - Light Mode */}
                    <div className="bg-[#F0F2F5]/90 backdrop-blur-md px-4 pt-12 pb-3 flex items-center gap-3 shadow-sm z-10 border-b border-border">
                        <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center overflow-hidden border border-border">
                            <img src={logoSaldin} alt="Saldin Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="leading-relaxed text-foreground text-sm font-semibold">Saldin</p>
                            <p className="leading-relaxed text-emerald-600 text-[10px] font-medium">Online</p>
                        </div>
                    </div>

                    {/* Chat Area - WhatsApp Light BG */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat relative">

                        <div className="relative z-10 flex flex-col gap-3">
                            <p className="text-center text-[10px] text-gray-500 my-2 bg-background/80 backdrop-blur-sm inline-block px-3 py-1 rounded-full mx-auto w-fit shadow-sm border border-border">Hoje</p>

                            <AnimatePresence>
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[90%] rounded-2xl p-2.5 text-sm leading-relaxed shadow-sm ${msg.type === 'user'
                                            ? 'bg-[#D9FDD3] text-gray-900 rounded-tr-sm' // Light Green (WhatsApp Sent)
                                            : 'bg-background text-gray-900 rounded-tl-sm' // White (WhatsApp Received)
                                            }`}>
                                            {msg.text}
                                            <div className={`text-[9px] text-right mt-1 ${msg.type === 'user' ? 'text-emerald-700/60' : 'text-gray-400'}`}>
                                                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                {msg.type === 'user' && <span className="ml-1 text-blue-400">✓✓</span>}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Input Area - Light */}
                    <div className="bg-[#F0F2F5] px-3 py-2 pb-6 flex items-center gap-2 border-t border-border">
                        <div className="w-7 h-7 rounded-full text-blue-500 flex items-center justify-center font-light text-2xl pb-1">
                            +
                        </div>
                        <div className="flex-1 h-9 bg-background rounded-full px-3 flex items-center text-gray-400 text-sm leading-relaxed border border-border shadow-sm">
                            Mensagem
                        </div>
                        <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                            <Send className="w-4 h-4 text-white ml-0.5" />
                        </div>
                    </div>
                </div>

                {/* Buttons (Side) - Light Color */}
                <div className="absolute top-28 -left-[2px] w-[3px] h-8 bg-gray-400 rounded-l-md"></div>
                <div className="absolute top-44 -left-[2px] w-[3px] h-14 bg-gray-400 rounded-l-md"></div>
                <div className="absolute top-60 -left-[2px] w-[3px] h-14 bg-gray-400 rounded-l-md"></div>
                <div className="absolute top-48 -right-[2px] w-[3px] h-20 bg-gray-400 rounded-r-md"></div>
            </div>
        </div>
    );
}

// ─── Device Showcase Component (High Fidelity Mockup) ───
function DeviceShowcase({ className = "" }: { className?: string }) {
    return (
        <div className={`relative w-full flex items-center justify-center py-6 sm:py-10 ${className}`}>
            {/* Main Mockup Image */}
            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="relative z-30 animate-float" /* Added floating animation class */
            >
                <img
                    src="/mockup-showcase.png"
                    alt="Saldin App Showcase"
                    className="w-full h-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.15)] max-w-4xl"
                />

                {/* Floating highlight elements for depth */}
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-10 -right-5 w-24 h-24 bg-orange-100/50 rounded-full blur-2xl -z-10"
                />
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -bottom-10 -left-5 w-32 h-32 bg-blue-100/40 rounded-full blur-2xl -z-10"
                />
            </motion.div>
        </div>
    );
}

// ─── Calculation Demo Component ───
function CalculationDemo() {
    const [income, setIncome] = useState(5000);
    const [fixed, setFixed] = useState(2000);
    const [installments, setInstallments] = useState(800);

    // Auto-animate values on mount for visual effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setIncome(5500);
            setFixed(2100);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const trueBalance = income - fixed - installments;
    const percent = Math.max(0, Math.min(100, (trueBalance / income) * 100));

    return (
        <div className="bg-background/90 backdrop-blur-xl border border-border p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-lg w-full mx-auto">
            <h3 className="text-xl font-bold mb-6 text-center text-gray-900">Descubra seu Saldo Livre</h3>

            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm leading-relaxed">
                        <label className="text-gray-500">Renda Líquida</label>
                        <span className="font-semibold text-gray-900">R$ {income.toLocaleString()}</span>
                    </div>
                    <input
                        type="range" min={2000} max={10000} step={100}
                        value={income} onChange={(e) => setIncome(Number(e.target.value))}
                        className="w-full accent-primary h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm leading-relaxed">
                        <label className="text-gray-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-impulse/80" /> Contas Fixas</label>
                        <span className="font-semibold text-impulse">R$ {fixed.toLocaleString()}</span>
                    </div>
                    <input
                        type="range" min={500} max={4000} step={50}
                        value={fixed} onChange={(e) => setFixed(Number(e.target.value))}
                        className="w-full accent-impulse h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm leading-relaxed">
                        <label className="text-gray-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-obligation" /> Parcelas Futuras</label>
                        <span className="font-semibold text-obligation">R$ {installments.toLocaleString()}</span>
                    </div>
                    <input
                        type="range" min={0} max={3000} step={50}
                        value={installments} onChange={(e) => setInstallments(Number(e.target.value))}
                        className="w-full accent-obligation h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-dashed border-border">
                <div className="text-center mb-2">
                    <p className="text-sm leading-relaxed font-medium text-gray-400 uppercase tracking-wider">Saldo Livre de Verdade™</p>
                </div>
                <div className="flex justify-center items-center gap-2 mb-2">
                    <motion.span
                        key={trueBalance}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500"
                    >
                        R$ {trueBalance.toLocaleString()}
                    </motion.span>
                </div>
                <div className="flex justify-center">
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                        <motion.div
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ type: "spring", stiffness: 50 }}
                        />
                    </div>
                </div>
                <p className="text-center text-xs text-gray-400 mt-3">
                    Isso é o que REALMENTE sobra. Sem sustos.
                </p>
            </div>
        </div>
    );
}

// ─── Feature Showcase Data ───
const SHOWCASE_FEATURES = [
    {
        id: "texto",
        icon: FileText,
        tag: "Texto",
        tagBg: "bg-emerald-100",
        tagText: "text-emerald-700",
        activeBorder: "border-emerald-400",
        activeBg: "bg-emerald-50",
        activeAccent: "bg-emerald-400",
        title: "Mande uma mensagem de texto",
        subtitle: "Do jeito que você fala",
        desc: "\"Gastei 45 no almoço no cartão Inter em 2x.\" A IA entende, categoriza e registra. Sem menu, sem formulário.",
        videoSrc: "/videos/feature-texto.mp4",
        hint: "Ex: \"paguei 89 de mercado no débito\"",
    },
    {
        id: "audio",
        icon: Mic,
        tag: "\u00c1udio",
        tagBg: "bg-orange-100",
        tagText: "text-orange-700",
        activeBorder: "border-orange-400",
        activeBg: "bg-orange-50",
        activeAccent: "bg-orange-400",
        title: "Grave um áudio de 5 segundos",
        subtitle: "Enquanto dirige, caminha ou come",
        desc: "Fale o gasto ao sair da loja. A IA transcreve, interpreta e já lança com valor, cartão e categoria certa.",
        videoSrc: "/videos/feature-audio.mp4",
        hint: "Funciona mesmo com ruído de fundo",
    },
    {
        id: "imagem",
        icon: Camera,
        tag: "Imagem",
        tagBg: "bg-blue-100",
        tagText: "text-blue-700",
        activeBorder: "border-blue-400",
        activeBg: "bg-blue-50",
        activeAccent: "bg-blue-400",
        title: "Bata foto do cupom ou boleto",
        subtitle: "IA lê e registra automaticamente",
        desc: "Mande a foto da nota fiscal, cupom ou boleto. O Saldin extrai valor, estabelecimento e data — você não digita nada.",
        videoSrc: "/videos/feature-imagem.mp4",
        hint: "Funciona com boletos, NFe e cupons",
    },
];

// ─── Feature Showcase Component ───
function FeatureShowcase() {
    const [active, setActive] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoLoaded, setVideoLoaded] = useState(false);

    const feature = SHOWCASE_FEATURES[active];

    useEffect(() => {
        setVideoLoaded(false);
        if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().catch(() => {});
        }
    }, [active]);

    return (
        <Section id="como-funciona" className="py-16 sm:py-24 px-4 bg-white border-b border-border">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 sm:mb-16">
                    <span className="text-sm font-bold uppercase tracking-widest text-primary">Como Funciona</span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-4 text-gray-900">
                        3 formas de registrar.
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
                            Todas em menos de 5 segundos.
                        </span>
                    </h2>
                    <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
                        Sem abrir app. Sem fazer login. Só mande uma mensagem no WhatsApp que você já tem.
                    </p>
                </div>

                {/* Content */}
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">

                    {/* Left: Feature tabs */}
                    <div className="flex flex-col gap-3 sm:gap-4 order-2 lg:order-1">
                        {SHOWCASE_FEATURES.map((f, i) => (
                            <motion.button
                                key={f.id}
                                onClick={() => setActive(i)}
                                whileHover={{ x: active === i ? 0 : 4 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className={`w-full text-left p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300 ${
                                    active === i
                                        ? `${f.activeBorder} ${f.activeBg} shadow-md`
                                        : "border-border bg-background hover:border-gray-300 hover:shadow-sm"
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                        active === i ? `${f.tagBg} ${f.tagText}` : "bg-gray-100 text-gray-500"
                                    }`}>
                                        <f.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                active === i ? `${f.tagBg} ${f.tagText}` : "bg-gray-100 text-gray-500"
                                            }`}>{f.tag}</span>
                                            {active === i && (
                                                <span className="text-[10px] text-gray-400 font-medium">{f.hint}</span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-base mb-0.5">{f.title}</h3>
                                        <p className="text-xs text-gray-500 font-medium mb-2">{f.subtitle}</p>
                                        <AnimatePresence mode="wait">
                                            {active === i && (
                                                <motion.p
                                                    key={f.id}
                                                    initial={{ opacity: 0, y: -6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -6 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="text-sm text-gray-600 leading-relaxed"
                                                >
                                                    {f.desc}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className={`shrink-0 w-2 h-2 rounded-full mt-2 transition-all ${
                                        active === i ? `${f.activeAccent}` : "bg-gray-200"
                                    }`} />
                                </div>
                            </motion.button>
                        ))}

                        {/* Bottom CTA */}
                        <p className="text-xs text-center text-gray-400 pt-2">
                            💡 Todas as formas funcionam juntas. Use a que for mais fácil no momento.
                        </p>
                    </div>

                    {/* Right: Video Mockup */}
                    <div className="order-1 lg:order-2 flex justify-center items-center py-4">
                        <div className="relative">
                            <video
                                autoPlay
                                muted
                                loop
                                playsInline



                                className="w-[320px] sm:w-[420px] lg:w-[500px] xl:w-[540px] select-none pointer-events-none block"

                            >
                                <source src="/mockup - maior 2.mp4" type="video/mp4" />
                            </video>

                            {/* Floating badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white rounded-full px-4 py-2 shadow-lg border border-border flex items-center gap-2"
                            >
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-xs font-bold text-gray-700">via WhatsApp</span>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </Section>
    );
}

// ─── Countdown Timer Component (real deadline: next Sunday at midnight) ───
function CountdownTimer() {
    const getTimeLeft = () => {
        const now = new Date();
        const target = new Date();
        // Next Sunday 23:59
        const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
        target.setDate(now.getDate() + daysUntilSunday);
        target.setHours(23, 59, 0, 0);
        return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
    };

    const [timeLeft, setTimeLeft] = useState(getTimeLeft);

    useEffect(() => {
        const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
        return () => clearInterval(interval);
    }, []);

    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    return (
        <span className="font-mono font-bold text-orange-200">
            {days > 0 && <>{String(days).padStart(2, '0')}d </>}
            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
    );
}

// ─── Marquee Component ───
const MARQUEE_ITEMS = [
    { icon: Star, text: "#1 em Controle Financeiro via WhatsApp", color: "text-yellow-500 fill-current" },
    { icon: Users, text: "+1.200 famílias com clareza financeira", color: "text-blue-500" },
    { icon: Shield, text: "Sem acesso ao banco — 100% privado", color: "text-green-500" },
    { icon: Zap, text: "Registro de gasto em 5 segundos", color: "text-orange-500" },
    { icon: Smartphone, text: "Funciona no WhatsApp que você já tem", color: "text-teal-500" },
    { icon: ThumbsUp, text: "Garantia de 7 dias ou seu dinheiro de volta", color: "text-emerald-400" },
];

function Marquee() {
    return (
        <div className="bg-gray-900 overflow-hidden py-3 border-y border-border flex relative z-40">
            <motion.div
                className="flex items-center gap-12 shrink-0 pr-12"
                animate={{ x: "-100%" }}
                transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: 30, // 30s for a full cycle (smooth & readable)
                }}
            >
                {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
                    <span key={i} className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm leading-relaxed font-bold uppercase tracking-widest whitespace-nowrap">
                        <item.icon className={`w-4 h-4 ${item.color}`} /> {item.text}
                    </span>
                ))}
            </motion.div>

            <motion.div
                className="flex items-center gap-12 shrink-0 pr-12"
                animate={{ x: "-100%" }}
                transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: 30,
                }}
            >
                {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
                    <span key={i} className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm leading-relaxed font-bold uppercase tracking-widest whitespace-nowrap">
                        <item.icon className={`w-4 h-4 ${item.color}`} /> {item.text}
                    </span>
                ))}
            </motion.div>
        </div>
    );
}

// ─── Sale Notification Component ───
function SaleNotification() {
    const [visible, setVisible] = useState(false);
    const [data, setData] = useState({ name: "", time: "" });

    const names = ["Ricardo M.", "Ana Paula", "Carlos E.", "Fernanda S.", "João P."];
    const cities = ["São Paulo", "Rio de Janeiro", "Curitiba", "Belo Horizonte", "Brasília"];

    useEffect(() => {
        const show = () => {
            const randomName = names[Math.floor(Math.random() * names.length)];
            const randomCity = cities[Math.floor(Math.random() * cities.length)];
            const randomTime = Math.floor(Math.random() * 59) + 1;
            setData({ name: `${randomName} de ${randomCity}`, time: `${randomTime} min atrás` });
            setVisible(true);
            setTimeout(() => setVisible(false), 5000);
        };

        const interval = setInterval(show, 15000 + Math.random() * 10000);
        setTimeout(show, 5000); // First show
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, x: -50, y: 20 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: -50, y: 20 }}
                    className="fixed bottom-4 left-4 z-50 bg-background border border-border shadow-xl rounded-xl p-3 flex items-center gap-3 max-w-[300px]"
                >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-900">{data.name}</p>
                        <p className="text-[10px] text-gray-500">acabou de assinar o plano <span className="text-orange-500 font-bold">Semestral</span></p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Há {data.time}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── Lite Video Component (Zero Weight Initial Load) ───
function LiteVideo({
    videoId,
    videoSrc,
    thumbnail,
    title,
    className = ""
}: {
    videoId?: string;
    videoSrc?: string;
    thumbnail: string;
    title?: string;
    className?: string;
}) {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <div
            onClick={() => setIsPlaying(true)}
            className={`relative w-full aspect-video bg-foreground/10 rounded-2xl overflow-hidden shadow-xl border border-border group cursor-pointer ${className}`}
        >
            {!isPlaying ? (
                <>
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-background/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-500 rounded-full flex items-center justify-center shadow-lg relative pl-1">
                                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-current" />
                            </div>
                        </div>
                    </div>
                    {title && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4 sm:p-6 z-[5]">
                            <p className="leading-relaxed text-white font-bold text-base sm:text-xl md:text-2xl drop-shadow-md">
                                {title}
                            </p>
                        </div>
                    )}
                    <img
                        src={thumbnail}
                        alt="Video Thumbnail"
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                    />
                </>
            ) : (
                videoSrc ? (
                    <video
                        src={videoSrc}
                        autoPlay
                        controls
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                )
            )}
        </div>
    );
}

// ─── VSL (Video Sales Letter) ───
function VSL() {
    return (
        <LiteVideo
            videoSrc="/vsl - Saldin.mp4"
            thumbnail="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000"
            title="Descubra como sobrar dinheiro todo mês (sem planilhas)"
        />
    );
}

// ─── Main Headline ───
const mainHeadline = "O jeito mais rápido de registrar gastos e o único que te tira das dívidas de verdade.";

// ─── Testimonials (WhatsApp print style) ───
const testimonials = [
    { initials: "C", name: "Camila", role: "Professora · SP", color: "bg-orange-500", text: "Vi R\$2.000 no banco e achei que tava bem. O Saldin me mostrou que R\$1.700 já tinham dono. Chocou mas foi necessário.", time: "09:14" },
    { initials: "L", name: "Lucas", role: "Freela de Design · RJ", color: "bg-blue-500", text: "Renda variável sempre foi um caos. Agora sei exatamente quanto posso gastar antes de comprometer o mês. Parece mágica.", time: "11:32" },
    { initials: "A", name: "Ana", role: "Médica · MG", color: "bg-emerald-500", text: "Planilha eu largava no 3º dia. O Saldin mando áudio e pronto. Nunca foi tão fácil ter controle sem esforço nenhum.", time: "14:07" },
    { initials: "R", name: "Roberto", role: "Engenheiro · RS", color: "bg-violet-500", text: "O Plano de Guerra das Dívidas me deu a data exata que eu zero tudo. Faltam 7 meses. Pela primeira vez tenho esperança.", time: "19:55" },
];
// ─── FAQ ───
const faqs = [
    { q: "Preciso conectar meu banco?", a: "Não! O Saldin acredita na privacidade total. Você não conecta contas bancárias. Tudo é registrado via WhatsApp (áudio, texto, foto) ou manualmente, garantindo que seus dados bancários fiquem protegidos." },
    { q: "Funciona para quem ganha pouco?", a: "Sim! Na verdade, quem tem orçamento mais apertado é quem mais se beneficia da clareza do Saldo Livre para não entrar em dívidas." },
    { q: "É seguro mandar dados no WhatsApp?", a: "Absolutamente. O Saldin usa criptografia de ponta a ponta e processa as mensagens apenas para extrair os dados financeiros. Não pedimos senhas, CPF ou dados sensíveis." },
    { q: "Posso cancelar quando quiser?", a: "Sim. Sem fidelidade, sem letras miúdas. Você gerencia sua assinatura direto no painel com um clique." },
    { q: "O WhatsApp é um robô ou humano?", a: "É uma Inteligência Artificial avançada, treinada para entender linguagem natural. Você fala como falaria com um amigo e ela entende." },
];

// ─── Feature Block Component ───
function FeatureBlock({
    title, subtitle, icon: Icon, desc, mockup, reverse = false, bg = "bg-background",
    id, onCta
}: {
    title: string; subtitle: string; icon: any; desc: string; mockup: React.ReactNode;
    reverse?: boolean; bg?: string; id?: string; onCta: () => void
}) {
    return (
        <Section id={id} className={`py-16 sm:py-24 ${bg} border-b border-border last:border-0 relative overflow-hidden`}>
            {/* Background decorative elements */}
            <div className={`absolute top-0 ${reverse ? 'left-0' : 'right-0'} w-96 h-96 bg-orange-100/30 rounded-full blur-[100px] -translate-y-1/2 ${reverse ? '-translate-x-1/2' : 'translate-x-1/2'} opacity-50`} />

            <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: reverse ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className={`flex flex-col gap-6 ${reverse ? 'lg:order-2' : ''}`}
                >
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-orange-100 flex items-center justify-center">
                        <Icon className="w-8 h-8 text-orange-600" />
                    </div>
                    <div>
                        <span className="text-orange-600 font-bold uppercase tracking-widest text-[10px] sm:text-xs leading-relaxed mb-3 block">{subtitle}</span>
                        <h3 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">{title}</h3>
                        <p className="text-gray-500 text-lg sm:text-xl leading-relaxed max-w-xl">{desc}</p>
                    </div>
                    <Button
                        size="lg"
                        className="gradient-warm text-white rounded-full px-10 h-14 text-lg font-bold shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transform hover:scale-105 transition-all w-full sm:w-fit mt-4"
                        onClick={onCta}
                    >
                        Quero esse controle
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: reverse ? -50 : 50 }}
                    whileInView={{ opacity: 1, scale: 1, x: 0 }}
                    viewport={{ once: true }}
                    className={`relative ${reverse ? 'lg:order-1' : ''} flex justify-center w-full`}
                >
                    {mockup}
                </motion.div>
            </div>
        </Section>
    );
}

// ─── Comparison Table Component ───
function ComparisonTable() {
    const rows = [
        { c: "Esforço Diário", b: "Alto (Categorizar)", p: "Infinito (Manual)", s: "Zero (Só falar)" },
        { c: "Tempo Gasto", b: "15 min/dia", p: "1 hora/semana", s: "5 seg/transação" },
        { c: "Visão de Futuro", b: "Não (Só passado)", p: "Só se configurar", s: "Sim (Saldo Livre)" },
        { c: "Interface", b: "App Pesado", p: "Complexa", s: "WhatsApp" }
    ];

    return (
        <Section className="py-10 sm:py-24 bg-background border-b border-border">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-10 sm:mb-16">
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Por que o Saldin vence?</h2>
                    <p className="text-gray-500 text-sm sm:text-base">A evolução natural do controle financeiro pessoal.</p>
                </div>

                {/* Desktop view: Classic Table */}
                <div className="hidden sm:block overflow-x-auto pb-4 pt-6">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr>
                                <th className="p-4 text-gray-400 font-medium text-sm leading-relaxed w-1/4"></th>
                                <th className="p-4 text-center text-gray-400 font-medium text-sm leading-relaxed w-1/4">Apps de Banco</th>
                                <th className="p-4 text-center text-gray-400 font-medium text-sm leading-relaxed w-1/4">Planilhas</th>
                                <th className="p-4 text-center text-orange-600 font-bold text-lg leading-relaxed bg-orange-50 rounded-t-xl border-t border-x border-orange-100 w-1/4 relative">
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm">Melhor Escolha</span>
                                    Saldin
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-sm leading-relaxed sm:text-base">
                            {rows.map((row, i) => (
                                <tr key={i} className="border-b border-gray-50">
                                    <td className="p-4 font-bold text-gray-700">{row.c}</td>
                                    <td className="p-4 text-center text-gray-500">{row.b}</td>
                                    <td className="p-4 text-center text-gray-500">{row.p}</td>
                                    <td className={`p-4 text-center font-bold text-gray-900 bg-orange-50 border-x border-orange-100 ${i === rows.length - 1 ? 'rounded-b-xl border-b' : ''}`}>
                                        {row.s}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile view: Stacked vertical comparison */}
                <div className="sm:hidden space-y-6">
                    {rows.map((row, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-border">
                                <h3 className="font-bold text-gray-900 text-sm">{row.c}</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">Outros (Apps/Planilhas)</span>
                                    <span className="text-gray-500 line-through decoration-red-400/40">{row.b}</span>
                                </div>
                                <div className="flex justify-between items-center bg-orange-50/50 p-3 rounded-xl ring-1 ring-orange-100">
                                    <span className="font-bold text-orange-900 text-sm">O Saldin</span>
                                    <div className="flex items-center gap-1.5 font-bold text-orange-600 text-sm">
                                        <Check className="w-4 h-4" />
                                        <span>{row.s}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Section>
    );
}

// ─── Security Section Component ───
function SecuritySection() {
    return (
    <Section className="py-16 sm:py-24 bg-background border-t border-b border-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-20"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6 border border-emerald-100">
                <Lock className="w-3 h-3" /> Blindagem de Dados
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Sua privacidade é nossa obsessão.
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto mb-12 text-base sm:text-lg leading-relaxed">
                Nós não vendemos seus dados. Nós não treinamos IA com suas informações pessoais. O que é seu, fica com você.
            </p>

            <div className="grid sm:grid-cols-3 gap-8 text-left sm:text-center">
                <div className="flex sm:flex-col items-center gap-4 sm:gap-2">
                    <div className="shrink-0 w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-0 sm:mb-4 text-emerald-600 border border-emerald-100">
                        <Shield className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 mb-1">Criptografia Militar</h3>
                        <p className="text-sm leading-relaxed text-gray-500 leading-relaxed">Seus dados são embaralhados de ponta a ponta. Nem nossa equipe consegue ler.</p>
                    </div>
                </div>
                <div className="flex sm:flex-col items-center gap-4 sm:gap-2">
                    <div className="shrink-0 w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-0 sm:mb-4 text-blue-600 border border-blue-100">
                        <EyeOff className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 mb-1">Sem Conexão Bancária</h3>
                        <p className="text-sm leading-relaxed text-gray-500 leading-relaxed">Nunca pediremos sua senha do banco. O Saldin funciona sem risco de vazamentos.</p>
                    </div>
                </div>
                <div className="flex sm:flex-col items-center gap-4 sm:gap-2">
                    <div className="shrink-0 w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-0 sm:mb-4 text-teal-600 border border-teal-100">
                        <UserCheck className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 mb-1">Dados Anônimos</h3>
                        <p className="text-sm leading-relaxed text-gray-500 leading-relaxed">Para nossa IA, você é apenas um código. Sua identidade real é preservada.</p>
                    </div>
                </div>
            </div>
        </div>
    </Section>
    );
}

function Landing() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen forced-light font-sans selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
            <StickyCtaBar onCta={() => navigate("/auth")} />
            {/* ─── URGENCY NOTICE BAR ─── */}
            <div className="bg-gray-950 text-white py-2.5 px-4 text-center text-xs sm:text-sm leading-relaxed font-semibold relative overflow-hidden z-[60]">
                <p className="flex flex-wrap items-center justify-center gap-2 relative z-10">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                    <span className="text-gray-300">Lançamento:</span>
                    <span className="text-white font-bold">4 dias grátis + Bônus no plano Semestral</span>
                    <span className="hidden sm:inline-block w-1 h-1 bg-white/20 rounded-full mx-1"></span>
                    <span className="text-orange-400 text-[10px] uppercase tracking-wide">Oferta encerra em:</span>
                    <CountdownTimer />
                </p>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_4s_infinite]" />
            </div>

            {/* ─── NAVBAR ─── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
                    <img src={logoSaldin} alt="Saldin" className="h-7 md:h-10 w-auto object-contain" />

                    <div className="hidden md:flex items-center gap-8 text-sm leading-relaxed font-medium text-gray-600">
                        <button onClick={() => scrollTo("problema")} className="hover:text-primary transition-colors">O Problema</button>
                        <button onClick={() => scrollTo("funcionalidades")} className="hover:text-primary transition-colors">Funcionalidades</button>
                        <button onClick={() => scrollTo("pricing")} className="hover:text-primary transition-colors">Planos</button>
                        <button onClick={() => scrollTo("faq")} className="hover:text-primary transition-colors">FAQ</button>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        <Button variant="ghost" className="hidden md:inline-flex text-gray-700 hover:text-gray-900" onClick={() => navigate("/auth")}>
                            Entrar
                        </Button>
                        <Button onClick={() => navigate("/auth")} className="gradient-warm text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transform hover:-translate-y-0.5 transition-all duration-300 rounded-full px-5 h-9 text-sm leading-relaxed md:h-10 md:px-6 md:text-base">
                            Começar
                        </Button>
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden border-t border-border bg-background px-4 pb-6 shadow-xl"
                        >
                            <div className="flex flex-col gap-4 pt-4 text-base font-medium">
                                <button onClick={() => scrollTo("problema")} className="text-left py-2 text-gray-600 border-b border-border">O Problema</button>
                                <button onClick={() => scrollTo("funcionalidades")} className="text-left py-2 text-gray-600 border-b border-border">Funcionalidades</button>
                                <button onClick={() => scrollTo("depoimentos")} className="text-left py-2 text-gray-600 border-b border-border">Depoimentos</button>
                                <button onClick={() => scrollTo("faq")} className="text-left py-2 text-gray-600 border-b border-border">FAQ</button>
                                <button onClick={() => navigate("/auth")} className="text-left py-2 text-primary font-bold">Entrar na minha conta</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* ─── HERO SECTION ─── */}
            <section className="pt-24 pb-16 lg:pt-48 lg:pb-32 px-4 relative overflow-hidden bg-background">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-50/60 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-70 sm:opacity-100" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/40 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 opacity-70 sm:opacity-100" />

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-20 items-center relative z-10">
                    {/* Left: Text */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="max-w-[100vw] leading-relaxed text-center lg:text-left pt-6 sm:pt-0"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs sm:text-sm leading-relaxed font-bold mb-6 border border-orange-200">
                            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                            Registro de gastos em 5 segundos · via WhatsApp
                        </div>

                        <div className="leading-relaxed mb-4 sm:mb-6">
                            <h1 className="text-[1.85rem] min-[375px]:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-gray-900 px-1 sm:px-0">
                                Seu banco mostra R$ 2.000.
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-600 to-pink-500">
                                    R$ 1.700 já sumiram.
                                </span>
                            </h1>
                        </div>

                        <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 mb-8 sm:mb-10 leading-relaxed px-4 lg:px-0">
                            O Saldin calcula seu <strong className="text-gray-900">Saldo Livre de Verdade™</strong> — o que sobra depois das parcelas futuras, contas fixas e dívidas. Tudo via WhatsApp. Sem planilha. Sem app novo.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start px-8 sm:px-0">
                            <Button
                                size="lg"
                                onClick={() => navigate("/auth")}
                                className="gradient-warm text-white border-0 h-12 sm:h-14 px-8 text-base sm:text-lg font-bold rounded-full shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transition-all w-full sm:w-auto"
                            >
                                Quero ver meu Saldo Livre
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                            <div className="flex flex-col items-center sm:items-start justify-center">
                                <div className="flex -space-x-2 mb-1">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className={`w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[9px] font-bold text-white ${["bg-orange-400","bg-blue-400","bg-emerald-400","bg-pink-400"][i-1]}`}>{["C","L","A","R"][i-1]}</div>
                                    ))}
                                    <div className="w-6 h-6 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-orange-600">+1k</div>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-500 font-medium">+1.200 famílias já têm clareza</p>
                            </div>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => scrollTo("mecanismo")}
                                className="h-12 sm:h-14 px-8 text-base sm:text-lg rounded-full border-2 bg-background text-gray-700 hover:bg-gray-50 w-full sm:w-auto hidden sm:flex"
                            >
                                <Play className="w-4 h-4 ml-2 mr-2 fill-current" />
                                Ver como funciona
                            </Button>
                        </div>

                        <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-xs sm:text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-emerald-500" /> Sem acesso ao banco</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-500" /> 4 dias grátis</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="flex items-center gap-1"><Lock className="w-4 h-4 text-emerald-500" /> Cancele quando quiser</span>
                        </div>
                    </motion.div>

                    {/* Right: Device Showcase (Phone + Laptop + Tablet) */}
                    <div className="flex justify-center items-center relative mt-12 lg:mt-0 w-full">
                        {/* Decorative background glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-200/30 to-pink-300/30 rounded-full blur-3xl transform scale-125 -z-10" />
                        <DeviceShowcase className="animate-float" />
                    </div>
                </div>

                {/* VSL Section - Inserting right after Hero intro for maximum retention */}
                <div className="max-w-4xl mx-auto mt-8 sm:mt-10 mb-10 px-4 relative z-20">
                    <div className="max-w-[100vw] leading-relaxed text-center mb-6">
                        <span className="inline-block py-1 px-3 rounded-full bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider mb-2 animate-pulse">
                            ⚠️ Assista antes que saia do ar
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            A verdade que os bancos não querem que você saiba sobre seu saldo.
                        </h2>
                    </div>
                    <VSL />
                    <div className="mt-8 text-center">
                        <Button
                            size="lg"
                            onClick={() => navigate("/auth")}
                            className="min-h-[3.5rem] h-auto py-3 sm:py-0 sm:h-16 px-6 sm:px-12 rounded-full text-base sm:text-lg md:text-xl font-bold gradient-warm text-white shadow-xl shadow-orange-500/30 hover:scale-105 hover:shadow-orange-500/50 transition-all w-full sm:w-auto"
                        >
                            <span className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
                                Quero meu Saldo Livre <span className="hidden sm:inline">—</span><span className="sm:hidden">-</span> Começar Grátis
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                            </span>
                        </Button>
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Compra 100% segura</span>
                            <span>·</span>
                            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Garantia de 7 dias</span>
                            <span>·</span>
                            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-orange-400" /> Acesso em menos de 1 minuto</span>
                        </div>
                    </div>
                </div>
            </section>

            <Marquee />

            {/* ─── WHO IS THIS FOR? (real quotes) ─── */}
            <Section id="quem-e" className="py-16 sm:py-24 bg-gray-50 border-y border-border overflow-hidden">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12 sm:mb-16">
                        <span className="text-sm font-bold uppercase tracking-widest text-primary">Você se reconhece?</span>
                        <h2 className="text-3xl sm:text-4xl font-bold mt-4 mb-3 text-gray-900">
                            Se você já falou alguma dessas frases,
                            <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500"> o Saldin é para você.</span>
                        </h2>
                    </div>

                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
                        {[
                            { quote: "Abri o app do banco, vi R$1.200. Aí lembrei que sai a fatura amanhã. Deve sobrar nada.", tag: "Assalariado", accent: "border-l-orange-400", tagColor: "bg-orange-100 text-orange-700" },
                            { quote: "Sou freela. Esse mês entrou bem, mas semana que vem não sei. Fico com medo de gastar qualquer coisa.", tag: "Freelancer", accent: "border-l-blue-400", tagColor: "bg-blue-100 text-blue-700" },
                            { quote: "Toda segunda-feira boto tudo na planilha. Até quarta já larguei.", tag: "Planilheiro frustrado", accent: "border-l-gray-400", tagColor: "bg-gray-100 text-gray-600" },
                            { quote: "Meu marido não sabe quanto a gente gasta. Eu também não. A gente só descobre quando o cartão recusa.", tag: "Casal", accent: "border-l-pink-400", tagColor: "bg-pink-100 text-pink-700" },
                            { quote: "Sei lá quanto devo ao total. Tem cartão, tem carnê, tem uma coisa financiada... não consigo ver tudo junto.", tag: "Endividado", accent: "border-l-red-400", tagColor: "bg-red-100 text-red-700" },
                            { quote: "Recebo dia 5. Dia 12 já tô no limite. Não é falta de dinheiro — é falta de controle.", tag: "Fim de mês difícil", accent: "border-l-emerald-400", tagColor: "bg-emerald-100 text-emerald-700" },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08, duration: 0.5 }}
                                className={`break-inside-avoid mb-4 bg-white rounded-2xl p-6 border-l-4 ${item.accent} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
                            >
                                <span className="text-5xl text-gray-100 font-serif leading-none select-none block -mb-2">&ldquo;</span>
                                <p className="text-gray-800 font-medium text-base leading-relaxed mb-4">{item.quote}</p>
                                <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full ${item.tagColor}`}>{item.tag}</span>
                            </motion.div>
                        ))}
                    </div>

                    <p className="text-center text-gray-400 text-sm mt-10">Se uma dessas frases te descreveu — você está no lugar certo. 👇</p>
                </div>
            </Section>
            {/* ─── PROBLEM SECTION ─── */}
            <Section id="problema" className="py-16 sm:py-24 px-4 bg-background">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12 sm:mb-16">
                        <span className="text-sm font-bold uppercase tracking-widest text-impulse">O Ciclo da Frustração</span>
                        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-6 text-gray-900">
                            Por que você sente que o dinheiro some antes do dia 15?
                        </h2>
                        <p className="text-lg leading-relaxed sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                            O app do banco foi feito para você gastar. O Saldin foi feito para você Prosperar — mostrando o que REALMENTE sobra.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
                        {[
                            {
                                icon: EyeOff,
                                title: "O Saldo Falso",
                                desc: "O banco mostra R$ 2.000 na conta, mas não avisa que R$ 1.500 já estão comprometidos com contas e cartões.",
                                color: "text-orange-500",
                                bg: "bg-orange-50"
                            },
                            {
                                icon: Target,
                                title: "Parcelas Fantasmas",
                                desc: "Aquelas comprinhas parceladas 'pequenas' se somam e comem 40% da sua renda antes mesmo do salário cair.",
                                color: "text-red-500",
                                bg: "bg-red-50"
                            },
                            {
                                icon: AlertTriangle,
                                title: " Cegueira Financeira",
                                desc: "Sem clareza, você gasta por impulso. Quando a fatura chega, o susto é inevitável e o ciclo se repete.",
                                color: "text-yellow-500",
                                bg: "bg-yellow-50"
                            },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group p-6 sm:p-8 rounded-3xl bg-background border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${item.color}`} />
                                </div>
                                <h3 className="font-serif text-xl sm:text-2xl font-bold mb-3 text-gray-900">{item.title}</h3>
                                <p className="text-gray-500 leading-relaxed text-sm leading-relaxed sm:text-base">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>


            {/* ─── SOLUTION / MECHANISM SECTION ─── */}
            <Section id="mecanismo" className="py-10 sm:py-16 px-4 bg-gray-50/50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
                    <div>
                        <span className="max-w-[100vw] leading-relaxed text-sm leading-relaxed font-bold uppercase tracking-widest text-primary">O Mecanismo Saldin</span>
                        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-6 leading-tight text-gray-900">
                            A única métrica que importa: <br />
                            <span className="max-w-[100vw] leading-relaxed text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Saldo Livre de Verdade™</span>
                        </h2>
                        <p className="max-w-[100vw] leading-relaxed text-lg leading-relaxed sm:text-xl text-gray-500 mb-8 leading-relaxed">
                            Esqueça gráficos complexos. O Saldin calcula instantaneamente quanto você pode gastar hoje sem comprometer suas contas, parcelas e dívidas futuras.
                        </p>

                        <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                            {[
                                "Conexão direta com a realidade do seu bolso",
                                "Considera parcelas dos próximos meses",
                                "Atualizado em tempo real via WhatsApp",
                                "Previsibilidade total do mês"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <span className="font-medium text-gray-700 text-sm leading-relaxed sm:text-base">{item}</span>
                                </li>
                            ))}
                        </ul>

                        <Button
                            className="gradient-warm text-white px-8 h-12 rounded-full shadow-lg w-full sm:w-auto"
                            onClick={() => navigate("/auth")}
                        >
                            Quero ter essa clareza
                        </Button>
                    </div>

                    <div className="flex justify-center w-full">
                        <CalculationDemo />
                    </div>
                </div>
            </Section>


            <FeatureShowcase />

            {/* Feature 2: Saldo Livre de Verdade */}
            <FeatureBlock
                id="feature-saldo"
                bg="bg-gray-50/50"
                reverse
                subtitle="Inteligência de Fluxo"
                title="Saiba exatamente quanto pode gastar hoje. Sem sustos."
                desc="O Saldin olha para o futuro por você. Ele já reserva o dinheiro das suas boletos, parcelas de cartão e metas. O que ele te mostra é o seu Saldo Livre de Verdade™."
                icon={TrendingUp}
                onCta={() => navigate("/auth")}
                mockup={
                    <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-border max-w-[450px] w-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-sm font-medium text-gray-400">Saldo Livre de Verdade™</span>
                                <div className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">EM TEMPO REAL</div>
                            </div>
                            <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">R$ 432,50</div>
                            <p className="text-emerald-600 text-xs font-bold mb-8 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Você está dentro do planejado
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-teal-600"><CreditCard className="w-5 h-5"/></div>
                                    <div className="flex-1">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Projetado (Cartões)</p>
                                        <p className="text-sm font-bold text-gray-700">R$ 1.240,00</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-orange-600"><Zap className="w-5 h-5"/></div>
                                    <div className="flex-1">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Contas Fixas</p>
                                        <p className="text-sm font-bold text-gray-700">R$ 840,00</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            />

            {/* Feature 3: Gestão de Cartões */}
            <FeatureBlock
                id="feature-cards"
                bg="bg-background"
                subtitle="Faturas sob Controle"
                title="Domine suas faturas antes que elas dominem você."
                desc="Tenha uma visão única de todos os seus cartões. Saiba exatamente quanto cada parcela 'pequena' está comendo do seu futuro e receba alertas antes de estourar o limite."
                icon={CreditCard}
                onCta={() => navigate("/auth")}
                mockup={
                    <div className="relative w-full max-w-[480px]">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-3xl bg-white shadow-xl border border-border -rotate-2">
                                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 mb-4"><Smartphone className="w-4 h-4"/></div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Inter Platinum</p>
                                <p className="text-lg font-bold text-gray-900 mb-3">R$ 2.450</p>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="w-[85%] h-full bg-orange-500" />
                                </div>
                                <p className="text-[8px] text-orange-600 mt-2 font-bold">85% do Limite</p>
                            </div>
                            <div className="p-5 rounded-3xl bg-white shadow-xl border border-border rotate-3 translate-y-8">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4"><CreditCard className="w-4 h-4"/></div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Nubank Gold</p>
                                <p className="text-lg font-bold text-gray-900 mb-3">R$ 890</p>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="w-[30%] h-full bg-emerald-500" />
                                </div>
                                <p className="text-[8px] text-emerald-600 mt-2 font-bold">30% do Limite</p>
                            </div>
                        </div>
                    </div>
                }
            />

            {/* Feature 4: Plano de Guerra */}
            <FeatureBlock
                id="feature-warplan"
                bg="bg-gray-50/50"
                reverse
                subtitle="Livre-se das Dívidas"
                title="Um Plano de Guerra desenhado para você vencer."
                desc="O Saldin utiliza algoritmos matemáticos para calcular a ordem exata de pagamento das suas dívidas, minimizando juros e maximizando sua velocidade para sair do vermelho."
                icon={Bomb}
                onCta={() => navigate("/auth")}
                mockup={
                    <div className="bg-gray-950 p-8 rounded-[40px] shadow-2xl border border-white/5 max-w-[450px] w-full relative overflow-hidden text-white">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Plano de Guerra Ativo</span>
                                <div className="px-2 py-0.5 rounded bg-white/10 text-white text-[9px] font-bold uppercase">7 meses para o Zero</div>
                            </div>
                            <h4 className="text-xl font-bold mb-6">Próximo Passo Estratégico</h4>

                            <div className="space-y-3">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold text-white mb-0.5">Cartão Visa - Itaú</p>
                                        <p className="text-[10px] text-gray-500">Juros de 12.5% p.m.</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-red-400 mb-0.5">PAGAR AGORA</p>
                                        <p className="text-[10px] text-gray-500">R$ 450,00</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center opacity-40">
                                    <div>
                                        <p className="text-xs font-bold text-white mb-0.5">Empréstimo Pessoal</p>
                                        <p className="text-[10px] text-gray-500">Juros de 4.2% p.m.</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold mb-0.5">AGUARDAR</p>
                                        <p className="text-[10px] text-gray-500">Fluxo de Caixa</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10">
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span>Progresso Total</span>
                                    <span className="text-orange-400">32%</span>
                                </div>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="w-[32%] h-full bg-gradient-to-r from-red-500 to-orange-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                }
            />

            {/* Feature 5: Cobrança de Recebíveis */}
            <FeatureBlock
                id="feature-receivables"
                subtitle="Receba no Prazo"
                title="Quem te deve? O Saldin ajuda você a cobrar com um clique."
                desc="Gerencie contas a receber e envie lembretes amigáveis de pagamento via WhatsApp. Transforme cobranças chatas em processos profissionais e organizados."
                icon={Send}
                onCta={() => navigate("/auth")}
                mockup={
                    <div className="relative p-8 bg-white rounded-[40px] shadow-2xl border border-border max-w-[400px] w-full group">
                         <div className="absolute inset-0 bg-green-500/5 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl shadow-inner">JS</div>
                                <div>
                                    <p className="text-base font-bold text-gray-900 leading-none mb-1">João Silva</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pendente: R$ 1.500,00</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-gray-50 border border-border flex justify-between items-center">
                                    <span className="text-sm text-gray-600 font-medium">Aluguel Mensal</span>
                                    <span className="text-sm font-bold text-gray-900">R$ 1.500,00</span>
                                </div>
                                <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-14 rounded-2xl flex items-center justify-center gap-2 border-0 shadow-lg shadow-green-500/20 transition-all active:scale-95">
                                    <MessageCircle className="w-5 h-5 fill-current" /> Cobrar via WhatsApp
                                </Button>
                                <p className="text-center text-[10px] text-gray-400">Mensagem profissional e customizada pronta.</p>
                            </div>
                         </div>
                    </div>
                }
            />

            {/* ─── COMPARISON TABLE ─── */}
            <ComparisonTable />

            {/* ─── TESTIMONIALS ─── */}
            {/* ─── TESTIMONIALS (WhatsApp message style) ─── */}
            <Section id="depoimentos" className="py-16 sm:py-24 px-4 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-sm font-bold uppercase tracking-widest text-primary">O que dizem por aí</span>
                        <h2 className="text-3xl sm:text-4xl font-bold mt-4 text-gray-900">Quem já usa, não para.</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col"
                            >
                                {/* WhatsApp-style header */}
                                <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>{t.initials}</div>
                                    <div>
                                        <p className="text-white text-[12px] font-bold leading-none">{t.name}</p>
                                        <p className="text-green-300 text-[10px] mt-0.5">{t.role}</p>
                                    </div>
                                </div>
                                {/* Chat bubble */}
                                <div className="bg-[#ece5dd] p-3 flex-1">
                                    <div className="bg-white rounded-xl rounded-tl-sm p-3 shadow-sm">
                                        <p className="text-gray-800 text-sm leading-relaxed">{t.text}</p>
                                        <p className="text-[10px] text-right text-gray-400 mt-1">{t.time} ✓✓</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <p className="text-center text-gray-400 text-xs mt-8">Depoimentos reais de usuários beta. Nomes abreviados por privacidade.</p>
                </div>
            </Section>
            {/* ─── OBJECTION HANDLING (conversational, no emoji circles) ─── */}
            <Section className="py-16 sm:py-24 bg-background border-t border-border">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <span className="text-sm font-bold uppercase tracking-widest text-primary">Suas Dúvidas</span>
                        <h2 className="text-3xl sm:text-4xl font-bold mt-4 text-gray-900">
                            Antes de tentar, é normal ter dúvida.
                        </h2>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                        {[
                            { doubt: "Não tenho tempo pra anotar", answer: "Você não precisa. Mande um áudio de 5 segundos enquanto sai da loja. A IA transcreve, categoriza e registra. Você não faz nada além de falar.", tag: "Tempo" },
                            { doubt: "Sou péssimo com números", answer: "Ótimo, porque o Saldin não mostra números — mostra uma resposta: quanto você pode gastar hoje. Só isso. Sem tabela, sem gráfico.", tag: "Facilidade" },
                            { doubt: "Tenho medo de conectar bancos", answer: "O Saldin não conecta no seu banco. Nunca. Tudo acontece via WhatsApp. Você fala o gasto, e ponto. Seus dados bancários ficam com você.", tag: "Segurança" },
                            { doubt: "Já tentei app e planilha e larguei", answer: "Faz sentido. Eles dependem de você ir até eles. O WhatsApp você já abre dezenas de vezes por dia — a entrada de gastos vira hábito em 3 dias.", tag: "Aderência" },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="bg-gray-50 border border-gray-200 rounded-2xl p-6 hover:border-orange-200 hover:bg-orange-50/30 transition-colors duration-300"
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <h3 className="font-bold text-gray-900 text-base leading-snug">&ldquo;{item.doubt}&rdquo;</h3>
                                    <span className="shrink-0 text-[10px] font-bold px-2 py-1 bg-orange-100 text-orange-700 rounded-full">{item.tag}</span>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed">{item.answer}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>
            {/* ─── URGENCY BANNER ─── */}
            <div className="bg-red-600 text-white py-4 text-center px-4 animate-pulse">
                <p className="font-bold text-base sm:text-lg leading-relaxed flex items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    ATENÇÃO: Os bônus exclusivos encerram hoje às 23:59!
                </p>
            </div>

            {/* ─── PRICING ─── */}
            <Section id="pricing" className="py-10 sm:py-16 px-4 bg-gray-50">
                <SaleNotification />
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10 sm:mb-12">
                        <span className="text-sm font-bold uppercase tracking-widest text-primary">Oferta de Lançamento</span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-3 text-gray-900">Comece com 4 dias grátis</h2>
                        <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
                            Menos que um café por dia. Cancele quando quiser, sem burocracia.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 sm:gap-8 items-center">
                        {/* Monthly */}
                        <div className="p-8 rounded-3xl bg-background border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all order-2 md:order-1">
                            <h3 className="text-xl font-bold mb-1 text-gray-900">Mensal</h3>
                            <p className="text-xs text-gray-400 mb-4">Para quem quer experimentar</p>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-3xl font-bold text-gray-900">R$ 47,00</span>
                                <span className="text-gray-500">/mês</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-6">≈ R$ 1,56 por dia</p>
                            <Button 
                                className="w-full rounded-full gradient-warm border-0 font-bold h-12 mb-6 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-105 transition-all whitespace-nowrap px-4" 
                                onClick={() => navigate("/auth")}
                            >
                                Começar 4 Dias Grátis
                            </Button>
                            <ul className="space-y-3 text-sm text-gray-500">
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Acesso completo a tudo</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> WhatsApp ilimitado</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Dashboard web</li>
                            </ul>
                        </div>

                        {/* Semester */}
                        <div className="p-8 rounded-3xl bg-background border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all order-3">
                            <h3 className="text-xl font-bold mb-1 text-gray-900">Semestral</h3>
                            <p className="text-xs text-gray-400 mb-4">Para quem quer resultado real</p>
                            <div className="flex flex-wrap items-baseline gap-1.5 mb-1">
                                <span className="text-gray-500 line-through text-base sm:text-lg">R$ 47,00</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">R$ 24,50</span>
                                    <span className="text-gray-400 text-sm">/mês</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mb-6">R$ 147,00 cobrado a cada 6 meses · ≈ R$ 0,81/dia</p>
                            <Button 
                                className="w-full rounded-full gradient-warm border-0 font-bold h-12 mb-6 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-105 transition-all whitespace-nowrap px-4" 
                                onClick={() => navigate("/auth")}
                            >
                                Começar 4 Dias Grátis
                            </Button>
                            <ul className="space-y-3 text-sm text-gray-500">
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Tudo do Mensal</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> 25% de desconto aplicado</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Suporte prioritário</li>
                            </ul>
                        </div>

                        {/* Annual - Highlighted */}
                        <div className="relative p-8 rounded-3xl bg-gray-950 text-white shadow-2xl border border-white/10 order-1 md:order-2 ring-2 ring-orange-500/40 hover:-translate-y-2 transition-all">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full gradient-warm text-white text-xs font-bold uppercase tracking-wide shadow-lg whitespace-nowrap">
                                🔥 Melhor Custo-Benefício
                            </div>
                            <h3 className="text-xl font-bold mb-1">Anual</h3>
                            <p className="text-xs text-gray-400 mb-4">Para quem quer o máximo</p>
                            <div className="flex flex-wrap items-baseline gap-1.5 mb-1">
                                <span className="text-gray-500 line-through text-base sm:text-lg">R$ 47,00</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl sm:text-4xl font-bold text-white">R$ 20,58</span>
                                    <span className="text-gray-400 text-sm">/mês</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mb-2">R$ 247,00 por ano · ≈ R$ 0,67/dia</p>
                            <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg px-3 py-1.5 mb-6 text-center">
                                <span className="text-orange-300 text-xs font-bold">Você economiza R$ 317,00 por ano</span>
                            </div>

                            {/* Bonuses */}
                            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">GRÁTIS</div>
                                <p className="text-xs font-bold text-orange-300 uppercase tracking-wider mb-3">🎁 Bônus inclusos hoje:</p>
                                <ul className="space-y-2 text-xs text-gray-300">
                                    <li className="flex gap-2 items-start"><Star className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" /> <span>Guia: "Sair das Dívidas em 30 Dias"</span></li>
                                    <li className="flex gap-2 items-start"><Star className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" /> <span>Planilha Mestra de Orçamento</span></li>
                                    <li className="flex gap-2 items-start"><Star className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" /> <span>Grupo VIP de Suporte</span></li>
                                </ul>
                            </div>

                            <Button 
                                className="w-full rounded-full gradient-warm border-0 font-bold h-12 mb-6 shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all whitespace-nowrap px-4" 
                                onClick={() => navigate("/auth")}
                            >
                                Garantir com Bônus
                            </Button>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Tudo do Mensal</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> 56% de economia real</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Bônus exclusivos incluídos</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Suporte prioritário</li>
                            </ul>
                        </div>
                    </div>

                    {/* Trust bar below pricing */}
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-500" /> Pagamento seguro</span>
                        <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Garantia de 7 dias</span>
                        <span className="flex items-center gap-2"><Lock className="w-4 h-4 text-emerald-500" /> Cancele quando quiser</span>
                        <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-orange-500" /> Acesso em menos de 1 minuto</span>
                    </div>
                </div>
            </Section>

            {/* ─── SECURITY SECTION ─── */}
            <SecuritySection />

            {/* ─── FAQ ─── */}
            <Section id="faq" className="py-10 sm:py-16 px-4 bg-gray-50">
                <div className="max-w-3xl mx-auto">
                    <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-10 sm:mb-12 text-gray-900">Perguntas Frequentes</h2>
                    <div className="space-y-3 sm:space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left font-medium text-gray-900 text-sm leading-relaxed sm:text-base"
                                >
                                    {faq.q}
                                    {openFaq === i ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                                </button>
                                <AnimatePresence>
                                    {openFaq === i && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: "auto" }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-5 sm:p-6 pt-0 text-gray-600 text-sm leading-relaxed leading-relaxed">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ─── FINAL CTA ─── */}
            <section className="py-24 sm:py-32 px-4 relative overflow-hidden bg-gradient-to-br from-orange-500 to-pink-600 text-white">
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-background/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                        Do caos à clareza em 1 minuto.
                    </h2>
                    <p className="max-w-[100vw] leading-relaxed text-lg leading-relaxed sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                        Pare de adiar sua paz financeira. O primeiro passo é o único que depende de você.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            onClick={() => navigate("/auth")}
                            className="h-14 sm:h-16 px-10 rounded-full text-lg leading-relaxed font-bold bg-background text-orange-600 hover:bg-gray-100 hover:scale-105 transition-all shadow-xl w-full sm:w-auto"
                        >
                            Começar 4 Dias Grátis
                        </Button>
                    </div>
                    <p className="max-w-[100vw] leading-relaxed text-white/70 text-xs mt-6">Cancele a qualquer momento • Teste de 4 dias incluso</p>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="border-t border-border py-12 px-4 bg-background">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-6 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-2 justify-center">
                        <img src={logoSaldin} alt="Saldin" className="h-6 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all font-bold" />
                        <span className="max-w-[100vw] leading-relaxed text-sm leading-relaxed text-gray-400">© 2025 Saldin</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-sm leading-relaxed text-gray-500">
                        <a href="#" className="hover:text-gray-900 transition-colors">Instagram</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">Termos</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">Privacidade</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">Contato</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Landing;
