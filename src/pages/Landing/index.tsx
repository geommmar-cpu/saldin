import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
    Shield, Zap, CreditCard, Target, MessageCircle, Clock,
    CheckCircle, ArrowRight, ChevronDown, Star, TrendingUp,
    AlertTriangle, Eye, EyeOff, DollarSign, Users, Lock,
    Smartphone, BarChart3, Wallet, Bomb, Send, X, Menu,
    ChevronUp, Sparkles, Check, Play, UserCheck, ThumbsUp, Timer
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

// ─── Phone Mockup Component (iPhone 15 Pro Style - Light Mode) ───
const PhoneMockup = () => {
    const [messages, setMessages] = useState<{ type: 'user' | 'bot', text: string | React.ReactNode }[]>([]);

    useEffect(() => {
        const sequence = [
            { type: 'user', text: 'Gastei 23 na farmácia', delay: 1000 },
            {
                type: 'bot', text: (
                    <div className="flex flex-col text-left text-xs sm:text-sm leading-relaxed w-full font-sans">
                        {/* Header: Transaction Confirmed */}
                        <div className="font-bold border-b border-gray-100 pb-2 mb-2 flex items-center gap-2 text-gray-800">
                            <div className="shrink-0 w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-[10px] text-gray-500">✓</div>
                            <span className="text-[11px] sm:text-xs tracking-wider">TRANSAÇÃO CONFIRMADA</span>
                        </div>

                        {/* Details */}
                        <div className="space-y-1 mb-3 text-gray-600 text-[11px] sm:text-xs">
                            <p className="flex gap-1"><span className="opacity-100 font-semibold text-gray-800">🆔 ID:</span> <span className="font-mono text-gray-500 text-[10px]">TXN-20260218-J6E6PI</span></p>
                            <p><span className="font-semibold text-gray-800">Tipo:</span> Gasto</p>
                            <p><span className="font-semibold text-gray-800">Valor:</span> <span className="text-gray-900 font-bold bg-gray-100 px-1 rounded">R$ 23,00</span></p>
                            <p><span className="font-semibold text-gray-800">Categoria:</span> Farmácia</p>
                            <p><span className="font-semibold text-gray-800">Descrição:</span> Despesa Geral</p>
                            <p><span className="font-semibold text-gray-800">Origem:</span> Conta</p>
                            <p><span className="font-semibold text-gray-800">Data:</span> 18/02/2026</p>
                        </div>

                        {/* Impact */}
                        <div className="font-bold border-b border-gray-100 pb-1 mb-2 text-gray-800 flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-wide mt-2">
                            💰 Impacto Financeiro
                        </div>
                        <div className="space-y-1 mb-3 text-gray-600 text-[11px] sm:text-xs">
                            <div className="flex justify-between">
                                <span>Saldo anterior:</span>
                                <span className="font-medium text-gray-500">R$ 2.069,00</span>
                            </div>
                            <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 p-1.5 rounded -mx-1.5 border border-emerald-100/50">
                                <span>Novo saldo:</span>
                                <span>R$ 2.046,00</span>
                            </div>
                            <div className="flex justify-between pt-1 text-emerald-600/80 font-medium text-[10px]">
                                <span>Disponível nas contas:</span>
                                <span>R$ 2.046,00</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="font-bold border-b border-gray-100 pb-1 mb-2 text-gray-800 flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-wide mt-2">
                            ⚙️ Ações
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] text-blue-500 font-medium font-mono">
                            <button className="text-left hover:underline decoration-blue-300">EXCLUIR TXN-20260218-J6E6PI</button>
                            <button className="text-left hover:underline decoration-blue-300">EDITAR TXN-20260218-J6E6PI</button>
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-100 text-[9px] text-center text-gray-400 font-medium tracking-wide">
                            Saldin • Seu controle financeiro
                        </div>
                    </div>
                ), delay: 2000
            }
        ];

        let timeouts: NodeJS.Timeout[] = [];
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
        <div className="relative mx-auto w-[300px] h-[600px] transform scale-90 sm:scale-100 origin-top sm:origin-center">
            {/* iPhone 15 Pro Frame - Silver / Natural Titanium */}
            <div className="relative h-full w-full bg-[#d0d1d6] rounded-[55px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3),inset_0_0_2px_1px_rgba(255,255,255,0.7)] ring-4 ring-[#b4b5b9]/50 border-[6px] border-[#e3e3e5]">

                {/* Dynamic Island */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-20 transition-all duration-300"></div>

                {/* Screen Content */}
                <div className="absolute top-0 left-0 w-full h-full rounded-[50px] overflow-hidden bg-[#EFE7DD] flex flex-col">

                    {/* Header - Light Mode */}
                    <div className="bg-[#F0F2F5]/90 backdrop-blur-md px-4 pt-12 pb-3 flex items-center gap-3 shadow-sm z-10 border-b border-gray-200">
                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-100">
                            <img src={logoSaldin} alt="Saldin Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="text-black text-sm font-semibold">Saldin</p>
                            <p className="text-emerald-600 text-[10px] font-medium">Online</p>
                        </div>
                    </div>

                    {/* Chat Area - WhatsApp Light BG */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat relative">

                        <div className="relative z-10 flex flex-col gap-3">
                            <p className="text-center text-[10px] text-gray-500 my-2 bg-white/80 backdrop-blur-sm inline-block px-3 py-1 rounded-full mx-auto w-fit shadow-sm border border-gray-100">Hoje</p>

                            <AnimatePresence>
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[90%] rounded-2xl p-2.5 text-sm shadow-sm ${msg.type === 'user'
                                            ? 'bg-[#D9FDD3] text-gray-900 rounded-tr-sm' // Light Green (WhatsApp Sent)
                                            : 'bg-white text-gray-900 rounded-tl-sm' // White (WhatsApp Received)
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
                    <div className="bg-[#F0F2F5] px-3 py-2 pb-6 flex items-center gap-2 border-t border-gray-200">
                        <div className="w-7 h-7 rounded-full text-blue-500 flex items-center justify-center font-light text-2xl pb-1">
                            +
                        </div>
                        <div className="flex-1 h-9 bg-white rounded-full px-3 flex items-center text-gray-400 text-sm border border-gray-100 shadow-sm">
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
};

// ─── Device Showcase Component (High Fidelity Mockup) ───
const DeviceShowcase = () => {
    return (
        <div className="relative w-full flex items-center justify-center py-6 sm:py-10">
            {/* Main Mockup Image */}
            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="relative z-30"
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
};

// ─── Calculation Demo Component ───
const CalculationDemo = () => {
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
        <div className="bg-white/90 backdrop-blur-xl border border-gray-100 p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-lg w-full mx-auto">
            <h3 className="text-xl font-bold mb-6 text-center text-gray-900">Descubra seu Saldo Livre</h3>

            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
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
                    <div className="flex justify-between text-sm">
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
                    <div className="flex justify-between text-sm">
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

            <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
                <div className="text-center mb-2">
                    <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Saldo Livre de Verdade™</p>
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
};

// ─── Countdown Timer Component ───
const CountdownTimer = () => {
    const [timeLeft, setTimeLeft] = useState(14400); // 4 hours in seconds

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 14400));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    return (
        <span className="font-mono font-bold text-orange-200">
            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
    );
};

// ─── Marquee Component ───
const MARQUEE_ITEMS = [
    { icon: Star, text: "Destaque da Semana", color: "text-yellow-500 fill-current" },
    { icon: Users, text: "+5.000 Usuários Ativos", color: "text-blue-500" },
    { icon: Shield, text: "Segurança Bancária", color: "text-green-500" },
    { icon: Zap, text: "Atendimento em 10s", color: "text-orange-500" },
    { icon: Smartphone, text: "100% via WhatsApp", color: "text-purple-500" },
];

const Marquee = () => {
    return (
        <div className="bg-gray-900 overflow-hidden py-3 border-y border-gray-800 flex relative z-40">
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
                    <span key={i} className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-widest whitespace-nowrap">
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
                    <span key={i} className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-widest whitespace-nowrap">
                        <item.icon className={`w-4 h-4 ${item.color}`} /> {item.text}
                    </span>
                ))}
            </motion.div>
        </div>
    );
};

// ─── Sale Notification Component ───
const SaleNotification = () => {
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
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, x: -50, y: 20 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: -50, y: 20 }}
                    className="fixed bottom-4 left-4 z-50 bg-white border border-gray-100 shadow-xl rounded-xl p-3 flex items-center gap-3 max-w-[300px]"
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
};

// ─── VSL Placeholder ───
const VSL = () => (
    <div className="relative w-full aspect-video bg-black/5 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 group cursor-pointer">
        <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center shadow-lg relative pl-1">
                    <Play className="w-6 h-6 text-white fill-current" />
                </div>
            </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <div>
                <p className="text-white font-bold text-lg sm:text-xl md:text-2xl shadow-black/50 drop-shadow-md">
                    Descubra como sobrar dinheiro todo mês <span className="text-orange-400">(sem planilhas)</span>
                </p>
                <p className="text-white/80 text-sm mt-1">Veja em 2 minutos</p>
            </div>
        </div>
        {/* Fake Thumbnail */}
        <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000" alt="VSL Thumbnail" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
);

// ─── Main Headline ───
const mainHeadline = "Domine seu dinheiro com o Saldo Livre de Verdade™";

// ─── Testimonials ───
const testimonials = [
    { name: "Camila R.", role: "32, Professora", text: "Eu achava que estava bem porque via R$ 2.000 no banco. O Saldin me mostrou que R$ 1.700 já eram de parcelas. Foi um choque necessário.", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d" },
    { name: "Lucas M.", role: "28, Designer", text: "Renda variável sempre foi caótico. Agora eu sei exatamente quanto posso gastar antes de comprometer o mês. É como ter um consultor no bolso.", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d" },
    { name: "Ana Paula S.", role: "41, Médica", text: "Planilha eu largava no 3º dia. O Saldin eu uso pelo WhatsApp — mando áudio e ele registra. Nunca foi tão fácil ter controle.", avatar: "https://i.pravatar.cc/150?u=a04258114e29026302d" },
    { name: "Roberto F.", role: "35, Engenheiro", text: "O Plano de Guerra das Dívidas me deu a data exata que eu zero tudo. Faltam 7 meses. Pela primeira vez, tenho esperança de verdade.", avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d" },
];

// ─── FAQ ───
const faqs = [
    { q: "Preciso conectar meu banco?", a: "Não! O Saldin acredita na privacidade total. Você não conecta contas bancárias. Tudo é registrado via WhatsApp (áudio, texto, foto) ou manualmente, garantindo que seus dados bancários fiquem protegidos." },
    { q: "Funciona para quem ganha pouco?", a: "Sim! Na verdade, quem tem orçamento mais apertado é quem mais se beneficia da clareza do Saldo Livre para não entrar em dívidas." },
    { q: "É seguro mandar dados no WhatsApp?", a: "Absolutamente. O Saldin usa criptografia de ponta a ponta e processa as mensagens apenas para extrair os dados financeiros. Não pedimos senhas, CPF ou dados sensíveis." },
    { q: "Posso cancelar quando quiser?", a: "Sim. Sem fidelidade, sem letras miúdas. Você gerencia sua assinatura direto no painel com um clique." },
    { q: "O WhatsApp é um robô ou humano?", a: "É uma Inteligência Artificial avançada, treinada para entender linguagem natural. Você fala como falaria com um amigo e ela entende." },
];

// ─── Comparison Table Component ───
const ComparisonTable = () => (
    <Section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Por que o Saldin vence?</h2>
                <p className="text-gray-500">A evolução natural do controle financeiro.</p>
            </div>
            <div className="overflow-x-auto pb-4">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr>
                            <th className="p-4 text-gray-400 font-medium text-sm w-1/4"></th>
                            <th className="p-4 text-center text-gray-400 font-medium text-sm w-1/4">Apps de Banco</th>
                            <th className="p-4 text-center text-gray-400 font-medium text-sm w-1/4">Planilhas</th>
                            <th className="p-4 text-center text-orange-600 font-bold text-lg bg-orange-50 rounded-t-xl border-t border-x border-orange-100 w-1/4 relative">
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm">Melhor Escolha</span>
                                Saldin
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-sm sm:text-base">
                        <tr className="border-b border-gray-50">
                            <td className="p-4 font-bold text-gray-700">Esforço Diário</td>
                            <td className="p-4 text-center text-gray-500">Alto <span className="block text-xs opacity-70 font-normal">(Categorizar)</span></td>
                            <td className="p-4 text-center text-gray-500">Infinito <span className="block text-xs opacity-70 font-normal">(Manual)</span></td>
                            <td className="p-4 text-center font-bold text-gray-900 bg-orange-50 border-x border-orange-100">Zero <span className="block text-xs font-normal text-orange-700 opacity-80">(Só falar)</span></td>
                        </tr>
                        <tr className="border-b border-gray-50">
                            <td className="p-4 font-bold text-gray-700">Tempo Gasto</td>
                            <td className="p-4 text-center text-gray-500">15 min/dia</td>
                            <td className="p-4 text-center text-gray-500">1 hora/semana</td>
                            <td className="p-4 text-center font-bold text-gray-900 bg-orange-50 border-x border-orange-100">5 seg/transação</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                            <td className="p-4 font-bold text-gray-700">Visão de Futuro</td>
                            <td className="p-4 text-center text-gray-500">Não <span className="block text-xs opacity-70 font-normal">(Só passado)</span></td>
                            <td className="p-4 text-center text-gray-500">Só se configurar</td>
                            <td className="p-4 text-center font-bold text-gray-900 bg-orange-50 border-x border-orange-100">Sim <span className="block text-xs font-normal text-orange-700 opacity-80">(Saldo Livre)</span></td>
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-gray-700">Interface</td>
                            <td className="p-4 text-center text-gray-500">App Pesado</td>
                            <td className="p-4 text-center text-gray-500">Complexa</td>
                            <td className="p-4 text-center font-bold text-gray-900 bg-orange-50 rounded-b-xl border-b border-x border-orange-100">WhatsApp</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </Section>
);

// ─── Security Section Component ───
const SecuritySection = () => (
    <Section className="py-16 sm:py-24 bg-white border-t border-b border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-20"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6 border border-emerald-100">
                <Lock className="w-3 h-3" /> Blindagem de Dados
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Sua privacidade é nossa obsessão.
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto mb-12 text-base sm:text-lg">
                Nós não vendemos seus dados. Nós não treinamos IA com suas informações pessoais. O que é seu, fica com você.
            </p>

            <div className="grid sm:grid-cols-3 gap-8 text-left sm:text-center">
                <div className="flex sm:flex-col items-center gap-4 sm:gap-2">
                    <div className="shrink-0 w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-0 sm:mb-4 text-emerald-600 border border-emerald-100">
                        <Shield className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 mb-1">Criptografia Militar</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">Seus dados são embaralhados de ponta a ponta. Nem nossa equipe consegue ler.</p>
                    </div>
                </div>
                <div className="flex sm:flex-col items-center gap-4 sm:gap-2">
                    <div className="shrink-0 w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-0 sm:mb-4 text-blue-600 border border-blue-100">
                        <EyeOff className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 mb-1">Sem Conexão Bancária</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">Nunca pediremos sua senha do banco. O Saldin funciona sem risco de vazamentos.</p>
                    </div>
                </div>
                <div className="flex sm:flex-col items-center gap-4 sm:gap-2">
                    <div className="shrink-0 w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-0 sm:mb-4 text-purple-600 border border-purple-100">
                        <UserCheck className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 mb-1">Dados Anônimos</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">Para nossa IA, você é apenas um código. Sua identidade real é preservada.</p>
                    </div>
                </div>
            </div>
        </div>
    </Section>
);

const Landing = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
            {/* ─── URGENCY NOTICE BAR ─── */}
            <div className="bg-gradient-to-r from-orange-500 to-pink-600 text-white py-2.5 px-4 text-center text-xs sm:text-sm font-semibold relative overflow-hidden z-[60] shadow-md">
                <p className="flex flex-wrap items-center justify-center gap-2 relative z-10">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-pulse" />
                    <span className="opacity-95">Oferta de Lançamento: Bônus Exclusivos.</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider ml-1">Restam 14 vagas</span>
                    <span className="hidden sm:inline-block w-1 h-1 bg-white/40 rounded-full mx-1"></span>
                    <span className="text-white/80 text-[10px] uppercase tracking-wide mr-1">Expira em:</span>
                    <CountdownTimer />
                </p>
                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
            </div>

            {/* ─── NAVBAR ─── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
                    <img src={logoSaldin} alt="Saldin" className="h-7 md:h-10 w-auto object-contain" />

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                        <button onClick={() => scrollTo("problema")} className="hover:text-primary transition-colors">O Problema</button>
                        <button onClick={() => scrollTo("funcionalidades")} className="hover:text-primary transition-colors">Funcionalidades</button>
                        <button onClick={() => scrollTo("pricing")} className="hover:text-primary transition-colors">Planos</button>
                        <button onClick={() => scrollTo("faq")} className="hover:text-primary transition-colors">FAQ</button>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        <Button variant="ghost" className="hidden md:inline-flex text-gray-700 hover:text-gray-900" onClick={() => navigate("/auth")}>
                            Entrar
                        </Button>
                        <Button onClick={() => navigate("/auth")} className="gradient-warm text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transform hover:-translate-y-0.5 transition-all duration-300 rounded-full px-5 h-9 text-sm md:h-10 md:px-6 md:text-base">
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
                            className="md:hidden border-t border-gray-100 bg-white px-4 pb-6 shadow-xl"
                        >
                            <div className="flex flex-col gap-4 pt-4 text-base font-medium">
                                <button onClick={() => scrollTo("problema")} className="text-left py-2 text-gray-600 border-b border-gray-100">O Problema</button>
                                <button onClick={() => scrollTo("funcionalidades")} className="text-left py-2 text-gray-600 border-b border-gray-100">Funcionalidades</button>
                                <button onClick={() => scrollTo("depoimentos")} className="text-left py-2 text-gray-600 border-b border-gray-100">Depoimentos</button>
                                <button onClick={() => scrollTo("faq")} className="text-left py-2 text-gray-600 border-b border-gray-100">FAQ</button>
                                <button onClick={() => navigate("/auth")} className="text-left py-2 text-primary font-bold">Entrar na minha conta</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* ─── HERO SECTION ─── */}
            <section className="pt-24 pb-16 lg:pt-48 lg:pb-32 px-4 relative overflow-hidden bg-white">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-50/60 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-70 sm:opacity-100" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/40 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 opacity-70 sm:opacity-100" />

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-20 items-center relative z-10">
                    {/* Left: Text */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-center lg:text-left pt-6 sm:pt-0"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs sm:text-sm font-semibold mb-6 border border-orange-100">
                            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                            A revolução no controle financeiro
                        </div>

                        <div className="mb-4 sm:mb-6">
                            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-gray-900">
                                Domine seu dinheiro com o <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-500">Saldo Livre de Verdade™</span>
                            </h1>
                        </div>

                        <p className="text-lg sm:text-xl text-gray-500 max-w-xl mx-auto lg:mx-0 mb-8 sm:mb-10 leading-relaxed px-4 lg:px-0">
                            O Saldin mostra seu <strong className="text-gray-900 font-semibold">Saldo Livre de Verdade™</strong>.
                            Sem planilhas. Basta enviar um áudio ou foto no WhatsApp.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start px-8 sm:px-0">
                            <Button
                                size="lg"
                                onClick={() => navigate("/auth")}
                                className="gradient-warm text-white border-0 h-12 sm:h-14 px-8 text-base sm:text-lg font-semibold rounded-full shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transition-all w-full sm:w-auto"
                            >
                                Testar Grátis Agora
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => scrollTo("mecanismo")}
                                className="h-12 sm:h-14 px-8 text-base sm:text-lg rounded-full border-2 bg-white text-gray-700 hover:bg-gray-50 w-full sm:w-auto hidden sm:flex"
                            >
                                <Play className="w-4 h-4 ml-2 mr-2 fill-current" />
                                Ver como funciona
                            </Button>
                        </div>

                        <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-xs sm:text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-emerald-500" /> Criptografado</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-500" /> Ativação Imediata</span>
                        </div>
                    </motion.div>

                    {/* Right: Device Showcase (Phone + Laptop + Tablet) */}
                    <div className="flex justify-center items-center relative mt-12 lg:mt-0 w-full">
                        {/* Decorative background glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-200/30 to-pink-300/30 rounded-full blur-3xl transform scale-125 -z-10" />
                        <DeviceShowcase />
                    </div>
                </div>

                {/* VSL Section - Inserting right after Hero intro for maximum retention */}
                <div className="max-w-4xl mx-auto mt-12 sm:mt-16 mb-16 px-4 relative z-20">
                    <div className="text-center mb-6">
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
                            className="h-16 px-12 rounded-full text-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-600/30 hover:scale-105 transition-all w-full sm:w-auto animate-bounce-slow"
                        >
                            QUERO ASSUMIR O CONTROLE AGORA
                        </Button>
                        <p className="text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" /> Compra segura • Garantia de 7 dias • Acesso imediato
                        </p>
                    </div>
                </div>
            </section>

            <Marquee />

            {/* ─── WHO IS THIS FOR? (SEGMENTATION) ─── */}
            <Section id="quem-e" className="py-16 bg-white border-y border-gray-100">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">Pra quem é o Saldin?</h2>
                        <p className="text-gray-500 mt-2">Diga adeus à confusão se você se identifica com um destes:</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 text-center hover:scale-105 transition-transform">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">💻</div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">Freelancers & Autônomos</h3>
                            <p className="text-sm text-gray-600">Que nunca sabem exatamente quanto vai entrar e misturam contas PJ com PF.</p>
                        </div>
                        <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100 text-center hover:scale-105 transition-transform">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎓</div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">Universitários & Estagiários</h3>
                            <p className="text-sm text-gray-600">Que precisam fazer o dinheiro render até o fim do mês sem abrir mão do lazer.</p>
                        </div>
                        <div className="p-6 bg-green-50/50 rounded-2xl border border-green-100 text-center hover:scale-105 transition-transform">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">👔</div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">CLT & Assalariados</h3>
                            <p className="text-sm text-gray-600">Que vivem de salário em salário e são surpreendidos pela fatura do cartão.</p>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ─── PROBLEM SECTION ─── */}
            <Section id="problema" className="py-16 sm:py-24 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12 sm:mb-16">
                        <span className="text-sm font-bold uppercase tracking-widest text-impulse">O Inimigo Invisível</span>
                        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-6 text-gray-900">
                            Por que você sente que o dinheiro some?
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                            O app do banco foi feito para você gastar. O Saldin foi feito para você prosperar.
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
                                className="group p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${item.color}`} />
                                </div>
                                <h3 className="font-serif text-xl sm:text-2xl font-bold mb-3 text-gray-900">{item.title}</h3>
                                <p className="text-gray-500 leading-relaxed text-sm sm:text-base">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ─── SOLUTION / MECHANISM SECTION ─── */}
            <Section id="mecanismo" className="py-16 sm:py-24 px-4 bg-gray-50/50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
                    <div>
                        <span className="text-sm font-bold uppercase tracking-widest text-primary">O Mecanismo Saldin</span>
                        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-6 leading-tight text-gray-900">
                            A única métrica que importa: <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Saldo Livre de Verdade™</span>
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-500 mb-8 leading-relaxed">
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
                                    <span className="font-medium text-gray-700 text-sm sm:text-base">{item}</span>
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

            {/* ─── FEATURES GRID (BENTO) ─── */}
            <Section id="funcionalidades" className="py-16 sm:py-24 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12 sm:mb-16">
                        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-gray-900">Funcionalidades Poderosas</h2>
                        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto">
                            Tudo o que você precisa para dominar seu dinheiro, sem chatice.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 auto-rows-auto md:auto-rows-[300px]">
                        {/* Feature 1: WhatsApp (Large) */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="md:col-span-2 row-span-1 rounded-3xl bg-[#f0fdf4] border border-green-100 p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between group min-h-[280px]"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-200/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-green-100">
                                    <MessageCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-green-900">WhatsApp Inteligente</h3>
                                <p className="text-green-800/80 max-w-md text-sm sm:text-base">Envie áudio, foto de notas fiscais ou texto. Nossa IA processa, categoriza e atualiza seu saldo em segundos.</p>
                            </div>
                            <div className="absolute -bottom-16 -right-16 md:right-0 md:bottom-0 transform scale-[0.45] md:scale-[0.6] origin-bottom-right rotate-6 group-hover:rotate-0 transition-transform duration-500 opacity-60 group-hover:opacity-100">
                                <PhoneMockup />
                            </div>
                        </motion.div>

                        {/* Feature 2: Cards */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="rounded-3xl bg-white border border-gray-100 p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden min-h-[200px]"
                        >
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
                                <CreditCard className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900">Gestão de Cartões</h3>
                                <p className="text-gray-500 text-sm">Controle seus limites e veja o impacto das parcelas no futuro.</p>
                            </div>
                        </motion.div>

                        {/* Feature 3: Debt War Plan */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="rounded-3xl bg-white border border-gray-100 p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden min-h-[200px]"
                        >
                            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                                <Bomb className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900">Plano de Guerra</h3>
                                <p className="text-gray-500 text-sm">Estratégias matemáticas para acabar com as dívidas o mais rápido possível.</p>
                            </div>
                        </motion.div>

                        {/* Feature 4: Receivables (Large) */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="md:col-span-2 rounded-3xl bg-orange-50 border border-orange-100 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group min-h-[280px]"
                        >
                            <div className="relative z-10 w-full">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-orange-100">
                                    <Send className="w-6 h-6 text-orange-600" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-orange-900">Cobrança de Recebíveis</h3>
                                <p className="text-orange-800/80 max-w-lg text-sm sm:text-base">Quem te deve? Organize e envie cobranças amigáveis e profissionais direto pelo WhatsApp com um clique.</p>
                            </div>
                            <div className="absolute bottom-6 right-6 flex -space-x-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-xs text-white">JD</div>
                                <div className="w-10 h-10 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-xs text-white">AM</div>
                                <div className="w-10 h-10 rounded-full bg-yellow-500 border-2 border-white flex items-center justify-center text-xs text-white">LP</div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </Section>

            {/* ─── COMPARISON TABLE ─── */}
            <ComparisonTable />

            {/* ─── TESTIMONIALS ─── */}
            <Section id="depoimentos" className="py-16 sm:py-24 px-4 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12 sm:mb-16">
                        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-gray-900">Vidas transformadas</h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">{t.name}</p>
                                        <p className="text-xs text-gray-500">{t.role}</p>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="inline-block w-3.5 h-3.5 fill-orange-400 text-orange-400 mr-0.5" />
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed flex-1">"{t.text}"</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ─── OBJECTION HANDLING ─── */}
            <Section className="py-16 bg-white border-t border-gray-100">
                <div className="max-w-5xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">🤔 "Mas será que funciona pra mim?"</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="flex gap-4">
                            <div className="shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-xl">🚫</div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">"Não tenho tempo pra anotar"</h3>
                                <p className="text-gray-600 text-sm mt-1">O Saldin foi feito pra isso. Mande um áudio de 5 segundos enquanto caminha. A IA faz o resto.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold text-xl">📉</div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">"Sou péssimo com números"</h3>
                                <p className="text-gray-600 text-sm mt-1">Você não precisa ser bom. O Saldin traduz tudo: "Você pode gastar R$ X hoje". Simples assim.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-xl">🔒</div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">"Tenho medo de conectar bancos"</h3>
                                <p className="text-gray-600 text-sm mt-1">Zero risco. O Saldin NÃO conecta no seu banco. Tudo via WhatsApp, você no controle total.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xl">📱</div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">"Já tentei apps e planilhas"</h3>
                                <p className="text-gray-600 text-sm mt-1">Planilhas são chatas. Apps são complicados. O WhatsApp você já usa todo dia. É impossível não usar.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ─── URGENCY BANNER ─── */}
            <div className="bg-red-600 text-white py-4 text-center px-4 animate-pulse">
                <p className="font-bold text-base sm:text-lg flex items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    ATENÇÃO: Os bônus exclusivos encerram hoje às 23:59!
                </p>
            </div>

            {/* ─── WAITING LIST / PRICING ─── */}
            <Section id="pricing" className="py-16 sm:py-24 px-4 bg-gray-50">
                <SaleNotification />
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10 sm:mb-12">
                        <span className="text-sm font-bold uppercase tracking-widest text-primary">Oferta de Lançamento</span>
                        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-6 text-gray-900">Comece agora com 4 dias grátis</h2>
                        <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
                            Sem letras miúdas. Se não gostar, cancele com um clique.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 sm:gap-8 items-center">
                        {/* Monthly */}
                        <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow order-2 md:order-1">
                            <h3 className="text-xl font-bold mb-2 text-gray-900">Mensal</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-bold text-gray-900">R$ 19,90</span>
                                <span className="text-gray-500">/mês</span>
                            </div>
                            <Button variant="outline" className="w-full rounded-full mb-6 border-gray-200 text-gray-700" onClick={() => navigate("/auth")}>Escolher Mensal</Button>
                            <ul className="space-y-3 text-sm text-gray-500">
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> Acesso total</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> WhatsApp Ilimitado</li>
                            </ul>
                        </div>

                        {/* Semester - Highlighted */}
                        <div className="relative p-8 rounded-3xl bg-gray-900 text-white shadow-2xl scale-100 sm:scale-105 border border-gray-800 order-1 md:order-2 ring-4 ring-orange-500/20">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold uppercase tracking-wide shadow-lg border border-white/20">
                                🔥 Oferta Limitada
                            </div>
                            <h3 className="text-xl font-bold mb-2">Semestral</h3>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-4xl font-bold">R$ 14,90</span>
                                <span className="text-gray-400">/mês</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-6">Cobrado R$ 89,90 a cada 6 meses</p>

                            {/* Bonuses */}
                            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">VALOR: R$ 197 (GRÁTIS)</div>
                                <p className="text-xs font-bold text-orange-300 uppercase tracking-wider mb-3">🎁 Bônus Exclusivos (HOJE):</p>
                                <ul className="space-y-2 text-xs text-gray-300">
                                    <li className="flex gap-2 items-start"><Star className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" /> <span>Guia: "Como sair das Dívidas em 30 Dias"</span></li>
                                    <li className="flex gap-2 items-start"><Star className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" /> <span>Planilha Mestra de Planejamento</span></li>
                                    <li className="flex gap-2 items-start"><Star className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" /> <span>Grupo Vip de Suporte</span></li>
                                </ul>
                            </div>

                            <Button className="w-full rounded-full gradient-warm border-0 font-bold h-12 mb-8 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/50 hover:scale-105 transition-all" onClick={() => navigate("/auth")}>
                                Garantir Bônus Agora
                            </Button>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400" /> Tudo do Mensal</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400" /> 25% de Desconto</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400" /> Prioridade no Suporte</li>
                            </ul>
                        </div>

                        {/* Annual */}
                        <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow order-3 md:order-3">
                            <h3 className="text-xl font-bold mb-2 text-gray-900">Anual</h3>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-3xl font-bold text-gray-900">R$ 12,49</span>
                                <span className="text-gray-500">/mês</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-6">Cobrado R$ 149,90 por ano</p>
                            <Button variant="outline" className="w-full rounded-full mb-6 border-gray-200 text-gray-700" onClick={() => navigate("/auth")}>Escolher Anual</Button>
                            <ul className="space-y-3 text-sm text-gray-500">
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> Maior economia (37%)</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> Acesso Beta a novidades</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ─── SECURITY SECTION ─── */}
            <SecuritySection />

            {/* ─── FAQ ─── */}
            <Section id="faq" className="py-16 sm:py-24 px-4 bg-gray-50">
                <div className="max-w-3xl mx-auto">
                    <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-10 sm:mb-12 text-gray-900">Perguntas Frequentes</h2>
                    <div className="space-y-3 sm:space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left font-medium text-gray-900 text-sm sm:text-base"
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
                                            <div className="p-5 sm:p-6 pt-0 text-gray-600 text-sm leading-relaxed">
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
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                        Do caos à clareza em 1 minuto.
                    </h2>
                    <p className="text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                        Pare de adiar sua paz financeira. O primeiro passo é o único que depende de você.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            onClick={() => navigate("/auth")}
                            className="h-14 sm:h-16 px-10 rounded-full text-lg font-bold bg-white text-orange-600 hover:bg-gray-100 hover:scale-105 transition-all shadow-xl w-full sm:w-auto"
                        >
                            Começar 4 Dias Grátis
                        </Button>
                    </div>
                    <p className="text-white/70 text-xs mt-6">Cancele a qualquer momento • Teste de 4 dias incluso</p>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="border-t border-gray-100 py-12 px-4 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-6 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-2 justify-center">
                        <img src={logoSaldin} alt="Saldin" className="h-6 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all font-bold" />
                        <span className="text-sm text-gray-400">© 2025 Saldin</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-sm text-gray-500">
                        <a href="#" className="hover:text-gray-900 transition-colors">Instagram</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">Termos</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">Privacidade</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">Contato</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
