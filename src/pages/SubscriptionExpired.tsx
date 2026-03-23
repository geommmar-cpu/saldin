import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, MessageCircle, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function SubscriptionExpired() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };


  const openSupport = () => {
    // Current support number from the UI (bot number)
    const phone = "556193984169";
    const msg = `Olá, gostaria de regularizar minha assinatura do Saldin (Conta: ${user?.email}).`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="relative mb-8 inline-block">
          <div className="absolute inset-0 bg-destructive/10 blur-3xl rounded-full animate-pulse"></div>
          <div className="relative w-20 h-20 bg-gradient-to-tr from-destructive/80 to-amber-500 rounded-2xl rotate-3 flex items-center justify-center shadow-xl">
            <ShieldAlert className="w-10 h-10 text-white -rotate-3" />
          </div>
        </div>

        <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
          Acesso Restrito
        </h1>
        
        <p className="max-w-[100vw] leading-relaxed text-muted-foreground mb-8 text-lg">
          Parece que sua assinatura do **Saldin Premium** expirou ou o pagamento não foi identificado.
        </p>

        <Card className="p-6 bg-secondary/30 border-none shadow-inner mb-8 text-left">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="max-w-[100vw] leading-relaxed text-sm leading-relaxed text-foreground">
                <strong>O que acontece agora?</strong> Seus dados continuam salvos com segurança, mas o assistente do WhatsApp e os novos registros estão bloqueados até a regularização.
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="max-w-[100vw] leading-relaxed text-sm leading-relaxed text-foreground">
                <strong>Como resolver?</strong> Entre em contato com o suporte via WhatsApp para regularizar o acesso à sua conta.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={openSupport}
            className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg ring-offset-background transition-all hover:scale-[1.02] active:scale-[0.98] gap-2"
          >
            <MessageCircle className="w-5 h-5" /> Falar com Suporte
          </Button>

          <button 
            onClick={handleSignOut}
            className="mt-4 text-sm leading-relaxed text-muted-foreground/60 hover:text-destructive underline underline-offset-4 transition-colors"
          >
            Sair da conta
          </button>
        </div>

        <p className="max-w-[100vw] leading-relaxed text-[10px] text-muted-foreground/40 mt-12 uppercase tracking-widest">
          Saldin &middot; Inteligência Financeira
        </p>
      </motion.div>
    </div>
  );
}
