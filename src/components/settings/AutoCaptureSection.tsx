
import { useState, useEffect } from "react";
import { 
  Bell, 
  Smartphone, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Copy, 
  ChevronRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUserDevices, UserDevice } from "@/hooks/useUserDevices";
import { FadeIn } from "@/components/ui/motion";

const INJECT_BASE_URL = "https://vmkhqtuqgvtcapwmxtov.supabase.co/functions/v1/inject-notification";

function detectPlatform(): "android" | "ios" {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "android";
}

interface AutoCaptureSectionProps {
  userId: string | undefined;
}

export function AutoCaptureSection({ userId }: AutoCaptureSectionProps) {
  const { toast } = useToast();
  const { data: devices = [], isLoading, createDevice, deleteDevice } = useUserDevices(userId);
  const [selectedDevice, setSelectedDevice] = useState<UserDevice | null>(null);
  const [activeTab, setActiveTab] = useState<"android" | "ios">(detectPlatform());
  const [currentStep, setCurrentStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Set first device as selected by default if exists
  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) {
      setSelectedDevice(devices[0]);
    }
  }, [devices, selectedDevice]);

  const captureUrl = selectedDevice
    ? `${INJECT_BASE_URL}?t=${selectedDevice.device_token}&n=`
    : null;

  const handleCopyUrl = () => {
    if (captureUrl) {
      navigator.clipboard.writeText(captureUrl);
      setCopied(true);
      toast({ title: "✅ URL copiada!", description: "Agora cole no Automate/MacroDroid." });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleQuickRegister = async () => {
    setIsRegistering(true);
    const deviceName = detectPlatform() === "android" ? "Meu Android" : "Meu iPhone";
    try {
      const newDevice = await createDevice.mutateAsync(deviceName);
      setSelectedDevice(newDevice);
      setCurrentStep(1);
    } catch (err: any) {
      console.error("Erro no registro rápido:", err);
      // O erro já deve ter sido mostrado pelo toast do hook, 
      // mas o catch impede que o erro quebre o fluxo do React
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 flex flex-col items-center justify-center space-y-3">
        <Smartphone className="w-8 h-8 text-muted-foreground animate-pulse" />
        <p className="text-sm text-muted-foreground">Carregando dispositivos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Captura Automática de Gastos
        </h2>
        {devices.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-[10px] gap-1 px-2"
            onClick={() => {
              const name = prompt("Nome do dispositivo:", "Novo Celular");
              if (name) createDevice.mutate(name);
            }}
          >
            <Plus className="w-3 h-3" /> Add Novo
          </Button>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
        {/* Hero Branding */}
        <div className="p-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/20 border-b border-border text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Bell className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="text-base font-bold text-foreground">Gastos registrados sozinhos</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Detectamos a notificação do banco e registramos na hora — sem você abrir o app.
          </p>
        </div>

        {devices.length === 0 ? (
          /* Empty State: Hero Action */
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <Smartphone className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Escala Ilimitada</p>
              <p className="text-xs text-muted-foreground">
                Registre cada celular de onde você recebe notificações financeiras.
              </p>
            </div>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 py-6"
              onClick={handleQuickRegister}
              disabled={isRegistering}
            >
              {isRegistering ? "Configurando..." : "Começar Agora"}
            </Button>
          </div>
        ) : (
          /* Device Selection Tabs */
          <div className="">
            <div className="bg-muted/30 p-2 overflow-x-auto flex gap-2 no-scrollbar border-b border-border">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                    selectedDevice?.id === device.id 
                      ? "bg-background shadow-sm text-primary ring-1 ring-border" 
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  {device.device_name}
                  {selectedDevice?.id === device.id && (
                    <div 
                      className="ml-1 p-0.5 hover:bg-red-50 text-red-500 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        if(confirm("Remover este dispositivo?")) deleteDevice.mutate(device.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Config Tabs */}
            <div className="flex border-b border-border">
              {(["android", "ios"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setCurrentStep(1); }}
                  className={cn(
                    "flex-1 py-3 text-sm font-medium transition-all relative",
                    activeTab === tab
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab === "android" ? "📱 Android" : "🍎 iPhone"}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* Tutorial Content */}
            <div className="p-5 space-y-4">
              {/* Progress bar */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: activeTab === "android" ? 5 : 2 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-all duration-500",
                      i < currentStep ? "bg-emerald-500" : "bg-muted"
                    )}
                  />
                ))}
                <span className="text-[10px] font-bold text-muted-foreground ml-1">
                  {currentStep}/{activeTab === "android" ? 5 : 2}
                </span>
              </div>

              {activeTab === "android" ? (
                /* Android Workflow */
                <div className="space-y-4 min-h-[220px]">
                  {currentStep === 1 && (
                    <FadeIn className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
                        <div className="pt-0.5">
                          <p className="text-sm font-bold text-foreground">Instale o Automate</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            App gratuito projetado para escala. Nosso fluxo personalizado detecta quase todos os bancos.
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="w-full gap-2 border-emerald-200 hover:bg-emerald-50" onClick={() => {
                        window.open("https://play.google.com/store/apps/details?id=com.llamalab.automate", "_blank");
                      }}>
                        <ExternalLink className="w-4 h-4" /> Abrir Play Store
                      </Button>
                      <Button size="sm" className="w-full bg-primary" onClick={() => setCurrentStep(2)}>Entendi, próximo →</Button>
                    </FadeIn>
                  )}

                  {currentStep === 2 && (
                    <FadeIn className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
                        <div className="pt-0.5">
                          <p className="text-sm font-bold text-foreground">Baixe o Flow Saldin</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            O arquivo <strong>.flo</strong> contém toda a lógica de segurança e detecção de bancos.
                          </p>
                        </div>
                      </div>
                      <a 
                        href="/flows/saldin_v5.flo" 
                        download="saldin_v5.flo"
                        className="w-full flex items-center justify-center gap-2 h-9 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={() => {
                          toast({ title: "Iniciando download", description: "O arquivo .flo está sendo baixado." });
                        }}
                      >
                        <Plus className="w-4 h-4" /> Baixar Script (.flo)
                      </a>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setCurrentStep(1)}>← Voltar</Button>
                        <Button size="sm" className="flex-1" onClick={() => setCurrentStep(3)}>Próximo →</Button>
                      </div>
                    </FadeIn>
                  )}

                  {currentStep === 3 && (
                    <FadeIn className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
                        <div className="pt-0.5">
                          <p className="text-sm font-bold text-foreground">Importe no Automate</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            No Automate, toque nos <strong>3 pontinhos (Menu)</strong> → <strong>Import</strong> → Selecione o arquivo baixado.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setCurrentStep(2)}>← Voltar</Button>
                        <Button size="sm" className="flex-1" onClick={() => setCurrentStep(4)}>Próximo →</Button>
                      </div>
                    </FadeIn>
                  )}

                  {currentStep === 4 && (
                    <FadeIn className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">4</div>
                        <div className="pt-0.5">
                          <p className="text-sm font-bold text-foreground">Configure seu Token</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Edite o bloco superior chamado <strong>"CONFIG"</strong> e cole o seu URL/TOKEN abaixo no campo de URL.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="bg-muted p-3 rounded-lg border border-border">
                          <p className="text-[10px] font-mono break-all line-clamp-2 text-muted-foreground">
                            {captureUrl}
                          </p>
                        </div>
                        <Button
                          className="w-full gap-2 h-10 shadow-sm"
                          onClick={handleCopyUrl}
                          variant={copied ? "outline" : "default"}
                          size="sm"
                        >
                          {copied ? (
                            <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Copiado!</>
                          ) : (
                            <><Copy className="w-4 h-4" /> Copiar URL do Token</>
                          )}
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setCurrentStep(3)}>← Voltar</Button>
                        <Button size="sm" className="flex-1" onClick={() => setCurrentStep(5)}>Pronto →</Button>
                      </div>
                    </FadeIn>
                  )}

                  {currentStep === 5 && (
                    <FadeIn className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">✓</div>
                        <div className="pt-0.5">
                          <p className="text-sm font-bold text-foreground">Dê PLAY e divirta-se</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Clique em <strong>START</strong>. A partir de agora, cada notificação de banco vira um gasto no Saldin.
                          </p>
                        </div>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
                        <p className="text-2xl mb-1">🚀</p>
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Configuração Finalizada!</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                          Funciona enquanto o celular estiver ligado.
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => setCurrentStep(1)}>Recomeçar Tutorial</Button>
                    </FadeIn>
                  )}
                </div>
              ) : (
                /* iOS Workflow */
                <div className="space-y-4 min-h-[220px]">
                  {currentStep === 1 && (
                    <FadeIn className="space-y-4">
                      <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <p className="text-[11px] text-blue-800 dark:text-blue-200 leading-relaxed font-medium">
                          No iPhone, usamos o app <strong>Atalhos (Shortcuts)</strong>. Já vem instalado.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">Adicione o Atalho</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Toque no botão e confirme em "Adicionar Atalho".</p>
                          </div>
                        </div>
                      </div>

                      <Button className="w-full gap-2 shadow-lg shadow-primary/10" onClick={() => {
                        window.open("https://www.icloud.com/shortcuts/placeholder", "_blank");
                        toast({ title: "Abrindo Atalhos..." });
                      }}>
                        <ExternalLink className="w-4 h-4" />
                        Instalar Atalho Saldin
                      </Button>

                      <Button size="sm" className="w-full" variant="outline" onClick={() => setCurrentStep(2)}>Já instalei →</Button>
                    </FadeIn>
                  )}

                  {currentStep === 2 && (
                    <FadeIn className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Ative a Automação</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">No app Atalhos, vá em <strong>Automação</strong> → Toque no <strong>➕</strong> → <strong>App</strong> → Selecione seus bancos. Ative a execução do nosso atalho.</p>
                        </div>
                      </div>

                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
                        <p className="text-2xl mb-1">✨</p>
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Pronto para uso!</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">2 toques e está ativo para sempre.</p>
                      </div>

                      <Button size="sm" variant="outline" className="w-full" onClick={() => setCurrentStep(1)}>← Voltar ao início</Button>
                    </FadeIn>
                  )}
                </div>
              )}
            </div>

            {/* Footer: Supported Banks */}
            <div className="bg-muted/10 p-4 border-t border-border mt-auto">
              <p className="text-[10px] text-muted-foreground mb-2 text-center font-bold uppercase tracking-widest">
                Bancos Suportados
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {["Nubank", "Inter", "C6", "Itaú", "Bradesco", "Santander", "Caixa", "Mercado Pago"].map((b) => (
                  <span 
                    key={b} 
                    className="text-[10px] bg-background border border-border text-muted-foreground px-2 py-0.5 rounded shadow-sm"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
