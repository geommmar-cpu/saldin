
import { useState } from "react";
import { 
  MessageCircle, 
  Smartphone, 
  CheckCircle2, 
  Lock,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/ui/motion";

interface AutoCaptureSectionProps {
  userId: string | undefined;
}

export function AutoCaptureSection({ userId }: AutoCaptureSectionProps) {
  const { toast } = useToast();
  
  const openWhatsApp = () => {
    // Substitua pelo número real do seu bot
    window.open("https://wa.me/556193984169", "_blank");
    toast({ 
      title: "Abrindo WhatsApp...", 
      description: "Mande um 'Oi' para seu assistente." 
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Saldin AI Assistente
        </h2>
        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
          CONECTADO
        </span>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        {/* WhatsApp Card */}
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto shadow-inner">
            <MessageCircle className="w-8 h-8 text-[#25D366]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Saldin no seu WhatsApp</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fale com o {process.env.NEXT_PUBLIC_AI_NAME || 'Saldin'} por texto, áudio ou envie fotos de recibos. Sua IA financeira extrai tudo na hora.
            </p>
          </div>
          
          <Button 
            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white shadow-lg shadow-[#25D366]/20 py-6 text-sm font-bold gap-2"
            onClick={openWhatsApp}
          >
            <MessageCircle className="w-5 h-5" />
            Começar a Usar Agora
          </Button>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-medium text-muted-foreground">Registros por Áudio</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-medium text-muted-foreground">Scanner de Recibo</span>
            </div>
          </div>
        </div>

        {/* Premium Teaser */}
        <div className="bg-muted/30 p-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-foreground flex items-center gap-1">
                Captura Automática (Bancos)
                <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.25 rounded-full">PREMIUM</span>
              </p>
              <p className="text-[10px] text-muted-foreground">Registra notificações do banco sozinho.</p>
            </div>
          </div>
          <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-3">
        <Smartphone className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-blue-900 dark:text-blue-300">Como funciona?</p>
          <p className="text-[11px] text-blue-800/70 dark:text-blue-400/70 leading-relaxed">
            Mande um "Oi" pro Saldin. Você pode enviar mensagens de texto, áudios descrevendo o gasto ou até fotos de recibos. A IA processa tudo automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
