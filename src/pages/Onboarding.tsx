import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, Brain, MessageCircle, Smartphone, Check, Wallet, Loader2 } from "lucide-react";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const onboardingSteps = [
  {
    id: "welcome",
    title: "Consciência Financeira",
    subtitle: "Não é sobre organizar números.",
    description: "É sobre mudar sua relação com o dinheiro, um gasto por vez.",
    icon: Brain,
  },
  {
    id: "concept",
    title: "Como funciona",
    subtitle: "Dois ambientes, um propósito",
    cards: [
      {
        icon: MessageCircle,
        title: "WhatsApp",
        description: "Você conversa com sua IA. Envia gastos por texto, áudio ou foto. Ela extrai tudo automaticamente.",
        color: "essential",
      },
      {
        icon: Smartphone,
        title: "App",
        description: "Você encara a verdade. Vê padrões, confirma emoções e entende pra onde vai seu dinheiro.",
        color: "accent",
      },
    ],
    tagline: "Você fala com a IA. Você encara a verdade no app.",
  },
  {
    id: "ai-name",
    title: "Dê um nome pra sua IA",
    subtitle: "Como você quer chamar seu assistente financeiro?",
    placeholder: "Ex: Luna, Max, Cris...",
  },
  {
    id: "income",
    title: "Sua renda mensal",
    subtitle: "Quanto entra na sua conta todo mês?",
    description: "Isso nos ajuda a mostrar o quanto você já comprometeu.",
  },
  {
    id: "problem",
    title: "Qual seu maior desafio?",
    subtitle: "Escolha o que mais te incomoda hoje",
    options: [
      { emoji: "💸", label: "Gasto sem pensar" },
      { emoji: "📊", label: "Não sei pra onde vai" },
      { emoji: "🎯", label: "Não consigo guardar" },
      { emoji: "😰", label: "Vivo no vermelho" },
    ],
  },
  {
    id: "connect",
    title: "Conecte com sua IA",
    subtitle: "Comece a conversar agora",
    description: "Sua IA está pronta. Clique no botão abaixo para iniciar a conversa no WhatsApp.",
  },
];

export const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [aiName, setAiName] = useState("");
  const [fixedIncome, setFixedIncome] = useState("");
  const [variableIncome, setVariableIncome] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    const number = parseInt(numericValue || "0", 10) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(number);
  };

  const handleIncomeChange = (value: string, setter: (v: string) => void) => {
    const numericValue = value.replace(/\D/g, "");
    setter(numericValue);
  };

  const saveProfileToSupabase = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return false;
    }

    setIsSaving(true);
    try {
      // Update profile with AI name, full_name, and mark onboarding as complete
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          ai_name: aiName || "Luna",
          full_name: user.email?.split("@")[0] || "Usuário",
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Create initial income record if provided
      const totalFixedIncome = parseInt(fixedIncome || "0", 10) / 100;
      const totalVariableIncome = parseInt(variableIncome || "0", 10) / 100;

      if (totalFixedIncome > 0) {
        await supabase.from("incomes").insert({
          user_id: user.id,
          amount: totalFixedIncome,
          description: "Receita fixa mensal",
          type: "salary",
          is_recurring: true,
        });
      }

      if (totalVariableIncome > 0) {
        await supabase.from("incomes").insert({
          user_id: user.id,
          amount: totalVariableIncome,
          description: "Receita variável mensal",
          type: "freelance",
          is_recurring: false,
        });
      }

      return true;
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Erro ao salvar dados. Tente novamente.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (isLastStep) {
      const success = await saveProfileToSupabase();
      if (success) {
        // Invalidate onboarding cache so RouteGuards sees the new status
        await queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
        navigate("/");
      }
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = async () => {
    if (!user) {
      navigate("/");
      return;
    }
    
    setIsSaving(true);
    try {
      // Mark onboarding as complete
      await supabase
        .from("profiles")
        .update({
          full_name: user.email?.split("@")[0] || "Usuário",
          onboarding_completed: true,
        })
        .eq("user_id", user.id);
      
      // Invalidate onboarding cache so RouteGuards sees the new status
      await queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    } catch (error) {
      console.error("Error skipping onboarding:", error);
    } finally {
      setIsSaving(false);
      navigate("/");
    }
  };

  const openWhatsApp = async () => {
    // Placeholder WhatsApp link - will be configured per user
    const whatsappUrl = "https://wa.me/5511999999999?text=Olá! Quero começar a usar o app de consciência financeira.";
    window.open(whatsappUrl, "_blank");
    await handleNext();
  };

  const canProceed = () => {
    if (step.id === "problem") return !!selectedProblem;
    if (step.id === "ai-name") return aiName.trim().length >= 2;
    if (step.id === "income") return fixedIncome && parseInt(fixedIncome, 10) > 0;
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress */}
      <div className="px-6 pt-safe-top">
        <div className="flex gap-2 pt-4">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                index <= currentStep ? "gradient-warm" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {step.id === "welcome" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-24 h-24 rounded-full gradient-warm flex items-center justify-center mb-8 shadow-large"
                >
                  <Brain className="w-12 h-12 text-primary-foreground" />
                </motion.div>
                <h1 className="font-serif text-4xl font-semibold mb-3">
                  {step.title}
                </h1>
                <p className="text-xl text-primary font-medium mb-4">
                  {step.subtitle}
                </p>
                <p className="text-muted-foreground text-lg max-w-xs">
                  {step.description}
                </p>
              </div>
            )}

            {step.id === "concept" && (
              <div className="flex-1 flex flex-col">
                <div className="text-center mb-6">
                  <h1 className="font-serif text-3xl font-semibold mb-2">
                    {step.title}
                  </h1>
                  <p className="text-muted-foreground">{step.subtitle}</p>
                </div>
                <div className="space-y-4 mb-6">
                  {step.cards?.map((card, index) => (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 }}
                      className="p-5 rounded-xl bg-card border border-border shadow-soft"
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `hsl(var(--${card.color}) / 0.15)` }}
                        >
                          <card.icon 
                            className="w-6 h-6" 
                            style={{ color: `hsl(var(--${card.color}))` }}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{card.title}</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <p className="text-lg font-medium text-primary italic">
                    "{step.tagline}"
                  </p>
                </motion.div>
              </div>
            )}

            {step.id === "ai-name" && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 rounded-full bg-essential/20 flex items-center justify-center mb-6"
                >
                  <MessageCircle className="w-10 h-10 text-essential" />
                </motion.div>
                <h1 className="font-serif text-3xl font-semibold mb-2 text-center">
                  {step.title}
                </h1>
                <p className="text-muted-foreground text-center mb-8 max-w-xs">
                  {step.subtitle}
                </p>
                <Input
                  type="text"
                  placeholder={step.placeholder}
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  className="max-w-xs text-center text-xl h-14 font-medium"
                  maxLength={20}
                />
                <p className="text-sm text-muted-foreground mt-3">
                  Você poderá mudar depois nas configurações
                </p>
              </div>
            )}

            {step.id === "income" && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 rounded-full bg-essential/20 flex items-center justify-center mb-6"
                >
                  <Wallet className="w-10 h-10 text-essential" />
                </motion.div>
                <h1 className="font-serif text-3xl font-semibold mb-2 text-center">
                  {step.title}
                </h1>
                <p className="text-muted-foreground text-center mb-8 max-w-xs">
                  {step.subtitle}
                </p>
                
                <div className="w-full max-w-xs space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Receita fixa <span className="text-impulse">*</span>
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={fixedIncome ? formatCurrency(fixedIncome) : ""}
                      onChange={(e) => handleIncomeChange(e.target.value, setFixedIncome)}
                      placeholder="R$ 0,00"
                      className="text-center text-xl h-14 font-medium"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Salário, aposentadoria, benefícios
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Receita variável <span className="text-muted-foreground">(opcional)</span>
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={variableIncome ? formatCurrency(variableIncome) : ""}
                      onChange={(e) => handleIncomeChange(e.target.value, setVariableIncome)}
                      placeholder="R$ 0,00"
                      className="text-center text-xl h-14 font-medium"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Freelance, bônus, comissões
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step.id === "problem" && (
              <div className="flex-1 flex flex-col">
                <div className="text-center mb-8">
                  <h1 className="font-serif text-3xl font-semibold mb-2">
                    {step.title}
                  </h1>
                  <p className="text-muted-foreground">{step.subtitle}</p>
                </div>
                <div className="space-y-3">
                  {step.options?.map((option, index) => (
                    <motion.button
                      key={option.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedProblem(option.label)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedProblem === option.label
                          ? "border-primary bg-primary/5 shadow-medium"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <span className="text-3xl">{option.emoji}</span>
                      <span className="font-medium text-left flex-1">
                        {option.label}
                      </span>
                      {selectedProblem === option.label && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {step.id === "connect" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-24 h-24 rounded-full bg-essential/20 flex items-center justify-center mb-6 shadow-large"
                >
                  <MessageCircle className="w-12 h-12 text-essential" />
                </motion.div>
                <h1 className="font-serif text-3xl font-semibold mb-2">
                  {step.title}
                </h1>
                <p className="text-xl text-primary font-medium mb-3">
                  {aiName ? `Conheça ${aiName}!` : step.subtitle}
                </p>
                <p className="text-muted-foreground max-w-xs mb-8">
                  {step.description}
                </p>
                <Button
                  variant="default"
                  size="lg"
                  className="w-full max-w-xs bg-[#25D366] hover:bg-[#20BD5A] text-white gap-2"
                  onClick={openWhatsApp}
                >
                  <MessageCircle className="w-5 h-5" />
                  Abrir WhatsApp
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 text-muted-foreground"
                  onClick={handleNext}
                >
                  Conectar depois
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions */}
      {step.id !== "connect" && (
        <div className="px-6 pb-8 pb-safe-bottom space-y-3">
          <Button
            variant="warm"
            size="lg"
            className="w-full"
            onClick={handleNext}
            disabled={!canProceed() || isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Continuar
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </Button>
          {currentStep < 2 && (
            <Button
              variant="ghost"
              size="lg"
              className="w-full text-muted-foreground"
              onClick={handleSkip}
            >
              Pular introdução
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Onboarding;
