import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, KeyRound } from "lucide-react";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useToast } from "@/hooks/use-toast";
import { FadeIn } from "@/components/ui/motion";
import logoSaldin from "@/assets/logo-saldin-final.png";

interface BiometricLockScreenProps {
  userEmail: string;
  userName?: string;
  onUnlock: () => void;
  onUsePassword: () => void;
}

export function BiometricLockScreen({
  userEmail,
  userName,
  onUnlock,
  onUsePassword
}: BiometricLockScreenProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);
  const { authenticateWithBiometric } = useWebAuthn();
  const { toast } = useToast();

  // Auto-trigger biometric on mount
  useEffect(() => {
    if (!autoTriggered) {
      setAutoTriggered(true);
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoTriggered]);

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);

    const result = await authenticateWithBiometric();

    if (result.success) {
      toast({
        title: "Bem-vindo de volta!",
        description: "Acesso liberado.",
      });
      onUnlock();
    } else {
      toast({
        title: "Falha na autenticação",
        description: "Tente novamente ou use sua senha.",
        variant: "destructive",
      });
    }

    setIsAuthenticating(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <FadeIn>
        <div className="text-center space-y-10 max-w-sm mx-auto relative z-10">
          {/* Logo Container */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse-slow"></div>
            <img src={logoSaldin} alt="Saldin" className="h-20 mx-auto relative z-10" />
          </div>

          {/* User greeting */}
          <div className="space-y-3">
            <h1 className="font-serif text-3xl font-semibold tracking-tight">
              Olá{userName ? `, ${userName.split(" ")[0]}` : " novamente"}!
            </h1>
            <p className="text-muted-foreground">O acesso está bloqueado por segurança.</p>
          </div>

          {/* Biometric button group */}
          <div className="space-y-4 w-full">
            <Button
              size="lg"
              className="w-full h-14 gap-3 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-2xl transition-all active:scale-95"
              onClick={handleBiometricAuth}
              disabled={isAuthenticating}
            >
              <Fingerprint className="w-6 h-6" />
              <span className="text-base font-semibold">
                {isAuthenticating ? "Verificando..." : "Desbloquear com biometria"}
              </span>
            </Button>

            <Button
              variant="ghost"
              className="w-full h-12 gap-2 text-muted-foreground hover:text-primary transition-colors hover:bg-transparent"
              onClick={onUsePassword}
            >
              <KeyRound className="w-4 h-4" />
              Entrar com senha
            </Button>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
